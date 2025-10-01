import React, { useState } from 'react';
import { Plus, List } from 'lucide-react';
import StaffLeaveRequestForm from './StaffLeaveRequestForm';
import StaffLeaveRequestHistory from './StaffLeaveRequestHistory';

const StaffLeaveRequestPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  const tabs = [
    {
      id: 'form' as const,
      label: 'Submit Request',
      icon: Plus,
      component: StaffLeaveRequestForm
    },
    {
      id: 'history' as const,
      label: 'Request History',
      icon: List,
      component: StaffLeaveRequestHistory
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || StaffLeaveRequestForm;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        <ActiveComponent 
          {...(activeTab === 'form' ? { 
            onViewHistory: () => setActiveTab('history') 
          } : {})}
        />
      </div>
    </div>
  );
};

export default StaffLeaveRequestPage;