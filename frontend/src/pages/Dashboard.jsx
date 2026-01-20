import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Thermometer,
  CloudRain,
  Wind,
  Droplets,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { dashboardAPI, alertsAPI, heatwaveAPI, airQualityAPI } from '../services/api';

export default function Dashboard() {
  const { city, locationData } = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [city, locationData]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardRes, alertsRes] = await Promise.allSettled([
        dashboardAPI.getSummary(city, locationData?.lat, locationData?.lng),
        alertsAPI.getSummary(city)
      ]);

      if (dashboardRes.status === 'fulfilled') {
        setData(dashboardRes.value.data);
      }

      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data.byType || []);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Climate Safety Dashboard</h1>
        <p className="text-blue-100">
          Real-time environmental monitoring for {city}
        </p>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-amber-800 font-medium">
                {alerts.reduce((sum, a) => sum + a.count, 0)} active alerts for {city}
              </p>
              <p className="text-amber-600 text-sm">
                Check alerts page for details
              </p>
            </div>
            <Link
              to="/alerts"
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
            >
              View Alerts
            </Link>
          </div>
        </div>
      )}

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Heatwave Card */}
        <ModuleCard
          title="Heatwave Monitor"
          icon={Thermometer}
          color="red"
          path="/heatwave"
          status={data?.summary?.heatwave?.status || 'normal'}
          metrics={[
            {
              label: 'Temperature',
              value: data?.summary?.heatwave?.temperature
                ? `${data.summary.heatwave.temperature}°C`
                : '--°C'
            },
            {
              label: 'Alert Level',
              value: data?.summary?.heatwave?.status || 'Normal',
              highlight: data?.summary?.heatwave?.status !== 'normal'
            }
          ]}
        />

        {/* Flood Card */}
        <ModuleCard
          title="Flood Risk"
          icon={CloudRain}
          color="blue"
          path="/flood"
          status={data?.summary?.flood?.riskLevel || 'low'}
          metrics={[
            {
              label: 'Risk Level',
              value: (data?.summary?.flood?.riskLevel || 'low').charAt(0).toUpperCase() +
                     (data?.summary?.flood?.riskLevel || 'low').slice(1)
            },
            {
              label: 'Active Alerts',
              value: data?.summary?.flood?.activeAlerts || 0,
              highlight: (data?.summary?.flood?.activeAlerts || 0) > 0
            }
          ]}
        />

        {/* Air Quality Card */}
        <ModuleCard
          title="Air Quality"
          icon={Wind}
          color="purple"
          path="/air-quality"
          status={data?.summary?.airQuality?.category || 'unknown'}
          metrics={[
            {
              label: 'AQI',
              value: data?.summary?.airQuality?.aqi || '--'
            },
            {
              label: 'Category',
              value: (data?.summary?.airQuality?.category || 'Unknown')
                .replace('_', ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
            }
          ]}
        />

        {/* Water Quality Card */}
        <ModuleCard
          title="Water Quality"
          icon={Droplets}
          color="cyan"
          path="/water-quality"
          status={data?.summary?.waterQuality?.safe ? 'safe' : 'check'}
          metrics={[
            {
              label: 'Status',
              value: data?.summary?.waterQuality?.safe ? 'Safe' : 'Check Quality'
            },
            {
              label: 'WQI',
              value: data?.summary?.waterQuality?.index || '--'
            }
          ]}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction
            label="Emergency Contacts"
            path="/flood"
            color="red"
          />
          <QuickAction
            label="Report Issue"
            path="/report/new"
            color="green"
          />
          <QuickAction
            label="Heatwave Guidelines"
            path="/heatwave"
            color="orange"
          />
          <QuickAction
            label="Safe Routes"
            path="/flood"
            color="blue"
          />
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InfoCard
          title="Data Sources"
          items={[
            'India Meteorological Department (IMD)',
            'Central Pollution Control Board (CPCB)',
            'State Pollution Boards',
            'OpenWeather API'
          ]}
        />
        <InfoCard
          title="Update Frequency"
          items={[
            'Weather: Every hour',
            'AQI: Every hour',
            'Flood Risk: Real-time',
            'Water Quality: Daily'
          ]}
        />
        <InfoCard
          title="Coverage"
          items={[
            '20+ Major Cities',
            'All State Capitals',
            'Expanding to Tier-2 cities',
            'Rural areas coming soon'
          ]}
        />
      </div>
    </div>
  );
}

function ModuleCard({ title, icon: Icon, color, path, status, metrics }) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 hover:border-red-300',
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-300',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-300',
    cyan: 'bg-cyan-50 border-cyan-200 hover:border-cyan-300',
  };

  const iconColors = {
    red: 'text-red-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    cyan: 'text-cyan-500',
  };

  return (
    <Link
      to={path}
      className={`block p-5 rounded-xl border-2 transition-all card-hover ${colorClasses[color]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm`}>
            <Icon className={`w-6 h-6 ${iconColors[color]}`} />
          </div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, idx) => (
          <div key={idx}>
            <p className="text-xs text-gray-500 mb-1">{metric.label}</p>
            <p className={`font-semibold ${metric.highlight ? 'text-red-600' : 'text-gray-800'}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>
    </Link>
  );
}

function QuickAction({ label, path, color }) {
  const colors = {
    red: 'bg-red-100 text-red-700 hover:bg-red-200',
    green: 'bg-green-100 text-green-700 hover:bg-green-200',
    orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  };

  return (
    <Link
      to={path}
      className={`px-4 py-3 rounded-lg text-center text-sm font-medium transition-colors ${colors[color]}`}
    >
      {label}
    </Link>
  );
}

function InfoCard({ title, items }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
