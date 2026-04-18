/**
 * Routelytics Background GPS Service Worker
 *
 * Architecture:
 * - GPS runs on the main thread (browser restriction — Geolocation API is not
 *   available in Service Workers).
 * - Each GPS point is posted HERE via postMessage and persisted in IndexedDB.
 * - When the page is closed while tracking is active, this SW receives a
 *   'TAB_CLOSING' message and schedules a Background Sync tag so the trip is
 *   saved automatically when connectivity is available.
 * - On 'sync' event, we read IndexedDB and POST the trip to the backend.
 * - A persistent notification is shown while tracking so the user knows
 *   tracking is still running.
 */

const DB_NAME   = 'routelytics_gps';
const DB_VER    = 1;
const STORE     = 'gps_points';
const META_STORE= 'trip_meta';
const SYNC_TAG  = 'flush-gps-trip';

// ─── IndexedDB helpers ───────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function appendPoint(point) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.add(point);
    tx.oncomplete = resolve;
    tx.onerror    = (e) => reject(e.target.error);
  });
}

async function getAllPoints() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req   = store.getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function clearPoints() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.clear();
    tx.oncomplete = resolve;
    tx.onerror    = (e) => reject(e.target.error);
  });
}

async function saveMeta(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(META_STORE, 'readwrite');
    const store = tx.objectStore(META_STORE);
    store.put(value, key);
    tx.oncomplete = resolve;
    tx.onerror    = (e) => reject(e.target.error);
  });
}

async function getMeta(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(META_STORE, 'readonly');
    const store = tx.objectStore(META_STORE);
    const req   = store.get(key);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

// ─── Haversine (used in SW to compute trip stats before posting) ─────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R   = 6371000;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Notification helper ─────────────────────────────────────────────────────

async function showTrackingNotification(pointCount) {
  const opts = {
    body: `${pointCount} GPS point${pointCount !== 1 ? 's' : ''} captured — tap to open Routelytics`,
    icon:  '/routelytics-icon.svg',
    badge: '/routelytics-icon.svg',
    tag:   'gps-tracking',          // replaces previous notification
    renotify: false,
    silent: true,
    requireInteraction: true,       // stays visible until dismissed
    actions: [
      { action: 'stop', title: '⏹ Stop & Save' },
      { action: 'open', title: '↗ Open App'    }
    ]
  };
  await self.registration.showNotification('📍 Routelytics — Tracking Active', opts);
}

async function showSavedNotification() {
  await self.registration.showNotification('✅ Routelytics — Trip Saved', {
    body:  'Your journey has been saved to the Travel Diary.',
    icon:  '/routelytics-icon.svg',
    tag:   'gps-tracking',
    silent: false
  });
}

// ─── Flush trip data to backend ──────────────────────────────────────────────

async function flushTripToBackend() {
  const points = await getAllPoints();
  const token  = await getMeta('token');
  const apiUrl = await getMeta('apiUrl');

  if (!points || points.length < 2 || !token) {
    console.log('[SW] Not enough points or no token — skipping flush');
    await clearPoints();
    return;
  }

  // Filter low-accuracy points (> 40m)
  const valid = points.filter((p) => !p.accuracy || p.accuracy <= 40);
  if (valid.length < 2) {
    await clearPoints();
    return;
  }

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
      const spd  = (d / tSec) * 3.6; // km/h
      speeds.push(spd);
      if (spd > maxSpd) maxSpd = spd;
      prev = valid[i];
    }
  }
  const avgSpd = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

  const payload = {
    originCoordinates:      { latitude: origin.latitude, longitude: origin.longitude, timestamp: origin.timestamp },
    destinationCoordinates: { latitude: dest.latitude,   longitude: dest.longitude,   timestamp: dest.timestamp   },
    tripPoints:             valid,
    averageSpeed:           parseFloat(avgSpd.toFixed(1)),
    maximumSpeed:           parseFloat(maxSpd.toFixed(1)),
    totalDistance:          Math.round(totalDist),
    totalDurationSeconds:   durationSec
  };

  const base = apiUrl || 'http://localhost:5000';

  const res = await fetch(`${base}/api/trips`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    await clearPoints();
    await saveMeta('trackingActive', false);
    await showSavedNotification();
    // Notify any open tabs that the trip was saved
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => c.postMessage({ type: 'TRIP_SAVED_BY_SW' }));
  } else {
    console.error('[SW] Backend rejected trip, keeping points for retry');
    throw new Error('Backend error'); // causes Background Sync to retry
  }
}

// ─── Service Worker lifecycle ─────────────────────────────────────────────────

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ─── Message handler (from main thread) ──────────────────────────────────────

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    // A new GPS point arrived — persist it
    case 'GPS_POINT':
      appendPoint(payload).then(async () => {
        const pts = await getAllPoints();
        await showTrackingNotification(pts.length);
      });
      break;

    // Save auth token + API URL so background sync can authenticate
    case 'SAVE_META':
      saveMeta('token',  payload.token);
      saveMeta('apiUrl', payload.apiUrl);
      saveMeta('trackingActive', true);
      break;

    // User explicitly stopped tracking from within the app
    case 'STOP_TRACKING':
      flushTripToBackend().catch(console.error);
      break;

    // Page is closing while tracking — schedule background sync
    case 'TAB_CLOSING':
      saveMeta('trackingActive', true).then(() => {
        self.registration.sync
          ?.register(SYNC_TAG)
          .catch((e) => {
            // Background Sync not supported — try immediate fetch
            console.warn('[SW] BG Sync not supported, flushing immediately', e);
            flushTripToBackend().catch(console.error);
          });
      });
      break;

    // Clear all stored data (user cancelled trip)
    case 'CANCEL_TRACKING':
      clearPoints().then(() => {
        saveMeta('trackingActive', false);
        self.registration.getNotifications({ tag: 'gps-tracking' })
          .then((notifs) => notifs.forEach((n) => n.close()));
      });
      break;

    // Restore in-progress trip data to a re-opened tab
    case 'GET_STORED_POINTS':
      Promise.all([getAllPoints(), getMeta('trackingActive')]).then(([pts, active]) => {
        event.source?.postMessage({ type: 'STORED_POINTS', points: pts, isActive: active });
      });
      break;
  }
});

// ─── Background Sync ─────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushTripToBackend());
  }
});

// ─── Notification action handler ─────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'stop') {
    // Flush trip, no need to open the page
    event.waitUntil(flushTripToBackend());
    return;
  }

  // 'open' or clicking the notification body — focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes('/simulate'));
      if (existing) return existing.focus();
      return self.clients.openWindow('/simulate');
    })
  );
});
