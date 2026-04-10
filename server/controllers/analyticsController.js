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
    
    const trips = await Trip.find({ 
      'originCoordinates.latitude': { $exists: true } 
    }).select('originCoordinates');

    // Group close coordinates into city nodes to simulate density (radius + trips count)
    // Using simple coordinate rounding as a grid-based spatial cluster
    let groupedNodes = [];
    trips.forEach(t => {
      const lat = parseFloat(t.originCoordinates.latitude.toFixed(2));
      const lng = parseFloat(t.originCoordinates.longitude.toFixed(2));
      
      let found = groupedNodes.find(node => node.lat === lat && node.lng === lng);
      if (found) {
        found.trips += 1;
        found.radius = Math.min(found.radius + 1.5, 35); // max radius 35 for UI scale
      } else {
        groupedNodes.push({ lat, lng, trips: 1, radius: 10, city: `Zone (${lat}, ${lng})` });
      }
    });

    response.status(200).json({
      status: 'success',
      data: {
        activeCitizens: totalCitizens,
        tripsCaptured: totalTrips,
        aiAccuracy,
        districtsCovered: groupedNodes.length > 14 ? 14 : groupedNodes.length || 0, // Approx 14 districts in Kerala
        modeSplitData,
        tripNodes: groupedNodes
      }
    });

  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardAnalytics };
