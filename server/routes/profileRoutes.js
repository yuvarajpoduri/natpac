const express = require('express');
const authenticationMiddleware = require('../middleware/authMiddleware');
const { getUserProfile, changeUserPassword, updateUserProfile } = require('../controllers/profileController');

const router = express.Router();

// Apply auth to all profile routes
router.use(authenticationMiddleware);

// GET /api/profile — returns full profile + stats
router.get('/', getUserProfile);

// Legacy alias (keep for backward compat)
router.get('/me', getUserProfile);

// PATCH /api/profile — update trackingPaused, consentGiven, fullName
router.patch('/', updateUserProfile);

// PATCH /api/profile/password — change password
router.patch('/password', changeUserPassword);

module.exports = router;
