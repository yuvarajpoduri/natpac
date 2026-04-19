const Trip = require('../models/Trip');

// Haversine distance formula between two lat/lng points (metres)
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const EXPECTED_SPEEDS_KMH = {
  Walking: 5,
  Cycling: 15,
  Car: 40,
  Bus: 25,
  'Auto-Rickshaw': 30,
  Train: 60,
  Ferry: 15
};

const processTripFeatures = async (tripData, userId, tripPoints) => {
  const updates = {};
  
  const distance = tripData.totalDistance || 0;
  const durationSec = tripData.totalDurationSeconds || 0;
  const mode = tripData.aiPredictedMode || 'Car';
  const points = tripPoints || [];

  // --- 4. Dead Time Detector & 3. Travel Stress Score ---
  let idleTimeSeconds = 0;
  let speedVariance = 0;
  let stops = 0;

  const issueEvents = tripData.issueEvents ? [...tripData.issueEvents] : [];

  if (points.length > 1) {
    let speeds = [];
    let isIdle = false;
    let idleStart = null;
    let idlePoint = null;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const speed = p.speed || 0;
      speeds.push(speed);

      // Speed < 1 m/s is considered idle
      if (speed < 1) {
        if (!isIdle) {
          isIdle = true;
          idleStart = new Date(p.timestamp);
          idlePoint = p;
        }
      } else {
        if (isIdle) {
          isIdle = false;
          const idleEnd = new Date(p.timestamp);
          const diffSec = (idleEnd - idleStart) / 1000;
          if (diffSec > 120) { // > 2 minutes stationary -> delay
            idleTimeSeconds += diffSec;
            issueEvents.push({
              issueType: 'delay',
              latitude: idlePoint.latitude,
              longitude: idlePoint.longitude,
              timestamp: idleStart,
              durationSeconds: Math.round(diffSec)
            });
          } else if (diffSec > 30) { // 30-120s stationary -> traffic
            issueEvents.push({
              issueType: 'traffic',
              latitude: idlePoint.latitude,
              longitude: idlePoint.longitude,
              timestamp: idleStart,
              durationSeconds: Math.round(diffSec)
            });
          }
          stops += 1;
        }
      }
    }
    
    // Check if idle till end
    if (isIdle && idleStart && idlePoint) {
      const endT = new Date(points[points.length-1].timestamp);
      const diffSec = (endT - idleStart) / 1000;
      if (diffSec > 120) {
        idleTimeSeconds += diffSec;
        issueEvents.push({
          issueType: 'delay',
          latitude: idlePoint.latitude,
          longitude: idlePoint.longitude,
          timestamp: idleStart,
          durationSeconds: Math.round(diffSec)
        });
      } else if (diffSec > 30) {
        issueEvents.push({
          issueType: 'traffic',
          latitude: idlePoint.latitude,
          longitude: idlePoint.longitude,
          timestamp: idleStart,
          durationSeconds: Math.round(diffSec)
        });
      }
    }

    if (speeds.length > 0) {
      const avg = speeds.reduce((a,b)=>a+b, 0) / speeds.length;
      speedVariance = speeds.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / speeds.length;
    }
  }

  updates.idleTimeSeconds = Math.round(idleTimeSeconds);
  updates.issueEvents = issueEvents;

  // Calculate Stress Score (0-100)
  // Higher stops, high variance, high idle -> High stress
  let stressScore = Math.min(100, (stops * 5) + (idleTimeSeconds / 60 * 2) + Math.min(speedVariance * 2, 30));
  updates.stressScore = Math.round(stressScore);
  if (stressScore < 30) updates.stressLevel = 'Low';
  else if (stressScore < 70) updates.stressLevel = 'Medium';
  else updates.stressLevel = 'High';

  // --- 10. Travel Efficiency Score ---
  let efficiencyScore = 100;
  if (durationSec > 0 && distance > 0) {
    const actualSpeedKmh = (distance / 1000) / (durationSec / 3600);
    const expected = EXPECTED_SPEEDS_KMH[mode] || 30;
    // ratio = actual / expected
    let ratio = actualSpeedKmh / expected;
    if (ratio > 1) ratio = 1; // max 100%
    efficiencyScore = Math.round(ratio * 100);
  }
  updates.efficiencyScore = efficiencyScore;

  // --- 8. Data Confidence Score ---
  let confidence = 50; // base
  if (points.length > 5) confidence += 20; // Good GPS data
  if (tripData.aiConfidenceScore > 80) confidence += 10;
  if (durationSec > 60 && distance > 100) confidence += 20;
  updates.dataConfidenceScore = Math.min(100, confidence);

  // --- 9. Auto Trip Tagging ---
  const autoTags = [];
  if (distance < 2000) autoTags.push('Short Trip');
  if (distance > 10000) autoTags.push('Long Trip');
  if (idleTimeSeconds > 300) autoTags.push('Heavy Traffic');
  updates.autoTags = autoTags;

  // --- 12. Anomaly Detection ---
  const anomalies = [];
  if (distance > 0 && durationSec > 0) {
    const actualSpeedKmh = (distance / 1000) / (durationSec / 3600);
    if (actualSpeedKmh > 150) anomalies.push('Unrealistic Speed');
  }
  if (durationSec > 14400) anomalies.push('Extremely Long Duration'); // > 4 hours
  
  if (anomalies.length > 0) {
    updates.isAnomalous = true;
    updates.anomalyReasons = anomalies;
  }

  // --- 1. Habit Detection & 2. Purpose Prediction ---
  let predictedPurpose = null;
  let habitLabel = null;
  
  const origin = tripData.originCoordinates;
  const dest = tripData.destinationCoordinates;
  
  if (origin && dest && origin.timestamp) {
    const tripHour = new Date(origin.timestamp).getHours();
    
    // Time based basic prediction
    if (tripHour >= 7 && tripHour <= 10) {
      predictedPurpose = 'Work';
      habitLabel = 'Morning Commute';
    } else if (tripHour >= 17 && tripHour <= 20) {
      predictedPurpose = 'Return Home';
      habitLabel = 'Evening Return';
    } else if (tripHour >= 11 && tripHour <= 14) {
      predictedPurpose = 'Shopping';
    }
    
    // Find past trips to detect true habits and Route Similarity (6)
    const pastTrips = await Trip.find({ userId }).limit(20).sort({ tripRecordCreatedAt: -1 });
    let sameRouteCount = 0;
    for (const pt of pastTrips) {
      if (pt.originCoordinates && pt.destinationCoordinates) {
        const d1 = haversineDistance(origin.latitude, origin.longitude, pt.originCoordinates.latitude, pt.originCoordinates.longitude);
        const d2 = haversineDistance(dest.latitude, dest.longitude, pt.destinationCoordinates.latitude, pt.destinationCoordinates.longitude);
        if (d1 < 200 && d2 < 200) {
          sameRouteCount++;
          if (pt.tripPurpose) predictedPurpose = pt.tripPurpose; // Learn from past purpose
          updates.routeClusterId = pt.routeClusterId || pt._id.toString();
        }
      }
    }
    
    if (sameRouteCount >= 3) {
      if (!updates.autoTags.includes('Frequent Route')) updates.autoTags.push('Frequent Route');
      if (!habitLabel) habitLabel = 'Recurring Trip';
    }
  }
  
  updates.predictedPurpose = predictedPurpose;
  updates.habitLabel = habitLabel;

  return updates;
};

