import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

// Debug environment variables
console.log('Environment Variables Debug:', {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE
});

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

console.log('Final Firebase Config:', firebaseConfig);

// EXAMPLE of how it should look (with your actual values):
/*
export const firebaseConfig = {
  apiKey: "AIzaSyB0123456789abcdefghijklmnopqrstuvwxyz",
  authDomain: "attendance-system-12345.firebaseapp.com",
  projectId: "attendance-system-12345",
  storageBucket: "attendance-system-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345",
  measurementId: "G-ABCDEF1234"
};
*/

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;