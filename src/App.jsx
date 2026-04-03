import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plane } from 'lucide-react';
import mockData from './data/mockAviationData.json';
import ControlPanel from './components/ControlPanel';
import StatCards from './components/StatCards';
import FlightGrid from './components/FlightGrid';

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY || '';
const USE_MOCK = !RAPIDAPI_KEY;

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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (USE_MOCK) {
        // Simulate a short fetch delay for UX realism
        await new Promise((r) => setTimeout(r, 600));
        setAllData(mockData);
      } else {
        const response = await fetch(
          'https://aerodatabox.p.rapidapi.com/flights/airports/icao/KJFK/2026-04-03T00:00/2026-04-03T23:59',
          {
            headers: {
              'X-RapidAPI-Key': RAPIDAPI_KEY,
              'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
            },
          }
        );
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const json = await response.json();
        // Transform AeroDataBox response into our data shape
        const transformed = (json.departures || []).map((dep, idx) => ({
          id: `${dep.number}-${idx}`,
          callsign: dep.callSign || dep.number || 'N/A',
          airline: dep.airline?.name || 'Unknown',
          flightType: dep.isCargo ? 'Cargo' : 'Passenger',
          aircraft: {
            manufacturer: dep.aircraft?.model?.split(' ')[0] || 'Unknown',
            lineage: dep.aircraft?.model || 'Unknown',
          },
          route: {
            origin: 'KJFK',
            destination: dep.arrival?.airport?.icao || dep.arrival?.airport?.iata || '???',
          },
          times: {
            takeoff: dep.departure?.scheduledTime?.utc || new Date().toISOString(),
            landing: dep.arrival?.scheduledTime?.utc || new Date().toISOString(),
            flightDurationMins: (() => {
              const d = dep.departure?.scheduledTime?.utc;
              const a = dep.arrival?.scheduledTime?.utc;
              if (!d || !a) return 0;
              return Math.round((new Date(a) - new Date(d)) / 60000);
            })(),
          },
        }));
        setAllData(transformed);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch flight data:', err);
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
              {USE_MOCK && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-400 text-xs border border-amber-700">
                  MOCK DATA
                </span>
              )}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
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
