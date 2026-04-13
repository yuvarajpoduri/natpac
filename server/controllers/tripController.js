const Trip = require('../models/Trip');
const axios = require('axios');

const createNewTripRecord = async (request, response, next) => {
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

    let originName = 'Unknown Location';
    let destName = 'Unknown Location';

    const getPlaceName = async (lat, lng) => {
      try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: { 'User-Agent': 'NATPAC_App/1.0' }
        });
        if (response.data && response.data.address) {
          const addr = response.data.address;
          return addr.village || addr.suburb || addr.neighbourhood || addr.road || addr.city || addr.town || 'Unknown Location';
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err.message);
      }
      return 'Unknown Location';
    };

    if (originCoordinates && originCoordinates.latitude) {
      originName = await getPlaceName(originCoordinates.latitude, originCoordinates.longitude);
      originCoordinates.name = originName;
    }
    if (destinationCoordinates && destinationCoordinates.latitude) {
      destName = await getPlaceName(destinationCoordinates.latitude, destinationCoordinates.longitude);
      destinationCoordinates.name = destName;
    }

    let aiPrediction = 'Pending';
    
    try {
      const aiServiceResponse = await axios.post(`${process.env.AI_SERVICE_URL}/predict`, {
        avg_speed: averageSpeed,
        max_speed: maximumSpeed,
        duration: totalDurationSeconds,
        stops: 0
      });
      aiPrediction = aiServiceResponse.data.predictedMode || 'Car';
    } catch (aiError) {
      console.warn('AI Service unreachable, using fallback heuristic prediction');
      // Fallback heuristic based on speed:
      if (averageSpeed < 8) aiPrediction = 'Walking';
      else if (averageSpeed < 25) aiPrediction = 'Cycling';
      else aiPrediction = 'Car';
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
    response.status(201).json({ status: 'success', data: newTrip });
  } catch (error) {
    next(error);
  }
};

const getUserTripHistory = async (request, response, next) => {
  try {
    const userTrips = await Trip.find({ userId: request.user.userId }).sort({ tripRecordCreatedAt: -1 });
    response.status(200).json({ status: 'success', data: userTrips });
  } catch (error) {
    next(error);
  }
};

const validateTripDetail = async (request, response, next) => {
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
      const error = new Error('Trip not found or unauthorized');
      error.status = 404;
      throw error;
    }

    response.status(200).json({ status: 'success', data: updatedTrip });
  } catch (error) {
    next(error);
  }
};

const simulateRealTrip = async (request, response, next) => {
  try {
    const { originLat, originLng, destLat, destLng } = request.body;
    
    // Call public OSRM mapping service to get real road distance and geometry (driving)
    let carData = null;
    try {
      const osrmResponse = await axios.get(`http://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`);
      carData = osrmResponse.data.routes[0];
    } catch(err) {
      console.error('OSRM API Error:', err.message);
      const error = new Error('Failed to compute route with external map service');
      error.status = 502;
      throw error;
    }

    const distanceKm = carData.distance / 1000;
    
    const simulations = {
      Car: {
        distanceKm: distanceKm,
        durationMinutes: (carData.duration / 60),
        cost: distanceKm * 8, // Rs 8 per km
        co2EmissionsKg: distanceKm * 0.12, // 120g per km
        geometry: carData.geometry
      },
      Bus: {
        distanceKm: distanceKm * 1.05, // Buses typically have longer routes
        durationMinutes: (carData.duration / 60) * 1.5, // 50% slower due to stops
        cost: distanceKm * 1.5, // Rs 1.5 per km
        co2EmissionsKg: distanceKm * 0.03, // 30g per km per passenger
        geometry: carData.geometry
      },
      Bicycle: {
        distanceKm: distanceKm,
        durationMinutes: distanceKm / 15 * 60, // 15 km/h average speed
        cost: 0,
        co2EmissionsKg: 0,
        geometry: carData.geometry
      }
    };

    response.status(200).json({
      status: 'success',
      data: simulations
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNewTripRecord,
  getUserTripHistory,
  validateTripDetail,
  simulateRealTrip
};
