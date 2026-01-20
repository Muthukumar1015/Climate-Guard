import { Link } from 'react-router-dom';
import { Menu, Bell, MapPin, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import CitySelector from './CitySelector';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { city } = useLocation();

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo and Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-xl font-bold text-gray-800 hidden sm:block">
                ClimateGuard
              </span>
            </Link>
          </div>

          {/* Center - City Selector */}
          <div className="hidden md:flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <CitySelector />
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/alerts"
              className="p-2 rounded-full hover:bg-gray-100 relative"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100"
                >
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-700 hidden sm:block">
                    {user.name}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile City Selector */}
        <div className="md:hidden pb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <CitySelector />
        </div>
      </div>
    </header>
  );
}
