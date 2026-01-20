import { useState, useEffect } from 'react';
import { Droplets, AlertCircle, Leaf, Building2, FileText } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { waterQualityAPI } from '../services/api';

export default function WaterQualityModule() {
  const { city } = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [standards, setStandards] = useState(null);
  const [bioRemediation, setBioRemediation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [city]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [currentRes, standardsRes, bioRes] = await Promise.allSettled([
        waterQualityAPI.getCurrent(city),
        waterQualityAPI.getStandards(),
        waterQualityAPI.getBioRemediation()
      ]);

      if (currentRes.status === 'fulfilled') setData(currentRes.value.data.data || []);
      if (standardsRes.status === 'fulfilled') setStandards(standardsRes.value.data);
      if (bioRes.status === 'fulfilled') setBioRemediation(bioRes.value.data);
    } catch (error) {
      console.error('Error fetching water quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWQIColor = (category) => {
    const colors = {
      excellent: '#22c55e',
      good: '#84cc16',
      fair: '#eab308',
      poor: '#f97316',
      very_poor: '#ef4444'
    };
    return colors[category] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Droplets className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Water Quality Monitor</h1>
        </div>
        <p className="text-cyan-100">Water quality assessment for {city}</p>
      </div>

      {/* Water Bodies Grid */}
      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, idx) => (
            <div key={idx} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{item.waterBody?.name || 'Unknown'}</h3>
                  <p className="text-sm text-gray-500 capitalize">{item.waterBody?.type?.replace('_', ' ')}</p>
                </div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: getWQIColor(item.wqi?.category) }}
                >
                  {item.wqi?.value || '--'}
                </div>
              </div>

              <div className="flex gap-2 mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.isSafeForDrinking ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.isSafeForDrinking ? 'Safe for Drinking' : 'Not Drinkable'}
                </span>
                {item.waterBody?.type !== 'tap_water' && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.isSafeForBathing ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.isSafeForBathing ? 'Safe for Bathing' : 'No Bathing'}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 capitalize">
                Quality: {item.wqi?.category?.replace('_', ' ') || 'Unknown'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <Droplets className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No water quality data available for {city}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {['overview', 'safety-tips', 'bio-remediation', 'standards', 'report'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50'
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
              <h3 className="font-semibold text-gray-800">Understanding Water Quality</h3>
              <p className="text-gray-600">
                The Water Quality Index (WQI) is a measure that indicates the overall quality of water
                based on multiple parameters like pH, dissolved oxygen, and contaminants.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-cyan-50 rounded-lg p-4">
                  <h4 className="font-medium text-cyan-800 mb-2">Key Parameters</h4>
                  <ul className="text-sm text-cyan-700 space-y-1">
                    <li><strong>pH</strong> - Acidity/alkalinity (6.5-8.5 safe)</li>
                    <li><strong>DO</strong> - Dissolved Oxygen (min 6 mg/L)</li>
                    <li><strong>BOD</strong> - Biochemical Oxygen Demand</li>
                    <li><strong>Turbidity</strong> - Cloudiness of water</li>
                    <li><strong>Coliform</strong> - Bacterial contamination</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Common Contaminants</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>Industrial effluents</li>
                    <li>Sewage discharge</li>
                    <li>Agricultural runoff</li>
                    <li>Heavy metals (lead, arsenic)</li>
                    <li>Microplastics</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety-tips' && bioRemediation && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Water Safety Tips</h3>
              <div className="bg-cyan-50 rounded-lg p-4">
                <ul className="space-y-2">
                  {bioRemediation.safetyTips?.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-cyan-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'bio-remediation' && bioRemediation && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" />
                Bio-Remediation Methods
              </h3>
              <p className="text-gray-600">
                Natural and biological methods to treat and purify contaminated water.
              </p>
              <div className="space-y-3">
                {bioRemediation.methods?.map((method, idx) => (
                  <div key={idx} className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h4 className="font-medium text-green-800">{method.name}</h4>
                    <p className="text-sm text-green-700 mt-1">{method.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-green-600">
                      <span>Effectiveness: {method.effectiveness}</span>
                      <span>Use: {method.applicability}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'standards' && standards && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Water Quality Standards (BIS)</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-gray-600">Parameter</th>
                      <th className="px-4 py-2 text-left text-gray-600">Drinking Water</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(standards.standards?.drinking || {}).map(([key, value]) => (
                      <tr key={key} className="border-b border-gray-100">
                        <td className="px-4 py-2 font-medium text-gray-800 capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {value.min !== undefined && `Min: ${value.min} `}
                          {value.max !== undefined && `Max: ${value.max}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <h4 className="font-medium text-gray-800 mb-3">WQI Categories</h4>
                <div className="flex flex-wrap gap-2">
                  {standards.wqiCategories?.map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-white text-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.category} ({cat.range})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-500" />
                Report Water Pollution
              </h3>
              <p className="text-gray-600">
                Help monitor water quality by reporting pollution in your area.
              </p>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-gray-500 mb-4">Login to report water pollution issues</p>
                <button className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
                  Submit Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
