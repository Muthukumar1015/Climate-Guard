import mongoose from 'mongoose';

const heatwaveDataSchema = new mongoose.Schema({
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
  temperature: {
    current: Number,
    feelsLike: Number,
    min: Number,
    max: Number,
    unit: { type: String, default: 'celsius' }
  },
  heatIndex: Number,
  humidity: Number,
  alertLevel: {
    type: String,
    enum: ['green', 'yellow', 'orange', 'red'],
    default: 'green'
  },
  alertMessage: String,
  forecast: [{
    date: Date,
    tempMax: Number,
    tempMin: Number,
    heatIndex: Number,
    alertLevel: String
  }],
  coolingCenters: [{
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    capacity: Number,
    isOpen: Boolean,
    timings: String
  }],
  hospitals: [{
    name: String,
    address: String,
    phone: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    hasEmergency: Boolean
  }],
  guidelines: {
    dos: [String],
    donts: [String]
  },
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

// Index for geospatial queries
heatwaveDataSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

export default mongoose.model('HeatwaveData', heatwaveDataSchema);
