import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Users, Navigation, Map, TrendingUp, Download, BarChart3,
  Zap, BookOpen, Route, Cpu, ShieldCheck, Activity,
  ArrowUpRight, ArrowRight, CheckCircle, Clock, Leaf,
  Car, Bus, Bike, RefreshCw, LayoutDashboard, ListTodo, Globe
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import { useAuthentication } from '../context/AuthContext';

/* ─── SVG Donut Chart ─── */
const DonutChart = ({ segments }) => {
  const size = 130, cx = 65, cy = 65, r = 48;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F0F0" strokeWidth={18} />
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={18}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
};

const MODE_META = {
  Car:             { color: '#E24B4A', icon: Car,        label: 'Car',           dashArray: null },
  Bus:             { color: '#5BCAF5', icon: Bus,        label: 'Bus',           dashArray: '8 4' },
  Cycling:         { color: '#34D399', icon: Bike,       label: 'Cycling',       dashArray: null },
  Walking:         { color: '#F5A623', icon: Navigation, label: 'Walking',       dashArray: '4 6' },
  'Auto-Rickshaw': { color: '#A78BFA', icon: Car,        label: 'Auto-Rickshaw', dashArray: null },
  Train:           { color: '#6366F1', icon: Navigation, label: 'Train',         dashArray: '12 4' },
  Ferry:           { color: '#0EA5E9', icon: Navigation, label: 'Ferry',         dashArray: '6 6' },
};

/* ─── Tab button — icon + yellow active ─── */
const TAB_ICONS = {
  overview:  LayoutDashboard,
  trips:     Navigation,
  analytics: BarChart3,
  map:       Globe,
};

const Tab = ({ tabKey, label, active, onClick, badge }) => {
  const [hov, setHov] = useState(false);
  const Icon = TAB_ICONS[tabKey] || LayoutDashboard;
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '10px 18px', borderRadius: 12, border: 'none',
        background: active ? '#F5F230' : hov ? '#EBEBEB' : 'transparent',
        color: active ? '#111111' : hov ? '#111111' : '#666666',
        fontWeight: active ? 800 : 500, fontSize: 13,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s ease',
        display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap',
        boxShadow: active ? '0 2px 8px rgba(245,242,48,0.35)' : 'none',
      }}
    >
      <Icon size={15} />
      {label}
      {badge != null && badge > 0 && (
        <span style={{
          background: active ? '#111111' : '#DDDDDD',
          color: active ? '#F5F230' : '#555555',
          borderRadius: 99, fontSize: 10,
          fontWeight: 800, padding: '1px 7px', lineHeight: '17px',
        }}>{badge}</span>
      )}
    </button>
  );
};

/* ─── Hero CTA button ─── */
const HeroBtn = ({ to, icon: Icon, children, primary }) => {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '0 22px', height: 46, borderRadius: 13,
      textDecoration: 'none', fontFamily: 'inherit',
      fontWeight: 700, fontSize: 14, cursor: 'pointer',
      transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
      transform: hov ? 'translateY(-2px)' : 'none',
      ...(primary ? {
        background: hov ? '#ffff00' : '#F5F230',
        color: '#111111',
        boxShadow: hov ? '0 10px 28px rgba(245,242,48,0.5)' : '0 4px 14px rgba(245,242,48,0.3)',
      } : {
        background: hov ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.1)',
        color: '#FFFFFF',
        border: '1.5px solid rgba(255,255,255,0.3)',
        backdropFilter: 'blur(6px)',
      }),
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <Icon size={15} />{children}
    </Link>
  );
};

