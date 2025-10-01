import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadialBarChart, RadialBar } from 'recharts';
import { TrendingUp, Users, Calendar, Clock, Award, AlertTriangle } from 'lucide-react';
import MitigationNotifications from '../Common/MitigationNotifications';

// Enhanced mock data
const weeklyAttendanceData = [
  { week: 'Week 1', CS: 85, Math: 92, Physics: 78, Engineering: 88 },
  { week: 'Week 2', CS: 88, Math: 89, Physics: 82, Engineering: 91 },
  { week: 'Week 3', CS: 92, Math: 94, Physics: 85, Engineering: 89 },
  { week: 'Week 4', CS: 87, Math: 91, Physics: 80, Engineering: 93 },
];

const hourlyAttendancePattern = [
  { hour: '08:00', attendance: 75 },
  { hour: '09:00', attendance: 88 },
  { hour: '10:00', attendance: 95 },
  { hour: '11:00', attendance: 92 },
  { hour: '12:00', attendance: 85 },
  { hour: '13:00', attendance: 78 },
  { hour: '14:00', attendance: 89 },
  { hour: '15:00', attendance: 93 },
  { hour: '16:00', attendance: 87 },
  { hour: '17:00', attendance: 82 },
];

const departmentPerformance = [
  { department: 'Computer Science', attendance: 89, performance: 85, students: 450 },
  { department: 'Mathematics', attendance: 92, performance: 88, students: 320 },
  { department: 'Physics', attendance: 81, performance: 82, students: 280 },
  { department: 'Engineering', attendance: 87, performance: 86, students: 380 },
];

const attendanceTrends = [
  { month: 'Jan', attendance: 78, target: 85 },
  { month: 'Feb', attendance: 82, target: 85 },
  { month: 'Mar', attendance: 85, target: 85 },
  { month: 'Apr', attendance: 88, target: 85 },
  { month: 'May', attendance: 92, target: 85 },
  { month: 'Jun', attendance: 89, target: 85 },
];

const studentEngagement = [
  { name: 'High Engagement', value: 65, color: '#10B981' },
  { name: 'Medium Engagement', value: 25, color: '#F59E0B' },
  { name: 'Low Engagement', value: 10, color: '#EF4444' },
];

const classUtilization = [
  { class: 'Advanced Programming', capacity: 80, enrolled: 75, utilization: 94 },
  { class: 'Database Systems', capacity: 60, enrolled: 55, utilization: 92 },
  { class: 'Data Structures', capacity: 30, enrolled: 28, utilization: 93 },
  { class: 'Calculus I', capacity: 100, enrolled: 85, utilization: 85 },
  { class: 'Physics Lab', capacity: 25, enrolled: 23, utilization: 92 },
];

const topPerformers = [
  { name: 'John Doe', attendance: 98, grade: 'A+', department: 'CS' },
  { name: 'Jane Smith', attendance: 96, grade: 'A+', department: 'Math' },
  { name: 'Mike Johnson', attendance: 95, grade: 'A', department: 'Physics' },
  { name: 'Sarah Wilson', attendance: 94, grade: 'A', department: 'Engineering' },
  { name: 'Alex Brown', attendance: 93, grade: 'A', department: 'CS' },
];

