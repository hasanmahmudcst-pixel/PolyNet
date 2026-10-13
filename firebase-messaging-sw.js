importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  projectId: "hn-vendor",
  appId: "1:80742709078:web:e57290c4e96b9f74af88f7",
  apiKey: "AIzaSyDJfmB5ZRNq_HOSuisvKLDJR978L4jVp2I",
  authDomain: "hn-vendor.firebaseapp.com",
  messagingSenderId: "80742709078"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background FCM received:', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'PolyNet Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new academic update!',
    icon: payload.notification?.icon || '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data ? (event.notification.data.url || "/") : "/";

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

