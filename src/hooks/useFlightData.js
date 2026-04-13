import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const AIRPORT_ICAO_ENV = (import.meta.env.VITE_OPENSKY_AIRPORT_ICAO || 'KJFK').trim();
const FLIGHT_DATE_OVERRIDE = (import.meta.env.VITE_OPENSKY_FLIGHT_DATE || '').trim();
const WINDOW_START_HOUR = Number(import.meta.env.VITE_OPENSKY_WINDOW_START_HOUR ?? 0);
const WINDOW_HOURS = Number(import.meta.env.VITE_OPENSKY_WINDOW_HOURS ?? 12);
const LOOKBACK_DAYS = Number(import.meta.env.VITE_OPENSKY_LOOKBACK_DAYS ?? 3);
const REQUEST_DELAY_MS = Number(import.meta.env.VITE_OPENSKY_REQUEST_DELAY_MS ?? 1100);
const TABLE_LIMIT = Number(
  import.meta.env.VITE_OPENSKY_TABLE_LIMIT ?? import.meta.env.VITE_OPENSKY_MAX_RESULTS ?? 100
);

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

function getDisplayLimit() {
  if (!Number.isFinite(TABLE_LIMIT) || TABLE_LIMIT < 1) {
    return 100;
  }
  return Math.min(2000, Math.floor(TABLE_LIMIT));
}

