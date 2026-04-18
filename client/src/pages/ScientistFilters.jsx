import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Filter, TrendingUp, Leaf, Navigation } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => localStorage.getItem('natpac_token');

const MODES = ['Walking', 'Cycling', 'Car', 'Bus', 'Auto-Rickshaw', 'Train', 'Ferry'];
const TIME_SLOTS = [
  { value: '', label: 'Any time' },
  { value: 'morning', label: 'Morning (6–12)' },
  { value: 'afternoon', label: 'Afternoon (12–17)' },
  { value: 'evening', label: 'Evening (17–21)' },
  { value: 'night', label: 'Night (21–6)' }
];

const COLORS = ['#F5F230', '#5BCAF5', '#FF6B6B', '#4ECDC4', '#A78BFA', '#FBD38D', '#FC8181'];

/**
 * Feature 11: Scientist Dashboard Filters
 * Allows filtering by date range, travel mode, and time of day.
 */
const ScientistFilters = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mode, setMode] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiStats, setAiStats] = useState(null);

  const fetchFiltered = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (mode) params.mode = mode;
      if (timeOfDay) params.timeOfDay = timeOfDay;

      const res = await axios.get(`${API}/api/analytics/filtered-trips`, {
        headers: { Authorization: `Bearer ${token()}` },
        params
      });
      setResults(res.data.data);
    } catch (e) {
      console.error('Filter fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, mode, timeOfDay]);

  // Feature 7: Load AI accuracy on mount
  useEffect(() => {
    const fetchAiAccuracy = async () => {
      try {
        const res = await axios.get(`${API}/api/analytics/ai-accuracy`, {
          headers: { Authorization: `Bearer ${token()}` }
        });
        setAiStats(res.data.data);
      } catch (e) {
        console.error('AI accuracy fetch failed', e);
      }
    };
    fetchAiAccuracy();
    fetchFiltered(); // Initial load with no filters
  }, [fetchFiltered]);

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setMode('');
    setTimeOfDay('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics Filters</h1>
          <p className="page-subtitle">Filter trip data for deep research insights.</p>
        </div>
      </div>

      {/* ── Feature 7: AI Accuracy Panel ── */}
      {aiStats && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 12 }}>
            <TrendingUp size={16} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>AI vs User Accuracy</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#111' }}>
                {aiStats.accuracyPercent !== null ? `${aiStats.accuracyPercent}%` : 'N/A'}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {aiStats.correctPredictions} correct / {aiStats.totalValidated} validated trips
              </div>
            </div>

            {/* Accuracy ring */}
            <svg width={56} height={56} viewBox="0 0 56 56">
              <circle cx={28} cy={28} r={22} fill="none" stroke="#f0f0f0" strokeWidth={7} />
              <circle
                cx={28} cy={28} r={22} fill="none"
                stroke="#111" strokeWidth={7}
                strokeDasharray={`${((aiStats.accuracyPercent || 0) / 100) * 138.2} 138.2`}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
              />
            </svg>
          </div>

          {/* Mode-level breakdown */}
          {aiStats.modeBreakdown?.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <th style={{ textAlign: 'left', padding: '6px 4px', color: '#888', fontWeight: 500 }}>Mode</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', color: '#888', fontWeight: 500 }}>Total</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', color: '#888', fontWeight: 500 }}>Correct</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', color: '#888', fontWeight: 500 }}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {aiStats.modeBreakdown.map((m) => (
                    <tr key={m.mode} style={{ borderBottom: '1px solid #f8f8f8' }}>
                      <td style={{ padding: '6px 4px', fontWeight: 500 }}>{m.mode}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', color: '#555' }}>{m.total}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', color: '#16A34A' }}>{m.correct}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 600 }}>{m.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Filter Controls ── */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 12 }}>
          <Filter size={16} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Filter Criteria</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div className="field">
            <label>Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="field">
            <label>End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="field">
            <label>Travel Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="">All modes</option>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Time of Day</label>
            <select value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)}>
              {TIME_SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchFiltered} className="btn-primary" style={{ flex: 1 }} disabled={loading}>
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '0.7rem 1rem', borderRadius: 10,
              border: '1.5px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {results && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
            {[
              { icon: Navigation, label: 'Trips', value: results.count, color: '#5BCAF5' },
              { icon: Filter, label: 'Distance', value: `${results.totalDistanceKm} km`, color: '#F5F230' },
              { icon: Leaf, label: 'Carbon', value: `${(results.totalCarbonGrams / 1000).toFixed(1)} kg`, color: '#16A34A' }
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card" style={{ padding: '0.8rem', textAlign: 'center' }}>
                <Icon size={16} color={color} style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>{value}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Mode split chart */}
          {results.modeSplit?.length > 0 && (
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Mode Split</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={results.modeSplit} layout="vertical" barSize={18}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="mode" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(v) => [`${v} trips`]} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {results.modeSplit.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Trip rows */}
          <div className="card">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
              {results.count} Trip{results.count !== 1 ? 's' : ''} Found
            </div>
            {results.trips.length === 0 ? (
              <div className="empty-state">
                <p style={{ fontSize: 13, color: '#888' }}>No trips match the selected filters.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      {['Date', 'Mode', 'Distance', 'Carbon', 'Status'].map((h) => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: '#888', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.trips.slice(0, 50).map((trip) => (
                      <tr key={trip._id} style={{ borderBottom: '1px solid #f8f8f8' }}>
                        <td style={{ padding: '8px', color: '#555' }}>
                          {new Date(trip.tripRecordCreatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td style={{ padding: '8px', fontWeight: 500 }}>
                          {trip.isTripValidated ? trip.userValidatedMode : trip.aiPredictedMode}
                        </td>
                        <td style={{ padding: '8px', color: '#555' }}>
                          {trip.totalDistance ? `${(trip.totalDistance / 1000).toFixed(1)} km` : '—'}
                        </td>
                        <td style={{ padding: '8px', color: '#555' }}>
                          {trip.carbonEmissionGrams ? `${trip.carbonEmissionGrams}g` : '—'}
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span
                            className="badge"
                            style={{
                              background: trip.isTripValidated ? '#dcfce7' : '#f0f0f0',
                              color: trip.isTripValidated ? '#16a34a' : '#888',
                              fontSize: 10
                            }}
                          >
                            {trip.isTripValidated ? 'Validated' : 'AI Only'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.trips.length > 50 && (
                  <div style={{ fontSize: 11, color: '#aaa', textAlign: 'center', paddingTop: 8 }}>
                    Showing 50 of {results.trips.length} trips
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ScientistFilters;
