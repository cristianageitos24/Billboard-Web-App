'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';
import type { OrgBillboardWithBoard } from '@/types/org-billboard';
import type { OrgMonthlyMetric } from '@/types/org-monthly-metric';

type StatusFilter = 'all' | 'active' | 'inactive';

function formatCost(ob: OrgBillboardWithBoard): string {
  if (ob.monthly_cost == null) return '—';
  return typeof ob.monthly_cost === 'number'
    ? `$${ob.monthly_cost.toFixed(2)}`
    : `$${String(ob.monthly_cost)}`;
}

/** Format month string (YYYY-MM-DD) as "March 2025" for display. */
function formatMonth(month: string): string {
  const d = new Date(month + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return month;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Format revenue with $ and thousands separators. */
function formatRevenue(value: number | string | null): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Validate numeric field: non-negative integer (leads, signed_cases). */
function validateNonNegativeInt(value: string): string | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return 'Enter a valid number';
  if (n < 0) return 'Must be 0 or greater';
  if (!Number.isInteger(n)) return 'Must be a whole number';
  return null;
}

/** Validate numeric field: non-negative number (revenue). */
function validateNonNegativeNumber(value: string): string | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return 'Enter a valid number';
  if (n < 0) return 'Must be 0 or greater';
  return null;
}

