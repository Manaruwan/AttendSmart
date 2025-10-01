import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Mail,
  Building,
  Filter,
  Search,
  AlertCircle
} from 'lucide-react';
// import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
// import { db } from '../../config/firebase';

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

const StaffLeaveRequestManagement: React.FC = () => {
  const [staffLeaveRequests, setStaffLeaveRequests] = useState<StaffLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StaffLeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Demo data for testing
    const demoStaffRequests: StaffLeaveRequest[] = [
      {
        id: 'staff-demo-1',
        staffId: 'staff-001',
        staffName: 'Sarah Johnson',
        staffEmail: 'sarah.johnson@university.edu',
        department: 'Human Resources',
        position: 'HR Assistant',
        leaveType: 'Annual Leave',
        startDate: '2024-12-20',
        endDate: '2024-12-30',
        reason: 'Christmas holidays with family',
        status: 'pending',
        submittedAt: new Date('2024-12-01')
      },
      {
        id: 'staff-demo-2',
        staffId: 'staff-002',
        staffName: 'Mike Chen',
        staffEmail: 'mike.chen@university.edu',
        department: 'IT Services',
        position: 'Network Administrator',
        leaveType: 'Sick Leave',
        startDate: '2024-11-25',
        endDate: '2024-11-26',
        reason: 'Medical appointment and recovery',
        status: 'approved',
        submittedAt: new Date('2024-11-20'),
        approvedBy: 'Admin User',
        approvedAt: new Date('2024-11-21')
      },
      {
        id: 'staff-demo-3',
        staffId: 'staff-003',
        staffName: 'Emma Wilson',
        staffEmail: 'emma.wilson@university.edu',
        department: 'Library Services',
        position: 'Librarian',
        leaveType: 'Personal Leave',
        startDate: '2024-11-15',
        endDate: '2024-11-17',
        reason: 'Personal family matter',
        status: 'rejected',
        submittedAt: new Date('2024-11-10'),
        rejectionReason: 'Insufficient staffing during exam period'
      }
    ];

    setStaffLeaveRequests(demoStaffRequests);
    setIsLoading(false);

    // Firebase real-time listener would go here
    /* 
    const staffRequestsQuery = query(
      collection(db, 'staffLeaveRequests'),
      orderBy('submittedAt', 'desc')
    );

    const unsubscribe = onSnapshot(staffRequestsQuery, (querySnapshot) => {
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
      setStaffLeaveRequests(requests);
      setIsLoading(false);
    });

    return () => unsubscribe();
    */
  }, []);

  const departments = [
    'All Departments',
    'Administration',
    'Human Resources', 
    'Finance',
    'IT Services',
    'Library Services',
    'Student Affairs',
    'Maintenance',
    'Security',
    'Academic Support',
    'Research Support'
  ];

  const calculateLeaveDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'border-green-200 bg-green-50 text-green-700';
      case 'rejected':
        return 'border-red-200 bg-red-50 text-red-700';
      default:
        return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    }
  };

  const filteredRequests = staffLeaveRequests.filter(request => {
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    const matchesDepartment = selectedDepartment === 'all' || request.department === selectedDepartment;
    const matchesSearch = request.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.position.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesDepartment && matchesSearch;
  });

  const handleApprove = async (requestId: string) => {
    try {
      // In real implementation, update Firebase
      // await updateDoc(doc(db, 'staffLeaveRequests', requestId), {
      //   status: 'approved',
      //   approvedBy: 'Current Admin User',
      //   approvedAt: new Date()
      // });
      
      // Demo: Update local state
      setStaffLeaveRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: 'approved' as const, 
              approvedBy: 'Admin User', 
              approvedAt: new Date() 
            }
          : req
      ));
      
      setShowModal(false);
      setSelectedRequest(null);
      setActionType(null);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      // In real implementation, update Firebase
      // await updateDoc(doc(db, 'staffLeaveRequests', requestId), {
      //   status: 'rejected',
      //   rejectionReason: rejectionReason
      // });
      
      // Demo: Update local state
      setStaffLeaveRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { 
              ...req, 
              status: 'rejected' as const, 
              rejectionReason: rejectionReason 
            }
          : req
      ));
      
      setShowModal(false);
      setSelectedRequest(null);
      setActionType(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const openActionModal = (request: StaffLeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowModal(true);
  };

  const statsData = {
    total: staffLeaveRequests.length,
    pending: staffLeaveRequests.filter(req => req.status === 'pending').length,
    approved: staffLeaveRequests.filter(req => req.status === 'approved').length,
    rejected: staffLeaveRequests.filter(req => req.status === 'rejected').length
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Leave Request Management</h1>
          <p className="text-gray-600">Review and manage staff leave requests across all departments.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statsData.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{statsData.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{statsData.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Department:</label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.slice(1).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name, position, or leave type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Request List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No staff leave requests found.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.staffName}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Mail className="w-3 h-3 mr-1" />
                        {request.staffEmail}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <Building className="w-3 h-3 mr-1" />
                        {request.department} - {request.position}
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {new Date(request.startDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">End Date</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {new Date(request.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {request.submittedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Reason</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{request.reason}</p>
                </div>

                {request.status === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => openActionModal(request, 'approve')}
                      className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => openActionModal(request, 'reject')}
                      className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
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

        {/* Action Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
                </h3>
                
                <p className="text-gray-600 mb-6">
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
                        handleReject(selectedRequest.id);
                      }
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      actionType === 'approve'
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {actionType === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelectedRequest(null);
                      setActionType(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffLeaveRequestManagement;