import { Timestamp } from 'firebase/firestore';

// Base User Interface
export interface BaseUser {
  id: string;
  email: string;
  role: 'admin' | 'student' | 'lecturer' | 'staff';
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImage?: string;
  faceImageUrl?: string;
  faceDescriptor?: number[]; // For face-api.js face descriptor
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface Student extends BaseUser {
  role: 'student';
  studentId: string;
  batchId: string;
  classIds: string[];
  labIds: string[];
  enrollmentDate: Timestamp;
  parentContact?: string;
  address?: string;
}

export interface Lecturer extends BaseUser {
  role: 'lecturer';
  employeeId: string;
  department: string;
  subjects: string[];
  assignedClasses: string[];
  hireDate: Timestamp;
  qualification?: string;
  specialization?: string;
}

export interface Staff extends BaseUser {
  role: 'staff';
  employeeId: string;
  department: string;
  position: string;
  assignedStudents: string[];
  hireDate: Timestamp;
  workingHours?: {
    start: string;
    end: string;
  };
}

export interface Admin extends BaseUser {
  role: 'admin';
  permissions: string[];
  department?: string;
}

export type User = Student | Lecturer | Staff | Admin;

// Attendance System
export interface AttendanceRecord {
  id?: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD format
  time: Timestamp;
  locationVerified: boolean;
  faceVerified: boolean;
  status: 'present' | 'absent' | 'late' | 'excused';
  location?: {
    lat: number;
    lng: number;
  };
  faceConfidence?: number;
  capturedImage?: string;
  notes?: string;
  markedBy?: string; // Staff/Lecturer who marked attendance
  createdAt: Timestamp;
}

// Classes and Schedules
export interface ClassSchedule {
  id?: string;
  name: string;
  subject: string;
  lecturerId: string;
  batchId: string;
  schedule: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:MM format
    endTime: string;
    room: string;
  }[];
  isActive: boolean;
  semester: string;
  academicYear: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Batch {
  id?: string;
  name: string;
  year: number;
  department: string;
  studentIds: string[];
  classIds: string[];
  isActive: boolean;
  createdAt: Timestamp;
}

// Assignments
export interface Assignment {
  id?: string;
  title: string;
  description: string;
  classId: string;
  batchId: string;
  lecturerId: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  deadline: Timestamp;
  maxMarks: number;
  instructions?: string;
  submissions: AssignmentSubmission[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Assignment file metadata
export interface AssignmentFile {
  id?: string;
  assignmentId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string; // User ID who uploaded
  uploadedAt: Timestamp;
}

export interface AssignmentSubmission {
  studentId: string;
  fileUrl: string;
  submittedAt: Timestamp;
  marks?: number;
  feedback?: string;
  isLate: boolean;
}

// Exams
export interface Exam {
  id?: string;
  title: string;
  classId: string;
  batchId: string;
  lecturerId: string;
  examDate: Timestamp;
  duration: number; // in minutes
  totalMarks: number;
  examDocUrl?: string;
  instructions?: string;
  venue: string;
  type: 'midterm' | 'final' | 'quiz' | 'practical';
  isActive: boolean;
  createdAt: Timestamp;
}

// Leave and Mitigation Requests
export interface LeaveRequest {
  id?: string;
  userId: string; // Student, Staff, or Lecturer
  userRole: 'student' | 'staff' | 'lecturer';
  type: 'sick' | 'personal' | 'emergency' | 'vacation' | 'mitigation';
  startDate: Timestamp;
  endDate: Timestamp;
  reason: string;
  supportingDocuments?: string[]; // URLs to uploaded docs
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string; // Admin who reviewed
  reviewNotes?: string;
  requestedAt: Timestamp;
  reviewedAt?: Timestamp;
}

// Payroll
export interface PayrollRecord {
  id?: string;
  userId: string; // Staff or Lecturer
  month: string; // YYYY-MM format
  basicSalary: number;
  workingDays: number;
  presentDays: number;
  overtime: number;
  deductions: number;
  totalSalary: number;
  attendanceRecords: string[]; // References to attendance records
  status: 'draft' | 'approved' | 'paid';
  generatedAt: Timestamp;
  approvedBy?: string;
  approvedAt?: Timestamp;
  paidAt?: Timestamp;
}

// Employee Attendance (separate from student attendance)
export interface EmployeeAttendanceRecord {
  id?: string;
  userId: string; // Staff or Lecturer
  date: string; // YYYY-MM-DD format
  checkInTime: string;
  checkOutTime?: string;
  status: 'present' | 'absent' | 'late' | 'half-day';
  overtimeHours?: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Analytics
export interface AttendanceAnalytics {
  id?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'semester';
  date: string;
  batchId?: string;
  classId?: string;
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  lateStudents: number;
  attendanceRate: number;
  trends: {
    previousPeriod: number;
    change: number;
  };
  generatedAt: Timestamp;
}

// Notifications
export interface NotificationRecord {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'attendance' | 'assignment' | 'exam' | 'leave' | 'announcement';
  isRead: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

// Campus Location Configuration
export interface CampusLocation {
  id?: string;
  name: string;
  boundaries: {
    lat: number;
    lng: number;
  }[];
  radius: number; // in meters
  isActive: boolean;
  createdAt: Timestamp;
}
