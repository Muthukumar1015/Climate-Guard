import { useState, useEffect } from 'react';
import { Wind, Activity, Leaf, AlertCircle, Heart } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { airQualityAPI } from '../services/api';

export default function AirQualityModule() {
  const { city } = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [bioRemediation, setBioRemediation] = useState(null);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [city]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [currentRes, recsRes, bioRes, catsRes] = await Promise.allSettled([
        airQualityAPI.getCurrent(city),
        airQualityAPI.getHealthRecommendations(city),
        airQualityAPI.getBioRemediation(city),
        airQualityAPI.getCategories()
      ]);

      if (currentRes.status === 'fulfilled') setData(currentRes.value.data.data);
      if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value.data.recommendations);
      if (bioRes.status === 'fulfilled') setBioRemediation(bioRes.value.data.bioRemediation);
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value.data.categories);
    } catch (error) {
      console.error('Error fetching air quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAQIColor = (category) => {
    const colors = {
      good: '#22c55e',
      satisfactory: '#84cc16',
      moderate: '#eab308',
      poor: '#f97316',
      very_poor: '#ef4444',
      severe: '#991b1b'
    };
    return colors[category] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Wind className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Air Quality Index</h1>
        </div>
        <p className="text-purple-100">Real-time air pollution monitoring for {city}</p>
      </div>

      {/* AQI Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Current AQI</h2>

          <div className="flex items-center gap-8">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center"
              style={{ backgroundColor: getAQIColor(data?.aqi?.category) + '20' }}
            >
              <div
                className="w-24 h-24 rounded-full flex flex-col items-center justify-center text-white"
                style={{ backgroundColor: getAQIColor(data?.aqi?.category) }}
              >
                <span className="text-3xl font-bold">{data?.aqi?.value || '--'}</span>
                <span className="text-xs">AQI</span>
              </div>
            </div>

            <div>
              <p className="text-xl font-semibold text-gray-800 capitalize">
                {data?.aqi?.category?.replace('_', ' ') || 'Unknown'}
              </p>
              <p className="text-gray-600 mt-1">
                Dominant Pollutant: {data?.dominantPollutant?.toUpperCase() || 'N/A'}
              </p>
              {recommendations && (
                <div className="mt-3 flex items-center gap-2">
                  {recommendations.maskRequired && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      Mask Required
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    recommendations.outdoorActivity === 'safe' ? 'bg-green-100 text-green-700' :
                    recommendations.outdoorActivity === 'reduce' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {recommendations.outdoorActivity === 'safe' ? 'Outdoor Safe' :
                     recommendations.outdoorActivity === 'reduce' ? 'Limit Outdoor' :
                     'Avoid Outdoor'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Health Advisory */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Health Advisory
          </h2>
          {recommendations && (
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium text-gray-700">General</p>
                <p className="text-gray-600">{recommendations.general}</p>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-700">Sensitive Groups</p>
                <p className="text-gray-600">{recommendations.sensitiveGroups}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pollutants Grid */}
      {data?.pollutants && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Pollutant Levels</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(data.pollutants).map(([key, pollutant]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 uppercase">{key}</p>
                <p className="text-lg font-bold text-gray-800">
                  {pollutant.value?.toFixed(1) || '--'}
                </p>
                <p className="text-xs text-gray-400">{pollutant.unit || 'µg/m³'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {['overview', 'health-tips', 'bio-remediation', 'aqi-scale'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50'
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
              <h3 className="font-semibold text-gray-800">Understanding Air Quality</h3>
              <p className="text-gray-600">
                The Air Quality Index (AQI) is a measure of how polluted the air is.
                Higher AQI values indicate greater air pollution and health concerns.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">Major Pollutants</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li><strong>PM2.5</strong> - Fine particles, most harmful</li>
                    <li><strong>PM10</strong> - Coarse particles</li>
                    <li><strong>NO2</strong> - Nitrogen dioxide from vehicles</li>
                    <li><strong>SO2</strong> - Sulfur dioxide from industry</li>
                    <li><strong>O3</strong> - Ground-level ozone</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Pollution Sources</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>Vehicle emissions (40%)</li>
                    <li>Industrial processes (25%)</li>
                    <li>Construction dust (15%)</li>
                    <li>Biomass burning (10%)</li>
                    <li>Other sources (10%)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health-tips' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">Health Protection Tips</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">When AQI is High</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      Avoid outdoor exercises and strenuous activities
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      Wear N95 mask when going outside
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      Keep windows and doors closed
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      Use air purifiers indoors
                    </li>
                  </ul>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">For Sensitive Groups</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      Children should stay indoors during high AQI
                    </li>
                    <li className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      Elderly should avoid morning walks
                    </li>
                    <li className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      Asthma patients must carry inhalers
                    </li>
                    <li className="flex items-start gap-2">
                      <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      Pregnant women should limit outdoor exposure
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bio-remediation' && bioRemediation && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" />
                Bio-Remediation Solutions
              </h3>
              <p className="text-gray-600">
                Natural solutions to improve air quality in your surroundings.
              </p>

              {bioRemediation.suggestions && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Recommended Actions</h4>
                  <ul className="space-y-2">
                    {bioRemediation.suggestions.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-green-700">
                        <Leaf className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {bioRemediation.indoorPlants && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-800 mb-3">Air-Purifying Indoor Plants</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bioRemediation.indoorPlants.map((plant, idx) => (
                      <div key={idx} className="border border-green-200 rounded-lg p-3 bg-green-50">
                        <p className="font-medium text-green-800">{plant.name}</p>
                        <p className="text-sm text-green-600">{plant.benefit}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'aqi-scale' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800">AQI Categories</h3>
              <div className="space-y-3">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border border-gray-200">
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: cat.color }}
                    >
                      {cat.range.split('-')[0]}+
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 capitalize">
                        {cat.category.replace('_', ' ')} ({cat.range})
                      </p>
                      <p className="text-sm text-gray-600">{cat.healthImplications}</p>
                      <p className="text-sm text-gray-500">{cat.cautionaryStatement}</p>
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
