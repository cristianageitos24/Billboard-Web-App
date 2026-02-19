'use client';

export type SortOption = 'name_asc' | 'price_tier_asc';
export type PriceTierFilter = '' | '$' | '$$' | '$$$' | '$$$$';
export type BoardTypeFilter = '' | 'static' | 'digital';
export type TrafficTierFilter = '' | 'low' | 'medium' | 'high' | 'prime';

export type FilterState = {
  sort: SortOption;
  priceTier: PriceTierFilter;
  boardType: BoardTypeFilter;
  trafficTier: TrafficTierFilter;
};

export const DEFAULT_FILTERS: FilterState = {
  sort: 'name_asc',
  priceTier: '',
  boardType: '',
  trafficTier: '',
};

type Props = {
  value: FilterState;
  onChange: (next: FilterState) => void;
};

function activeCount(value: FilterState): number {
  let n = 0;
  if (value.priceTier !== '') n++;
  if (value.boardType !== '') n++;
  if (value.trafficTier !== '') n++;
  return n;
}

export default function FilterBar({ value, onChange }: Props) {
  const active = activeCount(value);
  const handleClear = () => onChange(DEFAULT_FILTERS);

  return (
    <div className="flex flex-wrap items-center gap-2 bg-neutral-100 border-b border-neutral-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-neutral-600">Sort</span>
          <select
            value={value.sort}
            onChange={(e) => onChange({ ...value, sort: e.target.value as SortOption })}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Sort by"
          >
            <option value="name_asc">Name A–Z</option>
            <option value="price_tier_asc">Price tier</option>
          </select>
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-neutral-600">Price</span>
          <select
            value={value.priceTier}
            onChange={(e) => onChange({ ...value, priceTier: e.target.value as PriceTierFilter })}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Filter by price tier"
          >
            <option value="">Any</option>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
            <option value="$$$$">$$$$</option>
          </select>
          {value.priceTier !== '' && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700" aria-hidden>1</span>
          )}
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-neutral-600">Board type</span>
          <select
            value={value.boardType}
            onChange={(e) => onChange({ ...value, boardType: e.target.value as BoardTypeFilter })}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Filter by board type"
          >
            <option value="">Any</option>
            <option value="static">Static</option>
            <option value="digital">Digital</option>
          </select>
          {value.boardType !== '' && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700" aria-hidden>1</span>
          )}
        </label>

        <label className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-neutral-600">Traffic tier</span>
          <select
            value={value.trafficTier}
            onChange={(e) => onChange({ ...value, trafficTier: e.target.value as TrafficTierFilter })}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Filter by traffic tier"
          >
            <option value="">Any</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="prime">Prime</option>
          </select>
          {value.trafficTier !== '' && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700" aria-hidden>1</span>
          )}
        </label>
      </div>

      {active > 0 && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
        >
          Clear
        </button>
      )}

      {active > 0 && (
        <span className="ml-1 text-sm text-neutral-500" aria-live="polite">
          {active} filter{active !== 1 ? 's' : ''} active
        </span>
      )}
    </div>
  );
}
