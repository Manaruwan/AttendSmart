import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface LeaveRequest {
  id: string;
  lecturerId: string;
  lecturerName: string;
  leaveType: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedAt?: Date;
  rejectionReason?: string;
}

interface Notification {
  id: string;
  type: 'approved' | 'rejected';
  leaveRequest: LeaveRequest;
  timestamp: Date;
}

const LeaveStatusNotifications: React.FC = () => {
  const { firebaseUser } = useFirebaseAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastChecked] = useState<Date>(new Date());

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    const q = query(
      collection(db, 'lecturerLeaveRequests'),
      where('lecturerId', '==', firebaseUser.uid),
      where('status', 'in', ['approved', 'rejected'])
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newNotifications: Notification[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const request: LeaveRequest = {
          id: doc.id,
          ...data,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          approvedAt: data.approvedAt?.toDate(),
        } as LeaveRequest;

        // Only show notifications for recently updated requests
        const updateTime = request.approvedAt || request.submittedAt;
        if (updateTime && updateTime > lastChecked) {
          newNotifications.push({
            id: request.id,
            type: request.status as 'approved' | 'rejected',
            leaveRequest: request,
            timestamp: updateTime,
          });
        }
      });

      setNotifications(newNotifications);
    });

    return () => unsubscribe();
  }, [firebaseUser?.uid, lastChecked]);

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-50 space-y-3 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-white border-l-4 rounded-lg shadow-lg p-4 transition-all duration-300 transform translate-x-0 ${
            notification.type === 'approved'
              ? 'border-green-500 bg-green-50'
              : 'border-red-500 bg-red-50'
          }`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'approved' ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
            
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${
                  notification.type === 'approved' ? 'text-green-800' : 'text-red-800'
                }`}>
                  Leave Request {notification.type === 'approved' ? 'Approved' : 'Rejected'}
                </h4>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className={`text-sm mt-1 ${
                notification.type === 'approved' ? 'text-green-700' : 'text-red-700'
              }`}>
                Your {notification.leaveRequest.leaveType} request has been {notification.type}.
              </p>
              
              {notification.type === 'rejected' && notification.leaveRequest.rejectionReason && (
                <p className="text-xs text-red-600 mt-1">
                  Reason: {notification.leaveRequest.rejectionReason}
                </p>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                {notification.timestamp.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeaveStatusNotifications;