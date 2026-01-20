import express from 'express';
import multer from 'multer';
import path from 'path';
import Report from '../models/Report.model.js';
import { authenticateToken, requireRole, optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/reports');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Create a new report
router.post('/', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const { type, title, description, address, city, state, lat, lng, severity } = req.body;

    const images = req.files?.map(file => ({
      url: `/uploads/reports/${file.filename}`,
      uploadedAt: new Date()
    })) || [];

    const report = await Report.create({
      type,
      title,
      description,
      reportedBy: req.user.id,
      location: {
        address,
        city,
        state,
        coordinates: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        }
      },
      images,
      severity: severity || 'medium'
    });

    res.status(201).json({
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports for a city
router.get('/city/:city', optionalAuth, async (req, res) => {
  try {
    const { city } = req.params;
    const { type, status, limit = 20, skip = 0 } = req.query;

    let query = {
      'location.city': new RegExp(city, 'i'),
      isPublic: true
    };

    if (type) query.type = type;
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports near a location
router.get('/nearby', optionalAuth, async (req, res) => {
  try {
    const { lat, lng, radius = 5, type } = req.query; // radius in km

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    // Simple distance calculation (not using MongoDB geospatial for simplicity)
    const reports = await Report.find({
      isPublic: true,
      ...(type && { type })
    }).populate('reportedBy', 'name');

    // Filter by distance
    const nearbyReports = reports.filter(report => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        report.location.coordinates.lat,
        report.location.coordinates.lng
      );
      return distance <= parseFloat(radius);
    });

    res.json({ reports: nearbyReports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single report
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name')
      .populate('comments.user', 'name');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's reports
router.get('/user/my-reports', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 20, skip = 0 } = req.query;

    let query = { reportedBy: req.user.id };
    if (status) query.status = status;

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      pagination: { total, limit: parseInt(limit), skip: parseInt(skip) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upvote a report
router.post('/:id/upvote', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check if already upvoted
    const alreadyUpvoted = report.upvotes.some(
      v => v.user.toString() === req.user.id
    );

    if (alreadyUpvoted) {
      // Remove upvote
      report.upvotes = report.upvotes.filter(
        v => v.user.toString() !== req.user.id
      );
    } else {
      // Add upvote
      report.upvotes.push({ user: req.user.id, votedAt: new Date() });
    }

    await report.save();

    res.json({
      message: alreadyUpvoted ? 'Upvote removed' : 'Upvoted',
      upvoteCount: report.upvotes.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add comment to report
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            user: req.user.id,
            text,
            createdAt: new Date()
          }
        }
      },
      { new: true }
    ).populate('comments.user', 'name');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      message: 'Comment added',
      comments: report.comments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update report status
router.put('/:id/status', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const { status } = req.body;

    const updateData = { status };

    if (status === 'verified') {
      updateData.verifiedBy = req.user.id;
    } else if (status === 'resolved') {
      updateData.resolution = {
        resolvedAt: new Date(),
        resolvedBy: req.user.id,
        description: req.body.resolutionDescription
      };
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Status updated', report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Assign report
router.put('/:id/assign', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { assignedTo, status: 'in_progress' },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report assigned', report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;
