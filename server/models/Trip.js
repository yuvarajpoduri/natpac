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
    timestamp: Date
  },
  destinationCoordinates: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
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
  totalDistance: Number,
  totalDurationSeconds: Number,
  aiPredictedMode: String,
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
  tripRecordCreatedAt: {
    type: Date,
    default: Date.now
  }
});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;
