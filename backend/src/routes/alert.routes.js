import express from 'express';
import Alert from '../models/Alert.model.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get active alerts for a city
router.get('/active/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { type, severity } = req.query;

    let query = {
      city: new RegExp(city, 'i'),
      isActive: true,
      $or: [
        { validUntil: { $gt: new Date() } },
        { validUntil: null }
      ]
    };

    if (type) {
      query.type = type;
    }
    if (severity) {
      query.severity = severity;
    }

    const alerts = await Alert.find(query)
      .sort({ severity: -1, createdAt: -1 });

    res.json({ alerts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all alerts (including historical) for a city
router.get('/history/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { type, limit = 50, skip = 0 } = req.query;

    let query = { city: new RegExp(city, 'i') };
    if (type) {
      query.type = type;
    }

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Alert.countDocuments(query);

    res.json({
      alerts,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: parseInt(skip) + alerts.length < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get alerts summary for dashboard
router.get('/summary/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const activeAlerts = await Alert.aggregate([
      {
        $match: {
          city: new RegExp(city, 'i'),
          isActive: true,
          $or: [
            { validUntil: { $gt: new Date() } },
            { validUntil: null }
          ]
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          highestSeverity: { $max: '$severity' },
          latestAlert: { $first: '$$ROOT' }
        }
      }
    ]);

    res.json({
      city,
      totalActiveAlerts: activeAlerts.reduce((sum, a) => sum + a.count, 0),
      byType: activeAlerts.map(a => ({
        type: a._id,
        count: a.count,
        highestSeverity: a.highestSeverity,
        latestAlert: {
          title: a.latestAlert.title,
          message: a.latestAlert.message,
          severity: a.latestAlert.severity
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Create new alert
router.post('/', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const alert = await Alert.create({
      ...req.body,
      issuedBy: 'authority'
    });

    res.status(201).json({ message: 'Alert created', alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update alert
router.put('/:id', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert updated', alert });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Deactivate alert
router.delete('/:id', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
