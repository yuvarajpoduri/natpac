/**
 * Routelytics — Comprehensive Data Seeder
 * =========================================
 * Seeds realistic dummy data from February 2026 to April 2026.
 *
 * Creates:
 *   • 2 scientist accounts + 5 citizen accounts
 *   • ~300 trips across all 14 Kerala districts
 *   • Realistic GPS coordinates, speeds, durations
 *   • AI-predicted modes + user validations
 *   • Carbon footprints, stress scores, issue events
 *   • Gamification points
 *
 * Run:
 *   node seed.js
 *
 * WARNING: This will ADD data to your existing database.
 *          To clear first: node seed.js --clear
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('./models/User');
const Trip     = require('./models/Trip');

// ─── Kerala district centre coordinates ──────────────────────────────────────
const KERALA_DISTRICTS = [
  { name: 'Thiruvananthapuram', lat: 8.5241,  lng: 76.9366 },
  { name: 'Kollam',             lat: 8.8932,  lng: 76.6141 },
  { name: 'Pathanamthitta',     lat: 9.2648,  lng: 76.7870 },
  { name: 'Alappuzha',          lat: 9.4981,  lng: 76.3388 },
  { name: 'Kottayam',           lat: 9.5916,  lng: 76.5222 },
  { name: 'Idukki',             lat: 9.9189,  lng: 77.1025 },
  { name: 'Ernakulam',          lat: 9.9312,  lng: 76.2673 },
  { name: 'Thrissur',           lat: 10.5276, lng: 76.2144 },
  { name: 'Palakkad',           lat: 10.7867, lng: 76.6548 },
  { name: 'Malappuram',         lat: 11.0510, lng: 76.0711 },
  { name: 'Kozhikode',          lat: 11.2588, lng: 75.7804 },
  { name: 'Wayanad',            lat: 11.6854, lng: 76.1320 },
  { name: 'Kannur',             lat: 11.8745, lng: 75.3704 },
  { name: 'Kasaragod',          lat: 12.4996, lng: 74.9869 },
];

// ─── Trip profiles by mode ────────────────────────────────────────────────────
const TRIP_PROFILES = {
  'Walking':       { avgSpeed: [3, 5.5],   maxSpeed: [5, 8],    duration: [300, 2400],   distKm: [0.2, 2.5],   stops: [0, 2],  carbonFactor: 0,    cost: 0      },
  'Cycling':       { avgSpeed: [10, 18],   maxSpeed: [16, 28],  duration: [600, 4200],   distKm: [1, 8],       stops: [0, 4],  carbonFactor: 0,    cost: 0      },
  'Auto-Rickshaw': { avgSpeed: [16, 28],   maxSpeed: [28, 52],  duration: [300, 2700],   distKm: [1, 12],      stops: [3, 15], carbonFactor: 132,  cost: [30, 200] },
  'Bus':           { avgSpeed: [14, 30],   maxSpeed: [40, 70],  duration: [900, 12600],  distKm: [3, 60],      stops: [12, 55], carbonFactor: 68,  cost: [10, 80]  },
  'Car':           { avgSpeed: [28, 68],   maxSpeed: [55, 120], duration: [300, 10800],  distKm: [2, 120],     stops: [1, 18], carbonFactor: 171,  cost: 0      },
  'Train':         { avgSpeed: [50, 90],   maxSpeed: [90, 130], duration: [1800, 18000], distKm: [20, 350],    stops: [1, 8],  carbonFactor: 41,   cost: [25, 500] },
  'Ferry':         { avgSpeed: [12, 22],   maxSpeed: [20, 30],  duration: [600, 5400],   distKm: [1, 25],      stops: [0, 2],  carbonFactor: 120,  cost: [5, 60]   },
};

const MODES = Object.keys(TRIP_PROFILES);

const PURPOSES   = ['Work', 'Education', 'Shopping', 'Social / Recreation', 'Medical', 'Return Home'];
const ISSUE_TYPES = ['traffic', 'delay', 'bad_road'];
const STRESS_LEVELS = ['Low', 'Medium', 'High'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rnd  = (min, max) => Math.random() * (max - min) + min;
const rndI = (min, max) => Math.floor(rnd(min, max + 1));
const pick = (arr)      => arr[rndI(0, arr.length - 1)];
const jitter = (v, pct = 0.15) => v + v * (Math.random() - 0.5) * 2 * pct;

function randomDateBetween(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function buildTripPoints(originLat, originLng, destLat, destLng, numPoints, durationSec) {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    points.push({
      latitude:  originLat + (destLat - originLat) * t + jitter(0.005, 0.5),
      longitude: originLng + (destLng - originLng) * t + jitter(0.005, 0.5),
      speed:     rnd(0, 10),
      timestamp: new Date(Date.now() - durationSec * 1000 + (durationSec / numPoints) * i * 1000),
    });
  }
  return points;
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const r = d => d * Math.PI / 180;
  const dLat = r(lat2 - lat1), dLng = r(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildTrip(userId, createdAt, mode, district) {
  const p = TRIP_PROFILES[mode];

  const avgSpd = rnd(...p.avgSpeed);
  const maxSpd = rnd(...p.maxSpeed);
  const durSec = rndI(...p.duration);
  const distKm = rnd(...p.distKm);
  const distM  = distKm * 1000;
  const stops  = rndI(...p.stops);

  // Pick two nearby points within the district
  const lat1 = district.lat + jitter(0.05, 1);
  const lng1 = district.lng + jitter(0.05, 1);
  const lat2 = district.lat + jitter(0.05, 1);
  const lng2 = district.lng + jitter(0.05, 1);

  const tripStartAt = new Date(createdAt.getTime() - durSec * 1000);
  const numPoints   = Math.max(5, Math.floor(durSec / 30));

  // Carbon calculation
  let carbonGrams = 0;
  if (p.carbonFactor > 0) {
    carbonGrams = Math.round(distKm * p.carbonFactor);
  }

  // AI confidence score (simulate)
  const aiConfidence = rnd(62, 98);

  // Determine if validated and whether AI was correct
  const isValidated = Math.random() > 0.35;
  const aiCorrect   = isValidated ? Math.random() > 0.18 : null;
  const purpose     = pick(PURPOSES);

  // Stress
  const stressScore = rndI(10, 90);
  const stressLevel = stressScore < 35 ? 'Low' : stressScore < 65 ? 'Medium' : 'High';

  // Issues (30% of trips have issue events)
  const issueEvents = [];
  if (Math.random() < 0.30) {
    const count = rndI(1, 3);
    for (let i = 0; i < count; i++) {
      issueEvents.push({
        issueType:       pick(ISSUE_TYPES),
        latitude:        lat1 + jitter(0.01, 1),
        longitude:       lng1 + jitter(0.01, 1),
        timestamp:       new Date(tripStartAt.getTime() + rnd(60, durSec - 60) * 1000),
        durationSeconds: rndI(30, 600),
      });
    }
  }

  // Auto tags
  const autoTags = [];
  if (distKm < 1)   autoTags.push('Short Trip');
  if (distKm > 50)  autoTags.push('Long Distance');
  if (stops > 20)   autoTags.push('High Traffic');
  if (carbonGrams === 0) autoTags.push('Zero Emission');
  if (stressLevel === 'High') autoTags.push('Stressful Trip');

  // Efficiency score
  const efficiencyScore = Math.round(rnd(40, 100));

  // Idle time
  const idleTimeSec = mode === 'Bus' ? rndI(60, 600) : rndI(0, 180);

  // Travel cost
  let travelCost = 0;
  if (Array.isArray(p.cost)) travelCost = Math.round(rnd(...p.cost));

  // Habit label (morning/evening commute heuristic)
  const hour = createdAt.getHours();
  let habitLabel = null;
  if (hour >= 7 && hour <= 9  && (purpose === 'Work' || purpose === 'Education')) habitLabel = 'Morning Commute';
  if (hour >= 17 && hour <= 20 && purpose === 'Return Home') habitLabel = 'Evening Return';

  return {
    userId,
    originCoordinates:      { latitude: lat1, longitude: lng1, timestamp: tripStartAt, name: district.name },
    destinationCoordinates: { latitude: lat2, longitude: lng2, timestamp: createdAt,   name: district.name },
    tripPoints:             buildTripPoints(lat1, lng1, lat2, lng2, Math.min(numPoints, 30), durSec),
    averageSpeed:           parseFloat(avgSpd.toFixed(1)),
    maximumSpeed:           parseFloat(maxSpd.toFixed(1)),
    totalDistance:          Math.round(distM),
    totalDurationSeconds:   durSec,
    aiPredictedMode:        mode,
    aiConfidenceScore:      parseFloat(aiConfidence.toFixed(1)),
    userValidatedMode:      isValidated ? (aiCorrect ? mode : pick(MODES.filter(m => m !== mode))) : undefined,
    tripPurpose:            isValidated ? purpose : undefined,
    isTripValidated:        isValidated,
    aiPredictionCorrect:    aiCorrect,
    carbonEmissionGrams:    carbonGrams,
    stressScore,
    stressLevel,
    issueEvents,
    autoTags,
    efficiencyScore,
    idleTimeSeconds:        idleTimeSec,
    travelCost,
    numberOfCompanions:     rndI(0, 4),
    dataConfidenceScore:    rndI(55, 100),
    habitLabel,
    isMerged:               false,
    tripRecordCreatedAt:    createdAt,
  };
}

// ─── Main seeder ──────────────────────────────────────────────────────────────

async function seed() {
  const shouldClear = process.argv.includes('--clear');

  console.log('\n══════════════════════════════════════════════════');
  console.log('  Routelytics — Database Seeder');
  console.log('══════════════════════════════════════════════════');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  if (shouldClear) {
    console.log('⚠️  --clear flag detected. Wiping trips and non-admin users...');
    await Trip.deleteMany({});
    await User.deleteMany({ emailAddress: { $regex: /seed\.|citizen\.|scientist\./ } });
    console.log('   Cleared.\n');
  }

  // ── Create users ──────────────────────────────────────────────────────────
  const salt = await bcrypt.genSalt(10);
  const pw   = await bcrypt.hash('password123', salt);

  const scientistUsers = [
    { fullName: 'Dr. Arjun Menon',     emailAddress: 'scientist.arjun@natpac.kerala.gov.in',   userRole: 'scientist' },
    { fullName: 'Dr. Priya Nambiar',   emailAddress: 'scientist.priya@natpac.kerala.gov.in',   userRole: 'scientist' },
  ];

  const citizenUsers = [
    { fullName: 'Rahul Krishnan',      emailAddress: 'citizen.rahul@seed.routelytics.in',     userRole: 'citizen'   },
    { fullName: 'Anitha Suresh',       emailAddress: 'citizen.anitha@seed.routelytics.in',    userRole: 'citizen'   },
    { fullName: 'Mohammed Shafeeq',    emailAddress: 'citizen.shafeeq@seed.routelytics.in',   userRole: 'citizen'   },
    { fullName: 'Lakshmi Devi',        emailAddress: 'citizen.lakshmi@seed.routelytics.in',   userRole: 'citizen'   },
    { fullName: 'Vishnu Prasad',       emailAddress: 'citizen.vishnu@seed.routelytics.in',    userRole: 'citizen'   },
  ];

  const allUserDefs = [...scientistUsers, ...citizenUsers];
  const createdUsers = [];

  for (const def of allUserDefs) {
    let user = await User.findOne({ emailAddress: def.emailAddress });
    if (!user) {
      user = await User.create({ ...def, passwordHash: pw, consentGiven: true, points: 0 });
      console.log(`  + Created user: ${def.fullName} (${def.userRole})`);
    } else {
      console.log(`  ~ Existing user: ${def.fullName}`);
    }
    createdUsers.push(user);
  }

  const citizens   = createdUsers.filter(u => u.userRole === 'citizen');
  const dateStart  = new Date('2026-02-01T00:00:00.000Z');
  const dateEnd    = new Date('2026-04-26T23:59:59.000Z');

  // ── Build trip distribution ───────────────────────────────────────────────
  console.log('\n📍 Generating trips (Feb–Apr 2026)...\n');

  // Trips per citizen per week: roughly 5–10 trips/week = ~60–120 over ~12 weeks
  const tripsToCreate = [];
  let totalByMode = {};

  for (const citizen of citizens) {
    const tripsForCitizen = rndI(55, 80);

    // Assign a "home district" to each citizen
    const homeDistrict = pick(KERALA_DISTRICTS);

    // Each citizen has a mode preference
    const primaryMode   = pick(MODES);
    const secondaryMode = pick(MODES.filter(m => m !== primaryMode));

    console.log(`  👤 ${citizen.fullName} (home: ${homeDistrict.name}) — ${tripsForCitizen} trips`);
    console.log(`     Primary: ${primaryMode}  |  Secondary: ${secondaryMode}`);

    let points = 0;

    for (let t = 0; t < tripsForCitizen; t++) {
      const createdAt = randomDateBetween(dateStart, dateEnd);

      // Mode selection weighted toward primary
      let mode;
      const r = Math.random();
      if (r < 0.50)      mode = primaryMode;
      else if (r < 0.75) mode = secondaryMode;
      else               mode = pick(MODES);

      // District: 70% home district, 30% random
      const district = Math.random() < 0.70 ? homeDistrict : pick(KERALA_DISTRICTS);

      const tripDoc = buildTrip(citizen._id, createdAt, mode, district);
      tripsToCreate.push(tripDoc);

      // Points: 10 per trip + 5 bonus if validated
      points += 10;
      if (tripDoc.isTripValidated) points += 5;

      totalByMode[mode] = (totalByMode[mode] || 0) + 1;
    }

    // Update citizen points
    await User.findByIdAndUpdate(citizen._id, { points });
  }

  // ── Insert all trips ──────────────────────────────────────────────────────
  console.log(`\n💾 Inserting ${tripsToCreate.length} trips into MongoDB...`);
  const inserted = await Trip.insertMany(tripsToCreate, { ordered: false });
  console.log(`✅ Inserted ${inserted.length} trips\n`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('📊 Mode distribution:');
  for (const [mode, count] of Object.entries(totalByMode).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.round(count / 3));
    console.log(`   ${mode.padEnd(16)} ${String(count).padStart(3)} trips  ${bar}`);
  }

  const totalTrips = await Trip.countDocuments();
  const totalUsers = await User.countDocuments();
  const validated  = await Trip.countDocuments({ isTripValidated: true });
  const correct    = await Trip.countDocuments({ aiPredictionCorrect: true });

  console.log('\n══════════════════════════════════════════════════');
  console.log('  Seeding Complete!');
  console.log('══════════════════════════════════════════════════');
  console.log(`  Total users  : ${totalUsers}`);
  console.log(`  Total trips  : ${totalTrips}`);
  console.log(`  Validated    : ${validated}`);
  console.log(`  AI correct   : ${correct} / ${validated} validated`);
  console.log(`  AI accuracy  : ${validated > 0 ? Math.round(correct/validated*100) : 'N/A'}%`);
  console.log('\n  Login credentials (all users):');
  console.log('  Password: password123');
  console.log('\n  Citizens:');
  for (const c of citizens) console.log(`    ${c.emailAddress}`);
  console.log('\n  Scientists:');
  const scientists = createdUsers.filter(u => u.userRole === 'scientist');
  for (const s of scientists) console.log(`    ${s.emailAddress}`);
  console.log('══════════════════════════════════════════════════\n');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('\n❌ Seeder error:', err.message);
  process.exit(1);
});
