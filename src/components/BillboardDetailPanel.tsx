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

function objProp<T = Record<string, unknown>>(p: Record<string, unknown> | null, key: string): T | null {
  if (!p || !(key in p)) return null;
  const v = p[key];
  if (v != null && typeof v === 'object' && !Array.isArray(v)) return v as T;
  return null;
}

function isBlipSource(sp: Record<string, unknown> | null): boolean {
  return !!(sp && ('daily_impressions' in sp || 'display_name' in sp));
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
  const isBlip = isBlipSource(sp);
  const locate = strProp(sp, 'LOCATE');
  const w1 = numProp(sp, 'W1');
  const h1 = numProp(sp, 'H1');
  const hgt1 = numProp(sp, 'HGT1');
  const faces = numProp(sp, 'FACES');
  const projectNo = strProp(sp, 'PROJECTNO');
  const comments = strProp(sp, 'COMMENTS');
  const hasDimensions = (w1 != null && w1 > 0) || (h1 != null && h1 > 0) || (hgt1 != null && hgt1 > 0);
  const hasPermitDetails = comments.length > 0 || (sp && Object.keys(sp).length > 0);

  const blipDisplayName = isBlip ? strProp(sp, 'display_name') : '';
  const blipLocation = isBlip ? strProp(sp, 'location') : '';
  const blipDescription = isBlip ? strProp(sp, 'description') : '';
  const blipCity = isBlip ? strProp(sp, 'city') : '';
  const blipProvince = isBlip ? strProp(sp, 'province') : '';
  const blipDailyImp = isBlip ? numProp(sp, 'daily_impressions') : null;
  const blipFlipDuration = isBlip ? numProp(sp, 'flip_duration') : null;
  const blipAvailableFlips = isBlip ? numProp(sp, 'available_flips') : null;
  const blipBooked = isBlip && sp && typeof sp.booked === 'boolean' ? sp.booked : null;
  const blipBoardWidth = isBlip ? numProp(sp, 'board_width') : null;
  const blipBoardHeight = isBlip ? numProp(sp, 'board_height') : null;
  const blipFacing = isBlip ? strProp(sp, 'facing') : '';
  const blipRead = isBlip ? strProp(sp, 'read') : '';
  const blipMaxMinPrice = isBlip ? numProp(sp, 'max_minimum_price') : null;
  const blipFeeRate = isBlip ? numProp(sp, 'fee_rate') : null;
  const blipCpmRange = isBlip ? objProp<{ low_cpm?: number; high_cpm?: number }>(sp, 'cpm_range') : null;
  const blipThirtyDay = isBlip ? objProp<{ price_per_flip?: number; impressions_per_flip?: number; avg_flips_per_day?: number }>(sp, 'thirty_day_averages') : null;
  const blipPhotos = isBlip && sp && Array.isArray(sp.photos) && sp.photos.length > 0 ? (sp.photos as Array<{ thumbnail_url?: string; url?: string }>) : null;
  const blipVenueType = isBlip ? objProp<{ string_value?: string; definition?: string }>(sp, 'venue_type') : null;
  const blipCategories = isBlip && sp && Array.isArray(sp.categories) ? (sp.categories as string[]) : null;
  const blipTimezone = isBlip ? strProp(sp, 'timezone') : '';

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
            <dd className="text-neutral-900">
              {billboard.board_type 
                ? `${billboard.board_type.charAt(0).toUpperCase() + billboard.board_type.slice(1)}${billboard.board_type === 'static' ? ' (Ex)' : ''}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-600">Traffic tier</dt>
            <dd className="text-neutral-900">
              {billboard.traffic_tier 
                ? `${billboard.traffic_tier.charAt(0).toUpperCase() + billboard.traffic_tier.slice(1)}${billboard.traffic_tier === 'medium' ? ' (Ex)' : ''}`
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-neutral-600">Price tier</dt>
            <dd className="text-neutral-900">
              {billboard.price_tier 
                ? `${billboard.price_tier}${billboard.price_tier === '$$' ? ' (Ex)' : ''}`
                : '—'}
            </dd>
          </div>
          {isBlip && blipDisplayName ? (
            <div>
              <dt className="font-medium text-neutral-600">Display name</dt>
              <dd className="text-neutral-900">{blipDisplayName}</dd>
            </div>
          ) : null}
          {isBlip && blipLocation ? (
            <div>
              <dt className="font-medium text-neutral-600">Location</dt>
              <dd className="text-neutral-900">{blipLocation}</dd>
            </div>
          ) : null}
          {!isBlip && locate ? (
            <div>
              <dt className="font-medium text-neutral-600">Location</dt>
              <dd className="text-neutral-900">{locate}</dd>
            </div>
          ) : null}
          {hasDimensions && !isBlip ? (
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
          {!isBlip && faces != null && faces > 0 ? (
            <div>
              <dt className="font-medium text-neutral-600">Faces</dt>
              <dd className="text-neutral-900">{faces}</dd>
            </div>
          ) : null}
          {!isBlip && projectNo ? (
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

      {isBlip ? (
        <section className="mb-4 pt-4 border-t border-neutral-200">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Digital board details</h3>
          <dl className="space-y-2 text-sm">
            {(blipCity || blipProvince) ? (
              <div>
                <dt className="font-medium text-neutral-600">City / State</dt>
                <dd className="text-neutral-900">{[blipCity, blipProvince].filter(Boolean).join(', ') || '—'}</dd>
              </div>
            ) : null}
            {blipDescription ? (
              <div>
                <dt className="font-medium text-neutral-600">Description</dt>
                <dd className="text-neutral-900 whitespace-pre-wrap">{blipDescription}</dd>
              </div>
            ) : null}
            {blipFlipDuration != null ? (
              <div>
                <dt className="font-medium text-neutral-600">Flip duration (swap rate)</dt>
                <dd className="text-neutral-900">{blipFlipDuration} sec</dd>
              </div>
            ) : null}
            {blipDailyImp != null ? (
              <div>
                <dt className="font-medium text-neutral-600">Daily impressions</dt>
                <dd className="text-neutral-900">{blipDailyImp.toLocaleString()}</dd>
              </div>
            ) : null}
            {blipAvailableFlips != null ? (
              <div>
                <dt className="font-medium text-neutral-600">Available flips</dt>
                <dd className="text-neutral-900">{blipAvailableFlips.toLocaleString()}</dd>
              </div>
            ) : null}
            {blipBooked !== null ? (
              <div>
                <dt className="font-medium text-neutral-600">Booked</dt>
                <dd className="text-neutral-900">{blipBooked ? 'Yes' : 'No'}</dd>
              </div>
            ) : null}
            {(blipBoardWidth != null || blipBoardHeight != null) ? (
              <div>
                <dt className="font-medium text-neutral-600">Dimensions</dt>
                <dd className="text-neutral-900">
                  {[blipBoardWidth != null ? `${blipBoardWidth} ft wide` : null, blipBoardHeight != null ? `${blipBoardHeight} ft tall` : null].filter(Boolean).join(' × ') || '—'}
                </dd>
              </div>
            ) : null}
            {(blipFacing || blipRead) ? (
              <div>
                <dt className="font-medium text-neutral-600">Facing / Read</dt>
                <dd className="text-neutral-900">{[blipFacing, blipRead].filter(Boolean).join(' / ') || '—'}</dd>
              </div>
            ) : null}
            {blipMaxMinPrice != null ? (
              <div>
                <dt className="font-medium text-neutral-600">Max minimum price</dt>
                <dd className="text-neutral-900">${blipMaxMinPrice.toFixed(2)}</dd>
              </div>
            ) : null}
            {blipFeeRate != null ? (
              <div>
                <dt className="font-medium text-neutral-600">Fee rate</dt>
                <dd className="text-neutral-900">{(blipFeeRate * 100).toFixed(0)}%</dd>
              </div>
            ) : null}
            {blipCpmRange && (blipCpmRange.low_cpm != null || blipCpmRange.high_cpm != null) ? (
              <div>
                <dt className="font-medium text-neutral-600">CPM range</dt>
                <dd className="text-neutral-900">
                  {blipCpmRange.low_cpm != null ? `$${blipCpmRange.low_cpm}` : '—'} – {blipCpmRange.high_cpm != null ? `$${blipCpmRange.high_cpm}` : '—'}
                </dd>
              </div>
            ) : null}
            {blipThirtyDay && (blipThirtyDay.price_per_flip != null || blipThirtyDay.impressions_per_flip != null || blipThirtyDay.avg_flips_per_day != null) ? (
              <div>
                <dt className="font-medium text-neutral-600">30-day averages</dt>
                <dd className="text-neutral-900">
                  {[
                    blipThirtyDay.price_per_flip != null ? `Price/flip: $${blipThirtyDay.price_per_flip.toFixed(2)}` : null,
                    blipThirtyDay.impressions_per_flip != null ? `Impressions/flip: ${blipThirtyDay.impressions_per_flip.toFixed(1)}` : null,
                    blipThirtyDay.avg_flips_per_day != null ? `Avg flips/day: ${blipThirtyDay.avg_flips_per_day.toFixed(1)}` : null,
                  ].filter(Boolean).join(' · ')}
                </dd>
              </div>
            ) : null}
            {blipTimezone ? (
              <div>
                <dt className="font-medium text-neutral-600">Timezone</dt>
                <dd className="text-neutral-900">{blipTimezone}</dd>
              </div>
            ) : null}
            {blipVenueType?.string_value || blipVenueType?.definition ? (
              <div>
                <dt className="font-medium text-neutral-600">Venue type</dt>
                <dd className="text-neutral-900">{blipVenueType.definition ?? blipVenueType.string_value ?? '—'}</dd>
              </div>
            ) : null}
            {blipCategories && blipCategories.length > 0 ? (
              <div>
                <dt className="font-medium text-neutral-600">Categories</dt>
                <dd className="text-neutral-900">{blipCategories.join(', ')}</dd>
              </div>
            ) : null}
            {blipPhotos && blipPhotos[0] ? (
              <div>
                <dt className="font-medium text-neutral-600">Photo</dt>
                <dd>
                  <a href={blipPhotos[0].url || blipPhotos[0].thumbnail_url || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    <img src={blipPhotos[0].thumbnail_url || blipPhotos[0].url || ''} alt="Board" className="mt-1 rounded max-w-full h-auto max-h-32 object-contain" />
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}
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
