import React, { useState, useEffect } from 'react';
import { 
  User, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Search,
  Filter,
  Eye,
  Mail,
  Book
} from 'lucide-react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useToasts } from '../../hooks/useToasts';

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
  requestedExtension?: number;
  reviewedAt?: any;
  reviewedBy?: string;
}

interface StudentData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  requests: MitigationRequest[];
}

export const StudentHistoryView: React.FC = () => {
  const { showError } = useToasts();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MitigationRequest | null>(null);

  useEffect(() => {
    fetchStudentHistory();
  }, []);

  const fetchStudentHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch all mitigation requests
      const requestsQuery = query(
        collection(db, 'mitigationRequests'),
        orderBy('requestDate', 'desc')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const allRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MitigationRequest[];

      // Group requests by student
      const studentMap: { [studentId: string]: StudentData } = {};
      
      allRequests.forEach(request => {
        if (!studentMap[request.studentId]) {
          studentMap[request.studentId] = {
            studentId: request.studentId,
            studentName: request.studentName,
            studentEmail: request.studentEmail,
            totalRequests: 0,
            pendingRequests: 0,
            approvedRequests: 0,
            rejectedRequests: 0,
            requests: []
          };
        }
        
        const student = studentMap[request.studentId];
        student.requests.push(request);
        student.totalRequests++;
        
        switch (request.status) {
          case 'pending':
            student.pendingRequests++;
            break;
          case 'approved':
            student.approvedRequests++;
            break;
          case 'rejected':
            student.rejectedRequests++;
            break;
        }
      });

      // Convert to array and sort by total requests (most active first)
      const studentsArray = Object.values(studentMap).sort((a, b) => b.totalRequests - a.totalRequests);
      setStudents(studentsArray);
      
    } catch (error) {
      console.error('Error fetching student history:', error);
      showError('Error', 'Failed to load student history');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const hasStatus = student.requests.some(request => request.status === statusFilter);
    return matchesSearch && hasStatus;
  });

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
          <h2 className="text-2xl font-bold text-gray-900">Student Mitigation History</h2>
          <p className="text-gray-600">View complete history for all students</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Students</option>
              <option value="pending">With Pending</option>
              <option value="approved">With Approved</option>
              <option value="rejected">With Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.reduce((sum, student) => sum + student.totalRequests, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.reduce((sum, student) => sum + student.pendingRequests, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {students.filter(s => s.pendingRequests > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Students</h3>
          <p className="text-sm text-gray-600">Click on a student to view their complete history</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rejected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.studentId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-6 h-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.studentName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {student.studentEmail}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {student.studentId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.totalRequests}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {student.pendingRequests}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {student.approvedRequests}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {student.rejectedRequests}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedStudent(selectedStudent === student.studentId ? null : student.studentId)}
                      className="text-blue-600 hover:text-blue-900 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {selectedStudent === student.studentId ? 'Hide' : 'View'} History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No students match your search criteria.
            </p>
          </div>
        )}
      </div>

      {/* Student Detailed History */}
      {selectedStudent && (
        <div className="bg-white rounded-lg shadow">
          {(() => {
            const student = students.find(s => s.studentId === selectedStudent);
            if (!student) return null;

            return (
              <div>
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {student.studentName} - Complete History
                      </h3>
                      <p className="text-sm text-gray-600">{student.studentEmail}</p>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid gap-4">
                    {student.requests.map((request) => (
                      <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium text-gray-900">{request.title}</h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span className="ml-1 capitalize">{request.status}</span>
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center">
                                <Book className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-gray-600">{request.courseCode || 'General'}</span>
                              </div>
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-gray-600">{request.assignmentName || 'N/A'}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-gray-600">{formatDate(request.requestDate)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-gray-600">{request.requestedExtension || 1} day(s)</span>
                              </div>
                            </div>

                            {request.adminNotes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center mb-1">
                                  <AlertCircle className="w-4 h-4 text-gray-500 mr-2" />
                                  <span className="font-medium text-gray-700">Admin Notes:</span>
                                </div>
                                <p className="text-sm text-gray-600">{request.adminNotes}</p>
                                {request.reviewedAt && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Reviewed: {formatDate(request.reviewedAt)}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="ml-4 p-2 text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {student.requests.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        This student hasn't submitted any mitigation requests yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">{selectedRequest.title}</h4>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  <span className="ml-1 capitalize">{selectedRequest.status}</span>
                </span>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700">Description:</h5>
                <p className="text-gray-600">{selectedRequest.description}</p>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-700">Reason:</h5>
                <p className="text-gray-600">{selectedRequest.reason}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-gray-700">Course Code:</h5>
                  <p className="text-gray-600">{selectedRequest.courseCode || 'N/A'}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700">Assignment:</h5>
                  <p className="text-gray-600">{selectedRequest.assignmentName || 'N/A'}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700">Request Date:</h5>
                  <p className="text-gray-600">{formatDate(selectedRequest.requestDate)}</p>
                </div>
                <div>
                  <h5 className="font-medium text-gray-700">Extension Requested:</h5>
                  <p className="text-gray-600">{selectedRequest.requestedExtension || 1} day(s)</p>
                </div>
              </div>
              
              {selectedRequest.adminNotes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-gray-700 mb-2">Admin Notes:</h5>
                  <p className="text-gray-600">{selectedRequest.adminNotes}</p>
                  {selectedRequest.reviewedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Reviewed on {formatDate(selectedRequest.reviewedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHistoryView;