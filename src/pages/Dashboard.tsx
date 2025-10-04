import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { StudentTimetable } from '../components/Student/StudentTimetable';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to sign in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  if (currentUser.role === 'student') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <StudentTimetable />
        </div>
      </div>
    );
  }

  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <p className="text-gray-600">Admin dashboard is under development.</p>
        </div>
      </div>
    );
  }

  // Default dashboard for other roles
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, {currentUser.firstName}!</h1>
        <p className="text-gray-600">Your dashboard is currently under development.</p>
      </div>
    </div>
  );
};