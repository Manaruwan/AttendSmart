import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Send, User, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import ToastContainer from '../Common/ToastContainer';
import { useToasts } from '../../hooks/useToasts';

interface StaffLeaveFormData {
  staffName: string;
  staffEmail: string;
  staffId: string;
  department: string;
  position: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface StaffLeaveRequest extends StaffLeaveFormData {
  id?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

const SimpleStaffLeaveForm: React.FC = () => {
  const [formData, setFormData] = useState<StaffLeaveFormData>({
    staffName: '',
    staffEmail: '',
    staffId: '',
    department: '',
    position: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRequests, setUserRequests] = useState<StaffLeaveRequest[]>([]);
  
  // Toast notifications
  const { toasts, removeToast, showSuccess: showToastSuccess, showError: showToastError } = useToasts();

  // Leave types in Sinhala and English
  const leaveTypes = [
    { value: 'annual', label: 'වාර්ෂික නිවාඩු / Annual Leave' },
    { value: 'sick', label: 'අසනීප නිවාඩු / Sick Leave' },
    { value: 'emergency', label: 'හදිසි නිවාඩු / Emergency Leave' },
    { value: 'personal', label: 'පුද්ගලික නිවාඩු / Personal Leave' },
    { value: 'maternity', label: 'මාතෘ/පිතෘ නිවාඩු / Maternity/Paternity Leave' },
    { value: 'study', label: 'අධ්‍යාපන නිවාඩු / Study Leave' },
    { value: 'compassionate', label: 'අනුකම්පනීය නිවාඩු / Compassionate Leave' },
    { value: 'medical', label: 'වෛද්‍ය නිවාඩු / Medical Leave' }
  ];

  // Departments
  const departments = [
    { value: 'administration', label: 'පරිපාලනය / Administration' },
    { value: 'hr', label: 'මානව සම්පත් / Human Resources' },
    { value: 'finance', label: 'මුදල් / Finance' },
    { value: 'it', label: 'තොරතුරු තාක්ෂණය / IT Services' },
    { value: 'library', label: 'පුස්තකාලය / Library Services' },
    { value: 'student_affairs', label: 'ශිෂ්‍ය කටයුතු / Student Affairs' },
    { value: 'maintenance', label: 'නඩත්තුව / Maintenance' },
    { value: 'security', label: 'ආරක්ෂාව / Security' },
    { value: 'academic_support', label: 'අධ්‍යාපනික සහාය / Academic Support' }
  ];

  // Load user's previous requests
  useEffect(() => {
    loadUserRequests();
  }, [formData.staffEmail]);

  const loadUserRequests = async () => {
    if (!formData.staffEmail) return;
    
    try {
      const q = query(
        collection(db, 'staffLeaveRequests'),
        where('staffEmail', '==', formData.staffEmail)
      );
      const querySnapshot = await getDocs(q);
      const requests: StaffLeaveRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          approvedAt: data.approvedAt?.toDate()
        } as StaffLeaveRequest);
      });
      
      setUserRequests(requests.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()));
    } catch (error) {
      console.error('Error loading user requests:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  const validateForm = (): string | null => {
    if (!formData.staffName.trim()) return 'කරුණාකර ඔබේ නම ඇතුළත් කරන්න / Please enter your name';
    if (!formData.staffEmail.trim()) return 'කරුණාකර ඔබේ ඊමේල් ලිපිනය ඇතුළත් කරන්න / Please enter your email';
    if (!formData.staffId.trim()) return 'කරුණාකර ඔබේ කර්මචාරී අංකය ඇතුළත් කරන්න / Please enter your staff ID';
    if (!formData.department) return 'කරුණාකර දෙපාර්තමේන්තුව තෝරන්න / Please select department';
    if (!formData.position.trim()) return 'කරුණාකර ඔබේ තනතුර ඇතුළත් කරන්න / Please enter your position';
    if (!formData.leaveType) return 'කරුණාකර නිවාඩු වර්ගය තෝරන්න / Please select leave type';
    if (!formData.startDate) return 'කරුණාකර ආරම්භක දිනය තෝරන්න / Please select start date';
    if (!formData.endDate) return 'කරුණාකර අවසාන දිනය තෝරන්න / Please select end date';
    if (!formData.reason.trim()) return 'කරුණාකර හේතුව ඇතුළත් කරන්න / Please provide reason';

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    if (endDate < startDate) {
      return 'අවසාන දිනය ආරම්භක දිනයට වඩා පසුව විය යුතුය / End date must be after start date';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setShowError(true);
      return;
    }

    setIsSubmitting(true);
    setShowError(false);

    try {
      const leaveRequest: Omit<StaffLeaveRequest, 'id'> = {
        ...formData,
        status: 'pending',
        submittedAt: new Date()
      };

      console.log('Submitting staff leave request to Firebase:', leaveRequest);

      // Save to Firebase
      const docRef = await addDoc(collection(db, 'staffLeaveRequests'), leaveRequest);
      
      console.log('Staff leave request saved successfully! Document ID:', docRef.id);

      // Show success toast notification
      showToastSuccess(
        'ඉල්ලීම සාර්ථකයි! / Request Submitted!',
        `ඔබේ නිවාඩු ඉල්ලීම සාර්ථකව යවන ලදී. පරිපාලකයන් විසින් ඉතා ඉක්මනින් සමාලෝචනය කරනු ඇත / Your leave request has been submitted successfully and will be reviewed by administrators soon.`,
        7000
      );
      
      // Reset form
      setFormData({
        staffName: '',
        staffEmail: '',
        staffId: '',
        department: '',
        position: '',
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: ''
      });

      // Reload user requests
      loadUserRequests();

    } catch (error) {
      console.error('Error submitting staff leave request:', error);
      showToastError(
        'දෝෂයක් සිදුවිණි! / Error Occurred!',
        'ඉල්ලීම යැවීමේදී දෝෂයක් සිදුවිණි. කරුණාකර නැවත උත්සාහ කරන්න / An error occurred while submitting your request. Please try again.',
        8000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <X className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            කර්මචාරී නිවාඩු ඉල්ලීම
          </h1>
          <p className="text-gray-600">Staff Leave Request Form</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>ඔබේ නිවාඩු ඉල්ලීම සාර්ථකව යවන ලදී! / Your leave request has been submitted successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {showError && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{errorMessage}</span>
            <button
              onClick={() => setShowError(false)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    පුද්ගලික තොරතුරු / Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        සම්පූර්ණ නම / Full Name *
                      </label>
                      <input
                        type="text"
                        name="staffName"
                        value={formData.staffName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ඊමේල් ලිපිනය / Email Address *
                      </label>
                      <input
                        type="email"
                        name="staffEmail"
                        value={formData.staffEmail}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="your.email@university.edu"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        කර්මචාරී අංකය / Staff ID *
                      </label>
                      <input
                        type="text"
                        name="staffId"
                        value={formData.staffId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="ST001"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        දෙපාර්තමේන්තුව / Department *
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept.value} value={dept.value}>
                            {dept.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        තනතුර / Position *
                      </label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your job position"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Leave Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    නිවාඩු විස්තර / Leave Details
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      නිවාඩු වර්ගය / Leave Type *
                    </label>
                    <select
                      name="leaveType"
                      value={formData.leaveType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ආරම්භක දිනය / Start Date *
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        අවසාන දිනය / End Date *
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>
                  
                  {formData.startDate && formData.endDate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        <Clock className="w-4 h-4 inline mr-1" />
                        කුල දින ගණන / Total Days: <strong>{calculateDays()}</strong>
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      හේතුව / Reason *
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

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>යැවෙමින්... / Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>ඉල්ලීම යවන්න / Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                ඔබේ ඉල්ලීම් / Your Requests
              </h3>
              
              {userRequests.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  කිසිදු ඉල්ලීමක් නැත / No requests found
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {userRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status.toUpperCase()}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          {request.submittedAt.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {leaveTypes.find(type => type.value === request.leaveType)?.label.split(' / ')[1] || request.leaveType}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </p>
                      {request.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Reason: {request.rejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
};

export default SimpleStaffLeaveForm;