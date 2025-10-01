import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  User,
  Filter,
  History,
  Eye,
  Users
} from 'lucide-react';
import { collection, getDocs, updateDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useToasts } from '../../hooks/useToasts';
import StudentHistoryView from './StudentHistoryView';

interface MitigationRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  description: string;
  reason: string;
  requestDate: any;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  attachments?: string[];
  courseCode?: string;
  assignmentName?: string;
  originalDueDate?: any;
  requestedExtension?: number; // days
}

export const MitigationManagement: React.FC = () => {
  const { showSuccess, showError } = useToasts();
  const [requests, setRequests] = useState<MitigationRequest[]>([]);
  const [studentHistory, setStudentHistory] = useState<{ [studentId: string]: MitigationRequest[] }>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'history' | 'students'>('requests');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<MitigationRequest | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchMitigationRequests();
    fetchStudentHistory();
  }, []);

  const fetchMitigationRequests = async () => {
    try {
      setLoading(true);
      const requestsQuery = query(
        collection(db, 'mitigationRequests'),
        orderBy('requestDate', 'desc')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MitigationRequest[];
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching mitigation requests:', error);
      showError('Error', 'Failed to load mitigation requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentHistory = async () => {
    try {
      const requestsQuery = query(
        collection(db, 'mitigationRequests'),
        orderBy('requestDate', 'desc')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const allRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MitigationRequest[];
      
      // Group by student
      const historyByStudent: { [studentId: string]: MitigationRequest[] } = {};
      allRequests.forEach(request => {
        if (!historyByStudent[request.studentId]) {
          historyByStudent[request.studentId] = [];
        }
        historyByStudent[request.studentId].push(request);
      });
      
      setStudentHistory(historyByStudent);
    } catch (error) {
      console.error('Error fetching student history:', error);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const requestRef = doc(db, 'mitigationRequests', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        adminNotes: adminNotes,
        reviewedAt: new Date(),
        reviewedBy: 'current-admin-uid' // Replace with actual admin UID
      });

      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: newStatus, adminNotes: adminNotes }
          : req
      ));

      showSuccess(
        'Request Updated', 
        `Mitigation request has been ${newStatus}`
      );
      
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating request:', error);
      showError('Error', 'Failed to update request status');
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mitigation Management</h2>
          <p className="text-gray-600">Review requests and view student history</p>
        </div>
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Current Requests</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>Request History</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Student History</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'requests' && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
              </div>
            </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course/Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Request Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {request.studentName}
                        </div>
                        <div className="text-sm text-gray-500">{request.studentEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">{request.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {request.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{request.courseCode || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{request.assignmentName || 'General'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.requestDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1 capitalize">{request.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No mitigation requests match the current filter.
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Review Mitigation Request</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Student Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedRequest.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedRequest.studentEmail}</p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Request Details</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-medium">{selectedRequest.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-gray-900">{selectedRequest.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Reason</p>
                    <p className="text-gray-900">{selectedRequest.reason}</p>
                  </div>
                  {selectedRequest.courseCode && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Course Code</p>
                        <p className="font-medium">{selectedRequest.courseCode}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Assignment</p>
                        <p className="font-medium">{selectedRequest.assignmentName || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your notes or feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              {selectedRequest.status === 'pending' && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Approve Request
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Student History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Student History</h3>
              <p className="text-sm text-gray-600">View complete mitigation history for all students</p>
            </div>
            <div className="p-6">
              {Object.entries(studentHistory).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No student history available</p>
              ) : (
                Object.entries(studentHistory).map(([studentId, studentRequests]) => (
                  <div key={studentId} className="mb-8 border-b border-gray-200 pb-6 last:border-b-0">
                    {/* Student Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-600" />
                        </div>
                        <div className="ml-4">
                          <h4 className="text-lg font-medium text-gray-900">
                            {studentRequests[0]?.studentName || 'Unknown Student'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {studentRequests[0]?.studentEmail || 'No email'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {studentRequests.length} request{studentRequests.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedStudent(selectedStudent === studentId ? null : studentId)}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{selectedStudent === studentId ? 'Hide' : 'View'} Details</span>
                      </button>
                    </div>

                    {/* Student Requests (Collapsed/Expanded) */}
                    {selectedStudent === studentId && (
                      <div className="grid gap-4">
                        {studentRequests.map((request) => (
                          <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h5 className="font-medium text-gray-900">{request.title}</h5>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                    {getStatusIcon(request.status)}
                                    <span className="ml-1 capitalize">{request.status}</span>
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700">Course:</span>
                                    <span className="text-gray-600 ml-2">{request.courseCode || 'N/A'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Assignment:</span>
                                    <span className="text-gray-600 ml-2">{request.assignmentName || 'General'}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Requested:</span>
                                    <span className="text-gray-600 ml-2">{formatDate(request.requestDate)}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700">Extension:</span>
                                    <span className="text-gray-600 ml-2">{request.requestedExtension || 1} day{(request.requestedExtension || 1) !== 1 ? 's' : ''}</span>
                                  </div>
                                </div>
                                {request.adminNotes && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-gray-700">Admin Notes:</span>
                                    <p className="text-sm text-gray-600 mt-1">{request.adminNotes}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student History Tab */}
      {activeTab === 'students' && (
        <StudentHistoryView />
      )}
    </div>
  );
};

export default MitigationManagement;