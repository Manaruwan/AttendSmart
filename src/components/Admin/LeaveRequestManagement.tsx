import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Calendar, Clock, CheckCircle, XCircle, User, FileText, Phone, Mail, Filter, Trash2 } from 'lucide-react';
import ToastContainer from '../Common/ToastContainer';
import { useToasts } from '../../hooks/useToasts';

// Unified interface for both lecturer and staff leave requests
interface UnifiedLeaveRequest {
  id: string;
  // Common fields
  requestType: 'lecturer' | 'staff';
  name: string;
  email: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  
  // Lecturer specific fields
  lecturerId?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  coverageArrangements?: string;
  
  // Staff specific fields
  staffId?: string;
  department?: string;
  position?: string;
}

const LeaveRequestManagement: React.FC = () => {
  const [leaveRequests, setLeaveRequests] = useState<UnifiedLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<UnifiedLeaveRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteRequestId, setDeleteRequestId] = useState<string>('');
  const [deleteRequestType, setDeleteRequestType] = useState<'lecturer' | 'staff'>('lecturer');
  
  // Toast notifications
  const { toasts, removeToast, showSuccess, showError } = useToasts();

  useEffect(() => {
    const fetchAllLeaveRequests = () => {
      const unsubscribers: (() => void)[] = [];
      
      let lecturerData: UnifiedLeaveRequest[] = [];
      let staffData: UnifiedLeaveRequest[] = [];

      const updateCombinedRequests = (newData: UnifiedLeaveRequest[], type: 'lecturer' | 'staff') => {
        if (type === 'lecturer') {
          lecturerData = newData;
        } else {
          staffData = newData;
        }
        
        const combined = [...lecturerData, ...staffData].sort((a, b) => 
          b.submittedAt.getTime() - a.submittedAt.getTime()
        );
        
        setLeaveRequests(combined);
        setLoading(false);
      };
      
      // Fetch lecturer leave requests
      let lecturerQuery = query(collection(db, 'lecturerLeaveRequests'), orderBy('submittedAt', 'desc'));
      if (selectedStatus !== 'all') {
        lecturerQuery = query(
          collection(db, 'lecturerLeaveRequests'),
          where('status', '==', selectedStatus),
          orderBy('submittedAt', 'desc')
        );
      }

      const lecturerUnsub = onSnapshot(lecturerQuery, (querySnapshot) => {
        console.log('👩‍🏫 Lecturer leave requests from Firebase:', querySnapshot.size, 'documents');
        const lecturerRequests: UnifiedLeaveRequest[] = [];
        querySnapshot.forEach((doc) => {
          console.log('👩‍🏫 Lecturer doc:', doc.id, doc.data());
          const data = doc.data();
          lecturerRequests.push({
            id: doc.id,
            requestType: 'lecturer',
            name: data.lecturerName || 'Unknown Lecturer',
            email: data.lecturerEmail || '',
            leaveType: data.leaveType || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            reason: data.reason || '',
            status: data.status || 'pending',
            submittedAt: data.submittedAt?.toDate() || new Date(),
            approvedAt: data.approvedAt?.toDate(),
            approvedBy: data.approvedBy,
            rejectionReason: data.rejectionReason,
            // Lecturer specific
            lecturerId: data.lecturerId,
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
            coverageArrangements: data.coverageArrangements
          });
        });
        updateCombinedRequests(lecturerRequests, 'lecturer');
      });
      
      unsubscribers.push(lecturerUnsub);

      // Fetch staff leave requests  
      let staffQuery = query(collection(db, 'staffLeaveRequests'), orderBy('submittedAt', 'desc'));
      if (selectedStatus !== 'all') {
        staffQuery = query(
          collection(db, 'staffLeaveRequests'),
          where('status', '==', selectedStatus),
          orderBy('submittedAt', 'desc')
        );
      }

      const staffUnsub = onSnapshot(staffQuery, (querySnapshot) => {
        const staffRequests: UnifiedLeaveRequest[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          staffRequests.push({
            id: doc.id,
            requestType: 'staff',
            name: data.staffName || 'Unknown Staff',
            email: data.staffEmail || '',
            leaveType: data.leaveType || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            reason: data.reason || '',
            status: data.status || 'pending',
            submittedAt: data.submittedAt?.toDate() || new Date(),
            approvedAt: data.approvedAt?.toDate(),
            approvedBy: data.approvedBy,
            rejectionReason: data.rejectionReason,
            // Staff specific
            staffId: data.staffId,
            department: data.department,
            position: data.position
          });
        });
        updateCombinedRequests(staffRequests, 'staff');
      });
      
      unsubscribers.push(staffUnsub);

      return () => {
        unsubscribers.forEach(unsub => unsub());
      };
    };

    const unsubscribe = fetchAllLeaveRequests();
    return () => unsubscribe();
  }, [selectedStatus]);

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
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const calculateLeaveDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const handleApprove = async (requestId: string) => {
    try {
      const adminName = 'Admin'; // You can get this from auth context
      const collectionName = selectedRequest?.requestType === 'lecturer' ? 'lecturerLeaveRequests' : 'staffLeaveRequests';
      
      await updateDoc(doc(db, collectionName, requestId), {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: adminName
      });
      
      // Show success toast with bilingual message
      showSuccess(
        'අනුමත කරන ලදී! / Request Approved!',
        `${selectedRequest?.name}ගේ නිවාඩු ඉල්ලීම සාර්ථකව අනුමත කරන ලදී / ${selectedRequest?.name}'s leave request has been approved successfully.`,
        6000
      );
      
      setShowModal(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving leave request:', error);
      
      // Show error toast with bilingual message
      showError(
        'දෝෂයක් සිදුවිණි! / Error Occurred!',
        'නිවාඩු ඉල්ලීම අනුමත කිරීමේදී දෝෂයක් සිදුවිණි / An error occurred while approving the leave request. Please try again.',
        8000
      );
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      const collectionName = selectedRequest?.requestType === 'lecturer' ? 'lecturerLeaveRequests' : 'staffLeaveRequests';
      
      await updateDoc(doc(db, collectionName, requestId), {
        status: 'rejected',
        rejectionReason: reason,
        approvedAt: new Date(),
        approvedBy: 'Admin' // Replace with actual admin user info
      });
      
      // Show success toast with bilingual message
      showSuccess(
        'ප්‍රතික්ෂේප කරන ලදී! / Request Rejected!',
        `${selectedRequest?.name}ගේ නිවාඩු ඉල්ලීම ප්‍රතික්ෂේප කරන ලදී / ${selectedRequest?.name}'s leave request has been rejected.`,
        6000
      );
      
      setShowModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      
      // Show error toast with bilingual message
      showError(
        'දෝෂයක් සිදුවිණි! / Error Occurred!',
        'නිවාඩු ඉල්ලීම ප්‍රතික්ෂේප කිරීමේදී දෝෂයක් සිදුවිණි / An error occurred while rejecting the leave request. Please try again.',
        8000
      );
    }
  };

  const openModal = (request: UnifiedLeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
  };

  const handleDeleteRequest = async (request: UnifiedLeaveRequest) => {
    setDeleteRequestId(request.id);
    setDeleteRequestType(request.requestType);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const collection = deleteRequestType === 'lecturer' ? 'lecturerLeaveRequests' : 'staffLeaveRequests';
      const docRef = doc(db, collection, deleteRequestId);
      await deleteDoc(docRef);
      
      showSuccess('Success', 'Leave request deleted successfully');
      setShowDeleteConfirm(false);
      setDeleteRequestId('');
    } catch (error) {
      console.error('Error deleting leave request:', error);
      showError('Error', 'Failed to delete leave request');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteRequestId('');
  };

  const filteredRequests = leaveRequests.filter(request => {
    if (selectedStatus === 'all') return true;
    return request.status === selectedStatus;
  });

  const statusCounts = {
    all: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Request Management</h1>
          <p className="text-gray-600">Review and manage staff & lecturer leave requests.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{statusCounts.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex space-x-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedStatus === status
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {status === 'all' ? 'All Requests' : status.charAt(0).toUpperCase() + status.slice(1)} 
                  {statusCounts[status as keyof typeof statusCounts] > 0 && (
                    <span className="ml-1">({statusCounts[status as keyof typeof statusCounts]})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No leave requests found.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.name}
                        <span className="text-sm font-medium text-blue-600 ml-2">
                          ({request.requestType === 'lecturer' ? 'Lecturer' : 'Staff'})
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Mail className="w-3 h-3 mr-1" />
                        {request.email}
                      </p>
                      {request.requestType === 'staff' && request.department && request.position && (
                        <p className="text-sm text-gray-600 mt-1">
                          {request.position} - {request.department}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{request.status.toUpperCase()}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Leave Type</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{request.leaveType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {calculateLeaveDays(request.startDate, request.endDate)} days
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Date</p>
                    <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(request.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">End Date</p>
                    <p className="text-sm font-medium text-gray-900 mt-1 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(request.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                  <p className="text-sm text-gray-700">{request.reason}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {request.requestType === 'lecturer' && request.emergencyContact && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Emergency Contact</p>
                    <p className="text-sm text-gray-700 flex items-center">
                      <Phone className="w-3 h-3 mr-1" />
                      {request.emergencyContact} - {request.emergencyPhone}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
                  <p className="text-sm text-gray-700">
                    {request.submittedAt.toLocaleDateString()} at {request.submittedAt.toLocaleTimeString()}
                  </p>
                </div>
                </div>

                {request.requestType === 'lecturer' && request.coverageArrangements && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Coverage Arrangements</p>
                    <p className="text-sm text-gray-700">{request.coverageArrangements}</p>
                  </div>
                )}

                {request.status === 'rejected' && request.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-red-700 uppercase tracking-wide mb-1">Rejection Reason</p>
                    <p className="text-sm text-red-700">{request.rejectionReason}</p>
                  </div>
                )}

                {request.status === 'pending' && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openModal(request, 'approve')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => openModal(request, 'reject')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
                
                {/* Delete Button - Always visible for admin */}
                <div className="pt-3 border-t border-gray-100 mt-3">
                  <button
                    onClick={() => handleDeleteRequest(request)}
                    className="w-full bg-gray-100 hover:bg-red-50 text-red-600 hover:text-red-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 border border-red-200 hover:border-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Request</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Confirmation Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {actionType === 'approve' 
                  ? `Are you sure you want to approve ${selectedRequest.name}'s leave request?`
                  : `Are you sure you want to reject ${selectedRequest.name}'s leave request?`
                }
              </p>

              {actionType === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for rejection
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    if (actionType === 'approve') {
                      handleApprove(selectedRequest.id);
                    } else {
                      handleReject(selectedRequest.id, rejectionReason);
                    }
                  }}
                  disabled={actionType === 'reject' && !rejectionReason.trim()}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    actionType === 'approve'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
                  }`}
                >
                  {actionType === 'approve' ? 'Approve' : 'Reject'}
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequest(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Leave Request</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this leave request? This will permanently remove the request from the system.
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </div>
  );
};

export default LeaveRequestManagement;