const express = require('express');
const authenticationMiddleware = require('../middleware/authMiddleware');
const { getUserProfile, changeUserPassword } = require('../controllers/profileController');

const router = express.Router();

router.get('/me', authenticationMiddleware, getUserProfile);
router.patch('/password', authenticationMiddleware, changeUserPassword);

module.exports = router;
