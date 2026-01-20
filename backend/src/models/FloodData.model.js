import mongoose from 'mongoose';

const floodDataSchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    index: true
  },
  state: {
    type: String,
    required: true
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  rainfall: {
    current: Number,       // mm in last hour
    last24Hours: Number,   // mm in last 24 hours
    predicted: Number,     // mm expected in next 24 hours
    unit: { type: String, default: 'mm' }
  },
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'severe'],
    default: 'low'
  },
  waterLevel: {
    current: Number,
    threshold: Number,
    unit: { type: String, default: 'meters' }
  },
  floodProneAreas: [{
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    riskLevel: String,
    historicalFloods: Number
  }],
  waterloggedAreas: [{
    location: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe']
    },
    reportedAt: Date,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    imageUrl: String,
    isVerified: { type: Boolean, default: false }
  }],
  safeRoutes: [{
    from: String,
    to: String,
    route: String,
    isOpen: Boolean,
    updatedAt: Date
  }],
  emergencyContacts: [{
    name: String,
    phone: String,
    type: String  // 'police', 'fire', 'ambulance', 'municipal'
  }],
  drainageStatus: {
    condition: {
      type: String,
      enum: ['good', 'partial', 'blocked']
    },
    lastCleaned: Date
  },
  forecast: [{
    date: Date,
    rainfall: Number,
    riskLevel: String
  }],
  source: {
    type: String,
    default: 'IMD'
  },
  recordedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('FloodData', floodDataSchema);
