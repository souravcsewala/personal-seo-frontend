/* global self, importScripts */

// This service worker handles background messages for Firebase Cloud Messaging

importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyAUeI9yTaHngMIoflWcWChBt3QsgdYsqdo',
  authDomain: 'web-push-for-blog-my-site.firebaseapp.com',
  projectId: 'web-push-for-blog-my-site',
  storageBucket: 'web-push-for-blog-my-site.appspot.com',
  messagingSenderId: '28036839013',
  appId: '1:28036839013:web:892792e70532e574d0f88c',
  measurementId: 'G-R02T2DRWBL',
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const title = (payload && payload.notification && payload.notification.title) || 'New update';
  const options = {
    body: (payload && payload.notification && payload.notification.body) || '',
    icon: (payload && payload.notification && payload.notification.icon) || '/favicon.ico',
    data: { url: (payload && payload.data && payload.data.url) || '/' },
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function(event) {
  const url = (event && event.notification && event.notification.data && event.notification.data.url) || '/';
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
    for (let i = 0; i < clientList.length; i++) {
      const client = clientList[i];
      if (client.url === url && 'focus' in client) return client.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});



