import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Play, Square, Navigation, Activity, Wifi, MapPin, Locate } from 'lucide-react';

const TripSimulator = () => {
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [activityLogs, setActivityLogs] = useState([]);
  const [gpsPoints, setGpsPoints] = useState([]);
  const [trackingStatus, setTrackingStatus] = useState('idle');
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);

  const addLog = (message, type = '') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityLogs((prev) => [...prev, { message: `[${timestamp}] ${message}`, type }]);
  };

  const calculateDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
    const earthRadiusMeters = 6371000;
    const lat1Radians = (lat1 * Math.PI) / 180;
    const lat2Radians = (lat2 * Math.PI) / 180;
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLon = ((lon2 - lon1) * Math.PI) / 180;
    const haversineA = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Radians) * Math.cos(lat2Radians) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const haversineC = 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));
    return earthRadiusMeters * haversineC;
  };

  const handleStartTracking = () => {
    if (!navigator.geolocation) {
      addLog('GPS is not supported in this browser.', 'error');
      return;
    }

    setIsTrackingActive(true);
    setGpsPoints([]);
    setActivityLogs([]);
    setTrackingStatus('tracking');
    startTimeRef.current = Date.now();

    addLog('Requesting GPS permission...', 'info');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed || 0,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };

        setGpsPoints((prev) => {
          const updatedPoints = [...prev, newPoint];
          if (updatedPoints.length === 1) {
            addLog(`GPS locked. Lat: ${newPoint.latitude.toFixed(5)}, Lng: ${newPoint.longitude.toFixed(5)}`, 'success');
            addLog(`Accuracy: ${newPoint.accuracy.toFixed(0)}m. Tracking movement...`, 'info');
          } else if (updatedPoints.length % 5 === 0) {
            addLog(`${updatedPoints.length} GPS points captured. Speed: ${((newPoint.speed || 0) * 3.6).toFixed(1)} km/h`, '');
          }
          return updatedPoints;
        });
      },
      (error) => {
        addLog(`GPS Error: ${error.message}`, 'error');
        setTrackingStatus('error');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  };

  const handleStopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setIsTrackingActive(false);
    setTrackingStatus('processing');
    addLog('GPS tracking stopped. Processing trip data...', 'info');

    if (gpsPoints.length < 2) {
      addLog('Not enough GPS data captured. Move around and try again.', 'error');
      setTrackingStatus('idle');
      return;
    }

    const originPoint = gpsPoints[0];
    const destinationPoint = gpsPoints[gpsPoints.length - 1];
    const endTime = Date.now();
    const totalDurationSeconds = Math.round((endTime - startTimeRef.current) / 1000);

    let totalDistanceMeters = 0;
    let maxSpeedKmh = 0;
    const speedReadings = [];

    for (let i = 1; i < gpsPoints.length; i++) {
      const segmentDistance = calculateDistanceBetweenPoints(
        gpsPoints[i - 1].latitude, gpsPoints[i - 1].longitude,
        gpsPoints[i].latitude, gpsPoints[i].longitude
      );
      totalDistanceMeters += segmentDistance;

      const segmentTimeSeconds = (gpsPoints[i].timestamp - gpsPoints[i - 1].timestamp) / 1000;
      if (segmentTimeSeconds > 0) {
        const segmentSpeedKmh = (segmentDistance / segmentTimeSeconds) * 3.6;
        speedReadings.push(segmentSpeedKmh);
        if (segmentSpeedKmh > maxSpeedKmh) maxSpeedKmh = segmentSpeedKmh;
      }
    }

    const averageSpeedKmh = speedReadings.length > 0
      ? speedReadings.reduce((sum, s) => sum + s, 0) / speedReadings.length
      : 0;

    addLog(`Distance: ${(totalDistanceMeters / 1000).toFixed(2)} km | Avg speed: ${averageSpeedKmh.toFixed(1)} km/h | Max: ${maxSpeedKmh.toFixed(1)} km/h`, '');
    addLog('Sending trip to AI microservice for mode prediction...', 'info');

    try {
      const tripPayload = {
        originCoordinates: { latitude: originPoint.latitude, longitude: originPoint.longitude, timestamp: originPoint.timestamp },
        destinationCoordinates: { latitude: destinationPoint.latitude, longitude: destinationPoint.longitude, timestamp: destinationPoint.timestamp },
        tripPoints: gpsPoints.map(p => ({ latitude: p.latitude, longitude: p.longitude, speed: p.speed, timestamp: p.timestamp })),
        averageSpeed: parseFloat(averageSpeedKmh.toFixed(1)),
        maximumSpeed: parseFloat(maxSpeedKmh.toFixed(1)),
        totalDistance: Math.round(totalDistanceMeters),
        totalDurationSeconds
      };

      const response = await axios.post('http://localhost:5000/api/trips', tripPayload);
      addLog(`AI Prediction: "${response.data.aiPredictedMode}"`, 'success');
      addLog('Trip saved to database. View it in your Travel Diary.', 'success');
    } catch {
      addLog('Failed to save trip. Is the backend server running?', 'error');
    } finally {
      setTrackingStatus('idle');
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">GPS Trip Tracker</h1>
          <p className="page-subtitle">Track your real location using your device GPS</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-label" style={{ marginBottom: '1.25rem' }}>
            <Locate size={13} /> Live GPS Tracker
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <div className={`sim-status-dot${isTrackingActive ? ' active' : ''}`} />
            <span style={{ fontSize: '0.875rem', color: isTrackingActive ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 500 }}>
              {isTrackingActive ? `Tracking (${gpsPoints.length} points)` : trackingStatus === 'processing' ? 'Processing...' : 'Idle'}
            </span>
          </div>

          {!isTrackingActive ? (
            <button
              onClick={handleStartTracking}
              disabled={trackingStatus === 'processing'}
              className="btn-brand"
              style={{ width: '100%', justifyContent: 'center', padding: '0.72rem' }}
            >
              <Play size={15} /> Start GPS Tracking
            </button>
          ) : (
            <button
              onClick={handleStopTracking}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.72rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              <Square size={15} /> Stop & Save Trip
            </button>
          )}

          {gpsPoints.length > 0 && (
            <div style={{ marginTop: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                <span><MapPin size={11} /> Origin</span>
                <span>{gpsPoints[0].latitude.toFixed(5)}, {gpsPoints[0].longitude.toFixed(5)}</span>
              </div>
              {gpsPoints.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><Navigation size={11} /> Latest</span>
                  <span>{gpsPoints[gpsPoints.length - 1].latitude.toFixed(5)}, {gpsPoints[gpsPoints.length - 1].longitude.toFixed(5)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-label" style={{ marginBottom: '1rem' }}>
            <Wifi size={13} /> How It Works
          </div>
          <div className="stack" style={{ gap: '0.625rem' }}>
            {[
              { step: '1', text: 'Click "Start GPS Tracking" and allow location access' },
              { step: '2', text: 'Move around — walk, drive, or take a bus' },
              { step: '3', text: 'Click "Stop & Save Trip" when you reach your destination' },
              { step: '4', text: 'AI automatically predicts your travel mode' },
              { step: '5', text: 'Validate the trip in your Travel Diary' }
            ].map(({ step, text }) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, flexShrink: 0 }}>
                  {step}
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-label" style={{ marginBottom: '0.875rem' }}>
          <Activity size={13} /> Live Activity Log
        </div>
        <div className="log-terminal">
          {activityLogs.length === 0 ? (
            <span className="log-line" style={{ opacity: 0.5 }}>Waiting for GPS tracking to start...</span>
          ) : (
            activityLogs.map((log, index) => (
              <div key={index} className={`log-line ${log.type}`}>
                {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TripSimulator;
