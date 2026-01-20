import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['heatwave', 'flood', 'air_quality', 'water_quality'],
    required: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical', 'emergency'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true,
    index: true
  },
  state: String,
  affectedAreas: [String],
  coordinates: {
    lat: Number,
    lng: Number
  },
  radius: Number,  // affected radius in km
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  instructions: [String],
  source: String,
  issuedBy: {
    type: String,
    enum: ['system', 'authority', 'imd', 'cpcb'],
    default: 'system'
  },
  metadata: {
    temperature: Number,
    rainfall: Number,
    aqi: Number,
    waterLevel: Number
  }
}, {
  timestamps: true
});

// Auto-deactivate expired alerts
alertSchema.pre('find', function() {
  this.where({ isActive: true, validUntil: { $gt: new Date() } });
});

export default mongoose.model('Alert', alertSchema);
