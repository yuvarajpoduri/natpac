import { useState } from 'react';
import axios from 'axios';
import { Play, Square, Navigation, Activity, Wifi } from 'lucide-react';

const keralaSampleRoutes = [
  { origin: { latitude: 9.9816, longitude: 76.2999 }, destination: { latitude: 10.0150, longitude: 76.3418 }, avgSpeed: 25.5, maxSpeed: 45.0, distance: 5400, duration: 1500 },
  { origin: { latitude: 10.5276, longitude: 76.2144 }, destination: { latitude: 10.4895, longitude: 76.3140 }, avgSpeed: 18.0, maxSpeed: 35.0, distance: 9200, duration: 2800 },
  { origin: { latitude: 8.5241, longitude: 76.9366 }, destination: { latitude: 8.5603, longitude: 76.8813 }, avgSpeed: 5.0,  maxSpeed: 7.0,   distance: 1200, duration: 900  },
];

const TripSimulator = () => {
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  const addLog = (message, type = '') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSimulationLogs((prev) => [...prev, { message: `[${timestamp}] ${message}`, type }]);
  };

  const handleStartSimulation = async () => {
    setIsSimulationActive(true);
    setSimulationLogs([]);
    const route = keralaSampleRoutes[selectedRouteIndex];

    addLog('GPS tracker initialized — location access granted.', 'info');

    await new Promise((resolve) => setTimeout(resolve, 1200));
    addLog('Movement detected. Displacement > 50m sustained. Trip started.', '');

    await new Promise((resolve) => setTimeout(resolve, 2000));
    addLog(`Avg speed: ${route.avgSpeed} km/h  |  Max speed: ${route.maxSpeed} km/h`, '');

    await new Promise((resolve) => setTimeout(resolve, 2000));
    addLog('Stationary for > 5 min. Trip ended. Processing...', '');

    await new Promise((resolve) => setTimeout(resolve, 800));
    addLog('Sending trip features to AI microservice...', 'info');

    try {
      const tripPayload = {
        originCoordinates:      { ...route.origin, timestamp: new Date(Date.now() - route.duration * 1000) },
        destinationCoordinates: { ...route.destination, timestamp: new Date() },
        tripPoints:             [],
        averageSpeed:           route.avgSpeed,
        maximumSpeed:           route.maxSpeed,
        totalDistance:          route.distance,
        totalDurationSeconds:   route.duration,
      };

      const response = await axios.post('http://localhost:5000/api/trips', tripPayload);
      addLog(`AI Response → Mode: "${response.data.aiPredictedMode}"`, 'success');
      addLog('Trip saved to database successfully.', 'success');
      addLog('Open the Travel Diary to validate this trip.', 'info');
    } catch {
      addLog('Connection failed. Is the backend server running?', 'error');
    } finally {
      setIsSimulationActive(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip Simulator</h1>
          <p className="page-subtitle">Emulate background GPS tracking without a mobile device.</p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-label" style={{ marginBottom: '1.25rem' }}>
            <Navigation size={13} /> Tracking Module
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
            <div className={`sim-status-dot${isSimulationActive ? ' active' : ''}`} />
            <span style={{ fontSize: '0.875rem', color: isSimulationActive ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 500 }}>
              {isSimulationActive ? 'Simulation Active' : 'Idle'}
            </span>
          </div>

          <div className="field" style={{ marginBottom: '1.25rem' }}>
            <label>Simulation Route</label>
            <select
              value={selectedRouteIndex}
              onChange={(e) => setSelectedRouteIndex(Number(e.target.value))}
              disabled={isSimulationActive}
            >
              <option value={0}>Kochi City Route (5.4 km, 25 km/h)</option>
              <option value={1}>Thrissur Bus Route (9.2 km, 18 km/h)</option>
              <option value={2}>Trivandrum Walk (1.2 km, 5 km/h)</option>
            </select>
          </div>

          <button
            onClick={handleStartSimulation}
            disabled={isSimulationActive}
            className={isSimulationActive ? 'btn-secondary' : 'btn-brand'}
            style={{ width: '100%', justifyContent: 'center', padding: '0.72rem' }}
          >
            {isSimulationActive ? (
              <><Square size={15} /> Simulating...</>
            ) : (
              <><Play size={15} /> Run Simulation</>
            )}
          </button>
        </div>

        <div className="card">
          <div className="card-label" style={{ marginBottom: '1rem' }}>
            <Wifi size={13} /> System Status
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {[
              { label: 'Frontend',         url: 'http://localhost:5173' },
              { label: 'Backend API',      url: 'http://localhost:5000' },
              { label: 'AI Microservice',  url: 'http://localhost:8000' },
            ].map(({ label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>
                <span className="badge badge-success"><Activity size={10} /> Online</span>
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
          {simulationLogs.length === 0 ? (
            <span className="log-line" style={{ opacity: 0.5 }}>Awaiting simulation start...</span>
          ) : (
            simulationLogs.map((log, index) => (
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
