import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, Users, Calendar, BookOpen, FileText, 
  BarChart3, Settings, Bell, LogOut, 
  GraduationCap, UserCheck, ClipboardList,
  DollarSign, TrendingUp, FileCheck
} from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

interface MenuItem {
  path: string;
  icon: React.ComponentType<any>;
  label: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  { path: '/app/dashboard', icon: Home, label: 'Dashboard', roles: ['admin', 'student', 'lecturer', 'staff'] },
  { path: '/app/analytics', icon: BarChart3, label: 'Advanced Analytics', roles: ['admin'] },
  { path: '/app/users', icon: Users, label: 'User Management', roles: ['admin'] },
  { path: '/app/classes', icon: GraduationCap, label: 'Class Management', roles: ['admin', 'lecturer'] },
  { path: '/app/assignments', icon: BookOpen, label: 'Assignment Management', roles: ['admin'] },
  { path: '/app/reports', icon: TrendingUp, label: 'Attendance Reports', roles: ['admin'] },
  { path: '/app/admin-leave-requests', icon: FileCheck, label: 'Manage Leave Requests', roles: ['admin'] },
  { path: '/app/schedule', icon: Calendar, label: 'Schedule', roles: ['student', 'lecturer'] },
  { path: '/app/attendance', icon: UserCheck, label: 'Attendance', roles: ['admin', 'student', 'lecturer', 'staff'] },
  { path: '/app/my-assignments', icon: BookOpen, label: 'Assignments', roles: ['student', 'lecturer'] },
  { path: '/app/exams', icon: FileText, label: 'Exams', roles: ['student', 'lecturer'] },
  { path: '/app/leave-requests', icon: ClipboardList, label: 'Submit Leave Request', roles: ['lecturer', 'staff'] },
  { path: '/app/mitigation', icon: FileText, label: 'Mitigation Forms', roles: ['admin', 'student'] },
  { path: '/app/payroll', icon: DollarSign, label: 'Payroll', roles: ['admin', 'lecturer', 'staff'] },
  { path: '/app/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'student', 'lecturer', 'staff'] },
  { path: '/app/settings', icon: Settings, label: 'Settings', roles: ['admin', 'student', 'lecturer', 'staff'] },
];

export const Sidebar: React.FC = () => {
  const { currentUser, logout } = useFirebaseAuth();

  if (!currentUser) return null;

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(currentUser.role)
  );

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'lecturer': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      case 'staff': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-screen w-64 bg-white shadow-lg flex flex-col">
      {/* Logo and Title */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">AttendSmart</h1>
            <p className="text-sm text-gray-500">Campus Management</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
            {currentUser.profileImage ? (
              <img 
                src={currentUser.profileImage} 
                alt="Profile" 
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-gray-600">
                {(currentUser.firstName || 'U')[0]}
                {(currentUser.lastName || '')[0] || ''}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {(currentUser.firstName || 'User')} {(currentUser.lastName || '')}
            </p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(currentUser.role)}`}>
              {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};