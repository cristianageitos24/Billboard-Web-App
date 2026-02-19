'use client';

import { useEffect, useRef } from 'react';
import type { BillboardListItem } from '@/types/billboard';

type Props = {
  billboards: BillboardListItem[];
  selectedBillboard: BillboardListItem | null;
  onSelectBillboard: (b: BillboardListItem) => void;
};

export default function BillboardList({ billboards, selectedBillboard, onSelectBillboard }: Props) {
  const selectedRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (selectedBillboard && selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedBillboard]);

  return (
    <aside
      className="w-72 shrink-0 border-r border-neutral-200 bg-white flex flex-col overflow-hidden"
      aria-label="Billboard list"
    >
      <div className="shrink-0 px-3 py-2 border-b border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-800">Billboard locations</h2>
      </div>
      <div className="flex-1 overflow-auto">
        {billboards.length === 0 ? (
          <p className="p-4 text-sm text-neutral-500">No billboards match the current filters.</p>
        ) : (
          <ul className="divide-y divide-neutral-100" role="list">
            {billboards.map((b) => {
              const isSelected = selectedBillboard?.id === b.id;
              return (
                <li key={b.id}>
                  <div
                    ref={isSelected ? selectedRef : undefined}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectBillboard(b)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectBillboard(b);
                      }
                    }}
                    className={`block p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-l-2 border-l-blue-600'
                        : 'hover:bg-neutral-50 border-l-2 border-l-transparent'
                    }`}
                    aria-current={isSelected ? 'true' : undefined}
                  >
                    <div className="aspect-video w-full rounded bg-neutral-200 mb-2 overflow-hidden">
                      {b.image_url ? (
                        <img
                          src={b.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-neutral-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-mono text-neutral-500 truncate" title={b.id}>
                      {b.id.slice(0, 8)}…
                    </p>
                    <p className="text-sm font-medium text-neutral-900 truncate" title={b.name ?? b.address ?? ''}>
                      {b.name ?? b.address ?? '—'}
                    </p>
                    <p className="text-xs text-neutral-600 truncate mt-0.5">
                      {[b.address, b.zipcode].filter(Boolean).join(', ') || '—'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">{b.price_tier}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
