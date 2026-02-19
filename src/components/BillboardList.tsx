'use client';

import { useEffect, useRef, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { BillboardListItem } from '@/types/billboard';

type Props = {
  billboards: BillboardListItem[];
  selectedBillboard: BillboardListItem | null;
  onSelectBillboard: (b: BillboardListItem) => void;
};

// Estimated item height for virtualization (approximate height of a list item)
const ESTIMATED_ITEM_HEIGHT = 220;

// Helper function to format board type
function formatBoardType(boardType: string): string {
  const formatted = boardType.charAt(0).toUpperCase() + boardType.slice(1);
  // Add "(Ex)" for default example values
  if (boardType === 'static') {
    return `${formatted} (Ex)`;
  }
  return formatted;
}

// Helper function to format traffic tier
function formatTrafficTier(tier: string): string {
  const formatted = tier.charAt(0).toUpperCase() + tier.slice(1);
  // Add "(Ex)" for default example values
  if (tier === 'medium') {
    return `${formatted} (Ex)`;
  }
  return formatted;
}

// Helper function to format price tier
function formatPriceTier(tier: string): string {
  // Add "(Ex)" for default example values
  if (tier === '$$') {
    return `${tier} (Ex)`;
  }
  return tier;
}

// Memoized card component to prevent unnecessary re-renders
const BillboardListCard = memo(function BillboardListCard({
  billboard,
  isSelected,
  onSelect,
  selectedRef,
}: {
  billboard: BillboardListItem;
  isSelected: boolean;
  onSelect: (b: BillboardListItem) => void;
  selectedRef?: (el: HTMLDivElement | null) => void;
}) {
  const displayName = billboard.name ?? billboard.address ?? '—';
  const displayAddress = [billboard.address, billboard.zipcode].filter(Boolean).join(', ') || null;
  
  return (
    <div
      ref={selectedRef}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(billboard)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(billboard);
        }
      }}
      className={`block p-3 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-l-2 border-l-blue-600'
          : 'hover:bg-neutral-50 border-l-2 border-l-transparent'
      }`}
      aria-current={isSelected ? 'true' : undefined}
      title={billboard.id}
    >
      <div className="aspect-video w-full rounded bg-neutral-200 mb-2 overflow-hidden">
        {billboard.image_url ? (
          <img
            src={billboard.image_url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-neutral-400 text-xs">
            No image
          </div>
        )}
      </div>
      
      <h3 className="text-sm font-semibold text-neutral-900 truncate mb-1" title={displayName}>
        {displayName}
      </h3>
      
      {billboard.vendor && (
        <p className="text-xs text-neutral-600 truncate mb-2" title={billboard.vendor}>
          {billboard.vendor}
        </p>
      )}
      
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            billboard.board_type === 'digital'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {formatBoardType(billboard.board_type)}
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            billboard.traffic_tier === 'prime'
              ? 'bg-purple-100 text-purple-800'
              : billboard.traffic_tier === 'high'
              ? 'bg-green-100 text-green-800'
              : billboard.traffic_tier === 'medium'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {formatTrafficTier(billboard.traffic_tier)}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900">
          {formatPriceTier(billboard.price_tier)}
        </span>
      </div>
      
      {displayAddress && (
        <p className="text-xs text-neutral-500 truncate" title={displayAddress}>
          {displayAddress}
        </p>
      )}
    </div>
  );
});

export default function BillboardList({ billboards, selectedBillboard, onSelectBillboard }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: billboards.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
    overscan: 5,
  });

  // Scroll selected item into view
  useEffect(() => {
    if (selectedBillboard && selectedRef.current) {
      const index = billboards.findIndex(b => b.id === selectedBillboard.id);
      if (index >= 0) {
        virtualizer.scrollToIndex(index, { align: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedBillboard, billboards, virtualizer]);

  if (billboards.length === 0) {
    return (
      <aside
        className="w-72 shrink-0 border-r border-neutral-200 bg-white flex flex-col overflow-hidden"
        aria-label="Billboard list"
      >
        <div className="shrink-0 px-3 py-2 border-b border-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-800">Billboard locations</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <p className="p-4 text-sm text-neutral-500">No billboards match the current filters.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-72 shrink-0 border-r border-neutral-200 bg-white flex flex-col overflow-hidden"
      aria-label="Billboard list"
    >
      <div className="shrink-0 px-3 py-2 border-b border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-800">Billboard locations</h2>
      </div>
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{ contain: 'strict' }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <ul className="divide-y divide-neutral-100" role="list" style={{ position: 'relative' }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const b = billboards[virtualItem.index];
              const isSelected = selectedBillboard?.id === b.id;
              return (
                <li
                  key={b.id}
                  data-index={virtualItem.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <BillboardListCard
                    billboard={b}
                    isSelected={isSelected}
                    onSelect={onSelectBillboard}
                    selectedRef={isSelected ? selectedRef : undefined}
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}
