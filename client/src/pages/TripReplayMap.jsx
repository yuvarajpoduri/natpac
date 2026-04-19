import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Play, Pause, RotateCcw, Navigation, AlertTriangle } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// ── Moving marker icon ──
const movingIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#F5F230;border:3px solid #111;
    box-shadow:0 2px 8px rgba(0,0,0,0.3)
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const originIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:#5BCAF5;border:3px solid #111
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const destIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:
    0 12px 12px 12px;
    background:#FF6B6B;border:3px solid #111;
    transform:rotate(-45deg)
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Issue icons
const createIssueIcon = (color) => L.divIcon({
  className: '',
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:${color};border:2px solid #fff;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 5px rgba(0,0,0,0.4)
  "><span style="color:#fff;font-size:12px;font-weight:bold;">!</span></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const ISSUE_COLORS = {
  traffic: '#EF4444', // red
  delay: '#EAB308', // yellow
  bad_road: '#92400E' // brown
};

// Auto-fit bounds helper
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
    }
  }, [map, points]);
  return null;
};

/**
 * Feature 4: Trip Replay
 * Props:
 *   trip — the trip object from the API (with tripPoints and origin/destination)
 *   onClose — callback to close the replay panel
 */
const TripReplayMap = ({ trip, onClose }) => {
  const rawPoints = trip.tripPoints?.length >= 2
    ? trip.tripPoints.map((p) => [p.latitude, p.longitude])
    : [
        [trip.originCoordinates.latitude, trip.originCoordinates.longitude],
        [trip.destinationCoordinates.latitude, trip.destinationCoordinates.longitude]
      ];

  const [markerIdx, setMarkerIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  // Playback: advance marker every 300ms
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setMarkerIdx((prev) => {
          if (prev >= rawPoints.length - 1) {
            setIsPlaying(false);
            clearInterval(intervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 300);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, rawPoints.length]);

  const handleSlider = (e) => {
    setMarkerIdx(Number(e.target.value));
    setIsPlaying(false);
  };

  const handleReset = () => {
    setMarkerIdx(0);
    setIsPlaying(false);
  };

  const progress = rawPoints.length > 1 ? Math.round((markerIdx / (rawPoints.length - 1)) * 100) : 0;

  // Segment logic
  const segments = [];
  let currentSegment = { color: '#3B82F6', points: [] }; // blue default
  
  if (trip.tripPoints && trip.tripPoints.length > 1 && trip.issueEvents && trip.issueEvents.length > 0) {
    for (let i = 0; i < trip.tripPoints.length; i++) {
      const pt = trip.tripPoints[i];
      const ptTime = new Date(pt.timestamp).getTime();
      let ptColor = '#3B82F6';
      
      for (const issue of trip.issueEvents) {
        if (issue.issueType === 'bad_road') continue; // bad road is just a point marker usually, but we could color it. Let's color traffic and delay.
        const issueStart = new Date(issue.timestamp).getTime();
        const issueEnd = issueStart + (issue.durationSeconds * 1000);
        if (ptTime >= issueStart && ptTime <= issueEnd) {
          ptColor = ISSUE_COLORS[issue.issueType];
          break;
        }
      }

      if (currentSegment.color !== ptColor && currentSegment.points.length > 0) {
        currentSegment.points.push([pt.latitude, pt.longitude]); // connect to next segment
        segments.push(currentSegment);
        currentSegment = { color: ptColor, points: [[pt.latitude, pt.longitude]] };
      } else {
        currentSegment.points.push([pt.latitude, pt.longitude]);
      }
    }
    if (currentSegment.points.length > 0) segments.push(currentSegment);
  } else {
    segments.push({ color: '#3B82F6', points: rawPoints });
  }

  const delaysCount = (trip.issueEvents || []).filter(e => e.issueType === 'delay').length;
  const trafficCount = (trip.issueEvents || []).filter(e => e.issueType === 'traffic').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Map */}
      <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', minHeight: 280 }}>
        <MapContainer
          center={rawPoints[0]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="© CARTO"
          />
          <FitBounds points={rawPoints} />

          {/* Segmented route line */}
          {segments.map((seg, idx) => (
            <Polyline
              key={`seg-${idx}`}
              positions={seg.points}
              pathOptions={{ color: seg.color, weight: 4 }}
            />
          ))}

          {/* Issue markers */}
          {(trip.issueEvents || []).map((issue, idx) => {
            if (!issue.latitude || !issue.longitude) return null;
            const label = issue.issueType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            return (
              <Marker 
                key={`issue-${idx}`} 
                position={[issue.latitude, issue.longitude]} 
                icon={createIssueIcon(ISSUE_COLORS[issue.issueType])}
              >
                <Popup>
                  <div style={{fontWeight: 600}}>{label} Detected</div>
                  {issue.durationSeconds > 0 && <div>Delay: {Math.round(issue.durationSeconds / 60)} minutes</div>}
                </Popup>
              </Marker>
            );
          })}

          {/* Travelled portion (overlay) */}
          {markerIdx > 0 && (
            <Polyline
              positions={rawPoints.slice(0, markerIdx + 1)}
              pathOptions={{ color: '#111111', weight: 5, opacity: 0.6 }}
            />
          )}

          {/* Origin */}
          <Marker position={rawPoints[0]} icon={originIcon} />

          {/* Destination */}
          <Marker position={rawPoints[rawPoints.length - 1]} icon={destIcon} />

          {/* Moving marker */}
          <Marker position={rawPoints[markerIdx]} icon={movingIcon} />
        </MapContainer>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginTop: '0.75rem', padding: '1rem' }}>
        {/* Issue Summary */}
        {(delaysCount > 0 || trafficCount > 0) && (
          <div style={{ display: 'flex', gap: 12, marginBottom: '1rem', background: '#f8f9fa', padding: 10, borderRadius: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Total Delays</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: ISSUE_COLORS.delay }}>{delaysCount}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>Traffic Zones</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: ISSUE_COLORS.traffic }}>{trafficCount}</div>
            </div>
          </div>
        )}

        {/* Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Navigation size={14} color="#888" />
          <input
            type="range"
            min={0}
            max={rawPoints.length - 1}
            value={markerIdx}
            onChange={handleSlider}
            style={{ flex: 1, accentColor: '#111' }}
          />
          <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>{progress}%</span>
        </div>

        {/* Playback buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            disabled={markerIdx >= rawPoints.length - 1 && !isPlaying}
          >
            {isPlaying ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '0.7rem 1rem', borderRadius: 10, border: '1.5px solid #ddd',
              background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            <RotateCcw size={14} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: '0.7rem 1rem', borderRadius: 10, border: '1.5px solid #ddd',
                background: '#fff', cursor: 'pointer', fontSize: 13
              }}
            >
              Close
            </button>
          )}
        </div>

        {/* Timestamp info */}
        {trip.tripPoints?.[markerIdx]?.timestamp && (
          <div style={{ fontSize: 11, color: '#888', marginTop: '0.5rem', textAlign: 'center' }}>
            {new Date(trip.tripPoints[markerIdx].timestamp).toLocaleTimeString()}
            {trip.tripPoints[markerIdx].speed != null &&
              ` · ${trip.tripPoints[markerIdx].speed.toFixed(1)} km/h`}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripReplayMap;
