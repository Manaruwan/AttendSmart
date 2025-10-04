import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase configuration using environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB36Ak1zysY2wH7VfQDQOIOjQMNOft5dU0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartattend-9cbc2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "smartattend-9cbc2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "smartattend-9cbc2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "723575726133",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:723575726133:web:e8eab1e314ad38dc3f117c",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0ED4KZRL64"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging (only if supported)
let messaging: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
    }
  });
}
export { messaging };

// Google Auth Provider with optimized settings
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;