import React, { useState, useEffect } from 'react';
import { X, Camera, Image, Video, MapPin, Navigation, Plus, Eye, EyeOff } from 'lucide-react';
import { doc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
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
    course: '',
    year: '',
    semester: '',
    // Lecturer/Staff fields
    department: '',
    employeeId: '',
    qualification: '',
    subjects: '',
    jobTitle: '',
    employmentType: 'full-time' // Add employment type field
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showWebcamCapture, setShowWebcamCapture] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);
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

  // Load batches when component mounts
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

    if (isOpen) {
      loadBatches();
    }
  }, [isOpen]);

  const createNewBatch = async () => {
    if (!newBatchData.name.trim() || !newBatchData.department.trim()) {
      alert('Please fill in all batch details');
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

  const handleFacePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFormData(prev => ({ ...prev, facePhoto: file }));

    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, facePhotoPreview: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
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
            course: formData.course,
            year: formData.year,
            semester: formData.semester
          });
        } else if (formData.role === 'lecturer') {
          Object.assign(userData, {
            department: formData.department,
            employeeId: formData.employeeId,
            qualification: formData.qualification,
            subjects: formData.subjects,
            employmentType: formData.employmentType
          });
        } else if (formData.role === 'staff') {
          Object.assign(userData, {
            department: formData.department,
            employeeId: formData.employeeId,
            jobTitle: formData.jobTitle
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
          latitude: '',
          longitude: '',
          locationName: '',
          facePhoto: null,
          facePhotoPreview: '',
          studentId: '',
          batchId: '',
          course: '',
          year: '',
          semester: '',
          department: '',
          employeeId: '',
          qualification: '',
          subjects: '',
          jobTitle: '',
          employmentType: 'full-time'
        });
        
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
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
              onChange={(e) => setFormData({...formData, role: e.target.value})}
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
          </div>

          {/* Location Section */}
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

          {/* Face Photo Section */}
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
                <p className="text-sm text-purple-700 mb-2">Upload or Capture Face Photo</p>
                <p className="text-xs text-purple-600 mb-4">
                  Required for face recognition attendance. Clear frontal face photo recommended.
                </p>
                <div className="flex gap-2 justify-center">
                  <label 
                    htmlFor="face-photo-input"
                    className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer text-sm"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Upload File
                  </label>
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
            
            <input
              id="face-photo-input"
              type="file"
              accept="image/*"
              onChange={handleFacePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Role-specific fields */}
          {formData.role === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                {!showNewBatchForm ? (
                  <div className="space-y-2">
                    <select
                      value={formData.batchId}
                      onChange={(e) => setFormData({...formData, batchId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <h4 className="text-sm font-medium text-gray-900">Create New Batch</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewBatchForm(false);
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
                          onChange={(e) => setNewBatchData({...newBatchData, name: e.target.value})}
                          placeholder="e.g., CS-2025-A"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          required
                        />
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
                          <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                          <select
                            value={newBatchData.department}
                            onChange={(e) => setNewBatchData({...newBatchData, department: e.target.value})}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Dept</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Software Engineering">Software Engineering</option>
                            <option value="Data Science">Data Science</option>
                            <option value="Cyber Security">Cyber Security</option>
                            <option value="Business Information Systems">Business Information Systems</option>
                          </select>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={createNewBatch}
                        className="w-full bg-green-600 text-white text-sm py-2 px-3 rounded hover:bg-green-700"
                      >
                        Create Batch
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData({...formData, course: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
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
                </select>
              </div>
            </div>
          )}

          {/* Lecturer/Staff Information */}
          {(formData.role === 'lecturer' || formData.role === 'staff') && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="Business Information Systems">Business Information Systems</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Administration">Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., LEC001 or STF001"
                    required
                  />
                </div>
              </div>

              {formData.role === 'lecturer' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({...formData, employmentType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="full-time">Full Time</option>
                      <option value="visiting">Visiting</option>
                    </select>
                  </div>
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
    </div>
  );
};