import express from 'express';
import AirQuality from '../models/AirQuality.model.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get current AQI for a city
router.get('/current/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const data = await AirQuality.findOne({ city: new RegExp(city, 'i') })
      .sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No data available for this city' });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed pollutant breakdown
router.get('/pollutants/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const data = await AirQuality.findOne({ city: new RegExp(city, 'i') })
      .select('city pollutants dominantPollutant aqi')
      .sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No data available' });
    }

    res.json({
      city: data.city,
      aqi: data.aqi,
      dominantPollutant: data.dominantPollutant,
      pollutants: data.pollutants
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AQI forecast
router.get('/forecast/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { days = 7 } = req.query;

    const data = await AirQuality.findOne({ city: new RegExp(city, 'i') })
      .select('city state forecast trend')
      .sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No forecast available' });
    }

    res.json({
      city: data.city,
      state: data.state,
      trend: data.trend,
      forecast: data.forecast.slice(0, parseInt(days))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get health recommendations based on AQI
router.get('/health-recommendations/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const data = await AirQuality.findOne({ city: new RegExp(city, 'i') })
      .select('aqi healthRecommendations')
      .sort({ recordedAt: -1 });

    if (!data) {
      // Return default recommendations
      return res.json({
        recommendations: getDefaultRecommendations('unknown')
      });
    }

    res.json({
      aqi: data.aqi,
      recommendations: data.healthRecommendations || getDefaultRecommendations(data.aqi.category)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AQI category information
router.get('/categories', async (req, res) => {
  res.json({
    categories: [
      {
        category: 'good',
        range: '0-50',
        color: '#00e400',
        healthImplications: 'Air quality is satisfactory',
        cautionaryStatement: 'None'
      },
      {
        category: 'satisfactory',
        range: '51-100',
        color: '#92d050',
        healthImplications: 'Acceptable quality for most',
        cautionaryStatement: 'Sensitive individuals may experience minor issues'
      },
      {
        category: 'moderate',
        range: '101-200',
        color: '#ffff00',
        healthImplications: 'May cause breathing discomfort to sensitive people',
        cautionaryStatement: 'Children, elderly should limit outdoor exposure'
      },
      {
        category: 'poor',
        range: '201-300',
        color: '#ff7e00',
        healthImplications: 'May cause breathing discomfort to most people',
        cautionaryStatement: 'Avoid prolonged outdoor activities'
      },
      {
        category: 'very_poor',
        range: '301-400',
        color: '#ff0000',
        healthImplications: 'May cause respiratory illness on prolonged exposure',
        cautionaryStatement: 'Avoid outdoor activities, use N95 masks'
      },
      {
        category: 'severe',
        range: '400+',
        color: '#99004c',
        healthImplications: 'May cause serious health effects',
        cautionaryStatement: 'Stay indoors, use air purifiers'
      }
    ]
  });
});

// Get bio-remediation suggestions
router.get('/bio-remediation/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const data = await AirQuality.findOne({ city: new RegExp(city, 'i') })
      .select('bioRemediation aqi')
      .sort({ recordedAt: -1 });

    // Default bio-remediation suggestions
    const defaultSuggestions = {
      suggestions: [
        'Plant air-purifying indoor plants (Snake Plant, Spider Plant, Peace Lily)',
        'Support urban tree plantation drives',
        'Algae-based air purification systems in high-pollution zones',
        'Vertical gardens on buildings',
        'Green corridors along major roads'
      ],
      indoorPlants: [
        { name: 'Snake Plant', benefit: 'Removes formaldehyde, benzene' },
        { name: 'Spider Plant', benefit: 'Removes carbon monoxide, xylene' },
        { name: 'Peace Lily', benefit: 'Removes ammonia, benzene, formaldehyde' },
        { name: 'Aloe Vera', benefit: 'Removes formaldehyde' },
        { name: 'Money Plant', benefit: 'Removes VOCs' }
      ]
    };

    res.json({
      aqi: data?.aqi,
      bioRemediation: data?.bioRemediation || defaultSuggestions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pollution sources
router.get('/pollution-sources/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const data = await AirQuality.findOne({ city: new RegExp(city, 'i') })
      .select('pollutionSources')
      .sort({ recordedAt: -1 });

    res.json({
      sources: data?.pollutionSources || [
        { type: 'traffic', contribution: 40 },
        { type: 'industrial', contribution: 25 },
        { type: 'construction', contribution: 15 },
        { type: 'burning', contribution: 10 },
        { type: 'dust', contribution: 10 }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update air quality data
router.post('/update', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const data = await AirQuality.create(req.body);
    res.status(201).json({ message: 'Data updated', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function for default recommendations
function getDefaultRecommendations(category) {
  const recommendations = {
    good: {
      general: 'Air quality is good. Enjoy outdoor activities!',
      sensitiveGroups: 'No special precautions needed',
      outdoorActivity: 'safe',
      maskRequired: false
    },
    satisfactory: {
      general: 'Air quality is acceptable',
      sensitiveGroups: 'Unusually sensitive people should consider limiting prolonged outdoor exposure',
      outdoorActivity: 'safe',
      maskRequired: false
    },
    moderate: {
      general: 'Air quality is moderate. Sensitive individuals may experience discomfort',
      sensitiveGroups: 'People with respiratory conditions should limit outdoor exposure',
      outdoorActivity: 'reduce',
      maskRequired: false
    },
    poor: {
      general: 'Air quality is poor. Reduce outdoor activities',
      sensitiveGroups: 'Children, elderly, and those with respiratory issues should stay indoors',
      outdoorActivity: 'avoid',
      maskRequired: true
    },
    very_poor: {
      general: 'Air quality is very poor. Avoid outdoor activities',
      sensitiveGroups: 'Everyone should avoid outdoor exertion. Sensitive groups stay indoors',
      outdoorActivity: 'avoid',
      maskRequired: true
    },
    severe: {
      general: 'Air quality is hazardous. Stay indoors with air purifiers',
      sensitiveGroups: 'Everyone at risk. Seek medical attention if experiencing symptoms',
      outdoorActivity: 'stay_indoors',
      maskRequired: true
    },
    unknown: {
      general: 'Check local AQI data for recommendations',
      sensitiveGroups: 'Monitor air quality and take precautions as needed',
      outdoorActivity: 'safe',
      maskRequired: false
    }
  };

  return recommendations[category] || recommendations.unknown;
}

export default router;
