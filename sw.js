// PolyNet Service Worker for PWA compliance & Background Push Notifications
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

const CACHE_NAME = "polynet-academic-cache-v3";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/logo.png",
  "/shortcut-post.png",
  "/shortcut-chat.png",
  "/shortcut-routine.png",
  "/shortcut-notifications.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((allCaches) => {
      return Promise.all(
        allCaches.filter((c) => c !== CACHE_NAME).map((c) => caches.delete(c))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return Promise.reject("no-cache");
        });
      })
  );
});

// Initialize Firebase Messaging Compat inside Service Worker
try {
  firebase.initializeApp({
    projectId: "hn-vendor",
    appId: "1:80742709078:web:e57290c4e96b9f74af88f7",
    apiKey: "AIzaSyDJfmB5ZRNq_HOSuisvKLDJR978L4jVp2I",
    authDomain: "hn-vendor.firebaseapp.com",
    messagingSenderId: "80742709078"
  });

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Background FCM received:', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || 'PolyNet Notification';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'You have a new update on PolyNet!',
      icon: payload.notification?.icon || payload.notification?.imageUrl || '/logo.png',
      image: payload.notification?.imageUrl || payload.data?.imageUrl || undefined,
      badge: '/logo.png',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      data: {
        url: payload.data?.url || '/',
        type: payload.data?.type || 'general'
      }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn("Firebase SW initialization in sw.js:", e);
}

// Universal Web Push fallback handler (Works even when app is fully closed or in background)
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "PolyNet Notification", body: event.data.text() };
    }
  }
  
  const payload = data.notification || data.data || data;
  const title = payload.title || data.title || "PolyNet Notification";
  const options = {
    body: payload.body || data.body || "You have a new background notification!",
    icon: payload.icon || payload.imageUrl || data.icon || "/logo.png",
    image: payload.imageUrl || data.imageUrl || undefined,
    badge: "/logo.png",
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: {
      url: payload.url || data.url || "/",
      type: payload.type || data.type || "general"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data ? event.notification.data.url : "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

