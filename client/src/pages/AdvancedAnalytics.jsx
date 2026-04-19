import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Clock, Route, Gauge, TrendingUp, Target, PieChart } from 'lucide-react';

const AdvancedAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdvancedData();
  }, []);

  const fetchAdvancedData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/export/advanced`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('natpac_token')}`
        }
      });
      setAnalyticsData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch advanced analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-pulse" style={{ color: '#666666' }}>Crunching numbers...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="page">
        <div className="card empty-state">
          <BarChart3 size={36} style={{ color: '#888888' }} />
          <h3>No data available</h3>
          <p>Trip data is needed before analytics can be generated.</p>
        </div>
      </div>
    );
  }

  const { validationSummary, purposeBreakdown, hourlyDistribution, averageMetrics, dailyTrends, insights } = analyticsData;
  const peakHour = hourlyDistribution.reduce((max, curr) => curr.trips > max.trips ? curr : max, { hour: 0, trips: 0 });
  const maxHourlyTrips = Math.max(...hourlyDistribution.map(h => h.trips), 1);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Advanced Analytics</h1>
          <p className="page-subtitle">Deep insights from all collected travel data</p>
        </div>
      </div>

      {/* Insights Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(245, 242, 48, 0.08)', border: '1px solid #F5F230' }}>
        <div className="card-label" style={{ color: '#111111' }}><Target size={13} /> Smart Insights Generated</div>
        <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', margin: '0.75rem 0', color: '#111111', fontSize: '15px', lineHeight: '1.65' }}>
          {insights && insights.map((insight, idx) => (
            <li key={idx} style={{ marginBottom: '0.5rem' }}>{insight}</li>
          ))}
        </ul>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-label"><Route size={13} /> Avg Distance</div>
          <div className="stat-value">{averageMetrics.averageDistanceKm}</div>
          <div style={{ fontSize: '12px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>km per trip</div>
        </div>
        <div className="card">
          <div className="card-label"><Gauge size={13} /> Avg Speed</div>
          <div className="stat-value">{averageMetrics.averageSpeedKmh}</div>
          <div style={{ fontSize: '12px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>km/h average</div>
        </div>
        <div className="card">
          <div className="card-label"><Clock size={13} /> Avg Duration</div>
          <div className="stat-value">{averageMetrics.averageDurationMinutes}</div>
          <div style={{ fontSize: '12px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>minutes per trip</div>
        </div>
        <div className="card">
          <div className="card-label"><Target size={13} /> Validation Rate</div>
          <div className="stat-value">{validationSummary.validationRate}%</div>
          <div style={{ fontSize: '12px', color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{validationSummary.validated} of {validationSummary.total}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Hourly Distribution */}
        <div className="card">
          <div className="card-label" style={{ marginBottom: '1.25rem' }}>
            <Clock size={13} /> Hourly Trip Distribution (24h)
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '140px' }}>
            {hourlyDistribution.map((hourData) => (
              <div
                key={hourData.hour}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: `${maxHourlyTrips > 0 ? (hourData.trips / maxHourlyTrips) * 100 : 0}%`,
                    minHeight: hourData.trips > 0 ? '4px' : '1px',
                    background: hourData.hour === peakHour.hour ? '#F5F230' : '#F2F2F2',
                    borderRadius: '2px 2px 0 0',
                    transition: 'height 0.4s ease'
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '11px', color: '#888888' }}>
            <span>12am</span>
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>11pm</span>
          </div>
          <div style={{ fontSize: '13px', color: '#666666', marginTop: '0.75rem' }}>
            Peak hour: <strong style={{ color: '#111111' }}>{peakHour.hour}:00</strong> ({peakHour.trips} trips)
          </div>
        </div>

        {/* Purpose Breakdown */}
        <div className="card">
          <div className="card-label" style={{ marginBottom: '1.25rem' }}>
            <PieChart size={13} /> Trip Purpose Breakdown
          </div>
          {purposeBreakdown.length === 0 ? (
            <div style={{ color: '#666666', fontSize: '15px' }}>No validated purposes yet.</div>
          ) : (
            <div>
              {purposeBreakdown.map((purpose) => {
                const maxCount = purposeBreakdown[0]?.count || 1;
                return (
                  <div className="progress-row" key={purpose.label}>
                    <div className="progress-label">
                      <span>{purpose.label}</span>
                      <span style={{ color: '#111111', fontWeight: 700 }}>{purpose.count}</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${(purpose.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Daily Trends */}
      <div className="card">
        <div className="card-label" style={{ marginBottom: '1rem' }}>
          <TrendingUp size={13} /> Daily Trip Volume (Last 30 Days)
        </div>
        {dailyTrends.length === 0 ? (
          <div style={{ color: '#666666', fontSize: '15px' }}>No daily trend data yet.</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
            {dailyTrends.map((day) => {
              const maxDailyTrips = Math.max(...dailyTrends.map(d => d.trips), 1);
              return (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.trips} trips`}
                  style={{
                    flex: 1,
                    height: `${(day.trips / maxDailyTrips) * 100}%`,
                    minHeight: '3px',
                    background: '#F5F230',
                    borderRadius: '2px 2px 0 0',
                    opacity: 0.85
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
