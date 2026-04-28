import { useState, useEffect } from "react";
import axios from "axios";
import {
  Play,
  Navigation,
  MapPin,
  Gauge,
  Bus,
  Car,
  Clock,
  Leaf,
  Square,
  Map,
  Save,
  CloudUpload,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Activity,
} from "lucide-react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import { useBackgroundGPS } from "../hooks/useBackgroundGPS";

// Component to dynamically update map view
const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const KERALA_LOCATIONS = [
  { name: "Kochi – Marine Drive", lat: 9.9816, lng: 76.2755 },
  { name: "Kochi – Edappally", lat: 10.0261, lng: 76.3125 },
  { name: "Trivandrum – Central", lat: 8.4875, lng: 76.9525 },
  { name: "Trivandrum – Technopark", lat: 8.5582, lng: 76.8812 },
  { name: "Kozhikode – Beach", lat: 11.2625, lng: 75.7672 },
  { name: "Munnar – Town", lat: 10.0892, lng: 77.0595 },
  { name: "Thrissur – Round", lat: 10.5255, lng: 76.2136 },
  { name: "Alappuzha – Backwaters", lat: 9.4975, lng: 76.3283 },
];

const MODE_CONFIG = {
  Car: { color: "#E24B4A", bg: "#FEF2F2", Icon: Car, label: "By Car" },
  Bus: { color: "#3B82F6", bg: "#EFF6FF", Icon: Bus, label: "By Bus" },
};

// ─── Scenario Card ──────────────────────────────────────────────────────────
const ScenarioCard = ({ modeKey, data, selected, onSelect }) => {
  const { color, bg, Icon, label } = MODE_CONFIG[modeKey];
  return (
    <button
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        width: "100%",
        padding: "1rem 1.25rem",
        background: selected ? bg : "#FAFAFA",
        border: `2px solid ${selected ? color : "#E5E7EB"}`,
        borderRadius: "14px",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.18s ease",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "12px",
          background: selected ? `${color}20` : "#F0F0F0",
          color: selected ? color : "#9CA3AF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.18s ease",
        }}
      >
        <Icon size={20} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.35rem",
          }}
        >
          <span
            style={{
              fontWeight: 700,
              fontSize: "15px",
              color: selected ? color : "#111",
            }}
          >
            {label}
          </span>
          {selected && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                background: color,
                color: "#fff",
                padding: "2px 8px",
                borderRadius: "99px",
              }}
            >
              SELECTED
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              color: "#555",
            }}
          >
            <Clock size={12} color="#9CA3AF" />
            {Math.round(data.durationMinutes)} min
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              color: "#555",
            }}
          >
            <MapPin size={12} color="#9CA3AF" />
            {data.distanceKm.toFixed(1)} km
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              color: data.co2EmissionsKg > 1 ? "#E24B4A" : "#10B981",
            }}
          >
            <Leaf size={12} />
            {data.co2EmissionsKg.toFixed(2)} kg CO₂
          </span>
        </div>
      </div>
      <ChevronRight size={16} color={selected ? color : "#D1D5DB"} />
    </button>
  );
};

