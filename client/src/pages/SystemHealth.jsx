import { useState, useEffect } from 'react';
import axios from 'axios';
import { Server, Cpu, HardDrive, Clock, Users, Navigation, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const SystemHealth = () => {
  const [healthData, setHealthData] = useState(null);
  const [usersData, setUsersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('health');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const authToken = localStorage.getItem('natpac_token');
  const authHeaders = { headers: { 'Authorization': `Bearer ${authToken}` } };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [healthResponse, usersResponse] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/health`, authHeaders),
        axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/users`, authHeaders)
      ]);
      setHealthData(healthResponse.data.data);
      setUsersData(usersResponse.data.data);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to fetch system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (targetUserId, targetUserName) => {
    if (!window.confirm(`Are you sure you want to delete "${targetUserName}" and all their trips?`)) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admin/users/${targetUserId}`, authHeaders);
      setUsersData(prev => prev.filter(u => u.userId !== targetUserId));
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-pulse" style={{ color: '#666666' }}>Running diagnostics...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Monitor</h1>
          <p className="page-subtitle">Infrastructure health and user management</p>
        </div>
        <button className="btn-secondary" onClick={fetchAllData}>
          <RefreshCw size={14} /> Refresh {lastRefreshed && `(${lastRefreshed})`}
        </button>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {[
          { key: 'health', label: 'System Health' },
          { key: 'users', label: `Users (${usersData.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'btn-brand' : 'btn-secondary'}
            onClick={() => setActiveTab(tab.key)}
            style={{ fontSize: '13px', height: '40px', padding: '0 20px' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'health' && healthData && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="card">
              <div className="card-label"><Server size={13} /> Server</div>
              <div className="stat-value" style={{ color: '#34D399', fontSize: '24px' }}>Online</div>
              <div style={{ fontSize: '12px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Node {healthData.nodeVersion}</div>
            </div>
            <div className="card">
              <div className="card-label"><Clock size={13} /> Uptime</div>
              <div className="stat-value" style={{ fontSize: '24px' }}>{Math.round(parseInt(healthData.uptime) / 60)}m</div>
              <div style={{ fontSize: '12px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{healthData.uptime}</div>
            </div>
            <div className="card">
              <div className="card-label"><Cpu size={13} /> Memory</div>
              <div className="stat-value" style={{ fontSize: '24px' }}>{healthData.memoryUsageMB} MB</div>
              <div style={{ fontSize: '12px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Heap usage</div>
            </div>
            <div className="card">
              <div className="card-label"><HardDrive size={13} /> Storage</div>
              <div className="stat-value" style={{ fontSize: '24px' }}>{healthData.database.estimatedStorageKB} KB</div>
              <div style={{ fontSize: '12px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estimated DB size</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            <div className="card">
              <div className="card-label" style={{ marginBottom: '1rem' }}><Users size={13} /> User Breakdown</div>
              <div className="progress-row">
                <div className="progress-label"><span>Citizens</span><span style={{ color: '#111111', fontWeight: 700 }}>{healthData.users.citizens}</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${healthData.users.total > 0 ? (healthData.users.citizens / healthData.users.total) * 100 : 0}%` }} /></div>
              </div>
              <div className="progress-row">
                <div className="progress-label"><span>Scientists</span><span style={{ color: '#111111', fontWeight: 700 }}>{healthData.users.scientists}</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${healthData.users.total > 0 ? (healthData.users.scientists / healthData.users.total) * 100 : 0}%`, background: '#5BCAF5' }} /></div>
              </div>
            </div>

            <div className="card">
              <div className="card-label" style={{ marginBottom: '1rem' }}><Navigation size={13} /> Trip Status</div>
              <div className="progress-row">
                <div className="progress-label"><span>Validated</span><span style={{ color: '#34D399', fontWeight: 700 }}>{healthData.trips.validated}</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${healthData.trips.total > 0 ? (healthData.trips.validated / healthData.trips.total) * 100 : 0}%`, background: '#34D399' }} /></div>
              </div>
              <div className="progress-row">
                <div className="progress-label"><span>Pending</span><span style={{ color: '#F5F230', fontWeight: 700 }}>{healthData.trips.pending}</span></div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${healthData.trips.total > 0 ? (healthData.trips.pending / healthData.trips.total) * 100 : 0}%` }} /></div>
              </div>
            </div>
          </div>

          {/* Service Endpoints */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div className="card-label" style={{ marginBottom: '1rem' }}><Wifi size={13} /> Service Endpoints</div>
            <div className="stack">
              {[
                { name: 'Express API',       endpoint: 'http://localhost:5000', status: 'online' },
                { name: 'AI Microservice',   endpoint: 'http://localhost:8000', status: 'online' },
                { name: 'React Frontend',    endpoint: 'http://localhost:5173', status: 'online' },
                { name: 'MongoDB Instance',  endpoint: 'mongodb://localhost:27017', status: 'online' }
              ].map(service => (
                <div key={service.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#F2F2F2', borderRadius: '12px' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#111111' }}>{service.name}</div>
                    <div style={{ fontSize: '12px', color: '#888888' }}>{service.endpoint}</div>
                  </div>
                  <span className="badge badge-success"><Wifi size={10} /> {service.status}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="stack">
          {usersData.length === 0 ? (
            <div className="card empty-state">
              <Users size={36} style={{ color: '#888888' }} />
              <h3>No users found</h3>
            </div>
          ) : (
            usersData.map(singleUser => (
              <div key={singleUser.userId} className="trip-card" style={{ cursor: 'default' }}>
                <div className={`trip-icon${singleUser.userRole === 'scientist' ? ' validated' : ''}`}>
                  <Users size={18} />
                </div>
                <div className="trip-info">
                  <div className="trip-title">{singleUser.fullName}</div>
                  <div className="trip-meta">
                    <span className={`badge ${singleUser.userRole === 'scientist' ? 'badge-info' : 'badge-brand'}`}>
                      {singleUser.userRole}
                    </span>
                    <span className="trip-meta-item">{singleUser.totalTrips} trips</span>
                    <span className="trip-meta-item">{singleUser.validatedTrips} validated</span>
                    <span style={{ fontSize: '12px', color: '#888888' }}>
                      Joined {new Date(singleUser.accountCreatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  className="icon-btn"
                  title="Delete user"
                  onClick={() => handleDeleteUser(singleUser.userId, singleUser.fullName)}
                  style={{ color: '#E24B4A' }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
