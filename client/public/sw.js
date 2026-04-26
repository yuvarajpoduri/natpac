/**
 * Routelytics Background GPS Service Worker v2
 *
 * OFFLINE-FIRST ARCHITECTURE:
 * ──────────────────────────────────────────────────────────────────────────
 * PRIMARY storage:  localStorage (main thread — works in all browsers)
 * BACKUP  storage:  IndexedDB   (this SW — for when tab is killed/crashed)
 *
 * Flow:
 *   1. Main thread (useBackgroundGPS hook) writes GPS points to localStorage.
 *   2. Each point is ALSO posted here via postMessage → stored in IndexedDB.
 *   3. On "Stop & Save":
 *      - If ONLINE  → hook POSTs trip immediately, clears localStorage.
 *      - If OFFLINE → hook queues trip in localStorage 'rl_pending_trips',
 *                     sends TAB_CLOSING here → Background Sync registered.
 *   4. Background Sync fires when connectivity restores → reads IndexedDB
 *      and POSTs trip from the SW (handles tab-killed scenario).
 *   5. On page reload → SW sends STORED_POINTS back to re-open tab.
 *   6. A persistent notification shows while tracking is active.
 *
 * iOS Safari note: Background Sync API is NOT supported on iOS.
 *   The localStorage queue + 'online' event in the main thread handles
 *   iOS offline sync without needing the SW.
 */

const DB_NAME    = 'routelytics_gps';
const DB_VER     = 2;
const STORE      = 'gps_points';
const META_STORE = 'trip_meta';
const SYNC_TAG   = 'flush-gps-trip';

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

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
    req.onsuccess = (e) => resolve(e.target.result || []);
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

// ─── Haversine ────────────────────────────────────────────────────────────────

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

// ─── Notifications ────────────────────────────────────────────────────────────

async function showTrackingNotification(pointCount) {
  try {
    await self.registration.showNotification('📍 Routelytics — Tracking Active', {
      body:   `${pointCount} GPS point${pointCount !== 1 ? 's' : ''} recorded — trip saved locally`,
      icon:   '/routelytics-icon.svg',
      badge:  '/routelytics-icon.svg',
      tag:    'gps-tracking',
      renotify: false,
      silent: true,
      requireInteraction: true,
      actions: [
        { action: 'stop', title: '⏹ Stop & Save' },
        { action: 'open', title: '↗ Open App'    },
      ],
    });
  } catch (e) {
    // Notification permission not granted — silent fail
    console.log('[SW] Notification suppressed:', e.message);
  }
}

async function showSavedNotification(isOffline = false) {
  try {
    await self.registration.showNotification(
      isOffline ? '📦 Routelytics — Trip Saved Locally' : '✅ Routelytics — Trip Synced',
      {
        body:   isOffline
          ? 'No connection — trip queued and will sync automatically when you go online.'
          : 'Your journey has been uploaded to the Travel Diary.',
        icon:   '/routelytics-icon.svg',
        tag:    'gps-tracking',
        silent: false,
      }
    );
  } catch {}
}

// ─── Build + flush trip from IndexedDB → backend ─────────────────────────────

async function flushTripToBackend() {
  const points = await getAllPoints();
  const token  = await getMeta('token');
  const apiUrl = await getMeta('apiUrl');

  if (!points || points.length < 2) {
    console.log('[SW] Not enough points — skipping flush');
    await clearPoints();
    return;
  }

  if (!token) {
    console.log('[SW] No auth token in IndexedDB — cannot flush');
    await clearPoints();
    return;
  }

  // Filter inaccurate points
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
      const spd  = (d / tSec) * 3.6;
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
    totalDurationSeconds:   durationSec,
  };

  const base = apiUrl || 'http://localhost:5000';

  try {
    const res = await fetch(`${base}/api/trips`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      await clearPoints();
      await saveMeta('trackingActive', false);
      await showSavedNotification(false);
      // Notify any open tabs
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.postMessage({ type: 'TRIP_SAVED_BY_SW' }));
    } else {
      console.error('[SW] Backend rejected trip:', res.status);
      throw new Error(`Backend ${res.status}`); // Causes BG Sync retry
    }
  } catch (e) {
    if (e.name === 'TypeError') {
      // Network error (offline) — show offline notification
      await showSavedNotification(true);
      await saveMeta('trackingActive', false);
      // Don't clear points — keep for retry on next sync
    }
    throw e; // Re-throw so Background Sync retries
  }
}

// ─── SW Lifecycle ─────────────────────────────────────────────────────────────

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ─── Message handler ──────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    // GPS point from main thread — mirror to IndexedDB
    case 'GPS_POINT':
      appendPoint(payload).then(async () => {
        const pts = await getAllPoints();
        // Only update notification every 5 points (avoid notification spam)
        if (pts.length % 5 === 0 || pts.length <= 2) {
          await showTrackingNotification(pts.length).catch(() => {});
        }
      }).catch(console.error);
      break;

    // Save auth + API URL to IndexedDB for background sync
    case 'SAVE_META':
      saveMeta('token',          payload.token);
      saveMeta('apiUrl',         payload.apiUrl);
      saveMeta('trackingActive', true);
      break;

    // User tapped Stop — flush from IndexedDB
    case 'STOP_TRACKING':
      flushTripToBackend().catch(console.error);
      break;

    // Tab closing while tracking — register Background Sync
    case 'TAB_CLOSING':
      saveMeta('trackingActive', true).then(() => {
        if (self.registration.sync) {
          self.registration.sync
            .register(SYNC_TAG)
            .catch((e) => {
              // Background Sync not supported (e.g. Firefox, iOS Safari)
              // The localStorage queue in the main thread handles this case.
              console.warn('[SW] BG Sync not supported:', e.message);
            });
        }
      }).catch(console.error);
      break;

    // User cancelled — clear everything
    case 'CANCEL_TRACKING':
      clearPoints()
        .then(() => saveMeta('trackingActive', false))
        .then(() =>
          self.registration.getNotifications({ tag: 'gps-tracking' })
            .then((notifs) => notifs.forEach((n) => n.close()))
        )
        .catch(console.error);
      break;

    // Main thread opened/restored — send back any stored points
    case 'GET_STORED_POINTS':
      Promise.all([getAllPoints(), getMeta('trackingActive')]).then(([pts, active]) => {
        event.source?.postMessage({
          type:     'STORED_POINTS',
          points:   pts,
          isActive: !!active,
        });
      }).catch(console.error);
      break;
  }
});

// ─── Background Sync ──────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushTripToBackend());
  }
});

// ─── Notification actions ─────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'stop') {
    event.waitUntil(flushTripToBackend().catch(console.error));
    return;
  }

  // 'open' or body click — focus or open the app
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes('/simulate'));
        if (existing) return existing.focus();
        return self.clients.openWindow('/simulate');
      })
  );
});

// ─── Fetch — network-first with offline fallback ──────────────────────────────
// Only cache static assets. API calls are not cached.

const CACHE_NAME = 'routelytics-shell-v2';
const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/routelytics-icon.svg'];

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip API calls entirely — handled by main thread with localStorage queue
  if (url.pathname.startsWith('/api/')) return;

  // For navigation requests — serve cached shell (SPA support offline)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html') || caches.match('/')
      )
    );
    return;
  }

  // Static assets — cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Cache shell URLs
        if (SHELL_URLS.some((u) => url.pathname === u || url.pathname.endsWith(u))) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
        }
        return response;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
