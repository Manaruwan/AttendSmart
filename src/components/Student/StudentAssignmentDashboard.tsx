import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BookOpen, Clock, CheckCircle, AlertCircle, Plus, FileText, Calendar, Award } from 'lucide-react';

// Mock assignment data
const assignmentsData = [
  {
    id: 1,
    title: 'Database Design Project',
    subject: 'Database Systems',
    dueDate: '2025-10-15',
    status: 'pending',
    priority: 'high',
    description: 'Design a complete database schema for an e-commerce system',
    submissionType: 'file',
    maxScore: 100,
    progress: 60
  },
  {
    id: 2,
    title: 'React Component Library',
    subject: 'Web Development',
    dueDate: '2025-10-10',
    status: 'in-progress',
    priority: 'medium',
    description: 'Create a reusable React component library with documentation',
    submissionType: 'link',
    maxScore: 80,
    progress: 45
  },
  {
    id: 3,
    title: 'Machine Learning Algorithm',
    subject: 'AI & ML',
    dueDate: '2025-10-08',
    status: 'submitted',
    priority: 'high',
    description: 'Implement and compare classification algorithms',
    submissionType: 'file',
    maxScore: 100,
    progress: 100,
    submittedDate: '2025-10-07',
    score: 85
  },
  {
    id: 4,
    title: 'Software Testing Report',
    subject: 'Software Engineering',
    dueDate: '2025-10-20',
    status: 'pending',
    priority: 'low',
    description: 'Write comprehensive testing documentation for a web application',
    submissionType: 'file',
    maxScore: 60,
    progress: 0
  },
  {
    id: 5,
    title: 'Mobile App Prototype',
    subject: 'Mobile Development',
    dueDate: '2025-10-12',
    status: 'overdue',
    priority: 'high',
    description: 'Create a functional mobile app prototype using Flutter',
    submissionType: 'demo',
    maxScore: 120,
    progress: 30
  }
];

const assignmentStats = [
  { name: 'Completed', value: assignmentsData.filter(a => a.status === 'submitted').length, color: '#10B981' },
  { name: 'In Progress', value: assignmentsData.filter(a => a.status === 'in-progress').length, color: '#F59E0B' },
  { name: 'Pending', value: assignmentsData.filter(a => a.status === 'pending').length, color: '#6B7280' },
  { name: 'Overdue', value: assignmentsData.filter(a => a.status === 'overdue').length, color: '#EF4444' },
];

const subjectProgress = [
  { subject: 'Database Systems', completed: 2, total: 3, score: 92 },
  { subject: 'Web Development', completed: 1, total: 2, score: 78 },
  { subject: 'AI & ML', completed: 1, total: 1, score: 85 },
  { subject: 'Software Engineering', completed: 0, total: 1, score: 0 },
  { subject: 'Mobile Development', completed: 0, total: 1, score: 0 },
];

const StudentAssignmentDashboard: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
      default: return 'border-l-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'overdue': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <BookOpen className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredAssignments = assignmentsData.filter(assignment => {
    if (selectedFilter === 'all') return true;
    return assignment.status === selectedFilter;
  });

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assignment Dashboard</h1>
          <p className="text-gray-600">Track your assignments, deadlines, and academic progress.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{assignmentsData.length}</p>
                <p className="text-xs text-blue-600">This semester</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentsData.filter(a => a.status === 'submitted').length}
                </p>
                <p className="text-xs text-green-600">
                  {Math.round((assignmentsData.filter(a => a.status === 'submitted').length / assignmentsData.length) * 100)}% completion rate
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentsData.filter(a => {
                    const days = getDaysUntilDue(a.dueDate);
                    return days >= 0 && days <= 7;
                  }).length}
                </p>
                <p className="text-xs text-orange-600">Needs attention</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(
                    assignmentsData
                      .filter(a => a.score)
                      .reduce((sum, a) => sum + (a.score || 0), 0) /
                    assignmentsData.filter(a => a.score).length
                  ) || 0}%
                </p>
                <p className="text-xs text-purple-600">From graded assignments</p>
              </div>
              <Award className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'in-progress', 'submitted', 'overdue'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedFilter === filter
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {filter === 'all' ? 'All Assignments' : filter.charAt(0).toUpperCase() + filter.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignments List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedFilter === 'all' ? 'All Assignments' : `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Assignments`}
            </h2>
            
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(assignment.priority)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(assignment.status)}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-600">{assignment.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                      {assignment.status.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      assignment.priority === 'high' ? 'bg-red-100 text-red-800' :
                      assignment.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {assignment.priority}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{assignment.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">
                    <p>Due: {assignment.dueDate}</p>
                    <p>Max Score: {assignment.maxScore} points</p>
                    {assignment.score && (
                      <p className="text-green-600 font-medium">Score: {assignment.score}/{assignment.maxScore}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    {getDaysUntilDue(assignment.dueDate) > 0 ? (
                      <p className="text-orange-600">{getDaysUntilDue(assignment.dueDate)} days left</p>
                    ) : getDaysUntilDue(assignment.dueDate) === 0 ? (
                      <p className="text-red-600 font-semibold">Due Today!</p>
                    ) : (
                      <p className="text-red-600 font-semibold">{Math.abs(getDaysUntilDue(assignment.dueDate))} days overdue</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${
                      assignment.status === 'submitted' ? 'bg-green-500' :
                      assignment.status === 'overdue' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${assignment.progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">Progress: {assignment.progress}%</p>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Stats Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Assignment Overview</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={assignmentStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {assignmentStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Subject Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Subject Progress</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectProgress} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="subject" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  <span>New Assignment</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors">
                  <FileText className="w-4 h-4" />
                  <span>View All Submissions</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span>Assignment Calendar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentDashboard;