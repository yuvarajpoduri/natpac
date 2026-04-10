const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { 
  createNewTripRecord, 
  getUserTripHistory, 
  validateTripDetail,
  simulateRealTrip
} = require('../controllers/tripController');
const authenticationMiddleware = require('../middleware/authMiddleware');
const { validatePayload } = require('../middleware/validationMiddleware');

router.use(authenticationMiddleware);

const tripCreationSchema = Joi.object({
  originCoordinates: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    timestamp: Joi.date().optional()
  }).required(),
  destinationCoordinates: Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    timestamp: Joi.date().optional()
  }).required(),
  tripPoints: Joi.array().items(Joi.object({
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    speed: Joi.number().optional(),
    timestamp: Joi.date().optional()
  })).optional(),
  averageSpeed: Joi.number().optional().allow(null),
  maximumSpeed: Joi.number().optional().allow(null),
  totalDistance: Joi.number().optional().allow(null),
  totalDurationSeconds: Joi.number().optional().allow(null)
});

const tripValidationSchema = Joi.object({
  userValidatedMode: Joi.string().valid('Walking', 'Cycling', 'Car', 'Bus', 'Auto-Rickshaw', 'Train', 'Ferry').required(),
  tripPurpose: Joi.string().valid('Work', 'Education', 'Shopping', 'Social / Recreation', 'Medical', 'Return Home').required(),
  travelCost: Joi.number().min(0).optional(),
  numberOfCompanions: Joi.number().min(0).optional()
});

router.post('/', validatePayload(tripCreationSchema), createNewTripRecord);
router.post('/simulate', simulateRealTrip);
router.get('/history', getUserTripHistory);
router.patch('/:tripId/validate', validatePayload(tripValidationSchema), validateTripDetail);

module.exports = router;
