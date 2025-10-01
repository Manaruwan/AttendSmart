import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { AttendanceRecord, CampusLocation } from '../types/firebaseTypes';

export class AttendanceService {
  
  // Mark attendance with face and location verification
  static async markAttendance(data: {
    studentId: string;
    classId: string;
    faceVerified: boolean;
    locationVerified: boolean;
    faceConfidence?: number;
    location?: { lat: number; lng: number };
    capturedImage?: string;
    markedBy?: string;
    notes?: string;
  }): Promise<AttendanceRecord> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const attendanceId = `${data.studentId}_${data.classId}_${today}`;
      
      // Check if attendance already marked for today
      const existingDoc = await getDoc(doc(db, 'attendance', attendanceId));
      
      if (existingDoc.exists()) {
        throw new Error('Attendance already marked for today');
      }

      // Determine status based on verification
      let status: AttendanceRecord['status'] = 'absent';
      if (data.faceVerified && data.locationVerified) {
        status = 'present';
      } else if (data.faceVerified || data.locationVerified) {
        status = 'late'; // Partial verification
      }

      const attendanceRecord: AttendanceRecord = {
        id: attendanceId,
        studentId: data.studentId,
        classId: data.classId,
        date: today,
        time: serverTimestamp() as Timestamp,
        locationVerified: data.locationVerified,
        faceVerified: data.faceVerified,
        status,
        location: data.location,
        faceConfidence: data.faceConfidence,
        capturedImage: data.capturedImage,
        markedBy: data.markedBy,
        notes: data.notes,
        createdAt: serverTimestamp() as Timestamp
      };

      await setDoc(doc(db, 'attendance', attendanceId), attendanceRecord);
      
      return attendanceRecord;
    } catch (error: any) {
      console.error('Mark attendance error:', error);
      throw new Error(error.message || 'Failed to mark attendance');
    }
  }

  // Upload captured face image to Firebase Storage
  static async uploadFaceImage(
    studentId: string, 
    imageBlob: Blob, 
    type: 'reference' | 'attendance'
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const filename = `${type}_${studentId}_${timestamp}.jpg`;
      const storageRef = ref(storage, `face-images/${type}/${filename}`);
      
      const snapshot = await uploadBytes(storageRef, imageBlob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Face image upload error:', error);
      throw new Error(error.message || 'Failed to upload face image');
    }
  }

  // Get attendance records for a student
  static async getStudentAttendance(
    studentId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<AttendanceRecord[]> {
    try {
      let q = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      let records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceRecord));

      // Filter by date range if provided
      if (startDate || endDate) {
        records = records.filter(record => {
          if (startDate && record.date < startDate) return false;
          if (endDate && record.date > endDate) return false;
          return true;
        });
      }

      return records;
    } catch (error: any) {
      console.error('Get student attendance error:', error);
      throw new Error(error.message || 'Failed to fetch attendance records');
    }
  }

  // Get attendance records for a class
  static async getClassAttendance(
    classId: string, 
    date?: string
  ): Promise<AttendanceRecord[]> {
    try {
      let q = query(
        collection(db, 'attendance'),
        where('classId', '==', classId)
      );

      if (date) {
        q = query(q, where('date', '==', date));
      }

      q = query(q, orderBy('time', 'desc'));

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AttendanceRecord));
    } catch (error: any) {
      console.error('Get class attendance error:', error);
      throw new Error(error.message || 'Failed to fetch class attendance');
    }
  }

  // Verify if location is within campus boundaries
  static async verifyLocation(
    lat: number, 
    lng: number, 
    campusId?: string
  ): Promise<{ isValid: boolean; campus?: CampusLocation }> {
    try {
      // Get campus locations
      let campusQuery = query(collection(db, 'campusLocations'), where('isActive', '==', true));
      
      if (campusId) {
        campusQuery = query(campusQuery, where('id', '==', campusId));
      }

      const campusSnapshot = await getDocs(campusQuery);
      
      for (const campusDoc of campusSnapshot.docs) {
        const campus = campusDoc.data() as CampusLocation;
        
        // Check if location is within campus radius
        for (const boundary of campus.boundaries) {
          const distance = this.calculateDistance(lat, lng, boundary.lat, boundary.lng);
          
          if (distance <= campus.radius) {
            return { isValid: true, campus };
          }
        }
      }

      return { isValid: false };
    } catch (error: any) {
      console.error('Location verification error:', error);
      throw new Error(error.message || 'Failed to verify location');
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  private static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Get attendance statistics
  static async getAttendanceStats(
    classId?: string, 
    studentId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
  }> {
    try {
      let q = query(collection(db, 'attendance'));

      if (classId) {
        q = query(q, where('classId', '==', classId));
      }

      if (studentId) {
        q = query(q, where('studentId', '==', studentId));
      }

      const querySnapshot = await getDocs(q);
      let records = querySnapshot.docs.map(doc => doc.data() as AttendanceRecord);

      // Filter by date range
      if (startDate || endDate) {
        records = records.filter(record => {
          if (startDate && record.date < startDate) return false;
          if (endDate && record.date > endDate) return false;
          return true;
        });
      }

      const totalDays = records.length;
      const presentDays = records.filter(r => r.status === 'present').length;
      const absentDays = records.filter(r => r.status === 'absent').length;
      const lateDays = records.filter(r => r.status === 'late').length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      return {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      };
    } catch (error: any) {
      console.error('Get attendance stats error:', error);
      throw new Error(error.message || 'Failed to calculate attendance statistics');
    }
  }

  // Bulk mark attendance (for manual entry by staff/lecturer)
  static async bulkMarkAttendance(
    attendanceRecords: Omit<AttendanceRecord, 'id' | 'createdAt' | 'time'>[]
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const record of attendanceRecords) {
        const attendanceId = `${record.studentId}_${record.classId}_${record.date}`;
        const docRef = doc(db, 'attendance', attendanceId);
        
        const fullRecord: AttendanceRecord = {
          ...record,
          id: attendanceId,
          time: serverTimestamp() as Timestamp,
          createdAt: serverTimestamp() as Timestamp
        };

        batch.set(docRef, fullRecord);
      }

      await batch.commit();
    } catch (error: any) {
      console.error('Bulk mark attendance error:', error);
      throw new Error(error.message || 'Failed to bulk mark attendance');
    }
  }

  // Update attendance record
  static async updateAttendance(
    attendanceId: string, 
    updates: Partial<AttendanceRecord>
  ): Promise<void> {
    try {
      await setDoc(doc(db, 'attendance', attendanceId), updates, { merge: true });
    } catch (error: any) {
      console.error('Update attendance error:', error);
      throw new Error(error.message || 'Failed to update attendance');
    }
  }

  // Get current location from browser
  static async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Location access denied: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }
}
