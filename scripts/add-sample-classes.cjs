const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBDXXPRgqCrJlSj-FfP3HF3ER0m-ek1s8k",
  authDomain: "face-detection-8a2f3.firebaseapp.com",
  projectId: "face-detection-8a2f3",
  storageBucket: "face-detection-8a2f3.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addSampleClasses() {
  try {
    const sampleClasses = [
      {
        name: 'Advanced Programming',
        className: 'Advanced Programming',
        code: 'CS301',
        subject: 'Computer Science',
        lecturer: 'Uvindu Manaruwan',
        lecturerId: 'lecturer1',
        department: 'Computer Science',
        room: 'Lab 3',
        building: 'Main Building',
        day: 'Monday',
        startTime: '02:39',
        endTime: '02:39',
        capacity: 30,
        enrolled: 0,
        enrolledStudents: 0,
        semester: '2024-1',
        academic_year: '2024',
        year: '2024',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: 'Mathematics',
        className: 'Mathematics',
        code: 'MATH202',
        subject: 'Mathematics',
        lecturer: 'Uvindu Manaruwan',
        lecturerId: 'lecturer1',
        department: 'Mathematics',
        room: 'Lab 3',
        building: 'Science Building',
        day: 'Monday',
        startTime: '02:57',
        endTime: '18:01',
        capacity: 25,
        enrolled: 0,
        enrolledStudents: 0,
        semester: '2024-1',
        academic_year: '2024',
        year: '2024',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      },
      {
        name: 'Web Development',
        className: 'Web Development',
        code: 'CS201',
        subject: 'Computer Science',
        lecturer: 'test2323',
        lecturerId: 'lecturer2',
        department: 'Computer Science',
        room: 'Lab 1',
        building: 'IT Building',
        day: 'Tuesday',
        startTime: '10:00',
        endTime: '12:00',
        capacity: 35,
        enrolled: 0,
        enrolledStudents: 0,
        semester: '2024-1',
        academic_year: '2024',
        year: '2024',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    ];

    for (const classData of sampleClasses) {
      const docRef = await addDoc(collection(db, 'classes'), classData);
      console.log('Added class with ID:', docRef.id, '- Name:', classData.name);
    }

    console.log('Sample classes added successfully!');
  } catch (error) {
    console.error('Error adding sample classes:', error);
  }
}

addSampleClasses();