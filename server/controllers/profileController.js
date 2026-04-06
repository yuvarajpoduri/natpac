const User = require('../models/User');
const Trip = require('../models/Trip');
const bcrypt = require('bcryptjs');

const getUserProfile = async (request, response) => {
  try {
    const userRecord = await User.findById(request.user.userId).select('-passwordHash');
    if (!userRecord) {
      return response.status(404).json({ message: 'User not found' });
    }

    const totalTrips = await Trip.countDocuments({ userId: request.user.userId });
    const validatedTrips = await Trip.countDocuments({ userId: request.user.userId, isTripValidated: true });

    const totalDistanceResult = await Trip.aggregate([
      { $match: { userId: userRecord._id } },
      { $group: { _id: null, totalDistance: { $sum: '$totalDistance' } } }
    ]);

    const totalDistanceKm = totalDistanceResult.length > 0
      ? parseFloat((totalDistanceResult[0].totalDistance / 1000).toFixed(1))
      : 0;

    response.status(200).json({
      fullName: userRecord.fullName,
      emailAddress: userRecord.emailAddress,
      userRole: userRecord.userRole,
      accountCreatedAt: userRecord.accountCreatedAt,
      statistics: {
        totalTrips,
        validatedTrips,
        pendingTrips: totalTrips - validatedTrips,
        totalDistanceKm
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

const changeUserPassword = async (request, response) => {
  try {
    const { currentPassword, newPassword } = request.body;

    const userRecord = await User.findById(request.user.userId);
    if (!userRecord) {
      return response.status(404).json({ message: 'User not found' });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userRecord.passwordHash);
    if (!isCurrentPasswordValid) {
      return response.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    userRecord.passwordHash = newPasswordHash;
    await userRecord.save();

    response.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  changeUserPassword
};
