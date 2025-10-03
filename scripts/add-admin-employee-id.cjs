const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, query, where } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAqgG_9dLTa_CvdWUzKqoKd8fHQj8mAJMk",
  authDomain: "attendsmart-24f45.firebaseapp.com",
  projectId: "attendsmart-24f45",
  storageBucket: "attendsmart-24f45.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addAdminEmployeeId() {
  try {
    console.log('🔍 Finding admin users without employee IDs...');
    
    // Get all admin users
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ No admin users found');
      return;
    }

    for (const docSnap of snapshot.docs) {
      const userData = docSnap.data();
      const userId = docSnap.id;
      
      // Check if employeeId already exists
      if (userData.employeeId) {
        console.log(`✅ Admin ${userData.fullName || userData.email} already has Employee ID: ${userData.employeeId}`);
        continue;
      }

      // Generate new employee ID for admin
      // Format: ADM + timestamp + random
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const employeeId = `ADM${timestamp}${random}`;

      // Update the admin user with employee ID
      await updateDoc(doc(db, 'users', userId), {
        employeeId: employeeId,
        updatedAt: new Date()
      });

      console.log(`✅ Added Employee ID "${employeeId}" to admin: ${userData.fullName || userData.email}`);
    }

    console.log('🎉 Admin employee ID assignment completed!');
  } catch (error) {
    console.error('❌ Error adding admin employee IDs:', error);
  }
}

// Run the script
addAdminEmployeeId();