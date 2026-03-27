const express = require('express');
const authenticationMiddleware = require('../middleware/authMiddleware');
const { exportTripsAsJSON, exportTripsAsCSV, getAdvancedAnalytics } = require('../controllers/exportController');

const router = express.Router();

router.get('/json', authenticationMiddleware, exportTripsAsJSON);
router.get('/csv', authenticationMiddleware, exportTripsAsCSV);
router.get('/advanced', authenticationMiddleware, getAdvancedAnalytics);

module.exports = router;
