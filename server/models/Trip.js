const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originCoordinates: {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    name: String
  },
  destinationCoordinates: {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    name: String
  },
  tripPoints: [{
    latitude: Number,
    longitude: Number,
    speed: Number,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  averageSpeed: Number,
  maximumSpeed: Number,
  // Feature 12: computed via Haversine and stored
  totalDistance: Number,        // in metres
  totalDurationSeconds: Number, // in seconds

  // Feature 1: AI confidence score
  aiPredictedMode: String,
  aiConfidenceScore: {          // 0-100 percentage
    type: Number,
    default: null
  },

  userValidatedMode: String,
  tripPurpose: String,
  numberOfCompanions: {
    type: Number,
    default: 0
  },
  travelCost: {
    type: Number,
    default: 0
  },
  isTripValidated: {
    type: Boolean,
    default: false
  },

  // Feature 7: AI accuracy tracking per trip (null = not yet validated)
  aiPredictionCorrect: {
    type: Boolean,
    default: null
  },

  // Feature 6: Carbon footprint in grams CO2
  carbonEmissionGrams: {
    type: Number,
    default: null
  },

  // Feature 9: Manual issue tags e.g. ['Traffic', 'Bad Road', 'Delay']
  issueTags: {
    type: [String],
    default: []
  },

  // Smart Map Issue Visualization
  issueEvents: [{
    issueType: { type: String, enum: ['traffic', 'delay', 'bad_road'] },
    latitude: Number,
    longitude: Number,
    timestamp: Date,
    durationSeconds: { type: Number, default: 0 }
  }],

  // ── ADVANCED ANALYTICS FEATURES ──

  // 1. Habit Detection Engine
  habitLabel: { type: String, default: null }, // e.g. "Morning Commute", "Evening Return"

  // 2. Trip Purpose Prediction
  predictedPurpose: { type: String, default: null },
  purposeConfirmed: { type: Boolean, default: false },

  // 3. Travel Stress Score
  stressScore: { type: Number, default: null }, // 0-100
  stressLevel: { type: String, enum: ['Low', 'Medium', 'High', null], default: null },

  // 4. Dead Time Detector
  idleTimeSeconds: { type: Number, default: 0 },

  // 5. Smart Trip Merging (If merged, refer to parent)
  isMerged: { type: Boolean, default: false },
  parentTripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },

  // 6. Route Similarity (Cluster ID)
  routeClusterId: { type: String, default: null },

  // 8. Data Confidence Score
  dataConfidenceScore: { type: Number, default: null }, // 0-100

  // 9. Auto Trip Tagging
  autoTags: { type: [String], default: [] }, // e.g. ["Short Trip", "Frequent Route"]

  // 10. Travel Efficiency Score
  efficiencyScore: { type: Number, default: null }, // percentage 0-100

  // 12. Anomaly Detection
  isAnomalous: { type: Boolean, default: false },
  anomalyReasons: { type: [String], default: [] },

  tripRecordCreatedAt: {
    type: Date,
    default: Date.now
  }
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
