import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cron from 'node-cron';
import axios from 'axios';

// Import routes
import authRoutes from './routes/auth.routes.js';
import heatwaveRoutes from './routes/heatwave.routes.js';
import floodRoutes from './routes/flood.routes.js';
import airQualityRoutes from './routes/airQuality.routes.js';
import waterQualityRoutes from './routes/waterQuality.routes.js';
import alertRoutes from './routes/alert.routes.js';
import reportRoutes from './routes/report.routes.js';

// Import utils
import { fetchExternalData } from './utils/dataFetcher.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static('public/uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/heatwave', heatwaveRoutes);
app.use('/api/flood', floodRoutes);
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/water-quality', waterQualityRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ClimateGuard API',
    dbConnected
  });
});

// Manual data fetch trigger
app.get('/api/fetch-data', async (req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'Database not connected' });
  }
  try {
    await fetchExternalData();
    res.json({ message: 'Data fetch completed', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Fetch weather from OpenWeather
async function fetchLiveWeather(city, lat, lng) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    // Get coordinates if not provided
    let latitude = lat, longitude = lng;
    if (!latitude || !longitude) {
      const geoRes = await axios.get(
        `https://api.openweathermap.org/geo/1.0/direct`,
        { params: { q: `${city},IN`, limit: 1, appid: apiKey } }
      );
      if (geoRes.data && geoRes.data[0]) {
        latitude = geoRes.data[0].lat;
        longitude = geoRes.data[0].lon;
      }
    }

    if (!latitude || !longitude) return null;

    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      { params: { lat: latitude, lon: longitude, appid: apiKey, units: 'metric' } }
    );

    const data = weatherRes.data;
    const temp = data.main.temp;
    const humidity = data.main.humidity;

    // Calculate heat index
    let heatIndex = temp;
    if (temp >= 27) {
      const c1 = -8.78469475556, c2 = 1.61139411, c3 = 2.33854883889;
      const c4 = -0.14611605, c5 = -0.012308094, c6 = -0.0164248277778;
      const c7 = 0.002211732, c8 = 0.00072546, c9 = -0.000003582;
      heatIndex = c1 + (c2 * temp) + (c3 * humidity) + (c4 * temp * humidity) +
        (c5 * temp * temp) + (c6 * humidity * humidity) + (c7 * temp * temp * humidity) +
        (c8 * temp * humidity * humidity) + (c9 * temp * temp * humidity * humidity);
      heatIndex = Math.round(heatIndex * 10) / 10;
    }

    // Get alert level
    let alertLevel = 'green';
    if (temp >= 45 || heatIndex >= 52) alertLevel = 'red';
    else if (temp >= 40 || heatIndex >= 45) alertLevel = 'orange';
    else if (temp >= 37 || heatIndex >= 40) alertLevel = 'yellow';

    return { temp, humidity, heatIndex, alertLevel, feelsLike: data.main.feels_like };
  } catch (error) {
    console.error('Live weather fetch error:', error.message);
    return null;
  }
}

// Generate water quality data for dashboard
function generateWaterQuality(city) {
  const hash = city.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min, max, seed = 0) => {
    const x = Math.sin(hash + seed) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  const ph = rand(6.8, 8.2, 1);
  const dissolvedOxygen = rand(5, 8, 2);
  const bod = rand(1, 4, 3);
  const turbidity = rand(1, 8, 4);
  const totalColiform = rand(10, 80, 5);

  let wqiValue = 0;
  wqiValue += ph >= 6.5 && ph <= 8.5 ? 10 : 20;
  wqiValue += dissolvedOxygen >= 6 ? 10 : 15;
  wqiValue += bod <= 3 ? 10 : 20;
  wqiValue += turbidity <= 5 ? 10 : 15;
  wqiValue += totalColiform <= 50 ? 10 : 20;

  let category = 'excellent';
  if (wqiValue > 75) category = 'poor';
  else if (wqiValue > 50) category = 'fair';
  else if (wqiValue > 25) category = 'good';

  return { wqi: Math.round(wqiValue), category, safe: wqiValue <= 50 };
}

// Dashboard summary endpoint
app.get('/api/dashboard/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { lat, lng } = req.query;

    // Import models dynamically to avoid circular dependencies
    const HeatwaveData = (await import('./models/HeatwaveData.model.js')).default;
    const AirQuality = (await import('./models/AirQuality.model.js')).default;
    const WaterQuality = (await import('./models/WaterQuality.model.js')).default;
    const Alert = (await import('./models/Alert.model.js')).default;

    // Fetch latest data from database
    let [heatwaveData, airQualityData, waterQualityData, activeAlerts] = await Promise.all([
      HeatwaveData.findOne({ city: new RegExp(city, 'i') }).sort({ recordedAt: -1 }),
      AirQuality.findOne({ city: new RegExp(city, 'i') }).sort({ recordedAt: -1 }),
      WaterQuality.findOne({ city: new RegExp(city, 'i') }).sort({ recordedAt: -1 }),
      Alert.countDocuments({ city: new RegExp(city, 'i'), isActive: true })
    ]);

    // If no heatwave data, fetch live from OpenWeather
    let liveWeather = null;
    if (!heatwaveData || !heatwaveData.temperature?.current) {
      liveWeather = await fetchLiveWeather(city, lat, lng);
    }

    // If no water quality data, generate simulated data
    let waterData = null;
    if (!waterQualityData) {
      waterData = generateWaterQuality(city);
    }

    res.json({
      city,
      timestamp: new Date().toISOString(),
      summary: {
        heatwave: {
          status: heatwaveData?.alertLevel || liveWeather?.alertLevel || 'normal',
          temperature: heatwaveData?.temperature?.current || liveWeather?.temp || null,
          heatIndex: heatwaveData?.heatIndex || liveWeather?.heatIndex || null,
          humidity: heatwaveData?.humidity || liveWeather?.humidity || null
        },
        flood: { riskLevel: 'low', activeAlerts: activeAlerts },
        airQuality: {
          aqi: airQualityData?.aqi?.value || null,
          category: airQualityData?.aqi?.category || 'unknown'
        },
        waterQuality: {
          index: waterQualityData?.wqi?.value || waterData?.wqi || null,
          category: waterQualityData?.wqi?.category || waterData?.category || 'unknown',
          safe: waterQualityData?.isSafeForDrinking ?? waterData?.safe ?? true
        }
      }
    });
  } catch (error) {
    logger.error('Dashboard error:', error.message);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Database connection (optional)
let dbConnected = false;

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/climateguard';
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    logger.info('MongoDB connected successfully');
    dbConnected = true;
  } catch (error) {
    console.log('MongoDB not available - running in demo mode');
    console.log('To enable full functionality, start MongoDB');
    dbConnected = false;
  }
};

// Scheduled tasks - fetch external data every hour (only if DB connected)
cron.schedule('0 * * * *', async () => {
  if (dbConnected) {
    logger.info('Running scheduled data fetch...');
    await fetchExternalData();
  }
});

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, async () => {
    logger.info(`ClimateGuard API running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    if (!dbConnected) {
      logger.info('Running in DEMO MODE - API returns sample data');
    } else {
      // Fetch data on startup
      logger.info('Fetching initial data...');
      await fetchExternalData();
    }
  });
};

startServer();

export default app;
