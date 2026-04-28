import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Navigation,
  Clock,
  MapPin,
  CheckCircle,
  ChevronRight,
  X,
  Cpu,
  Leaf,
  Tag,
  Play,
  Car,
  Bus,
  Bike,
  Activity,
  Train,
  Ship,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Polyline } from "react-leaflet";
import TripReplayMap from "./TripReplayMap";

const MODE_COLORS = {
  Car: "#3B82F6", // Blue
  "Auto-Rickshaw": "#F59E0B", // Amber
  Bus: "#10B981", // Emerald
  Cycling: "#8B5CF6", // Violet
  Walking: "#EC4899", // Pink
  Train: "#EF4444", // Red
  Ferry: "#06B6D4", // Cyan
};

const getModeIcon = (mode) => {
  const color = MODE_COLORS[mode] || "#64748B";
  switch (mode) {
    case "Car":
      return { Icon: Car, color };
    case "Auto-Rickshaw":
      return { Icon: Car, color };
    case "Bus":
      return { Icon: Bus, color };
    case "Cycling":
      return { Icon: Bike, color };
    case "Walking":
      return { Icon: Activity, color };
    case "Train":
      return { Icon: Train, color };
    case "Ferry":
      return { Icon: Ship, color };
    default:
      return { Icon: Navigation, color };
  }
};

const tripPurposes = [
  "Work",
  "Education",
  "Shopping",
  "Social / Recreation",
  "Medical",
  "Return Home",
];
const travelModes = [
  "Walking",
  "Cycling",
  "Car",
  "Bus",
  "Auto-Rickshaw",
  "Train",
  "Ferry",
];

const EMISSION_FACTORS = {
  Car: 120,
  "Auto-Rickshaw": 90,
  Bus: 80,
  Train: 45,
  Cycling: 0,
  Walking: 0,
  Ferry: 110,
};

const carbonLabel = (mode, distMetres) => {
  if (!distMetres || !mode) return null;
  const factor = EMISSION_FACTORS[mode] ?? 120;
  const grams = Math.round((distMetres / 1000) * factor);
  return grams === 0 ? "0g CO₂" : `${grams}g CO₂`;
};

