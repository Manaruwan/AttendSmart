import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FirebaseAuthProvider } from './hooks/useFirebaseAuth';
import { ProtectedRoute } from './components/Common/ProtectedRoute';
import { LoginForm } from './components/Auth/LoginForm';
import { FirebaseLoginForm } from './components/Auth/FirebaseLoginForm';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { SimpleDashboard } from './pages/SimpleDashboard';
import { AttendancePage } from './pages/Attendance/AttendancePage';
import StudentDashboard from './components/Student/StudentDashboard';
import StudentAssignmentDashboard from './components/Student/StudentAssignmentDashboard';


import { AdminSetup } from './components/Setup/AdminSetup';
import { AccountCreation } from './components/Setup/AccountCreation';

import { UserManagement } from './components/Admin/UserManagement';
import { ClassManagement } from './components/Admin/ClassManagement';
import { AttendanceReports } from './components/Admin/AttendanceReports';
import { AdminSettings } from './components/Admin/AdminSettings';
import { PayrollManagement } from './components/Admin/PayrollManagement';
import AssignmentManagement from './components/Admin/AssignmentManagement';
import LateSubmissionManagement from './components/Admin/LateSubmissionManagement';

import AdminLeaveRequestsPage from './pages/AdminLeaveRequestsPage';
import LeaveRequestsPage from './pages/LeaveRequestsPage';
import StaffLeaveRequestPage from './components/Staff/StaffLeaveRequestPage';

import StaffSettingsPage from './pages/StaffSettingsPage';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { MitigationRouter } from './components/Common/MitigationRouter';

// Component to route to appropriate leave request interface based on user role
const LeaveRequestRouter: React.FC = () => {
  const { currentUser } = useFirebaseAuth();
  
  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show staff leave request interface for staff
  if (currentUser.role === 'staff') {
    return <StaffLeaveRequestPage />;
  }
  
  // Show lecturer leave request interface for lecturers
  return <LeaveRequestsPage />;
};

// Component to route to appropriate dashboard based on user role
const DashboardRouter: React.FC = () => {
  const { currentUser } = useFirebaseAuth();
  
  if (!currentUser) {
    return <Dashboard />;
  }
  
  // Show student dashboard for students
  if (currentUser.role === 'student') {
    return <StudentDashboard />;
  }
  
  // Show main dashboard for admin, lecturer, and staff
  return <Dashboard />;
};

// Component to route to appropriate settings interface based on user role
const SettingsRouter: React.FC = () => {
  const { currentUser } = useFirebaseAuth();
  
  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show admin settings for admin
  if (currentUser.role === 'admin') {
    return <AdminSettings />;
  }
  
  // Show staff settings for staff
  if (currentUser.role === 'staff') {
    return <StaffSettingsPage />;
  }
  
  // Default settings page for other roles
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <FirebaseAuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<FirebaseLoginForm />} />
            <Route path="/old-login" element={<LoginForm />} />
            <Route path="/firebase-login" element={<FirebaseLoginForm />} />
            <Route path="/create-account" element={<AccountCreation />} />
            
            {/* Public Attendance Route - Students can access without full login */}
            <Route path="/attendance/:classId/:token" element={<AttendancePage />} />

            <Route path="/admin-setup" element={<AdminSetup />} />
            <Route path="/simple-dashboard" element={<SimpleDashboard />} />
            <Route path="/direct-dashboard" element={<Dashboard />} />
            
            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            
            {/* Protected Routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardRouter />} />
              <Route path="attendance" element={<AttendancePage />} />
              
              {/* Admin Routes */}
              <Route path="users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              
              <Route path="classes" element={
                <ProtectedRoute allowedRoles={['admin', 'lecturer']}>
                  <ClassManagement />
                </ProtectedRoute>
              } />
              
              <Route path="reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AttendanceReports />
                </ProtectedRoute>
              } />
              
              <Route path="analytics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">Advanced Analytics</h1>
                      <p className="text-gray-600">This page is currently under development.</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="assignments" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AssignmentManagement />
                </ProtectedRoute>
              } />
              
              <Route path="late-submissions" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <LateSubmissionManagement />
                </ProtectedRoute>
              } />
              
              <Route path="admin-leave-requests" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLeaveRequestsPage />
                </ProtectedRoute>
              } />
              
              {/* Lecturer Routes */}
              <Route path="my-classes" element={
                <ProtectedRoute allowedRoles={['admin', 'lecturer']}>
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
                      <p className="text-gray-600 mt-2">Manage classes and schedules</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Student/Lecturer Routes */}
              <Route path="schedule" element={
                <ProtectedRoute allowedRoles={['student', 'lecturer']}>
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
                      <p className="text-gray-600 mt-2">View your class schedule</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="assignments" element={
                <ProtectedRoute allowedRoles={['student', 'lecturer']}>
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
                      <p className="text-gray-600 mt-2">Manage assignments and submissions</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />

              <Route path="my-assignments" element={
                <ProtectedRoute allowedRoles={['student', 'lecturer']}>
                  <StudentAssignmentDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="exams" element={
                <ProtectedRoute allowedRoles={['student', 'lecturer']}>
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
                      <p className="text-gray-600 mt-2">Manage exams and results</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Leave Requests - Different components for different roles */}
              <Route path="leave-requests" element={
                <ProtectedRoute allowedRoles={['lecturer', 'staff']}>
                  <LeaveRequestRouter />
                </ProtectedRoute>
              } />
              
              <Route path="mitigation" element={
                <ProtectedRoute allowedRoles={['admin', 'student']}>
                  <MitigationRouter />
                </ProtectedRoute>
              } />
              
              <Route path="payroll" element={
                <ProtectedRoute allowedRoles={['admin', 'lecturer', 'staff']}>
                  <PayrollManagement />
                </ProtectedRoute>
              } />
              
              <Route path="analytics" element={
                <ProtectedRoute allowedRoles={['admin', 'lecturer']}>
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics</h1>
                      <p className="text-gray-600">This page is currently under development.</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="notifications" element={
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    <p className="text-gray-600 mt-2">View your notifications</p>
                  </div>
                </div>
              } />
              
              <Route path="settings" element={
                <SettingsRouter />
              } />
            </Route>
            
            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </FirebaseAuthProvider>
  );
}

export default App;