import express from 'express';
import FloodData from '../models/FloodData.model.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get current flood data for a city
router.get('/current/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const data = await FloodData.findOne({ city: new RegExp(city, 'i') })
      .sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No data available for this city' });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get flood risk map / flood-prone areas
router.get('/risk-map/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const data = await FloodData.findOne({ city: new RegExp(city, 'i') })
      .select('city floodProneAreas waterloggedAreas riskLevel')
      .sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No data available' });
    }

    res.json({
      city: data.city,
      overallRisk: data.riskLevel,
      floodProneAreas: data.floodProneAreas,
      waterloggedAreas: data.waterloggedAreas.filter(w =>
        new Date() - new Date(w.reportedAt) < 24 * 60 * 60 * 1000 // Last 24 hours
      )
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rainfall forecast
router.get('/forecast/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { days = 7 } = req.query;

    const data = await FloodData.findOne({ city: new RegExp(city, 'i') })
      .select('city state rainfall forecast')
      .sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No forecast available' });
    }

    res.json({
      city: data.city,
      state: data.state,
      currentRainfall: data.rainfall,
      forecast: data.forecast.slice(0, parseInt(days))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get safe routes
router.get('/safe-routes/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { from, to } = req.query;

    const data = await FloodData.findOne({ city: new RegExp(city, 'i') })
      .select('safeRoutes waterloggedAreas')
      .sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No data available' });
    }

    let routes = data.safeRoutes.filter(r => r.isOpen);

    // Filter by from/to if provided
    if (from) {
      routes = routes.filter(r => r.from.toLowerCase().includes(from.toLowerCase()));
    }
    if (to) {
      routes = routes.filter(r => r.to.toLowerCase().includes(to.toLowerCase()));
    }

    res.json({
      safeRoutes: routes,
      areasToAvoid: data.waterloggedAreas
        .filter(w => w.severity === 'severe')
        .map(w => ({ location: w.location, coordinates: w.coordinates }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Report waterlogging
router.post('/report-waterlogging', authenticateToken, async (req, res) => {
  try {
    const { city, location, coordinates, severity, description, imageUrl } = req.body;

    const data = await FloodData.findOneAndUpdate(
      { city: new RegExp(city, 'i') },
      {
        $push: {
          waterloggedAreas: {
            location,
            coordinates,
            severity,
            description,
            imageUrl,
            reportedAt: new Date(),
            reportedBy: req.user.id,
            isVerified: false
          }
        }
      },
      { new: true, sort: { recordedAt: -1 } }
    );

    res.status(201).json({
      message: 'Waterlogging reported successfully',
      report: data.waterloggedAreas[data.waterloggedAreas.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get emergency contacts
router.get('/emergency-contacts/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const data = await FloodData.findOne({ city: new RegExp(city, 'i') })
      .select('emergencyContacts')
      .sort({ recordedAt: -1 });

    // Default emergency contacts if no city-specific data
    const defaultContacts = [
      { name: 'National Emergency Number', phone: '112', type: 'emergency' },
      { name: 'Disaster Management', phone: '1078', type: 'disaster' },
      { name: 'Police', phone: '100', type: 'police' },
      { name: 'Fire', phone: '101', type: 'fire' },
      { name: 'Ambulance', phone: '102', type: 'ambulance' }
    ];

    res.json({
      contacts: data?.emergencyContacts?.length ? data.emergencyContacts : defaultContacts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get flood safety guidelines
router.get('/guidelines', async (req, res) => {
  res.json({
    guidelines: {
      beforeFlood: [
        'Keep important documents in waterproof bags',
        'Stock emergency supplies (water, food, medicines)',
        'Know evacuation routes in your area',
        'Keep mobile phones charged',
        'Move valuables to higher floors'
      ],
      duringFlood: [
        'Do not walk or drive through floodwater',
        'Stay away from power lines and electrical wires',
        'Move to higher ground if water rises',
        'Listen to emergency broadcasts',
        'Call emergency services if stranded'
      ],
      afterFlood: [
        'Return home only when authorities say it is safe',
        'Avoid floodwater - it may be contaminated',
        'Check for structural damage before entering buildings',
        'Clean and disinfect everything that got wet',
        'Report any hazards to local authorities'
      ]
    }
  });
});

// Admin: Update flood data
router.post('/update', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const data = await FloodData.create(req.body);
    res.status(201).json({ message: 'Data updated', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Verify waterlogging report
router.put('/verify-report/:reportId', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { city, isVerified } = req.body;

    const data = await FloodData.findOneAndUpdate(
      {
        city: new RegExp(city, 'i'),
        'waterloggedAreas._id': reportId
      },
      { $set: { 'waterloggedAreas.$.isVerified': isVerified } },
      { new: true }
    );

    res.json({ message: 'Report verification updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
