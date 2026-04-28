const express = require('express');
const {
  getDashboardAnalytics,
  getPersonalStats,
  getWeeklySummary,
  getAiAccuracyStats,
  getFilteredTrips,
  getPublicStats
} = require('../controllers/analyticsController');
const authenticationMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Public endpoint for landing page
router.get('/public', getPublicStats);

// All analytics routes require authentication
router.use(authenticationMiddleware);

// Scientist global dashboard
router.get('/dashboard', getDashboardAnalytics);

// Feature 2: Citizen personal stats
router.get('/personal', getPersonalStats);

// Feature 5: Weekly summary for citizen
router.get('/weekly', getWeeklySummary);

// Feature 7: AI accuracy stats (scientist)
router.get('/ai-accuracy', getAiAccuracyStats);

// Feature 11: Filtered trip data for scientist
router.get('/filtered-trips', getFilteredTrips);

module.exports = router;
