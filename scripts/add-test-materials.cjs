const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDocs, collection, query, where } = require('firebase/firestore');

// Firebase config (copy from your firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDGpPmx_tFRmqfzSyPqNIhOvF5Gzqf_pqs",
  authDomain: "attendsmart-8c4e7.firebaseapp.com",
  projectId: "attendsmart-8c4e7",
  storageBucket: "attendsmart-8c4e7.appspot.com",
  messagingSenderId: "294518588960",
  appId: "1:294518588960:web:7e8a4f3d2f3e8b1d2f3e8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addTestMaterials() {
  try {
    console.log('🔍 Searching for assignment "dfdsf"...');
    
    // Find the assignment with title "dfdsf"
    const assignmentsQuery = query(
      collection(db, 'assignments'),
      where('title', '==', 'dfdsf')
    );
    
    const querySnapshot = await getDocs(assignmentsQuery);
    
    if (querySnapshot.empty) {
      console.log('❌ Assignment "dfdsf" not found');
      return;
    }
    
    const assignmentDoc = querySnapshot.docs[0];
    const assignmentId = assignmentDoc.id;
    
    console.log('✅ Found assignment:', assignmentId);
    
    // Add test file materials
    const testMaterials = {
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: 'Sample_Assignment_Materials.pdf',
      fileSize: 13264, // Size in bytes
      fileType: 'application/pdf',
      instructions: 'Download and review the assignment materials before starting your work.'
    };
    
    // Update the assignment
    await updateDoc(doc(db, 'assignments', assignmentId), testMaterials);
    
    console.log('✅ Test materials added successfully!');
    console.log('📁 File URL:', testMaterials.fileUrl);
    console.log('📋 File Name:', testMaterials.fileName);
    console.log('📊 File Size:', Math.round(testMaterials.fileSize / 1024), 'KB');
    
    console.log('\n🎯 Now you can test the download functionality!');
    
  } catch (error) {
    console.error('❌ Error adding test materials:', error);
  }
}

// Run the script
addTestMaterials().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});