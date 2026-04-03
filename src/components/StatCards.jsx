import { mean } from 'simple-statistics';
import { Plane, Clock, Package } from 'lucide-react';

function StatCards({ data }) {
  const totalFlights = data.length;

  const avgDuration =
    data.length > 0
      ? mean(data.map((f) => f.times.flightDurationMins))
      : 0;

  const passengerCount = data.filter((f) => f.flightType === 'Passenger').length;
  const cargoCount = data.filter((f) => f.flightType === 'Cargo').length;
  const relevantTotal = passengerCount + cargoCount;

  const passengerPct =
    relevantTotal > 0 ? Math.round((passengerCount / relevantTotal) * 100) : 0;
  const cargoPct = relevantTotal > 0 ? 100 - passengerPct : 0;

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
            Flights in View
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

      {/* Cargo vs Passenger Ratio */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex items-center gap-4">
        <div className="p-3 bg-emerald-500/20 rounded-lg">
          <Package className="w-6 h-6 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">
            Cargo / Passenger Split
          </p>
          {relevantTotal > 0 ? (
            <>
              <div className="flex gap-3 text-sm font-mono">
                <span className="text-emerald-400 font-bold">{cargoPct}% Cargo</span>
                <span className="text-gray-500">/</span>
                <span className="text-sky-400 font-bold">{passengerPct}% Pax</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-700 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${cargoPct}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatCards;
