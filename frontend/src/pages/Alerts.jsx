import { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Thermometer, CloudRain, Wind, Droplets } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { alertsAPI } from '../services/api';

export default function Alerts() {
  const { city } = useLocation();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, [city, filter]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const response = await alertsAPI.getActive(city, params.type);
      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type) => {
    const icons = {
      heatwave: Thermometer,
      flood: CloudRain,
      air_quality: Wind,
      water_quality: Droplets
    };
    return icons[type] || AlertTriangle;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      info: 'bg-blue-100 border-blue-300 text-blue-800',
      warning: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      critical: 'bg-orange-100 border-orange-300 text-orange-800',
      emergency: 'bg-red-100 border-red-300 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Active Alerts</h1>
        </div>
        <p className="text-orange-100">Climate and environmental alerts for {city}</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'heatwave', 'flood', 'air_quality', 'water_quality'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f === 'all' ? 'All Alerts' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert, idx) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div
                key={idx}
                className={`rounded-xl border-2 p-5 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-white/50">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/50">
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-xs opacity-75">
                        {alert.type.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg">{alert.title}</h3>
                    <p className="mt-1 opacity-90">{alert.message}</p>
                    {alert.instructions?.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {alert.instructions.map((inst, i) => (
                          <li key={i} className="text-sm opacity-80">• {inst}</li>
                        ))}
                      </ul>
                    )}
                    {alert.validUntil && (
                      <p className="mt-3 text-xs opacity-75">
                        Valid until: {new Date(alert.validUntil).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <Bell className="w-12 h-12 text-green-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No active alerts for {city}</p>
          <p className="text-gray-400 text-sm mt-1">All clear! Stay safe and prepared.</p>
        </div>
      )}
    </div>
  );
}
