const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (request, response) => {
  try {
    const { fullName, emailAddress, password, userRole } = request.body;

    const existingUser = await User.findOne({ emailAddress });
    if (existingUser) {
      return response.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      emailAddress,
      passwordHash,
      userRole
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, userRole: newUser.userRole },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    response.status(201).json({
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

    const foundUser = await User.findOne({ emailAddress });
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
      { expiresIn: '24h' }
    );

    response.status(200).json({
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
