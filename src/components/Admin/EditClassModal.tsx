import React, { useState, useEffect } from 'react';
import { X, Clock, Plus } from 'lucide-react';
import { doc, updateDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AuthService } from '../../services/authService';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassUpdated: () => void;
  classData: any; // The class data to edit
}

export const EditClassModal: React.FC<EditClassModalProps> = ({ 
  isOpen, 
  onClose, 
  onClassUpdated, 
  classData 
}) => {
  const [formData, setFormData] = useState({
    className: '',
    courseCode: '',
    description: '',
    instructor: '',
    department: '',
    semester: '',
    year: '',
    credits: '',
    batchId: '',
    schedule: {
      day: '',
      startTime: '',
      endTime: '',
      room: ''
    },
    capacity: '',
    enrolledStudents: 0,
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [batches, setBatches] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);
  const [newBatchData, setNewBatchData] = useState({
    name: '',
    year: new Date().getFullYear(),
    department: ''
  });

  // Load data when modal opens and populate form with existing class data
  useEffect(() => {
    if (isOpen && classData) {
      console.log('EditClassModal classData:', classData); // Debug log
      console.log('Checking batchId in classData:', classData.batchId); // Debug log
      
      // Populate form with existing class data using correct field names
      const formDataToSet = {
        className: classData.name || classData.className || '', // Use 'name' field from ClassManagement
        courseCode: classData.code || classData.courseCode || '', // Use 'code' field from ClassManagement
        description: classData.description || '',
        instructor: classData.lecturer || classData.instructor || '', // Use 'lecturer' field from ClassManagement
        department: classData.department || '',
        semester: classData.semester || '',
        year: classData.academic_year || classData.year || '', // Use 'academic_year' field from ClassManagement
        credits: classData.credits?.toString() || '3', // Default to 3 if not available
        batchId: classData.batchId || '',
        schedule: {
          day: classData.day || classData.schedule?.day || '', // Use 'day' field from ClassManagement
          startTime: classData.startTime || classData.schedule?.startTime || '', // Use 'startTime' field from ClassManagement
          endTime: classData.endTime || classData.schedule?.endTime || '', // Use 'endTime' field from ClassManagement
          room: classData.room || classData.schedule?.room || '' // Use 'room' field from ClassManagement
        },
        capacity: classData.capacity?.toString() || '30', // Use 'capacity' field from ClassManagement
        enrolledStudents: classData.enrolled || classData.enrolledStudents || 0, // Use 'enrolled' field from ClassManagement
        status: classData.status || 'active'
      };
      
      console.log('Setting formData to:', formDataToSet); // Debug log
      setFormData(formDataToSet);

      loadData();
    }
  }, [isOpen, classData]);

  const loadData = async () => {
    try {
      // Load batches
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

      // Auto-select batch based on class department if classData available
      if (classData && batchData.length > 0) {
        // Check if we already have a batchId set
        const currentBatchId = classData.batchId;
        
        if (currentBatchId) {
          // Use existing batchId if available
          console.log('Using existing batchId:', currentBatchId);
        } else {
          // Auto-select based on department match
          const matchingBatch = batchData.find((batch: any) => 
            batch.department === classData.department || 
            batch.name?.toLowerCase().includes(classData.department?.toLowerCase() || '')
          );
          
          if (matchingBatch) {
            console.log('Auto-selecting batch based on department match:', matchingBatch);
            setFormData(prev => ({
              ...prev,
              batchId: matchingBatch.id
            }));
          } else {
            // If no matching batch, select the first available batch
            console.log('No matching batch found, selecting first batch:', batchData[0]);
            setFormData(prev => ({
              ...prev,
              batchId: batchData[0].id
            }));
          }
        }
      }

      // Load lecturers
      const lecturerData = await AuthService.getUsersByRole('lecturer');
      console.log('Loaded lecturers:', lecturerData); // Debug log
      setLecturers(lecturerData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

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

      const docRef = await doc(collection(db, 'batches'));
      await updateDoc(docRef, batchData);
      
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
      setSuccess(`Batch "${newBatch.name}" created successfully!`);
      
    } catch (error) {
      console.error('Error creating batch:', error);
      setError('Failed to create batch. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Current formData:', formData); // Debug log
      
      const updatedClassData = {
        className: formData.className,
        courseCode: formData.courseCode,
        description: formData.description,
        instructor: formData.instructor,
        department: formData.department,
        semester: formData.semester,
        year: formData.year,
        credits: parseInt(formData.credits),
        capacity: parseInt(formData.capacity),
        batchId: formData.batchId, // Make sure batchId is included
        schedule: formData.schedule,
        enrolledStudents: formData.enrolledStudents,
        status: formData.status,
        updatedAt: new Date()
      };

      console.log('Updating class with data:', updatedClassData); // Debug log

      // Update the class document
      await updateDoc(doc(db, 'classes', classData.id), updatedClassData);
      
      setSuccess('Class updated successfully!');

      setTimeout(() => {
        onClassUpdated();
        onClose();
      }, 1500); // Reduced delay
    } catch (error: any) {
      console.error('Error updating class:', error);
      setError('Error updating class: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Edit Class</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
              <input
                type="text"
                value={formData.className}
                onChange={(e) => setFormData({...formData, className: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Introduction to Computer Science"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course Code</label>
              <input
                type="text"
                value={formData.courseCode}
                onChange={(e) => setFormData({...formData, courseCode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. CS101"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Brief description of the class..."
            />
          </div>

          {/* Instructor and Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lecturer</label>
              <select
                value={formData.instructor}
                onChange={(e) => setFormData({...formData, instructor: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Lecturer</option>
                {lecturers.map((lecturer) => {
                  const employmentType = lecturer.employmentType === 'visiting' ? 'Visiting' : 'Full Time';
                  
                  // Try multiple ways to get lecturer name
                  let lecturerName = '';
                  if (lecturer.fullName) {
                    lecturerName = lecturer.fullName;
                  } else if (lecturer.firstName && lecturer.lastName) {
                    lecturerName = `${lecturer.firstName} ${lecturer.lastName}`;
                  } else if (lecturer.name) {
                    lecturerName = lecturer.name;
                  } else if (lecturer.displayName) {
                    lecturerName = lecturer.displayName;
                  } else {
                    lecturerName = lecturer.email?.split('@')[0] || 'Unknown Lecturer';
                  }
                  
                  const department = lecturer.department || 'No Department';
                  
                  return (
                    <option key={lecturer.id} value={lecturerName}>
                      {lecturerName} - {employmentType} - {department}
                    </option>
                  );
                })}
              </select>
            </div>
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
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Engineering">Engineering</option>
              </select>
            </div>
          </div>

          {/* Academic Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.credits}
                onChange={(e) => setFormData({...formData, credits: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="30"
                required
              />
            </div>
          </div>

          {/* Batch Selection */}
          <div className="mb-6">
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

          {/* Schedule Section */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Class Schedule
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                <select
                  value={formData.schedule.day}
                  onChange={(e) => setFormData({
                    ...formData, 
                    schedule: {...formData.schedule, day: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Day</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.schedule.startTime}
                  onChange={(e) => setFormData({
                    ...formData, 
                    schedule: {...formData.schedule, startTime: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.schedule.endTime}
                  onChange={(e) => setFormData({
                    ...formData, 
                    schedule: {...formData.schedule, endTime: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input
                  type="text"
                  value={formData.schedule.room}
                  onChange={(e) => setFormData({
                    ...formData, 
                    schedule: {...formData.schedule, room: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Lab 101"
                  required
                />
              </div>
            </div>
          </div>

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
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : 'Update Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};