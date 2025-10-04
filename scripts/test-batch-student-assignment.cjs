// Test script to create a batch and assign student
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyDT2q3xByYPVU1E0QZdPKsR6IU5j_F9Ceg",
  authDomain: "attendsmart-51b77.firebaseapp.com",
  projectId: "attendsmart-51b77",
  storageBucket: "attendsmart-51b77.firebasestorage.app",
  messagingSenderId: "544013034869",
  appId: "1:544013034869:web:89d9c6c7e8e6e1b17ecfde"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestBatchAndAssignStudent() {
  try {
    console.log('🚀 Starting batch creation and student assignment...');
    
    // 1. Create a test batch
    const batchData = {
      name: 'SE-2025-01',
      year: 2025,
      department: 'Software Engineering',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const batchRef = await addDoc(collection(db, 'batches'), batchData);
    console.log('✅ Created batch:', batchRef.id, 'with name:', batchData.name);
    
    // 2. Find student by email
    const studentQuery = query(
      collection(db, 'users'),
      where('email', '==', 'uvindu.manaruwan.2004@gmail.com'),
      where('role', '==', 'student')
    );
    
    const studentSnapshot = await getDocs(studentQuery);
    
    if (studentSnapshot.empty) {
      console.log('❌ Student not found with email: uvindu.manaruwan.2004@gmail.com');
      return;
    }
    
    const studentDoc = studentSnapshot.docs[0];
    const studentData = studentDoc.data();
    
    console.log('👨‍🎓 Found student:', studentData.email, 'ID:', studentDoc.id);
    
    // 3. Assign batch to student
    await updateDoc(doc(db, 'users', studentDoc.id), {
      batchId: batchRef.id,
      updatedAt: new Date()
    });
    
    console.log('✅ Assigned batch', batchData.name, 'to student', studentData.email);
    
    // 4. Check if there are any classes for this batch
    const classQuery = query(
      collection(db, 'classes'),
      where('batchId', '==', batchRef.id)
    );
    
    const classSnapshot = await getDocs(classQuery);
    console.log('📚 Found', classSnapshot.docs.length, 'classes for this batch');
    
    console.log('🎉 Test completed successfully!');
    console.log('📝 Summary:');
    console.log('   - Batch ID:', batchRef.id);
    console.log('   - Batch Name:', batchData.name);
    console.log('   - Student ID:', studentDoc.id);
    console.log('   - Student Email:', studentData.email);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestBatchAndAssignStudent();