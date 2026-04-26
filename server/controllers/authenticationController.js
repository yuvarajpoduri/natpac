const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (request, response) => {
  try {
    const { fullName, emailAddress, password, userRole } = request.body;

    if (!fullName || !emailAddress || !password) {
      return response.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 8) {
      return response.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({ emailAddress: emailAddress.toLowerCase().trim() });
    if (existingUser) {
      return response.status(400).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: fullName.trim(),
      emailAddress: emailAddress.toLowerCase().trim(),
      passwordHash,
      userRole: userRole || 'citizen',
      consentGiven: true  // User ticked the consent checkbox in SignupPage
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, userRole: newUser.userRole },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    response.status(201).json({
      status: 'success',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        emailAddress: newUser.emailAddress,
        userRole: newUser.userRole
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

const loginUser = async (request, response) => {
  try {
    const { emailAddress, password } = request.body;

    if (!emailAddress || !password) {
      return response.status(400).json({ message: 'Email and password are required' });
    }

    const foundUser = await User.findOne({ emailAddress: emailAddress.toLowerCase().trim() });
    if (!foundUser) {
      return response.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, foundUser.passwordHash);
    if (!isPasswordCorrect) {
      return response.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: foundUser._id, userRole: foundUser.userRole },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    response.status(200).json({
      status: 'success',
      token,
      user: {
        id: foundUser._id,
        fullName: foundUser.fullName,
        emailAddress: foundUser.emailAddress,
        userRole: foundUser.userRole
      }
    });
  } catch (error) {
    response.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser
};
