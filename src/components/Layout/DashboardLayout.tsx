import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import LeaveStatusNotifications from '../Common/LeaveStatusNotifications';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar - Fixed */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-64">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="fixed left-0 top-0 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content - With left margin for fixed sidebar */}
      <div className="lg:pl-64">
        <div className="flex flex-col">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1">
            <div className="p-6">
              <Outlet />
            </div>
          </main>
          <LeaveStatusNotifications />
        </div>
      </div>
    </div>
  );
};