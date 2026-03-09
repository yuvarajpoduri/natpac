const Trip = require('../models/Trip');
const User = require('../models/User');

const getDashboardAnalytics = async (request, response) => {
  try {
    const totalCitizens = await User.countDocuments({ userRole: 'citizen' });
    const totalTrips = await Trip.countDocuments();
    
    const validatedTripsCount = await Trip.countDocuments({ isTripValidated: true });
    
    let aiAccuracy = 0;
    if (validatedTripsCount > 0) {
      const correctPredictions = await Trip.countDocuments({ 
        isTripValidated: true, 
        $expr: { $eq: ["$aiPredictedMode", "$userValidatedMode"] } 
      });
      aiAccuracy = Math.round((correctPredictions / validatedTripsCount) * 100);
    } else {
      aiAccuracy = 100; // default 100% until first validation
    }

    const modeCounts = await Trip.aggregate([
      {
        $group: {
          _id: { $cond: [{ $eq: ["$isTripValidated", true] }, "$userValidatedMode", "$aiPredictedMode"] },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalModes = modeCounts.reduce((acc, curr) => acc + curr.count, 0);
    let modeSplitData = modeCounts.map(mode => ({
      label: mode._id || 'Unknown',
      value: totalModes > 0 ? Math.round((mode.count / totalModes) * 100) : 0
    })).filter(mode => mode.label !== 'Unknown').sort((a, b) => b.value - a.value);

    // If no data, return empty array for frontend to handle
    
    // Fetch all trip coordinates to plot real locations on the map
    const trips = await Trip.find({ 
      'originCoordinates.latitude': { $exists: true } 
    }).select('originCoordinates');

    // Group close coordinates into city nodes to simulate density (radius + trips count)
    // For simplicity of no-dummy-data, every route adds 1 "trip" point to the exact lat,lng.
    const rawTripNodes = trips.map(t => ({
      lat: t.originCoordinates.latitude,
      lng: t.originCoordinates.longitude,
    }));

    // Simple grouping by closest 0.05 lat/lng threshold
    let groupedNodes = [];
    rawTripNodes.forEach(trip => {
      let found = groupedNodes.find(node => 
        Math.abs(node.lat - trip.lat) < 0.05 && 
        Math.abs(node.lng - trip.lng) < 0.05
      );
      if (found) {
        found.trips += 1;
        found.radius = Math.min(found.radius + 1, 30); // max radius 30
      } else {
        groupedNodes.push({ lat: trip.lat, lng: trip.lng, trips: 1, radius: 8, city: `Location (${trip.lat.toFixed(2)}, ${trip.lng.toFixed(2)})` });
      }
    });

    response.status(200).json({
      activeCitizens: totalCitizens,
      tripsCaptured: totalTrips,
      aiAccuracy,
      districtsCovered: groupedNodes.length > 14 ? 14 : groupedNodes.length || 0, // Approx
      modeSplitData,
      tripNodes: groupedNodes
    });

  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardAnalytics };
