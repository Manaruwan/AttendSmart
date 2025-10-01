import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  AlertCircle,
  Send,
  Paperclip
} from 'lucide-react';
import { collection, addDoc, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../config/firebase';
import { useToasts } from '../../hooks/useToasts';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import ToastContainer from '../Common/ToastContainer';

interface MitigationFormData {
  title: string;
  description: string;
  reason: string;
  courseCode: string;
  assignmentName: string;
  originalDueDate: string;
  requestedExtension: number;
  attachments: File[];
}

export const StudentMitigationForm: React.FC = () => {
  const { toasts, showSuccess, showError, removeToast } = useToasts();
  const { currentUser, firebaseUser, loading: authLoading } = useFirebaseAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MitigationFormData>({
    title: '',
    description: '',
    reason: '',
    courseCode: '',
    assignmentName: '',
    originalDueDate: '',
    requestedExtension: 1,
    attachments: []
  });

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Please Log In</h2>
        <p className="text-gray-600">
          You need to be logged in to submit mitigation requests.
        </p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'requestedExtension' ? parseInt(value) || 1 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        attachments: Array.from(e.target.files || [])
      }));
    }
  };

  const uploadAttachments = async (studentId: string, requestId: string): Promise<string[]> => {
    const uploadPromises = formData.attachments.map(async (file, index) => {
      const fileName = `${Date.now()}_${index}_${file.name}`;
      const fileRef = ref(storage, `mitigation-attachments/${studentId}/${requestId}/${fileName}`);
      await uploadBytes(fileRef, file);
      return await getDownloadURL(fileRef);
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    console.log('Form submitted!', formData); // Debug log
    
    // Basic validation
    if (!formData.title.trim() || !formData.description.trim() || !formData.reason.trim()) {
      showError('Validation Error', 'Please fill in all required fields (Title, Description, and Reason)');
      return;
    }

    setLoading(true);

    try {
      // Get current user info from Firebase Auth
      console.log('=== DEBUG INFO ===');
      console.log('currentUser:', currentUser);
      console.log('firebaseUser:', firebaseUser);
      console.log('auth.currentUser:', auth.currentUser);
      
      if (!currentUser && !firebaseUser && !auth.currentUser) {
        showError('Authentication Error', 'You must be logged in to submit a request');
        setLoading(false);
        return;
      }

      // Create fallback user data if needed
      const userId = currentUser?.id || firebaseUser?.uid || auth.currentUser?.uid || 'student_' + Date.now();
      const userEmail = currentUser?.email || firebaseUser?.email || auth.currentUser?.email || 'unknown@email.com';
      const userName = currentUser?.firstName && currentUser?.lastName 
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : firebaseUser?.displayName || auth.currentUser?.displayName || 'Unknown User';

      console.log('Final values:');
      console.log('userId:', userId);
      console.log('userEmail:', userEmail);
      console.log('userName:', userName);

      // Validate that we have essential data
      if (!userId || userId.startsWith('student_') || !userEmail || userEmail === 'unknown@email.com') {
        // Create a temporary student ID based on browser session
        const tempUserId = 'temp_student_' + (localStorage.getItem('tempStudentId') || Date.now());
        const tempUserEmail = 'temp.student@example.com';
        const tempUserName = 'Demo Student';
        
        // Store the temp ID in localStorage for consistency
        localStorage.setItem('tempStudentId', tempUserId.replace('temp_student_', ''));
        
        console.log('Using temporary student data for demo:');
        console.log('tempUserId:', tempUserId);
        console.log('tempUserEmail:', tempUserEmail);
        console.log('tempUserName:', tempUserName);
        
        // Use temp data
        const finalUserId = tempUserId;
        const finalUserEmail = tempUserEmail;
        const finalUserName = tempUserName;
        
        // Create the mitigation request document with temp data
        const requestData = {
          studentId: finalUserId,
          studentName: finalUserName,
          studentEmail: finalUserEmail,
          title: formData.title,
          description: formData.description,
          reason: formData.reason,
          courseCode: formData.courseCode,
          assignmentName: formData.assignmentName,
          originalDueDate: formData.originalDueDate ? new Date(formData.originalDueDate) : null,
          requestedExtension: formData.requestedExtension,
          requestDate: Timestamp.now(),
          status: 'pending',
          attachments: []
        };

        console.log('Temp request data:', requestData);

        // Add document to Firestore
        const docRef = await addDoc(collection(db, 'mitigationRequests'), requestData);
        console.log('Document created with ID:', docRef.id);

        showSuccess(
          'Request Submitted Successfully!',
          'Your mitigation request has been submitted and is pending review.'
        );

        // Reset form
        setFormData({
          title: '',
          description: '',
          reason: '',
          courseCode: '',
          assignmentName: '',
          originalDueDate: '',
          requestedExtension: 1,
          attachments: []
        });

        // Reset file input
        const fileInput = document.getElementById('attachments') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        setLoading(false);
        return;
      }

      // Create the mitigation request document
      const requestData = {
        studentId: userId,
        studentName: userName,
        studentEmail: userEmail,
        title: formData.title,
        description: formData.description,
        reason: formData.reason,
        courseCode: formData.courseCode,
        assignmentName: formData.assignmentName,
        originalDueDate: formData.originalDueDate ? new Date(formData.originalDueDate) : null,
        requestedExtension: formData.requestedExtension,
        requestDate: Timestamp.now(),
        status: 'pending',
        attachments: []
      };

      console.log('Request data:', requestData); // Debug log

      // Add document to Firestore
      const docRef = await addDoc(collection(db, 'mitigationRequests'), requestData);
      console.log('Document created with ID:', docRef.id); // Debug log

      // Upload attachments if any
      let attachmentUrls: string[] = [];
      if (formData.attachments.length > 0) {
        try {
          attachmentUrls = await uploadAttachments(userId, docRef.id);
          // Update document with attachment URLs
          await updateDoc(doc(db, 'mitigationRequests', docRef.id), {
            attachments: attachmentUrls
          });
          console.log('Attachments uploaded:', attachmentUrls); // Debug log
        } catch (uploadError) {
          console.error('Error uploading attachments:', uploadError);
          // Don't fail the whole request if attachments fail
        }
      }

      showSuccess(
        'Request Submitted Successfully!',
        'Your mitigation request has been submitted and is pending review.'
      );

      // Reset form
      setFormData({
        title: '',
        description: '',
        reason: '',
        courseCode: '',
        assignmentName: '',
        originalDueDate: '',
        requestedExtension: 1,
        attachments: []
      });

      // Reset file input
      const fileInput = document.getElementById('attachments') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error submitting mitigation request:', error);
      showError('Submission Failed', 'Failed to submit your mitigation request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <FileText className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Mitigation Request Form</h1>
          </div>
          <p className="text-gray-600">
            Submit a request for assignment extensions, deadline modifications, or other academic considerations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Request Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Extension request for Database Project"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  name="courseCode"
                  value={formData.courseCode}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., CS101, MATH201"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment/Exam Name
                </label>
                <input
                  type="text"
                  name="assignmentName"
                  value={formData.assignmentName}
                  onChange={handleInputChange}
                  placeholder="e.g., Final Project, Midterm Exam"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Due Date
                </label>
                <input
                  type="date"
                  name="originalDueDate"
                  value={formData.originalDueDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requested Extension (Days)
              </label>
              <select
                name="requestedExtension"
                value={formData.requestedExtension}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 14, 21, 30].map(days => (
                  <option key={days} value={days}>
                    {days} {days === 1 ? 'day' : 'days'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brief Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Provide a brief description of your request..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Reason/Justification *
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Explain in detail why you need this mitigation. Include any relevant circumstances, documentation, or supporting information..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Supporting Documents</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="attachments"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                    >
                      <span>Upload files</span>
                      <input
                        id="attachments"
                        name="attachments"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, JPG, PNG up to 10MB each
                  </p>
                </div>
              </div>
              
              {formData.attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                  <ul className="space-y-2">
                    {formData.attachments.map((file, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Paperclip className="w-4 h-4 mr-2" />
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Important Notes:</h4>
                <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside space-y-1">
                  <li>Submit your request as early as possible, preferably before the original deadline.</li>
                  <li>Provide detailed and honest explanations for your request.</li>
                  <li>Include any supporting documentation that validates your circumstances.</li>
                  <li>You will receive an email notification once your request is reviewed.</li>
                  <li>Approval is not guaranteed and depends on the validity of your request.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  reason: '',
                  courseCode: '',
                  assignmentName: '',
                  originalDueDate: '',
                  requestedExtension: 1,
                  attachments: []
                });
                const fileInput = document.getElementById('attachments') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Clear Form
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentMitigationForm;