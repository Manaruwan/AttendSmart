import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Users, Calendar, Clock, Upload, X, Eye, Download, User, Search } from 'lucide-react';
import { assignmentService } from '../../services/assignmentService';
import { DatabaseService } from '../../services/databaseService';
import { AuthService } from '../../services/authService';
import { FileUploadService } from '../../services/fileUploadService';
import { Assignment } from '../../types';
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
    batchId: '',
    lecturerId: '',
    deadline: '',
    maxMarks: 100,
    timeLimit: 60, // Default 60 minutes
    instructions: '',
    fileUrl: '',
    issuedDate: new Date().toISOString().split('T')[0],
    allowLateSubmission: false // New field for late submission
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      const [batchData, lecturerData] = await Promise.all([
        DatabaseService.getBatches(),
        AuthService.getUsersByRole('lecturer')
      ]);
      
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
        batchId: formData.batchId,
        lecturerId: formData.lecturerId,
        deadline: Timestamp.fromDate(new Date(formData.deadline)),
        maxMarks: formData.maxMarks,
        timeLimit: formData.timeLimit,
        instructions: formData.instructions,
        fileUrl: fileUrl,
        fileName: selectedFile?.name || '',
        fileSize: selectedFile?.size || 0,
        fileType: selectedFile?.type || '',
        issuedDate: Timestamp.fromDate(new Date(formData.issuedDate)),
        isActive: true,
        allowLateSubmission: formData.allowLateSubmission
      });

      onAssignmentCreated();
      onClose();
      setFormData({
        title: '',
        description: '',
        batchId: '',
        lecturerId: '',
        deadline: '',
        maxMarks: 100,
        timeLimit: 60,
        instructions: '',
        fileUrl: '',
        issuedDate: new Date().toISOString().split('T')[0],
        allowLateSubmission: false
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
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                Issued Date *
              </label>
              <input
                type="date"
                value={formData.issuedDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
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
              Time Limit (minutes)
            </label>
            <input
              type="number"
              value={formData.timeLimit}
              onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
              min="0"
              max="600"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Enter time limit in minutes (0 = unlimited)"
            />
            <p className="text-xs text-gray-500 mt-1">
              Set to 0 for unlimited time. Students will have this much time to complete the assignment once they start.
            </p>
          </div>

          {/* Late Submission Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="allowLateSubmission"
              checked={formData.allowLateSubmission}
              onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="allowLateSubmission" className="text-sm font-medium text-gray-700">
              Allow Late Submissions
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            If enabled, students can request permission to submit after the deadline expires.
          </p>

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

// Edit Assignment Modal Component
interface EditAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onAssignmentUpdated: () => void;
}

const EditAssignmentModal: React.FC<EditAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onAssignmentUpdated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    batchId: '',
    lecturerId: '',
    deadline: '',
    maxMarks: 100,
    timeLimit: 60,
    instructions: '',
    issuedDate: '',
    allowLateSubmission: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [batches, setBatches] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && assignment) {
      // Pre-fill form with assignment data
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        batchId: assignment.batchId || '',
        lecturerId: assignment.lecturerId || '',
        deadline: assignment.deadline ? new Date(assignment.deadline.toDate()).toISOString().slice(0, 16) : '',
        maxMarks: assignment.maxMarks || 100,
        timeLimit: assignment.timeLimit || 60,
        instructions: assignment.instructions || '',
        issuedDate: assignment.issuedDate ? new Date(assignment.issuedDate.toDate()).toISOString().split('T')[0] : '',
        allowLateSubmission: assignment.allowLateSubmission || false
      });
      loadData();
    }
  }, [isOpen, assignment]);

  const loadData = async () => {
    try {
      const [batchData, lecturerData] = await Promise.all([
        DatabaseService.getBatches(),
        AuthService.getUsersByRole('lecturer')
      ]);
      
      setBatches(batchData);
      setLecturers(lecturerData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment?.id) return;
    
    setLoading(true);
    setUploading(false);

    try {
      let updateData: any = {
        title: formData.title,
        description: formData.description,
        batchId: formData.batchId,
        lecturerId: formData.lecturerId,
        deadline: Timestamp.fromDate(new Date(formData.deadline)),
        maxMarks: formData.maxMarks,
        timeLimit: formData.timeLimit,
        instructions: formData.instructions,
        issuedDate: Timestamp.fromDate(new Date(formData.issuedDate)),
        allowLateSubmission: formData.allowLateSubmission
      };

      // Upload new file if selected
      if (selectedFile) {
        setUploading(true);
        
        try {
          // Delete old file if exists and we're replacing it
          if (assignment.fileUrl) {
            try {
              await FileUploadService.deleteFile(assignment.fileUrl);
            } catch (deleteError) {
              console.warn('Failed to delete old file:', deleteError);
              // Continue with upload even if delete fails
            }
          }

          const uploadResult = await FileUploadService.uploadAssignmentMaterial(assignment.id, selectedFile);
          updateData.fileUrl = uploadResult;
          updateData.fileName = selectedFile.name;
          updateData.fileSize = selectedFile.size;
          updateData.fileType = selectedFile.type;
          setUploadProgress(100);
        } catch (uploadError) {
          console.error('File upload failed:', uploadError);
          alert('File upload failed. Please try again.');
          return;
        } finally {
          setUploading(false);
        }
      }

      await assignmentService.updateAssignment(assignment.id, updateData);

      onAssignmentUpdated();
      onClose();
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Error updating assignment:', error);
      alert('Failed to update assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Edit Assignment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
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
                Issued Date *
              </label>
              <input
                type="date"
                value={formData.issuedDate}
                onChange={(e) => setFormData({ ...formData, issuedDate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
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

          <div className="grid grid-cols-2 gap-4">
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
                    {lecturer.firstName} {lecturer.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Marks *
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
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
                Time Limit (minutes)
              </label>
              <input
                type="number"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: parseInt(e.target.value) || 0 })}
                min="0"
                max="600"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Enter time limit in minutes (0 = unlimited)"
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
              placeholder="Additional instructions for students..."
            />
          </div>

          {/* Late Submission Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="editAllowLateSubmission"
              checked={formData.allowLateSubmission}
              onChange={(e) => setFormData({ ...formData, allowLateSubmission: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="editAllowLateSubmission" className="text-sm font-medium text-gray-700">
              Allow Late Submissions
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            If enabled, students can request permission to submit after the deadline expires.
          </p>

          {/* Current File Display and File Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Materials
            </label>
            
            {/* Show current file if exists */}
            {assignment?.fileUrl && !selectedFile && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText size={16} className="text-green-600" />
                    <span className="text-sm text-green-800">
                      Current File: {assignment.fileName || 'Assignment Material'}
                      {assignment.fileSize && ` (${Math.round(assignment.fileSize / 1024)} KB)`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={assignment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to remove the current file? This action cannot be undone.')) {
                          try {
                            // Delete file from Firebase Storage if URL exists
                            if (assignment.fileUrl) {
                              await FileUploadService.deleteFile(assignment.fileUrl);
                            }
                            
                            // Remove file reference from database
                            const updateData = {
                              fileUrl: '',
                              fileName: '',
                              fileSize: 0,
                              fileType: ''
                            };
                            await assignmentService.updateAssignment(assignment.id!, updateData);
                            onAssignmentUpdated();
                            alert('File removed successfully!');
                          } catch (error) {
                            console.error('Error removing file:', error);
                            alert('Failed to remove file. Please try again.');
                          }
                        }
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Remove current file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* File Upload Option */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  {assignment?.fileUrl && !selectedFile ? 'Replace with New File' : 'Upload New File'}
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedFile(file);
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
                      title="Remove selected file"
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
                        <div className="bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-blue-600 mt-1">Uploading... {uploadProgress}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              disabled={loading || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? `Uploading... ${uploadProgress}%` : loading ? 'Updating...' : 'Update Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assignment Detail Modal Component
interface AssignmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  students?: any[];
}

const AssignmentDetailModal: React.FC<AssignmentDetailModalProps> = ({
  isOpen,
  onClose,
  assignment,
  students = []
}) => {
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [batchInfo, setBatchInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Utility functions to get names from IDs
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : studentId;
  };

  useEffect(() => {
    if (isOpen && assignment) {
      loadAssignmentDetails();
    }
  }, [isOpen, assignment]);

  const loadAssignmentDetails = async () => {
    if (!assignment?.id) return;
    
    setLoading(true);
    try {
      // Load assigned students
      const students = await assignmentService.getAssignedStudents(assignment.id);
      
      // Enrich students with their names from the students list
      const enrichedStudents = students.map(student => {
        const studentInfo = getStudentName(student.studentId);
        return {
          ...student,
          studentName: studentInfo !== student.studentId ? studentInfo : student.studentName || student.studentId
        };
      });
      
      setAssignedStudents(enrichedStudents);

      // Load batch information
      if (assignment.batchId) {
        const batch = await DatabaseService.getBatchById(assignment.batchId);
        setBatchInfo(batch);
      }
    } catch (error) {
      console.error('Error loading assignment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadAllSubmissions = async () => {
    if (!assignment?.submissions || assignment.submissions.length === 0) {
      alert('No submissions available for download.');
      return;
    }

    try {
      let downloadCount = 0;
      let successCount = 0;
      
      // Download all submission files
      for (let index = 0; index < assignment.submissions.length; index++) {
        const submission = assignment.submissions[index];
        
        if (submission.fileUrl) {
          try {
            console.log(`📥 Downloading file ${index + 1}/${assignment.submissions.length}:`, submission.fileUrl);
            
            // Use setTimeout to stagger downloads
            setTimeout(async () => {
              try {
                const fileName = (submission as any).fileName || `${(submission as any).studentName || 'student'}_submission_${index + 1}.pdf`;
                
                const response = await fetch(submission.fileUrl);
                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = fileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  successCount++;
                  console.log(`✅ Downloaded file ${index + 1}: ${fileName}`);
                } else {
                  // Fallback to opening in new tab
                  window.open(submission.fileUrl, '_blank');
                }
              } catch (error) {
                console.error(`❌ Failed to download file ${index + 1}:`, error);
                // Fallback to opening in new tab
                window.open(submission.fileUrl, '_blank');
              }
            }, index * 500); // 500ms delay between downloads
            
            downloadCount++;
          } catch (error) {
            console.error(`❌ Error processing file ${index + 1}:`, error);
          }
        }
      }
      
      const filesWithUrls = assignment.submissions.filter(s => s.fileUrl).length;
      const filesWithoutUrls = assignment.submissions.length - filesWithUrls;
      
      let message = `Starting download of ${filesWithUrls} submission files.`;
      if (filesWithoutUrls > 0) {
        message += ` Note: ${filesWithoutUrls} submissions don't have files attached.`;
      }
      message += '\n\nDownloads will start with a 500ms delay between each file to prevent browser blocking.';
      
      alert(message);
    } catch (error) {
      console.error('Error downloading submissions:', error);
      alert('Failed to download submissions. Please try again.');
    }
  };

  const downloadStudentsList = () => {
    if (assignedStudents.length === 0) {
      alert('No students assigned to this assignment.');
      return;
    }

    const csvContent = [
      ['Student ID', 'Student Name', 'Email', 'Batch', 'Status', 'Submitted At', 'Marks'].join(','),
      ...assignedStudents.map(student => {
        const submission = assignment?.submissions?.find(s => s.studentId === student.studentId);
        return [
          student.studentId || '',
          student.studentName || '',
          student.studentEmail || '',
          batchInfo?.name || '',
          submission ? 'Submitted' : 'Not Submitted',
          submission ? new Date(submission.submittedAt.toDate()).toLocaleDateString() : '',
          submission?.marks?.toString() || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assignment?.title}_Students_List.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{assignment.title}</h2>
              <p className="text-gray-600 mt-1">{assignment.description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading assignment details...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assignment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-blue-600" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Deadline</p>
                      <p className="font-semibold">{format(assignment.deadline.toDate(), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="text-green-600" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Time Limit</p>
                      <p className="font-semibold">{assignment.timeLimit ? `${assignment.timeLimit} minutes` : 'Unlimited'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="text-purple-600" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Max Marks</p>
                      <p className="font-semibold">{assignment.maxMarks}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="text-orange-600" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Batch</p>
                      <p className="font-semibold">{batchInfo?.name || 'Loading...'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={downloadAllSubmissions}
                  disabled={!assignment.submissions?.length}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={16} />
                  <span>Download All Submissions</span>
                </button>
                
                <button
                  onClick={downloadStudentsList}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download size={16} />
                  <span>Download Students List</span>
                </button>
              </div>

              {/* Students List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Assigned Students ({assignedStudents.length})</h3>
                
                {assignedStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>No students assigned to this assignment yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assignedStudents.map((student) => {
                          const submission = assignment.submissions?.find(s => s.studentId === student.studentId);
                          return (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <User className="text-gray-400 mr-3" size={16} />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                                    <div className="text-sm text-gray-500">{student.studentId}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.studentEmail}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  submission 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {submission ? 'Submitted' : 'Not Submitted'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {submission ? format(submission.submittedAt.toDate(), 'MMM dd, yyyy HH:mm') : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {submission?.marks !== undefined ? `${submission.marks}/${assignment.maxMarks}` : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  {submission?.fileUrl && (
                                    <>
                                      <a
                                        href={submission.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                      >
                                        <Eye className="w-4 h-4" />
                                        <span>View</span>
                                      </a>
                                      <button
                                        onClick={async () => {
                                          try {
                                            console.log('📥 Downloading submission file:', submission.fileUrl);
                                            
                                            const fileName = (submission as any).fileName || `${student.studentName}_submission.pdf`;
                                            
                                            // Try direct download with fetch
                                            const response = await fetch(submission.fileUrl);
                                            if (response.ok) {
                                              const blob = await response.blob();
                                              const url = window.URL.createObjectURL(blob);
                                              const link = document.createElement('a');
                                              link.href = url;
                                              link.download = fileName;
                                              document.body.appendChild(link);
                                              link.click();
                                              document.body.removeChild(link);
                                              window.URL.revokeObjectURL(url);
                                              console.log('✅ File downloaded successfully');
                                            } else {
                                              // Fallback to opening in new tab
                                              window.open(submission.fileUrl, '_blank');
                                            }
                                          } catch (error) {
                                            console.error('❌ Download failed:', error);
                                            // Fallback to opening in new tab
                                            window.open(submission.fileUrl, '_blank');
                                          }
                                        }}
                                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                                        title="Download submission file"
                                      >
                                        <Download className="w-4 h-4" />
                                        <span>Download</span>
                                      </button>
                                    </>
                                  )}
                                  {submission && !submission.fileUrl && (
                                    <span className="text-gray-400 text-sm">No file submitted</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AssignmentManagement: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [viewingSubmissions, setViewingSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [submissionSearchTerm, setSubmissionSearchTerm] = useState<string>('');
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignedStudentsCounts, setAssignedStudentsCounts] = useState<{ [key: string]: number }>({});

  // Utility functions to get names from IDs
  const getBatchName = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    return batch?.name || batchId;
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : studentId;
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const [data, batchData, studentData] = await Promise.all([
        assignmentService.getAllAssignments(),
        DatabaseService.getBatches(),
        AuthService.getUsersByRole('student')
      ]);
      setAssignments(data);
      setBatches(batchData);
      setStudents(studentData);
      
      // Load assigned students counts for each assignment
      const counts: { [key: string]: number } = {};
      for (const assignment of data) {
        if (assignment.id) {
          try {
            const assignedStudents = await assignmentService.getAssignedStudents(assignment.id);
            counts[assignment.id] = assignedStudents.length;
          } catch (error) {
            console.error(`Error loading students for assignment ${assignment.id}:`, error);
            counts[assignment.id] = 0;
          }
        }
      }
      setAssignedStudentsCounts(counts);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Advanced Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    assignment: null as Assignment | null,
    step: 1, // 1: Warning, 2: Confirmation, 3: Processing, 4: Complete
    confirmText: '',
    deleteProgress: 0,
    deletingFiles: false,
    deletingDatabase: false,
    currentTask: ''
  });

  const handleDeleteAssignment = async (assignmentId: string) => {
    // Debug logging
    console.log('Delete button clicked for assignment ID:', assignmentId);
    console.log('Available assignments:', assignments.map(a => ({ id: a.id, title: a.title })));
    
    if (!assignmentId) {
      alert('❌ Error: Assignment ID is missing. Cannot delete assignment.');
      return;
    }

    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      alert('❌ Error: Assignment not found in the list. Please refresh and try again.');
      console.error('Assignment not found:', assignmentId);
      return;
    }

    console.log('Opening delete modal for assignment:', assignment.title);
    
    setDeleteModal({
      isOpen: true,
      assignment,
      step: 1,
      confirmText: '',
      deleteProgress: 0,
      deletingFiles: false,
      deletingDatabase: false,
      currentTask: ''
    });
  };

  const proceedToConfirmation = () => {
    setDeleteModal(prev => ({ ...prev, step: 2 }));
  };

  const executeDelete = async () => {
    if (!deleteModal.assignment || deleteModal.confirmText !== 'DELETE') {
      return;
    }

    setDeleteModal(prev => ({ ...prev, step: 3, currentTask: 'Initializing deletion process...' }));

    try {
      const assignment = deleteModal.assignment;
      let progress = 0;
      const totalSteps = 3 + (assignment.submissions?.length || 0);
      
      // Step 1: Delete assignment file
      setDeleteModal(prev => ({ 
        ...prev, 
        deletingFiles: true,
        currentTask: 'Deleting assignment materials...',
        deleteProgress: Math.min(Math.round((++progress / totalSteps) * 100), 100)
      }));
      
      if (assignment.fileUrl) {
        try {
          await FileUploadService.deleteFile(assignment.fileUrl);
          await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay
        } catch (fileError) {
          console.warn('Could not delete assignment file:', fileError);
        }
      }

      // Step 2: Delete submission files
      if (assignment.submissions && assignment.submissions.length > 0) {
        for (let i = 0; i < assignment.submissions.length; i++) {
          const submission = assignment.submissions[i];
          setDeleteModal(prev => ({ 
            ...prev, 
            currentTask: `Deleting submission ${i + 1} of ${assignment.submissions!.length}...`,
            deleteProgress: Math.min(Math.round((++progress / totalSteps) * 100), 100)
          }));
          
          if (submission.fileUrl) {
            try {
              await FileUploadService.deleteFile(submission.fileUrl);
              await new Promise(resolve => setTimeout(resolve, 300)); // Visual delay
            } catch (fileError) {
              console.warn('Could not delete submission file:', fileError);
            }
          }
        }
      }

      setDeleteModal(prev => ({ 
        ...prev, 
        deletingFiles: false,
        deletingDatabase: true,
        currentTask: 'Removing from database...',
        deleteProgress: Math.min(Math.round((++progress / totalSteps) * 100), 99)
      }));

      // Step 3: Delete from database
      await assignmentService.permanentDeleteAssignment(assignment.id!);
      await new Promise(resolve => setTimeout(resolve, 800)); // Visual delay
      
      setDeleteModal(prev => ({ 
        ...prev, 
        deletingDatabase: false,
        currentTask: 'Cleanup completed successfully!',
        deleteProgress: 100,
        step: 4
      }));

      // Remove from local state
      setAssignments(prev => prev.filter(a => a.id !== assignment.id));
      
      // Auto close after 2 seconds
      setTimeout(() => {
        setDeleteModal({
          isOpen: false,
          assignment: null,
          step: 1,
          confirmText: '',
          deleteProgress: 0,
          deletingFiles: false,
          deletingDatabase: false,
          currentTask: ''
        });
        loadAssignments();
      }, 2000);
      
    } catch (error) {
      console.error('Error permanently deleting assignment:', error);
      setDeleteModal(prev => ({ 
        ...prev, 
        currentTask: 'Error occurred during deletion!',
        step: 1
      }));
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowEditModal(true);
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setViewingAssignment(assignment);
    setShowDetailModal(true);
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    try {
      if (!assignment.id) {
        alert('Assignment ID is missing');
        return;
      }
      
      setSubmissionsLoading(true);
      setShowSubmissionsModal(true);
      setViewingAssignment(assignment);
      
      console.log('📊 Loading submissions for assignment:', assignment.title);
      const submissions = await assignmentService.getAssignmentSubmissions(assignment.id);
      
      // Enrich submissions with student names and batch names
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (submission: any) => {
          const studentName = getStudentName(submission.studentId);
          const batchName = getBatchName(assignment.batchId || '');
          
          return {
            ...submission,
            studentName,
            batchName
          };
        })
      );
      
      setViewingSubmissions(enrichedSubmissions);
      console.log('✅ Loaded submissions:', enrichedSubmissions.length);
    } catch (error) {
      console.error('❌ Error loading submissions:', error);
      alert('Failed to load submissions. Please try again.');
      setShowSubmissionsModal(false);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    // First filter by status (active/expired/all)
    let statusMatch = true;
    if (filter === 'active') {
      statusMatch = assignment.isActive && assignment.deadline.toDate() > new Date();
    } else if (filter === 'expired') {
      statusMatch = assignment.deadline.toDate() < new Date();
    }
    
    // Then filter by batch
    let batchMatch = true;
    if (batchFilter !== 'all') {
      batchMatch = assignment.batchId === batchFilter;
    }
    
    return statusMatch && batchMatch;
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
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filters */}
          <div className="flex space-x-2">
            <span className="text-sm font-medium text-gray-700 self-center">Status:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              All ({assignments.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-3 py-1 rounded-lg text-sm ${filter === 'active' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Active ({assignments.filter(a => a.isActive && a.deadline.toDate() > new Date()).length})
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-3 py-1 rounded-lg text-sm ${filter === 'expired' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Expired ({assignments.filter(a => a.deadline.toDate() < new Date()).length})
            </button>
          </div>
          
          {/* Batch Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Batch:</span>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Batches ({assignments.length})</option>
              {batches.map(batch => {
                const batchAssignments = assignments.filter(a => a.batchId === batch.id);
                return (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} ({batchAssignments.length})
                  </option>
                );
              })}
            </select>
          </div>
          
          {/* Clear Filters Button */}
          {(filter !== 'all' || batchFilter !== 'all') && (
            <button
              onClick={() => {
                setFilter('all');
                setBatchFilter('all');
              }}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear Filters
            </button>
          )}
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>Deadline: {format(assignment.deadline.toDate(), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={16} />
                      <span>{format(assignment.deadline.toDate(), 'HH:mm')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={16} />
                      <span>Time: {assignment.timeLimit ? `${assignment.timeLimit} min` : 'Unlimited'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users size={16} />
                      <span>Assigned: {assignedStudentsCounts[assignment.id!] || 0} students</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText size={16} />
                      <span>Max Marks: {assignment.maxMarks}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText size={16} />
                      <span>Submissions: {assignment.submissions?.length || 0}</span>
                    </div>
                  </div>
                  
                  {/* Batch Information */}
                  {assignment.batchId && (
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Batch: {getBatchName(assignment.batchId)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleViewAssignment(assignment)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="View Assignment Details"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleViewSubmissions(assignment)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="View Student Submissions"
                  >
                    <Users size={16} />
                  </button>
                  <button
                    onClick={() => handleEditAssignment(assignment)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Assignment"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      console.log('Delete button clicked for assignment:', assignment.id, assignment.title);
                      if (assignment.id) {
                        handleDeleteAssignment(assignment.id);
                      } else {
                        alert('❌ Error: Assignment ID is missing');
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Assignment Permanently"
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

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAssignment(null);
        }}
        assignment={editingAssignment}
        onAssignmentUpdated={loadAssignments}
      />

      <AssignmentDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setViewingAssignment(null);
        }}
        assignment={viewingAssignment}
        students={students}
      />

      {/* Advanced Delete Modal */}
      {deleteModal.isOpen && deleteModal.assignment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            
            {/* Step 1: Warning */}
            {deleteModal.step === 1 && (
              <>
                <div className="p-6 text-center border-b border-gray-200">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                    <Trash2 className="h-8 w-8 text-red-600 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">⚠️ PERMANENT DELETE</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2">Assignment Details:</h4>
                    <p className="text-red-800 text-sm"><strong>Title:</strong> {deleteModal.assignment.title}</p>
                    <p className="text-red-800 text-sm"><strong>Submissions:</strong> {deleteModal.assignment.submissions?.length || 0} student submissions</p>
                    <p className="text-red-800 text-sm"><strong>Created:</strong> {format(deleteModal.assignment.createdAt.toDate(), 'MMM dd, yyyy')}</p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">🗑️ Will be permanently deleted:</h4>
                    <ul className="text-yellow-800 text-sm space-y-1">
                      <li>• Assignment from Firebase database</li>
                      <li>• All student submissions and files</li>
                      <li>• Assignment materials from storage</li>
                      <li>• All associated data and metadata</li>
                    </ul>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex space-x-3">
                  <button
                    onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={proceedToConfirmation}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Continue to Delete
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Confirmation */}
            {deleteModal.step === 2 && (
              <>
                <div className="p-6 text-center border-b border-gray-200">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Final Confirmation</h3>
                  <p className="text-sm text-gray-600">Type "DELETE" to confirm permanent deletion</p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-blue-900 text-sm font-medium mb-2">
                      Assignment: "{deleteModal.assignment.title}"
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type <span className="font-bold text-red-600">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteModal.confirmText}
                      onChange={(e) => setDeleteModal(prev => ({ ...prev, confirmText: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        deleteModal.confirmText === 'DELETE' 
                          ? 'border-green-500 focus:ring-green-500 bg-green-50' 
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Type DELETE here"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex space-x-3">
                  <button
                    onClick={() => setDeleteModal(prev => ({ ...prev, step: 1, confirmText: '' }))}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={executeDelete}
                    disabled={deleteModal.confirmText !== 'DELETE'}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      deleteModal.confirmText === 'DELETE'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    🗑️ DELETE PERMANENTLY
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Processing */}
            {deleteModal.step === 3 && (
              <>
                <div className="p-6 text-center border-b border-gray-200">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Deleting Assignment</h3>
                  <p className="text-sm text-gray-600">Please wait while we remove all data...</p>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="space-y-3">
                    {/* Progress Bar Container */}
                    <div className="w-full">
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${Math.min(Math.max(deleteModal.deleteProgress, 0), 100)}%`,
                            maxWidth: '100%'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-start text-sm gap-2">
                      <span className="text-gray-600 font-medium flex-shrink-0">
                        {Math.min(Math.max(deleteModal.deleteProgress, 0), 100)}% Complete
                      </span>
                      <span className="text-blue-600 font-medium text-right flex-1 truncate">
                        {deleteModal.currentTask}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="space-y-2">
                    <div className={`flex items-center space-x-2 p-2 rounded ${
                      deleteModal.deletingFiles ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      {deleteModal.deletingFiles ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
                      ) : (
                        <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                      )}
                      <span className={`text-sm ${deleteModal.deletingFiles ? 'text-yellow-700' : 'text-green-700'}`}>
                        Deleting files from storage
                      </span>
                    </div>

                    <div className={`flex items-center space-x-2 p-2 rounded ${
                      deleteModal.deletingDatabase ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      {deleteModal.deletingDatabase ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
                      ) : (
                        <div className="h-4 w-4 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                      )}
                      <span className={`text-sm ${deleteModal.deletingDatabase ? 'text-yellow-700' : 'text-green-700'}`}>
                        Removing from database
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Success */}
            {deleteModal.step === 4 && (
              <>
                <div className="p-6 text-center border-b border-gray-200">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">✅ Successfully Deleted</h3>
                  <p className="text-sm text-green-700">Assignment has been permanently removed</p>
                </div>
                
                <div className="p-6">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-green-800 text-sm">
                      <strong>"{deleteModal.assignment.title}"</strong> and all associated data have been permanently deleted from the system.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Assignment Submissions Modal */}
      {showSubmissionsModal && viewingAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Student Submissions</h2>
                  <p className="text-gray-600 mt-1">Assignment: {viewingAssignment.title}</p>
                </div>
                <button
                  onClick={() => setShowSubmissionsModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {submissionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading submissions...</p>
                </div>
              ) : viewingSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
                  <p className="text-gray-600">No students have submitted this assignment yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Search Input */}
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search students by name, email, or status..."
                          value={submissionSearchTerm}
                          onChange={(e) => setSubmissionSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    {submissionSearchTerm && (
                      <button
                        onClick={() => setSubmissionSearchTerm('')}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">📊 Submission Summary</h3>
                        <p className="text-blue-800 text-sm mt-1">
                          Total Submissions: <strong>{viewingSubmissions.length}</strong>
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            console.log('📥 Starting bulk download of submissions...');
                            
                            let downloadCount = 0;
                            let textSummaryCount = 0;
                            
                            // Download actual files first - improved filtering
                            const filesWithUrls = viewingSubmissions.filter(s => s.fileUrl && s.fileUrl.trim() !== '');
                            console.log(`Found ${filesWithUrls.length} submissions with files out of ${viewingSubmissions.length} total submissions`);
                            
                            // Show detailed info about what will be downloaded
                            console.log('Submissions with files:', filesWithUrls.map(s => ({
                              student: s.studentName,
                              fileName: s.fileName,
                              hasFileUrl: !!s.fileUrl
                            })));
                            
                            // Show initial feedback
                            const totalFiles = filesWithUrls.length;
                            const totalSummaries = viewingSubmissions.length;
                            
                            if (totalFiles === 0 && totalSummaries === 0) {
                              alert('No files or submissions to download.');
                              return;
                            }
                            
                            if (totalFiles === 0) {
                              alert('No submission files found to download.\n\nOnly text summaries will be downloaded.');
                            } else {
                              alert(`Starting bulk download:\n\n📁 ${totalFiles} submission files\n📄 ${totalSummaries} text summaries\n\nDownloads will start automatically with delays to prevent browser blocking.\n\nPlease allow pop-ups/downloads if prompted by your browser.`);
                            }
                            
                            if (filesWithUrls.length > 0) {
                              filesWithUrls.forEach((submission, index) => {
                                setTimeout(async () => {
                                  try {
                                    console.log(`🔄 Attempting to download file ${index + 1} for student: ${submission.studentName}`);
                                    console.log(`File URL: ${submission.fileUrl}`);
                                    console.log(`Original filename: ${submission.fileName}`);
                                    
                                    const fileName = submission.fileName || `${submission.studentName.replace(/[^a-z0-9]/gi, '_')}_submission`;
                                    
                                    const response = await fetch(submission.fileUrl);
                                    console.log(`Response status for file ${index + 1}: ${response.status}`);
                                    
                                    if (response.ok) {
                                      const blob = await response.blob();
                                      console.log(`Blob size for file ${index + 1}: ${blob.size} bytes`);
                                      
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = `${(index + 1).toString().padStart(2, '0')}_${submission.studentName.replace(/[^a-z0-9]/gi, '_')}_${fileName}`;
                                      link.style.display = 'none';
                                      document.body.appendChild(link);
                                      link.click();
                                      
                                      // Clean up
                                      setTimeout(() => {
                                        document.body.removeChild(link);
                                        window.URL.revokeObjectURL(url);
                                      }, 100);
                                      
                                      downloadCount++;
                                      console.log(`✅ Successfully downloaded file ${index + 1}: ${fileName} for ${submission.studentName}`);
                                    } else {
                                      console.error(`❌ Failed to fetch file ${index + 1} for ${submission.studentName}: HTTP ${response.status} - ${response.statusText}`);
                                      console.error(`File URL that failed: ${submission.fileUrl}`);
                                    }
                                  } catch (error) {
                                    console.error(`❌ Failed to download file ${index + 1} for ${submission.studentName}:`, error);
                                    console.error(`File URL: ${submission.fileUrl}`);
                                  }
                                }, index * 1000); // Increased delay to 1000ms for better stability
                              });
                            }
                            
                            // Download text summaries for all submissions
                            setTimeout(() => {
                              viewingSubmissions.forEach((submission, index) => {
                                setTimeout(() => {
                                  const submissionContent = `
STUDENT SUBMISSION
==========================================

Assignment: ${viewingAssignment.title}
Student: ${submission.studentName}
Email: ${submission.studentEmail}
Student ID: ${submission.studentId}
Batch: ${submission.batchId}
Status: ${submission.status}
Submitted At: ${submission.submittedAt ? new Date(submission.submittedAt.seconds * 1000).toLocaleString() : 'Not submitted'}

SUBMISSION CONTENT:
==========================================
${submission.submissionText || 'No text submission provided'}

FILE INFORMATION:
==========================================
File Name: ${submission.fileName || 'No file submitted'}
File Size: ${submission.fileSize ? Math.round(submission.fileSize / 1024) + ' KB' : 'N/A'}
File Type: ${submission.fileType || 'N/A'}

==========================================
Downloaded on: ${new Date().toLocaleString()}
Downloaded by: Admin
`;

                                  const blob = new Blob([submissionContent], { type: 'text/plain' });
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `${(index + 1).toString().padStart(2, '0')}_${submission.studentName.replace(/[^a-z0-9]/gi, '_')}_summary.txt`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                  textSummaryCount++;
                                }, index * 200); // 200ms delay between text summaries
                              });
                            }, filesWithUrls.length * 1000 + 2000); // Start text summaries after files with more delay
                            
                          } catch (error) {
                            console.error('❌ Bulk download failed:', error);
                            alert('Bulk download failed. Please try individual downloads.');
                          }
                        }}
                        className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download All</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {viewingSubmissions
                      .filter(submission => {
                        if (!submissionSearchTerm) return true;
                        
                        const searchLower = submissionSearchTerm.toLowerCase();
                        const studentName = (submission.studentName || getStudentName(submission.studentId) || '').toLowerCase();
                        const email = (submission.email || '').toLowerCase();
                        const status = (submission.status || '').toLowerCase();
                        const batchName = (submission.batchName || getBatchName(submission.batchId || viewingAssignment?.batchId || '') || '').toLowerCase();
                        
                        return studentName.includes(searchLower) || 
                               email.includes(searchLower) || 
                               status.includes(searchLower) ||
                               batchName.includes(searchLower);
                      })
                      .map((submission, index) => (
                      <div key={submission.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{submission.studentName}</h4>
                                <p className="text-sm text-gray-600">{submission.studentEmail}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Student:</span>
                                <p className="font-medium">{submission.studentName || getStudentName(submission.studentId)}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Batch:</span>
                                <p className="font-medium">{submission.batchName || getBatchName(submission.batchId || viewingAssignment?.batchId || '')}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Status:</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  submission.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {submission.status}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Submitted:</span>
                                <p className="font-medium">
                                  {submission.submittedAt ? 
                                    new Date(submission.submittedAt.seconds * 1000).toLocaleDateString() :
                                    'Not submitted'
                                  }
                                </p>
                              </div>
                            </div>
                            
                            {(submission as any).submissionText && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Submission Text:</span>
                                <p className="text-sm text-gray-600 mt-1">{(submission as any).submissionText}</p>
                              </div>
                            )}
                            
                            {(submission as any).fileName && (
                              <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                                <FileText className="w-4 h-4" />
                                <span>File: {(submission as any).fileName}</span>
                                {(submission as any).fileSize && (
                                  <span>({Math.round((submission as any).fileSize / 1024)} KB)</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Download Buttons */}
                          <div className="ml-4 flex-shrink-0 flex space-x-2">
                            {/* Download Actual File Button */}
                            {submission.fileUrl && (
                              <button
                                onClick={async () => {
                                  try {
                                    console.log('📥 Downloading file:', submission.fileUrl);
                                    
                                    // Create a better download experience
                                    const fileName = (submission as any).fileName || `${(submission as any).studentName || 'student'}_submission.pdf`;
                                    
                                    // Try direct download first
                                    const response = await fetch(submission.fileUrl);
                                    if (response.ok) {
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = fileName;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                      console.log('✅ File downloaded successfully');
                                    } else {
                                      // Fallback to opening in new tab
                                      window.open(submission.fileUrl, '_blank');
                                    }
                                  } catch (error) {
                                    console.error('❌ Download failed:', error);
                                    // Fallback to opening in new tab
                                    window.open(submission.fileUrl, '_blank');
                                  }
                                }}
                                className="px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                                title="Download submitted file"
                              >
                                <Download className="w-4 h-4" />
                                <span>File</span>
                              </button>
                            )}
                            
                            {/* Summary button removed */}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              {/* Export CSV button removed */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
