import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Play, Navigation, MapPin, Gauge, Bus, Car, Bike,
  Clock, Leaf, Square, Map, RotateCcw, Save, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Polyline, CircleMarker } from 'react-leaflet';
import { useBackgroundGPS } from '../hooks/useBackgroundGPS';

const KERALA_LOCATIONS = [
  { name: 'Kochi - Marine Drive',      lat: 9.9816,  lng: 76.2755 },
  { name: 'Kochi - Edappally',         lat: 10.0261, lng: 76.3125 },
  { name: 'Trivandrum - Central',      lat: 8.4875,  lng: 76.9525 },
  { name: 'Trivandrum - Technopark',   lat: 8.5582,  lng: 76.8812 },
  { name: 'Kozhikode - Beach',         lat: 11.2625, lng: 75.7672 },
  { name: 'Munnar - Town',             lat: 10.0892, lng: 77.0595 },
  { name: 'Thrissur - Round',          lat: 10.5255, lng: 76.2136 },
  { name: 'Alappuzha - Backwaters',    lat: 9.4975,  lng: 76.3283 }
];

const modeColors = { Car: '#E24B4A', Bus: '#5BCAF5', Bicycle: '#34D399' };

// ─── Scenario card component ─────────────────────────────────────────────────
const ScenarioCard = ({ mode, dataKey, data, icon: Icon, selected, onSelect }) => {
  const color = modeColors[dataKey] || '#111';
  return (
    <div
      className="card"
      style={{
        cursor: 'pointer',
        border: selected ? `2px solid ${color}` : '1px solid #E8E8E0',
        transition: 'all 0.15s ease',
        padding: '1rem'
      }}
      onClick={onSelect}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '12px',
          background: `${color}15`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111', display: 'flex', justifyContent: 'space-between' }}>
            {mode}
            {selected && (
              <span style={{
                fontSize: '12px', color: '#111',
                background: '#F5F230', padding: '4px 12px',
                borderRadius: '99px', fontWeight: 600
              }}>Selected</span>
            )}
          </h3>
          <span style={{ fontSize: '12px', color: '#888' }}>{data.distanceKm.toFixed(1)} km route</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={13} style={{ color: '#888' }} />
          <span>{Math.round(data.durationMinutes)} mins</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Leaf size={13} style={{ color: data.co2EmissionsKg > 1 ? '#E24B4A' : '#34D399' }} />
          <span>{data.co2EmissionsKg.toFixed(2)} kg CO₂</span>
        </div>
      </div>
    </div>
  );
};

// ─── Status pill ─────────────────────────────────────────────────────────────
const StatusPill = ({ status, pointCount }) => {
  const configs = {
    idle:       { color: '#888', bg: '#F2F2F2', dot: false, text: 'Idle — Ready to Track'          },
    tracking:   { color: '#34D399', bg: '#F0FDF4', dot: true,  text: `Tracking… (${pointCount} pts)` },
    background: { color: '#F59E0B', bg: '#FFFBEB', dot: true,  text: `Background (${pointCount} pts saved)` },
    processing: { color: '#5BCAF5', bg: '#EFF6FF', dot: false, text: 'Processing & saving…'          },
    done:       { color: '#34D399', bg: '#F0FDF4', dot: false, text: 'Trip saved ✓'                 },
    error:      { color: '#E24B4A', bg: '#FEF2F2', dot: false, text: 'GPS error — check permissions' }
  };
  const c = configs[status] || configs.idle;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.625rem',
      background: c.bg, padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem'
    }}>
      {c.dot && (
        <div style={{
          width: 9, height: 9, borderRadius: '50%', background: c.color,
          animation: 'pulse 1.5s infinite', flexShrink: 0
        }} />
      )}
      {status === 'background' ? <WifiOff size={14} color={c.color} /> : null}
      {status === 'tracking'   ? <Wifi size={14} color={c.color} /> : null}
      <span style={{ fontSize: '14px', color: c.color, fontWeight: 500 }}>{c.text}</span>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const TripSimulator = () => {
  const [activeTab, setActiveTab] = useState('scenario');

  // Scenario state
  const [simulationState, setSimulationState]   = useState('idle');
  const [origin, setOrigin]                     = useState(KERALA_LOCATIONS[0]);
  const [destination, setDestination]           = useState(KERALA_LOCATIONS[1]);
  const [scenarios, setScenarios]               = useState(null);
  const [selectedRouteKey, setSelectedRouteKey] = useState(null);
  const [isSaving, setIsSaving]                 = useState(false);

  // Background GPS hook (handles SW, IndexedDB, restore, etc.)
  const {
    gpsPoints,
    isTracking,
    trackingStatus,
    isRestored,
    startTracking,
    stopAndSave,
    cancelTracking,
    resumeTracking
  } = useBackgroundGPS();

  // If a session was restored from the SW after re-opening the app,
  // switch to the GPS tab automatically and ask the user what to do.
  useEffect(() => {
    if (isRestored) {
      setActiveTab('gps');
    }
  }, [isRestored]);

  // ─── Scenario methods ───────────────────────────────────────────────────
  const handleSimulate = async () => {
    setSimulationState('simulating');
    setScenarios(null);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/trips/simulate`,
        { originLat: origin.lat, originLng: origin.lng, destLat: destination.lat, destLng: destination.lng },
        { headers: { Authorization: `Bearer ${localStorage.getItem('natpac_token')}` } }
      );
      setScenarios(res.data.data);
      setSelectedRouteKey('Car');
      setSimulationState('done');
    } catch (err) {
      console.error('Simulation failed', err);
      alert('Failed to simulate route. Check backend connection.');
      setSimulationState('idle');
    }
  };

  const saveScenarioToDiary = async () => {
    if (!scenarios || !selectedRouteKey) return;
    setIsSaving(true);
    const data = scenarios[selectedRouteKey];
    const pts = data.geometry.coordinates.map((coord, idx) => ({
      longitude: coord[0], latitude: coord[1],
      timestamp: new Date(Date.now() + idx * 5000).toISOString()
    }));
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/trips`,
        {
          originCoordinates:      { latitude: origin.lat, longitude: origin.lng, timestamp: new Date().toISOString() },
          destinationCoordinates: { latitude: destination.lat, longitude: destination.lng, timestamp: new Date(Date.now() + data.durationMinutes * 60000).toISOString() },
          tripPoints: pts,
          averageSpeed:        parseFloat((data.distanceKm / (data.durationMinutes / 60)).toFixed(1)),
          maximumSpeed:        parseFloat((data.distanceKm / (data.durationMinutes / 60) * 1.2).toFixed(1)),
          totalDistance:       Math.round(data.distanceKm * 1000),
          totalDurationSeconds: Math.round(data.durationMinutes * 60)
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('natpac_token')}` } }
      );
      alert('Trip saved to your Travel Diary!');
    } catch {
      alert('Failed to save trip.');
    } finally {
      setIsSaving(false);
    }
  };

  // Latest GPS point for sensor display
  const latestPt = gpsPoints.length > 0 ? gpsPoints[gpsPoints.length - 1] : null;
  const latestSpeed = latestPt ? ((latestPt.speed || 0) * 3.6).toFixed(1) : '0.0';

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Trip Simulator &amp; Tracker</h1>
          <p className="page-subtitle">Simulate hypothetical scenarios or track via real-time GPS</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
        background: '#F2F2F2', padding: '6px', borderRadius: '16px', width: 'fit-content'
      }}>
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
          style={{
            height: '40px', padding: '0 1.2rem', borderRadius: '12px', fontSize: '14px',
            position: 'relative'
          }}
        >
          <Navigation size={14} style={{ marginRight: '0.4rem' }} /> Live GPS Tracker
          {/* Show red dot if tracking is active in background */}
          {(isTracking || trackingStatus === 'background') && (
            <span style={{
              position: 'absolute', top: 4, right: 4,
              width: 8, height: 8, borderRadius: '50%',
              background: trackingStatus === 'background' ? '#F59E0B' : '#34D399'
            }} />
          )}
        </button>
      </div>

      {/* ══ SCENARIO TAB ════════════════════════════════════════════════════ */}
      {activeTab === 'scenario' ? (
        <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
          <div className="card">
            <div className="card-label" style={{ marginBottom: '1.25rem' }}>
              <MapPin size={13} /> Select Route Locations
            </div>

            <div className="field">
              <label>Origin Location</label>
              <select value={origin.name} onChange={(e) => setOrigin(KERALA_LOCATIONS.find((l) => l.name === e.target.value))}>
                {KERALA_LOCATIONS.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
            </div>

            <div className="field">
              <label>Destination Location</label>
              <select value={destination.name} onChange={(e) => setDestination(KERALA_LOCATIONS.find((l) => l.name === e.target.value))}>
                {KERALA_LOCATIONS.map((l) => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
            </div>

            <button
              className="btn-brand"
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              onClick={handleSimulate}
              disabled={simulationState === 'simulating' || origin.name === destination.name}
            >
              {simulationState === 'simulating'
                ? <span className="loading-pulse">Calculating OSRM Routes…</span>
                : <><Play size={16} /> Run Simulation</>}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {simulationState === 'done' && scenarios ? (
              <>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>Select Travel Mode to Save:</div>
                <ScenarioCard mode="Private Car"    dataKey="Car"     data={scenarios.Car}     icon={Car}  selected={selectedRouteKey === 'Car'}     onSelect={() => setSelectedRouteKey('Car')} />
                <ScenarioCard mode="Public Bus"     dataKey="Bus"     data={scenarios.Bus}     icon={Bus}  selected={selectedRouteKey === 'Bus'}     onSelect={() => setSelectedRouteKey('Bus')} />
                <ScenarioCard mode="Bicycle / Walk" dataKey="Bicycle" data={scenarios.Bicycle} icon={Bike} selected={selectedRouteKey === 'Bicycle'} onSelect={() => setSelectedRouteKey('Bicycle')} />
                <button
                  className="btn-primary"
                  style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={saveScenarioToDiary}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving…' : <><Save size={16} /> Save "{selectedRouteKey}" Trip to Diary</>}
                </button>
              </>
            ) : (
              <div className="card empty-state" style={{ height: '100%' }}>
                <Map size={36} style={{ color: '#888' }} />
                <h3>No scenario loaded</h3>
                <p>Select origin and destination, then hit Simulate.</p>
              </div>
            )}
          </div>
        </div>

      /* ══ GPS TAB ═══════════════════════════════════════════════════════════ */
      ) : (
        <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
          {/* Controls card */}
          <div className="card">
            <div className="card-label" style={{ marginBottom: '1rem' }}>
              <Navigation size={13} /> Live GPS Tracking
            </div>

            <StatusPill status={trackingStatus} pointCount={gpsPoints.length} />

            {/* ── Restored banner ── */}
            {isRestored && (
              <div style={{
                background: '#FFFBEB', border: '1.5px solid #F59E0B',
                borderRadius: 12, padding: '0.875rem', marginBottom: '1rem',
                fontSize: 13, color: '#92400E', lineHeight: 1.5
              }}>
                <strong>Trip in progress</strong> — tracking continued in the background.<br />
                You left with <strong>{gpsPoints.length} GPS points</strong> already saved.
              </div>
            )}

            {/* ── Action buttons ── */}
            {!isTracking && trackingStatus !== 'processing' && (
              <button
                onClick={isRestored ? resumeTracking : startTracking}
                className="btn-brand"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
              >
                {isRestored
                  ? <><RefreshCw size={16} /> Resume Tracking</>
                  : <><Play size={16} /> Start Real-Time Tracking</>}
              </button>
            )}

            {isTracking && (
              <button
                onClick={stopAndSave}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '0.75rem' }}
              >
                <Square size={16} /> Stop &amp; Save to Diary
              </button>
            )}

            {(isTracking || isRestored) && (
              <button
                onClick={cancelTracking}
                style={{
                  width: '100%', padding: '0.7rem', borderRadius: 12,
                  border: '1.5px solid #E24B4A', background: 'transparent',
                  color: '#E24B4A', fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  fontSize: 14, marginBottom: '0.75rem'
                }}
              >
                Discard Trip
              </button>
            )}

            {trackingStatus === 'done' && (
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <RotateCcw size={16} /> Reset Tracker
              </button>
            )}

            {/* Background note */}
            {isTracking && (
              <p style={{ fontSize: 12, color: '#888', marginTop: '0.75rem', lineHeight: 1.6 }}>
                📱 <strong>Safe to close this app.</strong> A persistent notification will appear
                in your notification shade. GPS points are saved to device storage and will be
                synced when you tap "Stop &amp; Save" — even after re-opening the app.
              </p>
            )}
          </div>

          {/* Sensor card */}
          <div className="card">
            <div className="card-label" style={{ marginBottom: '1rem' }}>
              <Gauge size={13} /> Live Sensors
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: '#F2F2F2', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 500 }}>
                  Current Speed
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>
                  {latestSpeed} <span style={{ fontSize: '12px', fontWeight: 500, color: '#888' }}>km/h</span>
                </div>
              </div>
              <div style={{ background: '#F2F2F2', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, fontWeight: 500 }}>
                  Points Saved
                </div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>
                  {gpsPoints.length} <span style={{ fontSize: '12px', fontWeight: 500, color: '#888' }}>pings</span>
                </div>
              </div>
            </div>

            {latestPt && (
              <div style={{ fontSize: '13px', color: '#666' }}>
                <div style={{ marginBottom: 4 }}>
                  📍 Coords:{' '}
                  <span style={{ color: '#111', fontWeight: 500 }}>
                    {latestPt.latitude.toFixed(5)}, {latestPt.longitude.toFixed(5)}
                  </span>
                </div>
                {latestPt.accuracy && (
                  <div>
                    Accuracy: <span style={{ color: latestPt.accuracy < 20 ? '#34D399' : latestPt.accuracy < 40 ? '#F59E0B' : '#E24B4A', fontWeight: 500 }}>
                      ±{Math.round(latestPt.accuracy)}m
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SW support notice */}
            {!('serviceWorker' in navigator) && (
              <div style={{
                marginTop: '1rem', fontSize: 12, color: '#E24B4A',
                background: '#FEF2F2', padding: '0.6rem 0.75rem', borderRadius: 8, lineHeight: 1.5
              }}>
                ⚠️ Service Workers not supported in this browser. Background tracking will not
                persist when the tab is closed.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ Shared Live Map ════════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 24px', borderBottom: '1px solid #E8E8E0', background: '#FFF' }}>
          <div className="card-label">
            <Navigation size={13} />
            {activeTab === 'scenario' ? 'Simulated Route Map' : 'Live GPS Path'}
          </div>
        </div>
        <div style={{
          height: '400px', width: '100%', background: '#F2F2F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {(activeTab === 'scenario' && simulationState === 'idle') ||
           (activeTab === 'gps' && gpsPoints.length === 0) ? (
            <div style={{ textAlign: 'center', color: '#888' }}>
              <Gauge size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>{activeTab === 'scenario'
                ? 'Run a simulation to view map routes'
                : 'Start tracking to see your path on the map'}</p>
            </div>
          ) : (
            <MapContainer
              center={
                activeTab === 'scenario'
                  ? [origin.lat, origin.lng]
                  : [gpsPoints[0]?.latitude || 10, gpsPoints[0]?.longitude || 76]
              }
              zoom={12}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

              {activeTab === 'scenario' && selectedRouteKey && scenarios && (
                <Polyline
                  positions={scenarios[selectedRouteKey].geometry.coordinates.map((c) => [c[1], c[0]])}
                  pathOptions={{ color: modeColors[selectedRouteKey] || '#111', weight: 4 }}
                />
              )}

              {activeTab === 'gps' && gpsPoints.length > 0 && (
                <>
                  <Polyline
                    positions={gpsPoints.map((p) => [p.latitude, p.longitude])}
                    pathOptions={{ color: '#F5F230', weight: 3 }}
                  />
                  {/* Origin dot */}
                  <CircleMarker
                    center={[gpsPoints[0].latitude, gpsPoints[0].longitude]}
                    radius={6}
                    pathOptions={{ color: '#5BCAF5', fillColor: '#5BCAF5', fillOpacity: 1 }}
                  />
                  {/* Current position */}
                  <CircleMarker
                    center={[gpsPoints[gpsPoints.length - 1].latitude, gpsPoints[gpsPoints.length - 1].longitude]}
                    radius={8}
                    pathOptions={{ color: '#F5F230', fillColor: '#F5F230', fillOpacity: 1 }}
                  />
                </>
              )}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Pulse animation for status dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default TripSimulator;
