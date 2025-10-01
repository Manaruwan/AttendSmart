import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Send, X, CheckCircle, AlertCircle, User, History } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

interface LeaveRequest {
  lecturerId: string;
  lecturerName: string;
  lecturerEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  emergencyContact: string;
  emergencyPhone: string;
  coverageArrangements: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  documents?: File[];
}

const LeaveRequestForm: React.FC<{ onViewHistory?: () => void }> = ({ onViewHistory }) => {
  const { firebaseUser } = useFirebaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Update form data when user data becomes available
  useEffect(() => {
    let userName = '';
    let userEmail = '';
    
    if (firebaseUser) {
      userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '';
      userEmail = firebaseUser.email || '';
    } else {
      // For demonstration purposes, use mock data when no user is authenticated
      userName = 'John Lecturer';
      userEmail = 'lecturer@university.edu';
    }
    
    setFormData(prev => ({
      ...prev,
      fullName: userName,
      email: userEmail
    }));
    
    // Auto-select the name field after a short delay
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }, 100);
  }, [firebaseUser]);

  const leaveTypes = [
    'Annual Leave',
    'Sick Leave', 
    'Emergency Leave',
    'Personal Leave',
    'Maternity/Paternity Leave',
    'Conference/Training Leave',
    'Sabbatical Leave',
    'Unpaid Leave'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateLeaveDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return 'Please enter your full name';
    if (!formData.email.trim()) return 'Please enter your email address';
    if (!formData.leaveType) return 'Please select a leave type';
    if (!formData.startDate) return 'Please select start date';
    if (!formData.endDate) return 'Please select end date';
    if (!formData.reason.trim()) return 'Please provide a reason for leave';

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate < startDate) return 'End date must be after start date';

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const leaveRequest: Omit<LeaveRequest, 'id'> = {
        lecturerId: firebaseUser?.uid || 'unknown',
        lecturerName: formData.fullName,
        lecturerEmail: formData.email,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        emergencyContact: '',
        emergencyPhone: '',
        coverageArrangements: '',
        status: 'pending',
        submittedAt: new Date()
      };

      // Save to Firebase
      await addDoc(collection(db, 'leaveRequests'), leaveRequest);

      // Show success message
      setShowSuccess(true);
      
      // Reset form
      let userName = '';
      let userEmail = '';
      
      if (firebaseUser) {
        userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '';
        userEmail = firebaseUser.email || '';
      } else {
        userName = 'John Lecturer';
        userEmail = 'lecturer@university.edu';
      }
      
      setFormData({
        fullName: userName,
        email: userEmail,
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: ''
      });

      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error) {
      console.error('Error submitting leave request:', error);
      setError('Failed to submit leave request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    let userName = '';
    let userEmail = '';
    
    if (firebaseUser) {
      userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '';
      userEmail = firebaseUser.email || '';
    } else {
      // Use mock data for demonstration
      userName = 'John Lecturer';
      userEmail = 'lecturer@university.edu';
    }
    
    setFormData({
      fullName: userName,
      email: userEmail,
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: ''
    });
    setError(null);
    
    // Auto-select the name field after reset
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }, 100);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Leave Request Submitted!</h2>
            <p className="text-gray-600 mb-6">
              Your leave request has been successfully submitted and is now pending approval.
              You will be notified once it's reviewed by the administration.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onViewHistory && (
                <button
                  onClick={onViewHistory}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <History className="w-4 h-4" />
                  <span>View Request History</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Request Form</h1>
          <p className="text-gray-600">Submit a leave request for approval by the administration.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Leave Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Leave Type *
                    </label>
                    <select
                      name="leaveType"
                      value={formData.leaveType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select leave type...</option>
                      {leaveTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {formData.startDate && formData.endDate && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Total leave days: <strong>{calculateLeaveDays()} days</strong>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Leave *
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Please provide a detailed reason for your leave request..."
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Submit Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Request</h3>
                
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                      isSubmitting
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Request'}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Reset Form</span>
                  </button>
                </div>
              </div>

              {/* Guidelines */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Important Guidelines</h3>
                <ul className="text-sm text-yellow-700 space-y-2">
                  <li>• Submit requests at least 7 days in advance</li>
                  <li>• Emergency leave can be submitted immediately</li>
                  <li>• All fields marked with * are required</li>
                  <li>• Ensure coverage arrangements are confirmed</li>
                  <li>• Check your email for approval notifications</li>
                </ul>
              </div>

              {/* Contact Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Need Help?</h3>
                <p className="text-sm text-blue-700 mb-2">
                  Contact HR Department for assistance:
                </p>
                <p className="text-sm text-blue-700">
                  📧 hr@campus.edu<br />
                  📞 +94 11 234 5678<br />
                  🕐 Mon-Fri 9:00 AM - 5:00 PM
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveRequestForm;