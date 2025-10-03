const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBy0VBKw4iZAmOW4_LshxhWA89JBTZsJfM",
  authDomain: "smartattend-8chz.firebaseapp.com",
  projectId: "smartattend-8chz",
  storageBucket: "smartattend-8chz.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestAssignment() {
  try {
    console.log('🎯 Creating test assignment with late submission enabled...');

    // Create assignment with deadline in 1 minute (for quick testing)
    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + 1); // 1 minute from now

    const assignmentData = {
      title: 'Test Assignment - Late Submission Enabled',
      description: 'This is a test assignment to demonstrate late submission functionality. The deadline will expire in 1 minute.',
      batchId: 'batch1', // Change this to match your actual batch
      lecturerId: 'lecturer1',
      deadline: Timestamp.fromDate(deadline),
      timeLimit: 1, // 1 minute time limit
      maxMarks: 100,
      instructions: 'This assignment is for testing late submission requests. Wait for it to expire and then test the late submission feature.',
      allowLateSubmission: true, // Enable late submission
      isActive: true,
      createdAt: Timestamp.fromDate(new Date()),
      issuedDate: Timestamp.fromDate(new Date()),
      fileUrl: '',
      fileName: '',
      fileSize: 0,
      fileType: ''
    };

    const docRef = await addDoc(collection(db, 'assignments'), assignmentData);
    
    console.log('✅ Test assignment created successfully!');
    console.log('📋 Assignment ID:', docRef.id);
    console.log('⏰ Deadline:', deadline.toLocaleString());
    console.log('🔄 Late submission enabled: true');
    console.log('');
    console.log('🧪 How to test:');
    console.log('1. Wait 1 minute for the assignment to expire');
    console.log('2. Go to Student Dashboard → My Assignments');
    console.log('3. Look for "Late Submission: Allowed" status');
    console.log('4. Click "Request Late Submission" button when it appears');
    console.log('5. Go to Admin Dashboard → Late Submissions to manage requests');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating test assignment:', error);
  }
}

createTestAssignment();