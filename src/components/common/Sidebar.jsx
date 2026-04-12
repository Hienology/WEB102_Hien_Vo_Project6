import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Info } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/search', label: 'Search', icon: <Search className="w-4 h-4" /> },
  { to: '/about', label: 'About', icon: <Info className="w-4 h-4" /> },
];

function Sidebar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-[0.18em] text-white leading-none">
          AeroTrack
        </h1>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-700/50'
                    : 'text-gray-300 border border-gray-700 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Sidebar;
