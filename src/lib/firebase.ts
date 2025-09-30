import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, enableNetwork, disableNetwork, initializeFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { Capacitor } from '@capacitor/core';

// Platform kontrolü
const isNativePlatform = Capacitor.isNativePlatform();

// iOS için özel Firebase config - authDomain'i localhost yap
export const firebaseConfig = {
  apiKey: "AIzaSyAZdHmOkHazCMnRZuZ6STP17wjG4QMHaxk",
  authDomain: isNativePlatform ? "localhost" : "yenisirket-2ec3b.firebaseapp.com",
  projectId: "yenisirket-2ec3b",
  storageBucket: "yenisirket-2ec3b.firebasestorage.app",
  messagingSenderId: "155422395281",
  appId: "1:155422395281:web:b496b7e93ae3d0a280a830" // Her zaman web app ID kullan
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services - iOS için özel ayarlar
let auth;
let db;

if (isNativePlatform) {
  // iOS/Android için özel auth initialization
  auth = initializeAuth(app, {
    persistence: indexedDBLocalPersistence
  });
  
  // Firestore için de özel ayarlar - CORS'u bypass et
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true, // Otomatik long polling algılama
    useFetchStreams: false,
    cacheSizeBytes: 50 * 1024 * 1024 // 50MB cache
  });
} else {
  // Web için normal initialization
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Web için persistence
  setPersistence(auth, browserLocalPersistence);
}

export { auth, db };
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Firestore offline persistence
if (!isNativePlatform) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support offline persistence');
    }
  });
}

// Production Firebase Functions kullan
// Emulator devre dışı - direkt production'a bağlan
// if (import.meta.env?.DEV && typeof window !== 'undefined') {
// 	try {
// 		const host = (window.location.hostname || 'localhost');
// 		connectFunctionsEmulator(functions, host, 5001);
// 		// eslint-disable-next-line no-console
// 		console.info(`Connected to Functions emulator at http://${host}:5001`);
// 	} catch (_err) {
// 		// ignore if emulator is not running
// 	}
// }

export default app;
