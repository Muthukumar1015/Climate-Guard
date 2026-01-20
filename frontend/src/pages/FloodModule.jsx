import { useState, useEffect } from 'react';
import {
  CloudRain,
  MapPin,
  Phone,
  AlertTriangle,
  Navigation,
  Camera,
  Shield
} from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { floodAPI } from '../services/api';

export default function FloodModule() {
  const { city } = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [guidelines, setGuidelines] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [activeTab, setActiveTab] = useState('risk-map');

  useEffect(() => {
    fetchData();
  }, [city]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [riskRes, guidelinesRes, contactsRes] = await Promise.allSettled([
        floodAPI.getRiskMap(city),
        floodAPI.getGuidelines(),
        floodAPI.getEmergencyContacts(city)
      ]);

      if (riskRes.status === 'fulfilled') setData(riskRes.value.data);
      if (guidelinesRes.status === 'fulfilled') setGuidelines(guidelinesRes.value.data.guidelines);
      if (contactsRes.status === 'fulfilled') setEmergencyContacts(contactsRes.value.data.contacts);
    } catch (error) {
      console.error('Error fetching flood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const colors = {
      low: 'bg-green-500',
      moderate: 'bg-yellow-500',
      high: 'bg-orange-500',
      severe: 'bg-red-500'
    };
    return colors[level] || 'bg-gray-500';
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
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CloudRain className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Urban Flooding Monitor</h1>
        </div>
        <p className="text-blue-100">Flood risk assessment and safe routes for {city}</p>
      </div>

      {/* Risk Level Banner */}
      <div className={`rounded-xl p-4 ${
        data?.overallRisk === 'severe' ? 'bg-red-100 border-red-300' :
        data?.overallRisk === 'high' ? 'bg-orange-100 border-orange-300' :
        data?.overallRisk === 'moderate' ? 'bg-yellow-100 border-yellow-300' :
        'bg-green-100 border-green-300'
      } border`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full ${getRiskColor(data?.overallRisk)} flex items-center justify-center`}>
            <CloudRain className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">
              Current Risk Level: {(data?.overallRisk || 'unknown').charAt(0).toUpperCase() + (data?.overallRisk || 'unknown').slice(1)}
            </p>
            <p className="text-sm text-gray-600">
              {data?.waterloggedAreas?.length || 0} waterlogged areas reported
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {['risk-map', 'waterlogging', 'safe-routes', 'guidelines', 'emergency'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'risk-map' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Flood-Prone Areas</h3>
              {data?.floodProneAreas?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.floodProneAreas.map((area, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">{area.name}</h4>
                          <p className="text-sm text-gray-500">Historical floods: {area.historicalFloods}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          area.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                          area.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {area.riskLevel}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No flood-prone areas data available</p>
              )}
            </div>
          )}

          {activeTab === 'waterlogging' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Reported Waterlogging</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                  <Camera className="w-4 h-4" />
                  Report Waterlogging
                </button>
              </div>
              {data?.waterloggedAreas?.length > 0 ? (
                <div className="space-y-3">
                  {data.waterloggedAreas.map((area, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200">
                      <MapPin className={`w-5 h-5 flex-shrink-0 ${
                        area.severity === 'severe' ? 'text-red-500' :
                        area.severity === 'moderate' ? 'text-orange-500' :
                        'text-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{area.location}</h4>
                        <p className="text-sm text-gray-500">
                          Severity: {area.severity} |
                          {area.isVerified ? ' Verified' : ' Unverified'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No waterlogging reported in the last 24 hours</p>
              )}
            </div>
          )}

          {activeTab === 'safe-routes' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Safe Route Suggestions</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-3">
                  <Navigation className="w-5 h-5" />
                  <span className="font-medium">Route Finder</span>
                </div>
                <p className="text-sm text-blue-600">
                  Safe route suggestions help you avoid flooded areas during heavy rains.
                  Data is updated in real-time based on user reports and official sources.
                </p>
              </div>
              <p className="text-gray-500 text-center py-4">
                Enter origin and destination to find safe routes
              </p>
            </div>
          )}

          {activeTab === 'guidelines' && guidelines && (
            <div className="space-y-6">
              {['beforeFlood', 'duringFlood', 'afterFlood'].map((phase) => (
                <div key={phase}>
                  <h3 className="font-semibold text-gray-800 mb-3 capitalize">
                    {phase.replace('Flood', ' Flood')}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {guidelines[phase]?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'emergency' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Emergency Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergencyContacts.map((contact, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{contact.name}</h4>
                      <a href={`tel:${contact.phone}`} className="text-lg font-bold text-blue-600">
                        {contact.phone}
                      </a>
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
