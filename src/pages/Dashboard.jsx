import { useMemo, useState } from 'react';
import AirlineShareChart from '../components/charts/AirlineShareChart';
import HourlyDepartureChart from '../components/charts/HourlyDepartureChart';
import ControlPanel from '../components/ControlPanel';
import FlightGrid from '../components/FlightGrid';
import StatCards from '../components/StatCards';
import useFlightDataContext from '../hooks/useFlightDataContext';
import { buildAggregates } from '../hooks/useFlightData';

const DEFAULT_FILTERS = {
  searchText: '',
  flightType: 'All',
  maxDurationMins: 900,
};

function Dashboard() {
  const { allData, loading, error, refreshData } = useFlightDataContext();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

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
      if (filters.flightType !== 'All' && flight.flightType !== filters.flightType) return false;
      if (flight.times.flightDurationMins > filters.maxDurationMins) return false;

      return true;
    });
  }, [allData, filters]);

  const chartAggregates = useMemo(() => buildAggregates(displayedData), [displayedData]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {error && (
        <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <StatCards data={displayedData} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <AirlineShareChart data={chartAggregates.byAirline.slice(0, 6)} />
        <HourlyDepartureChart data={chartAggregates.byHour} />
      </div>

      <ControlPanel
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        onRefresh={refreshData}
        loading={loading}
      />

      <FlightGrid data={displayedData} />
    </div>
  );
}

export default Dashboard;
