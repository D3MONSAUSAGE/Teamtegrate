// Firebase messaging service worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAvJimzk_C9YenP4sZL4lYyBxcrCukSO4M",
  authDomain: "teamtegrate-mobile.firebaseapp.com",
  projectId: "teamtegrate-mobile",
  storageBucket: "teamtegrate-mobile.firebasestorage.app",
  messagingSenderId: "584796006988",
  appId: "1:584796006988:android:a849a9b070c56f7f5da2e9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.data?.type || 'default',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: {
      url: payload.data?.url || '/',
      ...payload.data
    }
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to focus existing window
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window if no existing window found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Keep service worker active
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle push events (fallback for non-Firebase messages)
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      requireInteraction: true,
      data: data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});
