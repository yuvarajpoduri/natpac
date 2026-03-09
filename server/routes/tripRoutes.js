const express = require('express');
const router = express.Router();
const { 
  createNewTripRecord, 
  getUserTripHistory, 
  validateTripDetail 
} = require('../controllers/tripController');
const authenticationMiddleware = require('../middleware/authMiddleware');

router.use(authenticationMiddleware);

router.post('/', createNewTripRecord);
router.get('/history', getUserTripHistory);
router.patch('/:tripId/validate', validateTripDetail);

module.exports = router;
