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

  tripRecordCreatedAt: {
    type: Date,
    default: Date.now
  }
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
