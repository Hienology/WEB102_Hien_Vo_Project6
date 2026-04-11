import { Link, NavLink } from 'react-router-dom';
import { Plane, LayoutDashboard, Search, Info } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/search', label: 'Search', icon: <Search className="w-4 h-4" /> },
  { to: '/about', label: 'About', icon: <Info className="w-4 h-4" /> },
];

function Sidebar() {
  return (
    <aside className="w-full md:w-64 md:min-h-screen border-r border-gray-800 bg-gray-950/90 backdrop-blur">
      <div className="p-4 md:p-6 border-b border-gray-800">
        <Link to="/" className="inline-flex items-center gap-2 text-white">
          <span className="p-2 rounded-lg bg-sky-500/20">
            <Plane className="w-5 h-5 text-sky-400" />
          </span>
          <span className="font-black tracking-widest uppercase">AeroTrack</span>
        </Link>
      </div>

      <nav className="p-3 md:p-4 space-y-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-700/50'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
