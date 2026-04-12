import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import FlightDetailPage from './pages/FlightDetailPage';

function Layout() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-gray-100"
      style={{ backgroundImage: "url('/595_projekt_100.jpg')" }}
    >
      <div className="min-h-screen bg-gray-950/78">
        <Sidebar />
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 text-gray-300">
      Page not found.
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/flight/:flightId" element={<FlightDetailPage />} />
        <Route path="/search" element={<Navigate to="/" replace />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
