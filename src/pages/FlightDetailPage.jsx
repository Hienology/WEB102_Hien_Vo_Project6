import { Link, useParams } from 'react-router-dom';
import useFlightDataContext from '../hooks/useFlightDataContext';

function formatTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-3">
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-100 font-semibold">{value}</p>
    </div>
  );
}

function FlightDetailPage() {
  const { flightId } = useParams();
  const { allData, loading } = useFlightDataContext();

  const decodedId = decodeURIComponent(flightId || '');
  const flight = allData.find((item) => item.id === decodedId);

  if (loading && allData.length === 0) {
    return <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 text-gray-300">Loading flight details…</div>;
  }

  if (!flight) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-6">
          <h2 className="text-xl font-bold text-white mb-2">Flight not found</h2>
          <p className="text-gray-300 mb-4">This flight may be outside the current OpenSky result window.</p>
          <Link to="/" className="text-sky-400 hover:text-sky-300 text-sm font-semibold">
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-4">
      <div>
        <Link to="/" className="text-sky-400 hover:text-sky-300 text-sm font-semibold">
          ← Return to Dashboard
        </Link>
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-6">
        <h2 className="text-2xl font-black tracking-wide text-white mb-1">{flight.callsign}</h2>
        <p className="text-gray-400 text-sm">{flight.route.origin} → {flight.route.destination}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <DetailItem label="Airline" value={flight.airline} />
        <DetailItem label="Flight Type" value={flight.flightType} />
        <DetailItem label="Aircraft Identifier" value={flight.aircraft.lineage} />
        <DetailItem label="Manufacturer" value={flight.aircraft.manufacturer} />
        <DetailItem label="Takeoff" value={formatTime(flight.times.takeoff)} />
        <DetailItem label="Landing" value={formatTime(flight.times.landing)} />
        <DetailItem label="Flight Duration" value={formatDuration(flight.times.flightDurationMins)} />
        <DetailItem label="Origin ICAO" value={flight.route.origin} />
        <DetailItem label="Destination ICAO" value={flight.route.destination} />
      </div>
    </div>
  );
}

export default FlightDetailPage;
