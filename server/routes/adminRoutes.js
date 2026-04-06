const express = require('express');
const authenticationMiddleware = require('../middleware/authMiddleware');
const { getAllSystemUsers, getSystemHealthStatus, deleteUserAccount } = require('../controllers/adminController');

const router = express.Router();

router.get('/users', authenticationMiddleware, getAllSystemUsers);
router.get('/health', authenticationMiddleware, getSystemHealthStatus);
router.delete('/users/:targetUserId', authenticationMiddleware, deleteUserAccount);

module.exports = router;
