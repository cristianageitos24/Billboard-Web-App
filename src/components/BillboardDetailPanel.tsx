'use client';

import type { BillboardListItem } from '@/types/billboard';

type Props = {
  billboard: BillboardListItem | null;
  onClose: () => void;
};

export default function BillboardDetailPanel({ billboard, onClose }: Props) {
  if (!billboard) {
    return (
      <aside
        className="w-80 shrink-0 border-l border-neutral-200 bg-neutral-50 p-4 flex flex-col items-center justify-center text-neutral-500"
        aria-label="Billboard details"
      >
        <p className="text-sm">Click a marker to see details.</p>
      </aside>
    );
  }

  return (
    <aside
      className="w-80 shrink-0 border-l border-neutral-200 bg-neutral-50 p-4 flex flex-col overflow-auto"
      aria-label="Billboard details"
    >
      <div className="flex justify-between items-start gap-2 mb-3">
        <h2 className="text-lg font-semibold text-neutral-900">Board details</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-700 text-sm shrink-0"
          aria-label="Close panel"
        >
          Close
        </button>
      </div>
      <dl className="space-y-2 text-sm">
        <div>
          <dt className="font-medium text-neutral-600">Name</dt>
          <dd className="text-neutral-900">{billboard.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-600">Vendor</dt>
          <dd className="text-neutral-900">{billboard.vendor ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-600">Address</dt>
          <dd className="text-neutral-900">{billboard.address ?? '—'}</dd>
        </div>
        <div>
          <dt className="font-medium text-neutral-600">Coordinates</dt>
          <dd className="text-neutral-700 font-mono text-xs">
            {billboard.lat.toFixed(5)}, {billboard.lng.toFixed(5)}
          </dd>
        </div>
      </dl>
      <div className="mt-6 pt-4 border-t border-neutral-200">
        <button
          type="button"
          className="w-full py-2 px-3 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800"
          disabled
          aria-disabled="true"
          title="Coming soon"
        >
          Add to My Boards
        </button>
      </div>
    </aside>
  );
}
