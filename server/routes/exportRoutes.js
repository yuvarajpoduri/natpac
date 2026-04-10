const express = require('express');
const authenticationMiddleware = require('../middleware/authMiddleware');
const { exportTripsAsJSON, exportTripsAsCSV, getAdvancedAnalytics, getExportPreview } = require('../controllers/exportController');

const router = express.Router();

router.get('/json', authenticationMiddleware, exportTripsAsJSON);
router.get('/csv', authenticationMiddleware, exportTripsAsCSV);
router.get('/preview', authenticationMiddleware, getExportPreview);
router.get('/advanced', authenticationMiddleware, getAdvancedAnalytics);

module.exports = router;
