import express from 'express';
import HeatwaveData from '../models/HeatwaveData.model.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get current heatwave data for a city
router.get('/current/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const data = await HeatwaveData.findOne({ city: new RegExp(city, 'i') })
      .sort({ recordedAt: -1 });

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
