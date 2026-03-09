const express = require('express');
const { getDashboardAnalytics } = require('../controllers/analyticsController');
const authenticationMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', authenticationMiddleware, getDashboardAnalytics);

module.exports = router;
