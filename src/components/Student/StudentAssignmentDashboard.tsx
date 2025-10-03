import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, CheckCircle, AlertCircle, FileText, Award, Download, Upload, Send, File, FileImage, Archive } from 'lucide-react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { FileUploadService } from '../../services/fileUploadService';

// Countdown Timer Component
const CountdownTimer: React.FC<{ 
  assignment: Assignment; 
  currentTime?: Date; 
  lateSubmissionRequests?: {[key: string]: {status: string, extendedDeadline?: any}} 
}> = ({ assignment, currentTime, lateSubmissionRequests }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      if (!assignment.deadline) {
        setTimeLeft('No deadline');
        return;
      }

      // Check for extended deadline from approved late submission request
      const lateRequest = lateSubmissionRequests?.[assignment.id];
      let activeDeadline = assignment.deadline?.toDate ? assignment.deadline.toDate() : new Date(assignment.deadline);
      let isExtended = false;
      
      if (lateRequest && lateRequest.status === 'approved') {
        if (!lateRequest.extendedDeadline) {
          // Approved without extended deadline = unlimited time
          setTimeLeft('No Time Limit (Approved)');
          setIsExpired(false);
          setIsUrgent(false);
          return;
        } else {
          // Approved with extended deadline
          const extendedDeadline = lateRequest.extendedDeadline?.toDate ? 
            lateRequest.extendedDeadline.toDate() : 
            new Date(lateRequest.extendedDeadline);
          activeDeadline = extendedDeadline;
          isExtended = true;
        }
      }

      const now = currentTime || new Date();
      const timeDiff = activeDeadline.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeLeft(isExtended ? 'EXTENDED EXPIRED' : 'EXPIRED');
        setIsExpired(true);
        setIsUrgent(false);
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      // Mark as urgent if less than 1 hour remaining
      setIsUrgent(timeDiff < 1000 * 60 * 60);

      let timeDisplay = '';
      if (days > 0) {
        timeDisplay = `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        timeDisplay = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        timeDisplay = `${minutes}m ${seconds}s`;
      } else {
        timeDisplay = `${seconds}s`;
      }

      // Add prefix for extended deadline
      setTimeLeft(isExtended ? `${timeDisplay} (Extended)` : timeDisplay);
      setIsExpired(false);
    };

    updateTimer();
  }, [assignment.deadline, currentTime, lateSubmissionRequests]);

  const getTimerColor = () => {
    if (timeLeft === 'No Time Limit (Approved)') return 'text-green-600 bg-green-50 border-green-200';
    if (isExpired) return 'text-red-600 bg-red-50 border-red-200';
    if (isUrgent) return 'text-orange-600 bg-orange-50 border-orange-200 animate-pulse';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  return (
    <div className={`px-2 py-1 rounded border text-xs font-medium ${getTimerColor()}`}>
      {timeLeft === 'No Time Limit (Approved)' ? (
        <div className="flex items-center space-x-1">
          <CheckCircle className="w-3 h-3" />
          <span>No Time Limit</span>
        </div>
      ) : isExpired ? (
        <div className="flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>{timeLeft}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{timeLeft}</span>
        </div>
      )}
    </div>
  );
};

interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: any;
  createdAt: any;
  isActive: boolean;
  batchId?: string;
  batchName?: string;
  maxMarks: number;
  timeLimit: number;
  subject?: string;
  status?: string;
  submittedAt?: any;
  score?: number;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  instructions?: string;
  submissionCount?: number;
  maxEditCount?: number;
  allowLateSubmission?: boolean;
}

interface StudentData {
  studentId: string;
  studentName: string;
  batchId: string;
}

const StudentAssignmentDashboard: React.FC = () => {
  const { firebaseUser } = useFirebaseAuth();
  const [assignmentsData, setAssignmentsData] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submittedAssignments, setSubmittedAssignments] = useState<string[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<{[key: string]: number}>({});
  const [lateSubmissionRequests, setLateSubmissionRequests] = useState<{[key: string]: {status: string, extendedDeadline?: any}}>({});

  useEffect(() => {
    if (firebaseUser?.email) {
      fetchStudentData();
    }
  }, [firebaseUser]);

  useEffect(() => {
    if (studentData?.batchId) {
      fetchAssignments();
      fetchSubmittedAssignments();
      fetchLateSubmissionRequests();
    }
  }, [studentData]);

  // Global timer to update component every second for real-time countdown
  useEffect(() => {
    const globalTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(globalTimer);
  }, [setCurrentTime]);

  const fetchStudentData = async () => {
    try {
      console.log('🎓 Fetching student data for:', firebaseUser?.email);
      
      // Get student information from users collection
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', firebaseUser?.email),
        where('role', '==', 'student')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        const userDoc = usersSnapshot.docs[0];
        const userData = userDoc.data();
        console.log('👤 Student data found:', userData);
        console.log('🔍 Full user data structure:', JSON.stringify(userData, null, 2));
        
        // Try multiple ways to extract batch information
        let batchId = userData.batchId || 
                     userData.batch || 
                     userData.assignments?.[0]?.course || 
                     userData.class || 
                     userData.course ||
                     null;
        
        console.log('🎯 Extracted batchId:', batchId);
        console.log('📊 Available userData fields:', Object.keys(userData));
        
        setStudentData({
          studentId: userData.employeeId || userData.id || userDoc.id,
          studentName: (userData.firstName || '') + ' ' + (userData.lastName || userData.name || ''),
          batchId: batchId
        });
        
        console.log('✅ Student data set:', {
          studentId: userData.employeeId || userData.id,
          studentName: (userData.firstName || '') + ' ' + (userData.lastName || userData.name || ''),
          batchId: batchId
        });
      } else {
        console.log('⚠️ No student record found');
      }
    } catch (error) {
      console.error('❌ Error fetching student data:', error);
    }
  };

  // Helper function to get file type icon
  const getFileTypeIcon = (fileType?: string, fileName?: string) => {
    if (!fileType && !fileName) return <FileText className="w-8 h-8 text-blue-600" />;
    
    const type = fileType?.toLowerCase() || '';
    const name = fileName?.toLowerCase() || '';
    
    // Image files
    if (type.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/)) {
      return <FileImage className="w-8 h-8 text-green-600" />;
    }
    
    // Archive files
    if (type.includes('zip') || type.includes('rar') || name.match(/\.(zip|rar|7z|tar|gz)$/)) {
      return <Archive className="w-8 h-8 text-purple-600" />;
    }
    
    // PDF files
    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return <File className="w-8 h-8 text-red-600" />;
    }
    
    // Word documents
    if (type.includes('word') || type.includes('document') || name.match(/\.(doc|docx)$/)) {
      return <FileText className="w-8 h-8 text-blue-600" />;
    }
    
    // PowerPoint files
    if (type.includes('presentation') || name.match(/\.(ppt|pptx)$/)) {
      return <FileText className="w-8 h-8 text-orange-600" />;
    }
    
    // Default file icon
    return <FileText className="w-8 h-8 text-gray-600" />;
  };

  // Helper function to format file size
  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown size';
    
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${Math.round(size / (1024 * 1024))} MB`;
  };

  const fetchSubmittedAssignments = async () => {
    try {
      if (!studentData?.studentId && !firebaseUser?.email) {
        console.log('⚠️ No student ID or email available for fetching submissions');
        return;
      }

      console.log('📊 Fetching submitted assignments for student:', studentData?.studentId || firebaseUser?.email);
      
      // Query submissions by student email (more reliable than studentId)
      const submissionsQuery = query(
        collection(db, 'studentAssignments'),
        where('studentEmail', '==', firebaseUser?.email)
      );
      
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const submittedIds: string[] = [];
      const counts: {[key: string]: number} = {};
      
      submissionsSnapshot.forEach((doc) => {
        const data = doc.data();
        submittedIds.push(data.assignmentId);
        // Count submissions per assignment
        counts[data.assignmentId] = (counts[data.assignmentId] || 0) + 1;
        console.log('📝 Found submission for assignment:', data.assignmentTitle);
      });
      
      setSubmittedAssignments(submittedIds);
      setSubmissionCounts(counts);
      console.log('✅ Submitted assignments loaded:', submittedIds.length);
      
    } catch (error) {
      console.error('❌ Error fetching submitted assignments:', error);
    }
  };

  const fetchLateSubmissionRequests = async () => {
    try {
      if (!firebaseUser?.email) {
        console.log('⚠️ No email available for fetching late submission requests');
        return;
      }

      console.log('📊 Fetching late submission requests for student:', firebaseUser.email);
      
      const requestsQuery = query(
        collection(db, 'lateSubmissionRequests'),
        where('studentEmail', '==', firebaseUser.email)
      );
      
      const requestsSnapshot = await getDocs(requestsQuery);
      const requests: {[key: string]: {status: string, extendedDeadline?: any}} = {};
      
      requestsSnapshot.forEach((doc) => {
        const data = doc.data();
        requests[data.assignmentId] = {
          status: data.status,
          extendedDeadline: data.extendedDeadline
        };
        console.log('📝 Found late submission request for assignment:', data.assignmentTitle, 'Status:', data.status);
      });
      
      setLateSubmissionRequests(requests);
      console.log('✅ Late submission requests loaded:', Object.keys(requests).length);
      
    } catch (error) {
      console.error('❌ Error fetching late submission requests:', error);
    }
  };

  const isAssignmentSubmitted = (assignmentId: string) => {
    return submittedAssignments.includes(assignmentId);
  };

  const canSubmitAssignment = (assignmentId: string) => {
    const maxEditCount = 4; // Allow 4 submissions maximum
    const currentCount = submissionCounts[assignmentId] || 0;
    return currentCount < maxEditCount;
  };

  // Check if assignment time limit has passed
  const isAssignmentTimeLimitExpired = (assignment: Assignment, checkTime?: Date) => {
    if (!assignment.timeLimit || assignment.timeLimit === 0) {
      return false; // No time limit or unlimited time
    }

    const now = checkTime || currentTime || new Date();
    
    // Check if there's an approved late submission request
    const lateRequest = lateSubmissionRequests[assignment.id];
    if (lateRequest && lateRequest.status === 'approved') {
      // If approved but no extended deadline, consider as not expired (unlimited time)
      if (!lateRequest.extendedDeadline) {
        return false;
      }
      // If there's extended deadline, check against that
      const extendedDeadline = lateRequest.extendedDeadline?.toDate ? 
        lateRequest.extendedDeadline.toDate() : 
        new Date(lateRequest.extendedDeadline);
      return now > extendedDeadline;
    }
    
    // Default check against original deadline
    const deadline = assignment.deadline?.toDate ? assignment.deadline.toDate() : new Date(assignment.deadline);
    return now > deadline;
  };

  const getRemainingSubmissions = (assignmentId: string) => {
    const maxEditCount = 4;
    const currentCount = submissionCounts[assignmentId] || 0;
    return Math.max(0, maxEditCount - currentCount);
  };

  // Check late submission request status
  const getLateSubmissionStatus = (assignmentId: string) => {
    return lateSubmissionRequests[assignmentId]?.status || null;
  };

  // Check if student can submit after deadline
  const canSubmitAfterDeadline = (assignment: Assignment) => {
    const lateRequest = lateSubmissionRequests[assignment.id];
    
    // If there's an approved late submission request
    if (lateRequest && lateRequest.status === 'approved') {
      // If no extended deadline is set, allow unlimited submission time
      if (!lateRequest.extendedDeadline) {
        return true;
      }
      
      // Check if extended deadline hasn't passed
      const now = currentTime || new Date();
      const extendedDeadline = lateRequest.extendedDeadline?.toDate ? 
        lateRequest.extendedDeadline.toDate() : 
        new Date(lateRequest.extendedDeadline);
      return now <= extendedDeadline;
    }
    
    return false;
  };

  const fetchAssignments = async () => {
    try {
      console.log('📚 Fetching assignments for batch:', studentData?.batchId);
      
      if (!studentData?.batchId) {
        console.log('⚠️ No batchId available, cannot fetch assignments');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // First, let's check all assignments without filtering
      const allAssignmentsQuery = query(collection(db, 'assignments'));
      const allAssignmentsSnapshot = await getDocs(allAssignmentsQuery);
      
      console.log('📊 Total assignments in database:', allAssignmentsSnapshot.size);
      allAssignmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Assignment:', data.title, 'BatchId:', data.batchId, 'Active:', data.isActive);
      });
      
      // Get assignments for student's batch
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('batchId', '==', studentData?.batchId),
        where('isActive', '==', true)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignments: Assignment[] = [];
      
      console.log('🎯 Filtered assignments for batch', studentData?.batchId, ':', assignmentsSnapshot.size);
      
      assignmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Assignment found:', data.title, data);
        console.log('📁 Materials check:', {
          hasFileUrl: !!data.fileUrl,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          fileType: data.fileType
        });
        
        assignments.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          deadline: data.deadline,
          createdAt: data.createdAt,
          isActive: data.isActive,
          batchId: data.batchId,
          batchName: data.batchName,
          maxMarks: data.maxMarks || 100,
          timeLimit: data.timeLimit || 60,
          subject: data.subject || 'General',
          status: isAssignmentSubmitted(doc.id) ? 'submitted' : 'pending',
          fileUrl: data.fileUrl || '',
          fileName: data.fileName || '',
          fileSize: data.fileSize || 0,
          fileType: data.fileType || '',
          instructions: data.instructions || '',
          allowLateSubmission: data.allowLateSubmission || false
        });
      });
      
      // Sort assignments by createdAt in descending order (newest first)
      assignments.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
      
      console.log('✅ Total assignments loaded:', assignments.length);
      
      // Debug logging for late submission status
      assignments.forEach((assignment) => {
        console.log(`📋 Assignment: ${assignment.title}`);
        console.log(`   - ID: ${assignment.id}`);
        console.log(`   - Time Limit: ${assignment.timeLimit} min`);
        console.log(`   - Deadline: ${assignment.deadline?.toDate ? assignment.deadline.toDate() : assignment.deadline}`);
        console.log(`   - Allow Late Submission: ${assignment.allowLateSubmission}`);
        console.log(`   - Is Expired: ${isAssignmentTimeLimitExpired(assignment, currentTime)}`);
        console.log(`   - Submission Count: ${submissionCounts[assignment.id] || 0}/4`);
        console.log(`   - Can Submit: ${canSubmitAssignment(assignment.id)}`);
      });
      
      setAssignmentsData(assignments);
    } catch (error) {
      console.error('❌ Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Button handlers
  const handleViewAssignment = (assignment: Assignment) => {
    console.log('📖 Viewing assignment:', assignment.title);
    setSelectedAssignment(assignment);
    setShowAssignmentModal(true);
  };

  const handleDownloadAssignment = async (assignment: Assignment) => {
    console.log('📥 Downloading assignment:', assignment.title);
    
    // Check if assignment has file materials
    if (assignment.fileUrl) {
      // If assignment has file materials, download the actual file
      try {
        // Create a temporary anchor element for download
        const link = document.createElement('a');
        link.href = assignment.fileUrl;
        link.download = assignment.fileName || `${assignment.title.replace(/[^a-z0-9]/gi, '_')}_materials`;
        link.target = '_blank'; // Open in new tab as fallback
        link.rel = 'noopener noreferrer'; // Security best practice
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Assignment materials download initiated');
        
      } catch (error) {
        console.error('❌ Error downloading assignment materials:', error);
        
        // Show user-friendly error message
        alert('Unable to download file directly. Opening in new tab...');
        
        // Fallback: try to open URL in new tab
        try {
          window.open(assignment.fileUrl, '_blank', 'noopener,noreferrer');
        } catch (fallbackError) {
          console.error('❌ Fallback download also failed:', fallbackError);
          alert('Download failed. Please contact your instructor for assistance.');
        }
      }
    } else {
      // If no file materials, create assignment content as downloadable text file
      try {
        const assignmentContent = `
ASSIGNMENT: ${assignment.title}
========================================

DESCRIPTION:
${assignment.description}

INSTRUCTIONS:
${assignment.instructions || 'No specific instructions provided.'}

DETAILS:
- Due Date: ${assignment.deadline?.toDate ? assignment.deadline.toDate().toLocaleDateString() : 'Not set'}
- Max Marks: ${assignment.maxMarks}
- Time Limit: ${assignment.timeLimit} minutes
- Subject: ${assignment.subject || 'General'}
- Batch: ${assignment.batchName || assignment.batchId || 'N/A'}

STATUS: ${assignment.status || 'pending'}

========================================
Downloaded on: ${new Date().toLocaleString()}
Student: ${studentData?.studentName || 'Unknown'}
Student ID: ${studentData?.studentId || 'Unknown'}
`;

        // Create and download the file
        const blob = new Blob([assignmentContent], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${assignment.title.replace(/[^a-z0-9]/gi, '_')}_assignment_info.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Assignment info downloaded successfully');
      } catch (error) {
        console.error('❌ Error creating assignment info file:', error);
        alert('Error creating download file. Please try again.');
      }
    }
  };

  const handleSubmitAssignment = (assignment: Assignment) => {
    // Check if assignment time limit has expired
    if (isAssignmentTimeLimitExpired(assignment, currentTime)) {
      alert('Assignment time limit has expired. You can no longer submit this assignment.');
      return;
    }

    // Check if submission limit is reached
    if (!canSubmitAssignment(assignment.id)) {
      alert('You have reached the maximum submission limit (4) for this assignment.');
      return;
    }
    
    console.log('📤 Opening submission for:', assignment.title);
    setSelectedAssignment(assignment);
    setShowSubmissionModal(true);
  };

  const handleRequestLateSubmission = async (assignment: Assignment) => {
    const reason = prompt('Please provide a reason for requesting late submission:');
    if (!reason || !reason.trim()) {
      alert('Please provide a valid reason for late submission.');
      return;
    }

    try {
      // Create late submission request
      const requestData = {
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        studentId: studentData?.studentId || '',
        studentName: studentData?.studentName || '',
        studentEmail: firebaseUser?.email || '',
        batchId: assignment.batchId || '',
        reason: reason.trim(),
        requestedAt: new Date(),
        status: 'pending',
        originalDeadline: assignment.deadline
      };

      await addDoc(collection(db, 'lateSubmissionRequests'), requestData);
      
      alert('Your late submission request has been sent to the admin for review. You will be notified once it is processed.');
      console.log('✅ Late submission request created successfully');
      
      // Refresh late submission requests to update UI
      await fetchLateSubmissionRequests();
    } catch (error) {
      console.error('❌ Error creating late submission request:', error);
      alert('Failed to submit request. Please try again.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSubmissionFile(file);
      console.log('📁 File selected:', file.name);
    }
  };

  const submitAssignmentSubmission = async () => {
    if (!selectedAssignment || (!submissionFile && !submissionText.trim())) {
      alert('Please provide either a file or text submission');
      return;
    }

    try {
      console.log('📤 Submitting assignment:', selectedAssignment.title);
      
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;
      let fileType = '';
      
      // Upload file to Firebase Storage if file is selected
      if (submissionFile) {
        try {
          console.log('📤 Uploading file:', submissionFile.name);
          const uploadUrl = await FileUploadService.uploadAssignmentFile(
            selectedAssignment.id,
            studentData?.studentId || 'unknown',
            submissionFile
          );
          
          fileUrl = uploadUrl;
          fileName = submissionFile.name;
          fileSize = submissionFile.size;
          fileType = submissionFile.type;
          
          console.log('✅ File uploaded successfully:', uploadUrl);
        } catch (uploadError) {
          console.error('❌ File upload failed:', uploadError);
          alert('File upload failed. Please try again.');
          return;
        }
      }
      
      // Prepare submission data for Firebase
      const submissionData = {
        assignmentId: selectedAssignment.id,
        assignmentTitle: selectedAssignment.title,
        studentId: studentData?.studentId || 'unknown',
        studentName: studentData?.studentName || 'Unknown Student',
        studentEmail: firebaseUser?.email || 'unknown@email.com',
        batchId: studentData?.batchId || 'unknown',
        submissionText: submissionText.trim() || '',
        fileName: fileName,
        fileSize: fileSize,
        fileType: fileType,
        fileUrl: fileUrl,
        submittedAt: new Date(),
        status: 'submitted',
        score: null,
        feedback: '',
        gradedAt: null,
        gradedBy: null
      };

      console.log('💾 Saving submission data:', submissionData);
      
      // Save to studentAssignments collection
      const docRef = await addDoc(collection(db, 'studentAssignments'), submissionData);
      console.log('✅ Submission saved with ID:', docRef.id);
      
      // Show success message
      const remainingSubmissions = getRemainingSubmissions(selectedAssignment.id) - 1;
      alert(`Assignment "${selectedAssignment.title}" submitted successfully!\n\nSubmission ID: ${docRef.id}\nSubmitted at: ${new Date().toLocaleString()}\nRemaining submissions: ${remainingSubmissions}\n\nYour submission has been saved and sent for review.`);
      
      // Close modal and reset
      setShowSubmissionModal(false);
      setSubmissionFile(null);
      setSubmissionText('');
      setSelectedAssignment(null);
      
      // Update local submission count
      setSubmissionCounts(prev => ({
        ...prev,
        [selectedAssignment.id]: (prev[selectedAssignment.id] || 0) + 1
      }));
      
      // Optionally refresh assignments to update status
      if (studentData?.batchId) {
        await fetchSubmittedAssignments(); // Refresh submitted assignments first
        await fetchLateSubmissionRequests(); // Refresh late submission requests
        await fetchAssignments(); // Then refresh assignments with updated status
      }
      
    } catch (error) {
      console.error('❌ Error submitting assignment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error submitting assignment: ${errorMessage}\n\nPlease try again or contact support if the problem persists.`);
    }
  };

  const closeAssignmentModal = () => {
    setShowAssignmentModal(false);
    setSelectedAssignment(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  const getDaysUntilDue = (deadline: any) => {
    if (!deadline) return 0;
    const today = new Date();
    const dueDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredAssignments = assignmentsData.filter(assignment => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'overdue') {
      return getDaysUntilDue(assignment.deadline) < 0;
    }
    return assignment.status === selectedFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assignments</h1>
          <p className="text-gray-600">
            {studentData ? `Batch: ${studentData.batchId} • ` : ''}
            View and manage your assignments
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignmentsData.length}</p>
                <p className="text-xs text-blue-600">This semester</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentsData.filter(a => a.status === 'pending').length}
                </p>
                <p className="text-xs text-yellow-600">
                  Need attention
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentsData.filter(a => getDaysUntilDue(a.deadline) < 0).length}
                </p>
                <p className="text-xs text-red-600">Past deadline</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Batch</p>
                <p className="text-lg font-bold text-gray-900">{studentData?.batchId || 'Not Set'}</p>
                <p className="text-xs text-purple-600">Your current batch</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'overdue'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedFilter === filter
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {filter === 'all' ? 'All Assignments' : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full">
          {/* Assignments List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedFilter === 'all' ? 'All Assignments' : `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Assignments`}
            </h2>
            
            {filteredAssignments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
                <p className="text-gray-600">
                  {assignmentsData.length === 0 
                    ? "No assignments have been created for your batch yet."
                    : "No assignments match your current filter."
                  }
                </p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(assignment.status || 'pending')}
                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                        
                        {/* Materials indicator */}
                        {assignment.fileUrl && (
                          <div className="flex items-center space-x-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            <FileText className="w-3 h-3" />
                            <span>Materials</span>
                          </div>
                        )}
                        
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status || 'pending')}`}>
                          {assignment.status || 'pending'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{assignment.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Due Date:</span>
                          <p className="font-medium">
                            {assignment.deadline?.toDate ? 
                              assignment.deadline.toDate().toLocaleDateString() : 
                              'Not set'
                            }
                          </p>
                          {/* Show extended deadline if approved */}
                          {(() => {
                            const lateRequest = lateSubmissionRequests[assignment.id];
                            if (lateRequest && lateRequest.status === 'approved' && lateRequest.extendedDeadline) {
                              const extendedDate = lateRequest.extendedDeadline?.toDate ? 
                                lateRequest.extendedDeadline.toDate() : 
                                new Date(lateRequest.extendedDeadline);
                              return (
                                <p className="text-xs text-green-600 font-medium mt-1">
                                  Extended: {extendedDate.toLocaleDateString()}
                                </p>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div>
                          <span className="text-gray-500">Time Left:</span>
                          <div className="mt-1">
                            <CountdownTimer 
                              assignment={assignment} 
                              currentTime={currentTime} 
                              lateSubmissionRequests={lateSubmissionRequests} 
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Max Marks:</span>
                          <p className="font-medium">{assignment.maxMarks}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Time Limit:</span>
                          <p className={`font-medium ${isAssignmentTimeLimitExpired(assignment, currentTime) ? 'text-red-600' : ''}`}>
                            {assignment.timeLimit} min
                            {isAssignmentTimeLimitExpired(assignment, currentTime) && (
                              <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">EXPIRED</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Late Submission:</span>
                          <p className={`font-medium ${assignment.allowLateSubmission ? 'text-green-600' : 'text-red-600'}`}>
                            {assignment.allowLateSubmission ? 'Allowed' : 'Not Allowed'}
                            {(() => {
                              const requestStatus = getLateSubmissionStatus(assignment.id);
                              const lateRequest = lateSubmissionRequests[assignment.id];
                              const now = currentTime || new Date();
                              const originalDeadline = assignment.deadline?.toDate ? assignment.deadline.toDate() : new Date(assignment.deadline);
                              const isOriginalExpired = now > originalDeadline;
                              
                              if (assignment.allowLateSubmission && isOriginalExpired) {
                                if (requestStatus === 'pending') {
                                  return <span className="ml-2 text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">REQUEST PENDING</span>;
                                } else if (requestStatus === 'approved') {
                                  // Check if no extended deadline (unlimited time)
                                  if (!lateRequest?.extendedDeadline) {
                                    return <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">UNLIMITED TIME</span>;
                                  }
                                  // Check if extended deadline has expired
                                  const extendedDeadline = lateRequest.extendedDeadline?.toDate ? 
                                    lateRequest.extendedDeadline.toDate() : 
                                    new Date(lateRequest.extendedDeadline);
                                  if (now > extendedDeadline) {
                                    return <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">EXTENDED EXPIRED</span>;
                                  }
                                  return <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">APPROVED</span>;
                                } else if (requestStatus === 'rejected') {
                                  return <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">REJECTED</span>;
                                } else {
                                  return <span className="ml-2 text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">AVAILABLE</span>;
                                }
                              } else if (assignment.allowLateSubmission && !isOriginalExpired) {
                                return <span className="ml-2 text-xs bg-green-100 text-green-600 px-2 py-1 rounded">AVAILABLE</span>;
                              }
                              return null;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => handleViewAssignment(assignment)}
                      className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      View Assignment
                    </button>
                    
                    {/* Download Materials Button */}
                    {assignment.fileUrl && (
                      <button 
                        onClick={() => handleDownloadAssignment(assignment)}
                        className="px-4 py-2 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Materials</span>
                      </button>
                    )}
                    
                    {!canSubmitAssignment(assignment.id) ? (
                      <button 
                        disabled
                        className="px-4 py-2 text-sm bg-red-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2"
                        title="Maximum submission limit reached"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Limit Reached</span>
                      </button>
                    ) : (() => {
                      // Check original deadline expiry
                      const now = currentTime || new Date();
                      const originalDeadline = assignment.deadline?.toDate ? assignment.deadline.toDate() : new Date(assignment.deadline);
                      const isOriginalExpired = now > originalDeadline;
                      
                      if (!isOriginalExpired) {
                        // Normal submission (before original deadline)
                        return isAssignmentSubmitted(assignment.id) ? (
                          <button 
                            onClick={() => handleSubmitAssignment(assignment)}
                            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                            title={`${getRemainingSubmissions(assignment.id)} submissions remaining`}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Re-Submit ({getRemainingSubmissions(assignment.id)} left)</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleSubmitAssignment(assignment)}
                            className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                            title={`${getRemainingSubmissions(assignment.id)} submissions remaining`}
                          >
                            <Upload className="w-4 h-4" />
                            <span>Submit ({getRemainingSubmissions(assignment.id)} left)</span>
                          </button>
                        );
                      } else {
                        // After original deadline - check late submission status
                        if (canSubmitAfterDeadline(assignment)) {
                          return isAssignmentSubmitted(assignment.id) ? (
                            <button 
                              onClick={() => handleSubmitAssignment(assignment)}
                              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
                              title={`Late submission approved - ${getRemainingSubmissions(assignment.id)} submissions remaining`}
                            >
                              <Upload className="w-4 h-4" />
                              <span>Re-Submit (Late) ({getRemainingSubmissions(assignment.id)} left)</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleSubmitAssignment(assignment)}
                              className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                              title={`Late submission approved - ${getRemainingSubmissions(assignment.id)} submissions remaining`}
                            >
                              <Upload className="w-4 h-4" />
                              <span>Submit (Late) ({getRemainingSubmissions(assignment.id)} left)</span>
                            </button>
                          );
                        } else {
                          // Check if extended deadline has expired
                          const lateRequest = lateSubmissionRequests[assignment.id];
                          const requestStatus = getLateSubmissionStatus(assignment.id);
                          
                          if (requestStatus === 'approved' && lateRequest?.extendedDeadline) {
                            // Extended deadline has expired
                            return (
                              <button 
                                disabled
                                className="px-4 py-2 text-sm bg-red-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2"
                                title="Extended deadline has expired"
                              >
                                <AlertCircle className="w-4 h-4" />
                                <span>Extended Time Expired</span>
                              </button>
                            );
                          }
                          
                          // Original late submission logic
                          if (assignment.allowLateSubmission) {
                            if (requestStatus === 'pending') {
                              return (
                                <button 
                                  disabled
                                  className="px-4 py-2 text-sm bg-yellow-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2"
                                  title="Late submission request is pending admin approval"
                                >
                                  <Clock className="w-4 h-4" />
                                  <span>Request Pending</span>
                                </button>
                              );
                            } else if (requestStatus === 'rejected') {
                              return (
                                <button 
                                  disabled
                                  className="px-4 py-2 text-sm bg-red-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2"
                                  title="Late submission request was rejected"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                  <span>Request Rejected</span>
                                </button>
                              );
                            } else {
                              return (
                                <button 
                                  onClick={() => handleRequestLateSubmission(assignment)}
                                  className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
                                  title="Request permission for late submission"
                                >
                                  <Clock className="w-4 h-4" />
                                  <span>Request Late Submission</span>
                                </button>
                              );
                            }
                          } else {
                            return (
                              <button 
                                disabled
                                className="px-4 py-2 text-sm bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center space-x-2"
                                title="Assignment time limit has expired - Late submissions not allowed"
                              >
                                <Clock className="w-4 h-4" />
                                <span>Time Expired</span>
                              </button>
                            );
                          }
                        }
                      }
                    })()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assignment Details Modal */}
      {showAssignmentModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedAssignment.title}</h2>
                <button
                  onClick={closeAssignmentModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedAssignment.description}</p>
              </div>
              
              {/* Assignment Instructions */}
              {selectedAssignment.instructions && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Instructions</h3>
                  <p className="text-gray-600">{selectedAssignment.instructions}</p>
                </div>
              )}
              
              {/* Assignment Materials */}
              {selectedAssignment.fileUrl && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Assignment Materials</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getFileTypeIcon(selectedAssignment.fileType, selectedAssignment.fileName)}
                        <div>
                          <p className="font-medium text-blue-900">
                            {selectedAssignment.fileName || 'Assignment Materials'}
                          </p>
                          <p className="text-sm text-blue-700">
                            {formatFileSize(selectedAssignment.fileSize)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadAssignment(selectedAssignment)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Due Date</h4>
                  <p className="text-gray-600">
                    {selectedAssignment.deadline?.toDate ? 
                      selectedAssignment.deadline.toDate().toLocaleDateString() : 
                      'Not set'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Max Marks</h4>
                  <p className="text-gray-600">{selectedAssignment.maxMarks}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Time Limit</h4>
                  <p className="text-gray-600">{selectedAssignment.timeLimit} minutes</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Subject</h4>
                  <p className="text-gray-600">{selectedAssignment.subject}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Status</h4>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedAssignment.status || 'pending')}`}>
                  {selectedAssignment.status || 'pending'}
                </span>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeAssignmentModal}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Submission Modal */}
      {showSubmissionModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Submit Assignment</h2>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-2">Assignment: {selectedAssignment.title}</p>
              
              {/* Submission Count Warning */}
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Submissions remaining:</strong> {getRemainingSubmissions(selectedAssignment.id)} out of 4
                </p>
                {getRemainingSubmissions(selectedAssignment.id) <= 1 && (
                  <p className="text-sm text-red-600 mt-1">
                    ⚠️ This is your last submission attempt!
                  </p>
                )}
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Options</h3>
                
                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload File (PDF, DOC, DOCX, TXT)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mb-4" />
                      <span className="text-sm text-gray-600">
                        {submissionFile ? submissionFile.name : 'Click to upload file or drag and drop'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Text Submission */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or Enter Text Submission
                  </label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter your assignment submission here..."
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You can submit either a file or text, or both. Make sure your submission is complete before clicking Submit.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmissionModal(false)}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitAssignmentSubmission}
                disabled={!submissionFile && !submissionText.trim()}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                <span>Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentAssignmentDashboard;