import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  ClassSchedule, 
  Batch, 
  Assignment, 
  Exam, 
  LeaveRequest, 
  PayrollRecord, 
  AttendanceAnalytics,
  NotificationRecord,
  CampusLocation 
} from '../types/firebaseTypes';

export class DatabaseService {

  // ==================== CLASS MANAGEMENT ====================
  
  static async createClass(classData: Omit<ClassSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'classes'));
      const newClass: ClassSchedule = {
        ...classData,
        id: docRef.id,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(docRef, newClass);
      return docRef.id;
    } catch (error: any) {
      console.error('Create class error:', error);
      throw new Error(error.message || 'Failed to create class');
    }
  }

  static async getClasses(lecturerId?: string): Promise<ClassSchedule[]> {
    try {
      let q = query(collection(db, 'classes'), where('isActive', '==', true));
      
      if (lecturerId) {
        q = query(q, where('lecturerId', '==', lecturerId));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ClassSchedule));
    } catch (error: any) {
      console.error('Get classes error:', error);
      throw new Error(error.message || 'Failed to fetch classes');
    }
  }

  // ==================== BATCH MANAGEMENT ====================
  
  static async createBatch(batchData: Omit<Batch, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'batches'));
      const newBatch: Batch = {
        ...batchData,
        id: docRef.id,
        createdAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(docRef, newBatch);
      return docRef.id;
    } catch (error: any) {
      console.error('Create batch error:', error);
      throw new Error(error.message || 'Failed to create batch');
    }
  }

  static async getBatches(): Promise<Batch[]> {
    try {
      const q = query(collection(db, 'batches'), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Batch));
    } catch (error: any) {
      console.error('Get batches error:', error);
      throw new Error(error.message || 'Failed to fetch batches');
    }
  }

  // ==================== ASSIGNMENT MANAGEMENT ====================
  
  static async createAssignment(assignmentData: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'assignments'));
      const newAssignment: Assignment = {
        ...assignmentData,
        id: docRef.id,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(docRef, newAssignment);
      return docRef.id;
    } catch (error: any) {
      console.error('Create assignment error:', error);
      throw new Error(error.message || 'Failed to create assignment');
    }
  }

  static async getAssignments(classId?: string, batchId?: string): Promise<Assignment[]> {
    try {
      let q = query(collection(db, 'assignments'), where('isActive', '==', true));
      
      if (classId) {
        q = query(q, where('classId', '==', classId));
      }
      
      if (batchId) {
        q = query(q, where('batchId', '==', batchId));
      }

      q = query(q, orderBy('deadline', 'desc'));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Assignment));
    } catch (error: any) {
      console.error('Get assignments error:', error);
      throw new Error(error.message || 'Failed to fetch assignments');
    }
  }

  // ==================== EXAM MANAGEMENT ====================
  
  static async createExam(examData: Omit<Exam, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'exams'));
      const newExam: Exam = {
        ...examData,
        id: docRef.id,
        createdAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(docRef, newExam);
      return docRef.id;
    } catch (error: any) {
      console.error('Create exam error:', error);
      throw new Error(error.message || 'Failed to create exam');
    }
  }

  static async getExams(classId?: string, batchId?: string): Promise<Exam[]> {
    try {
      let q = query(collection(db, 'exams'), where('isActive', '==', true));
      
      if (classId) {
        q = query(q, where('classId', '==', classId));
      }
      
      if (batchId) {
        q = query(q, where('batchId', '==', batchId));
      }

      q = query(q, orderBy('examDate', 'desc'));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Exam));
    } catch (error: any) {
      console.error('Get exams error:', error);
      throw new Error(error.message || 'Failed to fetch exams');
    }
  }

  // ==================== LEAVE REQUEST MANAGEMENT ====================
  
  static async createLeaveRequest(requestData: Omit<LeaveRequest, 'id' | 'requestedAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'leaveRequests'));
      const newRequest: LeaveRequest = {
        ...requestData,
        id: docRef.id,
        requestedAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(docRef, newRequest);
      return docRef.id;
    } catch (error: any) {
      console.error('Create leave request error:', error);
      throw new Error(error.message || 'Failed to create leave request');
    }
  }

  static async getLeaveRequests(userId?: string, status?: LeaveRequest['status']): Promise<LeaveRequest[]> {
    try {
      let q = query(collection(db, 'leaveRequests'));
      
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }
      
      if (status) {
        q = query(q, where('status', '==', status));
      }

      q = query(q, orderBy('requestedAt', 'desc'));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LeaveRequest));
    } catch (error: any) {
      console.error('Get leave requests error:', error);
      throw new Error(error.message || 'Failed to fetch leave requests');
    }
  }

  static async updateLeaveRequestStatus(
    requestId: string, 
    status: LeaveRequest['status'], 
    reviewedBy: string, 
    reviewNotes?: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'leaveRequests', requestId), {
        status,
        reviewedBy,
        reviewNotes,
        reviewedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Update leave request error:', error);
      throw new Error(error.message || 'Failed to update leave request');
    }
  }

  // ==================== PAYROLL MANAGEMENT ====================
  
  static async createPayrollRecord(payrollData: Omit<PayrollRecord, 'id' | 'generatedAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'payroll'));
      const newRecord: PayrollRecord = {
        ...payrollData,
        id: docRef.id,
        generatedAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(docRef, newRecord);
      return docRef.id;
    } catch (error: any) {
      console.error('Create payroll record error:', error);
      throw new Error(error.message || 'Failed to create payroll record');
    }
  }

  static async getPayrollRecords(userId?: string, month?: string): Promise<PayrollRecord[]> {
    try {
      let q = query(collection(db, 'payroll'));
      
      if (userId) {
        q = query(q, where('userId', '==', userId));
      }
      
      if (month) {
        q = query(q, where('month', '==', month));
      }

      q = query(q, orderBy('generatedAt', 'desc'));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PayrollRecord));
    } catch (error: any) {
      console.error('Get payroll records error:', error);
      throw new Error(error.message || 'Failed to fetch payroll records');
    }
  }

  // ==================== ANALYTICS ====================
  
  static async saveAnalytics(analyticsData: Omit<AttendanceAnalytics, 'id' | 'generatedAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'analytics'));
      const newAnalytics: AttendanceAnalytics = {
        ...analyticsData,
        id: docRef.id,
        generatedAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(docRef, newAnalytics);
      return docRef.id;
    } catch (error: any) {
      console.error('Save analytics error:', error);
      throw new Error(error.message || 'Failed to save analytics');
    }
  }

  static async getAnalytics(
    type: AttendanceAnalytics['type'], 
    classId?: string, 
    batchId?: string
  ): Promise<AttendanceAnalytics[]> {
    try {
      let q = query(collection(db, 'analytics'), where('type', '==', type));
      
      if (classId) {
        q = query(q, where('classId', '==', classId));
      }
      
      if (batchId) {
        q = query(q, where('batchId', '==', batchId));
      }

      q = query(q, orderBy('date', 'desc'), limit(30));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceAnalytics));
    } catch (error: any) {
      console.error('Get analytics error:', error);
      throw new Error(error.message || 'Failed to fetch analytics');
    }
  }

  // ==================== NOTIFICATIONS ====================
  
  static async createNotification(notificationData: Omit<NotificationRecord, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'notifications'));
      const newNotification: NotificationRecord = {
        ...notificationData,
        id: docRef.id,
        createdAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(docRef, newNotification);
      return docRef.id;
    } catch (error: any) {
      console.error('Create notification error:', error);
      throw new Error(error.message || 'Failed to create notification');
    }
  }

  static async getUserNotifications(userId: string, unreadOnly = false): Promise<NotificationRecord[]> {
    try {
      let q = query(collection(db, 'notifications'), where('userId', '==', userId));
      
      if (unreadOnly) {
        q = query(q, where('isRead', '==', false));
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(50));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as NotificationRecord));
    } catch (error: any) {
      console.error('Get notifications error:', error);
      throw new Error(error.message || 'Failed to fetch notifications');
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true
      });
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      throw new Error(error.message || 'Failed to mark notification as read');
    }
  }

  // ==================== CAMPUS LOCATIONS ====================
  
  static async createCampusLocation(locationData: Omit<CampusLocation, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = doc(collection(db, 'campusLocations'));
      const newLocation: CampusLocation = {
        ...locationData,
        id: docRef.id,
        createdAt: serverTimestamp() as Timestamp
      };
      
      await setDoc(docRef, newLocation);
      return docRef.id;
    } catch (error: any) {
      console.error('Create campus location error:', error);
      throw new Error(error.message || 'Failed to create campus location');
    }
  }

  static async getCampusLocations(): Promise<CampusLocation[]> {
    try {
      const q = query(collection(db, 'campusLocations'), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CampusLocation));
    } catch (error: any) {
      console.error('Get campus locations error:', error);
      throw new Error(error.message || 'Failed to fetch campus locations');
    }
  }

  // ==================== REAL-TIME LISTENERS ====================
  
  static subscribeToCollection<T>(
    collectionName: string, 
    callback: (data: T[]) => void,
    constraints: any[] = []
  ): Unsubscribe {
    let q = query(collection(db, collectionName), ...constraints);
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as T));
      callback(data);
    });
  }

  static subscribeToDocument<T>(
    collectionName: string, 
    documentId: string, 
    callback: (data: T | null) => void
  ): Unsubscribe {
    return onSnapshot(doc(db, collectionName, documentId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as T);
      } else {
        callback(null);
      }
    });
  }

  // ==================== BATCH OPERATIONS ====================
  
  static async batchWrite(operations: Array<{
    type: 'set' | 'update' | 'delete';
    collection: string;
    docId: string;
    data?: any;
  }>): Promise<void> {
    try {
      const batch = writeBatch(db);

      operations.forEach(op => {
        const docRef = doc(db, op.collection, op.docId);
        
        switch (op.type) {
          case 'set':
            batch.set(docRef, op.data);
            break;
          case 'update':
            batch.update(docRef, op.data);
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
    } catch (error: any) {
      console.error('Batch write error:', error);
      throw new Error(error.message || 'Failed to execute batch operations');
    }
  }

  // ==================== GENERIC CRUD OPERATIONS ====================
  
  static async create<T extends Record<string, any>>(collection: string, data: T): Promise<string> {
    try {
      const docRef = doc(db, collection);
      await setDoc(docRef, data);
      return docRef.id;
    } catch (error: any) {
      console.error(`Create ${collection} error:`, error);
      throw new Error(error.message || `Failed to create ${collection}`);
    }
  }

  static async getById<T>(collection: string, id: string): Promise<T | null> {
    try {
      const docSnap = await getDoc(doc(db, collection, id));
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
    } catch (error: any) {
      console.error(`Get ${collection} by ID error:`, error);
      throw new Error(error.message || `Failed to fetch ${collection}`);
    }
  }

  static async update<T>(collection: string, id: string, updates: Partial<T>): Promise<void> {
    try {
      await updateDoc(doc(db, collection, id), updates as any);
    } catch (error: any) {
      console.error(`Update ${collection} error:`, error);
      throw new Error(error.message || `Failed to update ${collection}`);
    }
  }

  static async delete(collection: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, collection, id));
    } catch (error: any) {
      console.error(`Delete ${collection} error:`, error);
      throw new Error(error.message || `Failed to delete ${collection}`);
    }
  }
}
