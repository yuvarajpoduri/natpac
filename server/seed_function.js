const mongoose = require('mongoose');
const User = require('./models/User');
const Trip = require('./models/Trip');

const seedData = async () => {
  try {
    console.log('--- AUTO-SEEDING 13 DUMMY TRIPS ---');
    
    // 1. Find or create a presentation user
    let user = await User.findOne({ emailAddress: 'presentation@natpac.gov.in' });
    if (!user) {
      user = await User.findOne({});
    }

    if (!user) {
      user = await User.create({
        fullName: 'Presentation User',
        emailAddress: 'presentation@natpac.gov.in',
        passwordHash: '$2b$10$K9rB.K3fL9uB9KjR7W4yO.uW7vF9X3vK4zL5mN6oP7qR8sT9uV1wX',
        userRole: 'citizen',
        points: 500,
        consentGiven: true
      });
    }

    const travelModes = ['Walking', 'Cycling', 'Car', 'Bus', 'Train', 'Auto-Rickshaw'];
    const purposes = ['Commute to Work', 'Shopping', 'Social Visit', 'Exercise', 'Education', 'Other'];
    const locations = [
      { name: 'NATPAC Office', lat: 8.5241, lng: 76.9366 },
      { name: 'Central Railway Station', lat: 8.4871, lng: 76.9491 },
      { name: 'Lulu Mall', lat: 8.5273, lng: 76.8997 },
      { name: 'Technopark', lat: 8.5465, lng: 76.8816 },
      { name: 'Museum & Zoo', lat: 8.5085, lng: 76.9535 },
      { name: 'Shangumugham Beach', lat: 8.4815, lng: 76.9103 },
      { name: 'Medical College', lat: 8.5230, lng: 76.9270 },
      { name: 'East Fort', lat: 8.4820, lng: 76.9450 },
      { name: 'Kovalam Beach', lat: 8.3989, lng: 76.9820 },
      { name: 'Varkala Cliff', lat: 8.7399, lng: 76.7031 }
    ];

    const trips = [];
    const now = new Date();

    for (let i = 0; i < 13; i++) {
      const origin = locations[Math.floor(Math.random() * locations.length)];
      let destination = locations[Math.floor(Math.random() * locations.length)];
      while (destination.name === origin.name) {
        destination = locations[Math.floor(Math.random() * locations.length)];
      }

      const tripDate = new Date(now);
      tripDate.setDate(now.getDate() - Math.floor(i / 2));
      tripDate.setHours(8 + (i % 3) * 4, Math.floor(Math.random() * 60));

      const durationSeconds = 900 + Math.random() * 3600;
      const distanceMetres = 2000 + Math.random() * 15000;
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
          { latitude: (origin.lat + destination.lat) / 2, longitude: (origin.lng + destination.lng) / 2, timestamp: new Date(tripDate.getTime() + (durationSeconds / 2) * 1000), speed: avgSpeed },
          { latitude: destination.lat, longitude: destination.lng, timestamp: new Date(tripDate.getTime() + durationSeconds * 1000), speed: 0 }
        ],
        averageSpeed: avgSpeed,
        maximumSpeed: avgSpeed * 1.2,
        totalDistance: distanceMetres,
        totalDurationSeconds: durationSeconds,
        aiPredictedMode: mode,
        aiConfidenceScore: 85 + Math.random() * 10,
        userValidatedMode: mode,
        tripPurpose: purposes[Math.floor(Math.random() * purposes.length)],
        isTripValidated: true,
        carbonEmissionGrams: Math.floor(distanceMetres * (mode === 'Car' ? 0.12 : mode === 'Bus' ? 0.08 : 0)),
        stressScore: Math.floor(Math.random() * 40),
        stressLevel: 'Low',
        efficiencyScore: 70 + Math.random() * 25,
        tripRecordCreatedAt: tripDate
      });
    }

    await Trip.insertMany(trips);
    console.log(`Successfully added 13 dummy trips to user ${user.emailAddress}`);
    console.log('--- SEEDING COMPLETE ---');
  } catch (error) {
    console.error('Error seeding trips:', error);
  }
};

module.exports = seedData;
