const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const User = require('../models/User');

// Helper: convert string userId to ObjectId
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// ─────────────────────────────────────────────────────────────────────────────
// SCIENTIST DASHBOARD — global stats
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardAnalytics = async (request, response) => {
  try {
    const totalCitizens = await User.countDocuments({ userRole: 'citizen' });
    const totalTrips = await Trip.countDocuments();
    const validatedTripsCount = await Trip.countDocuments({ isTripValidated: true });

    // Feature 7: AI accuracy via stored boolean field
    let aiAccuracy = 0;
    if (validatedTripsCount > 0) {
      const correctPredictions = await Trip.countDocuments({
        isTripValidated: true,
        aiPredictionCorrect: true
      });
      aiAccuracy = Math.round((correctPredictions / validatedTripsCount) * 100);
    } else {
      aiAccuracy = 100; // default until first validation
    }

    const modeCounts = await Trip.aggregate([
      {
        $group: {
          _id: { $cond: [{ $eq: ['$isTripValidated', true] }, '$userValidatedMode', '$aiPredictedMode'] },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalModes = modeCounts.reduce((acc, curr) => acc + curr.count, 0);
    const modeSplitData = modeCounts
      .map((mode) => ({
        label: mode._id || 'Unknown',
        value: totalModes > 0 ? Math.round((mode.count / totalModes) * 100) : 0
      }))
      .filter((mode) => mode.label !== 'Unknown')
      .sort((a, b) => b.value - a.value);

    const trips = await Trip.find({
      'originCoordinates.latitude': { $exists: true }
    }).select('originCoordinates');

    // Group close coordinates into city nodes
    let groupedNodes = [];
    trips.forEach((t) => {
      const lat = parseFloat(t.originCoordinates.latitude.toFixed(2));
      const lng = parseFloat(t.originCoordinates.longitude.toFixed(2));
      const found = groupedNodes.find((node) => node.lat === lat && node.lng === lng);
      if (found) {
        found.trips += 1;
        found.radius = Math.min(found.radius + 1.5, 35);
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
        districtsCovered: groupedNodes.length > 14 ? 14 : groupedNodes.length || 0,
        modeSplitData,
        tripNodes: groupedNodes
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature 2: Personal Travel Stats Dashboard
// ─────────────────────────────────────────────────────────────────────────────
const getPersonalStats = async (request, response) => {
  try {
    const userId = request.user.userId;
    const oid = toObjectId(userId);

    const stats = await Trip.aggregate([
      { $match: { userId: oid } },
      {
        $group: {
          _id: null,
          totalTrips: { $sum: 1 },
          totalDistance: { $sum: '$totalDistance' },
          totalDuration: { $sum: '$totalDurationSeconds' },
          avgDuration: { $avg: '$totalDurationSeconds' }
        }
      }
    ]);

    // Most used travel mode (validated overrides predicted)
    const modePipeline = await Trip.aggregate([
      { $match: { userId: oid } },
      {
        $group: {
          _id: { $cond: [{ $eq: ['$isTripValidated', true] }, '$userValidatedMode', '$aiPredictedMode'] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    // Trip counts per mode for pie chart
    const modeBreakdown = await Trip.aggregate([
      { $match: { userId: oid } },
      {
        $group: {
          _id: { $cond: [{ $eq: ['$isTripValidated', true] }, '$userValidatedMode', '$aiPredictedMode'] },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Feature 6: per-user total carbon
    const carbonStats = await Trip.aggregate([
      { $match: { userId: oid, carbonEmissionGrams: { $ne: null } } },
      { $group: { _id: null, totalCarbon: { $sum: '$carbonEmissionGrams' } } }
    ]);

    const s = stats[0] || {};
    const user = await User.findById(userId).select('points fullName frequentLocations');

    response.status(200).json({
      status: 'success',
      data: {
        totalTrips: s.totalTrips || 0,
        totalDistanceKm: ((s.totalDistance || 0) / 1000).toFixed(2),
        totalDurationHours: ((s.totalDuration || 0) / 3600).toFixed(1),
        avgDurationMinutes: ((s.avgDuration || 0) / 60).toFixed(1),
        mostUsedMode: modePipeline[0]?._id || 'N/A',
        modeBreakdown: modeBreakdown.map((m) => ({ mode: m._id || 'Unknown', count: m.count })),
        totalCarbonGrams: carbonStats[0]?.totalCarbon || 0,
        points: user?.points || 0,
        frequentLocations: user?.frequentLocations || []
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature 5: Weekly Summary Insights
// ─────────────────────────────────────────────────────────────────────────────
const getWeeklySummary = async (request, response) => {
  try {
    const userId = request.user.userId;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyTrips = await Trip.find({
      userId: toObjectId(userId),
      tripRecordCreatedAt: { $gte: startOfWeek }
    });

    // Most active time range (24-slot bucketing)
    const hourBuckets = new Array(24).fill(0);
    weeklyTrips.forEach((trip) => {
      const hr = new Date(trip.tripRecordCreatedAt).getHours();
      hourBuckets[hr]++;
    });
    const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));
    const timeLabel = (h) => {
      const suffix = h >= 12 ? 'PM' : 'AM';
      const display = h % 12 || 12;
      return `${display}:00 ${suffix}`;
    };
    const mostActiveRange = `${timeLabel(peakHour)} – ${timeLabel((peakHour + 1) % 24)}`;

    // Most used mode this week
    const modeCounts = {};
    weeklyTrips.forEach((trip) => {
      const mode = trip.isTripValidated ? trip.userValidatedMode : trip.aiPredictedMode;
      if (mode) modeCounts[mode] = (modeCounts[mode] || 0) + 1;
    });
    const mostUsedMode =
      Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const weeklyCarbon = weeklyTrips.reduce((sum, t) => sum + (t.carbonEmissionGrams || 0), 0);

    // Trips per day for sparkline (last 7 days)
    const tripsPerDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { weekday: 'short' });
      tripsPerDay[key] = 0;
    }
    weeklyTrips.forEach((trip) => {
      const key = new Date(trip.tripRecordCreatedAt).toLocaleDateString('en-IN', { weekday: 'short' });
      if (tripsPerDay[key] !== undefined) tripsPerDay[key]++;
    });

    response.status(200).json({
      status: 'success',
      data: {
        totalTripsThisWeek: weeklyTrips.length,
        mostActiveRange,
        mostUsedMode,
        weeklyDistanceKm: (
          weeklyTrips.reduce((s, t) => s + (t.totalDistance || 0), 0) / 1000
        ).toFixed(1),
        weeklyCarbonGrams: weeklyCarbon,
        tripsPerDay
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature 7: AI vs User Accuracy — scientist view
// ─────────────────────────────────────────────────────────────────────────────
const getAiAccuracyStats = async (request, response) => {
  try {
    const total = await Trip.countDocuments({ isTripValidated: true });
    const correct = await Trip.countDocuments({ isTripValidated: true, aiPredictionCorrect: true });

    const modeBreakdown = await Trip.aggregate([
      { $match: { isTripValidated: true } },
      {
        $group: {
          _id: '$aiPredictedMode',
          total: { $sum: 1 },
          correct: { $sum: { $cond: ['$aiPredictionCorrect', 1, 0] } }
        }
      }
    ]);

    response.status(200).json({
      status: 'success',
      data: {
        totalValidated: total,
        correctPredictions: correct,
        accuracyPercent: total > 0 ? Math.round((correct / total) * 100) : null,
        modeBreakdown: modeBreakdown.map((m) => ({
          mode: m._id,
          total: m.total,
          correct: m.correct,
          accuracy: m.total > 0 ? Math.round((m.correct / m.total) * 100) : 0
        }))
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Feature 11: Scientist Dashboard Filters
// ─────────────────────────────────────────────────────────────────────────────
const getFilteredTrips = async (request, response) => {
  try {
    const { startDate, endDate, mode, timeOfDay } = request.query;

    const filter = {};

    if (startDate || endDate) {
      filter.tripRecordCreatedAt = {};
      if (startDate) filter.tripRecordCreatedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.tripRecordCreatedAt.$lte = end;
      }
    }

    if (mode) {
      filter.$or = [{ aiPredictedMode: mode }, { userValidatedMode: mode }];
    }

    let trips = await Trip.find(filter)
      .sort({ tripRecordCreatedAt: -1 })
      .select(
        'aiPredictedMode userValidatedMode isTripValidated totalDistance totalDurationSeconds tripRecordCreatedAt carbonEmissionGrams averageSpeed'
      );

    // Time-of-day filter (post-query in memory for simplicity)
    if (timeOfDay) {
      const ranges = {
        morning: [6, 12],
        afternoon: [12, 17],
        evening: [17, 21],
        night: [21, 6]
      };
      const [start, end] = ranges[timeOfDay] || [0, 24];
      trips = trips.filter((t) => {
        const hr = new Date(t.tripRecordCreatedAt).getHours();
        if (timeOfDay === 'night') return hr >= 21 || hr < 6;
        return hr >= start && hr < end;
      });
    }

    const totalDistance = trips.reduce((s, t) => s + (t.totalDistance || 0), 0);
    const totalCarbon = trips.reduce((s, t) => s + (t.carbonEmissionGrams || 0), 0);

    const modeCounts = {};
    trips.forEach((t) => {
      const m = t.isTripValidated ? t.userValidatedMode : t.aiPredictedMode;
      if (m) modeCounts[m] = (modeCounts[m] || 0) + 1;
    });

    response.status(200).json({
      status: 'success',
      data: {
        count: trips.length,
        totalDistanceKm: (totalDistance / 1000).toFixed(2),
        totalCarbonGrams: totalCarbon,
        modeSplit: Object.entries(modeCounts).map(([mode, count]) => ({ mode, count })),
        trips
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardAnalytics,
  getPersonalStats,
  getWeeklySummary,
  getAiAccuracyStats,
  getFilteredTrips
};
