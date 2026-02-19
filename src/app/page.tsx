'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import HoustonMap from '@/components/HoustonMap';
import BillboardDetailPanel from '@/components/BillboardDetailPanel';
import BillboardList from '@/components/BillboardList';
import FilterBar, { DEFAULT_FILTERS, type FilterState } from '@/components/FilterBar';
import type { BillboardListItem } from '@/types/billboard';

const MAP_LIMIT = 2500;

function buildBillboardsUrl(filters: FilterState): string {
  const params = new URLSearchParams();
  params.set('limit', String(MAP_LIMIT));
  if (filters.boardType) params.set('board_type', filters.boardType);
  if (filters.trafficTier) params.set('traffic_tier', filters.trafficTier);
  if (filters.priceTier) params.set('price_tier', filters.priceTier);
  return `/api/billboards?${params.toString()}`;
}

function sortBillboards(billboards: BillboardListItem[], sort: FilterState['sort']): BillboardListItem[] {
  if (billboards.length === 0) return billboards;
  const copy = [...billboards];
  if (sort === 'name_asc') {
    copy.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  } else if (sort === 'price_tier_asc') {
    const order = ['$', '$$', '$$$', '$$$$'];
    copy.sort((a, b) => order.indexOf(a.price_tier) - order.indexOf(b.price_tier));
  }
  return copy;
}

export default function Home() {
  const [billboards, setBillboards] = useState<BillboardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBillboard, setSelectedBillboard] = useState<BillboardListItem | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [focusBillboard, setFocusBillboard] = useState<BillboardListItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(buildBillboardsUrl(filters))
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: { billboards: BillboardListItem[] }) => {
        if (!cancelled) setBillboards(data.billboards ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load billboards');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
  }, [filters.boardType, filters.trafficTier, filters.priceTier]);

  const sortedBillboards = useMemo(
    () => sortBillboards(billboards, filters.sort),
    [billboards, filters.sort]
  );

  const handleSelectBillboard = useCallback((b: BillboardListItem) => {
    setSelectedBillboard(b);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedBillboard(null);
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="shrink-0 border-b border-neutral-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-neutral-900">Houston Billboard Finder</h1>
          <nav className="flex items-center gap-6 text-sm text-neutral-600" aria-label="Main">
            <a href="#" className="hover:text-neutral-900">Products</a>
            <a href="#" className="hover:text-neutral-900">Resources</a>
            <a href="#" className="hover:text-neutral-900">Log in</a>
            <a
              href="#"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get started
            </a>
          </nav>
        </div>
      </header>

      <FilterBar value={filters} onChange={setFilters} />

      <div className="shrink-0 border-b border-neutral-200 bg-white px-4 py-2">
        {loading && (
          <p className="text-sm text-neutral-500">Loading billboards…</p>
        )}
        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
        {!loading && !error && (
          <p className="text-sm text-neutral-600">
            {sortedBillboards.length} location{sortedBillboards.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div className="flex-1 flex min-h-0 min-h-[60vh]">
        <BillboardList
          billboards={sortedBillboards}
          selectedBillboard={selectedBillboard}
          onSelectBillboard={handleSelectBillboard}
        />
        <div className="flex-1 min-w-0 min-h-[500px] p-4 flex flex-col">
          <div className="w-full flex-1 min-h-[500px] rounded-lg overflow-hidden bg-neutral-100">
            <HoustonMap
              billboards={sortedBillboards}
              onSelectBillboard={handleSelectBillboard}
              focusBillboard={focusBillboard}
            />
          </div>
        </div>
        <BillboardDetailPanel
          billboard={selectedBillboard}
          onClose={handleClosePanel}
          onViewOnMap={selectedBillboard ? () => setFocusBillboard(selectedBillboard) : undefined}
        />
      </div>
    </main>
  );
}
