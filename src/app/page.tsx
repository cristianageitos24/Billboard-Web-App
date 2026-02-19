'use client';

import { useEffect, useState, useCallback } from 'react';
import HoustonMap from '@/components/HoustonMap';
import BillboardDetailPanel from '@/components/BillboardDetailPanel';
import type { BillboardListItem } from '@/types/billboard';

const MAP_LIMIT = 2500;

export default function Home() {
  const [billboards, setBillboards] = useState<BillboardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBillboard, setSelectedBillboard] = useState<BillboardListItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/billboards?limit=${MAP_LIMIT}`)
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
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectBillboard = useCallback((b: BillboardListItem) => {
    setSelectedBillboard(b);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedBillboard(null);
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="shrink-0 border-b border-neutral-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-neutral-900">Houston Billboard Finder</h1>
        {loading && (
          <p className="text-sm text-neutral-500 mt-1">Loading billboards…</p>
        )}
        {error && (
          <p className="text-sm text-red-600 mt-1" role="alert">{error}</p>
        )}
        {!loading && !error && billboards.length > 0 && (
          <p className="text-sm text-neutral-500 mt-1">
            {billboards.length} boards — click a marker for details
          </p>
        )}
      </header>
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 min-w-0 p-4">
          <div className="w-full h-full min-h-[500px] rounded-lg overflow-hidden">
            <HoustonMap billboards={billboards} onSelectBillboard={handleSelectBillboard} />
          </div>
        </div>
        <BillboardDetailPanel billboard={selectedBillboard} onClose={handleClosePanel} />
      </div>
    </main>
  );
}