export const EnhancedDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'semester'>('month');
  const [realTimeData, setRealTimeData] = useState({
    currentlyInClass: 234,
    todayAttendance: 89,
    liveClasses: 12,
    systemLoad: 67
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        currentlyInClass: prev.currentlyInClass + Math.floor(Math.random() * 10 - 5),
        todayAttendance: Math.max(80, Math.min(95, prev.todayAttendance + Math.random() * 2 - 1)),
        systemLoad: Math.max(50, Math.min(90, prev.systemLoad + Math.random() * 10 - 5))
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Real-time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Currently in Class</p>
              <p className="text-3xl font-bold">{realTimeData.currentlyInClass}</p>
              <div className="flex items-center mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-blue-100">Live</span>
              </div>
            </div>
            <Users className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Today's Attendance</p>
              <p className="text-3xl font-bold">{realTimeData.todayAttendance.toFixed(1)}%</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span className="text-sm text-green-100">+2.3% from yesterday</span>
              </div>
            </div>
            <TrendingUp className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Active Classes</p>
              <p className="text-3xl font-bold">{realTimeData.liveClasses}</p>
              <div className="flex items-center mt-2">
                <Calendar className="w-4 h-4 mr-1" />
                <span className="text-sm text-purple-100">24 total today</span>
              </div>
            </div>
            <Calendar className="h-12 w-12 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">System Load</p>
              <p className="text-3xl font-bold">{realTimeData.systemLoad.toFixed(0)}%</p>
              <div className="flex items-center mt-2">
                <div className="w-16 h-2 bg-orange-300 rounded-full">
                  <div 
                    className="h-2 bg-white rounded-full transition-all duration-500"
                    style={{ width: `${realTimeData.systemLoad}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <Clock className="h-12 w-12 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
          <div className="flex items-center space-x-4">
            <MitigationNotifications 
              onNotificationClick={(requestId) => {
                // Navigate to mitigation management with specific request
                window.location.href = `/app/mitigation?requestId=${requestId}`;
              }}
            />
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['week', 'month', 'semester'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Department Comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Attendance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="CS" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="Math" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="Physics" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
              <Area type="monotone" dataKey="Engineering" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Attendance Pattern */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Attendance Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyAttendancePattern}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="attendance" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Student Engagement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Engagement Levels</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={studentEngagement}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent! * 100).toFixed(0)}%`}
              >
                {studentEngagement.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Class Utilization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Utilization Rates</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={classUtilization}>
              <RadialBar
                dataKey="utilization"
                cornerRadius={10}
                fill="#3B82F6"
                label={{ position: 'insideStart', fill: '#fff' }}
              />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Attendance vs Target */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance vs Target Goals</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={attendanceTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="attendance" 
              stroke="#10B981" 
              strokeWidth={3}
              name="Actual Attendance"
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke="#EF4444" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Target"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Department Performance & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
          <div className="space-y-4">
            {departmentPerformance.map((dept, index) => (
              <div key={dept.department} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{dept.department}</span>
                  <span className="text-sm text-gray-500">{dept.students} students</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Attendance</span>
                    <span className="text-sm font-medium">{dept.attendance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${dept.attendance}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Performance</span>
                    <span className="text-sm font-medium">{dept.performance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${dept.performance}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="mr-2 h-5 w-5 text-yellow-500" />
            Top Performers
          </h3>
          <div className="space-y-3">
            {topPerformers.map((student, index) => (
              <div key={student.name} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{student.name}</span>
                    <span className="text-sm text-gray-500">{student.department}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-gray-600">{student.attendance}% attendance</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      student.grade === 'A+' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {student.grade}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Alerts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
          System Alerts & Notifications
        </h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Low Attendance Alert</p>
              <p className="text-sm text-yellow-700">Physics Lab attendance dropped to 68% this week</p>
            </div>
            <button className="ml-auto text-yellow-600 hover:text-yellow-800 text-sm">View Details</button>
          </div>
          
          <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800">Performance Improvement</p>
              <p className="text-sm text-blue-700">Computer Science department exceeded target by 4%</p>
            </div>
            <button className="ml-auto text-blue-600 hover:text-blue-800 text-sm">View Report</button>
          </div>
          
          <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <Users className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800">New Enrollment</p>
              <p className="text-sm text-green-700">15 new students registered this week</p>
            </div>
            <button className="ml-auto text-green-600 hover:text-green-800 text-sm">Manage</button>
          </div>
        </div>
      </div>

      {/* Recent Mitigation Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-blue-500" />
            Recent Mitigation Requests
          </h3>
          <button 
            onClick={() => window.location.href = '/app/mitigation'}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View All Requests
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-800">3</p>
                <p className="text-sm text-yellow-600">Pending Review</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-800">7</p>
                <p className="text-sm text-green-600">Approved Today</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-800">2</p>
                <p className="text-sm text-red-600">Rejected Today</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Assignment Extension - Database Project</p>
                <p className="text-xs text-gray-500">Uvindu Manaruwan • CS101 • 2 hours ago</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              Pending
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sick Leave Extension - Final Exam</p>
                <p className="text-xs text-gray-500">Sarah Johnson • MATH201 • 4 hours ago</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              Approved
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Technical Issues - Online Quiz</p>
                <p className="text-xs text-gray-500">Mike Chen • ENG150 • 6 hours ago</p>
              </div>
            </div>
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
              Under Review
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};