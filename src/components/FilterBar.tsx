'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

export type SortOption = 'name_asc' | 'price_tier_asc';
export type PriceTierFilter = '' | '$' | '$$' | '$$$' | '$$$$';
export type BoardTypeFilter = '' | 'static' | 'digital';
export type TrafficTierFilter = '' | 'low' | 'medium' | 'high' | 'prime';

export type FilterState = {
  sort: SortOption;
  priceTier: PriceTierFilter;
  boardType: BoardTypeFilter;
  trafficTier: TrafficTierFilter;
  zipcodes: string[];
  zipcodeInput: string;
};

export const DEFAULT_FILTERS: FilterState = {
  sort: 'name_asc',
  priceTier: '',
  boardType: '',
  trafficTier: '',
  zipcodes: [],
  zipcodeInput: '',
};

type Props = {
  value: FilterState;
  onChange: (next: FilterState) => void;
  availableZipcodes?: string[];
};

function activeCount(value: FilterState): number {
  let n = 0;
  if (value.priceTier !== '') n++;
  if (value.boardType !== '') n++;
  if (value.trafficTier !== '') n++;
  if (value.zipcodes.length > 0) n++;
  return n;
}

export default function FilterBar({ value, onChange, availableZipcodes = [] }: Props) {
  const active = activeCount(value);
  const handleClear = () => onChange(DEFAULT_FILTERS);
  const [isZipcodeDropdownOpen, setIsZipcodeDropdownOpen] = useState(false);
  const zipcodeInputRef = useRef<HTMLInputElement>(null);
  const zipcodeDropdownRef = useRef<HTMLDivElement>(null);

  // Filter zipcodes based on input
  const filteredZipcodes = useMemo(() => {
    if (!value.zipcodeInput.trim()) {
      return availableZipcodes;
    }
    const input = value.zipcodeInput.toLowerCase();
    return availableZipcodes.filter((zipcode) => zipcode.toLowerCase().includes(input));
  }, [value.zipcodeInput, availableZipcodes]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        zipcodeInputRef.current &&
        zipcodeDropdownRef.current &&
        !zipcodeInputRef.current.contains(event.target as Node) &&
        !zipcodeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsZipcodeDropdownOpen(false);
      }
    };

    if (isZipcodeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isZipcodeDropdownOpen]);

  const handleZipcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, zipcodeInput: e.target.value });
    setIsZipcodeDropdownOpen(true);
  };

  const handleZipcodeInputFocus = () => {
    setIsZipcodeDropdownOpen(true);
  };

  const handleZipcodeSelect = (zipcode: string) => {
    if (!value.zipcodes.includes(zipcode)) {
      onChange({
        ...value,
        zipcodes: [...value.zipcodes, zipcode],
        zipcodeInput: '',
      });
    }
    setIsZipcodeDropdownOpen(false);
  };

  const handleZipcodeRemove = (zipcode: string) => {
    onChange({
      ...value,
      zipcodes: value.zipcodes.filter((z) => z !== zipcode),
    });
  };

  const handleFilterRemove = (filterType: 'priceTier' | 'boardType' | 'trafficTier') => {
    onChange({
      ...value,
      [filterType]: '',
    });
  };

  const getFilterLabel = (type: 'priceTier' | 'boardType' | 'trafficTier', value: string): string => {
    if (type === 'priceTier') return value;
    if (type === 'boardType') return value.charAt(0).toUpperCase() + value.slice(1);
    if (type === 'trafficTier') return value.charAt(0).toUpperCase() + value.slice(1);
    return value;
  };

  return (
    <div className="bg-neutral-100 border-b border-neutral-200 px-4 py-3">
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

        <div className="relative flex items-center gap-1.5">
          <span className="text-sm font-medium text-neutral-600">Zipcode</span>
          <div className="relative">
            <input
              ref={zipcodeInputRef}
              type="text"
              value={value.zipcodeInput}
              onChange={handleZipcodeInputChange}
              onFocus={handleZipcodeInputFocus}
              placeholder="Type or select zipcode..."
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
              aria-label="Filter by zipcode"
              aria-expanded={isZipcodeDropdownOpen}
              aria-haspopup="listbox"
            />
            {isZipcodeDropdownOpen && filteredZipcodes.length > 0 && (
              <div
                ref={zipcodeDropdownRef}
                className="absolute z-50 mt-1 w-48 max-h-[300px] overflow-y-auto bg-white border border-neutral-300 rounded-lg shadow-lg"
                role="listbox"
              >
                {filteredZipcodes.map((zipcode) => {
                  const isSelected = value.zipcodes.includes(zipcode);
                  return (
                    <button
                      key={zipcode}
                      type="button"
                      onClick={() => handleZipcodeSelect(zipcode)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none ${
                        isSelected ? 'bg-blue-50 text-blue-700' : 'text-neutral-800'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="flex items-center gap-2">
                        {zipcode}
                        {isSelected && (
                          <span className="text-blue-600" aria-hidden>✓</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {value.zipcodes.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-medium text-blue-700" aria-hidden>
              {value.zipcodes.length}
            </span>
          )}
        </div>

        {active > 0 && (
          <>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800"
            >
              Clear
            </button>
            <span className="text-sm text-neutral-500" aria-live="polite">
              {active} filter{active !== 1 ? 's' : ''} active
            </span>
          </>
        )}
      </div>

      {active > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.priceTier !== '' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Price: {getFilterLabel('priceTier', value.priceTier)}
              <button
                type="button"
                onClick={() => handleFilterRemove('priceTier')}
                className="hover:text-blue-900 focus:outline-none"
                aria-label={`Remove price filter ${value.priceTier}`}
              >
                ×
              </button>
            </span>
          )}
          {value.boardType !== '' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Board: {getFilterLabel('boardType', value.boardType)}
              <button
                type="button"
                onClick={() => handleFilterRemove('boardType')}
                className="hover:text-blue-900 focus:outline-none"
                aria-label={`Remove board type filter ${value.boardType}`}
              >
                ×
              </button>
            </span>
          )}
          {value.trafficTier !== '' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Traffic: {getFilterLabel('trafficTier', value.trafficTier)}
              <button
                type="button"
                onClick={() => handleFilterRemove('trafficTier')}
                className="hover:text-blue-900 focus:outline-none"
                aria-label={`Remove traffic tier filter ${value.trafficTier}`}
              >
                ×
              </button>
            </span>
          )}
          {value.zipcodes.map((zipcode) => (
            <span
              key={zipcode}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              {zipcode}
              <button
                type="button"
                onClick={() => handleZipcodeRemove(zipcode)}
                className="hover:text-blue-900 focus:outline-none"
                aria-label={`Remove ${zipcode}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
