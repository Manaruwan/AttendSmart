import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useToasts } from '../../hooks/useToasts';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

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
  courseCode?: string;
  assignmentName?: string;
  originalDueDate?: any;
  requestedExtension?: number;
  reviewedAt?: any;
  reviewedBy?: string;
}

export const StudentMitigationHistory: React.FC = () => {
  const { showError } = useToasts();
  const { currentUser, firebaseUser, loading: authLoading } = useFirebaseAuth();
  const [requests, setRequests] = useState<MitigationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<MitigationRequest | null>(null);

  useEffect(() => {
    if (currentUser || firebaseUser) {
      fetchUserRequests();
    }
  }, [currentUser, firebaseUser]);

  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      
      // Get user ID using same logic as form submission
      let userId = currentUser?.id || firebaseUser?.uid || auth.currentUser?.uid;
      let userEmail = currentUser?.email || firebaseUser?.email || auth.currentUser?.email;
      
      console.log('=== FETCHING REQUESTS DEBUG ===');
      console.log('currentUser:', currentUser);
      console.log('firebaseUser:', firebaseUser);
      console.log('auth.currentUser:', auth.currentUser);
      console.log('userId:', userId);
      console.log('userEmail:', userEmail);
      
      // If no real authentication, use temp student ID (same as form)
      if (!userId || !userEmail) {
        const tempStudentId = localStorage.getItem('tempStudentId');
        if (tempStudentId) {
          userId = 'temp_student_' + tempStudentId;
          userEmail = 'temp.student@example.com';
          console.log('Using temp student ID from localStorage:', userId);
        } else {
          showError('Authentication Error', 'Unable to load your requests. Please submit a request first.');
          setLoading(false);
          return;
        }
      }

      // Also try to fetch all requests for debugging
      const allRequestsSnapshot = await getDocs(collection(db, 'mitigationRequests'));
      console.log('All requests in database:', allRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));

      // Query requests for current user
      const requestsQuery = query(
        collection(db, 'mitigationRequests'),
        where('studentId', '==', userId),
        orderBy('requestDate', 'desc')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MitigationRequest[];
      
      console.log('User requests found:', requestsData);
      
      // For testing: if no user requests found, show all recent requests
      if (requestsData.length === 0) {
        console.log('No user requests found, showing recent requests for testing...');
        const recentRequestsSnapshot = await getDocs(
          query(collection(db, 'mitigationRequests'), orderBy('requestDate', 'desc'))
        );
        const recentRequests = recentRequestsSnapshot.docs.slice(0, 3).map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MitigationRequest[];
        
        console.log('Showing recent requests for testing:', recentRequests);
        setRequests(recentRequests);
      } else {
        setRequests(requestsData);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showError('Error', 'Failed to load your mitigation requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileText className="w-8 h-8 text-blue-600 mr-3" />
                My Mitigation Requests
              </h1>
              <p className="text-gray-600 mt-1">Track the status of your submitted mitigation requests</p>
            </div>
            <div className="text-sm text-gray-500">
              Total Requests: {requests.length}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center">
                <Clock className="w-6 h-6 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center">
                <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">Approved</p>
                  <p className="text-2xl font-bold text-green-900">
                    {requests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center">
                <XCircle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-800">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">
                    {requests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't submitted any mitigation requests yet.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/app/mitigation'}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Submit New Request
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 mr-3">
                          {request.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          Submitted: {formatDate(request.requestDate)}
                        </div>
                        {request.courseCode && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FileText className="w-4 h-4 mr-2" />
                            Course: {request.courseCode}
                          </div>
                        )}
                        {request.assignmentName && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FileText className="w-4 h-4 mr-2" />
                            Assignment: {request.assignmentName}
                          </div>
                        )}
                        {request.requestedExtension && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            Extension: {request.requestedExtension} days
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 mb-4">{request.description}</p>

                      {request.status !== 'pending' && request.adminNotes && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Admin Response:
                          </h4>
                          <p className="text-sm text-gray-700">{request.adminNotes}</p>
                          {request.reviewedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Reviewed on: {formatDate(request.reviewedAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Request Details</h3>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  <span className="ml-2 capitalize">{selectedRequest.status}</span>
                </span>
              </div>

              {/* Request Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Request Information</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-medium">{selectedRequest.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-gray-900">{selectedRequest.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Detailed Reason</p>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Submitted On</p>
                      <p className="font-medium">{formatDate(selectedRequest.requestDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Extension Requested</p>
                      <p className="font-medium">{selectedRequest.requestedExtension || 0} days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Response */}
              {selectedRequest.status !== 'pending' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Admin Response
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-blue-700">
                        {selectedRequest.status === 'approved' ? 'Your request has been approved.' : 'Your request has been rejected.'}
                      </p>
                    </div>
                    {selectedRequest.adminNotes && (
                      <div>
                        <p className="text-sm text-blue-600">Notes:</p>
                        <p className="text-blue-900">{selectedRequest.adminNotes}</p>
                      </div>
                    )}
                    {selectedRequest.reviewedAt && (
                      <div>
                        <p className="text-xs text-blue-600">
                          Reviewed on: {formatDate(selectedRequest.reviewedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMitigationHistory;