import React, { useEffect, useState } from 'react';
import { Users, Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock, BookOpen, FileText, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar, Legend } from 'recharts';
import LeaveRequestSummary from '../components/Dashboard/LeaveRequestSummary';
import UserProfileWidget from '../components/Dashboard/UserProfileWidget';

// Mock data for charts
const attendanceData = [
  { day: 'Mon', present: 85, absent: 15 },
  { day: 'Tue', present: 92, absent: 8 },
  { day: 'Wed', present: 78, absent: 22 },
  { day: 'Thu', present: 88, absent: 12 },
  { day: 'Fri', present: 95, absent: 5 },
];

const performanceData = [
  { month: 'Jan', score: 78 },
  { month: 'Feb', score: 82 },
  { month: 'Mar', score: 85 },
  { month: 'Apr', score: 88 },
  { month: 'May', score: 92 },
];

const roleDistribution = [
  { name: 'Students', value: 450, color: '#3B82F6' },
  { name: 'Lecturers', value: 25, color: '#10B981' },
  { name: 'Staff', value: 35, color: '#F59E0B' },
];

export const Dashboard: React.FC = () => {
  const { currentUser, loading } = useFirebaseAuth();
  const [showFallback, setShowFallback] = useState(false);

  // Debug logging
  console.log('Dashboard currentUser:', currentUser);
  console.log('Dashboard loading:', loading);

  // Show fallback after 3 seconds if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowFallback(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]);

  // Show loading spinner for first 3 seconds
  if (loading && !showFallback) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Fallback if auth is not working
  const userRole = currentUser?.role || 'admin';

  const getStats = () => {
    switch (userRole) {
      case 'admin':
        return [
          { label: 'Total Students', value: '450', icon: Users, color: 'blue', change: '+12%' },
          { label: 'Active Classes', value: '24', icon: Calendar, color: 'green', change: '+3%' },
          { label: 'Attendance Rate', value: '89%', icon: TrendingUp, color: 'indigo', change: '+2.5%' },
          { label: 'Pending Requests', value: '8', icon: AlertTriangle, color: 'yellow', change: '-15%' },
        ];
      case 'student':
        return [
          { label: 'My Attendance', value: '92%', icon: CheckCircle, color: 'green', change: '+3%' },
          { label: 'Assignments Due', value: '3', icon: BookOpen, color: 'orange', change: '-2' },
          { label: 'Classes Today', value: '5', icon: Calendar, color: 'blue', change: '0' },
          { label: 'Avg Score', value: '85%', icon: TrendingUp, color: 'purple', change: '+5%' },
        ];
      case 'lecturer':
        return [
          { label: 'My Classes', value: '8', icon: Calendar, color: 'blue', change: '+1' },
          { label: 'Students', value: '156', icon: Users, color: 'green', change: '+8' },
          { label: 'Avg Attendance', value: '87%', icon: TrendingUp, color: 'indigo', change: '+2%' },
          { label: 'Pending Reviews', value: '12', icon: FileText, color: 'orange', change: '-3' },
        ];
      case 'staff':
        return [
          { label: 'Assigned Students', value: '89', icon: Users, color: 'blue', change: '+5' },
          { label: 'My Attendance', value: '96%', icon: CheckCircle, color: 'green', change: '+1%' },
          { label: 'Tasks Pending', value: '4', icon: Clock, color: 'orange', change: '-2' },
          { label: 'Reports Due', value: '2', icon: FileText, color: 'red', change: '0' },
        ];
      default:
        return [];
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'admin':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Attendance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="present" fill="#10B981" name="Present" />
                  <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {roleDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'lecturer':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Attendance</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="present" fill="#10B981" name="Present" />
                    <Bar dataKey="absent" fill="#EF4444" name="Absent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teaching Schedule</h3>
                <div className="space-y-3">
                  {[
                    { subject: 'Computer Science 101', time: '9:00 AM', students: 45 },
                    { subject: 'Data Structures', time: '11:00 AM', students: 38 },
                    { subject: 'Algorithms', time: '2:00 PM', students: 42 },
                  ].map((class_item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{class_item.subject}</p>
                        <p className="text-sm text-gray-500">{class_item.time}</p>
                      </div>
                      <span className="text-sm font-medium text-blue-600">{class_item.students} students</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leave Request Summary Widget */}
            <div className="lg:col-span-1 space-y-6">
              <LeaveRequestSummary />
              <UserProfileWidget />
            </div>
          </div>
        );
      
      case 'student':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
              <div className="space-y-4">
                {[
                  { title: 'Mathematics Assignment', due: 'Tomorrow', type: 'assignment' },
                  { title: 'Physics Lab Report', due: '3 days', type: 'lab' },
                  { title: 'Chemistry Quiz', due: '1 week', type: 'exam' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500 capitalize">{item.type}</p>
                    </div>
                    <span className="text-sm font-medium text-orange-600">Due in {item.due}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
    }
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {currentUser?.firstName || 'Admin'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome to your {userRole} dashboard
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-xs font-medium ${
                      stat.change.startsWith('+') ? 'text-green-600' : 
                      stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {stat.change} from last month
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full ${
                  stat.color === 'blue' ? 'bg-blue-100' :
                  stat.color === 'green' ? 'bg-green-100' :
                  stat.color === 'indigo' ? 'bg-indigo-100' :
                  stat.color === 'yellow' ? 'bg-yellow-100' :
                  stat.color === 'orange' ? 'bg-orange-100' :
                  stat.color === 'purple' ? 'bg-purple-100' :
                  stat.color === 'red' ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'indigo' ? 'text-indigo-600' :
                    stat.color === 'yellow' ? 'text-yellow-600' :
                    stat.color === 'orange' ? 'text-orange-600' :
                    stat.color === 'purple' ? 'text-purple-600' :
                    stat.color === 'red' ? 'text-red-600' : 'text-gray-600'
                  }`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role-specific Content */}
      {getRoleSpecificContent()}

      {/* Leave Request Quick Access - Show for staff */}
      {userRole === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left">
                  <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-medium text-gray-900">Submit Leave Request</h4>
                  <p className="text-sm text-gray-600">Request time off</p>
                </button>
                <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
                  <FileText className="h-8 w-8 text-green-600 mb-2" />
                  <h4 className="font-medium text-gray-900">View History</h4>
                  <p className="text-sm text-gray-600">Check request status</p>
                </button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <LeaveRequestSummary />
            <UserProfileWidget />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { action: 'Student marked attendance', time: '5 minutes ago', type: 'attendance' },
            { action: 'New assignment uploaded', time: '1 hour ago', type: 'assignment' },
            { action: 'Leave request approved', time: '2 hours ago', type: 'leave' },
            { action: 'Exam results published', time: '3 hours ago', type: 'exam' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`p-2 rounded-full ${
                activity.type === 'attendance' ? 'bg-green-100' :
                activity.type === 'assignment' ? 'bg-blue-100' :
                activity.type === 'leave' ? 'bg-yellow-100' : 'bg-purple-100'
              }`}>
                <CheckCircle className={`h-4 w-4 ${
                  activity.type === 'attendance' ? 'text-green-600' :
                  activity.type === 'assignment' ? 'text-blue-600' :
                  activity.type === 'leave' ? 'text-yellow-600' : 'text-purple-600'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};