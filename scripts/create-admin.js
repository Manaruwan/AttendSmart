// Admin Account Creation Script
// Run this script to create the default admin account for SmartAttend

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB36Ak1zysY2wH7VfQDQOIOjQMNOft5dU0",
  authDomain: "smartattend-9cbc2.firebaseapp.com",
  projectId: "smartattend-9cbc2",
  storageBucket: "smartattend-9cbc2.firebasestorage.app",
  messagingSenderId: "723575726133",
  appId: "1:723575726133:web:e8eab1e314ad38dc3f117c",
  measurementId: "G-0ED4KZRL64"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin credentials
const ADMIN_EMAIL = 'admin@smartattend.com';
const ADMIN_PASSWORD = 'Admin@123';

async function createAdminAccount() {
  try {
    console.log('Creating admin account...');
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const firebaseUser = userCredential.user;
    
    console.log('Firebase Auth user created:', firebaseUser.uid);
    
    // Update profile
    await updateProfile(firebaseUser, {
      displayName: 'System Administrator',
      photoURL: null
    });
    
    // Create admin user document in Firestore
    const adminUser = {
      id: firebaseUser.uid,
      email: ADMIN_EMAIL,
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      phoneNumber: '+94000000000',
      isActive: true,
      permissions: [
        'user_management',
        'class_management', 
        'attendance_management',
        'report_generation',
        'system_settings',
        'database_access'
      ],
      department: 'IT Administration',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', firebaseUser.uid), adminUser);
    
    console.log('✅ Admin account created successfully!');
    console.log('📧 Email: admin@smartattend.com');
    console.log('🔑 Password: Admin@123');
    console.log('🎯 Role: admin');
    console.log('');
    console.log('You can now login to the system using these credentials.');
    
    process.exit(0);
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Admin account already exists!');
      console.log('📧 Email: admin@smartattend.com');
      console.log('🔑 Password: Admin@123');
      console.log('');
      console.log('You can login with the existing credentials.');
    } else {
      console.error('❌ Error creating admin account:', error.message);
    }
    process.exit(1);
  }
}

// Run the script
createAdminAccount();