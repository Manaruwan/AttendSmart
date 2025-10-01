import React from 'react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import MitigationManagement from '../Admin/MitigationManagement';
import StudentMitigationDashboard from '../Student/StudentMitigationDashboard';

export const MitigationRouter: React.FC = () => {
  const { currentUser, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Please Log In</h2>
        <p className="text-gray-600">
          You need to be logged in to access mitigation forms.
        </p>
      </div>
    );
  }

  // Admin can view all mitigation requests and manage them
  if (currentUser.role === 'admin') {
    return <MitigationManagement />;
  }

  // Students can submit mitigation requests
  if (currentUser.role === 'student') {
    return <StudentMitigationDashboard />;
  }

  // Other roles (lecturer, staff) - show access denied
  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-lg text-center">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600">
        Mitigation forms are only available to administrators and students.
      </p>
    </div>
  );
};

export default MitigationRouter;