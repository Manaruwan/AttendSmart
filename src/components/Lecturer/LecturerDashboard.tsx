import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, Users, Calendar, Clock, TrendingUp, FileText } from 'lucide-react';

// Mock data for lecturer dashboard
const myClassesData = [
  { class: 'Advanced Programming', enrolled: 42, attendance: 89, avgGrade: 78 },
  { class: 'Database Systems', enrolled: 35, attendance: 92, avgGrade: 82 },
  { class: 'Software Engineering', enrolled: 38, attendance: 85, avgGrade: 75 },
  { class: 'Web Development', enrolled: 45, attendance: 91, avgGrade: 80 },
];

const weeklyAttendance = [
  { week: 'Week 1', 'Advanced Programming': 85, 'Database Systems': 92, 'Software Engineering': 78, 'Web Development': 88 },
  { week: 'Week 2', 'Advanced Programming': 88, 'Database Systems': 89, 'Software Engineering': 82, 'Web Development': 91 },
  { week: 'Week 3', 'Advanced Programming': 92, 'Database Systems': 94, 'Software Engineering': 85, 'Web Development': 89 },
  { week: 'Week 4', 'Advanced Programming': 87, 'Database Systems': 91, 'Software Engineering': 80, 'Web Development': 93 },
];

const assignmentStatus = [
  { name: 'Submitted', value: 75, color: '#10B981' },
  { name: 'Late Submission', value: 15, color: '#F59E0B' },
  { name: 'Not Submitted', value: 10, color: '#EF4444' },
];

const studentPerformance = [
  { month: 'Jan', avgGrade: 72, attendance: 85 },
  { month: 'Feb', avgGrade: 75, attendance: 87 },
  { month: 'Mar', avgGrade: 78, attendance: 89 },
  { month: 'Apr', avgGrade: 76, attendance: 91 },
  { month: 'May', avgGrade: 80, attendance: 88 },
  { month: 'Jun', avgGrade: 82, attendance: 92 },
];

const upcomingTasks = [
  { task: 'Grade Mid-term Exams', dueDate: '2025-10-05', priority: 'High' },
  { task: 'Prepare Database Lab Session', dueDate: '2025-10-07', priority: 'Medium' },
  { task: 'Update Course Materials', dueDate: '2025-10-10', priority: 'Low' },
  { task: 'Student Progress Review', dueDate: '2025-10-12', priority: 'High' },
];

const LecturerDashboard: React.FC = () => {

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lecturer Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your classes and students.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  All active
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">160</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5 this week
                </p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold text-gray-900">89%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +3% from last month
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  2 high priority
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Weekly Attendance Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Attendance by Class</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="Advanced Programming" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="Database Systems" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="Software Engineering" stroke="#F59E0B" strokeWidth={2} />
                <Line type="monotone" dataKey="Web Development" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Assignment Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Current Assignment Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assignmentStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {assignmentStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Classes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">My Classes</h3>
            <div className="space-y-4">
              {myClassesData.map((classData, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{classData.class}</p>
                    <p className="text-sm text-gray-600">{classData.enrolled} students</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Attendance: {classData.attendance}%</p>
                    <p className="text-sm text-gray-600">Avg Grade: {classData.avgGrade}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Performance Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={studentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgGrade" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Tasks</h3>
            <div className="space-y-3">
              {upcomingTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{task.task}</p>
                    <p className="text-sm text-gray-600">Due: {task.dueDate}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.priority === 'High' ? 'bg-red-100 text-red-800' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
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

export default LecturerDashboard;