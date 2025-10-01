import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

// Replace with your actual Firebase configuration
// Get these values from Firebase Console > Project Settings > General
export const firebaseConfig = {
  apiKey: "AIzaSyB36Ak1zysY2wH7VfQDQOIOjQMNOft5dU0",
  authDomain: "smartattend-9cbc2.firebaseapp.com",
  projectId: "smartattend-9cbc2",
  storageBucket: "smartattend-9cbc2.firebasestorage.app",
  messagingSenderId: "723575726133",
  appId: "1:723575726133:web:e8eab1e314ad38dc3f117c",
  measurementId: "G-0ED4KZRL64"
};

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