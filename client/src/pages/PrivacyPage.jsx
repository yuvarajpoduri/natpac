import { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Eye, Lock, UserCheck, Database, ChevronRight, PauseCircle, PlayCircle, AlertTriangle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('natpac_token')}` });

/**
 * Feature 10: Privacy Information Page
 * Shows data policy + live tracking pause/resume control.
 */
const PrivacyPage = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/profile`, { headers: authHeader() })
      .then(res => setIsPaused(res.data.data?.trackingPaused || false))
      .catch(() => {});
  }, []);

  const handleToggleTracking = async () => {
    setIsToggling(true);
    try {
      const res = await axios.patch(
        `${API}/api/profile`,
        { trackingPaused: !isPaused },
        { headers: authHeader() }
      );
      setIsPaused(res.data.data?.trackingPaused ?? !isPaused);
    } catch {
      alert('Could not update tracking preference. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  const sections = [
    {
      icon: Database,
      color: '#5BCAF5',
      title: 'What We Collect',
      points: [
        'GPS coordinates during active trip recording (start/end points and route path)',
        'Trip metadata: speed, duration, distance, and travel mode',
        'User-provided information: trip purpose, companions, and travel cost',
        'Device location access — only when you explicitly start a trip'
      ]
    },
    {
      icon: Eye,
      color: '#F5F230',
      title: 'How It\'s Used',
      points: [
        'Powering the AI travel mode prediction model (Random Forest classifier)',
        'Generating aggregated transport statistics for Kerala state planning',
        'Identifying travel patterns to support sustainable mobility research',
        'Your personal dashboard and travel diary — visible only to you'
      ]
    },
    {
      icon: Lock,
      color: '#A78BFA',
      title: 'Anonymization & Security',
      points: [
        'All personal identifiers are separated from trip data in research exports',
        'Scientist dashboards show only aggregated, never individual, user data',
        'All data is transmitted over HTTPS and stored with encryption at rest',
        'Passwords are hashed using bcrypt — we never store plain-text credentials'
      ]
    },
    {
      icon: UserCheck,
      color: '#FF6B6B',
      title: 'Your Rights',
      points: [
        'Access your complete trip history anytime via the Travel Diary',
        'Delete your account and all associated data at any time from Profile',
        'Opt out of AI model training by switching trips to manual-only mode',
        'Request a full data export from the Profile page'
      ]
    }
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Privacy & Data</h1>
          <p className="page-subtitle">How Routelytics handles your information.</p>
        </div>
      </div>

      {/* Hero banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #111 0%, #333 100%)',
          color: '#fff',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}
      >
        <Shield size={36} color="#F5F230" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
            Your data is yours.
          </div>
          <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>
            Routelytics is a government research platform. We are committed to full transparency
            about how your travel data is collected, stored, and used to improve public transport
            in Kerala.
          </div>
        </div>
      </div>

      {/* Tracking Control */}
      <div className="card" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem',
        border: isPaused ? '1.5px solid #FCA5A5' : '1.5px solid #86EFAC',
        background: isPaused ? '#FEF2F2' : '#F0FDF4',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1, minWidth: 200 }}>
          {isPaused
            ? <AlertTriangle size={22} color="#E24B4A" style={{ flexShrink: 0, marginTop: 1 }} />
            : <Shield size={22} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
          }
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 3 }}>
              Data Collection: {isPaused ? '⏸ Paused' : '▶ Active'}
            </div>
            <div style={{ fontSize: 13, color: isPaused ? '#991B1B' : '#166534', lineHeight: 1.5 }}>
              {isPaused
                ? 'Your GPS data is NOT being collected. Resume anytime to contribute to NATPAC research.'
                : 'Your journeys are being passively recorded and contributed to NATPAC transport research.'}
            </div>
          </div>
        </div>
        <button
          onClick={handleToggleTracking}
          disabled={isToggling}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 12,
            background: isPaused ? '#16A34A' : '#E24B4A',
            color: '#fff', border: 'none', cursor: isToggling ? 'default' : 'pointer',
            fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
            opacity: isToggling ? 0.7 : 1, flexShrink: 0,
            transition: 'opacity 0.15s',
          }}
        >
          {isPaused
            ? <><PlayCircle size={16} /> {isToggling ? 'Resuming…' : 'Resume Tracking'}</>
            : <><PauseCircle size={16} /> {isToggling ? 'Pausing…' : 'Pause Tracking'}</>
          }
        </button>
      </div>

      {/* Sections */}
      <div className="stack">
        {sections.map(({ icon: Icon, color, title, points }) => (
          <div key={title} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: `${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <Icon size={18} color={color} />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0 }}>{title}</h2>
            </div>

            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {points.map((point, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    padding: '0.5rem 0',
                    borderBottom: i < points.length - 1 ? '1px solid #f5f5f5' : 'none',
                    fontSize: 13,
                    color: '#444',
                    lineHeight: 1.6
                  }}
                >
                  <ChevronRight size={14} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#aaa',
          marginTop: '2rem',
          lineHeight: 1.8
        }}
      >
        This platform is operated under the National Transport Planning and Analysis Centre (NATPAC).
        <br />
        For data-related queries, contact: <span style={{ color: '#555' }}>data@natpac.kerala.gov.in</span>
        <br />
        Last updated: April 2026
      </div>
    </div>
  );
};

export default PrivacyPage;
