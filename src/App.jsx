import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plane } from 'lucide-react';
import ControlPanel from './components/ControlPanel';
import StatCards from './components/StatCards';
import FlightGrid from './components/FlightGrid';

const AVIATIONSTACK_KEY = (import.meta.env.VITE_AVIATIONSTACK_KEY || '').trim();
const AVIATIONSTACK_BASE_URL = (
  import.meta.env.VITE_AVIATIONSTACK_BASE_URL || 'https://api.aviationstack.com/v1'
).replace(/\/+$/, '');
const DEPARTURE_IATA = (import.meta.env.VITE_AVIATIONSTACK_DEPARTURE_IATA || 'JFK').toUpperCase();
const FLIGHT_DATE_OVERRIDE = (import.meta.env.VITE_AVIATIONSTACK_FLIGHT_DATE || '').trim();
const RESULT_LIMIT = Number(import.meta.env.VITE_AVIATIONSTACK_LIMIT ?? 100);
const HAS_AVIATIONSTACK_KEY = AVIATIONSTACK_KEY.length > 0;

function getFlightDateOverride() {
  if (/^\d{4}-\d{2}-\d{2}$/.test(FLIGHT_DATE_OVERRIDE)) {
    return FLIGHT_DATE_OVERRIDE;
  }
  return '';
}

function getLimit() {
  if (!Number.isFinite(RESULT_LIMIT) || RESULT_LIMIT <= 0) {
    return 100;
  }
  return Math.min(100, Math.floor(RESULT_LIMIT));
}

const DEFAULT_FILTERS = {
  searchText: '',
  flightType: 'All',
  manufacturer: 'All',
  maxDurationMins: 900,
};

function App() {
  const [allData, setAllData] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    if (!HAS_AVIATIONSTACK_KEY) {
      setAllData([]);
      setLoading(false);
      setError(
        'Missing VITE_AVIATIONSTACK_KEY. Add your key in .env.local to fetch live Aviationstack data.'
      );
      return;
    }

    try {
      const datePart = getFlightDateOverride();
      const limit = getLimit();
      const query = new URLSearchParams({
        access_key: AVIATIONSTACK_KEY,
        dep_iata: DEPARTURE_IATA,
        limit: String(limit),
      });
      if (datePart) {
        query.set('flight_date', datePart);
      }

      const response = await fetch(`${AVIATIONSTACK_BASE_URL}/flights?${query.toString()}`);
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const json = await response.json();
      if (json?.success === false || json?.error) {
        if (json?.error?.code === 'function_access_restricted' && datePart) {
          throw new Error(
            'This plan does not support the flight_date filter. Clear VITE_AVIATIONSTACK_FLIGHT_DATE in .env.local or upgrade your plan.'
          );
        }
        throw new Error(json?.error?.info || 'Aviationstack returned an application error.');
      }

      // Transform Aviationstack response into our data shape
      const transformed = (json.data || []).map((item, idx) => {
        const departure = item.departure || {};
        const arrival = item.arrival || {};
        const takeoff =
          departure.scheduled || departure.estimated || departure.actual || new Date().toISOString();
        const landing =
          arrival.scheduled || arrival.estimated || arrival.actual || new Date().toISOString();
        const durationMins = (() => {
          const d = Date.parse(takeoff);
          const a = Date.parse(landing);
          if (Number.isNaN(d) || Number.isNaN(a)) return 0;
          return Math.max(0, Math.round((a - d) / 60000));
        })();

        return {
          id: item.flight?.iata || item.flight?.icao || item.flight?.number || `flight-${idx}`,
          callsign: item.flight?.icao || item.flight?.iata || item.flight?.number || 'N/A',
          airline: item.airline?.name || 'Unknown',
          flightType: 'Passenger',
          aircraft: {
            manufacturer: 'Unknown',
            lineage:
              item.aircraft?.registration ||
              item.aircraft?.icao ||
              item.aircraft?.iata ||
              'Unknown',
          },
          route: {
            origin: departure.iata || departure.icao || DEPARTURE_IATA,
            destination: arrival.iata || arrival.icao || '???',
          },
          times: {
            takeoff,
            landing,
            flightDurationMins: durationMins,
          },
        };
      });

      setAllData(transformed);
      if (transformed.length === 0) {
        const dateSuffix = datePart ? ` on ${datePart}` : '';
        setError(`Aviationstack returned 0 flights for ${DEPARTURE_IATA}${dateSuffix}.`);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch flight data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch flight data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived filtered data — memoized for performance
  const displayedData = useMemo(() => {
    const q = filters.searchText.toLowerCase();
    return allData.filter((flight) => {
      // Text search across multiple fields
      if (q) {
        const haystack = [
          flight.airline,
          flight.callsign,
          flight.route.origin,
          flight.route.destination,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      // Flight type
      if (filters.flightType !== 'All' && flight.flightType !== filters.flightType)
        return false;
      // Manufacturer
      if (
        filters.manufacturer !== 'All' &&
        flight.aircraft.manufacturer !== filters.manufacturer
      )
        return false;
      // Duration
      if (flight.times.flightDurationMins > filters.maxDurationMins) return false;

      return true;
    });
  }, [allData, filters]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/90 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/20 rounded-lg">
              <Plane className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">AeroTrack</h1>
              <p className="text-gray-500 text-xs">Global Flight &amp; Fleet Analyzer</p>
            </div>
          </div>
          {lastUpdated && (
            <p className="text-gray-600 text-xs hidden md:block">
              Last refreshed: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {error && (
            <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}
        <StatCards data={displayedData} />
        <ControlPanel
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          onRefresh={fetchData}
          loading={loading}
        />
        <FlightGrid data={displayedData} />
      </main>
    </div>
  );
}

export default App;
