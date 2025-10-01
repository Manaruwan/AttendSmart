import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Filter, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  User,
  Mail,
  Building,
  Trash2
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

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

const StaffLeaveRequestHistory: React.FC = () => {
  const { firebaseUser } = useFirebaseAuth();
  const [leaveRequests, setLeaveRequests] = useState<StaffLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<StaffLeaveRequest | null>(null);

  useEffect(() => {
    console.log('🔄 History useEffect triggered, firebaseUser:', firebaseUser);
    console.log('📊 Loading staff leave request history from database...');
    
    // Fetch real data from Firebase database
    try {
      const allRequestsQuery = query(
        collection(db, 'staffLeaveRequests'),
        orderBy('submittedAt', 'desc')
      );

      const unsubscribe = onSnapshot(allRequestsQuery, (querySnapshot) => {
        const realRequests: StaffLeaveRequest[] = [];
        console.log('📊 Firebase data - found:', querySnapshot.size, 'documents');
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📄 Processing document:', doc.id, data);
          realRequests.push({
            id: doc.id,
            staffId: data.staffId || 'unknown',
            staffName: data.staffName || 'Unknown Staff',
            staffEmail: data.staffEmail || 'unknown@university.edu',
            department: data.department || 'Unknown Department',
            position: data.position || 'Unknown Position',
            leaveType: data.leaveType || 'Unknown Leave',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            reason: data.reason || 'No reason provided',
            status: data.status || 'pending',
            submittedAt: data.submittedAt?.toDate() || new Date(),
            approvedBy: data.approvedBy,
            approvedAt: data.approvedAt?.toDate(),
            rejectionReason: data.rejectionReason
          });
        });
        
        console.log('✅ Real database requests loaded:', realRequests);
        setLeaveRequests(realRequests);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('❌ Error fetching database records:', error);
      setLeaveRequests([]);
      setIsLoading(false);
    }
  }, []);

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
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
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

  const filteredRequests = leaveRequests.filter(request => {
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    const matchesSearch = request.leaveType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleViewDetails = (request: StaffLeaveRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleDeleteRequest = async (requestId: string, leaveType: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${leaveType} request? This action cannot be undone.`)) {
      return;
    }

    try {
      if (firebaseUser) {
        // Delete from Firebase
        await deleteDoc(doc(db, 'staffLeaveRequests', requestId));
      } else {
        // Remove from demo data
        setLeaveRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Error deleting leave request:', error);
      alert('Failed to delete leave request. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Leave Request History</h1>
          <p className="text-gray-600">
            Track your leave request submissions and their approval status.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
              </div>
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
            
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by leave type, reason, or department..."
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests Found</h3>
              <p className="text-gray-600">
                {leaveRequests.length === 0 
                  ? "You haven't submitted any leave requests yet."
                  : "No requests match your current filter criteria."
                }
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(request.status)}
                      <h3 className="text-xl font-semibold text-gray-900">{request.leaveType}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Building className="w-4 h-4 mr-2" />
                        <span className="text-sm">{request.department}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm">{calculateLeaveDays(request.startDate, request.endDate)} days</span>
                      </div>
                      <div className="text-gray-600">
                        <span className="text-sm">
                          Submitted: {request.submittedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {request.reason}
                    </p>

                    {request.status === 'approved' && request.approvedAt && (
                      <div className="flex items-center text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approved on {request.approvedAt.toLocaleDateString()}
                        {request.approvedBy && ` by ${request.approvedBy}`}
                      </div>
                    )}

                    {request.status === 'rejected' && (
                      <div className="flex items-start text-red-600 text-sm">
                        <XCircle className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>Rejected</div>
                          {request.rejectionReason && (
                            <div className="text-red-500 mt-1">Reason: {request.rejectionReason}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-4 lg:mt-0">
                    <button
                      onClick={() => handleViewDetails(request)}
                      className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors tooltip"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {/* Only show delete button for pending requests */}
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleDeleteRequest(request.id, request.leaveType)}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors tooltip"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Leave Request Details</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(selectedRequest.status)}
                    <h3 className="text-xl font-semibold text-gray-900">{selectedRequest.leaveType}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        selectedRequest.status
                      )}`}
                    >
                      {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Staff Member</h4>
                      <div className="flex items-center mt-1">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{selectedRequest.staffName}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Email</h4>
                      <div className="flex items-center mt-1">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{selectedRequest.staffEmail}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Department</h4>
                      <div className="flex items-center mt-1">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{selectedRequest.department}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Position</h4>
                      <div className="mt-1">
                        <span className="text-gray-900">{selectedRequest.position}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-blue-700">Start Date</h4>
                      <p className="text-blue-900 font-semibold">
                        {new Date(selectedRequest.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-700">End Date</h4>
                      <p className="text-blue-900 font-semibold">
                        {new Date(selectedRequest.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-700">Duration</h4>
                      <p className="text-blue-900 font-semibold">
                        {calculateLeaveDays(selectedRequest.startDate, selectedRequest.endDate)} days
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Reason for Leave</h4>
                    <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">
                      {selectedRequest.reason}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Submission Details</h4>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                      <p>Submitted: {selectedRequest.submittedAt.toLocaleString()}</p>
                      {selectedRequest.status === 'approved' && selectedRequest.approvedAt && (
                        <p>Approved: {selectedRequest.approvedAt.toLocaleString()}</p>
                      )}
                      {selectedRequest.approvedBy && (
                        <p>Approved by: {selectedRequest.approvedBy}</p>
                      )}
                      {selectedRequest.status === 'rejected' && selectedRequest.rejectionReason && (
                        <p className="text-red-600 mt-2">
                          Rejection reason: {selectedRequest.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffLeaveRequestHistory;