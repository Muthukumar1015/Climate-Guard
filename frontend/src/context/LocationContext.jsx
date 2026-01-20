import { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

const DEFAULT_CITY = 'Delhi';

export function LocationProvider({ children }) {
  const [city, setCity] = useState(() => {
    return localStorage.getItem('selectedCity') || DEFAULT_CITY;
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

  return (
    <LocationContext.Provider value={{
      city,
      setCity: updateCity,
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
