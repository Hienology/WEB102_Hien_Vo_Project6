import { Search, X, SlidersHorizontal } from 'lucide-react';

const FLIGHT_TYPES = ['All', 'Passenger', 'Cargo', 'Private'];
const MAX_DURATION = 900;

function ControlPanel({ filters, onChange, onReset, onRefresh, loading }) {
  const handleTextChange = (e) =>
    onChange({ ...filters, searchText: e.target.value });

  const handleTypeChange = (type) =>
    onChange({ ...filters, flightType: type });

  const handleDurationChange = (e) =>
    onChange({ ...filters, maxDurationMins: Number(e.target.value) });

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const hasActiveFilters =
    filters.searchText !== '' ||
    filters.flightType !== 'All' ||
    filters.maxDurationMins < MAX_DURATION;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-300 font-semibold">
          <SlidersHorizontal className="w-4 h-4 text-sky-400" />
          <span className="text-sm uppercase tracking-widest">Control Panel</span>
        </div>
        <div className="flex gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear Filters
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading…' : '↻ Refresh Board'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={filters.searchText}
          onChange={handleTextChange}
          placeholder="Search airline, callsign, origin, destination…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-900 border border-gray-600 text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
        {filters.searchText && (
          <button
            onClick={() => onChange({ ...filters, searchText: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Row: Flight Type + Duration */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Flight Type Tabs */}
        <div className="flex-1">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">
            Flight Type
          </p>
          <div className="flex gap-1 flex-wrap">
            {FLIGHT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filters.flightType === type
                    ? 'bg-sky-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Slider */}
        <div className="flex-1">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">
            Max Duration:{' '}
            <span className="text-sky-400 font-bold">
              {filters.maxDurationMins >= MAX_DURATION
                ? 'Any'
                : `≤ ${formatDuration(filters.maxDurationMins)}`}
            </span>
          </p>
          <input
            type="range"
            min={60}
            max={MAX_DURATION}
            step={30}
            value={filters.maxDurationMins}
            onChange={handleDurationChange}
            className="w-full accent-sky-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1h</span>
            <span>15h</span>
          </div>
        </div>
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-700">
          {filters.searchText && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-sky-900/50 text-sky-300 border border-sky-700">
              Search: "{filters.searchText}"
              <button onClick={() => onChange({ ...filters, searchText: '' })}>
                <X className="w-3 h-3 ml-1 hover:text-white" />
              </button>
            </span>
          )}
          {filters.flightType !== 'All' && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-sky-900/50 text-sky-300 border border-sky-700">
              Type: {filters.flightType}
              <button onClick={() => onChange({ ...filters, flightType: 'All' })}>
                <X className="w-3 h-3 ml-1 hover:text-white" />
              </button>
            </span>
          )}
          {filters.maxDurationMins < MAX_DURATION && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-sky-900/50 text-sky-300 border border-sky-700">
              Max: {formatDuration(filters.maxDurationMins)}
              <button
                onClick={() => onChange({ ...filters, maxDurationMins: MAX_DURATION })}
              >
                <X className="w-3 h-3 ml-1 hover:text-white" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ControlPanel;
