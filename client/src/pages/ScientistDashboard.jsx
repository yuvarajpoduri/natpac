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
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/analytics/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('natpac_token')}`
        }
      });
      setDashboardData(response.data.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-pulse" style={{ fontSize: '13px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Loading live intelligence...</div>
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

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Kerala Transport Insights — live aggregated data</p>
        </div>
        <button className="btn-secondary">
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="card">
          <div className="card-label"><Users size={12} /> Active Citizens</div>
          <div className="stat-value">{activeCitizens.toLocaleString()}</div>
          <div className="stat-change"><TrendingUp size={11} /> Live tracking users</div>
        </div>

        <div className="card">
          <div className="card-label"><Navigation size={12} /> Trips Captured</div>
          <div className="stat-value">{tripsCaptured.toLocaleString()}</div>
          <div className="stat-change"><TrendingUp size={11} /> {aiAccuracy}% AI accuracy</div>
        </div>

        <div className="card">
          <div className="card-label"><Map size={12} /> Districts Covered</div>
          <div className="stat-value">{districtsCovered} / 14</div>
          <div style={{ fontSize: '11px', color: '#999999', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Kerala Coverage</div>
        </div>
      </div>

      {/* Mode Split + Map */}
      <div className="grid-2">
        {/* Mode Share Distribution */}
        <div className="card">
          <div className="card-label" style={{ marginBottom: '20px' }}>
            <BarChart3 size={12} /> Mode Share Distribution
          </div>
          <div>
            {modeSplitData.length === 0 ? (
              <div style={{ color: '#999999', fontSize: '14px' }}>No trips verified yet.</div>
            ) : (
              modeSplitData.map((item) => (
                <div className="progress-row" key={item.label}>
                  <div className="progress-label">
                    <span>{item.label}</span>
                    <span style={{ color: '#111111', fontWeight: 700 }}>{item.value}%</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kerala Heatmap */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #EBEBEB' }}>
            <div className="card-label" style={{ marginBottom: 0 }}>
              <Map size={12} /> Kerala Heatmap ({tripNodes.reduce((a, b) => a + b.trips, 0)} origins)
            </div>
          </div>
          <div style={{ flex: 1, minHeight: '320px', position: 'relative' }}>
            <MapContainer
              center={[10.5, 76.5]}
              zoom={7}
              style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
              zoomControl={true}
              scrollWheelZoom={true}
              maxBounds={[[8.15, 74.85], [12.85, 77.45]]}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {tripNodes.map((node, i) => (
                <CircleMarker
                  key={i}
                  center={[node.lat, node.lng]}
                  radius={node.radius}
                  pathOptions={{ color: '#F5F230', fillColor: '#F5F230', fillOpacity: 0.55, weight: 1.5 }}
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
