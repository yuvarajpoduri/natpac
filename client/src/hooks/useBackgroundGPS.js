/**
 * useBackgroundGPS — Custom React hook for persistent background GPS tracking
 *
 * How it works:
 * 1. Registers /sw.js as a Service Worker on first use.
 * 2. Calls navigator.geolocation.watchPosition() on the MAIN THREAD
 *    (Geolocation API is unavailable inside Service Workers).
 * 3. Each GPS point is both kept in local state AND posted to the SW,
 *    which persists it to IndexedDB.
 * 4. When the page closes (Tab closed / refreshed / navigated away):
 *    - beforeunload fires → sends 'TAB_CLOSING' to the SW
 *    - SW schedules a Background Sync tag
 *    - On next connectivity window the SW reads IndexedDB and POSTs the trip
 * 5. When the page re-opens while tracking was active, the hook asks the SW
 *    for stored points and resumes from where it left off.
 * 6. Persistent notification keeps tracking visible in the notification shade.
 */

import { useState, useRef, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Service Worker registration ─────────────────────────────────────────────

let swReg = null; // module-level singleton

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

// ─── Notification permission helper ──────────────────────────────────────────

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useBackgroundGPS() {
  const [gpsPoints, setGpsPoints]           = useState([]);
  const [isTracking, setIsTracking]         = useState(false);
  const [trackingStatus, setTrackingStatus] = useState('idle');
  // 'idle' | 'tracking' | 'background' | 'processing' | 'done' | 'error'
  const [isRestored, setIsRestored]         = useState(false); // resumed from SW

  const watchIdRef    = useRef(null);
  const startTimeRef  = useRef(null);
  const gpsPointsRef  = useRef([]); // mirror state in ref for closures

  // Keep ref in sync with state
  useEffect(() => { gpsPointsRef.current = gpsPoints; }, [gpsPoints]);

  // ─── Register SW + restore any in-progress trip ──────────────────────────

  useEffect(() => {
    let messageListener;

    const init = async () => {
      const reg = await getSWRegistration();
      if (!reg) return;

      // Listen for messages back from the SW
      messageListener = (event) => {
        const { type } = event.data || {};

        // SW sends back stored points when page re-opens
        if (type === 'STORED_POINTS') {
          const { points, isActive } = event.data;
          if (isActive && points?.length > 0) {
            setGpsPoints(points);
            gpsPointsRef.current = points;
            setIsRestored(true);
            setTrackingStatus('background'); // page was closed, SW held data
          }
        }

        // SW finished saving the trip in the background
        if (type === 'TRIP_SAVED_BY_SW') {
          setGpsPoints([]);
          gpsPointsRef.current = [];
          setIsTracking(false);
          setTrackingStatus('done');
          setIsRestored(false);
        }
      };

      navigator.serviceWorker.addEventListener('message', messageListener);

      // Ask SW for any stored points from a previous session
      postToSW({ type: 'GET_STORED_POINTS' });
    };

    init();

    return () => {
      if (messageListener) {
        navigator.serviceWorker.removeEventListener('message', messageListener);
      }
    };
  }, []);

  // ─── Page Visibility + beforeunload ──────────────────────────────────────

  useEffect(() => {
    // When the page is hidden (tab switch / lock screen) update status
    const handleVisibilityChange = () => {
      if (document.hidden && isTracking) {
        setTrackingStatus('background');
      } else if (!document.hidden && isTracking) {
        setTrackingStatus('tracking');
      }
    };

    // When the page is about to unload while tracking, tell SW to persist
    const handleBeforeUnload = () => {
      if (isTracking) {
        postToSW({ type: 'TAB_CLOSING' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isTracking]);

  // ─── Start tracking ───────────────────────────────────────────────────────

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('GPS is not supported in this browser.');
      return;
    }

    // Request notification permission so the persistent alert can show
    await requestNotificationPermission();

    // Send auth token to SW so it can POST the trip when the tab is closed
    postToSW({
      type: 'SAVE_META',
      payload: {
        token:  localStorage.getItem('natpac_token'),
        apiUrl: API
      }
    });

    // Reset state
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
          speed:     pos.coords.speed   ?? 0,
          accuracy:  pos.coords.accuracy ?? null,
          timestamp: new Date().toISOString()
        };

        // Update React state (for live map rendering)
        setGpsPoints((prev) => {
          const updated = [...prev, point];
          gpsPointsRef.current = updated;
          return updated;
        });

        // Persist to IndexedDB via SW
        postToSW({ type: 'GPS_POINT', payload: point });
      },
      (err) => {
        console.error('[GPS] watchPosition error:', err);
        setTrackingStatus('error');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, []);

  // ─── Stop & save from within the app ─────────────────────────────────────

  const stopAndSave = useCallback(() => {
    // Clear the geolocation watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setTrackingStatus('processing');

    // Tell SW to flush all stored points to the backend right now
    postToSW({ type: 'STOP_TRACKING' });

    // Also close the notification
    navigator.serviceWorker?.getRegistration('/').then((reg) => {
      reg?.getNotifications({ tag: 'gps-tracking' }).then((notifs) =>
        notifs.forEach((n) => n.close())
      );
    });
  }, []);

  // ─── Cancel (discard) tracking ────────────────────────────────────────────

  const cancelTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsPoints([]);
    gpsPointsRef.current = [];
    setIsTracking(false);
    setTrackingStatus('idle');
    setIsRestored(false);
    postToSW({ type: 'CANCEL_TRACKING' });
  }, []);

  // ─── Resume tracking after restoring from SW ──────────────────────────────
  // User re-opened the app mid-trip — restart watchPosition so the path
  // continues to be extended from the restored points.

  const resumeTracking = useCallback(async () => {
    if (!navigator.geolocation) return;

    setIsTracking(true);
    setTrackingStatus('tracking');

    // Refresh token in SW
    postToSW({
      type: 'SAVE_META',
      payload: {
        token:  localStorage.getItem('natpac_token'),
        apiUrl: API
      }
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          latitude:  pos.coords.latitude,
          longitude: pos.coords.longitude,
          speed:     pos.coords.speed   ?? 0,
          accuracy:  pos.coords.accuracy ?? null,
          timestamp: new Date().toISOString()
        };
        setGpsPoints((prev) => {
          const updated = [...prev, point];
          gpsPointsRef.current = updated;
          return updated;
        });
        postToSW({ type: 'GPS_POINT', payload: point });
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
      // Do NOT cancel — if tracking is active, let SW keep collecting
    };
  }, []);

  return {
    gpsPoints,
    isTracking,
    trackingStatus,
    isRestored,
    startTracking,
    stopAndSave,
    cancelTracking,
    resumeTracking
  };
}
