import { useState, useEffect, useMemo, useCallback } from 'react';
import ControlPanel from '../components/ControlPanel';
import StatCards from '../components/StatCards';
import FlightGrid from '../components/FlightGrid';

const AIRPORT_ICAO_ENV = (import.meta.env.VITE_OPENSKY_AIRPORT_ICAO || 'KJFK').trim();
const FLIGHT_DATE_OVERRIDE = (import.meta.env.VITE_OPENSKY_FLIGHT_DATE || '').trim();
const WINDOW_START_HOUR = Number(import.meta.env.VITE_OPENSKY_WINDOW_START_HOUR ?? 0);
const WINDOW_HOURS = Number(import.meta.env.VITE_OPENSKY_WINDOW_HOURS ?? 12);
const REQUEST_DELAY_MS = Number(import.meta.env.VITE_OPENSKY_REQUEST_DELAY_MS ?? 1100);
const MAX_RESULTS = Number(import.meta.env.VITE_OPENSKY_MAX_RESULTS ?? 100);

function getAirportIcaoList() {
  const airports = AIRPORT_ICAO_ENV.split(',')
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
    .filter((code) => /^[A-Z0-9]{4}$/.test(code));

  return airports.length > 0 ? [...new Set(airports)] : ['KJFK'];
}

function getRequestDelayMs() {
  if (!Number.isFinite(REQUEST_DELAY_MS) || REQUEST_DELAY_MS < 0) {
    return 1100;
  }
  return Math.min(5000, Math.floor(REQUEST_DELAY_MS));
}

function getMaxResults() {
  if (!Number.isFinite(MAX_RESULTS) || MAX_RESULTS < 1) {
    return 100;
  }
  return Math.min(500, Math.floor(MAX_RESULTS));
}

