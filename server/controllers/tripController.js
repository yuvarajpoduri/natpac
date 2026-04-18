const Trip = require('../models/Trip');
const User = require('../models/User');
const axios = require('axios');

// ─────────────────────────────────────────────────────────────────────────────
// Feature 12: Haversine distance formula between two lat/lng points (metres)
// ─────────────────────────────────────────────────────────────────────────────
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Compute total path distance from an ordered array of GPS points
const computePathDistance = (points) => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].latitude,
      points[i - 1].longitude,
      points[i].latitude,
      points[i].longitude
    );
  }
  return total;
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature 6: Carbon emission factors (g CO₂ per km)
// ─────────────────────────────────────────────────────────────────────────────
const EMISSION_FACTORS = {
  Car: 120,
  'Auto-Rickshaw': 90,
  Bus: 80,
  Train: 45,
  Cycling: 0,
  Walking: 0,
  Ferry: 110
};

const calculateCarbon = (mode, distanceMetres) => {
  const factor = EMISSION_FACTORS[mode] ?? 120;
  return Math.round((distanceMetres / 1000) * factor);
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature 8: Simple distance-threshold location clustering (100 m)
// Update user's frequentLocations when a new trip origin is recorded
// ─────────────────────────────────────────────────────────────────────────────
const CLUSTER_RADIUS_METRES = 100;

const updateFrequentLocations = async (userId, lat, lng) => {
  const user = await User.findById(userId);
  if (!user) return;

  const locations = user.frequentLocations || [];
  let matched = null;

  for (const loc of locations) {
    const dist = haversineDistance(loc.latitude, loc.longitude, lat, lng);
    if (dist < CLUSTER_RADIUS_METRES) {
      matched = loc;
      break;
    }
  }

  if (matched) {
    matched.visitCount = (matched.visitCount || 1) + 1;
    matched.lastVisited = new Date();

    // Auto-label based on visit frequency and visit time (heuristic)
    const hour = new Date().getHours();
    if (!matched.label || matched.label === 'Unknown') {
      if (matched.visitCount >= 5 && hour >= 6 && hour <= 9) {
        matched.label = 'Home'; // Frequently leaves from here early morning
      } else if (matched.visitCount >= 5 && hour >= 8 && hour <= 10) {
        matched.label = 'Work';
      }
    }
  } else {
    locations.push({
      latitude: lat,
      longitude: lng,
      label: 'Unknown',
      visitCount: 1,
      lastVisited: new Date()
    });
  }

  user.frequentLocations = locations;
  await user.save();
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE NEW TRIP (Features 1, 3, 6, 8, 12 integrated)
// ─────────────────────────────────────────────────────────────────────────────
const createNewTripRecord = async (request, response, next) => {
  try {
    const {
      originCoordinates,
      destinationCoordinates,
      tripPoints,
      averageSpeed,
      maximumSpeed,
      totalDistance: clientDistance,
      totalDurationSeconds
    } = request.body;

    // ── Reverse geo-code via free Nominatim ──
    const getPlaceName = async (lat, lng) => {
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'User-Agent': 'NATPAC_App/1.0' } }
        );
        if (res.data?.address) {
          const a = res.data.address;
          return a.village || a.suburb || a.neighbourhood || a.road || a.city || a.town || 'Unknown Location';
        }
      } catch (err) {
        console.warn('Reverse geocoding failed:', err.message);
      }
      return 'Unknown Location';
    };

    if (originCoordinates?.latitude) {
      originCoordinates.name = await getPlaceName(originCoordinates.latitude, originCoordinates.longitude);
    }
    if (destinationCoordinates?.latitude) {
      destinationCoordinates.name = await getPlaceName(destinationCoordinates.latitude, destinationCoordinates.longitude);
    }

    // Feature 12: Compute distance from GPS points when available
    let computedDistance = clientDistance;
    if (tripPoints && tripPoints.length >= 2) {
      computedDistance = computePathDistance(tripPoints);
    } else if (
      originCoordinates?.latitude &&
      destinationCoordinates?.latitude
    ) {
      computedDistance = haversineDistance(
        originCoordinates.latitude,
        originCoordinates.longitude,
        destinationCoordinates.latitude,
        destinationCoordinates.longitude
      );
    }

    // Feature 12: Average speed from stored points
    let computedAvgSpeed = averageSpeed;
    let computedMaxSpeed = maximumSpeed;
    if (tripPoints && tripPoints.length > 0) {
      const speeds = tripPoints.map((p) => p.speed || 0).filter((s) => s > 0);
      if (speeds.length > 0) {
        computedAvgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        computedMaxSpeed = Math.max(...speeds);
      }
    }

    // Feature 1: Call AI service for prediction + confidence
    let aiPrediction = 'Pending';
    let aiConfidenceScore = null;

    try {
      const aiRes = await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/predict`, {
        avg_speed: computedAvgSpeed || 0,
        max_speed: computedMaxSpeed || 0,
        duration: totalDurationSeconds || 0,
        stops: 0
      });
      aiPrediction = aiRes.data.predictedMode || 'Car';
      aiConfidenceScore = aiRes.data.confidence || null;
    } catch (aiError) {
      console.warn('AI Service unreachable, using speed-based heuristic');
      if ((computedAvgSpeed || 0) < 8) aiPrediction = 'Walking';
      else if ((computedAvgSpeed || 0) < 25) aiPrediction = 'Cycling';
      else aiPrediction = 'Car';
      aiConfidenceScore = null;
    }

    // Feature 6: Carbon footprint
    const carbonEmissionGrams = calculateCarbon(aiPrediction, computedDistance || 0);

    const newTrip = new Trip({
      userId: request.user.userId,
      originCoordinates,
      destinationCoordinates,
      tripPoints,
      averageSpeed: computedAvgSpeed,
      maximumSpeed: computedMaxSpeed,
      totalDistance: computedDistance,
      totalDurationSeconds,
      aiPredictedMode: aiPrediction,
      aiConfidenceScore,
      carbonEmissionGrams
    });

    await newTrip.save();

    // Feature 3: +5 points per trip logged
    await User.findByIdAndUpdate(request.user.userId, { $inc: { points: 5 } });

    // Feature 8: Update frequent location clusters
    if (originCoordinates?.latitude) {
      await updateFrequentLocations(
        request.user.userId,
        originCoordinates.latitude,
        originCoordinates.longitude
      );
    }

    response.status(201).json({ status: 'success', data: newTrip });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET TRIP HISTORY
// ─────────────────────────────────────────────────────────────────────────────
const getUserTripHistory = async (request, response, next) => {
  try {
    const userTrips = await Trip.find({ userId: request.user.userId }).sort({ tripRecordCreatedAt: -1 });
    response.status(200).json({ status: 'success', data: userTrips });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE TRIP (Features 3, 6, 7 integrated)
// ─────────────────────────────────────────────────────────────────────────────
const validateTripDetail = async (request, response, next) => {
  try {
    const { tripId } = request.params;
    const { userValidatedMode, tripPurpose, travelCost, numberOfCompanions } = request.body;

    const trip = await Trip.findOne({ _id: tripId, userId: request.user.userId });
    if (!trip) {
      const err = new Error('Trip not found or unauthorized');
      err.status = 404;
      throw err;
    }

    // Feature 7: compare AI prediction vs user correction
    const aiPredictionCorrect = trip.aiPredictedMode === userValidatedMode;

    // Feature 6: recompute carbon with user-validated mode
    const carbonEmissionGrams = calculateCarbon(userValidatedMode, trip.totalDistance || 0);

    const wasAlreadyValidated = trip.isTripValidated;

    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        userValidatedMode,
        tripPurpose,
        travelCost,
        numberOfCompanions,
        isTripValidated: true,
        aiPredictionCorrect,
        carbonEmissionGrams
      },
      { new: true }
    );

    // Feature 3: +2 points for AI correction (only if mode changed)
    if (!wasAlreadyValidated && !aiPredictionCorrect) {
      await User.findByIdAndUpdate(request.user.userId, { $inc: { points: 2 } });
    }

    response.status(200).json({ status: 'success', data: updatedTrip });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADD ISSUE TAGS (Feature 9)
// ─────────────────────────────────────────────────────────────────────────────
const addIssueTags = async (request, response, next) => {
  try {
    const { tripId } = request.params;
    const { tags } = request.body; // e.g. ['Traffic', 'Delay']

    const VALID_TAGS = ['Traffic', 'Bad Road', 'Delay'];
    const filteredTags = (tags || []).filter((tag) => VALID_TAGS.includes(tag));

    const updatedTrip = await Trip.findOneAndUpdate(
      { _id: tripId, userId: request.user.userId },
      { issueTags: filteredTags },
      { new: true }
    );

    if (!updatedTrip) {
      const err = new Error('Trip not found or unauthorized');
      err.status = 404;
      throw err;
    }

    response.status(200).json({ status: 'success', data: updatedTrip });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATE REAL TRIP (existing)
// ─────────────────────────────────────────────────────────────────────────────
const simulateRealTrip = async (request, response, next) => {
  try {
    const { originLat, originLng, destLat, destLng } = request.body;

    let carData = null;
    try {
      const osrmResponse = await axios.get(
        `http://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`
      );
      carData = osrmResponse.data.routes[0];
    } catch (err) {
      console.error('OSRM API Error:', err.message);
      const error = new Error('Failed to compute route with external map service');
      error.status = 502;
      throw error;
    }

    const distanceKm = carData.distance / 1000;

    const simulations = {
      Car: {
        distanceKm,
        durationMinutes: carData.duration / 60,
        cost: distanceKm * 8,
        co2EmissionsKg: (distanceKm * EMISSION_FACTORS.Car) / 1000,
        geometry: carData.geometry
      },
      Bus: {
        distanceKm: distanceKm * 1.05,
        durationMinutes: (carData.duration / 60) * 1.5,
        cost: distanceKm * 1.5,
        co2EmissionsKg: (distanceKm * EMISSION_FACTORS.Bus) / 1000,
        geometry: carData.geometry
      },
      Bicycle: {
        distanceKm,
        durationMinutes: (distanceKm / 15) * 60,
        cost: 0,
        co2EmissionsKg: 0,
        geometry: carData.geometry
      }
    };

    response.status(200).json({ status: 'success', data: simulations });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNewTripRecord,
  getUserTripHistory,
  validateTripDetail,
  addIssueTags,
  simulateRealTrip
};
