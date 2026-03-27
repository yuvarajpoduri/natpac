const Trip = require('../models/Trip');
const User = require('../models/User');

const exportTripsAsJSON = async (request, response) => {
  try {
    const allTrips = await Trip.find({}).populate('userId', 'fullName emailAddress userRole');

    const anonymizedTrips = allTrips.map((trip, tripIndex) => ({
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
    }));

    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Disposition', 'attachment; filename="natpac_trips_export.json"');
    response.status(200).json(anonymizedTrips);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

const exportTripsAsCSV = async (request, response) => {
  try {
    const allTrips = await Trip.find({}).populate('userId', 'fullName emailAddress userRole');

    const csvHeaders = [
      'Trip ID',
      'Anonymous User',
      'Origin Lat',
      'Origin Lng',
      'Origin Time',
      'Dest Lat',
      'Dest Lng',
      'Dest Time',
      'Avg Speed (km/h)',
      'Max Speed (km/h)',
      'Distance (m)',
      'Duration (s)',
      'AI Predicted Mode',
      'User Validated Mode',
      'Trip Purpose',
      'Is Validated',
      'Recorded At'
    ].join(',');

    const csvRows = allTrips.map((trip, tripIndex) => {
      const anonymousId = `CITIZEN-${trip.userId?._id?.toString().slice(-6).toUpperCase() || 'UNKNOWN'}`;
      const originLat = trip.originCoordinates?.latitude ? trip.originCoordinates.latitude.toFixed(3) : '';
      const originLng = trip.originCoordinates?.longitude ? trip.originCoordinates.longitude.toFixed(3) : '';
      const originTime = trip.originCoordinates?.timestamp ? new Date(trip.originCoordinates.timestamp).toISOString() : '';
      const destLat = trip.destinationCoordinates?.latitude ? trip.destinationCoordinates.latitude.toFixed(3) : '';
      const destLng = trip.destinationCoordinates?.longitude ? trip.destinationCoordinates.longitude.toFixed(3) : '';
      const destTime = trip.destinationCoordinates?.timestamp ? new Date(trip.destinationCoordinates.timestamp).toISOString() : '';

      return [
        `TRIP-${String(tripIndex + 1).padStart(5, '0')}`,
        anonymousId,
        originLat,
        originLng,
        originTime,
        destLat,
        destLng,
        destTime,
        trip.averageSpeed || '',
        trip.maximumSpeed || '',
        trip.totalDistance || '',
        trip.totalDurationSeconds || '',
        trip.aiPredictedMode || '',
        trip.userValidatedMode || '',
        trip.tripPurpose || '',
        trip.isTripValidated,
        trip.tripRecordCreatedAt ? new Date(trip.tripRecordCreatedAt).toISOString() : ''
      ].join(',');
    });

    const fullCsvContent = [csvHeaders, ...csvRows].join('\n');

    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', 'attachment; filename="natpac_trips_export.csv"');
    response.status(200).send(fullCsvContent);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

const getAdvancedAnalytics = async (request, response) => {
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

    response.status(200).json({
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
      dailyTrends: dailyTrends.map(d => ({ date: d._id, trips: d.count }))
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

module.exports = {
  exportTripsAsJSON,
  exportTripsAsCSV,
  getAdvancedAnalytics
};
