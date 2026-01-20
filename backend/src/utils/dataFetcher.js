import axios from 'axios';
import HeatwaveData from '../models/HeatwaveData.model.js';
import AirQuality from '../models/AirQuality.model.js';
import FloodData from '../models/FloodData.model.js';
import Alert from '../models/Alert.model.js';
import logger from './logger.js';

// Major Indian cities for data fetching
const CITIES = [
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { name: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 }
];

// Fetch weather data from OpenWeather API
async function fetchWeatherData(city) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      logger.warn('OpenWeather API key not configured');
      return null;
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          lat: city.lat,
          lon: city.lng,
          appid: apiKey,
          units: 'metric'
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch weather for ${city.name}:`, error.message);
    return null;
  }
}

// Fetch AQI data from OpenWeather API
async function fetchAQIData(city) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      logger.warn('OpenWeather API key not configured');
      return null;
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution`,
      {
        params: {
          lat: city.lat,
          lon: city.lng,
          appid: apiKey
        }
      }
    );

    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch AQI for ${city.name}:`, error.message);
    return null;
  }
}

// Calculate heat index
function calculateHeatIndex(temp, humidity) {
  // Simplified heat index calculation
  if (temp < 27) return temp;

  const c1 = -8.78469475556;
  const c2 = 1.61139411;
  const c3 = 2.33854883889;
  const c4 = -0.14611605;
  const c5 = -0.012308094;
  const c6 = -0.0164248277778;
  const c7 = 0.002211732;
  const c8 = 0.00072546;
  const c9 = -0.000003582;

  const heatIndex = c1 + (c2 * temp) + (c3 * humidity) +
    (c4 * temp * humidity) + (c5 * temp * temp) +
    (c6 * humidity * humidity) + (c7 * temp * temp * humidity) +
    (c8 * temp * humidity * humidity) + (c9 * temp * temp * humidity * humidity);

  return Math.round(heatIndex * 10) / 10;
}

// Determine heatwave alert level
function getHeatwaveAlertLevel(temp, heatIndex) {
  if (temp >= 45 || heatIndex >= 52) return 'red';
  if (temp >= 40 || heatIndex >= 45) return 'orange';
  if (temp >= 37 || heatIndex >= 40) return 'yellow';
  return 'green';
}

// Convert OpenWeather AQI to Indian AQI scale
function convertToIndianAQI(aqiData) {
  if (!aqiData?.list?.[0]) return null;

  const components = aqiData.list[0].components;
  const pm25 = components.pm2_5;
  const pm10 = components.pm10;

  // Simplified conversion - in reality, use proper breakpoint conversion
  let aqi = Math.max(pm25 * 2, pm10); // Rough approximation

  let category;
  if (aqi <= 50) category = 'good';
  else if (aqi <= 100) category = 'satisfactory';
  else if (aqi <= 200) category = 'moderate';
  else if (aqi <= 300) category = 'poor';
  else if (aqi <= 400) category = 'very_poor';
  else category = 'severe';

  return {
    value: Math.round(aqi),
    category,
    pollutants: {
      pm25: { value: pm25 },
      pm10: { value: pm10 },
      no2: { value: components.no2 },
      so2: { value: components.so2 },
      co: { value: components.co / 1000 }, // Convert to mg/m³
      o3: { value: components.o3 },
      nh3: { value: components.nh3 }
    }
  };
}

// Main data fetcher function
export async function fetchExternalData() {
  logger.info('Starting external data fetch...');

  for (const city of CITIES) {
    try {
      // Fetch weather data
      const weatherData = await fetchWeatherData(city);
      if (weatherData) {
        const temp = weatherData.main.temp;
        const humidity = weatherData.main.humidity;
        const heatIndex = calculateHeatIndex(temp, humidity);
        const alertLevel = getHeatwaveAlertLevel(temp, heatIndex);

        await HeatwaveData.create({
          city: city.name,
          state: city.state,
          coordinates: { lat: city.lat, lng: city.lng },
          temperature: {
            current: temp,
            feelsLike: weatherData.main.feels_like,
            min: weatherData.main.temp_min,
            max: weatherData.main.temp_max
          },
          heatIndex,
          humidity,
          alertLevel,
          source: 'OpenWeather',
          recordedAt: new Date()
        });

        // Create alert if needed
        if (alertLevel === 'red' || alertLevel === 'orange') {
          await Alert.create({
            type: 'heatwave',
            severity: alertLevel === 'red' ? 'emergency' : 'warning',
            title: `Heatwave ${alertLevel === 'red' ? 'Emergency' : 'Warning'} - ${city.name}`,
            message: `Temperature: ${temp}°C, Heat Index: ${heatIndex}°C`,
            city: city.name,
            state: city.state,
            validFrom: new Date(),
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
            issuedBy: 'system',
            metadata: { temperature: temp }
          });
        }

        logger.info(`Updated heatwave data for ${city.name}`);
      }

      // Fetch AQI data
      const aqiData = await fetchAQIData(city);
      if (aqiData) {
        const convertedAQI = convertToIndianAQI(aqiData);

        if (convertedAQI) {
          await AirQuality.create({
            city: city.name,
            state: city.state,
            coordinates: { lat: city.lat, lng: city.lng },
            aqi: {
              value: convertedAQI.value,
              category: convertedAQI.category
            },
            pollutants: convertedAQI.pollutants,
            source: 'OpenWeather',
            recordedAt: new Date()
          });

          // Create alert if AQI is poor or worse
          if (['poor', 'very_poor', 'severe'].includes(convertedAQI.category)) {
            await Alert.create({
              type: 'air_quality',
              severity: convertedAQI.category === 'severe' ? 'emergency' :
                convertedAQI.category === 'very_poor' ? 'critical' : 'warning',
              title: `Air Quality Alert - ${city.name}`,
              message: `AQI: ${convertedAQI.value} (${convertedAQI.category.replace('_', ' ')})`,
              city: city.name,
              state: city.state,
              validFrom: new Date(),
              validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000),
              issuedBy: 'system',
              metadata: { aqi: convertedAQI.value }
            });
          }

          logger.info(`Updated AQI data for ${city.name}`);
        }
      }

      // Add small delay between cities to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logger.error(`Error processing ${city.name}:`, error.message);
    }
  }

  logger.info('External data fetch completed');
}

export default { fetchExternalData };
