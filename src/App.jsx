import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plane } from 'lucide-react';
import ControlPanel from './components/ControlPanel';
import StatCards from './components/StatCards';
import FlightGrid from './components/FlightGrid';

const RAPIDAPI_KEY = (import.meta.env.VITE_RAPIDAPI_KEY || '').trim();
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST || 'aerodatabox.p.rapidapi.com';
const AIRPORT_ICAO = (import.meta.env.VITE_AERODATABOX_AIRPORT_ICAO || 'KJFK').toUpperCase();
const DATE_OVERRIDE = (import.meta.env.VITE_AERODATABOX_DATE || '').trim();
const WINDOW_START_HOUR = Number(import.meta.env.VITE_AERODATABOX_WINDOW_START_HOUR ?? 0);
const HAS_RAPIDAPI_KEY = RAPIDAPI_KEY.length > 0;

function getQueryRange() {
  const datePart = /^\d{4}-\d{2}-\d{2}$/.test(DATE_OVERRIDE)
    ? DATE_OVERRIDE
    : new Date().toISOString().slice(0, 10);

  const validStartHour =
    Number.isFinite(WINDOW_START_HOUR) &&
    WINDOW_START_HOUR >= 0 &&
    WINDOW_START_HOUR <= 12
      ? Math.floor(WINDOW_START_HOUR)
      : 0;
  const endHour = validStartHour === 12 ? 23 : validStartHour + 11;
  const pad = (n) => String(n).padStart(2, '0');

  return {
    datePart,
    from: `${datePart}T${pad(validStartHour)}:00`,
    to: `${datePart}T${pad(endHour)}:59`,
  };
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

    if (!HAS_RAPIDAPI_KEY) {
      setAllData([]);
      setLoading(false);
      setError('Missing VITE_RAPIDAPI_KEY. Add your key in .env.local to fetch live AeroDataBox data.');
      return;
    }

    try {
      const { datePart, from, to } = getQueryRange();
      const response = await fetch(
        `https://${RAPIDAPI_HOST}/flights/airports/icao/${AIRPORT_ICAO}/${from}/${to}`,
        {
          headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
          },
        }
      );
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const json = await response.json();
      // Transform AeroDataBox response into our data shape
      const transformed = (json.departures || []).map((dep, idx) => ({
        id: dep.number ? `${dep.number}-${idx}` : `${AIRPORT_ICAO}-${idx}`,
        callsign: dep.callSign || dep.number || 'N/A',
        airline: dep.airline?.name || 'Unknown',
        flightType: dep.isCargo ? 'Cargo' : dep.isPrivate ? 'Private' : 'Passenger',
        aircraft: {
          manufacturer: dep.aircraft?.model?.split(' ')[0] || 'Unknown',
          lineage: dep.aircraft?.model || 'Unknown',
        },
        route: {
          origin: dep.departure?.airport?.icao || AIRPORT_ICAO,
          destination: dep.arrival?.airport?.icao || dep.arrival?.airport?.iata || '???',
        },
        times: {
          takeoff: dep.departure?.scheduledTime?.utc || new Date().toISOString(),
          landing: dep.arrival?.scheduledTime?.utc || new Date().toISOString(),
          flightDurationMins: (() => {
            const d = dep.departure?.scheduledTime?.utc;
            const a = dep.arrival?.scheduledTime?.utc;
            if (!d || !a) return 0;
            return Math.max(0, Math.round((new Date(a) - new Date(d)) / 60000));
          })(),
        },
      }));

      setAllData(transformed);
      if (transformed.length === 0) {
        setError(
          `AeroDataBox returned 0 departures for ${AIRPORT_ICAO} on ${datePart} in the selected 12h window.`
        );
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
