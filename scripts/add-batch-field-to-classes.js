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

async function addBatchFieldToClasses() {
  try {
    console.log('🔄 Starting batch field migration for classes...');

    // Get all classes
    const classesSnapshot = await getDocs(collection(db, 'classes'));
    
    if (classesSnapshot.empty) {
      console.log('❌ No classes found in the database');
      return;
    }

    console.log(`📚 Found ${classesSnapshot.docs.length} classes to update`);

    // Get all batches to match departments
    const batchesSnapshot = await getDocs(collection(db, 'batches'));
    const batches = batchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📝 Found ${batches.length} batches available for matching`);

    // Update each class with a batch
    let updatedCount = 0;
    
    for (const classDoc of classesSnapshot.docs) {
      const classData = classDoc.data();
      const classId = classDoc.id;
      
      console.log(`\n🔍 Processing class: ${classData.className || classData.name || classId}`);
      
      // Skip if batch field already exists
      if (classData.batchId) {
        console.log(`   ✅ Class already has batch: ${classData.batchId}`);
        continue;
      }

      // Find matching batch based on department
      let selectedBatch = null;
      
      if (classData.department) {
        // Try exact department match
        selectedBatch = batches.find(batch => 
          batch.department === classData.department
        );
        
        // If no exact match, try partial match
        if (!selectedBatch) {
          selectedBatch = batches.find(batch => 
            batch.department?.toLowerCase().includes(classData.department.toLowerCase()) ||
            batch.name?.toLowerCase().includes(classData.department.toLowerCase())
          );
        }
      }
      
      // If still no match, use first available batch
      if (!selectedBatch && batches.length > 0) {
        selectedBatch = batches[0];
        console.log(`   ⚠️  No department match found, using first available batch`);
      }
      
      if (selectedBatch) {
        try {
          await updateDoc(doc(db, 'classes', classId), {
            batchId: selectedBatch.id,
            updatedAt: new Date()
          });
          
          console.log(`   ✅ Updated class "${classData.className || classData.name}" with batch "${selectedBatch.name}" (${selectedBatch.department})`);
          updatedCount++;
        } catch (error) {
          console.error(`   ❌ Failed to update class ${classId}:`, error);
        }
      } else {
        console.log(`   ⚠️  No suitable batch found for class ${classId}`);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`📊 Updated ${updatedCount} out of ${classesSnapshot.docs.length} classes`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
addBatchFieldToClasses();