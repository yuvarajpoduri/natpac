import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Navigation, Map, TrendingUp, Download, BarChart3 } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useAuthentication } from '../context/AuthContext';

const ScientistDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    activeCitizens: 0,
    tripsCaptured: 0,
    districtsCovered: 0,
    aiAccuracy: 0,
    modeSplitData: [],
    tripNodes: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuthentication();

  useEffect(() => {
    fetchLiveAnalytics();
  }, []);

  const fetchLiveAnalytics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('natpac_token')}`
        }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-pulse" style={{ color: 'var(--text-secondary)' }}>Loading live intelligence...</div>
      </div>
    );
  }

  const {
    activeCitizens,
    tripsCaptured,
    aiAccuracy,
    districtsCovered,
    modeSplitData,
    tripNodes
  } = dashboardData;

  const maxModeValue = modeSplitData.length > 0 ? Math.max(...modeSplitData.map(m => m.value)) : 100;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Kerala Transport Insights — live aggregated data</p>
        </div>
        <button className="btn-secondary">
          <Download size={15} /> Export Report
        </button>
      </div>

      <div className="stats-grid">
        <div className="card">
          <div className="card-label"><Users size={13} /> Active Citizens</div>
          <div className="stat-value">{activeCitizens.toLocaleString()}</div>
          <div className="stat-change"><TrendingUp size={12} /> Live tracking users</div>
        </div>

        <div className="card">
          <div className="card-label"><Navigation size={13} /> Trips Captured</div>
          <div className="stat-value">{tripsCaptured.toLocaleString()}</div>
          <div className="stat-change"><TrendingUp size={12} /> {aiAccuracy}% AI accuracy</div>
        </div>

        <div className="card">
          <div className="card-label"><Map size={13} /> Districts Covered</div>
          <div className="stat-value">{districtsCovered} / 14</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Kerala Coverage</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-label" style={{ marginBottom: '1.25rem' }}>
            <BarChart3 size={13} /> Mode Share Distribution
          </div>
          <div>
            {modeSplitData.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>No trips verified yet.</div>
            ) : (
              modeSplitData.map((item) => (
                <div className="progress-row" key={item.label}>
                  <div className="progress-label">
                    <span>{item.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden', minHeight: '320px' }}>
          <div style={{ padding: '1rem 1.375rem', borderBottom: '1px solid var(--border)' }}>
            <div className="card-label"><Map size={13} /> Kerala Heatmap ({tripNodes.reduce((a, b) => a + b.trips, 0)} origins)</div>
          </div>
          <div style={{ height: '260px' }}>
            <MapContainer
              center={[10.0, 76.5]}
              zoom={7}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {tripNodes.map((node, i) => (
                <CircleMarker
                  key={i}
                  center={[node.lat, node.lng]}
                  radius={node.radius}
                  pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.45, weight: 1.5 }}
                >
                  <Popup>{node.city} — {node.trips.toLocaleString()} trips</Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScientistDashboard;
