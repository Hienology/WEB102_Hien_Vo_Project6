import { Plane, Package, Lock } from 'lucide-react';

const TYPE_CONFIG = {
  Passenger: {
    icon: <Plane className="w-4 h-4 text-sky-400" />,
    badge: 'text-sky-300 bg-sky-900/40 border-sky-700',
  },
  Cargo: {
    icon: <Package className="w-4 h-4 text-emerald-400" />,
    badge: 'text-emerald-300 bg-emerald-900/40 border-emerald-700',
  },
  Private: {
    icon: <Lock className="w-4 h-4 text-amber-400" />,
    badge: 'text-amber-300 bg-amber-900/40 border-amber-700',
  },
};

const COLUMNS = [
  { key: 'callsign', label: 'Callsign' },
  { key: 'airline', label: 'Airline' },
  { key: 'identificationNumber', label: 'Identification Number' },
  { key: 'flightType', label: 'Type' },
  { key: 'route', label: 'Route' },
  { key: 'duration', label: 'Duration' },
];

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function FlightGrid({ data }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Plane className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg font-semibold">
          No flights match your current filter criteria.
        </p>
        <p className="text-gray-600 text-sm mt-1">
          Try adjusting or clearing your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 text-gray-400 uppercase text-xs tracking-wider">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((flight, idx) => {
              const typeConf = TYPE_CONFIG[flight.flightType] || TYPE_CONFIG.Passenger;
              return (
                <tr
                  key={flight.id}
                  className={`border-t border-gray-700/50 transition-colors hover:bg-gray-700/40 ${
                    idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-800/60'
                  }`}
                >
                  {/* Callsign */}
                  <td className="px-4 py-3 font-mono font-bold text-white tracking-widest">
                    {flight.callsign}
                  </td>

                  {/* Airline */}
                  <td className="px-4 py-3 text-gray-300">{flight.airline}</td>

                  {/* Identification Number */}
                  <td className="px-4 py-3 text-gray-300 font-mono">
                    {flight.aircraft.lineage || 'Unknown'}
                  </td>

                  {/* Flight Type */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-semibold ${typeConf.badge}`}
                    >
                      {typeConf.icon}
                      {flight.flightType}
                    </span>
                  </td>

                  {/* Route */}
                  <td className="px-4 py-3 font-mono text-gray-200">
                    <span className="text-sky-400">{flight.route.origin}</span>
                    <span className="mx-1 text-gray-500">→</span>
                    <span className="text-sky-300">{flight.route.destination}</span>
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3 font-mono text-amber-300">
                    {formatDuration(flight.times.flightDurationMins)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-700 text-xs text-gray-500">
        Showing {data.length} flight{data.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default FlightGrid;
