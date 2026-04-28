const Trip = require('../models/Trip');
const User = require('../models/User');
const axios = require('axios');

const buildFilterQuery = (query) => {
  const filter = {};
  if (query.mode) {
    filter.$or = [
      { userValidatedMode: query.mode },
      { aiPredictedMode: query.mode, isTripValidated: false }
    ];
  }
  if (query.validationStatus === 'true') filter.isTripValidated = true;
  if (query.validationStatus === 'false') filter.isTripValidated = false;
  return filter;
};

const mapTripToAnonymized = (trip, tripIndex) => ({
  tripId: trip._id,
  userName: trip.userId?.fullName || 'Anonymous User',
  origin: {
    latitude: trip.originCoordinates?.latitude ? parseFloat(trip.originCoordinates.latitude.toFixed(3)) : null,
    longitude: trip.originCoordinates?.longitude ? parseFloat(trip.originCoordinates.longitude.toFixed(3)) : null,
    name: trip.originCoordinates?.name || 'Unknown',
    timestamp: trip.originCoordinates?.timestamp || null
  },
  destination: {
    latitude: trip.destinationCoordinates?.latitude ? parseFloat(trip.destinationCoordinates.latitude.toFixed(3)) : null,
    longitude: trip.destinationCoordinates?.longitude ? parseFloat(trip.destinationCoordinates.longitude.toFixed(3)) : null,
    name: trip.destinationCoordinates?.name || 'Unknown',
    timestamp: trip.destinationCoordinates?.timestamp || null
  },
  averageSpeedKmh: trip.averageSpeed,
  maximumSpeedKmh: trip.maximumSpeed,
  totalDistanceMeters: trip.totalDistance,
  totalDurationSeconds: trip.totalDurationSeconds,
  aiPredictedMode: trip.aiPredictedMode,
  userValidatedMode: trip.userValidatedMode || null,
  tripPurpose: trip.tripPurpose || null,
  isValidated: trip.isTripValidated,
  recordedAt: trip.tripRecordCreatedAt
});

const getExportPreview = async (request, response, next) => {
  try {
    const filter = buildFilterQuery(request.query);
    const trips = await Trip.find(filter).limit(5).populate('userId', 'fullName emailAddress userRole');
    const anonymized = trips.map(mapTripToAnonymized);
    response.status(200).json({ status: 'success', data: anonymized });
  } catch (error) {
    next(error);
  }
};

const exportTripsAsJSON = async (request, response, next) => {
  try {
    const filter = buildFilterQuery(request.query);
    const allTrips = await Trip.find(filter).populate('userId', 'fullName emailAddress userRole');
    const anonymizedTrips = allTrips.map(mapTripToAnonymized);

    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Disposition', 'attachment; filename="natpac_trips_export.json"');
    response.status(200).json(anonymizedTrips);
  } catch (error) {
    next(error);
  }
};

const exportTripsAsCSV = async (request, response, next) => {
  try {
    const filter = buildFilterQuery(request.query);
    const allTrips = await Trip.find(filter).populate('userId', 'fullName emailAddress userRole');

    const csvHeaders = [
      'Trip ID', 'User Name', 'Origin Lat', 'Origin Lng', 'Origin Time',
      'Dest Lat', 'Dest Lng', 'Dest Time', 'Avg Speed (km/h)', 'Max Speed (km/h)',
      'Distance (m)', 'Duration (s)', 'AI Predicted Mode', 'User Validated Mode',
      'Trip Purpose', 'Is Validated', 'Recorded At'
    ].join(',');

    const csvRows = allTrips.map((trip, tripIndex) => {
      const a = mapTripToAnonymized(trip, tripIndex);
      return [
        a.tripId, a.userName,
        a.origin.latitude || '', a.origin.longitude || '', a.origin.timestamp ? new Date(a.origin.timestamp).toISOString() : '',
        a.destination.latitude || '', a.destination.longitude || '', a.destination.timestamp ? new Date(a.destination.timestamp).toISOString() : '',
        a.averageSpeedKmh || '', a.maximumSpeedKmh || '', a.totalDistanceMeters || '', a.totalDurationSeconds || '',
        a.aiPredictedMode || '', a.userValidatedMode || '', a.tripPurpose || '', a.isValidated,
        a.recordedAt ? new Date(a.recordedAt).toISOString() : ''
      ].join(',');
    });

    const fullCsvContent = [csvHeaders, ...csvRows].join('\n');
    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', 'attachment; filename="natpac_trips_export.csv"');
    response.status(200).send(fullCsvContent);
  } catch (error) {
    next(error);
  }
};

