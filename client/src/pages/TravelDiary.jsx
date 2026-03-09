import { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigation, Clock, MapPin, CheckCircle, ChevronRight, X, Cpu } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polyline } from 'react-leaflet';

const tripPurposes = ['Work', 'Education', 'Shopping', 'Social / Recreation', 'Medical', 'Return Home'];
const travelModes  = ['Walking', 'Cycling', 'Car', 'Bus', 'Auto-Rickshaw', 'Train', 'Ferry'];

const TravelDiary = () => {
  const [tripHistory, setTripHistory] = useState([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [validatedMode, setValidatedMode] = useState('');
  const [tripPurpose, setTripPurpose] = useState('Work');
  const [isValidationSubmitting, setIsValidationSubmitting] = useState(false);

  useEffect(() => {
    fetchUserTripHistory();
  }, []);

  const fetchUserTripHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/trips/history');
      setTripHistory(response.data);
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
    setIsValidationSubmitting(true);
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/trips/${selectedTrip._id}/validate`,
        { userValidatedMode: validatedMode, tripPurpose }
      );
      setTripHistory((prev) =>
        prev.map((trip) => (trip._id === selectedTrip._id ? response.data : trip))
      );
      setSelectedTrip(null);
    } catch {
      console.error('Validation failed');
    } finally {
      setIsValidationSubmitting(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  const hasMapData = (trip) =>
    trip.originCoordinates?.latitude && trip.destinationCoordinates?.latitude;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Travel Diary</h1>
          <p className="page-subtitle">Review and validate your recorded trips.</p>
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
            <Navigation size={36} style={{ color: 'var(--text-muted)' }} />
            <h3>No trips recorded yet</h3>
            <p>Use the Trip Simulator to create test trips, or trips will appear automatically as you move across Kerala.</p>
          </div>
        </div>
      ) : (
        <div className="stack">
          {tripHistory.map((trip) => (
            <div
              key={trip._id}
              className="trip-card"
              onClick={() => openValidationModal(trip)}
            >
              <div className={`trip-icon${trip.isTripValidated ? ' validated' : ''}`}>
                <Navigation size={18} />
              </div>

              <div className="trip-info">
                <div className="trip-title">
                  {trip.isTripValidated ? trip.userValidatedMode : trip.aiPredictedMode} Journey
                  {trip.isTripValidated && (
                    <span className="badge badge-success" style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}>
                      <CheckCircle size={10} /> Validated
                    </span>
                  )}
                </div>
                <div className="trip-meta">
                  <span className="trip-meta-item">
                    <Clock size={12} />{formatTime(trip.originCoordinates?.timestamp)}
                  </span>
                  <span className="trip-meta-item">
                    <MapPin size={12} />{(trip.totalDistance / 1000).toFixed(1)} km
                  </span>
                  {trip.isTripValidated && (
                    <span className="badge badge-brand">{trip.tripPurpose}</span>
                  )}
                  {!trip.isTripValidated && (
                    <span className="badge badge-warning">Needs Validation</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatDate(trip.tripRecordCreatedAt)}
                  </span>
                </div>
              </div>

              <div className="icon-btn">
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTrip && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Validate Trip</span>
              <button className="modal-close" onClick={() => setSelectedTrip(null)}>
                <X size={20} />
              </button>
            </div>

            {selectedTrip.aiPredictedMode && (
              <div className="modal-ai-hint">
                <Cpu size={14} />
                AI predicted: <strong style={{ marginLeft: '0.25rem' }}>{selectedTrip.aiPredictedMode}</strong>
              </div>
            )}

            {hasMapData(selectedTrip) && (
              <div className="map-block" style={{ height: '180px', marginBottom: '1.25rem' }}>
                <MapContainer
                  bounds={[
                    [selectedTrip.originCoordinates.latitude, selectedTrip.originCoordinates.longitude],
                    [selectedTrip.destinationCoordinates.latitude, selectedTrip.destinationCoordinates.longitude],
                  ]}
                  style={{ width: '100%', height: '100%' }}
                  zoomControl={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO'
                  />
                  <CircleMarker
                    center={[selectedTrip.originCoordinates.latitude, selectedTrip.originCoordinates.longitude]}
                    radius={6}
                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.9 }}
                  />
                  <CircleMarker
                    center={[selectedTrip.destinationCoordinates.latitude, selectedTrip.destinationCoordinates.longitude]}
                    radius={6}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.9 }}
                  />
                  <Polyline
                    positions={[
                      [selectedTrip.originCoordinates.latitude, selectedTrip.originCoordinates.longitude],
                      [selectedTrip.destinationCoordinates.latitude, selectedTrip.destinationCoordinates.longitude],
                    ]}
                    pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '6 10' }}
                  />
                </MapContainer>
              </div>
            )}

            <form onSubmit={handleValidateSubmission}>
              <div className="field">
                <label>Travel Mode</label>
                <select value={validatedMode} onChange={(e) => setValidatedMode(e.target.value)} required>
                  {travelModes.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Trip Purpose</label>
                <select value={tripPurpose} onChange={(e) => setTripPurpose(e.target.value)} required>
                  {tripPurposes.map((purpose) => (
                    <option key={purpose} value={purpose}>{purpose}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-primary" disabled={isValidationSubmitting}>
                {isValidationSubmitting ? 'Saving...' : 'Confirm & Validate'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelDiary;
