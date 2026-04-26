const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['citizen', 'scientist'],
    default: 'citizen'
  },
  // Feature 3: Gamification — points and badge
  points: {
    type: Number,
    default: 0
  },
  // Privacy controls (report requirement)
  consentGiven: {
    type: Boolean,
    default: false
  },
  trackingPaused: {
    type: Boolean,
    default: false
  },
  // Feature 8: Frequent location labels stored per user
  frequentLocations: [{
    latitude: Number,
    longitude: Number,
    label: String,         // 'Home', 'Work', or custom
    visitCount: Number,
    lastVisited: Date
  }],
  accountCreatedAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
