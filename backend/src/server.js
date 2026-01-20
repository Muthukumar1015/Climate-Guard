import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cron from 'node-cron';

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

// Dashboard summary endpoint
app.get('/api/dashboard/:city', async (req, res) => {
  try {
    const { city } = req.params;
    // This would aggregate data from all modules
    res.json({
      city,
      timestamp: new Date().toISOString(),
      summary: {
        heatwave: { status: 'normal', temperature: null },
        flood: { riskLevel: 'low', activeAlerts: 0 },
        airQuality: { aqi: null, category: 'unknown' },
        waterQuality: { index: null, safe: true }
      }
    });
  } catch (error) {
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
