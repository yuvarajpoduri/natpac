/**
 * useBackgroundGPS — Custom React hook for persistent background GPS tracking
 *
 * OFFLINE-FIRST ARCHITECTURE (v2):
 * ──────────────────────────────────
 * 1. GPS points are stored in localStorage in real-time (works 100% offline).
 *    Key: 'rl_gps_points' → JSON array of point objects
 *    Key: 'rl_trip_meta'  → { token, apiUrl, startTime, isActive }
 *
 * 2. Service Worker (sw.js) is ALSO kept as backup — it mirrors the same
 *    data into IndexedDB for when the tab is killed (not just navigated).
 *
 * 3. When the user taps "Stop & Save":
 *    a. If ONLINE  → POST trip immediately, clear localStorage
 *    b. If OFFLINE → save full trip payload to localStorage queue
 *       Key: 'rl_pending_trips' → JSON array of trip objects to POST
 *
 * 4. An 'online' event listener fires whenever connectivity is restored.
 *    It reads 'rl_pending_trips' and attempts to POST each one.
 *
 * 5. On app start, if 'rl_pending_trips' has entries → auto-sync runs.
 *
 * 6. If the tab is KILLED while tracking (no beforeunload fired):
 *    - sw.js Background Sync kicks in as fallback.
 *    - On next page load the SW sends STORED_POINTS back → hook restores
 *      the in-progress trip automatically.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── localStorage keys ────────────────────────────────────────────────────────
const LS_POINTS       = 'rl_gps_points';   // current active trip points
const LS_META         = 'rl_trip_meta';    // token, apiUrl, startTime, isActive
const LS_PENDING      = 'rl_pending_trips'; // queue of trips to POST when online

// ─── localStorage helpers ─────────────────────────────────────────────────────
function lsGetPoints() {
  try { return JSON.parse(localStorage.getItem(LS_POINTS) || '[]'); } catch { return []; }
}
function lsSetPoints(pts) {
  try { localStorage.setItem(LS_POINTS, JSON.stringify(pts)); } catch (e) {
    console.warn('[GPS] localStorage full — truncating old points');
    // Keep the newest 500 points if storage is full
    try { localStorage.setItem(LS_POINTS, JSON.stringify(pts.slice(-500))); } catch {}
  }
}
function lsClearPoints() {
  localStorage.removeItem(LS_POINTS);
}

function lsGetMeta() {
  try { return JSON.parse(localStorage.getItem(LS_META) || '{}'); } catch { return {}; }
}
function lsSetMeta(meta) {
  localStorage.setItem(LS_META, JSON.stringify(meta));
}
function lsClearMeta() {
  localStorage.removeItem(LS_META);
}

function lsGetPending() {
  try { return JSON.parse(localStorage.getItem(LS_PENDING) || '[]'); } catch { return []; }
}
function lsSetPending(trips) {
  localStorage.setItem(LS_PENDING, JSON.stringify(trips));
}
function lsAddPending(trip) {
  const existing = lsGetPending();
  lsSetPending([...existing, { ...trip, _pendingAt: new Date().toISOString() }]);
}

// ─── Haversine (to compute stats offline before queuing) ─────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildTripPayload(points) {
  // Filter inaccurate points
  const valid = points.filter((p) => !p.accuracy || p.accuracy <= 40);
  if (valid.length < 2) return null;

  const origin = valid[0];
  const dest   = valid[valid.length - 1];
  const durationSec = Math.round(
    (new Date(dest.timestamp) - new Date(origin.timestamp)) / 1000
  );

  let totalDist = 0, maxSpd = 0;
  const speeds = [];
  let prev = valid[0];
  for (let i = 1; i < valid.length; i++) {
    const d = haversine(prev.latitude, prev.longitude, valid[i].latitude, valid[i].longitude);
    if (d > 5) {
      totalDist += d;
      const tSec = Math.max(1, (new Date(valid[i].timestamp) - new Date(prev.timestamp)) / 1000);
      const spd  = (d / tSec) * 3.6;
      speeds.push(spd);
      if (spd > maxSpd) maxSpd = spd;
      prev = valid[i];
    }
  }
  const avgSpd = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

  return {
    originCoordinates:      { latitude: origin.latitude, longitude: origin.longitude, timestamp: origin.timestamp },
    destinationCoordinates: { latitude: dest.latitude,   longitude: dest.longitude,   timestamp: dest.timestamp   },
    tripPoints:             valid,
    averageSpeed:           parseFloat(avgSpd.toFixed(1)),
    maximumSpeed:           parseFloat(maxSpd.toFixed(1)),
    totalDistance:          Math.round(totalDist),
    totalDurationSeconds:   durationSec,
  };
}

// ─── POST a single trip payload to the backend ────────────────────────────────
async function postTrip(payload, token) {
  const res = await fetch(`${API}/api/trips`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`Server ${res.status}: ${err}`);
  }
  return res.json();
}

// ─── Flush pending queue to backend ──────────────────────────────────────────
async function flushPendingTrips(token) {
  const pending = lsGetPending();
  if (!pending.length) return 0;

  let successCount = 0;
  const remaining = [];

  for (const trip of pending) {
    try {
      await postTrip(trip, token || lsGetMeta().token);
      successCount++;
    } catch (e) {
      console.warn('[GPS] Could not sync pending trip, keeping for retry:', e.message);
      remaining.push(trip);
    }
  }

  lsSetPending(remaining);
  return successCount;
}

// ─── Service Worker bridge ────────────────────────────────────────────────────
let swReg = null;

async function getSWRegistration() {
  if (swReg) return swReg;
  if (!('serviceWorker' in navigator)) return null;
  try {
    swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return swReg;
  } catch (e) {
    console.warn('[GPS] Service Worker registration failed:', e);
    return null;
  }
}

function postToSW(msg) {
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage(msg);
  }
}

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  return (await Notification.requestPermission()) === 'granted';
}

// ═══════════════════════════════════════════════════════════════════════════════
// THE HOOK
// ═══════════════════════════════════════════════════════════════════════════════
export function useBackgroundGPS() {
  const [gpsPoints, setGpsPoints]             = useState(() => lsGetPoints());
  const [isTracking, setIsTracking]           = useState(false);
  const [trackingStatus, setTrackingStatus]   = useState('idle');
  // 'idle' | 'tracking' | 'background' | 'processing' | 'done' | 'error' | 'queued'
  const [isRestored, setIsRestored]           = useState(false);
  const [isOnline, setIsOnline]               = useState(navigator.onLine);
  const [pendingCount, setPendingCount]       = useState(() => lsGetPending().length);
  const [syncMessage, setSyncMessage]         = useState('');

  const watchIdRef   = useRef(null);
  const startTimeRef = useRef(null);
  const gpsPointsRef = useRef(gpsPoints);

  // Keep ref in sync
  useEffect(() => { gpsPointsRef.current = gpsPoints; }, [gpsPoints]);

  // ─── Network status listeners ─────────────────────────────────────────────

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      // Auto-flush pending trips when connection is restored
      const token = localStorage.getItem('natpac_token');
      if (token) {
        const count = await flushPendingTrips(token);
        if (count > 0) {
          setSyncMessage(`✅ ${count} offline trip${count > 1 ? 's' : ''} synced!`);
          setPendingCount(lsGetPending().length);
          setTimeout(() => setSyncMessage(''), 5000);
        }
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also flush on initial mount if we're already online
    if (navigator.onLine) handleOnline();

    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── Restore in-progress trip from localStorage on mount ─────────────────

  useEffect(() => {
    const meta = lsGetMeta();
    const storedPoints = lsGetPoints();

    if (meta.isActive && storedPoints.length > 0) {
      setGpsPoints(storedPoints);
      gpsPointsRef.current = storedPoints;
      setIsRestored(true);
      setTrackingStatus('background');
    }
  }, []);

  // ─── SW message listener (fallback restore) ───────────────────────────────

  useEffect(() => {
    let listener;
    getSWRegistration().then(() => {
      listener = (event) => {
        const { type } = event.data || {};
        if (type === 'STORED_POINTS') {
          const { points, isActive } = event.data;
          // Only use SW data if localStorage doesn't already have it
          const lsPoints = lsGetPoints();
          if (isActive && points?.length > 0 && lsPoints.length === 0) {
            setGpsPoints(points);
            gpsPointsRef.current = points;
            lsSetPoints(points);
            setIsRestored(true);
            setTrackingStatus('background');
          }
        }
        if (type === 'TRIP_SAVED_BY_SW') {
          lsClearPoints();
          lsClearMeta();
          setGpsPoints([]);
          gpsPointsRef.current = [];
          setIsTracking(false);
          setTrackingStatus('done');
          setIsRestored(false);
          setPendingCount(lsGetPending().length);
        }
      };
      navigator.serviceWorker?.addEventListener('message', listener);
      postToSW({ type: 'GET_STORED_POINTS' });
    });

    return () => {
      if (listener) navigator.serviceWorker?.removeEventListener('message', listener);
    };
  }, []);

  // ─── beforeunload ──────────────────────────────────────

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isTracking) {
        // Save meta for SW so it can flush when tab reopens
        lsSetMeta({ ...lsGetMeta(), isActive: true });
        postToSW({ type: 'TAB_CLOSING' });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTracking]);

  // ─── Start tracking ───────────────────────────────────────────────────────

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('GPS is not supported in this browser.');
      return;
    }

    await requestNotificationPermission();

    const token = localStorage.getItem('natpac_token');

    // Persist meta to localStorage so it survives tab kills
    lsSetMeta({ token, apiUrl: API, startTime: new Date().toISOString(), isActive: true });
    lsClearPoints();

    // Also tell SW (IndexedDB backup)
    postToSW({ type: 'SAVE_META', payload: { token, apiUrl: API } });

    setGpsPoints([]);
    gpsPointsRef.current = [];
    setIsTracking(true);
    setTrackingStatus('tracking');
    setIsRestored(false);
    startTimeRef.current = Date.now();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed:     pos.coords.speed    ?? 0,
          accuracy:  pos.coords.accuracy ?? null,
          timestamp: new Date().toISOString(),
        };

        // ① Update React state (live map)
        setGpsPoints((prev) => {
          const updated = [...prev, point];
          gpsPointsRef.current = updated;
          // ② Persist to localStorage IMMEDIATELY (offline-first)
          lsSetPoints(updated);
          // ③ Mirror to SW / IndexedDB (background-kill fallback)
          postToSW({ type: 'GPS_POINT', payload: point });
          return updated;
        });
      },
      (err) => {
        console.error('[GPS] watchPosition error:', err);
        setTrackingStatus('error');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, []);

  // ─── Stop & save ─────────────────────────────────────────────────────────

  const stopAndSave = useCallback(async () => {
    // Stop the GPS watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setTrackingStatus('processing');

    const points = gpsPointsRef.current;
    const meta   = lsGetMeta();
    const token  = meta.token || localStorage.getItem('natpac_token');

    const payload = buildTripPayload(points);

    if (!payload) {
      // Not enough valid points
      lsClearPoints();
      lsClearMeta();
      setTrackingStatus('idle');
      alert('Not enough GPS points collected. Please track for longer.');
      return;
    }

    if (navigator.onLine && token) {
      // ── ONLINE: POST immediately ──
      try {
        await postTrip(payload, token);
        lsClearPoints();
        lsClearMeta();
        // Dismiss notification
        navigator.serviceWorker?.getRegistration('/').then((reg) => {
          reg?.getNotifications({ tag: 'gps-tracking' }).then((n) => n.forEach((x) => x.close()));
        });
        setTrackingStatus('done');
        setPendingCount(lsGetPending().length);
      } catch (e) {
        console.warn('[GPS] Online POST failed, queuing trip offline:', e.message);
        lsAddPending(payload);
        lsClearPoints();
        lsClearMeta();
        setPendingCount(lsGetPending().length);
        setTrackingStatus('queued');
      }
    } else {
      // ── OFFLINE: queue for later ──
      lsAddPending(payload);
      lsClearPoints();
      lsClearMeta();
      // Also tell SW to try background sync when connectivity returns
      postToSW({ type: 'TAB_CLOSING' });
      setPendingCount(lsGetPending().length);
      setTrackingStatus('queued');
    }
  }, []);

  // ─── Manual sync (button) ─────────────────────────────────────────────────

  const syncNow = useCallback(async () => {
    const token = localStorage.getItem('natpac_token');
    if (!navigator.onLine) {
      setSyncMessage('📶 You are offline. Sync will happen automatically when connected.');
      setTimeout(() => setSyncMessage(''), 4000);
      return;
    }
    const count = await flushPendingTrips(token);
    setPendingCount(lsGetPending().length);
    if (count > 0) {
      setSyncMessage(`✅ ${count} trip${count > 1 ? 's' : ''} synced to Travel Diary!`);
    } else {
      setSyncMessage('ℹ️ No pending trips to sync.');
    }
    setTimeout(() => setSyncMessage(''), 5000);
  }, []);

  // ─── Cancel tracking ──────────────────────────────────────────────────────

  const cancelTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    lsClearPoints();
    lsClearMeta();
    setGpsPoints([]);
    gpsPointsRef.current = [];
    setIsTracking(false);
    setTrackingStatus('idle');
    setIsRestored(false);
    postToSW({ type: 'CANCEL_TRACKING' });
  }, []);

  // ─── Resume tracking after restore ────────────────────────────────────────

  const resumeTracking = useCallback(async () => {
    if (!navigator.geolocation) return;

    setIsTracking(true);
    setTrackingStatus('tracking');

    const token = localStorage.getItem('natpac_token');
    lsSetMeta({ ...lsGetMeta(), token, apiUrl: API, isActive: true });
    postToSW({ type: 'SAVE_META', payload: { token, apiUrl: API } });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed:     pos.coords.speed    ?? 0,
          accuracy:  pos.coords.accuracy ?? null,
          timestamp: new Date().toISOString(),
        };
        setGpsPoints((prev) => {
          const updated = [...prev, point];
          gpsPointsRef.current = updated;
          lsSetPoints(updated);
          postToSW({ type: 'GPS_POINT', payload: point });
          return updated;
        });
      },
      (err) => {
        console.error('[GPS] Resume watch error:', err);
        setTrackingStatus('error');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, []);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
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
  };
}
