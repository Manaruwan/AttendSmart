import React, { useState, useEffect } from 'react';
import { FileText, History, Plus } from 'lucide-react';
import LeaveRequestForm from '../components/Lecturer/LeaveRequestForm';
import LeaveRequestHistory from '../components/Lecturer/LeaveRequestHistory';

const LeaveRequestsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#history') {
        setActiveTab('history');
      } else if (hash === '#new-request' || hash === '#form') {
        setActiveTab('form');
      }
    };

    // Set initial tab from URL hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tab: 'form' | 'history') => {
    setActiveTab(tab);
    window.location.hash = tab === 'history' ? '#history' : '#form';
  };

  const tabs = [
    {
      id: 'form' as const,
      label: 'New Request',
      icon: Plus,
      description: 'Submit a new leave request'
    },
    {
      id: 'history' as const,
      label: 'Request History',
      icon: History,
      description: 'View your leave request history and status'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="w-8 h-8 mr-3 text-blue-500" />
                Leave Requests
              </h1>
              <p className="text-gray-600 mt-1">Manage your leave requests and view their status</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-gray-500">{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'form' && (
          <LeaveRequestForm onViewHistory={() => handleTabChange('history')} />
        )}
        {activeTab === 'history' && <LeaveRequestHistory />}
      </div>
    </div>
  );
};

export default LeaveRequestsPage;
