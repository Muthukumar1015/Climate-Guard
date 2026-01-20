import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

const DEFAULT_CITY = 'Chennai';
const DEFAULT_LOCATION = {
  name: 'Chennai',
  state: 'Tamil Nadu',
  lat: 13.0827,
  lng: 80.2707
};

export function LocationProvider({ children }) {
  const [city, setCity] = useState(() => {
    return localStorage.getItem('selectedCity') || DEFAULT_CITY;
  });
  const [locationData, setLocationData] = useState(() => {
    const saved = localStorage.getItem('locationData');
    return saved ? JSON.parse(saved) : DEFAULT_LOCATION;
  });
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoading(false);
        },
        (error) => {
          console.log('Location access denied:', error.message);
          setLoading(false);
        }
      );
    } else {
      setLoading(false);
    }
  }, []);

  const updateCity = (newCity) => {
    setCity(newCity);
    localStorage.setItem('selectedCity', newCity);
  };

  const updateLocationData = (data) => {
    setLocationData(data);
    localStorage.setItem('locationData', JSON.stringify(data));
  };

  return (
    <LocationContext.Provider value={{
      city,
      setCity: updateCity,
      locationData,
      setLocationData: updateLocationData,
      coordinates,
      setCoordinates,
      loading
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
