import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Notification {
  id: string;
  type: 'mitigation_submitted' | 'mitigation_approved' | 'mitigation_rejected';
  title: string;
  message: string;
  timestamp: any;
  read: boolean;
  requestId?: string;
}

interface MitigationNotificationsProps {
  onNotificationClick?: (requestId: string) => void;
}

export const MitigationNotifications: React.FC<MitigationNotificationsProps> = ({ 
  onNotificationClick 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Set up real-time listener for mitigation requests
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'mitigationRequests'),
        orderBy('requestDate', 'desc')
      ),
      (snapshot) => {
        const newNotifications: Notification[] = [];
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const now = new Date();
          const requestDate = data.requestDate?.toDate() || new Date();
          const timeDiff = now.getTime() - requestDate.getTime();
          const hoursDiff = timeDiff / (1000 * 3600);
          
          // Only show notifications for recent requests (within 24 hours)
          if (hoursDiff <= 24) {
            if (data.status === 'pending') {
              newNotifications.push({
                id: `${doc.id}_submitted`,
                type: 'mitigation_submitted',
                title: 'New Mitigation Request',
                message: `${data.studentName} submitted: ${data.title}`,
                timestamp: data.requestDate,
                read: false,
                requestId: doc.id
              });
            } else if (data.status === 'approved' && data.reviewedAt) {
              const reviewDate = data.reviewedAt.toDate ? data.reviewedAt.toDate() : new Date(data.reviewedAt);
              const reviewTimeDiff = now.getTime() - reviewDate.getTime();
              const reviewHoursDiff = reviewTimeDiff / (1000 * 3600);
              
              if (reviewHoursDiff <= 24) {
                newNotifications.push({
                  id: `${doc.id}_approved`,
                  type: 'mitigation_approved',
                  title: 'Request Approved',
                  message: `Approved: ${data.title} for ${data.studentName}`,
                  timestamp: data.reviewedAt,
                  read: false,
                  requestId: doc.id
                });
              }
            } else if (data.status === 'rejected' && data.reviewedAt) {
              const reviewDate = data.reviewedAt.toDate ? data.reviewedAt.toDate() : new Date(data.reviewedAt);
              const reviewTimeDiff = now.getTime() - reviewDate.getTime();
              const reviewHoursDiff = reviewTimeDiff / (1000 * 3600);
              
              if (reviewHoursDiff <= 24) {
                newNotifications.push({
                  id: `${doc.id}_rejected`,
                  type: 'mitigation_rejected',
                  title: 'Request Rejected',
                  message: `Rejected: ${data.title} for ${data.studentName}`,
                  timestamp: data.reviewedAt,
                  read: false,
                  requestId: doc.id
                });
              }
            }
          }
        });
        
        // Sort by timestamp (newest first)
        newNotifications.sort((a, b) => {
          const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
          const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
          return bTime.getTime() - aTime.getTime();
        });
        
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.read).length);
      }
    );

    return () => unsubscribe();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mitigation_submitted': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'mitigation_approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'mitigation_rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return 'Just now';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.requestId && onNotificationClick) {
      onNotificationClick(notification.requestId);
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No recent notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => window.location.href = '/app/mitigation'}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Mitigation Requests
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MitigationNotifications;