function getQueryWindow() {
  const lookbackDays =
    Number.isFinite(LOOKBACK_DAYS) && LOOKBACK_DAYS >= 1 && LOOKBACK_DAYS <= 7
      ? Math.floor(LOOKBACK_DAYS)
      : 3;

  if (/^\d{4}-\d{2}-\d{2}$/.test(FLIGHT_DATE_OVERRIDE)) {
    const startHour =
      Number.isFinite(WINDOW_START_HOUR) && WINDOW_START_HOUR >= 0 && WINDOW_START_HOUR <= 23
        ? Math.floor(WINDOW_START_HOUR)
        : 0;
    const lookbackDays =
      Number.isFinite(LOOKBACK_DAYS) && LOOKBACK_DAYS >= 1 && LOOKBACK_DAYS <= 7
        ? Math.floor(LOOKBACK_DAYS)
        : 3;

    const end = new Date(`${FLIGHT_DATE_OVERRIDE}T00:00:00Z`);
    end.setUTCHours(24, 0, 0, 0);
    const begin = new Date(end.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
    begin.setUTCHours(startHour, 0, 0, 0);

    return {
      datePart: `${begin.toISOString().slice(0, 10)} to ${FLIGHT_DATE_OVERRIDE}`,
      beginUnix: Math.floor(begin.getTime() / 1000),
      endUnix: Math.floor(end.getTime() / 1000),
    };
  }

  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const begin = new Date(end.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const startDate = begin.toISOString().slice(0, 10);
  const endDate = new Date(end.getTime() - 1000).toISOString().slice(0, 10);

  return {
    datePart: `${startDate} to ${endDate}`,
    beginUnix: Math.floor(begin.getTime() / 1000),
    endUnix: Math.floor(end.getTime() / 1000),
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildTimeChunks(beginUnix, endUnix, maxChunkSeconds = 24 * 60 * 60) {
  const chunks = [];
  if (!Number.isFinite(beginUnix) || !Number.isFinite(endUnix) || beginUnix >= endUnix) {
    return chunks;
  }

  let cursor = Math.floor(beginUnix);
  const end = Math.floor(endUnix);

  while (cursor < end) {
    const chunkEnd = Math.min(cursor + maxChunkSeconds - 1, end);
    chunks.push({ begin: cursor, end: chunkEnd });
    cursor = chunkEnd + 1;
  }

  return chunks;
}

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function buildAggregates(flights) {
  const byRouteMap = new Map();
  const byDurationClassMap = new Map([
    ['Short Haul', 0],
    ['Medium Haul', 0],
    ['Long Haul', 0],
  ]);
  const byHourMap = new Map(Array.from({ length: 24 }, (_, i) => [i, 0]));

  let totalDurationMins = 0;

  flights.forEach((flight) => {
    const origin = flight.route?.origin || '???';
    const destination = flight.route?.destination || 'N/A';
    const route = `${origin} -> ${destination}`;
    byRouteMap.set(route, (byRouteMap.get(route) || 0) + 1);

    const takeoffDate = new Date(flight.times.takeoff);
    if (!Number.isNaN(takeoffDate.getTime())) {
      const hour = takeoffDate.getUTCHours();
      byHourMap.set(hour, (byHourMap.get(hour) || 0) + 1);
    }

    const duration = flight.times.flightDurationMins || 0;
    totalDurationMins += duration;
    if (duration >= 360) {
      byDurationClassMap.set('Long Haul', (byDurationClassMap.get('Long Haul') || 0) + 1);
    } else if (duration >= 120) {
      byDurationClassMap.set('Medium Haul', (byDurationClassMap.get('Medium Haul') || 0) + 1);
    } else {
      byDurationClassMap.set('Short Haul', (byDurationClassMap.get('Short Haul') || 0) + 1);
    }
  });

  const byRoute = [...byRouteMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const byHour = [...byHourMap.entries()].map(([hour, departures]) => ({
    hour,
    label: formatHour(hour),
    departures,
  }));

  const byDurationClass = [...byDurationClassMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    byRoute,
    byDurationClass,
    byHour,
    totals: {
      flights: flights.length,
      totalDurationMins,
      avgDurationMins: flights.length > 0 ? Math.round(totalDurationMins / flights.length) : 0,
    },
  };
}

export default function useFlightData() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeWindow, setActiveWindow] = useState('');
  const hasInitializedRef = useRef(false);
  const inFlightRef = useRef(false);

  const refreshData = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setLoading(true);
    setError('');

    try {
      const { datePart, beginUnix, endUnix } = getQueryWindow();
      setActiveWindow(`${datePart} (UTC)`);
      const requestDelayMs = getRequestDelayMs();
      const timeChunks = buildTimeChunks(beginUnix, endUnix);
      const airports = getAirportIcaoList();
      const skippedAirports = [];
      const failedAirports = [];
      const rawFlights = [];

      if (timeChunks.length === 0) {
        throw new Error('Invalid time window generated for OpenSky request.');
      }

      const fetchChunkRows = async (airport, chunkBegin, chunkEnd) => {
        const query = new URLSearchParams({
          airport,
          begin: String(chunkBegin),
          end: String(chunkEnd),
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

      const fetchAirportRows = async (airport) => {
        const rows = [];

        for (let i = 0; i < timeChunks.length; i += 1) {
          const chunk = timeChunks[i];
          const chunkRows = await fetchChunkRows(airport, chunk.begin, chunk.end);
          rows.push(...chunkRows);

          if (i < timeChunks.length - 1 && requestDelayMs > 0) {
            await wait(requestDelayMs);
          }
        }

        return rows;
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
        const normalizedCallsign = (item.callsign || 'N/A').trim() || 'N/A';
        const durationMins = (() => {
          const d = Date.parse(takeoff);
          const a = Date.parse(landing);
          if (Number.isNaN(d) || Number.isNaN(a)) return 0;
          return Math.max(0, Math.round((a - d) / 60000));
        })();

        return {
          id: `${item.icao24 || 'flight'}-${item.firstSeen || idx}`,
          callsign: normalizedCallsign,
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

      const displayLimit = getDisplayLimit();
      setAllData(transformed);

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
      if (
        transformed.length > 0 &&
        transformed.every((flight) => flight.route.destination === 'N/A')
      ) {
        notices.push(
          'OpenSky departures feed is not returning destination airports for this time window, so destination is shown as N/A.'
        );
      }
      if (transformed.length === 0) {
        const dateSuffix = datePart ? ` on ${datePart}` : '';
        setError(`OpenSky returned 0 departures for ${airports.join(', ')}${dateSuffix}.`);
      } else {
        setError(notices.join(' '));
      }
    } catch (err) {
      console.error('Failed to fetch flight data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch flight data.');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;
    refreshData();
  }, [refreshData]);

  const aggregates = useMemo(() => buildAggregates(allData), [allData]);

  return {
    allData,
    displayLimit: getDisplayLimit(),
    activeWindow,
    loading,
    error,
    refreshData,
    aggregates,
  };
}
