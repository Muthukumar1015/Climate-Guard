import mongoose from 'mongoose';

const waterQualitySchema = new mongoose.Schema({
  city: {
    type: String,
    required: true,
    index: true
  },
  state: {
    type: String,
    required: true
  },
  waterBody: {
    name: String,
    type: {
      type: String,
      enum: ['river', 'lake', 'pond', 'groundwater', 'tap_water', 'reservoir']
    }
  },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  wqi: {
    value: Number,  // Water Quality Index
    category: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'very_poor']
    }
  },
  parameters: {
    ph: { value: Number, safe: Boolean },
    dissolvedOxygen: { value: Number, unit: { type: String, default: 'mg/L' }, safe: Boolean },
    bod: { value: Number, unit: { type: String, default: 'mg/L' }, safe: Boolean },  // Biochemical Oxygen Demand
    cod: { value: Number, unit: { type: String, default: 'mg/L' }, safe: Boolean },  // Chemical Oxygen Demand
    totalColiform: { value: Number, unit: { type: String, default: 'MPN/100mL' }, safe: Boolean },
    fecalColiform: { value: Number, unit: { type: String, default: 'MPN/100mL' }, safe: Boolean },
    turbidity: { value: Number, unit: { type: String, default: 'NTU' }, safe: Boolean },
    nitrate: { value: Number, unit: { type: String, default: 'mg/L' }, safe: Boolean },
    fluoride: { value: Number, unit: { type: String, default: 'mg/L' }, safe: Boolean },
    arsenic: { value: Number, unit: { type: String, default: 'mg/L' }, safe: Boolean },
    lead: { value: Number, unit: { type: String, default: 'mg/L' }, safe: Boolean },
    iron: { value: Number, unit: { type: String, default: 'mg/L' }, safe: Boolean }
  },
  isSafeForDrinking: Boolean,
  isSafeForBathing: Boolean,
  pollutionSources: [{
    type: {
      type: String,
      enum: ['industrial', 'sewage', 'agricultural', 'domestic', 'other']
    },
    description: String
  }],
  healthRisks: [String],
  safetyTips: [String],
  treatmentFacilities: [{
    name: String,
    address: String,
    phone: String,
    coordinates: { lat: Number, lng: Number },
    type: {
      type: String,
      enum: ['water_treatment', 'sewage_treatment', 'ro_plant']
    }
  }],
  bioRemediation: {
    recommended: Boolean,
    methods: [{
      name: String,
      description: String,
      effectiveness: String
    }]
  },
  userReports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    issue: String,
    description: String,
    imageUrl: String,
    coordinates: { lat: Number, lng: Number },
    reportedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved'],
      default: 'pending'
    }
  }],
  source: {
    type: String,
    default: 'State Pollution Board'
  },
  recordedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('WaterQuality', waterQualitySchema);
