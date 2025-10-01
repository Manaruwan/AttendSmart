import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Users, Calendar, Clock, Upload, X } from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { DatabaseService } from '../../services/databaseService';
import { AuthService } from '../../services/authService';
import { FileUploadService } from '../../services/fileUploadService';
import { Assignment, ClassSchedule } from '../../types';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssignmentCreated: () => void;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssignmentCreated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    batchId: '',
    lecturerId: '',
    deadline: '',
    maxMarks: 100,
    instructions: '',
    fileUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [classData, batchData, lecturerData] = await Promise.all([
        DatabaseService.getClasses(),
        DatabaseService.getBatches(),
        AuthService.getUsersByRole('lecturer')
      ]);
      
      setClasses(classData);
      setBatches(batchData);
      setLecturers(lecturerData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(false);

    try {
      let fileUrl = formData.fileUrl;
      
      // Upload file if selected
      if (selectedFile) {
        setUploading(true);
        
        // Create a temporary assignment ID for folder structure
        const tempAssignmentId = `temp_${Date.now()}`;
        
        try {
          const uploadResult = await FileUploadService.uploadAssignmentMaterial(tempAssignmentId, selectedFile);
          fileUrl = uploadResult;
          setUploadProgress(100);
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          alert('File upload failed. Please try again.');
          return;
        } finally {
          setUploading(false);
        }
      }

      await assignmentService.createAssignment({
        title: formData.title,
        description: formData.description,
        classId: formData.classId,
        batchId: formData.batchId,
        lecturerId: formData.lecturerId,
        deadline: Timestamp.fromDate(new Date(formData.deadline)),
        maxMarks: formData.maxMarks,
        instructions: formData.instructions,
        fileUrl: fileUrl,
        fileName: selectedFile?.name || '',
        fileSize: selectedFile?.size || 0,
        fileType: selectedFile?.type || '',
        isActive: true
      });

      onAssignmentCreated();
      onClose();
      setFormData({
        title: '',
        description: '',
        classId: '',
        batchId: '',
        lecturerId: '',
        deadline: '',
        maxMarks: 100,
        instructions: '',
        fileUrl: ''
      });
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Failed to create assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Assignment</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class *
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} - {cls.subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Batch *
              </label>
              <select
                value={formData.batchId}
                onChange={(e) => setFormData({ ...formData, batchId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} ({batch.department} - {batch.year})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lecturer *
            </label>
            <select
              value={formData.lecturerId}
              onChange={(e) => setFormData({ ...formData, lecturerId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            >
              <option value="">Select Lecturer</option>
              {lecturers.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.firstName} {lecturer.lastName} ({lecturer.department} - {lecturer.employeeId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline *
              </label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Marks *
              </label>
              <input
                type="number"
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })}
                min="1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Any special instructions for students..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Materials
            </label>
            
            {/* File Upload Option */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Upload File
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFile(file);
                      if (file) {
                        setFormData({ ...formData, fileUrl: '' }); // Clear URL if file selected
                      }
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadProgress(0);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                {selectedFile && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Upload size={16} className="text-blue-600" />
                      <span className="text-sm text-blue-800">
                        {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                      </span>
                    </div>
                    {uploading && (
                      <div className="mt-2">
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Uploading... {uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  Supported: PDF, Word, PowerPoint, ZIP, Images (Max 10MB)
                </p>
              </div>
              
              {/* OR divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>
              
              {/* URL Option */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Provide URL
                </label>
                <input
                  type="url"
                  value={formData.fileUrl}
                  onChange={(e) => {
                    setFormData({ ...formData, fileUrl: e.target.value });
                    if (e.target.value) {
                      setSelectedFile(null); // Clear file if URL provided
                    }
                  }}
                  disabled={!!selectedFile}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="https://example.com/assignment.pdf"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <Upload size={16} className="animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Create Assignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignmentManagement: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getAllAssignments();
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await assignmentService.deleteAssignment(assignmentId);
        loadAssignments();
      } catch (error) {
        console.error('Error deleting assignment:', error);
      }
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    if (filter === 'active') {
      return assignment.isActive && assignment.deadline.toDate() > new Date();
    } else if (filter === 'expired') {
      return assignment.deadline.toDate() < new Date();
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assignment Management</h1>
            <p className="text-gray-600 mt-1">Create and manage assignments for classes and batches</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>Create Assignment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-lg ${filter === 'active' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Active ({assignments.filter(a => a.isActive && a.deadline.toDate() > new Date()).length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1 rounded-lg ${filter === 'expired' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Expired ({assignments.filter(a => a.deadline.toDate() < new Date()).length})
          </button>
        </div>
      </div>

      {/* Assignments List */}
      <div className="grid gap-4">
        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FileText size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
            <p className="text-gray-500">Create your first assignment to get started</p>
          </div>
        ) : (
          filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      assignment.deadline.toDate() < new Date() 
                        ? 'bg-red-100 text-red-800' 
                        : assignment.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {assignment.deadline.toDate() < new Date() ? 'Expired' : assignment.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{assignment.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>Deadline: {format(assignment.deadline.toDate(), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={16} />
                      <span>{format(assignment.deadline.toDate(), 'HH:mm')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users size={16} />
                      <span>Max Marks: {assignment.maxMarks}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText size={16} />
                      <span>Submissions: {assignment.submissions?.length || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => console.log('Edit assignment:', assignment.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit Assignment"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteAssignment(assignment.id!)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete Assignment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              {assignment.instructions && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700"><strong>Instructions:</strong> {assignment.instructions}</p>
                </div>
              )}
              
              {assignment.fileUrl && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText size={16} className="text-blue-600" />
                    <p className="text-sm text-blue-800">
                      <strong>Assignment Material:</strong>
                    </p>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-700">
                        {assignment.fileName || 'Assignment File'}
                        {assignment.fileSize && (
                          <span className="text-gray-500 ml-1">
                            ({Math.round(assignment.fileSize / 1024)} KB)
                          </span>
                        )}
                      </span>
                    </div>
                    <a 
                      href={assignment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      <span>Download</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15,3 21,3 21,9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAssignmentCreated={loadAssignments}
      />
    </div>
  );
};

export default AssignmentManagement;
