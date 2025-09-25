import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyAZdHmOkHazCMnRZuZ6STP17wjG4QMHaxk",
  authDomain: "yenisirket-2ec3b.firebaseapp.com",
  projectId: "yenisirket-2ec3b",
  storageBucket: "yenisirket-2ec3b.firebasestorage.app",
  messagingSenderId: "155422395281",
  appId: "1:155422395281:web:b496b7e93ae3d0a280a830"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

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