const ISSUE_TAGS = ["Traffic", "Bad Road", "Delay"];
const TAG_COLORS = {
  Traffic: "#FEF3C7",
  "Bad Road": "#FEE2E2",
  Delay: "#EDE9FE",
};
const TAG_TEXT = {
  Traffic: "#92400E",
  "Bad Road": "#991B1B",
  Delay: "#4C1D95",
};

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("natpac_token")}`,
});

const TravelDiary = () => {
  const [tripHistory, setTripHistory] = useState([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [validatedMode, setValidatedMode] = useState("");
  const [tripPurpose, setTripPurpose] = useState("Work");
  const [isValidating, setIsValidating] = useState(false);
  const [replayTrip, setReplayTrip] = useState(null);
  const [taggingTrip, setTaggingTrip] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSavingTags, setIsSavingTags] = useState(false);

  useEffect(() => {
    fetchUserTripHistory();
  }, []);

  const fetchUserTripHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/trips/history`, {
        headers: authHeader(),
      });
      setTripHistory(res.data.data);
    } catch {
      console.error("Failed to fetch trip history");
    } finally {
      setIsLoadingTrips(false);
    }
  };

  const openValidationModal = (trip) => {
    setSelectedTrip(trip);
    setValidatedMode(trip.userValidatedMode || trip.aiPredictedMode || "Car");
    let initialPurpose = trip.tripPurpose || trip.predictedPurpose || "Work";
    if (!tripPurposes.includes(initialPurpose)) initialPurpose = "Work";
    setTripPurpose(initialPurpose);
  };

  const handleValidateSubmission = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    try {
      console.log("Submitting validation for:", selectedTrip._id);
      console.log("Payload:", { userValidatedMode: validatedMode, tripPurpose });
      
      const res = await axios.patch(
        `${API}/api/trips/${selectedTrip._id}/validate`,
        { userValidatedMode: validatedMode, tripPurpose },
        { headers: authHeader() },
      );
      
      console.log("Validation response:", res.data);

      if (res.data.status === 'success') {
        const updatedTrip = res.data.data;
        setTripHistory((prev) =>
          prev.map((t) => (t._id === selectedTrip._id ? updatedTrip : t)),
        );
        setSelectedTrip(null);
        alert("Trip validated successfully!");
      }
    } catch (err) {
      console.error("Validation failed error details:", err.response?.data || err.message);
      alert(`Failed to validate: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveTags = async () => {
    setIsSavingTags(true);
    try {
      const res = await axios.patch(
        `${API}/api/trips/${taggingTrip._id}/tags`,
        { tags: selectedTags },
        { headers: authHeader() },
      );
      setTripHistory((prev) =>
        prev.map((t) => (t._id === taggingTrip._id ? res.data.data : t)),
      );
      setTaggingTrip(null);
    } catch {
      console.error("Tag save failed");
    } finally {
      setIsSavingTags(false);
    }
  };

  const toggleTag = (tag) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );

  const openTagModal = (trip, e) => {
    e.stopPropagation();
    setTaggingTrip(trip);
    setSelectedTags(trip.issueTags || []);
  };

  const formatTime = (d) =>
    d
      ? new Date(d).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString([], { day: "numeric", month: "short" })
      : "—";
  const hasMap = (trip) =>
    trip?.originCoordinates?.latitude && trip?.destinationCoordinates?.latitude;

  if (replayTrip) {
    return (
      <div
        className="page"
        style={{
          height: "calc(100vh - 120px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="page-header"
          style={{ marginBottom: 0, paddingBottom: "1rem" }}
        >
          <div>
            <h1 className="page-title">Trip Replay</h1>
            <p className="page-subtitle">
              {replayTrip.originCoordinates?.name} →{" "}
              {replayTrip.destinationCoordinates?.name}
            </p>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <TripReplayMap
            trip={replayTrip}
            onClose={() => setReplayTrip(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Travel Diary</h1>
          <p className="page-subtitle">
            Review, validate, and tag your recorded trips.
          </p>
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
            <Navigation size={36} style={{ color: "#888" }} />
            <h3>No trips recorded yet</h3>
            <p>Use the Trip Simulator to create test trips.</p>
          </div>
        </div>
      ) : (
        <div className="trip-grid">
          {tripHistory.map((trip) => {
            const displayMode = trip.isTripValidated
              ? trip.userValidatedMode
              : trip.aiPredictedMode;
            const co2 = carbonLabel(displayMode, trip.totalDistance);

            return (
              <div
                key={trip._id}
                className="trip-card"
                onClick={() => openValidationModal(trip)}
              >
                <div
                  className={`trip-icon ${trip.isTripValidated ? "validated" : ""}`}
                  style={{ 
                    background: trip.isTripValidated ? `${getModeIcon(displayMode).color}15` : '#f1f5f9',
                    color: getModeIcon(displayMode).color,
                    borderColor: trip.isTripValidated ? `${getModeIcon(displayMode).color}30` : 'transparent'
                  }}
                >
                  {React.createElement(getModeIcon(displayMode).Icon, { size: 18 })}
                </div>

                <div className="trip-info">
                  <div className="trip-title">
                    {displayMode} Journey
                    {trip.isTripValidated && (
                      <span className="badge badge-success" style={{ marginLeft: '8px', border: '1px solid #34D399', background: '#ecfdf5' }}>
                        <CheckCircle size={10} /> VALIDATED
                      </span>
                    )}
                    {trip.isAnomalous && (
                      <span className="badge badge-danger">
                        <AlertTriangle size={9} /> Anomaly
                      </span>
                    )}
                  </div>

                  <div className="trip-meta">
                    <span className="trip-meta-item">
                      <Calendar size={12} />{" "}
                      {formatDate(trip.originCoordinates?.timestamp)}
                    </span>
                    <span className="trip-meta-item">
                      <Clock size={12} />{" "}
                      {formatTime(trip.originCoordinates?.timestamp)}
                    </span>
                    <span className="trip-meta-item">
                      <MapPin size={12} />{" "}
                      {((trip.totalDistance || 0) / 1000).toFixed(1)} km
                    </span>
                    {co2 && (
                      <span
                        className="trip-meta-item"
                        style={{ color: "#16A34A" }}
                      >
                        <Leaf size={12} /> {co2}
                      </span>
                    )}

                    <div
                      className="w-full mt-1"
                      style={{ color: "#666", fontSize: "12px" }}
                    >
                      {trip.originCoordinates?.name} →{" "}
                      {trip.destinationCoordinates?.name}
                    </div>

                    <div
                      className="flex-row mt-2"
                      style={{ flexWrap: "wrap", gap: "4px" }}
                    >
                      <span
                        className={`badge ${trip.isTripValidated ? "badge-brand" : "badge-warning"}`}
                      >
                        {trip.isTripValidated
                          ? trip.tripPurpose
                          : `AI: ${trip.predictedPurpose || "Unknown"}`}
                      </span>
                      {[
                        ...(trip.issueTags || []),
                        ...(trip.autoTags || []),
                      ].map((tag) => (
                        <span
                          key={tag}
                          className="badge"
                          style={{
                            background: TAG_COLORS[tag] || "#F1F5F9",
                            color: TAG_TEXT[tag] || "#475569",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className="flex-column gap-2"
                  style={{ display: "flex", flexDirection: "column" }}
                >
                  <button
                    className="icon-btn"
                    onClick={(e) => openTagModal(trip, e)}
                    title="Tag issues"
                  >
                    <Tag size={14} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplayTrip(trip);
                    }}
                    title="Replay"
                  >
                    <Play size={14} />
                  </button>
                  <div className="icon-btn" style={{ border: "none" }}>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      </div>

      {/* Validation Modal */}
      {selectedTrip && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Validate Trip</span>
              <button
                className="modal-close"
                onClick={() => setSelectedTrip(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body-content">
              <div
                className="modal-ai-hint"
                style={{
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <Cpu size={14} />
                <span>
                  AI Mode Prediction:{" "}
                  <strong>{selectedTrip.aiPredictedMode || "N/A"}</strong>
                </span>
              </div>

              {hasMap(selectedTrip) && (
                <div className="map-block">
                  <MapContainer
                    bounds={[
                      [
                        selectedTrip.originCoordinates.latitude,
                        selectedTrip.originCoordinates.longitude,
                      ],
                      [
                        selectedTrip.destinationCoordinates.latitude,
                        selectedTrip.destinationCoordinates.longitude,
                      ],
                    ]}
                    style={{ width: "100%", height: "100%" }}
                    zoomControl={false}
                  >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <CircleMarker
                      center={[
                        selectedTrip.originCoordinates.latitude,
                        selectedTrip.originCoordinates.longitude,
                      ]}
                      radius={5}
                      pathOptions={{ color: "#F5F230", fillOpacity: 1 }}
                    />
                    <CircleMarker
                      center={[
                        selectedTrip.destinationCoordinates.latitude,
                        selectedTrip.destinationCoordinates.longitude,
                      ]}
                      radius={5}
                      pathOptions={{ color: "#5BCAF5", fillOpacity: 1 }}
                    />
                    <Polyline
                      positions={[
                        [
                          selectedTrip.originCoordinates.latitude,
                          selectedTrip.originCoordinates.longitude,
                        ],
                        [
                          selectedTrip.destinationCoordinates.latitude,
                          selectedTrip.destinationCoordinates.longitude,
                        ],
                      ]}
                      pathOptions={{
                        color: "#111",
                        weight: 2,
                        dashArray: "5, 10",
                      }}
                    />
                  </MapContainer>
                </div>
              )}

              <form onSubmit={handleValidateSubmission}>
                <div className="field">
                  <label>Travel Mode</label>
                  <select
                    value={validatedMode}
                    onChange={(e) => setValidatedMode(e.target.value)}
                    required
                  >
                    {travelModes.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Trip Purpose</label>
                  <select
                    value={tripPurpose}
                    onChange={(e) => setTripPurpose(e.target.value)}
                    required
                  >
                    {tripPurposes.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isValidating}
                >
                  {isValidating ? "Saving..." : "Confirm & Validate"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tag Modal */}
      {taggingTrip && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <span className="modal-title">Tag Issues</span>
              <button
                className="modal-close"
                onClick={() => setTaggingTrip(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body-content">
              <p className="text-secondary text-sm mb-4">
                Select issues experienced during this trip:
              </p>
              <div className="stack">
                {ISSUE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    className="btn-secondary"
                    onClick={() => toggleTag(tag)}
                    style={{
                      justifyContent: "flex-start",
                      background: selectedTags.includes(tag)
                        ? "#111"
                        : "transparent",
                      color: selectedTags.includes(tag) ? "#fff" : "#111",
                      borderColor: selectedTags.includes(tag) ? "#111" : "#ddd",
                      width: "100%",
                      height: "50px",
                    }}
                  >
                    <Tag size={14} /> {tag}
                    {selectedTags.includes(tag) && (
                      <span style={{ marginLeft: "auto" }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
              <button
                className="btn-primary mt-4"
                onClick={handleSaveTags}
                disabled={isSavingTags}
              >
                {isSavingTags ? "Saving..." : "Save Tags"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TravelDiary;
