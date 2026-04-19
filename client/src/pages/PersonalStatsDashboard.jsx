import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Navigation, Clock, Leaf, Award, MapPin, AlertTriangle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => localStorage.getItem('natpac_token');

// Feature 3: Badge thresholds
const getBadge = (points) => {
  if (points >= 150) return { label: 'Smart Validator', color: '#7C3AED', icon: Award };
  if (points >= 50) return { label: 'Eco Starter', color: '#16A34A', icon: Leaf };
  return { label: 'Explorer', color: '#888888', icon: MapPin };
};

const COLORS = ['#F5F230', '#5BCAF5', '#FF6B6B', '#4ECDC4', '#A78BFA', '#FBD38D', '#FC8181'];

const StatCard = ({ icon: Icon, label, value, sub, color = '#111' }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
    <div
      style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}
    >
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{sub}</div>}
    </div>
  </div>
);

const PersonalStatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, weeklyRes] = await Promise.all([
          axios.get(`${API}/api/analytics/personal`, { headers: { Authorization: `Bearer ${token()}` } }),
          axios.get(`${API}/api/analytics/weekly`, { headers: { Authorization: `Bearer ${token()}` } })
        ]);
        setStats(statsRes.data.data);
        setWeekly(weeklyRes.data.data);
      } catch (e) {
        console.error('Failed to load stats', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state loading-pulse">
          <TrendingUp size={36} />
          <p>Loading your stats...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="page">
        <div className="card">
          <div className="empty-state">
            <p>Could not load stats. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }

  const badge = getBadge(stats.points);

  // Prepare weekly trips-per-day data for bar chart
  const weeklyBarData = weekly
    ? Object.entries(weekly.tripsPerDay).map(([day, count]) => ({ day, trips: count }))
    : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Stats</h1>
          <p className="page-subtitle">Your personal travel insights and achievements.</p>
        </div>
      </div>

      {/* ── Feature 3: Gamification Badge ── */}
      <div
        className="card"
        style={{
          background: `linear-gradient(135deg, ${badge.color}18 0%, #ffffff 100%)`,
          border: `1.5px solid ${badge.color}30`,
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 12, background: `${badge.color}15` }}>
            <badge.icon size={28} color={badge.color} />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              Your Badge
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: badge.color }}>{badge.label}</div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>
              {stats.points} points earned &nbsp;·&nbsp;
              {stats.points < 50
                ? `${50 - stats.points} pts to Eco Starter`
                : stats.points < 150
                ? `${150 - stats.points} pts to Smart Validator`
                : 'Max badge achieved!'}
            </div>
          </div>
        </div>

        {/* Points progress bar */}
        <div style={{ marginTop: '1rem', background: '#f0f0f0', borderRadius: 99, height: 8, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              background: badge.color,
              borderRadius: 99,
              width: `${Math.min((stats.points / 150) * 100, 100)}%`,
              transition: 'width 0.8s ease'
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#aaa', marginTop: 4 }}>
          <span>0</span><span>Eco Starter (50)</span><span>Smart Validator (150)</span>
        </div>
      </div>

      {/* ── Feature 7: Peak Time Personal Alerts ── */}
      {stats.peakAlert && (
        <div className="card" style={{ background: '#FEF3C7', border: '1px solid #F59E0B', marginBottom: '1rem', display: 'flex', gap: 12, alignItems: 'center' }}>
          <AlertTriangle size={24} color="#D97706" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>Traffic Alert</div>
            <div style={{ fontSize: 13, color: '#B45309', marginTop: 2 }}>{stats.peakAlert}</div>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
        <StatCard icon={Navigation} label="Total Trips" value={stats.totalTrips} color="#5BCAF5" />
        <StatCard icon={MapPin} label="Distance Covered" value={`${stats.totalDistanceKm} km`} color="#F5F230" />
        <StatCard
          icon={Clock}
          label="Time Travelled"
          value={`${stats.totalDurationHours}h`}
          sub={`Avg ${stats.avgDurationMinutes} min/trip`}
          color="#A78BFA"
        />
        <StatCard
          icon={Leaf}
          label="Carbon Emitted"
          value={`${(stats.totalCarbonGrams / 1000).toFixed(2)} kg`}
          sub="CO₂ equivalent"
          color="#16A34A"
        />
      </div>

      {/* Most used mode */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Most Used Mode
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#111' }}>
          {stats.mostUsedMode}
        </div>
      </div>

      {/* ── Feature 2: Mode breakdown pie chart ── */}
      {stats.modeBreakdown?.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Mode Breakdown</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={stats.modeBreakdown}
                dataKey="count"
                nameKey="mode"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {stats.modeBreakdown.map((entry, i) => (
                  <Cell key={entry.mode} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v} trips`, n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Feature 5: Weekly summary cards ── */}
      {weekly && (
        <>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: '0.75rem' }}>
            This Week's Summary
          </div>

          <div
            className="grid-2"
            style={{
              gap: '0.75rem',
              marginBottom: '1rem'
            }}
          >
            {[
              { label: 'Trips this week', value: weekly.totalTripsThisWeek },
              { label: 'Distance', value: `${weekly.weeklyDistanceKm} km` },
              { label: 'Most active', value: weekly.mostActiveRange, small: true },
              { label: 'Top mode', value: weekly.mostUsedMode }
            ].map(({ label, value, small }) => (
              <div key={label} className="card" style={{ padding: '0.9rem 1rem' }}>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  {label}
                </div>
                <div style={{ fontSize: small ? 14 : 20, fontWeight: 700, color: '#111' }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              Weekly Carbon: {(weekly.weeklyCarbonGrams / 1000).toFixed(2)} kg CO₂
            </div>
            <div style={{ fontSize: 12, color: '#777' }}>
              "{weekly.totalTripsThisWeek} trips made this week"
            </div>
          </div>

          {/* Trips per day bar chart */}
          {weeklyBarData.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Trips Per Day</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyBarData} barSize={28}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="trips" fill="#F5F230" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* ── Feature 8: Frequent Locations ── */}
      {stats.frequentLocations?.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} /> Frequent Locations
          </div>
          <div className="stack">
            {stats.frequentLocations.map((loc, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0',
                  borderBottom: i < stats.frequentLocations.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: '#F5F23020', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <MapPin size={14} color="#888" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                    {loc.label === 'Unknown' ? `Location ${i + 1}` : loc.label}
                  </div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} · {loc.visitCount} visits
                  </div>
                </div>
                <span
                  className="badge badge-brand"
                  style={{
                    background: loc.label === 'Home' ? '#FEF3C7' :
                               loc.label === 'Work' ? '#EDE9FE' : '#f0f0f0',
                    color: loc.label === 'Home' ? '#92400E' :
                           loc.label === 'Work' ? '#4C1D95' : '#666'
                  }}
                >
                  {loc.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalStatsDashboard;
