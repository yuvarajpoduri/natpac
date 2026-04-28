const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Trip = require('../models/Trip');
const bcrypt = require('bcryptjs');

router.get('/seed-trips', async (req, res) => {
  try {
    // 1. Clear database trips
    await Trip.deleteMany({});
    console.log('Cleared all previous trips.');
    
    const email = 'yuvarajpoduri15@gmail.com';
    const password = 'password123';
    const fullName = 'Yuvaraj Poduri';

    // 2. Find or update the specific user
    let user = await User.findOne({ emailAddress: email });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (user) {
      user.passwordHash = passwordHash;
      user.fullName = fullName;
      user.userRole = 'scientist'; // Set as scientist for full access
      await user.save();
      console.log(`Updated existing user: ${email} (Role: scientist)`);
    } else {
      user = await User.create({
        fullName: fullName,
        emailAddress: email,
        passwordHash: passwordHash,
        userRole: 'scientist',
        points: 500,
        consentGiven: true
      });
      console.log(`Created new user: ${email} (Role: scientist)`);
    }

    const travelModes = ['Walking', 'Cycling', 'Car', 'Bus', 'Train', 'Auto-Rickshaw', 'Ferry'];
    const purposes = ['Work', 'Education', 'Shopping', 'Social / Recreation', 'Medical', 'Return Home'];
    
    const locations = [
      { name: 'NATPAC Office', lat: 8.5241, lng: 76.9366 },
      { name: 'Central Railway Station', lat: 8.4871, lng: 76.9491 },
      { name: 'Lulu Mall', lat: 8.5273, lng: 76.8997 },
      { name: 'Technopark', lat: 8.5465, lng: 76.8816 },
      { name: 'Museum & Zoo', lat: 8.5085, lng: 76.9535 },
      { name: 'Shangumugham Beach', lat: 8.4815, lng: 76.9103 },
      { name: 'Medical College', lat: 8.5230, lng: 76.9270 },
      { name: 'East Fort', lat: 8.4820, lng: 76.9450 }
    ];

    const trips = [];
    // Date ranges: Feb, Mar, Apr
    const months = [1, 2, 3]; 

    // Seed EXACTLY 13 trips
    for (let i = 0; i < 13; i++) {
      const month = months[i % 3];
      const origin = locations[Math.floor(Math.random() * locations.length)];
      let destination = locations[Math.floor(Math.random() * locations.length)];
      while (destination.name === origin.name) {
        destination = locations[Math.floor(Math.random() * locations.length)];
      }

      const day = Math.floor(Math.random() * 25) + 1;
      // Cluster 8 of the 13 trips around 9 AM (Peak hour)
      const hour = i < 8 ? 9 : (12 + (i % 6)); 
      const tripDate = new Date(2026, month, day, hour, Math.floor(Math.random() * 60));
      
      const durationSeconds = 1200 + Math.random() * 2400;
      const distanceMetres = 3000 + Math.random() * 8000;
      const avgSpeed = (distanceMetres / durationSeconds) * 3.6;
      const mode = travelModes[Math.floor(Math.random() * travelModes.length)];
      
      trips.push({
        userId: user._id,
        originCoordinates: {
          latitude: origin.lat,
          longitude: origin.lng,
          timestamp: tripDate,
          name: origin.name
        },
        destinationCoordinates: {
          latitude: destination.lat,
          longitude: destination.lng,
          timestamp: new Date(tripDate.getTime() + durationSeconds * 1000),
          name: destination.name
        },
        tripPoints: [
          { latitude: origin.lat, longitude: origin.lng, timestamp: tripDate, speed: 0 },
          { latitude: destination.lat, longitude: destination.lng, timestamp: new Date(tripDate.getTime() + durationSeconds * 1000), speed: 0 }
        ],
        averageSpeed: avgSpeed,
        maximumSpeed: avgSpeed * 1.3,
        totalDistance: distanceMetres,
        totalDurationSeconds: durationSeconds,
        aiPredictedMode: mode,
        userValidatedMode: mode,
        tripPurpose: purposes[Math.floor(Math.random() * purposes.length)],
        isTripValidated: true,
        carbonEmissionGrams: Math.floor(distanceMetres * 0.1),
        tripRecordCreatedAt: tripDate
      });
    }

    await Trip.insertMany(trips);
    
    res.json({
      success: true,
      message: 'SCIENTIST Account & 13 trips seeded successfully.',
      credentials: {
        email: email,
        password: password
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
