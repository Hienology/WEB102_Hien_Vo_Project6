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
  const { allData, displayLimit, activeWindow, loading, error, refreshData } = useFlightDataContext();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [tableLimit, setTableLimit] = useState(displayLimit || 100);

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
  const tableData = useMemo(
    () => displayedData.slice(0, Math.max(1, Number(tableLimit) || 100)),
    [displayedData, tableLimit]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {activeWindow && (
        <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-2 text-xs tracking-wide text-slate-300">
          Active Query Window: {activeWindow}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <StatCards data={allData} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
        <AirlineShareChart data={chartAggregates.byCallsignPrefix} />
        <HourlyDepartureChart data={chartAggregates.byHour} />
      </div>

      <ControlPanel
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        onRefresh={refreshData}
        tableLimit={tableLimit}
        onTableLimitChange={setTableLimit}
        totalCount={displayedData.length}
        loading={loading}
      />

      <FlightGrid data={tableData} totalCount={displayedData.length} />
    </div>
  );
}

export default Dashboard;