// 5. Smart Trip Merging Logic
const mergeTripsIfPossible = async (userId, newTrip) => {
  // Find the last trip by this user
  const lastTrip = await Trip.findOne({ userId, isMerged: false }).sort({ tripRecordCreatedAt: -1 });
  if (!lastTrip || !lastTrip.destinationCoordinates || !newTrip.originCoordinates) return newTrip;
  
  const endT = new Date(lastTrip.destinationCoordinates.timestamp).getTime();
  const startT = new Date(newTrip.originCoordinates.timestamp).getTime();
  const gapMinutes = (startT - endT) / 60000;
  
  if (gapMinutes >= 0 && gapMinutes < 5) {
    const dist = haversineDistance(
      lastTrip.destinationCoordinates.latitude, lastTrip.destinationCoordinates.longitude,
      newTrip.originCoordinates.latitude, newTrip.originCoordinates.longitude
    );
    
    if (dist < 200) {
      // Merge newTrip into lastTrip
      lastTrip.destinationCoordinates = newTrip.destinationCoordinates;
      lastTrip.tripPoints = [...lastTrip.tripPoints, ...newTrip.tripPoints];
      lastTrip.totalDistance = (lastTrip.totalDistance || 0) + (newTrip.totalDistance || 0);
      lastTrip.totalDurationSeconds = (lastTrip.totalDurationSeconds || 0) + (newTrip.totalDurationSeconds || 0);
      lastTrip.isMerged = true;
      
      await lastTrip.save();
      
      newTrip.isMerged = true;
      newTrip.parentTripId = lastTrip._id;
      return newTrip; // the controller will save newTrip as merged and hidden
    }
  }
  return newTrip;
};

module.exports = {
  processTripFeatures,
  mergeTripsIfPossible,
  haversineDistance
};
