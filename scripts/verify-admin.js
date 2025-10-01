// Force Admin Account Creation Script
// This script will create or verify the admin account exists

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

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

async function verifyAndCreateAdmin() {
  try {
    console.log('🔍 Verifying admin account...');
    
    // First, try to sign in to check if account exists and is working
    try {
      const signInResult = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('✅ Admin account exists and login works!');
      
      // Check if user document exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', signInResult.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ User document exists in Firestore');
        console.log('👤 User Data:', {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: userData.isActive
        });
        
        if (userData.role === 'admin') {
          console.log('🎉 Admin account is properly configured!');
          console.log('📧 Email: admin@smartattend.com');
          console.log('🔑 Password: Admin@123');
          console.log('🎯 Ready to use!');
          return;
        } else {
          console.log('⚠️  User exists but role is not admin. Updating role...');
          await setDoc(doc(db, 'users', signInResult.user.uid), {
            ...userData,
            role: 'admin',
            permissions: [
              'user_management',
              'class_management',
              'attendance_management',
              'report_generation',
              'system_settings',
              'database_access'
            ],
            updatedAt: serverTimestamp()
          }, { merge: true });
          console.log('✅ Role updated to admin!');
        }
      } else {
        console.log('⚠️  Auth user exists but no Firestore document. Creating document...');
        await createFirestoreDocument(signInResult.user.uid);
      }
      
    } catch (signInError) {
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/wrong-password') {
        console.log('❌ Admin account does not exist or password is wrong. Creating new account...');
        await createNewAdminAccount();
      } else {
        throw signInError;
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    throw error;
  }
}

async function createNewAdminAccount() {
  try {
    console.log('🚀 Creating new admin account...');
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
    const firebaseUser = userCredential.user;
    
    console.log('✅ Firebase Auth user created:', firebaseUser.uid);
    
    // Update profile
    await updateProfile(firebaseUser, {
      displayName: 'System Administrator',
      photoURL: null
    });
    
    // Create Firestore document
    await createFirestoreDocument(firebaseUser.uid);
    
    console.log('🎉 Admin account created successfully!');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('⚠️  Email already in use. Trying to recover...');
      // Try to sign in and create missing Firestore document
      const signInResult = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      await createFirestoreDocument(signInResult.user.uid);
    } else {
      throw error;
    }
  }
}

async function createFirestoreDocument(userId) {
  const adminUser = {
    id: userId,
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
  
  await setDoc(doc(db, 'users', userId), adminUser);
  console.log('✅ Firestore document created for admin user');
}

// Run the verification and creation
verifyAndCreateAdmin()
  .then(() => {
    console.log('');
    console.log('🏆 ADMIN ACCOUNT READY!');
    console.log('📧 Email: admin@smartattend.com');
    console.log('🔑 Password: Admin@123');
    console.log('🌐 Login at: http://localhost:5174/firebase-login');
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to setup admin account:', error);
    process.exit(1);
  });