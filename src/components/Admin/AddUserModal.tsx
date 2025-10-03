import React, { useState, useEffect } from 'react';
import { X, Camera, Video, MapPin, Navigation, Plus, Eye, EyeOff } from 'lucide-react';
import { doc, setDoc, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { WebcamCapture } from '../Common/WebcamCapture';
import { Timestamp } from 'firebase/firestore';
import { useToasts } from '../../hooks/useToasts';
import ToastContainer from '../Common/ToastContainer';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const { toasts, showSuccess, showError, removeToast } = useToasts();
  const [formData, setFormData] = useState({
    role: 'student',
    email: '',
    password: '',
    fullName: '',
    nic: '',
    phone: '',
    address: '',
    // Location fields
    latitude: '',
    longitude: '',
    locationName: '',
    // Face photo fields
    facePhoto: null as File | null,
    facePhotoPreview: '',
    // Student fields
    studentId: '',
    batchId: '',
    year: '',
    semester: '',
    dateOfBirth: '', // Add dateOfBirth field
    // Lecturer/Staff fields
    department: '',
    employeeId: '',
    qualification: '',
    subjects: '',
    jobTitle: '',
    employmentType: 'full-time', // Add employment type field
    assignments: [] // Multiple course assignments for lecturers
  });

  const [lecturerAssignments, setLecturerAssignments] = useState<Array<{
    course: string;
    employmentType: string;
    batches: string[];
  }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showWebcamCapture, setShowWebcamCapture] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);
  const [showCustomStudentId, setShowCustomStudentId] = useState(false);
  const [editingBatch, setEditingBatch] = useState<any>(null);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<any>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [newBatchData, setNewBatchData] = useState({
    name: '',
    year: new Date().getFullYear(),
    department: ''
  });

  // Clear messages when modal closes
  const handleClose = () => {
    setError('');
    setSuccess('');
    setShowNewBatchForm(false);
    onClose();
  };

  // Load batches and courses when component mounts
  useEffect(() => {
    const loadBatches = async () => {
      try {
        const batchSnapshot = await getDocs(collection(db, 'batches'));
        let batchData = batchSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // If no batches exist, you can create them manually
        if (batchData.length === 0) {
          console.log('No batches found. Please create batches first.');
        }

        setBatches(batchData);
      } catch (error) {
        console.error('Error loading batches:', error);
      }
    };

    const loadCourses = async () => {
      try {
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = coursesSnapshot.docs.map(doc => doc.data().name);
        
        // Default courses if none exist
        if (coursesData.length === 0) {
          const defaultCourses = [
            'Computer Science',
            'Information Technology', 
            'Software Engineering',
            'Data Science',
            'Cyber Security',
            'Business Information Systems'
          ];
          
          // Save default courses to Firebase
          try {
            for (const course of defaultCourses) {
              await addDoc(collection(db, 'courses'), {
                name: course,
                createdAt: new Date(),
                isDefault: true
              });
            }
            console.log('Default courses saved to Firebase');
          } catch (saveError) {
            console.error('Error saving default courses:', saveError);
          }
          
          setCourses(defaultCourses);
        } else {
          setCourses(coursesData);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
        // Fallback to default courses
        const fallbackCourses = [
          'Computer Science',
          'Information Technology',
          'Software Engineering', 
          'Data Science',
          'Cyber Security',
          'Business Information Systems'
        ];
        setCourses(fallbackCourses);
      }
    };

    if (isOpen) {
      loadBatches();
      loadCourses();
    }
  }, [isOpen]);

  const createNewBatch = async () => {
    if (!newBatchData.name.trim() || !newBatchData.department.trim()) {
      alert('Please fill in all batch details');
      return;
    }

    if (!validateBatchName(newBatchData.name)) {
      alert('Batch name should contain only English letters, numbers, hyphens, and underscores');
      return;
    }

    try {
      const batchData = {
        name: newBatchData.name.trim(),
        year: newBatchData.year,
        department: newBatchData.department.trim(),
        studentIds: [],
        classIds: [],
        isActive: true,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'batches'), batchData);
      
      const newBatch = {
        id: docRef.id,
        ...batchData
      };

      // Add to batches list
      setBatches(prev => [...prev, newBatch]);
      
      // Select the newly created batch
      setFormData({ ...formData, batchId: docRef.id });
      
      // Reset new batch form
      setNewBatchData({
        name: '',
        year: new Date().getFullYear(),
        department: ''
      });
      
      setShowNewBatchForm(false);
      alert(`Batch "${newBatch.name}" created successfully!`);
      
    } catch (error) {
      console.error('Error creating batch:', error);
      alert('Failed to create batch. Please try again.');
    }
  };

  const addNewCourse = async () => {
    if (!newCourseName.trim()) {
      alert('Please enter a course name');
      return;
    }

    if (courses.includes(newCourseName.trim())) {
      alert('This course already exists');
      return;
    }

    try {
      // Add to Firestore
      await addDoc(collection(db, 'courses'), {
        name: newCourseName.trim(),
        createdAt: new Date()
      });

      // Update local state
      setCourses(prev => [...prev, newCourseName.trim()]);
      setNewCourseName('');
      setShowAddCourse(false);
      alert('Course added successfully!');
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Failed to add course. Please try again.');
    }
  };

  const deleteCourse = async (courseName: string) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"?`)) {
      return;
    }

    try {
      // Find and delete from Firestore
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const courseDoc = coursesSnapshot.docs.find(doc => doc.data().name === courseName);
      
      if (courseDoc) {
        await deleteDoc(doc(db, 'courses', courseDoc.id));
      }

      // Update local state
      setCourses(prev => prev.filter(course => course !== courseName));
      
      // If this course was selected, clear it
      if (newBatchData.department === courseName) {
        setNewBatchData({...newBatchData, department: ''});
      }
      
      alert('Course deleted successfully!');
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  // Assignment management functions for lecturers
  const addAssignment = async () => {
    const newAssignment = {
      course: '',
      employmentType: 'full-time',
      batches: []
    };
    
    const updatedAssignments = [...lecturerAssignments, newAssignment];
    setLecturerAssignments(updatedAssignments);
    
    // Auto-generate employee ID when first assignment is added
    if (updatedAssignments.length === 1) {
      console.log('First assignment added, generating ID...');
      const newEmployeeId = await generateLecturerEmployeeId();
      setFormData(prev => ({...prev, employeeId: newEmployeeId}));
    }
  };

  const updateAssignment = async (index: number, field: string, value: any) => {
    const updatedAssignments = lecturerAssignments.map((assignment, i) => 
      i === index ? {...assignment, [field]: value} : assignment
    );
    setLecturerAssignments(updatedAssignments);
    
    // Regenerate employee ID when employment types or course change
    if (field === 'employmentType' || field === 'course') {
      console.log('Assignment changed, regenerating ID...');
      console.log('Updated assignments:', updatedAssignments);
      
      // Generate ID based on updated assignments directly
      setTimeout(async () => {
        try {
          // Determine employment types from updated assignments
          let typePrefix = '';
          const hasFullTime = updatedAssignments.some(a => a.employmentType === 'full-time');
          const hasVisiting = updatedAssignments.some(a => a.employmentType === 'visiting');
          
          if (hasFullTime && hasVisiting) {
            typePrefix = 'FT/VT';
          } else if (hasFullTime) {
            typePrefix = 'FT';
          } else if (hasVisiting) {
            typePrefix = 'VT';
          }
          
          console.log('Determined type prefix from updated assignments:', typePrefix);
          
          if (typePrefix && updatedAssignments[0]?.course) {
            const primaryCourse = updatedAssignments[0].course;
            const primaryEmploymentType = updatedAssignments[0].employmentType;
            
            // Generate ID with current course/employment type
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const lecturers = usersSnapshot.docs
              .map(doc => doc.data())
              .filter(user => user.role === 'lecturer');
            
            const basePattern = `AT/NG/LEC/${typePrefix}/`;
            
            // Find existing IDs with this exact combination pattern
            const existingIds = lecturers
              .filter(lecturer => {
                if (!lecturer.employeeId || !lecturer.employeeId.startsWith(basePattern)) {
                  return false;
                }
                
                // For FT/VT combination, check if lecturer has both types
                if (typePrefix === 'FT/VT') {
                  if (lecturer.assignments && Array.isArray(lecturer.assignments)) {
                    const hasFullTime = lecturer.assignments.some((a: any) => a.employmentType === 'full-time');
                    const hasVisiting = lecturer.assignments.some((a: any) => a.employmentType === 'visiting');
                    return hasFullTime && hasVisiting;
                  }
                  return false;
                } else {
                  // For single type (FT or VT), check specific course+type combination
                  if (lecturer.assignments && Array.isArray(lecturer.assignments)) {
                    return lecturer.assignments.some((assignment: any) => 
                      assignment.course === primaryCourse && 
                      assignment.employmentType === primaryEmploymentType
                    );
                  }
                  return true;
                }
              })
              .map(lecturer => {
                const idParts = lecturer.employeeId.split('/');
                const numberPart = idParts[idParts.length - 1];
                return parseInt(numberPart) || 0;
              })
              .filter(num => !isNaN(num) && num > 0);
            
            const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
            const newEmployeeId = `${basePattern}${String(nextNumber).padStart(2, '0')}`;
            
            console.log('Generated new ID:', newEmployeeId);
            setFormData(prev => ({...prev, employeeId: newEmployeeId}));
          }
        } catch (error) {
          console.error('Error regenerating ID:', error);
        }
      }, 100);
    }
  };

  const removeAssignment = async (index: number) => {
    const updatedAssignments = lecturerAssignments.filter((_, i) => i !== index);
    setLecturerAssignments(updatedAssignments);
    
    // Clear employee ID if no assignments left
    if (updatedAssignments.length === 0) {
      console.log('No assignments left, clearing employee ID');
      setFormData(prev => ({...prev, employeeId: ''}));
    } else {
      // Regenerate employee ID based on remaining assignments
      console.log('Regenerating ID for remaining assignments...');
      const hasFullTime = updatedAssignments.some(a => a.employmentType === 'full-time');
      const hasVisiting = updatedAssignments.some(a => a.employmentType === 'visiting');
      
      let typePrefix = '';
      if (hasFullTime && hasVisiting) {
        typePrefix = 'FT/VT';
      } else if (hasFullTime) {
        typePrefix = 'FT';
      } else if (hasVisiting) {
        typePrefix = 'VT';
      }
      
      if (typePrefix) {
        const newEmployeeId = await generateLecturerEmployeeId();
        setFormData(prev => ({...prev, employeeId: newEmployeeId}));
      }
    }
  };

  // Generate lecturer employee ID based on employment type or assignments
  const generateLecturerEmployeeId = async (employmentType?: string): Promise<string> => {
    try {
      console.log('Generating ID for employment type:', employmentType);
      console.log('Current assignments:', lecturerAssignments);
      
      // Determine employment types from assignments if available
      let typePrefix = '';
      if (lecturerAssignments.length > 0) {
        const hasFullTime = lecturerAssignments.some(a => a.employmentType === 'full-time');
        const hasVisiting = lecturerAssignments.some(a => a.employmentType === 'visiting');
        
        if (hasFullTime && hasVisiting) {
          typePrefix = 'FT/VT';
        } else if (hasFullTime) {
          typePrefix = 'FT';
        } else if (hasVisiting) {
          typePrefix = 'VT';
        }
      } else if (employmentType) {
        // Fallback to primary employment type
        typePrefix = employmentType === 'full-time' ? 'FT' : 'VT';
      }
      
      if (!typePrefix) {
        typePrefix = 'FT'; // Default fallback
      }
      
      console.log('Using type prefix:', typePrefix);
      
      const usersSnapshot = await getDocs(collection(db, 'users'));
      console.log('Total users found:', usersSnapshot.docs.length);
      
      const lecturers = usersSnapshot.docs
        .map(doc => doc.data())
        .filter(user => user.role === 'lecturer');
      
      console.log('Lecturers found:', lecturers.length);

      const basePattern = `AT/NG/LEC/${typePrefix}/`;
      
      console.log('Looking for pattern:', basePattern);
      
      // Get primary course from assignments for specific numbering
      let primaryCourse = '';
      let primaryEmploymentType = '';
      if (lecturerAssignments.length > 0) {
        primaryCourse = lecturerAssignments[0].course || '';
        primaryEmploymentType = lecturerAssignments[0].employmentType || '';
      }
      console.log('Primary course:', primaryCourse);
      console.log('Primary employment type:', primaryEmploymentType);
      
      // Find existing IDs with this exact course AND employment type combination
      const existingIds = lecturers
        .filter(lecturer => {
          if (!lecturer.employeeId || !lecturer.employeeId.startsWith(basePattern)) {
            return false;
          }
          
          // Filter by EXACT course and employment type combination
          if (primaryCourse && primaryEmploymentType && lecturer.assignments && Array.isArray(lecturer.assignments)) {
            const hasExactMatch = lecturer.assignments.some((assignment: any) => 
              assignment.course === primaryCourse && 
              assignment.employmentType === primaryEmploymentType
            );
            console.log('Lecturer', lecturer.employeeId, 'has exact course+type match:', hasExactMatch);
            return hasExactMatch;
          }
          
          console.log('Lecturer ID:', lecturer.employeeId, 'Matches pattern (no course filter):', true);
          return true;
        })
        .map(lecturer => {
          const idParts = lecturer.employeeId.split('/');
          const numberPart = idParts[idParts.length - 1];
          const num = parseInt(numberPart) || 0;
          console.log('Extracted number:', num, 'from ID:', lecturer.employeeId);
          return num;
        })
        .filter(num => !isNaN(num) && num > 0);

      console.log('Existing numbers for this course/type combination:', existingIds);

      // Get the next number for this specific course/employment type combination
      const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
      
      const generatedId = `${basePattern}${String(nextNumber).padStart(2, '0')}`;
      console.log('Generated ID:', generatedId);
      
      return generatedId;
    } catch (error) {
      console.error('Error generating lecturer employee ID:', error);
      const fallbackId = `AT/NG/LEC/FT/01`;
      console.log('Using fallback ID:', fallbackId);
      return fallbackId;
    }
  };

  const generateStaffEmployeeId = async (): Promise<string> => {
    try {
      // Get all staff users from database
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const staffUsers = usersSnapshot.docs
        .map(doc => doc.data())
        .filter(user => user.role === 'staff');

      console.log('Found staff users total:', staffUsers.length);

      // Find existing staff IDs with pattern AT/NG/ST/
      const basePattern = 'AT/NG/ST/';
      const existingIds = staffUsers
        .filter(staff => staff.employeeId && staff.employeeId.startsWith(basePattern))
        .map(staff => {
          const idParts = staff.employeeId.split('/');
          const numberPart = idParts[idParts.length - 1];
          const num = parseInt(numberPart) || 0;
          console.log('Extracted staff number:', num, 'from ID:', staff.employeeId);
          return num;
        })
        .filter(num => !isNaN(num) && num > 0);

      console.log('Existing staff numbers:', existingIds);

      // Get the next number - if no IDs found but staff exist, start from staff count + 1
      let nextNumber;
      if (existingIds.length > 0) {
        nextNumber = Math.max(...existingIds) + 1;
      } else if (staffUsers.length > 0) {
        // If staff exist but no valid IDs, use staff count as next number
        nextNumber = staffUsers.length + 1;
      } else {
        nextNumber = 1;
      }
      
      const generatedId = `${basePattern}${String(nextNumber).padStart(2, '0')}`;
      console.log('Generated Staff ID:', generatedId);
      
      return generatedId;
    } catch (error) {
      console.error('Error generating staff employee ID:', error);
      const fallbackId = `AT/NG/ST/01`;
      console.log('Using fallback staff ID:', fallbackId);
      return fallbackId;
    }
  };

  const generateAdminEmployeeId = async (): Promise<string> => {
    try {
      // Get all admin users from database
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const adminUsers = usersSnapshot.docs
        .map(doc => doc.data())
        .filter(user => user.role === 'admin');

      console.log('Found admin users total:', adminUsers.length);

      // Find existing admin IDs with pattern AT/ADM/
      const basePattern = 'AT/ADM/';
      const existingIds = adminUsers
        .filter(admin => admin.employeeId && admin.employeeId.startsWith(basePattern))
        .map(admin => {
          const idParts = admin.employeeId.split('/');
          const numberPart = idParts[idParts.length - 1];
          const num = parseInt(numberPart) || 0;
          console.log('Extracted admin number:', num, 'from ID:', admin.employeeId);
          return num;
        })
        .filter(num => !isNaN(num) && num > 0);

      console.log('Existing admin numbers:', existingIds);

      // Get the next number - if no IDs found but admins exist, start from admin count + 1
      let nextNumber;
      if (existingIds.length > 0) {
        nextNumber = Math.max(...existingIds) + 1;
      } else if (adminUsers.length > 0) {
        // If admins exist but no valid IDs, use admin count as next number
        nextNumber = adminUsers.length + 1;
      } else {
        nextNumber = 1;
      }
      
      const generatedId = `${basePattern}${String(nextNumber).padStart(2, '0')}`;
      console.log('Generated Admin ID:', generatedId);
      
      return generatedId;
    } catch (error) {
      console.error('Error generating admin employee ID:', error);
      const fallbackId = `AT/ADM/01`;
      console.log('Using fallback admin ID:', fallbackId);
      return fallbackId;
    }
  };

  const handleRoleChange = async (newRole: string) => {
    setFormData(prev => ({ ...prev, role: newRole }));
    
    // Generate appropriate Employee ID based on role
    if (newRole === 'lecturer') {
      // Clear lecturer-specific data when switching from staff
      setLecturerAssignments([]);
      const employeeId = await generateLecturerEmployeeId();
      setFormData(prev => ({ ...prev, employeeId }));
    } else if (newRole === 'staff') {
      // Generate staff Employee ID
      const employeeId = await generateStaffEmployeeId();
      setFormData(prev => ({ ...prev, employeeId }));
    } else if (newRole === 'admin') {
      // Generate admin Employee ID
      const employeeId = await generateAdminEmployeeId();
      setFormData(prev => ({ ...prev, employeeId }));
    } else {
      // Clear Employee ID for students
      setFormData(prev => ({ ...prev, employeeId: '' }));
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          locationName: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
        }));
        setGettingLocation(false);
      },
      (error) => {
        setError('Error getting location: ' + error.message);
        setGettingLocation(false);
      }
    );
  };

  const validateBatchName = (name: string): boolean => {
    // Allow English letters, numbers, hyphens, and underscores
    const validPattern = /^[A-Za-z0-9\-_]+$/;
    return validPattern.test(name) && name.trim().length > 0;
  };

  const validateStudentId = (id: string): boolean => {
    // Allow English letters, numbers, and hyphens
    const validPattern = /^[A-Za-z0-9\-]+$/;
    return validPattern.test(id) && id.trim().length > 0;
  };

  const generateNextStudentId = async (batchId: string) => {
    if (!batchId) return;
    
    try {
      // Get the selected batch data
      const selectedBatch = batches.find(batch => batch.id === batchId);
      if (!selectedBatch) return;

      // Get all users from database to find existing student IDs
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const existingStudentIds: string[] = [];
      
      usersSnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.batchId === batchId && userData.studentId) {
          existingStudentIds.push(userData.studentId);
        }
      });

      // Use the full batch name as prefix (clean but keep structure)
      const batchName = selectedBatch.name.trim();
      let batchPrefix = '';
      
      // Clean the batch name while preserving hyphens and structure
      batchPrefix = batchName.replace(/[^A-Za-z0-9\-]/g, '').toUpperCase();
      
      // Find the highest existing number for this batch
      let highestNumber = 0;
      
      // Look for any student IDs that start with the batch prefix
      existingStudentIds.forEach(id => {
        // Check if ID starts with our batch prefix
        if (id.startsWith(batchPrefix)) {
          // Extract the number part from the end
          const numberMatch = id.match(/(\d+)$/);
          if (numberMatch) {
            const number = parseInt(numberMatch[1]);
            if (number > highestNumber) {
              highestNumber = number;
            }
          }
        }
      });

      // Generate next student ID (increment by 1)
      const nextNumber = (highestNumber + 1).toString().padStart(2, '0');
      const nextStudentId = `${batchPrefix}-${nextNumber}`;
      
      // Debug: Log the generation process
      console.log('Batch:', batchName);
      console.log('Prefix:', batchPrefix);
      console.log('Existing IDs:', existingStudentIds);
      console.log('Highest Number:', highestNumber);
      console.log('Next Number:', nextNumber);
      console.log('Generated ID:', nextStudentId);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        studentId: nextStudentId
      }));

      // If custom student ID was showing, switch back to dropdown
      setShowCustomStudentId(false);
      
    } catch (error) {
      console.error('Error generating student ID:', error);
    }
  };

  const deleteBatch = async (batchId: string) => {
    const selectedBatch = batches.find(b => b.id === batchId);
    if (!selectedBatch) return;
    
    setBatchToDelete(selectedBatch);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;

    try {
      // Completely delete from Firebase
      await deleteDoc(doc(db, 'batches', batchToDelete.id));
      
      // Reload batches
      const batchesSnapshot = await getDocs(collection(db, 'batches'));
      const batchesList = batchesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setBatches(batchesList);
      
      // Clear selection if deleted batch was selected
      if (formData.batchId === batchToDelete.id) {
        setFormData(prev => ({ ...prev, batchId: '', studentId: '' }));
      }
      
      // Close modal
      setShowDeleteConfirm(false);
      setBatchToDelete(null);
      setDeleteConfirmText('');
      
      showSuccess('Batch permanently deleted from database', 'success');
    } catch (error) {
      console.error('Error deleting batch:', error);
      showError('Error deleting batch', 'error');
    }
  };

  const editBatch = (batch: any) => {
    setEditingBatch(batch);
    setNewBatchData({
      name: batch.name,
      year: batch.year,
      department: batch.department
    });
    setShowNewBatchForm(true);
  };

  const updateBatch = async () => {
    if (!editingBatch || !newBatchData.name.trim() || !newBatchData.department.trim()) {
      alert('Please fill in all batch details');
      return;
    }

    if (!validateBatchName(newBatchData.name)) {
      alert('Batch name should contain only English letters, numbers, hyphens, and underscores');
      return;
    }

    try {
      const batchData = {
        name: newBatchData.name.trim(),
        year: newBatchData.year,
        department: newBatchData.department.trim(),
        updatedAt: Timestamp.now()
      };

      await setDoc(doc(db, 'batches', editingBatch.id), batchData, { merge: true });
      
      // Update local batches list
      setBatches(prev => prev.map(batch => 
        batch.id === editingBatch.id 
          ? { ...batch, ...batchData }
          : batch
      ));

      // Reset form
      setShowNewBatchForm(false);
      setEditingBatch(null);
      setNewBatchData({
        name: '',
        year: new Date().getFullYear(),
        department: ''
      });

      showSuccess('Batch updated successfully', 'success');
    } catch (error) {
      console.error('Error updating batch:', error);
      showError('Error updating batch', 'error');
    }
  };

  const removeFacePhoto = () => {
    setFormData(prev => ({ 
      ...prev, 
      facePhoto: null, 
      facePhotoPreview: '' 
    }));
  };

  const handleWebcamCapture = (imageData: string, imageFile: File) => {
    setFormData(prev => ({
      ...prev,
      facePhoto: imageFile,
      facePhotoPreview: imageData
    }));
    setShowWebcamCapture(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate Student ID if it's a student
    if (formData.role === 'student' && !validateStudentId(formData.studentId)) {
      setError('Student ID should contain only English letters, numbers, and hyphens');
      setLoading(false);
      return;
    }

    // Validate lecturer assignments
    if (formData.role === 'lecturer' && lecturerAssignments.length === 0) {
      setError('Please add at least one course assignment for the lecturer');
      setLoading(false);
      return;
    }

    // Validate that all assignments have course and employment type
    if (formData.role === 'lecturer') {
      const incompleteAssignments = lecturerAssignments.filter(
        assignment => !assignment.course || !assignment.employmentType
      );
      if (incompleteAssignments.length > 0) {
        setError('Please complete all course assignments (course and employment type required)');
        setLoading(false);
        return;
      }
    }

    try {
      console.log('Creating user with email:', formData.email);
      
      // Alternative approach: Use Firebase REST API to create user without affecting current session
      const API_KEY = 'AIzaSyB36Ak1zysY2wH7VfQDQOIOjQMNOft5dU0'; // Your Firebase API key
      
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          returnSecureToken: true
        })
      });

      const authResult = await response.json();
      
      if (!response.ok) {
        throw new Error(authResult.error?.message || 'Failed to create user account');
      }
      
      const firebaseUserId = authResult.localId;
      console.log('Firebase Auth user created via REST API:', firebaseUserId);
      
      // Upload face photo if provided
      let facePhotoURL = null;
      if (formData.facePhoto) {
        try {
          const photoRef = ref(storage, `face-photos/${firebaseUserId}`);
          await uploadBytes(photoRef, formData.facePhoto);
          facePhotoURL = await getDownloadURL(photoRef);
          console.log('Face photo uploaded:', facePhotoURL);
        } catch (photoError) {
          console.error('Error uploading face photo:', photoError);
        }
      }

      // Save user data to Firestore with Firebase Auth UID
      const userData = {
        uid: firebaseUserId,
        email: formData.email,
        fullName: formData.fullName,
        firstName: formData.fullName.split(' ')[0] || '',
        lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
        role: formData.role,
        nic: formData.nic,
        phone: formData.phone,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth,
        // Location data
        location: {
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
          locationName: formData.locationName || null,
          lastUpdated: new Date()
        },
        // Face photo URL
        facePhotoURL: facePhotoURL,
        createdAt: new Date(),
        status: 'active'
      };

        // Add role-specific fields
        if (formData.role === 'student') {
          Object.assign(userData, {
            studentId: formData.studentId,
            batchId: formData.batchId,
            year: formData.year,
            semester: formData.semester
          });
        } else if (formData.role === 'lecturer') {
          // Determine primary department from assignments
          const primaryDepartment = lecturerAssignments.length > 0 
            ? lecturerAssignments[0].course 
            : formData.department || '';
          
          // Determine employment type from assignments
          const hasFullTime = lecturerAssignments.some(a => a.employmentType === 'full-time');
          const hasVisiting = lecturerAssignments.some(a => a.employmentType === 'visiting');
          
          let employmentType = formData.employmentType;
          if (hasFullTime && hasVisiting) {
            employmentType = 'full-time/visiting';
          } else if (hasFullTime) {
            employmentType = 'full-time';
          } else if (hasVisiting) {
            employmentType = 'visiting';
          }
          
          Object.assign(userData, {
            department: primaryDepartment,
            employeeId: formData.employeeId,
            qualification: formData.qualification,
            subjects: formData.subjects,
            employmentType: employmentType,
            assignments: lecturerAssignments.length > 0 ? lecturerAssignments : []
          });
        } else if (formData.role === 'staff') {
          Object.assign(userData, {
            department: formData.department,
            employeeId: formData.employeeId,
            jobTitle: formData.jobTitle
          });
        } else if (formData.role === 'admin') {
          Object.assign(userData, {
            department: formData.department,
            employeeId: formData.employeeId
          });
        }

        await setDoc(doc(db, 'users', firebaseUserId), userData);
        
        console.log('User data saved to Firestore with ID:', firebaseUserId);
        
        // Show success toast notification
        showSuccess(
          'User Created Successfully!', 
          `${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} account has been created successfully. Admin session remains active.`
        );
        
        // Reset form and close modal
        setFormData({
          role: 'student',
          email: '',
          password: '',
          fullName: '',
          nic: '',
          phone: '',
          address: '',
          dateOfBirth: '',
          latitude: '',
          longitude: '',
          locationName: '',
          facePhoto: null,
          facePhotoPreview: '',
          studentId: '',
          batchId: '',
          year: '',
          semester: '',
          department: '',
          employeeId: '',
          qualification: '',
          subjects: '',
          jobTitle: '',
          employmentType: 'full-time',
          assignments: []
        });
        
        setLecturerAssignments([]);
        
        setLoading(false);
        handleClose();
        
        // Trigger user list refresh
        setTimeout(() => {
          onUserCreated();
        }, 500);
        
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Handle Firebase Auth specific errors
      let errorMessage = 'Unknown error occurred';
      
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already registered. Please use a different email.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password is too weak. Please use at least 6 characters.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address format.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact administrator.';
            break;
          default:
            errorMessage = error.message || 'Failed to create user account.';
        }
      } else {
        errorMessage = error.message || 'Failed to create user account.';
      }
      
      showError('Error Creating User', errorMessage);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Role Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIC</label>
              <input
                type="text"
                value={formData.nic}
                onChange={(e) => setFormData({...formData, nic: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Phone and Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </div>

          {/* Location Section - Hidden for Admin role */}
          {formData.role !== 'admin' && (
            <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Location Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 6.9271"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 79.8612"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
                  <input
                    type="text"
                    value={formData.locationName}
                    onChange={(e) => setFormData({...formData, locationName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Colombo, Sri Lanka"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {gettingLocation ? 'Getting Location...' : 'Get Current Location'}
              </button>
            </div>
          )}

          {/* Face Photo Section - Hidden for Admin role */}
          {formData.role !== 'admin' && (
            <div className="bg-purple-50 rounded-lg p-4 mb-4 border border-purple-200">
              <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Face Photo (for Face Recognition)
              </h4>
              
              {formData.facePhotoPreview ? (
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img 
                      src={formData.facePhotoPreview} 
                      alt="Face preview" 
                      className="w-24 h-24 object-cover rounded-lg border-2 border-purple-200"
                    />
                    <button
                      type="button"
                      onClick={removeFacePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-purple-700 mb-2">
                      Face photo uploaded successfully!
                    </p>
                    <p className="text-xs text-purple-600">
                      This photo will be used for face recognition during attendance.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => document.getElementById('face-photo-input')?.click()}
                        className="text-purple-600 hover:text-purple-800 text-sm underline"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowWebcamCapture(true)}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Use Camera
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center">
                  <Camera className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-purple-700 mb-2">Capture Face Photo</p>
                  <p className="text-xs text-purple-600 mb-4">
                    Required for face recognition attendance. Clear frontal face photo recommended.
                  </p>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowWebcamCapture(true)}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Use Camera
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Role-specific fields */}
          {formData.role === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                {!showCustomStudentId ? (
                  <div className="space-y-2">
                    <select
                      value={formData.studentId}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setShowCustomStudentId(true);
                          setFormData({...formData, studentId: ''});
                        } else {
                          setFormData({...formData, studentId: e.target.value});
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Student ID Format</option>
                      {formData.studentId && !showCustomStudentId && (
                        <option value={formData.studentId}>
                          {formData.studentId} (Auto-generated for selected batch)
                        </option>
                      )}
                      <option value="custom">Enter Custom ID</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowCustomStudentId(true)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Or enter custom Student ID
                    </button>
                    {formData.batchId && formData.studentId && !showCustomStudentId && (
                      <p className="text-xs text-green-600">
                        ✓ Next available Student ID generated for selected batch
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow English letters, numbers, and hyphens
                          if (value === '' || /^[A-Za-z0-9\-]*$/.test(value)) {
                            setFormData({...formData, studentId: value});
                          }
                        }}
                        placeholder="Enter custom Student ID (e.g., CS2025001)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomStudentId(false);
                          setFormData({...formData, studentId: ''});
                        }}
                        className="px-2 py-2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Use English letters, numbers, and hyphens only (e.g., CS2025001, AT-HND-SE-01, STU001)
                    </p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                {!showNewBatchForm ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={formData.batchId}
                        onChange={async (e) => {
                          const batchId = e.target.value;
                          setFormData({...formData, batchId});
                          
                          // Auto-generate next student ID when batch is selected
                          if (batchId) {
                            await generateNextStudentId(batchId);
                          } else {
                            // Clear student ID if no batch selected
                            setFormData(prev => ({...prev, studentId: ''}));
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Batch</option>
                        {batches.map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.name} ({batch.department} - {batch.year})
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowBatchActions(!showBatchActions)}
                        className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-bold"
                        title="Batch Actions"
                      >
                        •••
                      </button>
                    </div>
                    
                    {showBatchActions && formData.batchId && (
                      <div className="flex gap-2 p-2 bg-gray-50 rounded-lg border">
                        <button
                          type="button"
                          onClick={() => {
                            const selectedBatch = batches.find(b => b.id === formData.batchId);
                            if (selectedBatch) editBatch(selectedBatch);
                            setShowBatchActions(false);
                          }}
                          className="flex-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Edit Batch
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteBatch(formData.batchId);
                            setShowBatchActions(false);
                          }}
                          className="flex-1 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete Batch
                        </button>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setShowNewBatchForm(true)}
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Plus size={16} className="mr-1" />
                      Create New Batch
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-900">
                        {editingBatch ? 'Edit Batch' : 'Create New Batch'}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewBatchForm(false);
                          setEditingBatch(null);
                          setNewBatchData({
                            name: '',
                            year: new Date().getFullYear(),
                            department: ''
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Batch Name</label>
                        <input
                          type="text"
                          value={newBatchData.name}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow English letters, numbers, hyphens, and underscores
                            if (value === '' || /^[A-Za-z0-9\-_]*$/.test(value)) {
                              setNewBatchData({...newBatchData, name: value});
                            }
                          }}
                          placeholder="e.g., CS-2025-A, BATCH_001"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use English letters, numbers, hyphens (-), and underscores (_) only
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Year</label>
                          <input
                            type="number"
                            value={newBatchData.year}
                            onChange={(e) => setNewBatchData({...newBatchData, year: parseInt(e.target.value)})}
                            min="2020"
                            max="2030"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                          />
                        </div>
                        
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-medium text-gray-700">Courses</label>
                            <button
                              type="button"
                              onClick={() => setShowAddCourse(true)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              + Add Course
                            </button>
                          </div>
                          
                          <div className="relative">
                            <select
                              value={newBatchData.department}
                              onChange={(e) => setNewBatchData({...newBatchData, department: e.target.value})}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              required
                            >
                              <option value="">Select Course</option>
                              {courses.map((course, index) => (
                                <option key={index} value={course}>
                                  {course}
                                </option>
                              ))}
                            </select>
                            
                            {/* Course management dropdown */}
                            <div className="mt-1 border border-gray-200 rounded bg-white max-h-32 overflow-y-auto">
                              <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                                Manage Courses
                              </div>
                              {courses.map((course, index) => (
                                <div key={index} className="flex items-center justify-between py-1 px-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                                  <span className="text-gray-700">{course}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      deleteCourse(course);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                    title={`Delete ${course}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              {courses.length === 0 && (
                                <div className="px-2 py-2 text-xs text-gray-500 text-center">
                                  No courses available
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={editingBatch ? updateBatch : createNewBatch}
                        className="w-full bg-green-600 text-white text-sm py-2 px-3 rounded hover:bg-green-700"
                      >
                        {editingBatch ? 'Update Batch' : 'Create Batch'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({...formData, semester: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Semester</option>
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="3rd Semester">3rd Semester</option>
                  <option value="4th Semester">4th Semester</option>
                </select>
              </div>
            </div>
          )}

          {/* Lecturer/Staff/Admin Information */}
          {(formData.role === 'lecturer' || formData.role === 'staff' || formData.role === 'admin') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-red-50"
                    placeholder="Will be auto-generated based on employment type"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: {formData.role === 'lecturer' ? 'AT/NG/LEC/FT/01 (Full Time), AT/NG/LEC/VT/01 (Visiting), AT/NG/LEC/FT/VT/01 (Both)' : 
                             formData.role === 'staff' ? 'AT/NG/ST/01, AT/NG/ST/02...' :
                             formData.role === 'admin' ? 'AT/ADM/01, AT/ADM/02...' : 'Auto-generated'}
                  </p>
                </div>
              </div>

              {formData.role === 'lecturer' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">Course Assignments</h4>
                    <button
                      type="button"
                      onClick={addAssignment}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                    >
                      + Add Assignment
                    </button>
                  </div>
                  
                  {lecturerAssignments.map((assignment, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-700">Assignment {index + 1}</h5>
                        <button
                          type="button"
                          onClick={() => removeAssignment(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                          <select
                            value={assignment.course}
                            onChange={(e) => updateAssignment(index, 'course', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Course</option>
                            {courses.map((course, courseIndex) => (
                              <option key={courseIndex} value={course}>{course}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                          <select
                            value={assignment.employmentType}
                            onChange={(e) => updateAssignment(index, 'employmentType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="full-time">Full Time</option>
                            <option value="visiting">Visiting</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {lecturerAssignments.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No assignments added yet. Click "Add Assignment" to start.
                    </div>
                  )}
                </div>
              )}

              {formData.role === 'lecturer' && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., PhD Computer Science"
                    />
                  </div>
                </div>
              )}

              {formData.role === 'lecturer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjects</label>
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Data Structures, Algorithms, Database Systems"
                  />
                </div>
              )}

              {formData.role === 'staff' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Administrative Officer, Lab Assistant"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>

          {/* Webcam Capture Modal */}
          <WebcamCapture
            isOpen={showWebcamCapture}
            onCapture={handleWebcamCapture}
            onClose={() => setShowWebcamCapture(false)}
          />
        </form>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Advanced Delete Confirmation Modal */}
      {showDeleteConfirm && batchToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100 opacity-100">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Batch Permanently
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You are about to permanently delete this batch:
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="text-sm font-medium text-red-800">
                    {batchToDelete.name}
                  </div>
                  <div className="text-xs text-red-600">
                    {batchToDelete.department} - {batchToDelete.year}
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-xs text-yellow-800">
                      <strong>Warning:</strong> This action cannot be undone. All data related to this batch will be permanently removed from the database.
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mb-6">
                  Type <strong>"DELETE"</strong> to confirm this action:
                </p>
                
                <input
                  type="text"
                  value={deleteConfirmText}
                  placeholder="Type DELETE to confirm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-red-500"
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setBatchToDelete(null);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteBatch}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    deleteConfirmText === 'DELETE'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Course</h3>
              <button
                onClick={() => {
                  setShowAddCourse(false);
                  setNewCourseName('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name
                </label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g., Artificial Intelligence"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCourse(false);
                    setNewCourseName('');
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addNewCourse}
                  disabled={!newCourseName.trim()}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    newCourseName.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Add Course
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};