// ─── GPS Status Banner (user-friendly) ─────────────────────────────────────
const GPSStatusBanner = ({ status, pointCount, isOnline, pendingCount }) => {
  const configs = {
    idle: {
      icon: <Navigation size={18} />,
      title: "Ready to Track",
      subtitle: "Tap Start to begin recording your journey",
      bg: "#F9FAFB",
      border: "#E5E7EB",
      titleColor: "#374151",
    },
    tracking: {
      icon: <Activity size={18} color="#10B981" />,
      title: "Recording your journey",
      subtitle: `${pointCount} location point${pointCount !== 1 ? "s" : ""} captured`,
      bg: "#F0FDF4",
      border: "#86EFAC",
      titleColor: "#065F46",
      pulse: true,
    },
    background: {
      icon: <Activity size={18} color="#F59E0B" />,
      title: "Tracking in background",
      subtitle: `${pointCount} points saved — your trip is still recording`,
      bg: "#FFFBEB",
      border: "#FCD34D",
      titleColor: "#92400E",
      pulse: true,
    },
    processing: {
      icon: (
        <RefreshCw
          size={18}
          color="#3B82F6"
          style={{ animation: "spin 1s linear infinite" }}
        />
      ),
      title: "Saving your trip…",
      subtitle: "Please wait a moment",
      bg: "#EFF6FF",
      border: "#93C5FD",
      titleColor: "#1E3A8A",
    },
    done: {
      icon: <CheckCircle2 size={18} color="#10B981" />,
      title: "Trip saved successfully!",
      subtitle:
        pendingCount > 0
          ? `${pendingCount} trip(s) waiting to sync`
          : "Your journey has been recorded",
      bg: "#F0FDF4",
      border: "#86EFAC",
      titleColor: "#065F46",
    },
    error: {
      icon: <AlertCircle size={18} color="#EF4444" />,
      title: "Location access needed",
      subtitle: "Please allow location access in your browser settings",
      bg: "#FEF2F2",
      border: "#FCA5A5",
      titleColor: "#991B1B",
    },
  };

  const c = configs[status] || configs.idle;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.875rem",
        padding: "1rem 1.125rem",
        background: c.bg,
        border: `1.5px solid ${c.border}`,
        borderRadius: "14px",
        marginBottom: "1.25rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Pulse ring for active tracking */}
      {c.pulse && (
        <div
          style={{
            position: "absolute",
            top: "14px",
            left: "14px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: status === "tracking" ? "#10B981" : "#F59E0B",
            opacity: 0.2,
            animation: "pulseRing 2s ease-out infinite",
          }}
        />
      )}

      <div style={{ marginTop: "2px", flexShrink: 0, zIndex: 1 }}>{c.icon}</div>

      <div style={{ flex: 1, zIndex: 1 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "14px",
            color: c.titleColor,
            marginBottom: "2px",
          }}
        >
          {c.title}
        </div>
        <div style={{ fontSize: "12px", color: "#6B7280" }}>{c.subtitle}</div>
      </div>

      {/* Online/Offline pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          padding: "3px 8px",
          borderRadius: "99px",
          background: isOnline ? "#DCFCE7" : "#FEE2E2",
          flexShrink: 0,
        }}
      >
        {isOnline ? (
          <Wifi size={10} color="#166534" />
        ) : (
          <WifiOff size={10} color="#991B1B" />
        )}
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: isOnline ? "#166534" : "#991B1B",
          }}
        >
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>
    </div>
  );
};

// ─── Speed / Points stat tile ───────────────────────────────────────────────
const StatTile = ({ label, value, unit, accent }) => (
  <div
    style={{
      flex: 1,
      background: "#F9FAFB",
      border: "1.5px solid #F0F0F0",
      borderRadius: "14px",
      padding: "1rem",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: "#9CA3AF",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        marginBottom: "6px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "26px",
        fontWeight: 800,
        color: accent || "#111",
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    {unit && (
      <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
        {unit}
      </div>
    )}
  </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const TripSimulator = () => {
  const [activeTab, setActiveTab] = useState("scenario");
  const [simState, setSimState] = useState("idle"); // idle | loading | done
  const [origin, setOrigin] = useState(KERALA_LOCATIONS[0]);
  const [destination, setDestination] = useState(KERALA_LOCATIONS[1]);
  const [scenarios, setScenarios] = useState(null);
  const [selectedMode, setSelectedMode] = useState("Car");
  const [isSaving, setIsSaving] = useState(false);

  const {
    gpsPoints,
    isTracking,
    trackingStatus,
    isRestored,
    isOnline,
    pendingCount,
    syncMessage,
    startTracking,
    stopAndSave,
    cancelTracking,
    resumeTracking,
    syncNow,
  } = useBackgroundGPS();

  // Auto-switch to GPS tab if session is restored
  useEffect(() => {
    if (isRestored) setActiveTab("gps");
  }, [isRestored]);

  const handleSimulate = async () => {
    if (origin.name === destination.name) {
      alert("Please choose different origin and destination.");
      return;
    }
    setSimState("loading");
    setScenarios(null);
    try {
      const res = await axios.post(
        `${API}/api/trips/simulate`,
        {
          originLat: origin.lat,
          originLng: origin.lng,
          destLat: destination.lat,
          destLng: destination.lng,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("natpac_token")}`,
          },
        },
      );
      setScenarios(res.data.data);
      setSimState("done");
    } catch {
      setSimState("idle");
      alert("Simulation failed. Please check your connection and try again.");
    }
  };

  const saveScenarioToDiary = async () => {
    if (!scenarios || !selectedMode) return;
    setIsSaving(true);
    const data = scenarios[selectedMode];
    const pts = data.geometry.coordinates.map((coord, idx) => ({
      longitude: coord[0],
      latitude: coord[1],
      timestamp: new Date(Date.now() + idx * 5000).toISOString(),
    }));
    try {
      await axios.post(
        `${API}/api/trips`,
        {
          originCoordinates: {
            latitude: origin.lat,
            longitude: origin.lng,
            timestamp: new Date().toISOString(),
          },
          destinationCoordinates: {
            latitude: destination.lat,
            longitude: destination.lng,
            timestamp: new Date(
              Date.now() + data.durationMinutes * 60000,
            ).toISOString(),
          },
          tripPoints: pts,
          totalDistance: Math.round(data.distanceKm * 1000),
          totalDurationSeconds: Math.round(data.durationMinutes * 60),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("natpac_token")}`,
          },
        },
      );
      alert("Trip saved to your diary!");
    } catch {
      alert("Couldn't save trip. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const latestPt =
    gpsPoints.length > 0 ? gpsPoints[gpsPoints.length - 1] : null;
  const latestSpeed = latestPt
    ? ((latestPt.speed || 0) * 3.6).toFixed(1)
    : "0.0";

  // Map center: GPS > origin
  const mapCenter = latestPt
    ? [latestPt.latitude, latestPt.longitude]
    : [origin.lat, origin.lng];

  return (
    <div className="page">
      {/* CSS for animations */}
      <style>{`
        @keyframes pulseRing {
          0%   { transform: scale(0.9); opacity: 0.4; }
          70%  { transform: scale(2);   opacity: 0;   }
          100% { transform: scale(2);   opacity: 0;   }
        }
        @keyframes spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
        .tab-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 12px; border: none;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.15s ease; position: relative;
        }
        .tab-btn.active   { background: #111; color: #fff; }
        .tab-btn.inactive { background: transparent; color: #6B7280; }
        .tab-btn.inactive:hover { background: #F3F4F6; color: #374151; }
        .select-field {
          width: 100%; padding: 10px 14px; border: 1.5px solid #E5E7EB;
          border-radius: 10px; font-size: 14px; background: #fff;
          color: #111; outline: none; appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
        }
        .select-field:focus { border-color: #111; }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Trips</h1>
          <p className="page-subtitle">
            Simulate a route or record a live journey
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          marginBottom: "1.5rem",
          background: "#F3F4F6",
          padding: "5px",
          borderRadius: "16px",
          width: "fit-content",
        }}
      >
        <button
          className={`tab-btn ${activeTab === "scenario" ? "active" : "inactive"}`}
          onClick={() => setActiveTab("scenario")}
        >
          <Map size={14} /> Simulate Route
        </button>
        <button
          className={`tab-btn ${activeTab === "gps" ? "active" : "inactive"}`}
          onClick={() => setActiveTab("gps")}
        >
          <Navigation size={14} /> Live GPS
          {isTracking && (
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10B981",
                position: "absolute",
                top: 6,
                right: 6,
              }}
            />
          )}
        </button>
      </div>

      {activeTab === "scenario" ? (
        /* ── SIMULATOR TAB ── */
        <div className="grid-2">
          {/* Config panel */}
          <div className="card">
            <div className="card-label">
              <MapPin size={13} /> Choose Locations
            </div>

            <div className="field" style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6B7280",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                From
              </label>
              <select
                className="select-field"
                value={origin.name}
                onChange={(e) =>
                  setOrigin(
                    KERALA_LOCATIONS.find((l) => l.name === e.target.value),
                  )
                }
              >
                {KERALA_LOCATIONS.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field" style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#6B7280",
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                To
              </label>
              <select
                className="select-field"
                value={destination.name}
                onChange={(e) =>
                  setDestination(
                    KERALA_LOCATIONS.find((l) => l.name === e.target.value),
                  )
                }
              >
                {KERALA_LOCATIONS.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn-brand w-full"
              onClick={handleSimulate}
              disabled={simState === "loading"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {simState === "loading" ? (
                <>
                  <RefreshCw
                    size={15}
                    style={{ animation: "spin 1s linear infinite" }}
                  />{" "}
                  Calculating…
                </>
              ) : (
                <>
                  <Map size={15} /> Find Routes
                </>
              )}
            </button>
          </div>

          {/* Results panel */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {simState === "done" && scenarios ? (
              <>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#6B7280",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: "2px",
                  }}
                >
                  Choose a travel mode
                </div>
                {Object.keys(MODE_CONFIG).map((key) =>
                  scenarios[key] ? (
                    <ScenarioCard
                      key={key}
                      modeKey={key}
                      data={scenarios[key]}
                      selected={selectedMode === key}
                      onSelect={() => setSelectedMode(key)}
                    />
                  ) : null,
                )}
                <button
                  className="btn-primary"
                  onClick={saveScenarioToDiary}
                  disabled={isSaving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "4px",
                  }}
                >
                  <Save size={15} />
                  {isSaving ? "Saving…" : `Save ${selectedMode} Trip to Diary`}
                </button>
              </>
            ) : simState === "loading" ? (
              <div
                className="card"
                style={{
                  textAlign: "center",
                  color: "#9CA3AF",
                  padding: "2rem",
                }}
              >
                <RefreshCw
                  size={24}
                  style={{
                    animation: "spin 1s linear infinite",
                    marginBottom: "0.75rem",
                    color: "#D1D5DB",
                  }}
                />
                <div style={{ fontSize: "14px" }}>Finding best routes…</div>
              </div>
            ) : (
              <div
                className="card"
                style={{
                  textAlign: "center",
                  color: "#9CA3AF",
                  padding: "2.5rem 1.5rem",
                }}
              >
                <Map
                  size={28}
                  style={{ marginBottom: "0.75rem", color: "#E5E7EB" }}
                />
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    marginBottom: "4px",
                    color: "#6B7280",
                  }}
                >
                  No routes yet
                </div>
                <div style={{ fontSize: "13px" }}>
                  Select origin & destination, then tap Find Routes
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── LIVE GPS TAB ── */
        <div className="grid-2">
          {/* Controls */}
          <div className="card">
            <div className="card-label">
              <Navigation size={13} /> Journey Controls
            </div>

            <GPSStatusBanner
              status={trackingStatus}
              pointCount={gpsPoints.length}
              isOnline={isOnline}
              pendingCount={pendingCount}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.625rem",
              }}
            >
              {!isTracking ? (
                <button
                  className="btn-brand w-full"
                  onClick={isRestored ? resumeTracking : startTracking}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    height: "48px",
                    borderRadius: "14px",
                    fontSize: "15px",
                  }}
                >
                  <Play size={16} fill="currentColor" />
                  {isRestored
                    ? "Continue Recording"
                    : "Start Recording Journey"}
                </button>
              ) : (
                <button
                  className="btn-danger w-full"
                  onClick={stopAndSave}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    height: "48px",
                    borderRadius: "14px",
                    fontSize: "15px",
                  }}
                >
                  <Square size={16} fill="currentColor" />
                  Stop & Save Journey
                </button>
              )}

              {(isTracking || isRestored) && (
                <button
                  onClick={cancelTracking}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1.5px solid #FCA5A5",
                    background: "#FEF2F2",
                    color: "#EF4444",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Discard this trip
                </button>
              )}
            </div>

            {/* Sync pending trips */}
            {pendingCount > 0 && isOnline && (
              <button
                onClick={syncNow}
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #93C5FD",
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <CloudUpload size={14} />
                Upload {pendingCount} saved trip{pendingCount !== 1 ? "s" : ""}
              </button>
            )}
            {syncMessage && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  color: "#6B7280",
                  textAlign: "center",
                }}
              >
                {syncMessage}
              </div>
            )}
          </div>

          {/* Telemetry */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <div className="card">
              <div className="card-label">
                <Gauge size={13} /> Live Stats
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <StatTile
                  label="Speed"
                  value={latestSpeed}
                  unit="km/h"
                  accent={parseFloat(latestSpeed) > 0 ? "#3B82F6" : "#9CA3AF"}
                />
                <StatTile
                  label="Points"
                  value={gpsPoints.length}
                  accent={gpsPoints.length > 0 ? "#10B981" : "#9CA3AF"}
                />
              </div>

              {latestPt && (
                <div
                  style={{
                    marginTop: "0.875rem",
                    padding: "0.75rem",
                    background: "#F9FAFB",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "#6B7280",
                    lineHeight: 1.7,
                  }}
                >
                  <div>
                    📍 {latestPt.latitude.toFixed(5)},{" "}
                    {latestPt.longitude.toFixed(5)}
                  </div>
                  {latestPt.accuracy && (
                    <div>🎯 Accuracy: ±{Math.round(latestPt.accuracy)}m</div>
                  )}
                  {latestPt.altitude > 0 && (
                    <div>🏔 Altitude: {Math.round(latestPt.altitude)}m</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div
        className="card mt-4"
        style={{
          padding: 0,
          overflow: "hidden",
          height: 420,
          borderRadius: "16px",
        }}
      >
        <MapContainer
          key={`map-${activeTab}`}
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <ChangeMapView center={mapCenter} />
          <TileLayer
            attribution='&copy; <a href="https://carto.com">CartoDB</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {/* Simulator route */}
          {activeTab === "scenario" && scenarios?.[selectedMode] && (
            <Polyline
              positions={scenarios[selectedMode].geometry.coordinates.map(
                (c) => [c[1], c[0]],
              )}
              pathOptions={{
                color: MODE_CONFIG[selectedMode].color,
                weight: 5,
                opacity: 0.9,
              }}
            />
          )}

          {/* Live GPS trail */}
          {activeTab === "gps" && gpsPoints.length > 1 && (
            <Polyline
              positions={gpsPoints.map((p) => [p.latitude, p.longitude])}
              pathOptions={{ color: "#3B82F6", weight: 5, opacity: 0.85 }}
            />
          )}

          {/* Current GPS position marker */}
          {activeTab === "gps" && latestPt && (
            <CircleMarker
              center={[latestPt.latitude, latestPt.longitude]}
              radius={9}
              pathOptions={{
                color: "#fff",
                weight: 2.5,
                fillColor: "#3B82F6",
                fillOpacity: 1,
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default TripSimulator;
