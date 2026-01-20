import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import INDIA_LOCATIONS, { searchLocations, getLocationByName } from '../data/locations';

export default function CitySelector() {
  const { city, setCity, setLocationData } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('search'); // 'search', 'states', 'districts'
  const [selectedState, setSelectedState] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        resetView();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (search.length >= 2) {
      const results = searchLocations(search);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const resetView = () => {
    setView('search');
    setSelectedState(null);
    setSearch('');
  };

  const handleSelect = (location) => {
    setCity(location.name);
    if (setLocationData) {
      setLocationData({
        name: location.name,
        state: location.state,
        lat: location.lat,
        lng: location.lng
      });
    }
    setIsOpen(false);
    resetView();
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setView('districts');
  };

  const handleDistrictSelect = (district, state) => {
    handleSelect({
      name: district.name,
      state: state.name,
      lat: district.lat,
      lng: district.lng
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
      >
        <MapPin className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700">{city}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
          {/* Header */}
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            {view === 'search' && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search any location in India..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            )}
            {view === 'states' && (
              <div className="flex items-center gap-2">
                <button onClick={resetView} className="p-1 hover:bg-gray-200 rounded">
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="font-medium text-gray-700">Select State</span>
              </div>
            )}
            {view === 'districts' && selectedState && (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('states')} className="p-1 hover:bg-gray-200 rounded">
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="font-medium text-gray-700">{selectedState.name}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="max-h-72 overflow-y-auto">
            {/* Search Results */}
            {view === 'search' && search.length >= 2 && (
              searchResults.length > 0 ? (
                searchResults.map((loc, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(loc)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                      loc.name === city ? 'bg-blue-50' : ''
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className={`text-sm ${loc.name === city ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>
                        {loc.name}
                      </p>
                      <p className="text-xs text-gray-500">{loc.state}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-gray-500 text-center">
                  No locations found for "{search}"
                </div>
              )
            )}

            {/* Browse by State Button */}
            {view === 'search' && search.length < 2 && (
              <>
                <button
                  onClick={() => setView('states')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Browse by State</p>
                      <p className="text-xs text-gray-500">Select state → district</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                {/* Popular Cities */}
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Popular Cities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Kolkata'].map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          const loc = getLocationByName(c);
                          if (loc) handleSelect(loc);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                          c === city
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tamil Nadu Quick Access */}
                <div className="px-3 py-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tamil Nadu</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Ariyalur', 'Perambalur', 'Thanjavur', 'Tiruchirappalli', 'Salem'].map(c => (
                      <button
                        key={c}
                        onClick={() => {
                          const loc = getLocationByName(c);
                          if (loc) handleSelect(loc);
                        }}
                        className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                          c === city
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* States List */}
            {view === 'states' && (
              INDIA_LOCATIONS.states.map((state) => (
                <button
                  key={state.code}
                  onClick={() => handleStateSelect(state)}
                  className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm text-gray-700">{state.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{state.districts.length} districts</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))
            )}

            {/* Districts List */}
            {view === 'districts' && selectedState && (
              selectedState.districts
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((district) => (
                  <button
                    key={district.name}
                    onClick={() => handleDistrictSelect(district, selectedState)}
                    className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                      district.name === city ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-sm">{district.name}</span>
                  </button>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
