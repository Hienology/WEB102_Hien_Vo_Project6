import { Link } from 'react-router-dom';

function FlightDetailPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-6">
        <h2 className="text-xl font-bold text-white mb-2">Flight Details</h2>
        <p className="text-gray-300 mb-4">Detail view wiring is ready for the next phase.</p>
        <Link to="/" className="text-sky-400 hover:text-sky-300 text-sm font-semibold">
          ← Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default FlightDetailPage;
