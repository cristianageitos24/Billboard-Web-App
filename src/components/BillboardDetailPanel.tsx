'use client';

import { useState } from 'react';
import type { BillboardListItem } from '@/types/billboard';

type Props = {
  billboard: BillboardListItem | null;
  onClose: () => void;
  onViewOnMap?: () => void;
};

function strProp(p: Record<string, unknown> | null, key: string): string {
  if (!p || !(key in p)) return '';
  const v = p[key];
  if (v == null) return '';
  return String(v).trim();
}

function numProp(p: Record<string, unknown> | null, key: string): number | null {
  if (!p || !(key in p)) return null;
  const v = p[key];
  if (v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export default function BillboardDetailPanel({ billboard, onClose, onViewOnMap }: Props) {
  const [permitDetailsOpen, setPermitDetailsOpen] = useState(false);

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

  const sp = billboard.source_properties ?? null;
  const locate = strProp(sp, 'LOCATE');
  const w1 = numProp(sp, 'W1');
  const h1 = numProp(sp, 'H1');
  const hgt1 = numProp(sp, 'HGT1');
  const faces = numProp(sp, 'FACES');
  const projectNo = strProp(sp, 'PROJECTNO');
  const comments = strProp(sp, 'COMMENTS');
  const hasDimensions = (w1 != null && w1 > 0) || (h1 != null && h1 > 0) || (hgt1 != null && hgt1 > 0);
  const hasPermitDetails = comments.length > 0 || (sp && Object.keys(sp).length > 0);

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

      {onViewOnMap && (
        <div className="mb-3">
          <button
            type="button"
            onClick={onViewOnMap}
            className="w-full py-2 px-3 rounded-md border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            View on map
          </button>
        </div>
      )}

      <section className="mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Unit details</h3>
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
            <dd className="text-neutral-900">
              {[billboard.address, billboard.zipcode].filter(Boolean).join(', ') || '—'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-600">Zip code</dt>
            <dd className="text-neutral-900">{billboard.zipcode ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-600">Board type</dt>
            <dd className="text-neutral-900">{billboard.board_type ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-600">Traffic tier</dt>
            <dd className="text-neutral-900">{billboard.traffic_tier ?? '—'}</dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-600">Price tier</dt>
            <dd className="text-neutral-900">{billboard.price_tier ?? '—'}</dd>
          </div>
          {locate ? (
            <div>
              <dt className="font-medium text-neutral-600">Location</dt>
              <dd className="text-neutral-900">{locate}</dd>
            </div>
          ) : null}
          {hasDimensions ? (
            <div>
              <dt className="font-medium text-neutral-600">Dimensions</dt>
              <dd className="text-neutral-900">
                {w1 != null && w1 > 0 && h1 != null && h1 > 0
                  ? `${w1} ft × ${h1} ft`
                  : w1 != null && w1 > 0
                    ? `${w1} ft wide`
                    : h1 != null && h1 > 0
                      ? `${h1} ft tall`
                      : ''}
                {hgt1 != null && hgt1 > 0 &&
                  (hasDimensions && (w1 != null || h1 != null) ? ` · Pole ${hgt1} ft` : `Pole height ${hgt1} ft`)}
              </dd>
            </div>
          ) : null}
          {faces != null && faces > 0 ? (
            <div>
              <dt className="font-medium text-neutral-600">Faces</dt>
              <dd className="text-neutral-900">{faces}</dd>
            </div>
          ) : null}
          {projectNo ? (
            <div>
              <dt className="font-medium text-neutral-600">Project #</dt>
              <dd className="text-neutral-900">{projectNo}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-medium text-neutral-600">Coordinates</dt>
            <dd className="text-neutral-700 font-mono text-xs">
              {billboard.lat.toFixed(5)}, {billboard.lng.toFixed(5)}
            </dd>
          </div>
        </dl>
      </section>
      {hasPermitDetails ? (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => setPermitDetailsOpen((o) => !o)}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-1"
            aria-expanded={permitDetailsOpen}
          >
            {permitDetailsOpen ? '−' : '+'} Permit details
          </button>
          {permitDetailsOpen ? (
            <div className="mt-2 text-sm text-neutral-700 space-y-2">
              {comments ? (
                <div>
                  <span className="font-medium text-neutral-600">Comments: </span>
                  <span className="whitespace-pre-wrap">{comments}</span>
                </div>
              ) : null}
              {sp && Object.keys(sp).length > 0 && (
                <pre className="text-xs bg-neutral-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(sp, null, 2)}
                </pre>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
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
