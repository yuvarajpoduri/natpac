import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Play, Navigation, MapPin, Gauge, Bus, Car, Bike, Clock, Leaf, Square, Map, RotateCcw, Save } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker } from 'react-leaflet';

const KERALA_LOCATIONS = [
  { name: 'Kochi - Marine Drive', lat: 9.9816, lng: 76.2755 },
  { name: 'Kochi - Edappally', lat: 10.0261, lng: 76.3125 },
  { name: 'Trivandrum - Central', lat: 8.4875, lng: 76.9525 },
  { name: 'Trivandrum - Technopark', lat: 8.5582, lng: 76.8812 },
  { name: 'Kozhikode - Beach', lat: 11.2625, lng: 75.7672 },
  { name: 'Munnar - Town', lat: 10.0892, lng: 77.0595 },
  { name: 'Thrissur - Round', lat: 10.5255, lng: 76.2136 },
  { name: 'Alappuzha - Backwaters', lat: 9.4975, lng: 76.3283 }
];

const TripSimulator = () => {
  const [activeTab, setActiveTab] = useState('scenario');

  // --- Scenario State ---
  const [simulationState, setSimulationState] = useState('idle');
  const [origin, setOrigin] = useState(KERALA_LOCATIONS[0]);
  const [destination, setDestination] = useState(KERALA_LOCATIONS[1]);
  const [scenarios, setScenarios] = useState(null);
  const [selectedRouteKey, setSelectedRouteKey] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- GPS Tracking State ---
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [gpsPoints, setGpsPoints] = useState([]);
  const [trackingStatus, setTrackingStatus] = useState('idle');
  const watchIdRef = useRef(null);
  const startTimeRef = useRef(null);

  const calculateDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
    const earthRadiusMeters = 6371000;
    const lat1Radians = (lat1 * Math.PI) / 180;
    const lat2Radians = (lat2 * Math.PI) / 180;
    const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLon = ((lon2 - lon1) * Math.PI) / 180;
    const haversineA = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Radians) * Math.cos(lat2Radians) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversineA), Math.sqrt(1 - haversineA));
  };

  // --- Scenario Methods ---
  const handleSimulate = async () => {
    setSimulationState('simulating');
    setScenarios(null);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/trips/simulate`, {
        originLat: origin.lat,
        originLng: origin.lng,
        destLat: destination.lat,
        destLng: destination.lng
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('natpac_token')}` }
      });
      
      setScenarios(response.data.data);
      setSelectedRouteKey('Car');
      setSimulationState('done');
    } catch (error) {
      console.error('Simulation Failed', error);
      alert('Failed to simulate route. Please check the backend connection.');
      setSimulationState('idle');
    }
  };

  const saveScenarioToDiary = async () => {
    if (!scenarios || !selectedRouteKey) return;
    setIsSaving(true);
    const selectedData = scenarios[selectedRouteKey];
    
    const dummyPoints = selectedData.geometry.coordinates.map((coord, idx) => ({
      longitude: coord[0],
      latitude: coord[1],
      timestamp: new Date(Date.now() + idx * 5000)
    }));

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/trips`, {
        originCoordinates: { latitude: origin.lat, longitude: origin.lng, timestamp: new Date() },
        destinationCoordinates: { latitude: destination.lat, longitude: destination.lng, timestamp: new Date(Date.now() + selectedData.durationMinutes * 60000) },
        tripPoints: dummyPoints,
        averageSpeed: (selectedData.distanceKm / (selectedData.durationMinutes / 60)),
        maximumSpeed: (selectedData.distanceKm / (selectedData.durationMinutes / 60)) * 1.2,
        totalDistance: selectedData.distanceKm * 1000,
        totalDurationSeconds: selectedData.durationMinutes * 60
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('natpac_token')}` }
      });
      alert('Trip successfully saved to your Travel Diary!');
    } catch (error) {
      alert('Failed to save trip to diary.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- GPS Tracking Methods ---
  const handleStartTracking = () => {
    if (!navigator.geolocation) {
      alert('GPS is not supported in this browser.'); return;
    }
    setIsTrackingActive(true);
    setGpsPoints([]);
    setTrackingStatus('tracking');
    startTimeRef.current = Date.now();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setGpsPoints((prev) => [...prev, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed || 0,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        }]);
      },
      (error) => {
        console.error("GPS Error", error);
        setTrackingStatus('error');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const handleStopAndSaveTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTrackingActive(false);
    setTrackingStatus('processing');

    if (gpsPoints.length < 2) {
      alert('Not enough GPS data safely captured. Please move around and try again for at least 30 seconds.');
      setTrackingStatus('idle');
      return;
    }

    const originPoint = gpsPoints[0];
    const destinationPoint = gpsPoints[gpsPoints.length - 1];
    const totalDurationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    let totalDist = 0, maxSpd = 0;
    const speeds = [];

    for (let i = 1; i < gpsPoints.length; i++) {
      const dist = calculateDistanceBetweenPoints(
        gpsPoints[i - 1].latitude, gpsPoints[i - 1].longitude,
        gpsPoints[i].latitude, gpsPoints[i].longitude
      );
      totalDist += dist;
      const tSecs = (gpsPoints[i].timestamp - gpsPoints[i - 1].timestamp) / 1000;
      if (tSecs > 0) {
        const spd = (dist / tSecs) * 3.6;
        speeds.push(spd);
        if (spd > maxSpd) maxSpd = spd;
      }
    }

    const avgSpd = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/trips`, {
        originCoordinates: { latitude: originPoint.latitude, longitude: originPoint.longitude, timestamp: originPoint.timestamp },
        destinationCoordinates: { latitude: destinationPoint.latitude, longitude: destinationPoint.longitude, timestamp: destinationPoint.timestamp },
        tripPoints: gpsPoints,
        averageSpeed: parseFloat(avgSpd.toFixed(1)),
        maximumSpeed: parseFloat(maxSpd.toFixed(1)),
        totalDistance: Math.round(totalDist),
        totalDurationSeconds
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('natpac_token')}` }
      });
      alert(`Trip saved! Distance: ${(totalDist/1000).toFixed(2)}km. Check your diary.`);
      setTrackingStatus('done');
    } catch {
      alert('Failed to save GPS trip to backend.');
      setTrackingStatus('error');
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // Mode colors
  const modeColors = {
    Car: '#E24B4A',
    Bus: '#5BCAF5',
    Bicycle: '#34D399'
  };

  const ScenarioCard = ({ mode, dataKey, data, icon: Icon }) => {
    const color = modeColors[dataKey] || '#111111';
    const isSelected = selectedRouteKey === dataKey;
    return (
      <div 
        className="card" 
        style={{ 
          cursor: 'pointer', 
          border: isSelected ? `2px solid ${color}` : '1px solid #E8E8E0', 
          transition: 'all 0.15s ease', 
          padding: '1rem' 
        }}
        onClick={() => setSelectedRouteKey(dataKey)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
          <div style={{ 
            width: 36, height: 36, borderRadius: '12px', 
            background: `${color}15`, color: color, 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Icon size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111111', display: 'flex', justifyContent: 'space-between' }}>
              {mode}
              {isSelected && (
                <span style={{ 
                  fontSize: '12px', color: '#111111', 
                  background: '#F5F230', padding: '4px 12px', 
                  borderRadius: '99px', fontWeight: 600 
                }}>
                  Selected
                </span>
              )}
            </h3>
            <span style={{ fontSize: '12px', color: '#888888' }}>{data.distanceKm.toFixed(1)} km route</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={13} style={{ color: '#888888' }} /> <span>{Math.round(data.durationMinutes)} mins</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Leaf size={13} style={{ color: data.co2EmissionsKg > 1 ? '#E24B4A' : '#34D399' }} /> <span>{data.co2EmissionsKg.toFixed(2)} kg CO₂</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Trip Simulator & Tracker</h1>
          <p className="page-subtitle">Simulate hypothetical scenarios or track via real-time GPS</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#F2F2F2', padding: '6px', borderRadius: '16px', width: 'fit-content' }}>
        <button 
          className={activeTab === 'scenario' ? 'btn-brand' : 'btn-ghost'} 
          onClick={() => setActiveTab('scenario')} 
          style={{ height: '40px', padding: '0 1.2rem', borderRadius: '12px', fontSize: '14px' }}
        >
          <Map size={14} style={{ marginRight: '0.4rem' }} /> Path Simulator
        </button>
        <button 
          className={activeTab === 'gps' ? 'btn-brand' : 'btn-ghost'} 
          onClick={() => setActiveTab('gps')} 
          style={{ height: '40px', padding: '0 1.2rem', borderRadius: '12px', fontSize: '14px' }}
        >
          <Navigation size={14} style={{ marginRight: '0.4rem' }} /> Live GPS Tracker
        </button>
      </div>

      {activeTab === 'scenario' ? (
        <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
          <div className="card">
            <div className="card-label" style={{ marginBottom: '1.25rem' }}>
              <MapPin size={13} /> Select Route Locations
            </div>
            
            <div className="field">
              <label>Origin Location</label>
              <select value={origin.name} onChange={e => setOrigin(KERALA_LOCATIONS.find(loc => loc.name === e.target.value))}>
                {KERALA_LOCATIONS.map(loc => <option key={`orig-${loc.name}`} value={loc.name}>{loc.name}</option>)}
              </select>
            </div>
            
            <div className="field">
              <label>Destination Location</label>
              <select value={destination.name} onChange={e => setDestination(KERALA_LOCATIONS.find(loc => loc.name === e.target.value))}>
                {KERALA_LOCATIONS.map(loc => <option key={`dest-${loc.name}`} value={loc.name}>{loc.name}</option>)}
              </select>
            </div>

            <button className="btn-brand" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} onClick={handleSimulate} disabled={simulationState === 'simulating' || origin.name === destination.name}>
              {simulationState === 'simulating' ? <span className="loading-pulse">Calculating OSRM Routes...</span> : <><Play size={16} /> Run Simulation</>}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {simulationState === 'done' && scenarios ? (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>Select Travel Mode to Save:</div>
                <ScenarioCard mode="Private Car" dataKey="Car" data={scenarios.Car} icon={Car} />
                <ScenarioCard mode="Public Bus" dataKey="Bus" data={scenarios.Bus} icon={Bus} />
                <ScenarioCard mode="Bicycle / Walk" dataKey="Bicycle" data={scenarios.Bicycle} icon={Bike} />
                
                <button className="btn-primary" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={saveScenarioToDiary} disabled={isSaving}>
                  {isSaving ? 'Saving...' : <><Save size={16} /> Save "{selectedRouteKey}" Trip to Diary</>}
                </button>
              </>
            ) : (
              <div className="card empty-state" style={{ height: '100%' }}>
                <Map size={36} style={{ color: '#888888' }} />
                <h3>No scenario loaded</h3>
                <p>Select origin and destination, then hit Simulate.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
          <div className="card">
            <div className="card-label" style={{ marginBottom: '1rem' }}><Navigation size={13} /> Live GPS Tracking</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.5rem', background: '#F2F2F2', padding: '0.75rem', borderRadius: '12px' }}>
              <div className={`sim-status-dot${isTrackingActive ? ' active' : ''}`} />
              <span style={{ fontSize: '14px', color: isTrackingActive ? '#34D399' : '#666666', fontWeight: 500 }}>
                {isTrackingActive ? `Tracking... (Captured ${gpsPoints.length} points)` : trackingStatus === 'processing' ? 'Processing data...' : trackingStatus === 'done' ? 'Tracking Completed' : 'Idle - Ready to Track'}
              </span>
            </div>

            {!isTrackingActive ? (
              <button onClick={handleStartTracking} disabled={trackingStatus === 'processing'} className="btn-brand" style={{ width: '100%', justifyContent: 'center' }}>
                <Play size={16} /> Start Real-Time Tracking
              </button>
            ) : (
              <button onClick={handleStopAndSaveTracking} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <Square size={16} /> Stop & Save to Diary
              </button>
            )}

            {trackingStatus === 'done' && (
              <button onClick={() => { setGpsPoints([]); setTrackingStatus('idle'); }} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
                <RotateCcw size={16} /> Reset Tracker
              </button>
            )}
          </div>

          <div className="card">
            <div className="card-label" style={{ marginBottom: '1rem' }}><Gauge size={13} /> Live Sensors</div>
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: 0 }}>
              <div style={{ background: '#F2F2F2', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem', fontWeight: 500 }}>Current Speed</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111111' }}>
                  {gpsPoints.length > 0 ? (gpsPoints[gpsPoints.length - 1].speed * 3.6).toFixed(1) : '0.0'} <span style={{ fontSize: '12px', fontWeight: 500, color: '#888888' }}>km/h</span>
                </div>
              </div>
              <div style={{ background: '#F2F2F2', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem', fontWeight: 500 }}>Data Points</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111111' }}>
                  {gpsPoints.length} <span style={{ fontSize: '12px', fontWeight: 500, color: '#888888' }}>pings</span>
                </div>
              </div>
            </div>
            {gpsPoints.length > 0 && (
              <div style={{ marginTop: '1rem', fontSize: '13px', color: '#666666' }}>
                Latest coordinates: <span style={{ color: '#111111', fontWeight: 500 }}>{gpsPoints[gpsPoints.length - 1].latitude.toFixed(5)}, {gpsPoints[gpsPoints.length - 1].longitude.toFixed(5)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shared Map View */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 24px', borderBottom: '1px solid #E8E8E0', background: '#FFFFFF' }}>
           <div className="card-label"><Navigation size={13} /> {activeTab === 'scenario' ? 'Simulated Route Map' : 'Live GPS Path'}</div>
        </div>
        <div style={{ height: '400px', width: '100%', background: '#F2F2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {(activeTab === 'scenario' && simulationState === 'idle') || (activeTab === 'gps' && gpsPoints.length === 0) ? (
            <div style={{ textAlign: 'center', color: '#888888' }}>
              <Gauge size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>{activeTab === 'scenario' ? 'Run a simulation to view map routes' : 'Start tracking to see your path on the map'}</p>
            </div>
          ) : (
            <MapContainer
              center={activeTab === 'scenario' ? [origin.lat, origin.lng] : [gpsPoints[0]?.latitude || 10, gpsPoints[0]?.longitude || 76]}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              
              {activeTab === 'scenario' && selectedRouteKey && scenarios && (
                <Polyline positions={scenarios[selectedRouteKey].geometry.coordinates.map(c => [c[1], c[0]])} pathOptions={{ color: modeColors[selectedRouteKey] || '#111111', weight: 4 }} />
              )}

              {activeTab === 'gps' && gpsPoints.length > 0 && (
                <>
                  <Polyline positions={gpsPoints.map(p => [p.latitude, p.longitude])} pathOptions={{ color: '#F5F230', weight: 3 }} />
                  <CircleMarker center={[gpsPoints[gpsPoints.length - 1].latitude, gpsPoints[gpsPoints.length - 1].longitude]} radius={6} pathOptions={{ color: '#F5F230', fillColor: '#F5F230', fillOpacity: 1 }} />
                </>
              )}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripSimulator;
