import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  AlertTriangle,
  FileText,
  PlusCircle,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', color: 'text-gray-600' },
  { path: '/heatwave', icon: Thermometer, label: 'Heatwave', color: 'text-red-500' },
  { path: '/flood', icon: CloudRain, label: 'Flooding', color: 'text-blue-500' },
  { path: '/air-quality', icon: Wind, label: 'Air Quality', color: 'text-purple-500' },
  { path: '/water-quality', icon: Droplets, label: 'Water Quality', color: 'text-cyan-500' },
  { path: '/alerts', icon: AlertTriangle, label: 'Alerts', color: 'text-orange-500' },
  { path: '/reports', icon: FileText, label: 'Reports', color: 'text-gray-600' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white shadow-lg z-50
          transform transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:shadow-none lg:border-r lg:border-gray-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <nav className="p-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label, color }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <span>{label}</span>
            </NavLink>
          ))}

          {/* Report Issue Button */}
          {user && (
            <NavLink
              to="/report/new"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 mt-4 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Report Issue</span>
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            <p>ClimateGuard v1.0</p>
            <p>Data: IMD, CPCB, OpenWeather</p>
          </div>
        </div>
      </aside>
    </>
  );
}
