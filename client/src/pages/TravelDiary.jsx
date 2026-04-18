import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Navigation, Clock, MapPin, CheckCircle, ChevronRight, X, Cpu, Leaf, Tag, Play
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polyline } from 'react-leaflet';
import TripReplayMap from './TripReplayMap';

const tripPurposes = ['Work', 'Education', 'Shopping', 'Social / Recreation', 'Medical', 'Return Home'];
const travelModes  = ['Walking', 'Cycling', 'Car', 'Bus', 'Auto-Rickshaw', 'Train', 'Ferry'];

// Feature 6: static emission factors (g CO₂ / km)
const EMISSION_FACTORS = {
  Car: 120, 'Auto-Rickshaw': 90, Bus: 80, Train: 45,
  Cycling: 0, Walking: 0, Ferry: 110
};
const carbonLabel = (mode, distMetres) => {
  if (!distMetres || !mode) return null;
  const factor = EMISSION_FACTORS[mode] ?? 120;
  const grams = Math.round((distMetres / 1000) * factor);
  if (grams === 0) return '0g CO₂ 🌱';
  return `${grams}g CO₂`;
};

// Feature 9: available issue tags
const ISSUE_TAGS = ['Traffic', 'Bad Road', 'Delay'];
const TAG_COLORS  = { Traffic: '#FEF3C7', 'Bad Road': '#FEE2E2', Delay: '#EDE9FE' };
const TAG_TEXT    = { Traffic: '#92400E', 'Bad Road': '#991B1B', Delay: '#4C1D95' };

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('natpac_token')}` });

const TravelDiary = () => {
  const [tripHistory, setTripHistory]             = useState([]);
  const [isLoadingTrips, setIsLoadingTrips]       = useState(true);
  const [selectedTrip, setSelectedTrip]           = useState(null);
  const [validatedMode, setValidatedMode]         = useState('');
  const [tripPurpose, setTripPurpose]             = useState('Work');
  const [isValidating, setIsValidating]           = useState(false);

  // Feature 4: replay
  const [replayTrip, setReplayTrip]               = useState(null);

  // Feature 9: tag editing
  const [taggingTrip, setTaggingTrip]             = useState(null);
  const [selectedTags, setSelectedTags]           = useState([]);
  const [isSavingTags, setIsSavingTags]           = useState(false);

  useEffect(() => { fetchUserTripHistory(); }, []);

  const fetchUserTripHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/trips/history`, { headers: authHeader() });
      setTripHistory(res.data.data);
    } catch {
      console.error('Failed to fetch trip history');
    } finally {
      setIsLoadingTrips(false);
    }
  };

  const openValidationModal = (trip) => {
    setSelectedTrip(trip);
    setValidatedMode(trip.userValidatedMode || trip.aiPredictedMode || 'Car');
    setTripPurpose(trip.tripPurpose || 'Work');
  };

  const handleValidateSubmission = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    try {
      const res = await axios.patch(
        `${API}/api/trips/${selectedTrip._id}/validate`,
        { userValidatedMode: validatedMode, tripPurpose },
        { headers: authHeader() }
      );
      setTripHistory((prev) =>
        prev.map((t) => (t._id === selectedTrip._id ? res.data.data : t))
      );
      setSelectedTrip(null);
    } catch {
      console.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  // Feature 9: save tags
  const handleSaveTags = async () => {
    setIsSavingTags(true);
    try {
      const res = await axios.patch(
        `${API}/api/trips/${taggingTrip._id}/tags`,
        { tags: selectedTags },
        { headers: authHeader() }
      );
      setTripHistory((prev) =>
        prev.map((t) => (t._id === taggingTrip._id ? res.data.data : t))
      );
      setTaggingTrip(null);
    } catch {
      console.error('Tag save failed');
    } finally {
      setIsSavingTags(false);
    }
  };

  const toggleTag = (tag) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const openTagModal = (trip, e) => {
    e.stopPropagation();
    setTaggingTrip(trip);
    setSelectedTags(trip.issueTags || []);
  };

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
  const formatDate = (d) => d ? new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '—';
  const hasMap = (trip) => trip.originCoordinates?.latitude && trip.destinationCoordinates?.latitude;
  const hasReplayData = (trip) =>
    (trip.tripPoints?.length >= 2) || hasMap(trip);

  // If replay mode is active, show replay only
  if (replayTrip) {
    return (
      <div className="page" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
        <div className="page-header" style={{ flexShrink: 0 }}>
          <div>
            <h1 className="page-title">Trip Replay</h1>
            <p className="page-subtitle">
              {replayTrip.originCoordinates?.name} → {replayTrip.destinationCoordinates?.name}
            </p>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <TripReplayMap trip={replayTrip} onClose={() => setReplayTrip(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Travel Diary</h1>
          <p className="page-subtitle">Review, validate, and tag your recorded trips.</p>
        </div>
      </div>

      {isLoadingTrips ? (
        <div className="empty-state loading-pulse">
          <Navigation size={36} />
          <p>Loading your journeys...</p>
        </div>
      ) : tripHistory.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Navigation size={36} style={{ color: '#888888' }} />
            <h3>No trips recorded yet</h3>
            <p>Use the Trip Simulator to create test trips, or trips will appear automatically as you move.</p>
          </div>
        </div>
      ) : (
        <div className="stack">
          {tripHistory.map((trip) => {
            const displayMode = trip.isTripValidated ? trip.userValidatedMode : trip.aiPredictedMode;
            const co2 = carbonLabel(displayMode, trip.totalDistance);

            return (
              <div key={trip._id} className="trip-card" onClick={() => openValidationModal(trip)}>
                <div className={`trip-icon${trip.isTripValidated ? ' validated' : ''}`}>
                  <Navigation size={18} />
                </div>

                <div className="trip-info">
                  <div className="trip-title">
                    {displayMode} Journey
                    {trip.isTripValidated && (
                      <span className="badge badge-success" style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}>
                        <CheckCircle size={10} /> Validated
                      </span>
                    )}
                    {/* Feature 1: confidence badge */}
                    {trip.aiConfidenceScore != null && !trip.isTripValidated && (
                      <span className="badge badge-info" style={{ marginLeft: '0.5rem', verticalAlign: 'middle', fontSize: 10 }}>
                        <Cpu size={9} /> {trip.aiConfidenceScore}%
                      </span>
                    )}
                  </div>

                  <div className="trip-meta">
                    <span className="trip-meta-item">
                      <Clock size={12} />{formatTime(trip.originCoordinates?.timestamp)}
                    </span>
                    <span className="trip-meta-item">
                      <MapPin size={12} />{((trip.totalDistance || 0) / 1000).toFixed(1)} km
                    </span>

                    {/* Feature 6: carbon per trip */}
                    {co2 && (
                      <span className="trip-meta-item" style={{ color: '#16A34A' }}>
                        <Leaf size={12} />{co2}
                      </span>
                    )}

                    {trip.originCoordinates?.name && (
                      <span className="trip-meta-item" style={{ flex: '1 1 100%', marginTop: '0.25rem', color: '#666' }}>
                        <MapPin size={12} style={{ opacity: 0 }} />
                        {trip.originCoordinates.name} → {trip.destinationCoordinates?.name}
                      </span>
                    )}

                    {trip.isTripValidated && (
                      <span className="badge badge-brand">{trip.tripPurpose}</span>
                    )}
                    {!trip.isTripValidated && (
                      <span className="badge badge-info">Needs Validation</span>
                    )}

                    {/* Feature 9: Issue tags display */}
                    {trip.issueTags?.map((tag) => (
                      <span
                        key={tag}
                        className="badge"
                        style={{ background: TAG_COLORS[tag], color: TAG_TEXT[tag], fontSize: 10 }}
                      >
                        {tag}
                      </span>
                    ))}

                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>
                      {formatDate(trip.tripRecordCreatedAt)}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'center' }}>
                  {/* Feature 9: Tag button */}
                  <button
                    onClick={(e) => openTagModal(trip, e)}
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: '#f5f5f5', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Add issue tags"
                  >
                    <Tag size={13} color="#888" />
                  </button>

                  {/* Feature 4: Replay button */}
                  {hasReplayData(trip) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setReplayTrip(trip); }}
                      style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: '#f5f5f5', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      title="Replay trip"
                    >
                      <Play size={13} color="#888" />
                    </button>
                  )}

                  <div className="icon-btn">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Validation Modal ── */}
      {selectedTrip && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Validate Trip</span>
              <button className="modal-close" onClick={() => setSelectedTrip(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Feature 1: AI prediction + confidence */}
            {selectedTrip.aiPredictedMode && (
              <div className="modal-ai-hint">
                <Cpu size={14} />
                AI predicted: <strong style={{ marginLeft: '0.25rem' }}>{selectedTrip.aiPredictedMode}</strong>
                {selectedTrip.aiConfidenceScore != null && (
                  <span style={{ marginLeft: '0.4rem', fontSize: 12, color: '#888' }}>
                    ({selectedTrip.aiConfidenceScore}% confidence)
                  </span>
                )}
              </div>
            )}

            {/* Feature 6: carbon display in modal */}
            {selectedTrip.carbonEmissionGrams != null && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem',
                  background: '#f0fdf4', borderRadius: 8, marginBottom: '0.75rem', fontSize: 13, color: '#16A34A'
                }}
              >
                <Leaf size={14} />
                Carbon footprint: <strong style={{ marginLeft: 4 }}>{selectedTrip.carbonEmissionGrams}g CO₂</strong>
                &nbsp;· {((selectedTrip.totalDistance || 0) / 1000).toFixed(1)} km
              </div>
            )}

            {hasMap(selectedTrip) && (
              <div className="map-block" style={{ height: '180px', marginBottom: '1.25rem' }}>
                <MapContainer
                  bounds={[
                    [selectedTrip.originCoordinates.latitude, selectedTrip.originCoordinates.longitude],
                    [selectedTrip.destinationCoordinates.latitude, selectedTrip.destinationCoordinates.longitude]
                  ]}
                  style={{ width: '100%', height: '100%' }}
                  zoomControl={true}
                  scrollWheelZoom={true}
                  maxBounds={[[8.15, 74.85], [12.85, 77.45]]}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution="© CARTO"
                  />
                  <CircleMarker
                    center={[selectedTrip.originCoordinates.latitude, selectedTrip.originCoordinates.longitude]}
                    radius={6}
                    pathOptions={{ color: '#F5F230', fillColor: '#F5F230', fillOpacity: 0.9 }}
                  />
                  <CircleMarker
                    center={[selectedTrip.destinationCoordinates.latitude, selectedTrip.destinationCoordinates.longitude]}
                    radius={6}
                    pathOptions={{ color: '#5BCAF5', fillColor: '#5BCAF5', fillOpacity: 0.9 }}
                  />
                  <Polyline
                    positions={[
                      [selectedTrip.originCoordinates.latitude, selectedTrip.originCoordinates.longitude],
                      [selectedTrip.destinationCoordinates.latitude, selectedTrip.destinationCoordinates.longitude]
                    ]}
                    pathOptions={{ color: '#111111', weight: 2, dashArray: '6 10' }}
                  />
                </MapContainer>
              </div>
            )}

            <form onSubmit={handleValidateSubmission}>
              <div className="field">
                <label>Travel Mode</label>
                <select value={validatedMode} onChange={(e) => setValidatedMode(e.target.value)} required>
                  {travelModes.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="field">
                <label>Trip Purpose</label>
                <select value={tripPurpose} onChange={(e) => setTripPurpose(e.target.value)} required>
                  {tripPurposes.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={isValidating}>
                {isValidating ? 'Saving...' : 'Confirm & Validate'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Feature 9: Issue Tag Modal ── */}
      {taggingTrip && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Tag Issues</span>
              <button className="modal-close" onClick={() => setTaggingTrip(null)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#666', marginBottom: '1rem' }}>
              Select any issues experienced during this trip:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {ISSUE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '0.7rem 1rem',
                    borderRadius: 10,
                    border: `2px solid ${selectedTags.includes(tag) ? '#111' : '#ddd'}`,
                    background: selectedTags.includes(tag) ? '#111' : '#fff',
                    color: selectedTags.includes(tag) ? '#fff' : '#333',
                    cursor: 'pointer',
                    fontWeight: selectedTags.includes(tag) ? 600 : 400,
                    fontSize: 14,
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Tag size={14} />
                  {tag}
                  {selectedTags.includes(tag) && (
                    <span style={{ marginLeft: 'auto', fontSize: 12 }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveTags}
              disabled={isSavingTags}
            >
              {isSavingTags ? 'Saving...' : 'Save Tags'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelDiary;
