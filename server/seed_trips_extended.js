const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Trip = require('./models/Trip');

const seedTripsExtended = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const user = await User.findOne({ emailAddress: 'presentation@natpac.gov.in' });
    if (!user) {
      console.error('Presentation user not found. Please run seed-trips once through the browser or manually create user.');
      process.exit(1);
    }

    console.log('Deleting old trips for presentation user...');
    await Trip.deleteMany({ userId: user._id });

    const modes = ['Car', 'Bus', 'Walking', 'Cycling', 'Auto-Rickshaw', 'Train', 'Ferry'];
    const purposes = ['Work', 'Education', 'Shopping', 'Social', 'Return Home'];
    const locations = [
      { name: 'Trivandrum Central', lat: 8.4875, lng: 76.9525 },
      { name: 'Technopark Phase 1', lat: 8.5582, lng: 76.8812 },
      { name: 'Kochi Marine Drive', lat: 9.9816, lng: 76.2755 },
      { name: 'Lulu Mall Edappally', lat: 10.0261, lng: 76.3125 },
      { name: 'Calicut Beach', lat: 11.2625, lng: 75.7672 },
      { name: 'East Fort TVM', lat: 8.4831, lng: 76.9485 },
      { name: 'Vytilla Hub Kochi', lat: 9.9678, lng: 76.3204 }
    ];

    const trips = [];
    const startDate = new Date('2026-02-01');
    const endDate = new Date(); // Today (April 28, 2026)

    // Generate ~40 trips spread across Feb to April
    for (let i = 0; i < 40; i++) {
      const mode = modes[Math.floor(Math.random() * modes.length)];
      const purpose = purposes[Math.floor(Math.random() * purposes.length)];
      const startLoc = locations[Math.floor(Math.random() * locations.length)];
      let endLoc = locations[Math.floor(Math.random() * locations.length)];
      while (startLoc.name === endLoc.name) {
        endLoc = locations[Math.floor(Math.random() * locations.length)];
      }

      // Random date between Feb 1 and Today
      const tripDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      
      const distance = Math.floor(Math.random() * 15000) + 1000; // 1km to 16km
      const duration = Math.floor(distance / 5) + 300; // rough seconds

      const newTrip = new Trip({
        userId: user._id,
        originCoordinates: {
          latitude: startLoc.lat,
          longitude: startLoc.lng,
          name: startLoc.name,
          timestamp: tripDate
        },
        destinationCoordinates: {
          latitude: endLoc.lat,
          longitude: endLoc.lng,
          name: endLoc.name,
          timestamp: new Date(tripDate.getTime() + duration * 1000)
        },
        totalDistance: distance,
        totalDurationSeconds: duration,
        aiPredictedMode: mode,
        userValidatedMode: mode,
        isTripValidated: Math.random() > 0.3,
        tripPurpose: purpose,
        carbonEmissionGrams: Math.floor(Math.random() * 2000),
        tripRecordCreatedAt: tripDate,
        aiPredictionCorrect: true
      });

      trips.push(newTrip);
    }

    await Trip.insertMany(trips);
    console.log(`Successfully seeded ${trips.length} trips from Feb to April.`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedTripsExtended();
