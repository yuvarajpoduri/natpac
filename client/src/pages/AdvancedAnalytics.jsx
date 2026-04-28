import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart3, Clock, Route, Gauge, TrendingUp, Target, PieChart, 
  Leaf, Activity, Zap, ShieldCheck, AlertTriangle, MapPin, 
  Calendar, Layers, Monitor, Info, ArrowUpRight, ArrowDownRight,
  UserCheck, Globe, FlaskConical, Users, X, ChevronRight, ChevronLeft
} from 'lucide-react';

const MODE_COLORS = {
  Car: "#3B82F6",
  "Auto-Rickshaw": "#F59E0B",
  Bus: "#10B981",
  Cycling: "#8B5CF6",
  Walking: "#EC4899",
  Train: "#EF4444",
  Ferry: "#06B6D4",
};

const AdvancedAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1)); // April 2026

  useEffect(() => {
    fetchAdvancedData();
  }, []);

  const fetchAdvancedData = async () => {
    try {
      setError(null);
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/export/advanced`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('natpac_token')}` }
      });
      if (response.data && response.data.data) {
        setAnalyticsData(response.data.data);
      } else {
        throw new Error("Invalid data format from server");
      }
    } catch (error) {
      console.error('Failed to fetch advanced analytics:', error);
      setError("Failed to load analytics. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="loading-pulse">Crunching database metrics...</div></div>;
  if (error) return <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><div className="card" style={{ textAlign: 'center' }}><h3 style={{ color: '#C53030' }}>Analytics Error</h3><p>{error}</p><button className="btn-primary" onClick={fetchAdvancedData}>Retry</button></div></div>;

  const data = analyticsData;
  const { recentTrips = [], hourlyDistribution = [], averageMetrics = {}, carbonSavings = [], districtCoverage = [], insights = [] } = data;

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const tripsByDate = recentTrips.reduce((acc, trip) => {
    const d = new Date(trip.recordedAt).toDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(trip);
    return acc;
  }, {});

  const selectedTrips = selectedDate ? tripsByDate[selectedDate.toDateString()] || [] : [];

  const maxHourlyTrips = Math.max(...hourlyDistribution.map(h => h.trips), 1);
  const peakHour = hourlyDistribution.reduce((max, curr) => curr.trips > max.trips ? curr : max, { hour: 0, trips: 0 });

  return (
    <div className="page" style={{ background: '#FAFAF8', minHeight: '100vh' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ background: '#F5F230', padding: 8, borderRadius: 10 }}><FlaskConical size={18} color="#111" /></div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Scientist Hub</span>
          </div>
          <h1 className="page-title" style={{ fontSize: 32 }}>Scientist Analysis</h1>
          <p className="page-subtitle">Historical mobility patterns from February to April 2026.</p>
        </div>
      </div>

      {/* ── INSIGHTS ── */}
      <div className="card" style={{ marginBottom: '2rem', background: '#111', color: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {insights.map((insight, idx) => (
            <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '13px', display: 'flex', gap: 12 }}>
              <Zap size={14} color="#F5F230" /> {insight}
            </div>
          ))}
        </div>
      </div>

      {/* ── TOP LEVEL KPIS ── */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-label"><Route size={13} /> Avg Trip Distance</div>
          <div className="stat-value" style={{ fontSize: 32 }}>{averageMetrics.averageDistanceKm || 0} <span style={{ fontSize: 14 }}>km</span></div>
        </div>
        <div className="card">
          <div className="card-label"><Gauge size={13} /> Network Velocity</div>
          <div className="stat-value" style={{ fontSize: 32 }}>{averageMetrics.averageSpeedKmh || 0} <span style={{ fontSize: 14 }}>km/h</span></div>
        </div>
        <div className="card">
          <div className="card-label"><Clock size={13} /> Peak Mobility Time</div>
          <div className="stat-value" style={{ fontSize: 32, color: '#111' }}>{data.peakHour || "N/A"}</div>
        </div>
        <div className="card" style={{ background: '#ecfdf5', border: '1px solid #34d399' }}>
          <div className="card-label" style={{ color: '#065f46' }}><Leaf size={13} /> Carbon Offset</div>
          <div className="stat-value" style={{ fontSize: 32, color: '#065f46' }}>{(carbonSavings.reduce((a, b) => a + (b.saved || 0), 0) / 1000).toFixed(1)} <span style={{ fontSize: 14 }}>kg</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
        <div className="flex-column gap-8">
          {/* ── CALENDAR HEATMAP ── */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div className="card-label"><Calendar size={13} /> Mobility Heatmap (Feb - Apr 2026)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button className="icon-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
                <span style={{ fontWeight: 800, fontSize: 14 }}>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                <button className="icon-btn" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>{d}</div>
              ))}
              {Array(days[0].getDay()).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
              {days.map(date => {
                const dayTrips = tripsByDate[date.toDateString()] || [];
                const intensity = Math.min(dayTrips.length / 5, 1); // Max intensity at 5 trips
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                
                return (
                  <div 
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    style={{ 
                      aspectRatio: '1/1',
                      borderRadius: '8px',
                      background: dayTrips.length > 0 ? `rgba(245, 242, 48, ${0.1 + intensity * 0.9})` : '#f1f5f9',
                      border: isSelected ? '2px solid #111' : '1.5px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: dayTrips.length > 0 ? 800 : 500,
                      position: 'relative',
                      transition: 'all 0.2s'
                    }}
                  >
                    {date.getDate()}
                    {dayTrips.length > 0 && <div style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: '50%', background: '#111' }} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── HOURLY DISTRIBUTION ── */}
          <div className="card">
            <div className="card-label"><Clock size={13} /> Aggregate Temporal Density</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px', marginTop: 20 }}>
              {hourlyDistribution.map((h) => (
                <div key={h.hour} style={{ 
                  flex: 1, height: `${(h.trips / maxHourlyTrips) * 100}%`, 
                  background: h.hour === peakHour.hour ? '#F5F230' : '#EBEBEB',
                  borderRadius: '2px 2px 0 0'
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: '#888' }}>
              <span>12AM</span><span>8AM</span><span>4PM</span><span>11PM</span>
            </div>
          </div>
        </div>

        {/* ── SIDE PANEL DRILLDOWN ── */}
        <div className="card" style={{ background: '#fff', border: '1px solid #eee' }}>
          {selectedDate ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{selectedDate.toLocaleDateString([], { day: 'numeric', month: 'short' })} Logs</h3>
                  <span style={{ fontSize: 12, color: '#666' }}>{selectedTrips.length} Trips Recorded</span>
                </div>
                <button className="icon-btn" onClick={() => setSelectedDate(null)}><X size={16} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedTrips.map(trip => (
                  <div key={trip.tripId} style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '12px', background: '#FAFAF8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ 
                        fontSize: 10, 
                        fontWeight: 800, 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        background: `${MODE_COLORS[trip.userValidatedMode || trip.aiPredictedMode]}15`,
                        color: MODE_COLORS[trip.userValidatedMode || trip.aiPredictedMode]
                      }}>
                        {trip.userValidatedMode || trip.aiPredictedMode}
                      </span>
                      <span style={{ fontSize: 11, color: '#999' }}>{new Date(trip.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#111' }}>{trip.userName}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>{trip.origin.name} → {trip.destination.name}</div>
                  </div>
                ))}
                {selectedTrips.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}><Info size={24} style={{ marginBottom: 12 }} /><p>No logs for this date.</p></div>}
              </div>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#999', padding: '20px' }}>
              <Calendar size={48} style={{ marginBottom: 20, opacity: 0.2 }} />
              <h3>Select a Date</h3>
              <p style={{ fontSize: 13 }}>Click on a highlighted day in the heatmap to view specific trip logs and citizen data.</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem', marginBottom: '4rem' }}>
        <div className="card">
          <div className="card-label"><Leaf size={13} /> Sustainable Offset</div>
          <div style={{ marginTop: 20 }}>
            {carbonSavings.map(s => (
              <div key={s.mode} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                  <span>{s.mode}</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>+{s.saved}g CO₂</span>
                </div>
                <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(s.saved / s.total) * 100}%`, height: '100%', background: '#34D399' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="card">
          <div className="card-label"><MapPin size={13} /> Regional Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 15 }}>
            {districtCoverage.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', background: '#FAFAF8', borderRadius: 10 }}>
                <div style={{ width: 35, fontWeight: 800, fontSize: 11 }}>{d.pct}%</div>
                <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>{d.name}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{d.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