function getQueryWindow() {
  const datePart = /^\d{4}-\d{2}-\d{2}$/.test(FLIGHT_DATE_OVERRIDE)
    ? FLIGHT_DATE_OVERRIDE
    : new Date().toISOString().slice(0, 10);

  const startHour =
    Number.isFinite(WINDOW_START_HOUR) && WINDOW_START_HOUR >= 0 && WINDOW_START_HOUR <= 23
      ? Math.floor(WINDOW_START_HOUR)
      : 0;
  const durationHours =
    Number.isFinite(WINDOW_HOURS) && WINDOW_HOURS > 0 && WINDOW_HOURS <= 24
      ? Math.floor(WINDOW_HOURS)
      : 12;

  const begin = new Date(`${datePart}T00:00:00Z`);
  begin.setUTCHours(startHour, 0, 0, 0);
  const end = new Date(begin.getTime() + durationHours * 60 * 60 * 1000);

  return {
    datePart,
    beginUnix: Math.floor(begin.getTime() / 1000),
    endUnix: Math.floor(end.getTime() / 1000),
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEFAULT_FILTERS = {
  searchText: '',
  flightType: 'All',
  maxDurationMins: 900,
};

function Dashboard() {
  const [allData, setAllData] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { datePart, beginUnix, endUnix } = getQueryWindow();
      const requestDelayMs = getRequestDelayMs();
      const airports = getAirportIcaoList();
      const skippedAirports = [];
      const failedAirports = [];
      const rawFlights = [];

      const fetchAirportRows = async (airport) => {
        const query = new URLSearchParams({
          airport,
          begin: String(beginUnix),
          end: String(endUnix),
        });

        const response = await fetch(`/api/opensky/departures?${query.toString()}`);
        if (response.status === 429) {
          throw new Error(`RATE_LIMIT:${airport}`);
        }
        const json = await response.json().catch(() => null);
        if (!response.ok) {
          const message = json?.message || `API error: ${response.status} (${airport})`;
          throw new Error(message);
        }
        if (!Array.isArray(json)) {
          throw new Error(`OpenSky returned unexpected payload for ${airport}.`);
        }

        return json;
      };

      for (let i = 0; i < airports.length; i += 1) {
        const airport = airports[i];
        try {
          const rows = await fetchAirportRows(airport);
          rawFlights.push(...rows);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.startsWith('RATE_LIMIT:')) {
            try {
              await wait(requestDelayMs);
              const retryRows = await fetchAirportRows(airport);
              rawFlights.push(...retryRows);
            } catch (retryErr) {
              const retryMessage = retryErr instanceof Error ? retryErr.message : String(retryErr);
              if (retryMessage.startsWith('RATE_LIMIT:')) {
                skippedAirports.push(airport);
              } else {
                failedAirports.push(`${airport}: ${retryMessage}`);
              }
            }
          } else {
            failedAirports.push(`${airport}: ${message}`);
          }
        }

        if (i < airports.length - 1 && requestDelayMs > 0) {
          await wait(requestDelayMs);
        }
      }

      if (rawFlights.length === 0) {
        if (skippedAirports.length > 0) {
          throw new Error(
            `API rate limit reached for ${skippedAirports.join(', ')}. Reduce airports or wait before refreshing again.`
          );
        }
        if (failedAirports.length > 0) {
          throw new Error(failedAirports[0]);
        }
      }

      const transformed = rawFlights.map((item, idx) => {
        const departureIcao = item.estDepartureAirport || '';
        const arrivalIcao = item.estArrivalAirport || '';
        const firstSeen = Number(item.firstSeen) || 0;
        const lastSeen = Number(item.lastSeen) || 0;
        const takeoff = firstSeen > 0 ? new Date(firstSeen * 1000).toISOString() : new Date().toISOString();
        const landing = lastSeen > 0 ? new Date(lastSeen * 1000).toISOString() : takeoff;
        const aircraftIdentifier = item.icao24 || (item.callsign || '').trim() || '';
        const durationMins = (() => {
          const d = Date.parse(takeoff);
          const a = Date.parse(landing);
          if (Number.isNaN(d) || Number.isNaN(a)) return 0;
          return Math.max(0, Math.round((a - d) / 60000));
        })();

        return {
          id: `${item.icao24 || 'flight'}-${item.firstSeen || idx}`,
          callsign: (item.callsign || 'N/A').trim(),
          airline: 'Unknown',
          flightType: 'Passenger',
          aircraft: {
            manufacturer: aircraftIdentifier ? 'Not Provided' : 'Unknown',
            lineage: aircraftIdentifier || 'Unknown',
          },
          route: {
            origin: departureIcao || '???',
            destination: arrivalIcao || 'N/A',
          },
          times: {
            takeoff,
            landing,
            flightDurationMins: durationMins,
          },
        };
      });

      const maxResults = getMaxResults();
      const limitedFlights = transformed.slice(0, maxResults);
      setAllData(limitedFlights);

      const notices = [];
      if (skippedAirports.length > 0 || failedAirports.length > 0) {
        const parts = [];
        if (skippedAirports.length > 0) {
          parts.push(`Rate-limited: ${skippedAirports.join(', ')}`);
        }
        if (failedAirports.length > 0) {
          parts.push(`Failed: ${failedAirports.join(' | ')}`);
        }
        notices.push(`Partial data loaded. ${parts.join('. ')}`);
      }
      if (transformed.length > maxResults) {
        notices.push(`Showing first ${maxResults} flights (out of ${transformed.length}).`);
      }
      if (
        limitedFlights.length > 0 &&
        limitedFlights.every((flight) => flight.route.destination === 'N/A')
      ) {
        notices.push(
          'OpenSky departures feed is not returning destination airports for this time window, so destination is shown as N/A.'
        );
      }
      if (limitedFlights.length === 0) {
        const dateSuffix = datePart ? ` on ${datePart}` : '';
        setError(
          `OpenSky returned 0 departures for ${airports.join(', ')}${dateSuffix}.`
        );
      } else {
        setError(notices.join(' '));
      }

    } catch (err) {
      console.error('Failed to fetch flight data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch flight data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const displayedData = useMemo(() => {
    const q = filters.searchText.toLowerCase();
    return allData.filter((flight) => {
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
      if (filters.flightType !== 'All' && flight.flightType !== filters.flightType)
        return false;
      if (flight.times.flightDurationMins > filters.maxDurationMins) return false;

      return true;
    });
  }, [allData, filters]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
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
    </div>
  );
}

export default Dashboard;
