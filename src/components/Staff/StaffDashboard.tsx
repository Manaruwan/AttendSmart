import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Calendar, Clock, TrendingUp, FileText, UserCheck } from 'lucide-react';

// Mock data for staff dashboard
const departmentStats = [
  { department: 'Computer Science', staff: 15, students: 450, workload: 85 },
  { department: 'Mathematics', staff: 12, students: 320, workload: 78 },
  { department: 'Physics', staff: 10, students: 280, workload: 82 },
  { department: 'Engineering', staff: 18, students: 380, workload: 90 },
];

const monthlyWorkload = [
  { month: 'Jan', hours: 160, overtime: 12 },
  { month: 'Feb', hours: 155, overtime: 8 },
  { month: 'Mar', hours: 170, overtime: 18 },
  { month: 'Apr', hours: 165, overtime: 15 },
  { month: 'May', hours: 158, overtime: 10 },
  { month: 'Jun', hours: 162, overtime: 14 },
];

const taskStatus = [
  { name: 'Completed', value: 68, color: '#10B981' },
  { name: 'In Progress', value: 22, color: '#F59E0B' },
  { name: 'Pending', value: 10, color: '#EF4444' },
];

const recentActivities = [
  { activity: 'Processed student enrollment forms', time: '2 hours ago', status: 'completed' },
  { activity: 'Updated course schedules', time: '4 hours ago', status: 'completed' },
  { activity: 'Reviewed attendance reports', time: '1 day ago', status: 'completed' },
  { activity: 'Coordinated with IT department', time: '2 days ago', status: 'pending' },
];

const upcomingDeadlines = [
  { task: 'Submit monthly report', deadline: '2025-10-01', priority: 'High' },
  { task: 'Process grade submissions', deadline: '2025-10-05', priority: 'Medium' },
  { task: 'Update staff records', deadline: '2025-10-08', priority: 'Low' },
  { task: 'Coordinate parent meetings', deadline: '2025-10-12', priority: 'High' },
];

const StaffDashboard: React.FC = () => {
  const [selectedView, setSelectedView] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Dashboard</h1>
          <p className="text-gray-600">Administrative overview and daily tasks management.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900">55</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2 this month
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">1,430</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15 this week
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-gray-900">88%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +2% from last week
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  3 urgent
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex space-x-1 p-1">
            {['overview', 'departments', 'reports'].map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                  selectedView === view
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Department Workload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Department Workload</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="workload" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Work Hours */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Work Hours</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyWorkload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="overtime" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Task Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={taskStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {taskStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.activity}</p>
                    <p className="text-xs text-gray-600">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{deadline.task}</p>
                    <p className="text-sm text-gray-600">Due: {deadline.deadline}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    deadline.priority === 'High' ? 'bg-red-100 text-red-800' :
                    deadline.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {deadline.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;