function BoardCard({
  ob,
  isCustom,
  togglingId,
  editingId,
  onToggle,
  onEdit,
  onConfirmInactive,
  onMetrics,
}: {
  ob: OrgBillboardWithBoard;
  isCustom: boolean;
  togglingId: string | null;
  editingId: string | null;
  onToggle: (ob: OrgBillboardWithBoard) => void;
  onEdit: (ob: OrgBillboardWithBoard) => void;
  onConfirmInactive: (ob: OrgBillboardWithBoard) => void;
  onMetrics: (ob: OrgBillboardWithBoard) => void;
}) {
  const b = ob.billboards;
  const name = ob.custom_name ?? b?.name ?? '—';
  const location = ob.custom_address ?? b?.address ?? '—';
  const boardType = b?.board_type ?? '—';
  const trafficTier = b?.traffic_tier ?? '—';
  const priceTier = b?.price_tier ?? '—';
  const cost = formatCost(ob);
  const isToggling = togglingId === ob.id;

  return (
    <li className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-neutral-900">{name}</p>
            {isCustom && (
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Custom
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-600">{location}</p>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-sm text-neutral-500 mt-2">
            <div>
              <dt className="sr-only">Monthly cost</dt>
              <dd>{cost}</dd>
            </div>
            {!isCustom && (
              <>
                <div>
                  <dt className="sr-only">Board type</dt>
                  <dd className="capitalize">{boardType}</dd>
                </div>
                <div>
                  <dt className="sr-only">Traffic tier</dt>
                  <dd className="capitalize">{trafficTier}</dd>
                </div>
                <div>
                  <dt className="sr-only">Price tier</dt>
                  <dd>{priceTier}</dd>
                </div>
              </>
            )}
          </dl>
          {ob.notes && (
            <p className="text-sm text-neutral-500 mt-2 italic">{ob.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <span
            className={`text-xs font-medium px-2 py-1 rounded ${
              ob.is_active ? 'bg-green-100 text-green-800' : 'bg-neutral-200 text-neutral-600'
            }`}
          >
            {ob.is_active ? 'Active' : 'Inactive'}
          </span>
          <button
            type="button"
            onClick={() => onMetrics(ob)}
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900 underline"
          >
            Metrics
          </button>
          <button
            type="button"
            onClick={() => onEdit(ob)}
            disabled={editingId !== null}
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900 underline disabled:opacity-50"
          >
            Edit
          </button>
          {ob.is_active ? (
            <button
              type="button"
              onClick={() => onConfirmInactive(ob)}
              disabled={isToggling}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 underline disabled:opacity-50"
            >
              Mark inactive
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onToggle(ob)}
              disabled={isToggling}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 underline disabled:opacity-50"
            >
              {isToggling ? '…' : 'Mark active'}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function SkeletonCard() {
  return (
    <li className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="h-5 bg-neutral-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-neutral-100 rounded w-1/2 mb-3" />
      <div className="flex gap-4">
        <div className="h-4 bg-neutral-100 rounded w-16" />
        <div className="h-4 bg-neutral-100 rounded w-16" />
        <div className="h-4 bg-neutral-100 rounded w-16" />
      </div>
    </li>
  );
}

export default function MyBoardsPage() {
  const { user, loading: userLoading } = useUser();
  const [orgBillboards, setOrgBillboards] = useState<OrgBillboardWithBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    monthly_cost: string;
    notes: string;
    custom_name: string;
    custom_address: string;
  }>({ monthly_cost: '', notes: '', custom_name: '', custom_address: '' });
  const [addCustomOpen, setAddCustomOpen] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [addCustomError, setAddCustomError] = useState<string | null>(null);
  const [addCustomForm, setAddCustomForm] = useState({
    custom_name: '',
    custom_address: '',
    monthly_cost: '',
    notes: '',
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [confirmInactiveId, setConfirmInactiveId] = useState<string | null>(null);

  const [metricsBoardId, setMetricsBoardId] = useState<string | null>(null);
  const [metricsBoard, setMetricsBoard] = useState<OrgBillboardWithBoard | null>(null);
  const [metricsList, setMetricsList] = useState<OrgMonthlyMetric[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [addMetricForm, setAddMetricForm] = useState({
    month: '',
    leads: '',
    signed_cases: '',
    revenue: '',
  });
  const [addMetricSubmitting, setAddMetricSubmitting] = useState(false);
  const [addMetricError, setAddMetricError] = useState<string | null>(null);
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [editMetricForm, setEditMetricForm] = useState({
    month: '',
    leads: '',
    signed_cases: '',
    revenue: '',
  });
  const [saveMetricSubmitting, setSaveMetricSubmitting] = useState(false);
  const [metricFieldErrors, setMetricFieldErrors] = useState<{
    leads?: string;
    signed_cases?: string;
    revenue?: string;
  }>({});
  const [confirmDeleteMetricId, setConfirmDeleteMetricId] = useState<string | null>(null);
  const [deletingMetricId, setDeletingMetricId] = useState<string | null>(null);

  const fetchBoards = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/org-billboards?active=false')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load boards');
        return res.json();
      })
      .then((data: { orgBillboards: OrgBillboardWithBoard[] }) => {
        setOrgBillboards(data.orgBillboards ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load boards'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchBoards();
  }, [user, fetchBoards]);

  useEffect(() => {
    if (userLoading || user) return;
    window.location.href = `/login?next=${encodeURIComponent('/my-boards')}`;
  }, [userLoading, user]);

  const filtered = useMemo(() => {
    if (statusFilter === 'active') return orgBillboards.filter((ob) => ob.is_active);
    if (statusFilter === 'inactive') return orgBillboards.filter((ob) => !ob.is_active);
    return orgBillboards;
  }, [orgBillboards, statusFilter]);

  const fromInventory = useMemo(
    () => filtered.filter((ob) => ob.billboard_id != null),
    [filtered]
  );
  const customBoards = useMemo(
    () => filtered.filter((ob) => ob.billboard_id == null),
    [filtered]
  );

  async function handleToggleActive(ob: OrgBillboardWithBoard) {
    if (togglingId) return;
    setTogglingId(ob.id);
    try {
      const res = await fetch(`/api/org-billboards/${ob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !ob.is_active }),
      });
      if (res.ok) {
        setConfirmInactiveId(null);
        fetchBoards();
      }
    } finally {
      setTogglingId(null);
    }
  }

  function openEdit(ob: OrgBillboardWithBoard) {
    setEditingId(ob.id);
    setEditForm({
      monthly_cost: ob.monthly_cost != null ? String(ob.monthly_cost) : '',
      notes: ob.notes ?? '',
      custom_name: ob.custom_name ?? '',
      custom_address: ob.custom_address ?? '',
    });
  }

  async function handleEditSave(ob: OrgBillboardWithBoard) {
    const payload: Record<string, unknown> = {};
    if (ob.billboard_id == null) {
      const name = editForm.custom_name.trim();
      if (!name) return;
      payload.custom_name = name;
      payload.custom_address = editForm.custom_address.trim() || null;
    }
    payload.monthly_cost =
      editForm.monthly_cost.trim() === '' ? null : Number(editForm.monthly_cost);
    if (Number.isNaN(payload.monthly_cost as number)) payload.monthly_cost = null;
    payload.notes = editForm.notes.trim() || null;

    const res = await fetch(`/api/org-billboards/${ob.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setEditingId(null);
      fetchBoards();
    } else {
      const data = await res.json().catch(() => ({}));
      console.error(data.error ?? 'Update failed');
    }
  }

  function openMetrics(ob: OrgBillboardWithBoard) {
    setMetricsBoardId(ob.id);
    setMetricsBoard(ob);
    setMetricsList([]);
    setMetricsError(null);
    setAddMetricError(null);
    setEditingMetricId(null);
    setConfirmDeleteMetricId(null);
    setMetricFieldErrors({});
    setAddMetricForm({ month: '', leads: '', signed_cases: '', revenue: '' });
    setMetricsLoading(true);
    fetch(`/api/org-billboards/${ob.id}/metrics`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load metrics'))))
      .then((data: { metrics: OrgMonthlyMetric[] }) => setMetricsList(data.metrics ?? []))
      .catch(() => setMetricsError('Could not load metrics.'))
      .finally(() => setMetricsLoading(false));
  }

  function closeMetrics() {
    setMetricsBoardId(null);
    setMetricsBoard(null);
    setMetricsList([]);
    setMetricsError(null);
    setAddMetricError(null);
    setEditingMetricId(null);
    setConfirmDeleteMetricId(null);
    setMetricFieldErrors({});
  }

  function refetchMetrics() {
    if (!metricsBoardId) return;
    setMetricsLoading(true);
    fetch(`/api/org-billboards/${metricsBoardId}/metrics`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load metrics'))))
      .then((data: { metrics: OrgMonthlyMetric[] }) => setMetricsList(data.metrics ?? []))
      .catch(() => setMetricsError('Could not load metrics.'))
      .finally(() => setMetricsLoading(false));
  }

  async function handleAddMetric(e: React.FormEvent) {
    e.preventDefault();
    if (!metricsBoardId) return;
    const monthTrim = addMetricForm.month.trim();
    if (!monthTrim) {
      setAddMetricError('Month is required.');
      return;
    }
    const leadsErr = validateNonNegativeInt(addMetricForm.leads);
    const signedErr = validateNonNegativeInt(addMetricForm.signed_cases);
    const revenueErr = validateNonNegativeNumber(addMetricForm.revenue);
    setMetricFieldErrors({ leads: leadsErr ?? undefined, signed_cases: signedErr ?? undefined, revenue: revenueErr ?? undefined });
    if (leadsErr || signedErr || revenueErr) return;
    setAddMetricError(null);
    setAddMetricSubmitting(true);
    try {
      const res = await fetch(`/api/org-billboards/${metricsBoardId}/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: monthTrim,
          leads: addMetricForm.leads.trim() === '' ? null : Number(addMetricForm.leads),
          signed_cases: addMetricForm.signed_cases.trim() === '' ? null : Number(addMetricForm.signed_cases),
          revenue: addMetricForm.revenue.trim() === '' ? null : Number(addMetricForm.revenue),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAddMetricForm({ month: '', leads: '', signed_cases: '', revenue: '' });
        setMetricFieldErrors({});
        refetchMetrics();
      } else {
        setAddMetricError(data.error ?? 'Failed to add metrics.');
      }
    } finally {
      setAddMetricSubmitting(false);
    }
  }

  function openEditMetric(m: OrgMonthlyMetric) {
    setMetricFieldErrors({});
    setEditingMetricId(m.id);
    setEditMetricForm({
      month: m.month.slice(0, 7),
      leads: m.leads != null ? String(m.leads) : '',
      signed_cases: m.signed_cases != null ? String(m.signed_cases) : '',
      revenue: m.revenue != null ? String(m.revenue) : '',
    });
  }

  async function handleSaveEditMetric(e: React.FormEvent) {
    e.preventDefault();
    if (!metricsBoardId || !editingMetricId) return;
    const monthTrim = editMetricForm.month.trim();
    if (!monthTrim) return;
    const leadsErr = validateNonNegativeInt(editMetricForm.leads);
    const signedErr = validateNonNegativeInt(editMetricForm.signed_cases);
    const revenueErr = validateNonNegativeNumber(editMetricForm.revenue);
    setMetricFieldErrors({ leads: leadsErr ?? undefined, signed_cases: signedErr ?? undefined, revenue: revenueErr ?? undefined });
    if (leadsErr || signedErr || revenueErr) return;
    setSaveMetricSubmitting(true);
    try {
      const res = await fetch(
        `/api/org-billboards/${metricsBoardId}/metrics/${editingMetricId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            month: monthTrim,
            leads: editMetricForm.leads.trim() === '' ? null : Number(editMetricForm.leads),
            signed_cases: editMetricForm.signed_cases.trim() === '' ? null : Number(editMetricForm.signed_cases),
            revenue: editMetricForm.revenue.trim() === '' ? null : Number(editMetricForm.revenue),
          }),
        }
      );
      if (res.ok) {
        setEditingMetricId(null);
        setMetricFieldErrors({});
        refetchMetrics();
      } else {
        const data = await res.json().catch(() => ({}));
        setAddMetricError(data.error ?? 'Failed to update.');
      }
    } finally {
      setSaveMetricSubmitting(false);
    }
  }

  async function handleDeleteMetric(metricId: string) {
    if (!metricsBoardId || deletingMetricId) return;
    setDeletingMetricId(metricId);
    try {
      const res = await fetch(
        `/api/org-billboards/${metricsBoardId}/metrics/${metricId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setConfirmDeleteMetricId(null);
        refetchMetrics();
      } else {
        const data = await res.json().catch(() => ({}));
        setAddMetricError(data.error ?? 'Failed to delete.');
      }
    } finally {
      setDeletingMetricId(null);
    }
  }

  async function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    const name = addCustomForm.custom_name.trim();
    if (!name) {
      setAddCustomError('Name is required.');
      return;
    }
    setAddCustomError(null);
    setAddingCustom(true);
    try {
      const res = await fetch('/api/org-billboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_name: name,
          custom_address: addCustomForm.custom_address.trim() || null,
          monthly_cost:
            addCustomForm.monthly_cost.trim() === ''
              ? null
              : Number(addCustomForm.monthly_cost),
          notes: addCustomForm.notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddCustomError(data.error ?? 'Failed to add board.');
        setAddingCustom(false);
        return;
      }
      setAddCustomOpen(false);
      setAddCustomForm({ custom_name: '', custom_address: '', monthly_cost: '', notes: '' });
      fetchBoards();
    } finally {
      setAddingCustom(false);
    }
  }

  if (userLoading || !user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-neutral-600 hover:text-neutral-900 underline">
              ← Back to Dashboard
            </Link>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">My Boards</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Boards you&apos;re tracking and the metrics that feed your ROI dashboard.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAddCustomOpen(true);
              setAddCustomError(null);
            }}
            className="shrink-0 py-2 px-4 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
          >
            Add custom board
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-4xl w-full mx-auto">
        {loading && (
          <div className="space-y-3">
            <p className="text-sm text-neutral-500 mb-2">Loading your boards…</p>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800" role="alert">
              We couldn&apos;t load your boards. {error}
            </p>
            <button
              type="button"
              onClick={() => fetchBoards()}
              className="mt-3 py-2 px-3 rounded-md bg-red-100 text-red-800 text-sm font-medium hover:bg-red-200"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && orgBillboards.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-10 text-center">
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">No boards yet</h2>
            <p className="text-neutral-600 mb-6 max-w-sm mx-auto">
              Add boards from inventory or add a custom board to start tracking performance.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/inventory"
                className="inline-block py-2 px-4 rounded-md border border-neutral-300 bg-white text-neutral-800 text-sm font-medium hover:bg-neutral-50"
              >
                Browse inventory
              </Link>
              <button
                type="button"
                onClick={() => setAddCustomOpen(true)}
                className="inline-block py-2 px-4 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
              >
                Add custom board
              </button>
            </div>
          </div>
        )}

        {!loading && !error && orgBillboards.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-neutral-600">Show:</span>
              <div className="flex rounded-md border border-neutral-300 overflow-hidden">
                {(['all', 'active', 'inactive'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1.5 text-sm font-medium ${
                      statusFilter === f
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'active' ? 'Active only' : 'Inactive only'}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 && (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
                <p className="text-neutral-600">
                  {statusFilter === 'active'
                    ? 'No active boards.'
                    : 'No inactive boards.'}
                </p>
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className="mt-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 underline"
                >
                  Show all
                </button>
              </div>
            )}

            {filtered.length > 0 && (
              <>
                <section className="mb-8">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                    From map inventory
                  </h2>
                  {fromInventory.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-6 text-center">
                      <p className="text-sm text-neutral-500">No boards from inventory.</p>
                      <Link
                        href="/inventory"
                        className="mt-2 inline-block text-sm font-medium text-neutral-700 hover:text-neutral-900 underline"
                      >
                        Browse inventory
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {fromInventory.map((ob) => (
                        <BoardCard
                          key={ob.id}
                          ob={ob}
                          isCustom={false}
                          togglingId={togglingId}
                          editingId={editingId}
                          onToggle={handleToggleActive}
                          onEdit={openEdit}
                          onConfirmInactive={(ob) => setConfirmInactiveId(ob.id)}
                          onMetrics={openMetrics}
                        />
                      ))}
                    </ul>
                  )}
                </section>

                <section>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">
                    Custom boards
                  </h2>
                  {customBoards.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-6 text-center">
                      <p className="text-sm text-neutral-500">No custom boards yet.</p>
                      <button
                        type="button"
                        onClick={() => setAddCustomOpen(true)}
                        className="mt-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 underline"
                      >
                        Add custom board
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {customBoards.map((ob) => (
                        <BoardCard
                          key={ob.id}
                          ob={ob}
                          isCustom
                          togglingId={togglingId}
                          editingId={editingId}
                          onToggle={handleToggleActive}
                          onEdit={openEdit}
                          onConfirmInactive={(ob) => setConfirmInactiveId(ob.id)}
                          onMetrics={openMetrics}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>

      {/* Edit modal */}
      {editingId && (() => {
        const ob = orgBillboards.find((o) => o.id === editingId);
        if (!ob) return null;
        const isCustom = ob.billboard_id == null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            aria-modal="true"
            role="dialog"
            aria-labelledby="edit-modal-title"
          >
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
              <h3 id="edit-modal-title" className="text-lg font-semibold text-neutral-900 mb-3">
                Edit board
              </h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditSave(ob);
                }}
                className="space-y-3"
              >
                {isCustom && (
                  <>
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-medium text-neutral-700 mb-1">
                        Name
                      </label>
                      <input
                        id="edit-name"
                        type="text"
                        value={editForm.custom_name}
                        onChange={(e) => setEditForm((f) => ({ ...f, custom_name: e.target.value }))}
                        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="edit-address" className="block text-sm font-medium text-neutral-700 mb-1">
                        Address
                      </label>
                      <input
                        id="edit-address"
                        type="text"
                        value={editForm.custom_address}
                        onChange={(e) => setEditForm((f) => ({ ...f, custom_address: e.target.value }))}
                        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label htmlFor="edit-cost" className="block text-sm font-medium text-neutral-700 mb-1">
                    Monthly cost (optional)
                  </label>
                  <input
                    id="edit-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.monthly_cost}
                    onChange={(e) => setEditForm((f) => ({ ...f, monthly_cost: e.target.value }))}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-notes" className="block text-sm font-medium text-neutral-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    id="edit-notes"
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="py-2 px-3 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-3 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Add custom board modal */}
      {addCustomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          aria-modal="true"
          role="dialog"
          aria-labelledby="add-custom-title"
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
            <h3 id="add-custom-title" className="text-lg font-semibold text-neutral-900 mb-3">
              Add custom board
            </h3>
            <p className="text-sm text-neutral-500 mb-3">
              Add a board that isn&apos;t in our map inventory.
            </p>
            <form onSubmit={handleAddCustom} className="space-y-3">
              <div>
                <label htmlFor="add-name" className="block text-sm font-medium text-neutral-700 mb-1">
                  Name (required)
                </label>
                <input
                  id="add-name"
                  type="text"
                  value={addCustomForm.custom_name}
                  onChange={(e) => setAddCustomForm((f) => ({ ...f, custom_name: e.target.value }))}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="e.g. Main St & 5th"
                />
              </div>
              <div>
                <label htmlFor="add-address" className="block text-sm font-medium text-neutral-700 mb-1">
                  Address (optional)
                </label>
                <input
                  id="add-address"
                  type="text"
                  value={addCustomForm.custom_address}
                  onChange={(e) => setAddCustomForm((f) => ({ ...f, custom_address: e.target.value }))}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="City, state"
                />
              </div>
              <div>
                <label htmlFor="add-cost" className="block text-sm font-medium text-neutral-700 mb-1">
                  Monthly cost (optional)
                </label>
                <input
                  id="add-cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={addCustomForm.monthly_cost}
                  onChange={(e) => setAddCustomForm((f) => ({ ...f, monthly_cost: e.target.value }))}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="add-notes" className="block text-sm font-medium text-neutral-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  id="add-notes"
                  rows={2}
                  value={addCustomForm.notes}
                  onChange={(e) => setAddCustomForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm resize-none"
                  placeholder="Vendor, renewal date…"
                />
              </div>
              {addCustomError && (
                <p className="text-sm text-red-600" role="alert">{addCustomError}</p>
              )}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAddCustomOpen(false);
                    setAddCustomError(null);
                  }}
                  className="py-2 px-3 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCustom}
                  className="py-2 px-3 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-70"
                >
                  {addingCustom ? 'Adding…' : 'Add custom board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Metrics drawer modal */}
      {metricsBoardId && metricsBoard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          aria-modal="true"
          role="dialog"
          aria-labelledby="metrics-modal-title"
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between gap-2 shrink-0">
              <div>
                <h3 id="metrics-modal-title" className="text-lg font-semibold text-neutral-900">
                  {metricsBoard.custom_name ?? metricsBoard.billboards?.name ?? 'Board'}
                </h3>
                <p className="text-sm text-neutral-500 mt-0.5">Monthly performance</p>
              </div>
              <button
                type="button"
                onClick={closeMetrics}
                className="p-2 rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 min-h-0">
              {metricsLoading && metricsList.length === 0 ? (
                <p className="text-sm text-neutral-500">Loading metrics…</p>
              ) : metricsError ? (
                <p className="text-sm text-red-600" role="alert">{metricsError}</p>
              ) : (
                <>
                  {metricsList.length > 0 && (
                    <div className="mb-4 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="font-medium text-neutral-700">
                          {metricsList.length} {metricsList.length === 1 ? 'month' : 'months'} recorded
                        </span>
                        <span className="text-neutral-600">
                          Total revenue:{' '}
                          <span className="font-medium tabular-nums text-neutral-900">
                            {formatRevenue(
                              metricsList.reduce((sum, m) => {
                                const v = m.revenue;
                                const n = typeof v === 'number' ? v : Number(v);
                                return sum + (Number.isNaN(n) ? 0 : n);
                              }, 0)
                            )}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}

                  {metricsList.length === 0 && !editingMetricId ? (
                    <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 p-8 text-center mb-4">
                      <p className="text-neutral-700 font-medium mb-1">No metrics yet</p>
                      <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                        Add your first month to track leads, signed cases, and revenue for this board. You can edit or remove entries anytime.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b-2 border-neutral-200">
                            <th className="text-left py-3 pr-4 font-semibold text-neutral-700">Month</th>
                            <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">Leads</th>
                            <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">Signed cases</th>
                            <th className="text-right py-3 px-3 font-semibold text-neutral-700 tabular-nums">Revenue</th>
                            <th className="w-24 py-3 pl-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {metricsList.map((m) =>
                            editingMetricId === m.id ? (
                              <tr key={m.id} className="border-b border-neutral-100 bg-neutral-50">
                                <td colSpan={5} className="py-3 pr-4">
                                  <form onSubmit={handleSaveEditMetric} className="flex flex-wrap items-end gap-2">
                                    <div>
                                      <label className="sr-only">Month</label>
                                      <input
                                        type="month"
                                        value={editMetricForm.month}
                                        onChange={(e) => setEditMetricForm((f) => ({ ...f, month: e.target.value }))}
                                        className="rounded border border-neutral-300 px-2 py-1.5 text-sm w-32"
                                        required
                                      />
                                    </div>
                                    <div>
                                      <label className="sr-only">Leads</label>
                                      <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={editMetricForm.leads}
                                        onChange={(e) => setEditMetricForm((f) => ({ ...f, leads: e.target.value }))}
                                        placeholder="Leads"
                                        className={`rounded border px-2 py-1.5 text-sm w-20 ${metricFieldErrors.leads ? 'border-red-400' : 'border-neutral-300'}`}
                                      />
                                      {metricFieldErrors.leads && (
                                        <p className="text-xs text-red-600 mt-0.5">{metricFieldErrors.leads}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="sr-only">Signed cases</label>
                                      <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={editMetricForm.signed_cases}
                                        onChange={(e) => setEditMetricForm((f) => ({ ...f, signed_cases: e.target.value }))}
                                        placeholder="Signed"
                                        className={`rounded border px-2 py-1.5 text-sm w-20 ${metricFieldErrors.signed_cases ? 'border-red-400' : 'border-neutral-300'}`}
                                      />
                                      {metricFieldErrors.signed_cases && (
                                        <p className="text-xs text-red-600 mt-0.5">{metricFieldErrors.signed_cases}</p>
                                      )}
                                    </div>
                                    <div>
                                      <label className="sr-only">Revenue</label>
                                      <input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={editMetricForm.revenue}
                                        onChange={(e) => setEditMetricForm((f) => ({ ...f, revenue: e.target.value }))}
                                        placeholder="Revenue"
                                        className={`rounded border px-2 py-1.5 text-sm w-24 ${metricFieldErrors.revenue ? 'border-red-400' : 'border-neutral-300'}`}
                                      />
                                      {metricFieldErrors.revenue && (
                                        <p className="text-xs text-red-600 mt-0.5">{metricFieldErrors.revenue}</p>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setEditingMetricId(null)}
                                      className="py-1.5 px-2 text-sm text-neutral-600 hover:text-neutral-900"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={saveMetricSubmitting}
                                      className="py-1.5 px-2 rounded bg-neutral-900 text-white text-sm font-medium disabled:opacity-70"
                                    >
                                      {saveMetricSubmitting ? 'Saving…' : 'Save'}
                                    </button>
                                  </form>
                                </td>
                              </tr>
                            ) : (
                              <tr key={m.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                                <td className="py-3 pr-4 font-medium text-neutral-900">{formatMonth(m.month)}</td>
                                <td className="text-right py-3 px-3 tabular-nums text-neutral-700">{m.leads ?? '—'}</td>
                                <td className="text-right py-3 px-3 tabular-nums text-neutral-700">{m.signed_cases ?? '—'}</td>
                                <td className="text-right py-3 px-3 tabular-nums font-medium text-neutral-900">{formatRevenue(m.revenue)}</td>
                                <td className="py-3 pl-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openEditMetric(m)}
                                      className="text-sm font-medium text-neutral-600 hover:text-neutral-900 underline"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteMetricId(m.id)}
                                      className="text-sm font-medium text-red-600 hover:text-red-700 underline"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!editingMetricId && (
                    <div className="border-t border-neutral-200 pt-4">
                      <p className="text-sm font-semibold text-neutral-700 mb-3">Add month</p>
                      <form onSubmit={handleAddMetric} className="space-y-3">
                        <div className="flex flex-wrap items-start gap-3 gap-y-2">
                          <div>
                            <label htmlFor="metric-month" className="block text-xs font-medium text-neutral-500 mb-0.5">Month</label>
                            <input
                              id="metric-month"
                              type="month"
                              value={addMetricForm.month}
                              onChange={(e) => setAddMetricForm((f) => ({ ...f, month: e.target.value }))}
                              className="rounded border border-neutral-300 px-2 py-1.5 text-sm w-36"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="metric-leads" className="block text-xs font-medium text-neutral-500 mb-0.5">Leads</label>
                            <input
                              id="metric-leads"
                              type="number"
                              min={0}
                              step={1}
                              value={addMetricForm.leads}
                              onChange={(e) => setAddMetricForm((f) => ({ ...f, leads: e.target.value }))}
                              placeholder="0"
                              className={`rounded border px-2 py-1.5 text-sm w-24 tabular-nums ${metricFieldErrors.leads ? 'border-red-400' : 'border-neutral-300'}`}
                            />
                            {metricFieldErrors.leads && (
                              <p className="text-xs text-red-600 mt-0.5">{metricFieldErrors.leads}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="metric-signed" className="block text-xs font-medium text-neutral-500 mb-0.5">Signed cases</label>
                            <input
                              id="metric-signed"
                              type="number"
                              min={0}
                              step={1}
                              value={addMetricForm.signed_cases}
                              onChange={(e) => setAddMetricForm((f) => ({ ...f, signed_cases: e.target.value }))}
                              placeholder="0"
                              className={`rounded border px-2 py-1.5 text-sm w-24 tabular-nums ${metricFieldErrors.signed_cases ? 'border-red-400' : 'border-neutral-300'}`}
                            />
                            {metricFieldErrors.signed_cases && (
                              <p className="text-xs text-red-600 mt-0.5">{metricFieldErrors.signed_cases}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="metric-revenue" className="block text-xs font-medium text-neutral-500 mb-0.5">Revenue</label>
                            <input
                              id="metric-revenue"
                              type="number"
                              min={0}
                              step={0.01}
                              value={addMetricForm.revenue}
                              onChange={(e) => setAddMetricForm((f) => ({ ...f, revenue: e.target.value }))}
                              placeholder="0.00"
                              className={`rounded border px-2 py-1.5 text-sm w-28 tabular-nums ${metricFieldErrors.revenue ? 'border-red-400' : 'border-neutral-300'}`}
                            />
                            {metricFieldErrors.revenue && (
                              <p className="text-xs text-red-600 mt-0.5">{metricFieldErrors.revenue}</p>
                            )}
                          </div>
                          <div className="flex items-end">
                            <button
                              type="submit"
                              disabled={addMetricSubmitting}
                              className="py-1.5 px-3 rounded bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-70"
                            >
                              {addMetricSubmitting ? 'Adding…' : 'Add month'}
                            </button>
                          </div>
                        </div>
                        {addMetricError && (
                          <p className="text-sm text-red-600" role="alert">{addMetricError}</p>
                        )}
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete metric */}
      {confirmDeleteMetricId && metricsBoardId && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          aria-modal="true"
          role="dialog"
          aria-labelledby="confirm-delete-metric-title"
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-4">
            <h3 id="confirm-delete-metric-title" className="text-lg font-semibold text-neutral-900 mb-2">
              Delete this month&apos;s metrics?
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              This will permanently remove this record. You can add a new entry for that month later if needed.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDeleteMetricId(null)}
                className="py-2 px-3 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMetric(confirmDeleteMetricId)}
                disabled={deletingMetricId === confirmDeleteMetricId}
                className="py-2 px-3 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-70"
              >
                {deletingMetricId === confirmDeleteMetricId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm mark inactive */}
      {confirmInactiveId && (() => {
        const ob = orgBillboards.find((o) => o.id === confirmInactiveId);
        if (!ob) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            aria-modal="true"
            role="dialog"
            aria-labelledby="confirm-inactive-title"
          >
            <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-4">
              <h3 id="confirm-inactive-title" className="text-lg font-semibold text-neutral-900 mb-2">
                Mark as inactive?
              </h3>
              <p className="text-sm text-neutral-600 mb-4">
                This board will be marked inactive. You can mark it active again anytime.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmInactiveId(null)}
                  className="py-2 px-3 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(ob)}
                  disabled={togglingId === ob.id}
                  className="py-2 px-3 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-70"
                >
                  {togglingId === ob.id ? '…' : 'Mark inactive'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
