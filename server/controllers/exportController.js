const Trip = require('../models/Trip');
const User = require('../models/User');

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
  tripId: `TRIP-${String(tripIndex + 1).padStart(5, '0')}`,
  anonymousUserId: `CITIZEN-${trip.userId?._id?.toString().slice(-6).toUpperCase() || 'UNKNOWN'}`,
  origin: {
    latitude: trip.originCoordinates?.latitude ? parseFloat(trip.originCoordinates.latitude.toFixed(3)) : null,
    longitude: trip.originCoordinates?.longitude ? parseFloat(trip.originCoordinates.longitude.toFixed(3)) : null,
    timestamp: trip.originCoordinates?.timestamp || null
  },
  destination: {
    latitude: trip.destinationCoordinates?.latitude ? parseFloat(trip.destinationCoordinates.latitude.toFixed(3)) : null,
    longitude: trip.destinationCoordinates?.longitude ? parseFloat(trip.destinationCoordinates.longitude.toFixed(3)) : null,
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
      'Trip ID', 'Anonymous User', 'Origin Lat', 'Origin Lng', 'Origin Time',
      'Dest Lat', 'Dest Lng', 'Dest Time', 'Avg Speed (km/h)', 'Max Speed (km/h)',
      'Distance (m)', 'Duration (s)', 'AI Predicted Mode', 'User Validated Mode',
      'Trip Purpose', 'Is Validated', 'Recorded At'
    ].join(',');

    const csvRows = allTrips.map((trip, tripIndex) => {
      const a = mapTripToAnonymized(trip, tripIndex);
      return [
        a.tripId, a.anonymousUserId,
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

    const purposeBreakdown = await Trip.aggregate([
      { $match: { isTripValidated: true, tripPurpose: { $exists: true, $ne: null } } },
      { $group: { _id: '$tripPurpose', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const hourlyDistribution = await Trip.aggregate([
      { $match: { 'originCoordinates.timestamp': { $exists: true } } },
      {
        $group: {
          _id: { $hour: '$originCoordinates.timestamp' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const hourlyData = Array.from({ length: 24 }, (_, hourIndex) => {
      const matched = hourlyDistribution.find(h => h._id === hourIndex);
      return { hour: hourIndex, trips: matched ? matched.count : 0 };
    });

    const averageDistanceResult = await Trip.aggregate([
      { $group: { _id: null, avgDistance: { $avg: '$totalDistance' }, avgSpeed: { $avg: '$averageSpeed' }, avgDuration: { $avg: '$totalDurationSeconds' } } }
    ]);

    const averageMetrics = averageDistanceResult[0] || { avgDistance: 0, avgSpeed: 0, avgDuration: 0 };

    const dailyTrends = await Trip.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$tripRecordCreatedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    const peakHourData = hourlyDistribution.reduce((a,b) => a.count > b.count ? a : b, { count: 0 });
    const topPurpose = purposeBreakdown.length > 0 ? purposeBreakdown[0] : null;

    const insights = [];
    if (peakHourData._id !== undefined) {
      insights.push(`Peak travel occurs at ${peakHourData._id}:00, which accounts for the majority of the recorded traffic.`);
    }
    if (topPurpose) {
      insights.push(`The most common reason for travel is "${topPurpose._id}", representing ${Math.round((topPurpose.count / validatedCount) * 100)}% of validated trips.`);
    }
    if (averageMetrics && averageMetrics.avgDistance > 0) {
      insights.push(`Citizens commute an average of ${(averageMetrics.avgDistance / 1000).toFixed(1)} km per trip, usually taking around ${(averageMetrics.avgDuration / 60).toFixed(0)} minutes.`);
    }
    if (insights.length === 0) insights.push("Collect more trip data to generate automated insights.");

    response.status(200).json({
      status: 'success',
      data: {
        validationSummary: {
          total: totalTrips,
          validated: validatedCount,
          pending: pendingCount,
          validationRate: totalTrips > 0 ? Math.round((validatedCount / totalTrips) * 100) : 0
        },
        purposeBreakdown: purposeBreakdown.map(p => ({ label: p._id, count: p.count })),
        hourlyDistribution: hourlyData,
        averageMetrics: {
          averageDistanceKm: parseFloat((averageMetrics.avgDistance / 1000).toFixed(2)),
          averageSpeedKmh: parseFloat(averageMetrics.avgSpeed?.toFixed(1) || 0),
          averageDurationMinutes: parseFloat((averageMetrics.avgDuration / 60).toFixed(1))
        },
        dailyTrends: dailyTrends.map(d => ({ date: d._id, trips: d.count })),
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
