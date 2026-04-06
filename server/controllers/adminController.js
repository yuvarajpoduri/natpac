const User = require('../models/User');
const Trip = require('../models/Trip');

const getAllSystemUsers = async (request, response) => {
  try {
    const allUsers = await User.find({}).select('-passwordHash').sort({ accountCreatedAt: -1 });

    const usersWithTripCounts = await Promise.all(
      allUsers.map(async (singleUser) => {
        const tripCount = await Trip.countDocuments({ userId: singleUser._id });
        const validatedTripCount = await Trip.countDocuments({ userId: singleUser._id, isTripValidated: true });
        return {
          userId: singleUser._id,
          fullName: singleUser.fullName,
          emailAddress: singleUser.emailAddress,
          userRole: singleUser.userRole,
          accountCreatedAt: singleUser.accountCreatedAt,
          totalTrips: tripCount,
          validatedTrips: validatedTripCount
        };
      })
    );

    response.status(200).json(usersWithTripCounts);
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

const getSystemHealthStatus = async (request, response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCitizens = await User.countDocuments({ userRole: 'citizen' });
    const totalScientists = await User.countDocuments({ userRole: 'scientist' });
    const totalTrips = await Trip.countDocuments();
    const validatedTrips = await Trip.countDocuments({ isTripValidated: true });
    const pendingTrips = totalTrips - validatedTrips;

    const databaseSizeEstimate = {
      usersCollection: `${totalUsers} documents`,
      tripsCollection: `${totalTrips} documents`,
      estimatedStorageKB: Math.round((totalUsers * 0.5) + (totalTrips * 2))
    };

    const oldestTrip = await Trip.findOne({}).sort({ tripRecordCreatedAt: 1 }).select('tripRecordCreatedAt');
    const newestTrip = await Trip.findOne({}).sort({ tripRecordCreatedAt: -1 }).select('tripRecordCreatedAt');

    response.status(200).json({
      serverStatus: 'online',
      serverTimestamp: new Date().toISOString(),
      nodeVersion: process.version,
      uptime: `${Math.round(process.uptime())} seconds`,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      users: { total: totalUsers, citizens: totalCitizens, scientists: totalScientists },
      trips: { total: totalTrips, validated: validatedTrips, pending: pendingTrips },
      database: databaseSizeEstimate,
      dataRange: {
        oldest: oldestTrip?.tripRecordCreatedAt || null,
        newest: newestTrip?.tripRecordCreatedAt || null
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

const deleteUserAccount = async (request, response) => {
  try {
    const { targetUserId } = request.params;

    await Trip.deleteMany({ userId: targetUserId });
    await User.findByIdAndDelete(targetUserId);

    response.status(200).json({ message: 'User and associated trips deleted successfully' });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSystemUsers,
  getSystemHealthStatus,
  deleteUserAccount
};
