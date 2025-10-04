import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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
const db = getFirestore(app);

// Generate attendance link for a class
function generateAttendanceLink(classId) {
  const baseUrl = 'https://attendsmart.vercel.app'; // Your deployed app URL
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${baseUrl}/attendance/${classId}/${timestamp}-${randomString}`;
}

async function fixAttendanceLinks() {
  console.log('🔧 Starting to fix attendance links...');
  
  try {
    // Get all classes
    const classesSnapshot = await getDocs(collection(db, 'classes'));
    const classes = classesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📚 Found ${classes.length} classes to process`);

    let fixedCount = 0;

    for (const classData of classes) {
      try {
        // Check if attendance link is null or missing
        if (!classData.attendanceLink || classData.attendanceLink === null) {
          const newAttendanceLink = generateAttendanceLink(classData.id);
          
          // Update the class document
          await updateDoc(doc(db, 'classes', classData.id), {
            attendanceLink: newAttendanceLink,
            attendanceLinkGeneratedAt: new Date()
          });

          console.log(`✅ Fixed attendance link for class: ${classData.className || classData.courseCode || classData.id}`);
          console.log(`   New link: ${newAttendanceLink}`);
          fixedCount++;
        } else {
          console.log(`ℹ️ Class ${classData.className || classData.courseCode || classData.id} already has an attendance link`);
        }
      } catch (error) {
        console.error(`❌ Error fixing class ${classData.id}:`, error);
      }
    }

    console.log(`\n🎉 Completed! Fixed ${fixedCount} attendance links out of ${classes.length} classes.`);

  } catch (error) {
    console.error('❌ Error fixing attendance links:', error);
  }
}

// Run the fix
fixAttendanceLinks();