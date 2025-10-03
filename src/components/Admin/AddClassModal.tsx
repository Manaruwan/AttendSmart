import React, { useState, useEffect } from 'react';
import { X, Clock, Plus } from 'lucide-react';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AuthService } from '../../services/authService';

interface AddClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: () => void;
}

export const AddClassModal: React.FC<AddClassModalProps> = ({ isOpen, onClose, onClassCreated }) => {
  const [formData, setFormData] = useState({
    className: '',
    courseCode: '',
    description: '',
    instructor: '',
    department: '',
    semester: '',
    year: '',
    credits: '',
    batchId: '', // Add batch selection
    schedule: {
      day: '',
      startTime: '',
      endTime: '',
      room: ''
    },
    capacity: '',
    enrolledStudents: 0,
    status: 'active',
    attendanceSettings: {
      linkActiveMinutesBefore: 15,
      linkActiveMinutesAfter: 30,
      enableAutoActivation: true
    }
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

  // Load batches and lecturers when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
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

        // Load lecturers
        const lecturerData = await AuthService.getUsersByRole('lecturer');
        console.log('Loaded lecturers:', lecturerData); // Debug log
        setLecturers(lecturerData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
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
      const classData = {
        ...formData,
        credits: parseInt(formData.credits),
        capacity: parseInt(formData.capacity),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(db, 'classes'), classData);
      
      setSuccess('Class created successfully!');
      
      // Reset form
      setFormData({
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
        status: 'active',
        attendanceSettings: {
          linkActiveMinutesBefore: 15,
          linkActiveMinutesAfter: 30,
          enableAutoActivation: true
        }
      });

      setTimeout(() => {
        onClassCreated();
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error creating class:', error);
      setError('Error creating class: ' + error.message);
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
            <h3 className="text-lg font-semibold text-gray-900">Add New Class</h3>
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
                  console.log('Lecturer data:', lecturer); // Debug log
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
                  console.log('Formatted:', lecturerName, employmentType, department); // Debug log
                  
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

          {/* Attendance Link Preview */}
          {formData.className && formData.courseCode && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Attendance Link Preview
              </h4>
              <div className="space-y-3">
                <p className="text-sm text-blue-800">
                  After creating this class, an attendance link will be generated automatically:
                </p>
                <div className="bg-white p-2 rounded border text-sm font-mono text-gray-600">
                  {`${window.location.origin}/attendance/{class-id}/{timestamp}-{random}`}
                </div>
                
                {/* Manual Attendance Link Settings */}
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <h5 className="text-sm font-medium text-green-800 mb-3">⏰ Attendance Link Timing Settings</h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">
                        Enable Auto Activation
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.attendanceSettings.enableAutoActivation}
                          onChange={(e) => setFormData({
                            ...formData, 
                            attendanceSettings: {
                              ...formData.attendanceSettings,
                              enableAutoActivation: e.target.checked
                            }
                          })}
                          className="mr-2"
                        />
                        <span className="text-xs text-green-700">Auto activate link</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">
                        Minutes Before Class
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={formData.attendanceSettings.linkActiveMinutesBefore}
                        onChange={(e) => setFormData({
                          ...formData, 
                          attendanceSettings: {
                            ...formData.attendanceSettings,
                            linkActiveMinutesBefore: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-full px-2 py-1 text-xs border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="15"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-green-700 mb-1">
                        Minutes After Class Starts
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={formData.attendanceSettings.linkActiveMinutesAfter}
                        onChange={(e) => setFormData({
                          ...formData, 
                          attendanceSettings: {
                            ...formData.attendanceSettings,
                            linkActiveMinutesAfter: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-full px-2 py-1 text-xs border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  {/* Live Preview */}
                  {formData.schedule.day && formData.schedule.startTime && formData.schedule.endTime && formData.attendanceSettings.enableAutoActivation && (
                    <div className="bg-white p-3 rounded border">
                      <h6 className="text-xs font-medium text-green-800 mb-2">📋 Live Preview:</h6>
                      <div className="text-xs text-green-700 space-y-1">
                        <p>📅 <strong>Every {formData.schedule.day}</strong></p>
                        <p>🕐 <strong>Class Time:</strong> {formData.schedule.startTime} - {formData.schedule.endTime}</p>
                        <p>✅ <strong>Link Active:</strong> {(() => {
                          const start = new Date(`2000-01-01T${formData.schedule.startTime}`);
                          start.setMinutes(start.getMinutes() - formData.attendanceSettings.linkActiveMinutesBefore);
                          const activeEnd = new Date(`2000-01-01T${formData.schedule.startTime}`);
                          activeEnd.setMinutes(activeEnd.getMinutes() + formData.attendanceSettings.linkActiveMinutesAfter);
                          return `${start.toTimeString().slice(0,5)} to ${activeEnd.toTimeString().slice(0,5)}`;
                        })()} ({formData.attendanceSettings.linkActiveMinutesBefore + formData.attendanceSettings.linkActiveMinutesAfter} minutes total)</p>
                      </div>
                    </div>
                  )}

                  {!formData.attendanceSettings.enableAutoActivation && (
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                      <p className="text-xs text-yellow-700">
                        ⚠️ Auto activation disabled. Attendance link will be always active.
                      </p>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-blue-600">
                  Students will use this link to mark their attendance for "{formData.className} ({formData.courseCode})"
                  {formData.schedule.day && formData.schedule.startTime && 
                    ` during scheduled class times on ${formData.schedule.day}s`
                  }
                </p>
              </div>
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
              {loading ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};