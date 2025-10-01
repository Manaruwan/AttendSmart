import { Timestamp } from 'firebase/firestore';

// Re-export Firebase types for compatibility
export * from './firebaseTypes';
export { Timestamp } from 'firebase/firestore';

// Additional types for face recognition
export interface FaceApiResult {
  detection: any;
  landmarks: any;
  expressions: any;
  ageAndGender?: any;
  descriptor: number[];
}

export interface FaceMatchResult {
  isMatch: boolean;
  confidence: number;
  distance: number;
}

// Staff Leave Request interface
export interface StaffLeaveRequest {
  id?: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  department: string;
  position: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  emergencyContact: string;
  emergencyPhone: string;
  coverageArrangements: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  documents?: File[];
}