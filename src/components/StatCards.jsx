import { mean } from 'simple-statistics';
import { Plane, Clock, Activity } from 'lucide-react';

function StatCards({ data }) {
  const totalFlights = data.length;

  const avgDuration =
    data.length > 0
      ? mean(data.map((f) => f.times.flightDurationMins))
      : 0;

  const peakHour = (() => {
    if (data.length === 0) return null;

    const counts = new Map();
    data.forEach((flight) => {
      const d = new Date(flight.times.takeoff);
      if (Number.isNaN(d.getTime())) return;
      const h = d.getUTCHours();
      counts.set(h, (counts.get(h) || 0) + 1);
    });

    if (counts.size === 0) return null;

    let bestHour = 0;
    let bestCount = -1;
    counts.forEach((count, hour) => {
      if (count > bestCount) {
        bestHour = hour;
        bestCount = count;
      }
    });

    return {
      label: `${String(bestHour).padStart(2, '0')}:00 UTC`,
      count: bestCount,
    };
  })();

  const formatDuration = (mins) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Flights */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
        <div className="p-3 bg-sky-500/20 rounded-lg">
          <Plane className="w-6 h-6 text-sky-400" />
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
            All Flights Collected
          </p>
          <p className="text-3xl font-bold text-white font-mono">{totalFlights}</p>
        </div>
      </div>

      {/* Average Duration */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
        <div className="p-3 bg-amber-500/20 rounded-lg">
          <Clock className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
            Avg Flight Duration
          </p>
          <p className="text-3xl font-bold text-white font-mono">
            {data.length > 0 ? formatDuration(Math.round(avgDuration)) : '—'}
          </p>
        </div>
      </div>

      {/* Peak Departure Hour */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
        <div className="p-3 bg-violet-500/20 rounded-lg">
          <Activity className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
            Peak Departure Hour
          </p>
          <p className="text-xl font-bold text-white font-mono">
            {peakHour ? peakHour.label : '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {peakHour ? `${peakHour.count} departures` : 'No data'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default StatCards;
