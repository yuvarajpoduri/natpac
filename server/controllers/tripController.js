const Trip = require('../models/Trip');
const axios = require('axios');

const createNewTripRecord = async (request, response) => {
  try {
    const { 
      originCoordinates, 
      destinationCoordinates, 
      tripPoints,
      averageSpeed,
      maximumSpeed,
      totalDistance,
      totalDurationSeconds
    } = request.body;

    let aiPrediction = 'Pending';
    
    try {
      const aiServiceResponse = await axios.post(`${process.env.AI_SERVICE_URL}/predict`, {
        avg_speed: averageSpeed,
        max_speed: maximumSpeed,
        duration: totalDurationSeconds,
        stops: 0 // Will be calculated in future phases
      });
      aiPrediction = aiServiceResponse.data.predictedMode;
    } catch (aiError) {
      console.error('AI Service unreachable, setting to Pending');
    }

    const newTrip = new Trip({
      userId: request.user.userId,
      originCoordinates,
      destinationCoordinates,
      tripPoints,
      averageSpeed,
      maximumSpeed,
      totalDistance,
      totalDurationSeconds,
      aiPredictedMode: aiPrediction
    });

    await newTrip.save();
    response.status(201).json(newTrip);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

const getUserTripHistory = async (request, response) => {
  try {
    const userTrips = await Trip.find({ userId: request.user.userId }).sort({ tripRecordCreatedAt: -1 });
    response.status(200).json(userTrips);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

const validateTripDetail = async (request, response) => {
  try {
    const { tripId } = request.params;
    const { userValidatedMode, tripPurpose, travelCost, numberOfCompanions } = request.body;

    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: tripId, userId: request.user.userId },
      { 
        userValidatedMode, 
        tripPurpose, 
        travelCost, 
        numberOfCompanions,
        isTripValidated: true 
      },
      { new: true }
    );

    if (!updatedTrip) {
      return response.status(404).json({ message: 'Trip not found' });
    }

    response.status(200).json(updatedTrip);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNewTripRecord,
  getUserTripHistory,
  validateTripDetail
};