const getAdvancedAnalytics = async (request, response, next) => {
  try {
    const totalTrips = await Trip.countDocuments();
    const validatedCount = await Trip.countDocuments({ isTripValidated: true });
    const pendingCount = totalTrips - validatedCount;

    // 1. Purpose Breakdown
    const purposeBreakdown = await Trip.aggregate([
      { $match: { isTripValidated: true, tripPurpose: { $exists: true, $ne: null } } },
      { $group: { _id: '$tripPurpose', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 2. Accurate Hourly Distribution & Peak Time
    const hourlyDistribution = await Trip.aggregate([
      { $match: { 'originCoordinates.timestamp': { $exists: true } } },
      {
        $group: {
          _id: { $hour: { date: '$originCoordinates.timestamp', timezone: 'Asia/Kolkata' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const hourlyData = Array.from({ length: 24 }, (_, hourIndex) => {
      const matched = hourlyDistribution.find(h => h._id === hourIndex);
      return { hour: hourIndex, trips: matched ? matched.count : 0 };
    });

    const peakHourResult = hourlyDistribution.reduce((a, b) => (a.count > b.count ? a : b), { _id: 0, count: 0 });
    const peakHourText = `${peakHourResult._id % 12 || 12}:00 ${peakHourResult._id >= 12 ? 'PM' : 'AM'}`;

    // 3. Average Metrics
    const averageDistanceResult = await Trip.aggregate([
      { $group: { _id: null, avgDistance: { $avg: '$totalDistance' }, avgSpeed: { $avg: '$averageSpeed' }, avgDuration: { $avg: '$totalDurationSeconds' } } }
    ]);

    const averageMetrics = averageDistanceResult[0] || { avgDistance: 0, avgSpeed: 0, avgDuration: 0 };

    // 4. Recent Trips for Calendar Drilldown
    const startDate = new Date('2026-02-01');
    const recentTrips = await Trip.find({ tripRecordCreatedAt: { $gte: startDate } })
      .populate('userId', 'fullName')
      .sort({ tripRecordCreatedAt: 1 });

    const anonymizedRecent = recentTrips.map(mapTripToAnonymized);

    // 5. Carbon Savings
    const carbonSavingsByMode = await Trip.aggregate([
      { $match: { isTripValidated: true } },
      {
        $group: {
          _id: '$userValidatedMode',
          actualEmissions: { $sum: '$carbonEmissionGrams' },
          totalDistance: { $sum: '$totalDistance' }
        }
      }
    ]);

    const processedCarbon = carbonSavingsByMode.map(m => {
      const carBaseline = (m.totalDistance / 1000) * 120;
      const saved = Math.max(0, Math.round(carBaseline - m.actualEmissions));
      return { mode: m._id, saved, total: Math.round(carBaseline) };
    }).filter(c => c.saved > 0).sort((a, b) => b.saved - a.saved);

    // 6. Region Coverage
    const regionCoverage = await Trip.aggregate([
      { $match: { 'originCoordinates.name': { $exists: true, $ne: 'Unknown Location' } } },
      { $group: { _id: '$originCoordinates.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 4 }
    ]);

    const processedRegions = regionCoverage.map(r => ({
      name: r._id,
      count: r.count,
      pct: totalTrips > 0 ? Math.round((r.count / totalTrips) * 100) : 0
    }));

    // 7. Dynamic Insights (Accurate Peak Hour)
    const insights = [];
    insights.push(`Peak mobility occurs at ${peakHourText}, accounting for ${peakHourResult.count} trip logs.`);
    
    if (purposeBreakdown.length > 0) {
      insights.push(`Top travel purpose: "${purposeBreakdown[0]._id}" with ${purposeBreakdown[0].count} entries.`);
    }
    if (averageMetrics.avgDistance > 0) {
      insights.push(`Average citizen commute: ${(averageMetrics.avgDistance / 1000).toFixed(1)} km at ${(averageMetrics.avgSpeed || 0).toFixed(1)} km/h.`);
    }

    const activeUsers = await User.countDocuments();

    response.status(200).json({
      status: 'success',
      data: {
        validationSummary: {
          total: totalTrips,
          validated: validatedCount,
          pending: pendingCount,
          validationRate: totalTrips > 0 ? Math.round((validatedCount / totalTrips) * 100) : 0
        },
        peakHour: peakHourText,
        purposeBreakdown: purposeBreakdown.map(p => ({ label: p._id, count: p.count })),
        hourlyDistribution: hourlyData,
        averageMetrics: {
          averageDistanceKm: parseFloat((averageMetrics.avgDistance / 1000).toFixed(2)),
          averageSpeedKmh: parseFloat(averageMetrics.avgSpeed?.toFixed(1) || 0),
          averageDurationMinutes: parseFloat((averageMetrics.avgDuration / 60).toFixed(1))
        },
        recentTrips: anonymizedRecent,
        carbonSavings: processedCarbon,
        districtCoverage: processedRegions,
        activeUsers,
        insights: insights
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExportPreview,
  exportTripsAsJSON,
  exportTripsAsCSV,
  getAdvancedAnalytics
};
