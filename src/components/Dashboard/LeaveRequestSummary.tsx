import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { Calendar, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LeaveRequest {
  id: string;
  lecturerId: string;
  leaveType: string;
  status: 'pending' | 'approved' | 'rejected';
  startDate: string;
  endDate: string;
  submittedAt: Date;
}

const LeaveRequestSummary: React.FC = () => {
  const { firebaseUser } = useFirebaseAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const q = query(
      collection(db, 'leaveRequests'),
      where('lecturerId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const requests: LeaveRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
        } as LeaveRequest);
      });
      
      // Sort by most recent
      requests.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      
      setLeaveRequests(requests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  const getStats = () => {
    const pending = leaveRequests.filter(r => r.status === 'pending').length;
    const approved = leaveRequests.filter(r => r.status === 'approved').length;
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length;
    return { pending, approved, rejected, total: leaveRequests.length };
  };

  const getUpcomingLeaves = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return leaveRequests
      .filter(r => r.status === 'approved' && new Date(r.startDate) >= today)
      .slice(0, 3);
  };

  const stats = getStats();
  const upcomingLeaves = getUpcomingLeaves();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 text-blue-500 mr-2" />
          Leave Requests
        </h3>
        <Link
          to="/app/leave-requests"
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          View All
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{stats.pending}</div>
          <div className="text-xs text-gray-600">Pending</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{stats.approved}</div>
          <div className="text-xs text-gray-600">Approved</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="flex items-center justify-center mb-1">
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900">{stats.rejected}</div>
          <div className="text-xs text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Upcoming Leaves */}
      {upcomingLeaves.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Upcoming Approved Leaves</h4>
          <div className="space-y-2">
            {upcomingLeaves.map((leave) => (
              <div key={leave.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{leave.leaveType}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                  </div>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {leaveRequests.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
          <div className="space-y-2">
            {leaveRequests.slice(0, 2).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{request.leaveType}</div>
                  <div className="text-xs text-gray-600">
                    {request.submittedAt.toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center">
                  {request.status === 'pending' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                  {request.status === 'approved' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {request.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
      <Link
        to="/app/leave-requests"
        className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        <span>New Leave Request</span>
      </Link>
    </div>
  );
};

export default LeaveRequestSummary;