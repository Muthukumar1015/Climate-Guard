import express from 'express';
import axios from 'axios';
import HeatwaveData from '../models/HeatwaveData.model.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Helper function to fetch weather from OpenWeather
async function fetchWeatherForLocation(city, lat, lng) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: { lat, lon: lng, appid: apiKey, units: 'metric' }
      }
    );
    return response.data;
  } catch (error) {
    console.error('OpenWeather API error:', error.message);
    return null;
  }
}

// Calculate heat index
function calculateHeatIndex(temp, humidity) {
  if (temp < 27) return temp;
  const c1 = -8.78469475556, c2 = 1.61139411, c3 = 2.33854883889;
  const c4 = -0.14611605, c5 = -0.012308094, c6 = -0.0164248277778;
  const c7 = 0.002211732, c8 = 0.00072546, c9 = -0.000003582;
  const heatIndex = c1 + (c2 * temp) + (c3 * humidity) + (c4 * temp * humidity) +
    (c5 * temp * temp) + (c6 * humidity * humidity) + (c7 * temp * temp * humidity) +
    (c8 * temp * humidity * humidity) + (c9 * temp * temp * humidity * humidity);
  return Math.round(heatIndex * 10) / 10;
}

// Get alert level
function getAlertLevel(temp, heatIndex) {
  if (temp >= 45 || heatIndex >= 52) return 'red';
  if (temp >= 40 || heatIndex >= 45) return 'orange';
  if (temp >= 37 || heatIndex >= 40) return 'yellow';
  return 'green';
}

// Get current heatwave data for a city
router.get('/current/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { lat, lng } = req.query;

    // First try to find in database
    let data = await HeatwaveData.findOne({ city: new RegExp(city, 'i') })
      .sort({ recordedAt: -1 });

    // If no data or data is old (> 1 hour), fetch fresh data
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!data || data.recordedAt < oneHourAgo) {
      // Use provided coordinates or try to geocode
      let latitude = lat ? parseFloat(lat) : null;
      let longitude = lng ? parseFloat(lng) : null;

      if (!latitude || !longitude) {
        // Try to geocode the city
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (apiKey) {
          try {
            const geoRes = await axios.get(
              `https://api.openweathermap.org/geo/1.0/direct`,
              { params: { q: `${city},IN`, limit: 1, appid: apiKey } }
            );
            if (geoRes.data && geoRes.data[0]) {
              latitude = geoRes.data[0].lat;
              longitude = geoRes.data[0].lon;
            }
          } catch (e) {
            console.error('Geocoding error:', e.message);
          }
        }
      }

      if (latitude && longitude) {
        const weatherData = await fetchWeatherForLocation(city, latitude, longitude);
        if (weatherData) {
          const temp = weatherData.main.temp;
          const humidity = weatherData.main.humidity;
          const heatIndex = calculateHeatIndex(temp, humidity);
          const alertLevel = getAlertLevel(temp, heatIndex);

          data = await HeatwaveData.create({
            city: city,
            state: '',
            coordinates: { lat: latitude, lng: longitude },
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
        }
      }
    }

    if (!data) {
      return res.status(404).json({ error: 'No data available for this city' });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get heatwave forecast
router.get('/forecast/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { days = 7 } = req.query;

    const data = await HeatwaveData.findOne({ city: new RegExp(city, 'i') })
      .select('city state forecast')
      .sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No forecast available' });
    }

    res.json({
      city: data.city,
      state: data.state,
      forecast: data.forecast.slice(0, parseInt(days))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nearby cooling centers
router.get('/cooling-centers/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { lat, lng } = req.query;

    const data = await HeatwaveData.findOne({ city: new RegExp(city, 'i') })
      .select('coolingCenters hospitals')
      .sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No data available' });
    }

    res.json({
      coolingCenters: data.coolingCenters.filter(c => c.isOpen),
      hospitals: data.hospitals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get heatwave guidelines
router.get('/guidelines', async (req, res) => {
  try {
    const guidelines = {
      dos: [
        'Drink plenty of water even if not thirsty',
        'Wear lightweight, light-colored, loose clothing',
        'Stay indoors during peak heat hours (12 PM - 4 PM)',
        'Use ORS (Oral Rehydration Solution) if feeling dizzy',
        'Keep rooms cool with fans or AC',
        'Eat light meals, avoid heavy or hot foods',
        'Check on elderly neighbors and family members',
        'Carry water bottle when going outside'
      ],
      donts: [
        'Do not leave children or pets in parked vehicles',
        'Avoid strenuous outdoor activities during peak hours',
        'Do not consume alcohol or caffeinated drinks',
        'Avoid direct sunlight exposure',
        'Do not ignore symptoms like dizziness, nausea, or headache',
        'Avoid cooking during peak heat hours if possible'
      ],
      symptoms: [
        'Heavy sweating',
        'Weakness or tiredness',
        'Dizziness or fainting',
        'Nausea or vomiting',
        'Headache',
        'Muscle cramps',
        'Rapid heartbeat'
      ],
      emergencySteps: [
        'Move to a cool place immediately',
        'Apply cold water on head and neck',
        'Drink cool water or ORS',
        'Fan the person to lower body temperature',
        'Call emergency services if symptoms persist'
      ]
    };

    res.json({ guidelines });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alert level explanation
router.get('/alert-levels', async (req, res) => {
  res.json({
    levels: [
      {
        level: 'green',
        name: 'Normal',
        temperature: 'Below 37°C',
        heatIndex: 'Below 40°C',
        action: 'Normal precautions'
      },
      {
        level: 'yellow',
        name: 'Caution',
        temperature: '37-40°C',
        heatIndex: '40-45°C',
        action: 'Stay hydrated, limit outdoor exposure'
      },
      {
        level: 'orange',
        name: 'Warning',
        temperature: '40-45°C',
        heatIndex: '45-52°C',
        action: 'Avoid outdoor activities, high risk for vulnerable groups'
      },
      {
        level: 'red',
        name: 'Severe',
        temperature: 'Above 45°C',
        heatIndex: 'Above 52°C',
        action: 'Stay indoors, emergency alert, check on vulnerable people'
      }
    ]
  });
});

// Admin: Update heatwave data
router.post('/update', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const data = await HeatwaveData.create(req.body);
    res.status(201).json({ message: 'Data updated', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Add cooling center
router.post('/cooling-centers/:city', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const { city } = req.params;
    const coolingCenter = req.body;

    const data = await HeatwaveData.findOneAndUpdate(
      { city: new RegExp(city, 'i') },
      { $push: { coolingCenters: coolingCenter } },
      { new: true, sort: { recordedAt: -1 } }
    );

    res.json({ message: 'Cooling center added', coolingCenters: data.coolingCenters });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
