'use client';

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, deleteToken } from 'firebase/messaging';

// Hardcoded Firebase Web SDK config (no .env needed)
const firebaseConfig = {
 apiKey: 'AIzaSyAUeI9yTaHngMIoflWcWChBt3QsgdYsqdo',
 authDomain: 'web-push-for-blog-my-site.firebaseapp.com',
 projectId: 'web-push-for-blog-my-site',
 storageBucket: 'web-push-for-blog-my-site.appspot.com',
 messagingSenderId: '28036839013',
 appId: '1:28036839013:web:892792e70532e574d0f88c',
 measurementId: 'G-R02T2DRWBL',
};

const VAPID_PUBLIC_KEY = 'BOEaJTwwlgD5_3a9qESIdk6pBOeBfPcbpN08tx36lcntU0uXB5zkEMPum3bDf2eGefKVBAvpKeApiqatDZ77xhU';

let messaging = null;

export async function ensureFirebaseMessaging() {
 try {
  const supported = await isSupported();
  if (!supported) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  return messaging;
 } catch (e) {
  return null;
 }
}

export async function requestFcmToken(vapidKey, options = {}) {
 try {
  const { forceRefresh = false } = options;
  const m = messaging || (await ensureFirebaseMessaging());
  if (!m) return null;
  if (typeof window !== 'undefined' && Notification && Notification.permission !== 'granted') {
   const perm = await Notification.requestPermission();
   if (perm !== 'granted') return null;
  }
  if (forceRefresh) {
   try { await deleteToken(m); } catch (_) {}
  }
  const token = await getToken(m, { vapidKey: vapidKey || VAPID_PUBLIC_KEY });
  return token || null;
 } catch (e) {
  return null;
 }
}

export function onForegroundMessage(callback) {
 if (!messaging) return () => {};
 try {
  return onMessage(messaging, callback);
 } catch (_) {
  return () => {};
 }
}



