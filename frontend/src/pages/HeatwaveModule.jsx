import { useState, useEffect } from 'react';
import {
  Thermometer,
  Droplets,
  MapPin,
  Phone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Building2
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { heatwaveAPI } from '../services/api';

export default function HeatwaveModule() {
  const { city } = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [guidelines, setGuidelines] = useState(null);
  const [alertLevels, setAlertLevels] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [city]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [currentRes, guidelinesRes, alertLevelsRes] = await Promise.allSettled([
        heatwaveAPI.getCurrent(city),
        heatwaveAPI.getGuidelines(),
        heatwaveAPI.getAlertLevels()
      ]);

      if (currentRes.status === 'fulfilled') {
        setData(currentRes.value.data.data);
      }
      if (guidelinesRes.status === 'fulfilled') {
        setGuidelines(guidelinesRes.value.data.guidelines);
      }
      if (alertLevelsRes.status === 'fulfilled') {
        setAlertLevels(alertLevelsRes.value.data.levels);
      }
    } catch (error) {
      console.error('Error fetching heatwave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (level) => {
    const colors = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      orange: 'bg-orange-500',
      red: 'bg-red-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Thermometer className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Heatwave Monitor</h1>
        </div>
        <p className="text-red-100">Real-time temperature and heatwave alerts for {city}</p>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Temperature Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Conditions</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Temperature"
              value={data?.temperature?.current ? `${data.temperature.current}°C` : '--'}
              icon={Thermometer}
              color="text-red-500"
            />
            <StatCard
              label="Feels Like"
              value={data?.temperature?.feelsLike ? `${data.temperature.feelsLike}°C` : '--'}
              icon={Thermometer}
              color="text-orange-500"
            />
            <StatCard
              label="Heat Index"
              value={data?.heatIndex ? `${data.heatIndex}°C` : '--'}
              icon={Thermometer}
              color="text-amber-500"
            />
            <StatCard
              label="Humidity"
              value={data?.humidity ? `${data.humidity}%` : '--'}
              icon={Droplets}
              color="text-blue-500"
            />
          </div>
        </div>

        {/* Alert Level Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Alert Level</h2>

          <div className="flex flex-col items-center">
            <div className={`w-24 h-24 rounded-full ${getAlertColor(data?.alertLevel)} flex items-center justify-center mb-3`}>
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <p className="text-xl font-bold text-gray-800 capitalize">
              {data?.alertLevel || 'Unknown'}
            </p>
            <p className="text-sm text-gray-500 text-center mt-2">
              {data?.alertLevel === 'red' && 'Severe heatwave - Stay indoors'}
              {data?.alertLevel === 'orange' && 'Warning - Limit outdoor activities'}
              {data?.alertLevel === 'yellow' && 'Caution - Stay hydrated'}
              {data?.alertLevel === 'green' && 'Normal - Take usual precautions'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {['overview', 'guidelines', 'cooling-centers', 'alert-levels'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-red-600 border-b-2 border-red-500 bg-red-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Heatwave Overview</h3>
              <p className="text-gray-600">
                A heatwave is a period of abnormally high temperatures, often accompanied by high humidity.
                It can pose serious health risks, especially for vulnerable groups like children, elderly,
                and outdoor workers.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">Who is at risk?</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>- Elderly people (65+)</li>
                    <li>- Infants and young children</li>
                    <li>- Outdoor workers</li>
                    <li>- People with chronic diseases</li>
                    <li>- Pregnant women</li>
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">Heat Stroke Symptoms</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {guidelines?.symptoms?.slice(0, 5).map((s, i) => (
                      <li key={i}>- {s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'guidelines' && guidelines && (
            <div className="space-y-6">
              {/* Do's */}
              <div>
                <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Do's During Heatwave
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {guidelines.dos?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 bg-green-50 p-3 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Don'ts */}
              <div>
                <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Don'ts During Heatwave
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {guidelines.donts?.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 p-3 rounded-lg">
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Steps */}
              <div>
                <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Emergency First Aid
                </h3>
                <div className="bg-amber-50 rounded-lg p-4">
                  <ol className="space-y-2">
                    {guidelines.emergencySteps?.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-amber-800">
                        <span className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-medium flex-shrink-0">
                          {idx + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cooling-centers' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Nearby Cooling Centers & Hospitals</h3>

              {data?.coolingCenters?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.coolingCenters.map((center, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Building2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-medium text-gray-800">{center.name}</h4>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {center.address}
                          </p>
                          {center.timings && (
                            <p className="text-sm text-gray-500 mt-1">Timings: {center.timings}</p>
                          )}
                          <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                            center.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {center.isOpen ? 'Open' : 'Closed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No cooling centers data available for {city}
                </p>
              )}

              {data?.hospitals?.length > 0 && (
                <>
                  <h3 className="font-semibold text-gray-800 mt-6">Nearby Hospitals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.hospitals.map((hospital, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Building2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="font-medium text-gray-800">{hospital.name}</h4>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {hospital.address}
                            </p>
                            {hospital.phone && (
                              <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {hospital.phone}
                              </p>
                            )}
                            {hospital.hasEmergency && (
                              <span className="inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                24/7 Emergency
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'alert-levels' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Heatwave Alert Levels</h3>
              <div className="space-y-3">
                {alertLevels.map((level, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200">
                    <div className={`w-12 h-12 rounded-full ${getAlertColor(level.level)} flex items-center justify-center`}>
                      <Thermometer className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {level.name} ({level.level.toUpperCase()})
                      </h4>
                      <p className="text-sm text-gray-600">Temperature: {level.temperature}</p>
                      <p className="text-sm text-gray-600">Heat Index: {level.heatIndex}</p>
                      <p className="text-sm text-gray-500 mt-1">Action: {level.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
