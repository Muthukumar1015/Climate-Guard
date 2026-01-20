import mongoose from 'mongoose';

const airQualitySchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    index: true
  },
  state: {
    type: String,
    required: true
  },
  stationName: String,
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  aqi: {
    value: { type: Number, required: true },
    category: {
      type: String,
      enum: ['good', 'satisfactory', 'moderate', 'poor', 'very_poor', 'severe'],
      required: true
    }
  },
  pollutants: {
    pm25: { value: Number, unit: { type: String, default: 'µg/m³' } },
    pm10: { value: Number, unit: { type: String, default: 'µg/m³' } },
    no2: { value: Number, unit: { type: String, default: 'µg/m³' } },
    so2: { value: Number, unit: { type: String, default: 'µg/m³' } },
    co: { value: Number, unit: { type: String, default: 'mg/m³' } },
    o3: { value: Number, unit: { type: String, default: 'µg/m³' } },
    nh3: { value: Number, unit: { type: String, default: 'µg/m³' } }
  },
  dominantPollutant: String,
  pollutionSources: [{
    type: {
      type: String,
      enum: ['traffic', 'construction', 'industrial', 'burning', 'dust', 'other']
    },
    contribution: Number  // percentage
  }],
  healthRecommendations: {
    general: String,
    sensitiveGroups: String,    // for children, elderly, respiratory patients
    outdoorActivity: {
      type: String,
      enum: ['safe', 'reduce', 'avoid', 'stay_indoors']
    },
    maskRequired: Boolean
  },
  forecast: [{
    date: Date,
    aqi: Number,
    category: String
  }],
  trend: {
    direction: {
      type: String,
      enum: ['improving', 'stable', 'worsening']
    },
    percentChange: Number
  },
  bioRemediation: {
    suggestions: [String],
    nearbyGreenZones: [{
      name: String,
      coordinates: { lat: Number, lng: Number },
      distance: Number  // km
    }]
  },
  source: {
    type: String,
    default: 'CPCB'
  },
  recordedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// AQI category helper
airQualitySchema.statics.getCategory = function(aqi) {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'satisfactory';
  if (aqi <= 200) return 'moderate';
  if (aqi <= 300) return 'poor';
  if (aqi <= 400) return 'very_poor';
  return 'severe';
};

export default mongoose.model('AirQuality', airQualitySchema);
