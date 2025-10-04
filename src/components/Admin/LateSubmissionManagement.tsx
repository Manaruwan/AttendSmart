import React, { useState, useEffect } from 'react';
import { Clock, Check, X, Eye, User, FileText, Trash2 } from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { LateSubmissionRequest } from '../../types';
import { format } from 'date-fns';

const LateSubmissionManagement: React.FC = () => {
  const [requests, setRequests] = useState<LateSubmissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LateSubmissionRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  useEffect(() => {
    fetchLateSubmissionRequests();
  }, []);

  const fetchLateSubmissionRequests = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching late submission requests...');
      
      const requestsQuery = query(collection(db, 'lateSubmissionRequests'));
      const requestsSnapshot = await getDocs(requestsQuery);
      
      const requestsData: LateSubmissionRequest[] = [];
      requestsSnapshot.forEach((doc) => {
        const data = doc.data();
        requestsData.push({
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt,
          originalDeadline: data.originalDeadline,
          reviewedAt: data.reviewedAt,
          newDeadline: data.newDeadline
        } as LateSubmissionRequest);
      });

      // Sort by requested date (newest first)
      requestsData.sort((a, b) => {
        const dateA = a.requestedAt?.toDate ? a.requestedAt.toDate() : new Date();
        const dateB = b.requestedAt?.toDate ? b.requestedAt.toDate() : new Date();
        return dateB.getTime() - dateA.getTime();
      });
      
      setRequests(requestsData);
      console.log('✅ Late submission requests loaded:', requestsData.length);
    } catch (error) {
      console.error('❌ Error fetching late submission requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: LateSubmissionRequest) => {
    if (!newDeadline) {
      alert('Please set a new deadline for the assignment.');
      return;
    }

    try {
      const requestRef = doc(db, 'lateSubmissionRequests', request.id!);
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedBy: 'Admin', // You can get current admin's name
        reviewedAt: Timestamp.now(),
        adminNotes: adminNotes,
        newDeadline: Timestamp.fromDate(new Date(newDeadline))
      });

      // Update the assignment deadline if needed
      // TODO: Optionally update the assignment's deadline for this specific student
      
      await fetchLateSubmissionRequests();
      setShowModal(false);
      setAdminNotes('');
      setNewDeadline('');
      alert('Late submission request approved successfully!');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  const handleReject = async (request: LateSubmissionRequest) => {
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection.');
      return;
    }

    try {
      const requestRef = doc(db, 'lateSubmissionRequests', request.id!);
      await updateDoc(requestRef, {
        status: 'rejected',
        reviewedBy: 'Admin',
        reviewedAt: Timestamp.now(),
        adminNotes: adminNotes
      });

      await fetchLateSubmissionRequests();
      setShowModal(false);
      setAdminNotes('');
      alert('Late submission request rejected.');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
    }
  };

  const handleDelete = async (request: LateSubmissionRequest) => {
    if (!confirm(`Are you sure you want to delete this late submission request from ${request.studentName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const requestRef = doc(db, 'lateSubmissionRequests', request.id!);
      await deleteDoc(requestRef);
      
      await fetchLateSubmissionRequests();
      alert('Late submission request deleted successfully!');
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request. Please try again.');
    }
  };

  const openRequestModal = (request: LateSubmissionRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setNewDeadline(request.newDeadline ? 
      new Date(request.newDeadline.toDate()).toISOString().slice(0, 16) : 
      ''
    );
    setShowModal(true);
  };

  const filteredRequests = requests.filter(request => {
    if (filterStatus === 'all') return true;
    return request.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading late submission requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Late Submission Requests</h2>
          <p className="text-gray-600">Manage student requests for late assignment submissions</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filterStatus === status
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All Requests' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-500" />
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
            <Check className="h-8 w-8 text-green-500" />
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
            <X className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Original Deadline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
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
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No late submission requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-8 w-8 text-gray-400" />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.studentName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.studentEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {request.assignmentTitle}
                      </div>
                      <div className="text-sm text-gray-500">
                        Batch: {request.batchId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.originalDeadline ? 
                        format(request.originalDeadline.toDate(), 'MMM dd, yyyy HH:mm') : 
                        'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.requestedAt ? 
                        format(request.requestedAt.toDate(), 'MMM dd, yyyy HH:mm') : 
                        'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openRequestModal(request)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Review</span>
                        </button>
                        <button
                          onClick={() => handleDelete(request)}
                          className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Review Late Submission Request
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Student:</label>
                  <p className="text-sm text-gray-900">{selectedRequest.studentName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Assignment:</label>
                  <p className="text-sm text-gray-900">{selectedRequest.assignmentTitle}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Original Deadline:</label>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.originalDeadline ? 
                      format(selectedRequest.originalDeadline.toDate(), 'MMM dd, yyyy HH:mm') : 
                      'N/A'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Requested At:</label>
                  <p className="text-sm text-gray-900">
                    {selectedRequest.requestedAt ? 
                      format(selectedRequest.requestedAt.toDate(), 'MMM dd, yyyy HH:mm') : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Student's Reason:</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                  {selectedRequest.reason}
                </p>
              </div>
              
              {selectedRequest.status === 'pending' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Deadline (if approving):
                    </label>
                    <input
                      type="datetime-local"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes:
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="Add notes about your decision..."
                    />
                  </div>
                </>
              )}
              
              {selectedRequest.status !== 'pending' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Admin Notes:</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded">
                    {selectedRequest.adminNotes || 'No notes provided.'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Close
              </button>
              
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReject(selectedRequest)}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                  
                  <button
                    onClick={() => handleApprove(selectedRequest)}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-2"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LateSubmissionManagement;