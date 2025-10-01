import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Mail,
  Building2,
  Filter,
  Calendar,
  FileText
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface StaffLeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  department: string;
  position: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

const SimpleStaffLeaveManagement: React.FC = () => {
  const [staffRequests, setStaffRequests] = useState<StaffLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<StaffLeaveRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Leave type mappings
  const leaveTypeMap: { [key: string]: string } = {
    'annual': 'වාර්ෂික නිවාඩු / Annual Leave',
    'sick': 'අසනීප නිවාඩු / Sick Leave',
    'emergency': 'හදිසි නිවාඩු / Emergency Leave',
    'personal': 'පුද්ගලික නිවාඩු / Personal Leave',
    'maternity': 'මාතෘ/පිතෘ නිවාඩු / Maternity/Paternity Leave',
    'study': 'අධ්‍යාපන නිවාඩු / Study Leave',
    'compassionate': 'අනුකම්පනීය නිවාඩු / Compassionate Leave',
    'medical': 'වෛද්‍ය නිවාඩු / Medical Leave'
  };

  const departmentMap: { [key: string]: string } = {
    'administration': 'පරිපාලනය / Administration',
    'hr': 'මානව සම්පත් / Human Resources',
    'finance': 'මුදල් / Finance',
    'it': 'තොරතුරු තාක්ෂණය / IT Services',
    'library': 'පුස්තකාලය / Library Services',
    'student_affairs': 'ශිෂ්‍ය කටයුතු / Student Affairs',
    'maintenance': 'නඩත්තුව / Maintenance',
    'security': 'ආරක්ෂාව / Security',
    'academic_support': 'අධ්‍යාපනික සහාය / Academic Support'
  };

  useEffect(() => {
    console.log('Setting up real-time listener for staffLeaveRequests...');
    
    let q = query(collection(db, 'staffLeaveRequests'), orderBy('submittedAt', 'desc'));
    
    if (selectedStatus !== 'all') {
      console.log('Filtering by status:', selectedStatus);
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
      
      console.log('Loaded staff leave requests:', requests.length);
      setStaffRequests(requests);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching staff leave requests:', error);
      setLoading(false);
    });

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
      console.log('Approving staff leave request:', requestId);
      await updateDoc(doc(db, 'staffLeaveRequests', requestId), {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: 'Admin'
      });
      
      setShowModal(false);
      setSelectedRequest(null);
      console.log('Staff leave request approved successfully');
    } catch (error) {
      console.error('Error approving staff leave request:', error);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      console.log('Rejecting staff leave request:', requestId, 'Reason:', reason);
      await updateDoc(doc(db, 'staffLeaveRequests', requestId), {
        status: 'rejected',
        rejectionReason: reason,
        approvedAt: new Date(),
        approvedBy: 'Admin'
      });
      
      setShowModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      console.log('Staff leave request rejected successfully');
    } catch (error) {
      console.error('Error rejecting staff leave request:', error);
    }
  };

  const openModal = (request: StaffLeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
  };

  const filteredRequests = staffRequests.filter(request => {
    if (selectedStatus === 'all') return true;
    return request.status === selectedStatus;
  });

  const statusCounts = {
    all: staffRequests.length,
    pending: staffRequests.filter(r => r.status === 'pending').length,
    approved: staffRequests.filter(r => r.status === 'approved').length,
    rejected: staffRequests.filter(r => r.status === 'rejected').length
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            කර්මචාරී නිවාඩු කළමනාකරණය
          </h1>
          <p className="text-gray-600">Staff Leave Request Management</p>
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
                <p className="text-sm font-medium text-gray-600">Pending</p>
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
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} 
                  {statusCounts[status as keyof typeof statusCounts] > 0 && (
                    <span className="ml-1">({statusCounts[status as keyof typeof statusCounts]})</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No staff leave requests found.</p>
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
                      <h3 className="text-lg font-semibold text-gray-900">{request.staffName}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Mail className="w-3 h-3 mr-1" />
                        {request.staffEmail}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Building2 className="w-3 h-3 mr-1" />
                        {departmentMap[request.department] || request.department} - {request.position}
                      </p>
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
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {leaveTypeMap[request.leaveType] || request.leaveType}
                    </p>
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

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Submitted</p>
                  <p className="text-sm text-gray-700">
                    {request.submittedAt.toLocaleDateString()} at {request.submittedAt.toLocaleTimeString()}
                  </p>
                </div>

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
              </div>
            ))
          )}
        </div>

        {/* Confirmation Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
              </h3>
              
              <p className="text-gray-600 mb-4">
                {actionType === 'approve' 
                  ? `Are you sure you want to approve ${selectedRequest.staffName}'s leave request?`
                  : `Are you sure you want to reject ${selectedRequest.staffName}'s leave request?`
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
      </div>
    </div>
  );
};

export default SimpleStaffLeaveManagement;