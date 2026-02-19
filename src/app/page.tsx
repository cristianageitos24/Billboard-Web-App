'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import HoustonMap from '@/components/HoustonMap';
import BillboardDetailPanel from '@/components/BillboardDetailPanel';
import BillboardList from '@/components/BillboardList';
import FilterBar, { DEFAULT_FILTERS, type FilterState } from '@/components/FilterBar';
import type { BillboardListItem } from '@/types/billboard';

const MAP_LIMIT = 1500;

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
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBillboard, setSelectedBillboard] = useState<BillboardListItem | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [focusBillboard, setFocusBillboard] = useState<BillboardListItem | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced filter refetch to prevent redundant API calls
  useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set loading immediately for responsive UI
    setLoading(true);
    setError(null);

    let cancelled = false;

    // Debounce the actual fetch
    debounceTimeoutRef.current = setTimeout(() => {
      fetch(buildBillboardsUrl(filters))
        .then((res) => {
          if (!res.ok) throw new Error(res.statusText);
          return res.json();
        })
        .then((data: { billboards: BillboardListItem[]; totalCount?: number }) => {
          if (!cancelled) {
            setBillboards(data.billboards ?? []);
            setTotalCount(data.totalCount ?? data.billboards?.length ?? 0);
          }
        })
        .catch((e) => {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load billboards');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
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
            {totalCount} location{totalCount !== 1 ? 's' : ''}
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
              billboards={billboards}
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
