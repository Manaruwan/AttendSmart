import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  getDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Assignment, AssignmentSubmission } from '../types';

// Assignment CRUD operations
export const assignmentService = {
  // Create a new assignment
  async createAssignment(assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt' | 'submissions'>): Promise<string> {
    try {
      const assignmentData = {
        ...assignment,
        submissions: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'assignments'), assignmentData);
      
      // Log assignment creation for admin tracking
      console.log(`✅ Assignment created: ${assignment.title} (ID: ${docRef.id})`);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw new Error('Failed to create assignment');
    }
  },

  // Get all assignments
  async getAllAssignments(): Promise<Assignment[]> {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, 'assignments'), orderBy('createdAt', 'desc'))
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Assignment));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw new Error('Failed to fetch assignments');
    }
  },

  // Get assignments by class ID
  async getAssignmentsByClass(classId: string): Promise<Assignment[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'assignments'),
          where('classId', '==', classId),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc')
        )
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Assignment));
    } catch (error) {
      console.error('Error fetching assignments by class:', error);
      throw new Error('Failed to fetch assignments');
    }
  },

  // Get assignments by batch ID
  async getAssignmentsByBatch(batchId: string): Promise<Assignment[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'assignments'),
          where('batchId', '==', batchId),
          where('isActive', '==', true),
          orderBy('createdAt', 'desc')
        )
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Assignment));
    } catch (error) {
      console.error('Error fetching assignments by batch:', error);
      throw new Error('Failed to fetch assignments');
    }
  },

  // Get assignments by lecturer ID
  async getAssignmentsByLecturer(lecturerId: string): Promise<Assignment[]> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, 'assignments'),
          where('lecturerId', '==', lecturerId),
          orderBy('createdAt', 'desc')
        )
      );
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Assignment));
    } catch (error) {
      console.error('Error fetching assignments by lecturer:', error);
      throw new Error('Failed to fetch assignments');
    }
  },

  // Get assignment by ID
  async getAssignmentById(assignmentId: string): Promise<Assignment | null> {
    try {
      const docSnap = await getDoc(doc(db, 'assignments', assignmentId));
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Assignment;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching assignment by ID:', error);
      throw new Error('Failed to fetch assignment');
    }
  },

  // Update assignment
  async updateAssignment(assignmentId: string, updates: Partial<Assignment>): Promise<void> {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      await updateDoc(assignmentRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw new Error('Failed to update assignment');
    }
  },

  // Delete assignment (soft delete)
  async deleteAssignment(assignmentId: string): Promise<void> {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      await updateDoc(assignmentRef, {
        isActive: false,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw new Error('Failed to delete assignment');
    }
  },

  // Hard delete assignment (permanent)
  async permanentDeleteAssignment(assignmentId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'assignments', assignmentId));
    } catch (error) {
      console.error('Error permanently deleting assignment:', error);
      throw new Error('Failed to permanently delete assignment');
    }
  },

  // Add submission to assignment
  async addSubmission(assignmentId: string, submission: AssignmentSubmission): Promise<void> {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      
      if (assignmentDoc.exists()) {
        const currentAssignment = assignmentDoc.data() as Assignment;
        const updatedSubmissions = [...(currentAssignment.submissions || []), submission];
        
        await updateDoc(assignmentRef, {
          submissions: updatedSubmissions,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error adding submission:', error);
      throw new Error('Failed to add submission');
    }
  },

  // Update submission
  async updateSubmission(assignmentId: string, studentId: string, updates: Partial<AssignmentSubmission>): Promise<void> {
    try {
      const assignmentRef = doc(db, 'assignments', assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      
      if (assignmentDoc.exists()) {
        const currentAssignment = assignmentDoc.data() as Assignment;
        const submissions = currentAssignment.submissions || [];
        
        const submissionIndex = submissions.findIndex(sub => sub.studentId === studentId);
        if (submissionIndex !== -1) {
          submissions[submissionIndex] = { ...submissions[submissionIndex], ...updates };
          
          await updateDoc(assignmentRef, {
            submissions,
            updatedAt: Timestamp.now()
          });
        }
      }
    } catch (error) {
      console.error('Error updating submission:', error);
      throw new Error('Failed to update submission');
    }
  }
};