/* ─── Stat card ─── */
const StatCard = ({ label, value, sub, color, icon: Icon, trend, delay = 0 }) => {
  const [hov, setHov] = useState(false);
  return (
    <div className="card" style={{
      animationDelay: `${delay}s`, cursor: 'default',
      transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      transform: hov ? 'translateY(-3px)' : 'none',
      boxShadow: hov ? '0 8px 28px rgba(0,0,0,0.07)' : 'none',
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
        {trend && (
          <span style={{
            fontSize: 12, fontWeight: 600, color: '#22C55E',
            background: '#F0FDF4', borderRadius: 8, padding: '3px 9px',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <TrendingUp size={11} /> {trend}
          </span>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', color: '#111111', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#777777', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#AAAAAA', marginTop: 3 }}>{sub}</div>}
    </div>
  );
};

/* ─── Quick action card ─── */
const QuickAction = ({ to, icon: Icon, title, desc, color }) => {
  const [hov, setHov] = useState(false);
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 18px', borderRadius: 16,
        border: hov ? `1.5px solid ${color}` : '1.5px solid #EBEBEB',
        background: hov ? `${color}08` : '#FAFAF8',
        transition: 'all 0.18s ease', cursor: 'pointer',
        transform: hov ? 'translateX(4px)' : 'none',
      }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: hov ? `${color}25` : `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background 0.18s',
        }}>
          <Icon size={20} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111111' }}>{title}</div>
          <div style={{ fontSize: 13, color: '#888888', marginTop: 2 }}>{desc}</div>
        </div>
        <ArrowRight size={16} color={hov ? color : '#CCCCCC'} style={{ transition: 'color 0.18s' }} />
      </div>
    </Link>
  );
};

/* ─── Progress bar ─── */
const ProgressRow = ({ label, value, color, icon: Icon }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#3333333', fontWeight: 500 }}>
        {Icon && <Icon size={14} color={color} />} {label}
      </div>
      <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}%</span>
    </div>
    <div style={{ height: 10, background: '#F0F0F0', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${value}%`, background: `linear-gradient(90deg, ${color}99, ${color})`,
        borderRadius: 99, transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  </div>
);

/* ═══════════════════════════════════════════ MAIN ═══════════════════════════════════════════ */
const ScientistDashboard = () => {
  const { currentUser } = useAuthentication();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    activeCitizens: 0, tripsCaptured: 0, districtsCovered: 0,
    aiAccuracy: 0, modeSplitData: [], tripNodes: [],
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const token = localStorage.getItem('natpac_token');
  const isCitizen = currentUser?.userRole === 'citizen';

  const fetchData = async (silent = false) => {
    if (silent) setIsRefreshing(true); else setIsLoading(true);
    try {
      const [analyticsRes, tripsRes] = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/analytics/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/trips/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (analyticsRes.status === 'fulfilled') setDashboardData(analyticsRes.value.data.data);
      if (tripsRes.status === 'fulfilled') setRecentTrips(tripsRes.value.data.data?.slice(0, 20) || []);
    } finally {
      setIsLoading(false); setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const { activeCitizens, tripsCaptured, aiAccuracy, districtsCovered, modeSplitData, tripNodes } = dashboardData;

  const donutSegments = modeSplitData.slice(0, 5).map(item => ({
    pct: item.value,
    color: MODE_META[item.label]?.color || '#AAAAAA',
  }));

  const fmtDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—';

  const tabs = [
    { key: 'overview',  label: 'Overview' },
    { key: 'trips',     label: 'My Trips', badge: recentTrips.length },
    { key: 'analytics', label: 'Analytics' },
    { key: 'map',       label: 'Map' },
  ];

  if (isLoading) return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="loading-pulse" style={{ fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Loading dashboard...</div>
    </div>
  );

  return (
    <div className="page">

      {/* ── PAGE HEADER ── */}
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div>
          <h1 className="page-title">
            Welcome back, {currentUser?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="page-subtitle">
            {isCitizen
              ? 'Track your journeys and monitor your travel footprint.'
              : 'Real-time Kerala transport intelligence at your fingertips.'}
          </p>
        </div>
        <button onClick={() => fetchData(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '0 20px', height: 42, borderRadius: 12,
          border: '1.5px solid #E0E0E0', background: '#FFFFFF',
          color: '#333333', fontWeight: 600, fontSize: 13,
          fontFamily: 'inherit', cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#111111'; e.currentTarget.style.background = '#F8F8F8'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0E0E0'; e.currentTarget.style.background = '#FFFFFF'; }}
        >
          <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* ── HERO BANNER ── */}
      <div style={{
        borderRadius: 22, padding: '36px 36px', marginBottom: '2rem',
        background: 'linear-gradient(135deg, #0B4D3B 0%, #0F6148 40%, #1A7A5E 100%)',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 24, flexWrap: 'wrap',
        boxShadow: '0 20px 60px rgba(11,77,59,0.35)',
      }}>
        {/* decorative orbs */}
        <div style={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, background: '#F5F230', opacity: 0.07, borderRadius: '50%', filter: 'blur(70px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: 80, width: 220, height: 220, background: '#34D399', opacity: 0.1, borderRadius: '50%', filter: 'blur(55px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, flex: 1, minWidth: 0 }}>
          <h2 style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 26, marginBottom: 10, letterSpacing: '-0.025em', lineHeight: 1.2 }}>
            {isCitizen ? 'Your Travel Dashboard' : 'Live Intelligence Platform'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, maxWidth: 500, lineHeight: 1.7, marginBottom: 24 }}>
            {isCitizen
              ? 'Every journey you record shapes Kerala\'s transport future. Use GPS tracking for accurate data.'
              : `${tripsCaptured.toLocaleString()} trips collected across ${districtsCovered}/14 districts. AI classifying at ${aiAccuracy}% accuracy.`}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {isCitizen ? (
              <>
                <HeroBtn to="/simulate" icon={Navigation} primary>Track a Trip</HeroBtn>
                <HeroBtn to="/diary" icon={BookOpen}>My Diary</HeroBtn>
              </>
            ) : (
              <>
                <HeroBtn to="/analytics" icon={BarChart3} primary>Analytics</HeroBtn>
                <HeroBtn to="/export" icon={Download}>Export Data</HeroBtn>
              </>
            )}
          </div>
        </div>

        {/* Right side — mini stats strip */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          {[
            { label: 'Trips', value: tripsCaptured.toLocaleString(), color: '#F5F230' },
            { label: 'Citizens', value: activeCitizens.toLocaleString(), color: '#5BCAF5' },
            { label: 'AI Score', value: `${aiAccuracy}%`, color: '#34D399' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 20px', textAlign: 'right', backdropFilter: 'blur(8px)' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: '1.75rem',
        background: '#F3F3F3', padding: 5, borderRadius: 14,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
      }}>
        {tabs.map(t => <Tab key={t.key} tabKey={t.key} label={t.label} badge={t.badge} active={activeTab === t.key} onClick={() => setActiveTab(t.key)} />)}
      </div>


      {/* ═══ OVERVIEW ═══ */}
      {activeTab === 'overview' && (
        <>
          {/* 4 stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: '1.75rem' }}>
            <StatCard label="Trips Recorded" value={tripsCaptured.toLocaleString()} sub="all time" icon={Navigation} color="#5BCAF5" trend="+12%" delay={0} />
            <StatCard label="Active Citizens" value={activeCitizens.toLocaleString()} sub="platform users" icon={Users} color="#34D399" trend="+5%" delay={0.05} />
            <StatCard label="Districts Covered" value={`${districtsCovered}/14`} sub="Kerala coverage" icon={Map} color="#A78BFA" delay={0.1} />
            <StatCard label="AI Accuracy" value={`${aiAccuracy}%`} sub="mode prediction" icon={Cpu} color="#F5A623" trend="stable" delay={0.15} />
          </div>

          {/* Quick actions + recent trips */}
          <div className="grid-2" style={{ alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {isCitizen ? (
                  <>
                    <QuickAction to="/simulate" icon={Navigation} title="Track a New Trip" desc="Start GPS recording your journey" color="#5BCAF5" />
                    <QuickAction to="/diary" icon={BookOpen} title="Travel Diary" desc="Review & validate past trips" color="#34D399" />
                    <QuickAction to="/simulate" icon={Route} title="Scenario Planner" desc="Simulate any Kerala route" color="#A78BFA" />
                  </>
                ) : (
                  <>
                    <QuickAction to="/analytics" icon={BarChart3} title="Deep Analytics" desc="Mode-split, trends & demographics" color="#5BCAF5" />
                    <QuickAction to="/export" icon={Download} title="Export Dataset" desc="Download CSV / JSON" color="#34D399" />
                    <QuickAction to="/system" icon={ShieldCheck} title="System Health" desc="AI service & server monitor" color="#A78BFA" />
                  </>
                )}
              </div>
            </div>

            <div className="card" style={{ paddingTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div className="card-label" style={{ marginBottom: 0 }}><Clock size={12} /> Recent Trips</div>
                <Link to="/diary" style={{ fontSize: 12, color: '#5BCAF5', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  All trips <ArrowUpRight size={11} />
                </Link>
              </div>

              {recentTrips.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Navigation size={36} style={{ color: '#DDDDDD', marginBottom: 12 }} />
                  <p style={{ fontSize: 14, color: '#999999' }}>No trips yet</p>
                  <Link to="/simulate" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    marginTop: 16, padding: '10px 20px', borderRadius: 10,
                    background: '#F5F230', color: '#111111', fontWeight: 700,
                    fontSize: 13, textDecoration: 'none',
                  }}><Navigation size={14} /> Start Tracking</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {recentTrips.map((trip, i) => {
                    const mode = trip.userValidatedMode || trip.aiPredictedMode || 'Car';
                    const meta = MODE_META[mode] || MODE_META.Car;
                    const Icon = meta.icon;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: '#FAFAF8', borderRadius: 12, border: '1px solid #EEEEEE' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={16} color={meta.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {trip.originCoordinates?.name || 'Origin'} → {trip.destinationCoordinates?.name || 'Destination'}
                          </div>
                          <div style={{ fontSize: 11, color: '#AAAAAA', marginTop: 2 }}>
                            {fmtTime(trip.originCoordinates?.timestamp)} · {fmtDist(trip.totalDistance || 0)} · {fmtDate(trip.tripRecordCreatedAt)}
                          </div>
                        </div>
                        {trip.isTripValidated
                          ? <CheckCircle size={14} color="#34D399" />
                          : <span style={{ fontSize: 10, background: '#FFFBEB', color: '#D97706', borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>Pending</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}


      {/* ═══ TRIPS ═══ */}
      {activeTab === 'trips' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recentTrips.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '64px 0' }}>
              <Navigation size={48} style={{ color: '#E0E0E0', marginBottom: 16 }} />
              <h3 style={{ marginBottom: 8, color: '#444444' }}>No trips yet</h3>
              <p style={{ color: '#888888', fontSize: 14, marginBottom: 24 }}>GPS-record your first journey to see it here.</p>
              <Link to="/simulate" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12, background: '#F5F230',
                color: '#111111', fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}><Navigation size={16} /> Start Tracking</Link>
            </div>
          ) : recentTrips.map((trip, i) => {
            const mode = trip.userValidatedMode || trip.aiPredictedMode || 'Car';
            const meta = MODE_META[mode] || MODE_META.Car;
            const Icon = meta.icon;
            return (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={24} color={meta.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>
                    {trip.originCoordinates?.name || 'Origin'} → {trip.destinationCoordinates?.name || 'Destination'}
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#888888', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {fmtTime(trip.originCoordinates?.timestamp)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Route size={11} /> {fmtDist(trip.totalDistance || 0)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Cpu size={11} /> AI: <strong style={{ color: meta.color }}>{trip.aiPredictedMode || '—'}</strong></span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: '#AAAAAA', marginBottom: 6 }}>{fmtDate(trip.tripRecordCreatedAt)}</div>
                  {trip.isTripValidated
                    ? <span style={{ fontSize: 11, background: '#ECFDF5', color: '#16A34A', borderRadius: 8, padding: '3px 10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Validated</span>
                    : <span style={{ fontSize: 11, background: '#FFFBEB', color: '#D97706', borderRadius: 8, padding: '3px 10px', fontWeight: 700 }}>Needs Validation</span>}
                </div>
              </div>
            );
          })}
          <Link to="/diary" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px', borderRadius: 14, border: '1.5px dashed #DDDDDD',
            color: '#555555', fontWeight: 600, fontSize: 14, textDecoration: 'none',
            transition: 'border-color 0.15s, color 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#5BCAF5'; e.currentTarget.style.color = '#5BCAF5'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#DDDDDD'; e.currentTarget.style.color = '#555555'; }}
          >
            Open Full Travel Diary <ArrowUpRight size={14} />
          </Link>
        </div>
      )}


      {/* ═══ ANALYTICS ═══ */}
      {activeTab === 'analytics' && (
        <>
          <div className="grid-2" style={{ alignItems: 'start' }}>
            {/* Donut + Mode split */}
            <div className="card">
              <div className="card-label" style={{ marginBottom: 24 }}><BarChart3 size={12} /> Mode Share Distribution</div>
              {modeSplitData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#999999', fontSize: 14 }}>
                  Validate trips in your diary to see mode split data.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <DonutChart segments={donutSegments} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#111111' }}>{modeSplitData.length}</div>
                      <div style={{ fontSize: 10, color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>modes</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    {modeSplitData.map((item) => {
                      const meta = MODE_META[item.label] || { color: '#AAAAAA', icon: Car };
                      return <ProgressRow key={item.label} label={item.label} value={item.value} color={meta.color} icon={meta.icon} />;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* KPI list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Trips Logged', value: tripsCaptured.toLocaleString(), icon: Navigation, color: '#5BCAF5' },
                { label: 'Unique Citizens', value: activeCitizens.toLocaleString(), icon: Users, color: '#34D399' },
                { label: 'Districts Active', value: `${districtsCovered} / 14`, icon: Map, color: '#A78BFA' },
                { label: 'AI Accuracy', value: `${aiAccuracy}%`, icon: Zap, color: '#F5A623' },
                { label: 'CO₂ Tracking', value: 'Active', icon: Leaf, color: '#34D399' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#FAFAF8', borderRadius: 14, border: '1px solid #EBEBEB' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={17} color={item.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: '#888888', fontWeight: 500 }}>{item.label}</div>
                      <div style={{ fontSize: 19, fontWeight: 800, color: '#111111', letterSpacing: '-0.02em' }}>{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isCitizen && (
            <div style={{ marginTop: '1.5rem', border: '1.5px dashed #DDDDDD', borderRadius: 18, padding: '40px 20px', textAlign: 'center' }}>
              <Activity size={36} style={{ color: '#CCCCCC', marginBottom: 12 }} />
              <h3 style={{ color: '#555555', marginBottom: 8 }}>Deeper analysis awaits</h3>
              <p style={{ fontSize: 14, color: '#999999', marginBottom: 20 }}>Time-series trends, trip frequency heatmaps, and export tools live in the analytics module.</p>
              <Link to="/analytics" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 12, background: '#111111',
                color: '#F5F230', fontWeight: 700, fontSize: 14, textDecoration: 'none',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <BarChart3 size={16} /> Open Full Analytics
              </Link>
            </div>
          )}
        </>
      )}


      {/* ═══ MAP ═══ */}
      {activeTab === 'map' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #EBEBEB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="card-label" style={{ marginBottom: 0 }}>
              <Map size={12} /> {isCitizen ? 'My Trip Paths' : 'Kerala Trip Heatmap'}
            </div>
            <span style={{ fontSize: 12, color: '#888888' }}>
              {isCitizen ? `${recentTrips.length} recorded trips` : `${tripNodes.reduce((a, b) => a + b.trips, 0)} origin points`}
            </span>
          </div>
          <div style={{ height: 480, position: 'relative' }}>
            {isCitizen ? (
              recentTrips.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#AAAAAA', gap: 12 }}>
                  <Navigation size={40} style={{ opacity: 0.2 }} />
                  <p style={{ fontSize: 14 }}>No trips yet. Start tracking to see your paths here.</p>
                </div>
              ) : (
                <MapContainer
                  center={[
                    recentTrips[0]?.originCoordinates?.latitude || 10.5,
                    recentTrips[0]?.originCoordinates?.longitude || 76.5
                  ]}
                  zoom={11}
                  style={{ width: '100%', height: '100%' }}
                  zoomControl
                >
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />

                  {recentTrips.map((trip, i) => {
                    const mode  = trip.userValidatedMode || trip.aiPredictedMode || 'Car';
                    const meta  = MODE_META[mode] || MODE_META.Car;
                    const color = meta.color;
                    const isGPS = trip.tripPoints && trip.tripPoints.length > 1;
                    const hasOrigin = trip.originCoordinates?.latitude;
                    const hasDest   = trip.destinationCoordinates?.latitude;
                    const tripNum   = i + 1;

                    // Path: real GPS points > straight line fallback
                    const pathPoints = isGPS
                      ? trip.tripPoints.map(p => [p.latitude, p.longitude])
                      : (hasOrigin && hasDest
                          ? [
                              [trip.originCoordinates.latitude, trip.originCoordinates.longitude],
                              [trip.destinationCoordinates.latitude, trip.destinationCoordinates.longitude]
                            ]
                          : null);

                    return (
                      <React.Fragment key={trip._id || i}>

                        {/* Path line — solid = GPS tracked, dashed = simulated */}
                        {pathPoints && (
                          <Polyline
                            positions={pathPoints}
                            pathOptions={{
                              color,
                              weight: isGPS ? 4 : 3,
                              opacity: 0.9,
                              lineCap: 'round',
                              lineJoin: 'round',
                              dashArray: isGPS ? null : '8 6',
                            }}
                          />
                        )}

                        {/* Origin: large colored circle with white ring */}
                        {hasOrigin && (
                          <CircleMarker
                            center={[trip.originCoordinates.latitude, trip.originCoordinates.longitude]}
                            radius={10}
                            pathOptions={{ color: '#FFFFFF', fillColor: color, fillOpacity: 1, weight: 3 }}
                          >
                            <Popup>
                              <div style={{ fontFamily: 'inherit', minWidth: 180 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                                  <strong style={{ color: '#111', fontSize: 14 }}>Trip #{tripNum} · {mode}</strong>
                                </div>
                                <div style={{ fontSize: 13, color: '#333', marginBottom: 3 }}>🟢 Start: {trip.originCoordinates?.name || 'Origin'}</div>
                                <div style={{ fontSize: 13, color: '#333', marginBottom: 6 }}>🔴 End: {trip.destinationCoordinates?.name || 'Destination'}</div>
                                <div style={{ fontSize: 12, color: '#888', borderTop: '1px solid #EEE', paddingTop: 6 }}>
                                  {fmtDate(trip.tripRecordCreatedAt)} · {fmtDist(trip.totalDistance || 0)}
                                  {isGPS ? ' · 📍 GPS tracked' : ' · ↗ Simulated'}
                                </div>
                              </div>
                            </Popup>
                          </CircleMarker>
                        )}

                        {/* Destination: small dark circle */}
                        {hasDest && (
                          <CircleMarker
                            center={[trip.destinationCoordinates.latitude, trip.destinationCoordinates.longitude]}
                            radius={7}
                            pathOptions={{ color: '#FFFFFF', fillColor: '#111111', fillOpacity: 1, weight: 3 }}
                          >
                            <Popup>
                              <div style={{ fontFamily: 'inherit', minWidth: 160 }}>
                                <strong style={{ color: '#111' }}>Trip #{tripNum} — End</strong>
                                <div style={{ fontSize: 13, color: '#444', marginTop: 4 }}>{trip.destinationCoordinates?.name || 'Destination'}</div>
                              </div>
                            </Popup>
                          </CircleMarker>
                        )}

                      </React.Fragment>
                    );
                  })}
                </MapContainer>
              )
            ) : (
              // Scientist map — Kerala heatmap
              <MapContainer center={[10.5, 76.5]} zoom={7} style={{ width: '100%', height: '100%' }} zoomControl maxBounds={[[8.15, 74.85], [12.85, 77.45]]}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
                {tripNodes.map((node, i) => (
                  <CircleMarker key={i} center={[node.lat, node.lng]} radius={node.radius}
                    pathOptions={{ color: '#F5F230', fillColor: '#F5F230', fillOpacity: 0.55, weight: 1.5 }}>
                    <Popup>{node.city} — {node.trips.toLocaleString()} trips</Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            )}
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid #EBEBEB', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {isCitizen ? (
              <>
                {/* Dynamic per-mode legend — only shows modes that appear in actual trips */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                  {[...new Set(recentTrips.map(t => t.userValidatedMode || t.aiPredictedMode || 'Car'))]
                    .map(mode => {
                      const meta = MODE_META[mode] || { color: '#999', label: mode };
                      return (
                        <span key={mode} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#444444', fontWeight: 600 }}>
                          <span style={{ display: 'inline-block', width: 26, height: 4, borderRadius: 2, background: meta.color, opacity: 0.9 }} />
                          {meta.label}
                        </span>
                      );
                    })
                  }
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#888888' }}>
                    <span style={{ display: 'inline-block', width: 22, height: 3, background: '#555', borderRadius: 2, opacity: 0.4,
                      backgroundImage: 'repeating-linear-gradient(90deg, #555 0 6px, transparent 6px 12px)' }} />
                    Simulated route
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#BBBBBB' }}>Tap marker for trip details</span>
                </div>
              </>
            ) : (
              [{ label: 'High density', color: '#F5F230' }, { label: 'Medium', color: '#F5A62380' }, { label: 'Low', color: '#CCCCCC' }].map(l => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666666' }}>
                  <span style={{ width: 10, height: 10, background: l.color, borderRadius: '50%', display: 'inline-block' }} />{l.label}
                </span>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ScientistDashboard;
