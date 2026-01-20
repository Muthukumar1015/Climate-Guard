import express from 'express';
import WaterQuality from '../models/WaterQuality.model.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Generate simulated water quality data for a city
function generateWaterQualityData(city, lat, lng) {
  // Use city name hash for consistent random values
  const hash = city.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (min, max, seed = 0) => {
    const x = Math.sin(hash + seed) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  const ph = Math.round(rand(6.8, 8.2, 1) * 10) / 10;
  const dissolvedOxygen = Math.round(rand(5, 8, 2) * 10) / 10;
  const bod = Math.round(rand(1, 4, 3) * 10) / 10;
  const turbidity = Math.round(rand(1, 8, 4) * 10) / 10;
  const totalColiform = Math.round(rand(10, 80, 5));
  const nitrate = Math.round(rand(5, 40, 6) * 10) / 10;
  const fluoride = Math.round(rand(0.3, 1.2, 7) * 10) / 10;
  const iron = Math.round(rand(0.1, 0.4, 8) * 100) / 100;

  // Calculate WQI (simplified formula)
  let wqiValue = 0;
  wqiValue += ph >= 6.5 && ph <= 8.5 ? 10 : 20;
  wqiValue += dissolvedOxygen >= 6 ? 10 : 15;
  wqiValue += bod <= 3 ? 10 : 20;
  wqiValue += turbidity <= 5 ? 10 : 15;
  wqiValue += totalColiform <= 50 ? 10 : 20;
  wqiValue += nitrate <= 45 ? 5 : 15;
  wqiValue += fluoride <= 1.5 ? 5 : 10;
  wqiValue += iron <= 0.3 ? 5 : 10;

  let category = 'excellent';
  if (wqiValue > 75) category = 'poor';
  else if (wqiValue > 50) category = 'fair';
  else if (wqiValue > 25) category = 'good';

  const isSafe = wqiValue <= 50;

  return {
    city,
    state: '',
    waterBody: { name: 'Municipal Tap Water', type: 'tap_water' },
    coordinates: { lat: lat || 0, lng: lng || 0 },
    wqi: { value: wqiValue, category },
    parameters: {
      ph: { value: ph, safe: ph >= 6.5 && ph <= 8.5 },
      dissolvedOxygen: { value: dissolvedOxygen, unit: 'mg/L', safe: dissolvedOxygen >= 6 },
      bod: { value: bod, unit: 'mg/L', safe: bod <= 3 },
      turbidity: { value: turbidity, unit: 'NTU', safe: turbidity <= 5 },
      totalColiform: { value: totalColiform, unit: 'MPN/100mL', safe: totalColiform <= 50 },
      nitrate: { value: nitrate, unit: 'mg/L', safe: nitrate <= 45 },
      fluoride: { value: fluoride, unit: 'mg/L', safe: fluoride <= 1.5 },
      iron: { value: iron, unit: 'mg/L', safe: iron <= 0.3 }
    },
    isSafeForDrinking: isSafe,
    isSafeForBathing: true,
    safetyTips: isSafe ? [
      'Water is safe for drinking after basic filtration',
      'Use RO purifier for best results',
      'Store in clean containers'
    ] : [
      'Boil water before drinking',
      'Use RO/UV purifier',
      'Avoid direct consumption',
      'Report to local authorities if issues persist'
    ],
    source: 'Simulated Data',
    recordedAt: new Date()
  };
}

// Get water quality for a city
router.get('/current/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { waterBodyType, lat, lng } = req.query;

    let query = { city: new RegExp(city, 'i') };
    if (waterBodyType) {
      query['waterBody.type'] = waterBodyType;
    }

    let data = await WaterQuality.find(query)
      .sort({ recordedAt: -1 })
      .limit(10);

    // If no data found, generate simulated data
    if (!data.length) {
      const generatedData = generateWaterQualityData(city, parseFloat(lat), parseFloat(lng));
      // Save to database for future requests
      const saved = await WaterQuality.create(generatedData);
      data = [saved];
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tap water quality
router.get('/tap-water/:city', async (req, res) => {
  try {
    const { city } = req.params;

    const data = await WaterQuality.findOne({
      city: new RegExp(city, 'i'),
      'waterBody.type': 'tap_water'
    }).sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No tap water data available' });
    }

    res.json({
      city: data.city,
      waterBody: data.waterBody,
      wqi: data.wqi,
      isSafeForDrinking: data.isSafeForDrinking,
      parameters: data.parameters,
      safetyTips: data.safetyTips
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get water quality parameters
router.get('/parameters/:city/:waterBodyName', async (req, res) => {
  try {
    const { city, waterBodyName } = req.params;

    const data = await WaterQuality.findOne({
      city: new RegExp(city, 'i'),
      'waterBody.name': new RegExp(waterBodyName, 'i')
    }).sort({ recordedAt: -1 });

    if (!data) {
      return res.status(404).json({ error: 'No data available' });
    }

    res.json({
      waterBody: data.waterBody,
      wqi: data.wqi,
      parameters: data.parameters,
      isSafeForDrinking: data.isSafeForDrinking,
      isSafeForBathing: data.isSafeForBathing
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get water quality standards
router.get('/standards', async (req, res) => {
  res.json({
    standards: {
      drinking: {
        ph: { min: 6.5, max: 8.5 },
        dissolvedOxygen: { min: 6 },
        bod: { max: 3 },
        totalColiform: { max: 50 },
        turbidity: { max: 5 },
        nitrate: { max: 45 },
        fluoride: { max: 1.5 },
        arsenic: { max: 0.01 },
        lead: { max: 0.01 },
        iron: { max: 0.3 }
      },
      bathing: {
        ph: { min: 6.5, max: 8.5 },
        dissolvedOxygen: { min: 5 },
        bod: { max: 3 },
        fecalColiform: { max: 500 }
      },
      source: 'Bureau of Indian Standards (BIS)'
    },
    wqiCategories: [
      { category: 'excellent', range: '0-25', color: '#00e400' },
      { category: 'good', range: '26-50', color: '#92d050' },
      { category: 'fair', range: '51-75', color: '#ffff00' },
      { category: 'poor', range: '76-100', color: '#ff7e00' },
      { category: 'very_poor', range: '100+', color: '#ff0000' }
    ]
  });
});

// Get nearby treatment facilities
router.get('/treatment-facilities/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { lat, lng } = req.query;

    const data = await WaterQuality.findOne({ city: new RegExp(city, 'i') })
      .select('treatmentFacilities')
      .sort({ recordedAt: -1 });

    res.json({
      facilities: data?.treatmentFacilities || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bio-remediation methods for water
router.get('/bio-remediation', async (req, res) => {
  res.json({
    methods: [
      {
        name: 'Phytoremediation',
        description: 'Using aquatic plants like Water Hyacinth, Duckweed to absorb pollutants',
        effectiveness: 'High for organic pollutants and heavy metals',
        applicability: 'Ponds, lakes, slow-moving water bodies'
      },
      {
        name: 'Bioreactors',
        description: 'Microbial treatment systems using bacteria to break down pollutants',
        effectiveness: 'High for sewage and organic waste',
        applicability: 'Wastewater treatment'
      },
      {
        name: 'Constructed Wetlands',
        description: 'Engineered systems mimicking natural wetlands for water purification',
        effectiveness: 'Moderate to high',
        applicability: 'Community-level water treatment'
      },
      {
        name: 'Bioaugmentation',
        description: 'Adding selected microorganisms to enhance degradation',
        effectiveness: 'Variable based on conditions',
        applicability: 'Contaminated sites'
      },
      {
        name: 'Algal Treatment',
        description: 'Using algae to remove nutrients and heavy metals',
        effectiveness: 'High for nutrient removal',
        applicability: 'Eutrophic water bodies'
      }
    ],
    safetyTips: [
      'Always boil or filter water before drinking if unsure of quality',
      'Use RO/UV purifiers for tap water',
      'Store water in clean, covered containers',
      'Avoid using water from visibly polluted sources',
      'Report water contamination to local authorities'
    ]
  });
});

// Report water pollution
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const { city, waterBodyName, issue, description, coordinates, imageUrl } = req.body;

    const data = await WaterQuality.findOneAndUpdate(
      {
        city: new RegExp(city, 'i'),
        'waterBody.name': new RegExp(waterBodyName, 'i')
      },
      {
        $push: {
          userReports: {
            reportedBy: req.user.id,
            issue,
            description,
            coordinates,
            imageUrl,
            reportedAt: new Date(),
            status: 'pending'
          }
        }
      },
      { new: true, sort: { recordedAt: -1 } }
    );

    if (!data) {
      return res.status(404).json({ error: 'Water body not found' });
    }

    res.status(201).json({
      message: 'Report submitted successfully',
      report: data.userReports[data.userReports.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user reports for a city
router.get('/reports/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { status } = req.query;

    const query = { city: new RegExp(city, 'i') };

    const data = await WaterQuality.find(query)
      .select('waterBody userReports')
      .sort({ recordedAt: -1 });

    let reports = data.flatMap(d =>
      d.userReports.map(r => ({
        ...r.toObject(),
        waterBody: d.waterBody
      }))
    );

    if (status) {
      reports = reports.filter(r => r.status === status);
    }

    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update water quality data
router.post('/update', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const data = await WaterQuality.create(req.body);
    res.status(201).json({ message: 'Data updated', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Update report status
router.put('/reports/:reportId/status', authenticateToken, requireRole('admin', 'authority'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, city, waterBodyName } = req.body;

    await WaterQuality.findOneAndUpdate(
      {
        city: new RegExp(city, 'i'),
        'waterBody.name': new RegExp(waterBodyName, 'i'),
        'userReports._id': reportId
      },
      { $set: { 'userReports.$.status': status } }
    );

    res.json({ message: 'Report status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
