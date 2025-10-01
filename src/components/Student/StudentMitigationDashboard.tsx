import React, { useState } from 'react';
import { FileText, History, Plus } from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import StudentMitigationForm from './StudentMitigationForm';
import StudentMitigationHistory from './StudentMitigationHistory';

export const StudentMitigationDashboard: React.FC = () => {
  const { currentUser, loading: authLoading } = useFirebaseAuth();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  if (authLoading) {
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('new')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Submit New Request
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                My Requests
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'new' && <StudentMitigationForm />}
        {activeTab === 'history' && <StudentMitigationHistory />}
      </div>
    </div>
  );
};

export default StudentMitigationDashboard;