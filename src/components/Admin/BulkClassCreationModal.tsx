import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AuthService } from '../../services/authService';

interface ClassSchedule {
  id: string;
  className: string;
  courseCode: string;
  description: string;
  instructor: string;
  lecturerId: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  capacity: number;
}

interface BulkClassCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassesCreated: () => void;
}

export const BulkClassCreationModal: React.FC<BulkClassCreationModalProps> = ({ 
  isOpen, 
  onClose, 
  onClassesCreated 
}) => {
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [commonData, setCommonData] = useState({
    department: '',
    semester: '',
    year: new Date().getFullYear().toString(),
    credits: '3',
    attendanceSettings: {
      linkActiveMinutesBefore: 15,
      linkActiveMinutesAfter: 30,
      enableAutoActivation: true
    }
  });

  const [classes, setClasses] = useState<ClassSchedule[]>([
    {
      id: '1',
      className: '',
      courseCode: '',
      description: '',
      instructor: '',
      lecturerId: '',
      day: 'Monday',
      startTime: '08:00',
      endTime: '10:00',
      room: '',
      capacity: 30
    }
  ]);

  const [batches, setBatches] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);
  const [showLinkPreviews, setShowLinkPreviews] = useState<{ [key: string]: boolean }>({});
  const [newBatchData, setNewBatchData] = useState({
    name: '',
    year: new Date().getFullYear(),
    department: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Generate attendance link for a class
  const generateAttendanceLink = () => {
    const baseUrl = window.location.origin;
    const classId = 'cls_' + Math.random().toString(36).substr(2, 8);
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 10);
    return `${baseUrl}/attendance/${classId}/${timestamp}-${randomPart}`;
  };

  // Generate masked attendance link preview
  const generateMaskedLinkPreview = (classId: string, isVisible: boolean = false) => {
    const baseUrl = window.location.origin;
    const mockClassId = 'cls_' + Math.random().toString(36).substr(2, 8);
    const mockTimestamp = Date.now();
    const mockRandomPart = Math.random().toString(36).substr(2, 10);
    const fullLink = `${baseUrl}/attendance/${mockClassId}/${mockTimestamp}-${mockRandomPart}`;
    
    if (isVisible) {
      return fullLink;
    } else {
      // Show only first part and mask the rest
      const parts = fullLink.split('/');
      const maskedParts = parts.map((part, index) => {
        if (index < 3) return part; // Keep protocol and domain
        if (index === 3) return 'attendance';
        return '●●●●●●●●'; // Mask the sensitive parts
      });
      return maskedParts.join('/');
    }
  };

  // Load data when modal opens
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;
      
      try {
        // Load batches
        const batchSnapshot = await getDocs(collection(db, 'batches'));
        const batchData = batchSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBatches(batchData);

        // Load lecturers
        const lecturerData = await AuthService.getUsersByRole('lecturer');
        setLecturers(lecturerData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Error loading data. Please try again.');
      }
    };

    loadData();
  }, [isOpen]);

  // Add new class to the list
  const addNewClass = () => {
    const newClass: ClassSchedule = {
      id: (classes.length + 1).toString(),
      className: '',
      courseCode: '',
      description: '',
      instructor: '',
      lecturerId: '',
      day: 'Monday',
      startTime: '08:00',
      endTime: '10:00',
      room: '',
      capacity: 30
    };
    setClasses([...classes, newClass]);
  };

  // Remove class from the list
  const removeClass = (id: string) => {
    if (classes.length > 1) {
      setClasses(classes.filter(cls => cls.id !== id));
    }
  };

  // Update class data
  const updateClass = (id: string, field: keyof ClassSchedule, value: any) => {
    setClasses(classes.map(cls => 
      cls.id === id ? { ...cls, [field]: value } : cls
    ));
  };

  // Handle lecturer selection
  const handleLecturerChange = (id: string, lecturerId: string) => {
    const selectedLecturer = lecturers.find(l => l.id === lecturerId);
    if (selectedLecturer) {
      updateClass(id, 'lecturerId', lecturerId);
      updateClass(id, 'instructor', selectedLecturer.fullName || selectedLecturer.name || selectedLecturer.email);
    }
  };

  // Create new batch
  const createNewBatch = async () => {
    if (!newBatchData.name.trim()) {
      setError('Batch name is required');
      return;
    }

    try {
      setLoading(true);
      const docRef = await addDoc(collection(db, 'batches'), {
        name: newBatchData.name,
        year: newBatchData.year,
        department: newBatchData.department,
        createdAt: Timestamp.now(),
        status: 'active'
      });

      const newBatch = {
        id: docRef.id,
        ...newBatchData
      };

      setBatches([...batches, newBatch]);
      setSelectedBatchId(docRef.id);
      setShowNewBatchForm(false);
      setNewBatchData({ name: '', year: new Date().getFullYear(), department: '' });
      setSuccess('Batch created successfully!');
    } catch (err) {
      console.error('Error creating batch:', err);
      setError('Error creating batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create all classes
  const createAllClasses = async () => {
    if (!selectedBatchId) {
      setError('Please select a batch first');
      return;
    }

    // Validate all classes
    for (const cls of classes) {
      if (!cls.className.trim() || !cls.courseCode.trim() || !cls.lecturerId) {
        setError('Please fill in all required fields for all classes');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');

      const promises = classes.map(async (cls) => {
        const classData = {
          className: cls.className,
          courseCode: cls.courseCode,
          description: cls.description,
          instructor: cls.instructor,
          lecturerId: cls.lecturerId,
          batchId: selectedBatchId,
          department: commonData.department,
          semester: commonData.semester,
          year: commonData.year,
          credits: parseInt(commonData.credits),
          schedule: {
            day: cls.day,
            startTime: cls.startTime,
            endTime: cls.endTime,
            room: cls.room
          },
          capacity: cls.capacity,
          enrolledStudents: 0,
          status: 'active',
          createdAt: Timestamp.now(),
          attendanceLink: generateAttendanceLink(),
          attendanceLinkGeneratedAt: Timestamp.now(),
          attendanceSettings: commonData.attendanceSettings
        };

        return addDoc(collection(db, 'classes'), classData);
      });

      await Promise.all(promises);
      
      setSuccess(`Successfully created ${classes.length} classes!`);
      setTimeout(() => {
        onClassesCreated();
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error creating classes:', err);
      setError('Error creating classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Copy class data to create similar classes
  const copyClass = (sourceId: string) => {
    const sourceClass = classes.find(cls => cls.id === sourceId);
    if (sourceClass) {
      const newClass: ClassSchedule = {
        ...sourceClass,
        id: (classes.length + 1).toString(),
        className: sourceClass.className + ' (Copy)',
        courseCode: sourceClass.courseCode + '_COPY'
      };
      setClasses([...classes, newClass]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Class Creation</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
              {success}
            </div>
          )}

          {/* Batch Selection */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Select Batch</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch *
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Batch</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.year})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setShowNewBatchForm(!showNewBatchForm)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Create New Batch
                </button>
              </div>
            </div>

            {/* New Batch Form */}
            {showNewBatchForm && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Create New Batch</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Batch Name *
                    </label>
                    <input
                      type="text"
                      value={newBatchData.name}
                      onChange={(e) => setNewBatchData({...newBatchData, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="e.g., SE-2024-01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year *
                    </label>
                    <input
                      type="number"
                      value={newBatchData.year}
                      onChange={(e) => setNewBatchData({...newBatchData, year: parseInt(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      min="2020"
                      max="2030"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newBatchData.department}
                      onChange={(e) => setNewBatchData({...newBatchData, department: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Software Engineering"
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={createNewBatch}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Batch'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewBatchForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Common Data */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Common Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <input
                  type="text"
                  value={commonData.department}
                  onChange={(e) => setCommonData({...commonData, department: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Software Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <input
                  type="text"
                  value={commonData.semester}
                  onChange={(e) => setCommonData({...commonData, semester: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 1st Semester"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <input
                  type="text"
                  value={commonData.year}
                  onChange={(e) => setCommonData({...commonData, year: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credits
                </label>
                <input
                  type="number"
                  value={commonData.credits}
                  onChange={(e) => setCommonData({...commonData, credits: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="1"
                  max="10"
                />
              </div>
            </div>
          </div>

          {/* Classes List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Classes ({classes.length})</h3>
              <button
                type="button"
                onClick={addNewClass}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                Add Class
              </button>
            </div>

            <div className="space-y-4">
              {classes.map((cls, index) => (
                <div key={cls.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Class {index + 1}</h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => copyClass(cls.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Copy Class"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {classes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeClass(cls.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          title="Remove Class"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Name *
                      </label>
                      <input
                        type="text"
                        value={cls.className}
                        onChange={(e) => updateClass(cls.id, 'className', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., Data Structures"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course Code *
                      </label>
                      <input
                        type="text"
                        value={cls.courseCode}
                        onChange={(e) => updateClass(cls.id, 'courseCode', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., SE101"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lecturer *
                      </label>
                      <select
                        value={cls.lecturerId}
                        onChange={(e) => handleLecturerChange(cls.id, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select Lecturer</option>
                        {lecturers.map((lecturer) => (
                          <option key={lecturer.id} value={lecturer.id}>
                            {lecturer.fullName || lecturer.name || lecturer.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Day
                      </label>
                      <select
                        value={cls.day}
                        onChange={(e) => updateClass(cls.id, 'day', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {days.map((day) => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={cls.startTime}
                        onChange={(e) => updateClass(cls.id, 'startTime', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={cls.endTime}
                        onChange={(e) => updateClass(cls.id, 'endTime', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Room
                      </label>
                      <input
                        type="text"
                        value={cls.room}
                        onChange={(e) => updateClass(cls.id, 'room', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        placeholder="e.g., Lab 101"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={cls.capacity}
                        onChange={(e) => updateClass(cls.id, 'capacity', parseInt(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        min="1"
                        max="200"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={cls.description}
                      onChange={(e) => updateClass(cls.id, 'description', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="Brief description of the class..."
                    />
                  </div>

                  {/* Attendance Link Preview */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium text-blue-900">Attendance Link Preview</h5>
                      <button
                        type="button"
                        onClick={() => setShowLinkPreviews({
                          ...showLinkPreviews,
                          [cls.id]: !showLinkPreviews[cls.id]
                        })}
                        className="flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showLinkPreviews[cls.id] ? (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hide Link
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Show Link
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-blue-700 mb-2">
                      After creating this class, an attendance link will be generated automatically:
                    </div>
                    <div className="bg-white rounded border p-3 font-mono text-xs text-gray-700 break-all">
                      {generateMaskedLinkPreview(cls.id, showLinkPreviews[cls.id])}
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      🔒 Link details are masked for security. Click "Show Link" to reveal (admin only).
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      <strong>Access:</strong> Only students from the selected batch can use this link.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance Settings */}
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Attendance Link Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minutes Before Class
                </label>
                <input
                  type="number"
                  value={commonData.attendanceSettings.linkActiveMinutesBefore}
                  onChange={(e) => setCommonData({
                    ...commonData,
                    attendanceSettings: {
                      ...commonData.attendanceSettings,
                      linkActiveMinutesBefore: parseInt(e.target.value)
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  max="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minutes After Class Starts
                </label>
                <input
                  type="number"
                  value={commonData.attendanceSettings.linkActiveMinutesAfter}
                  onChange={(e) => setCommonData({
                    ...commonData,
                    attendanceSettings: {
                      ...commonData.attendanceSettings,
                      linkActiveMinutesAfter: parseInt(e.target.value)
                    }
                  })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="0"
                  max="120"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={commonData.attendanceSettings.enableAutoActivation}
                    onChange={(e) => setCommonData({
                      ...commonData,
                      attendanceSettings: {
                        ...commonData.attendanceSettings,
                        enableAutoActivation: e.target.checked
                      }
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Auto Activate Links
                  </span>
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Attendance links will be automatically generated for each class and activated according to these settings.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={createAllClasses}
            disabled={loading || !selectedBatchId || classes.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create {classes.length} Classes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};