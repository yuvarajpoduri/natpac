const User = require('../models/User');
const Trip = require('../models/Trip');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile — Full user profile + trip statistics
// ─────────────────────────────────────────────────────────────────────────────
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
      status: 'success',
      data: {
        fullName: userRecord.fullName,
        emailAddress: userRecord.emailAddress,
        userRole: userRecord.userRole,
        accountCreatedAt: userRecord.accountCreatedAt,
        points: userRecord.points || 0,
        trackingPaused: userRecord.trackingPaused || false,
        consentGiven: userRecord.consentGiven || false,
        frequentLocations: userRecord.frequentLocations || [],
        statistics: {
          totalTrips,
          validatedTrips,
          pendingTrips: totalTrips - validatedTrips,
          totalDistanceKm
        }
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/profile — Update profile fields (trackingPaused, consentGiven)
// ─────────────────────────────────────────────────────────────────────────────
const updateUserProfile = async (request, response) => {
  try {
    const allowedFields = ['trackingPaused', 'consentGiven', 'fullName'];
    const updates = {};

    for (const field of allowedFields) {
      if (request.body[field] !== undefined) {
        updates[field] = request.body[field];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      request.user.userId,
      updates,
      { new: true, select: '-passwordHash' }
    );

    if (!updatedUser) {
      return response.status(404).json({ message: 'User not found' });
    }

    response.status(200).json({
      status: 'success',
      data: {
        fullName: updatedUser.fullName,
        emailAddress: updatedUser.emailAddress,
        trackingPaused: updatedUser.trackingPaused,
        consentGiven: updatedUser.consentGiven,
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/profile/password — Change user password
// ─────────────────────────────────────────────────────────────────────────────
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

    if (!newPassword || newPassword.length < 8) {
      return response.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    userRecord.passwordHash = newPasswordHash;
    await userRecord.save();

    response.status(200).json({ status: 'success', message: 'Password updated successfully' });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changeUserPassword
};
