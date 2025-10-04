// Script to fix student batch assignments
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccountKey = {
  // You'll need to add your Firebase service account key here
  // For now, this is a demo script structure
};

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccountKey)
// });

const db = getFirestore();

async function fixStudentBatches() {
  try {
    console.log('🔍 Checking current student batch assignments...');
    
    // Get all students
    const studentsSnapshot = await db.collection('users')
      .where('role', '==', 'student')
      .get();
    
    console.log(`📚 Found ${studentsSnapshot.docs.length} students`);
    
    let studentsWithoutBatch = 0;
    let studentsWithBatch = 0;
    
    studentsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`👨‍🎓 ${data.email || data.fullName}: batch=${data.batchId || 'NOT ASSIGNED'}`);
      
      if (data.batchId) {
        studentsWithBatch++;
      } else {
        studentsWithoutBatch++;
      }
    });
    
    console.log(`✅ Students with batch assigned: ${studentsWithBatch}`);
    console.log(`❌ Students without batch: ${studentsWithoutBatch}`);
    
    // Get all batches
    const batchesSnapshot = await db.collection('batches').get();
    console.log(`🎯 Available batches: ${batchesSnapshot.docs.length}`);
    
    batchesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`📋 Batch: ${data.name} (${data.department} - ${data.year})`);
    });
    
    // Auto-assign students without batch to first available batch
    if (studentsWithoutBatch > 0 && batchesSnapshot.docs.length > 0) {
      const firstBatch = batchesSnapshot.docs[0];
      const firstBatchData = firstBatch.data();
      
      console.log(`🔧 Auto-assigning ${studentsWithoutBatch} students to batch: ${firstBatchData.name}`);
      
      const batch = db.batch();
      
      studentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.batchId) {
          batch.update(doc.ref, {
            batchId: firstBatch.id,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
      
      await batch.commit();
      console.log('✅ Batch assignment completed!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// For local testing without Firebase Admin
async function demoRun() {
  console.log('🎭 DEMO MODE - This would fix student batch assignments');
  console.log('📝 Steps that would be performed:');
  console.log('1. Check all students for batch assignment');
  console.log('2. List available batches');
  console.log('3. Auto-assign students to appropriate batches');
  console.log('4. Update student timetables based on batch classes');
  console.log('');
  console.log('💡 To run this with real data, configure Firebase Admin SDK');
}

// Run the demo for now
demoRun();

module.exports = { fixStudentBatches };