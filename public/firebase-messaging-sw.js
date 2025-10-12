/**
 * Firebase Messaging Service Worker
 * Web push notifications için gerekli
 */

// Firebase SDK import
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAZdHmOkHazCMnRZuZ6STP17wjG4QMHaxk",
  authDomain: "yenisirket-2ec3b.firebaseapp.com",
  projectId: "yenisirket-2ec3b",
  storageBucket: "yenisirket-2ec3b.firebasestorage.app",
  messagingSenderId: "155422395281",
  appId: "1:155422395281:web:6535d30f4c1ea85280a830"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Messaging servisini al
const messaging = firebase.messaging();

// Background mesajları dinle
messaging.onBackgroundMessage(function(payload) {
  console.log('🔔 Background mesaj alındı:', payload);

  const notificationTitle = payload.notification?.title || 'Solarveyo Bildirim';
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bildirim',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Aç',
        icon: '/favicon.svg'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click listener
self.addEventListener('notificationclick', function(event) {
  console.log('👆 Notification click:', event);
  
  event.notification.close();

  // Uygulamayı aç
  const urlToOpen = event.notification.data?.screen || '/dashboard';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Açık window varsa focus et
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      
      // Yoksa yeni window aç
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + urlToOpen);
      }
    })
  );
});
