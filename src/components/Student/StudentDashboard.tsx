import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { BookOpen, TrendingUp, Calendar, Clock, Award, CheckCircle, Target, ExternalLink, Copy, MapPin } from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { DatabaseService } from '../../services/databaseService';
import { ClassSchedule } from '../../types/firebaseTypes';

// Mock data for student dashboard
const myGrades = [
  { subject: 'Mathematics', grade: 85, target: 90 },
  { subject: 'Physics', grade: 78, target: 80 },
  { subject: 'Chemistry', grade: 92, target: 88 },
  { subject: 'Programming', grade: 88, target: 85 },
  { subject: 'English', grade: 82, target: 85 },
];

const attendanceData = [
  { month: 'Jan', attendance: 88, target: 90 },
  { month: 'Feb', attendance: 92, target: 90 },
  { month: 'Mar', attendance: 85, target: 90 },
  { month: 'Apr', attendance: 90, target: 90 },
  { month: 'May', attendance: 94, target: 90 },
  { month: 'Jun', attendance: 89, target: 90 },
];

const assignmentStatus = [
  { name: 'Completed', value: 75, color: '#10B981' },
  { name: 'In Progress', value: 20, color: '#F59E0B' },
  { name: 'Overdue', value: 5, color: '#EF4444' },
];

const weeklyStudyHours = [
  { week: 'Week 1', hours: 32 },
  { week: 'Week 2', hours: 28 },
  { week: 'Week 3', hours: 35 },
  { week: 'Week 4', hours: 30 },
  { week: 'Week 5', hours: 38 },
  { week: 'Week 6', hours: 33 },
];

const upcomingAssignments = [
  { subject: 'Mathematics', assignment: 'Calculus Problem Set', dueDate: '2025-10-05', difficulty: 'Hard' },
  { subject: 'Physics', assignment: 'Lab Report - Motion', dueDate: '2025-10-07', difficulty: 'Medium' },
  { subject: 'Programming', assignment: 'Web App Project', dueDate: '2025-10-10', difficulty: 'Hard' },
  { subject: 'Chemistry', assignment: 'Organic Compounds Quiz', dueDate: '2025-10-12', difficulty: 'Easy' },
];

const recentAchievements = [
  { achievement: 'Perfect Attendance - September', icon: '🏆', date: '2025-09-30' },
  { achievement: 'Top 10% in Mathematics', icon: '📊', date: '2025-09-25' },
  { achievement: 'Assignment Streak - 15 days', icon: '🔥', date: '2025-09-20' },
  { achievement: 'Study Goal Achieved', icon: '🎯', date: '2025-09-15' },
];

const StudentDashboard: React.FC = () => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('This Semester');
  const [enrolledClasses, setEnrolledClasses] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useFirebaseAuth();

  const totalGrade = Math.round(myGrades.reduce((sum, subject) => sum + subject.grade, 0) / myGrades.length);
  const currentAttendance = 89;
  const completedAssignments = 28;
  const totalAssignments = 32;

  useEffect(() => {
    if (currentUser && currentUser.role === 'student') {
      loadEnrolledClasses();
    }
  }, [currentUser]);

  const loadEnrolledClasses = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      console.log('📚 Loading enrolled classes for student:', currentUser.email);
      
      // Method 1: Try to get classes from student's timetable (preferred)
      const studentData = currentUser as any;
      if (studentData.timetable && Array.isArray(studentData.timetable) && studentData.timetable.length > 0) {
        console.log('✅ Found timetable data:', studentData.timetable.length, 'classes');
        
        // Convert timetable entries to ClassSchedule format
        const timetableClasses: ClassSchedule[] = studentData.timetable.map((entry: any) => ({
          id: entry.classId || entry.id,
          className: entry.className,
          courseCode: entry.courseCode,
          instructor: entry.instructor,
          department: entry.department || '',
          semester: entry.semester || '',
          year: entry.year || '',
          batchId: entry.batchId || studentData.batchId || '',
          schedule: {
            day: entry.day,
            startTime: entry.startTime,
            endTime: entry.endTime,
            room: entry.room
          },
          capacity: 0,
          enrolledStudents: 0,
          isActive: true,
          attendanceLink: entry.attendanceLink || null,
          createdAt: entry.addedAt || new Date(),
          updatedAt: new Date()
        }));
        
        setEnrolledClasses(timetableClasses);
        console.log('🎯 Set enrolled classes from timetable:', timetableClasses.length);
        return;
      }
      
      // Method 2: Fallback to batch-based filtering
      console.log('⚠️ No timetable found, trying batch-based approach');
      const allClasses = await DatabaseService.getClasses();
      console.log('📋 Total classes in database:', allClasses.length);
      
      // Filter classes by batchId
      const studentClasses = allClasses.filter(cls => {
        const match = studentData.batchId === cls.batchId;
        if (match) {
          console.log(`✅ Matched class: ${(cls as any).className || cls.name || cls.subject} (batch: ${cls.batchId})`);
        }
        return match;
      });
      
      console.log(`🎯 Found ${studentClasses.length} classes for batch: ${studentData.batchId}`);
      setEnrolledClasses(studentClasses);
      
    } catch (error) {
      console.error('❌ Error loading enrolled classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyAttendanceLink = (link: string) => {
    navigator.clipboard.writeText(link);
    alert('Attendance link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your academic progress overview.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Grade</p>
                <p className="text-2xl font-bold text-gray-900">{totalGrade}%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +3% from last month
                </p>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance</p>
                <p className="text-2xl font-bold text-gray-900">{currentAttendance}%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Above average
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignments</p>
                <p className="text-2xl font-bold text-gray-900">{completedAssignments}/{totalAssignments}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  87.5% completed
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Study Streak</p>
                <p className="text-2xl font-bold text-gray-900">15</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1" />
                  days in a row
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Time Frame Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
          <div className="flex justify-center space-x-1">
            {['This Week', 'This Month', 'This Semester'].map((timeFrame) => (
              <button
                key={timeFrame}
                onClick={() => setSelectedTimeFrame(timeFrame)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedTimeFrame === timeFrame
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {timeFrame}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subject Grades */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={myGrades}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="grade" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[70, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="attendance" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Line type="monotone" dataKey="target" stroke="#EF4444" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Links Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quick Attendance</h3>
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Mark attendance for your classes</span>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading your classes...</p>
            </div>
          ) : enrolledClasses.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No classes available for attendance marking</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledClasses.map((cls) => (
                <div key={cls.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{cls.name}</h4>
                      <p className="text-sm text-gray-600">{cls.subject}</p>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{cls.schedule?.[0]?.dayOfWeek || 'Schedule TBA'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{cls.schedule?.[0]?.startTime || 'Time TBA'} - {cls.schedule?.[0]?.endTime || ''}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{cls.schedule?.[0]?.room || 'Room TBA'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {cls.attendanceLink ? (
                      <>
                        <button
                          onClick={() => window.open(cls.attendanceLink, '_blank')}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Mark Attendance</span>
                        </button>
                        <button
                          onClick={() => copyAttendanceLink(cls.attendanceLink!)}
                          className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Copy className="h-4 w-4" />
                          <span>Copy Link</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-2">
                        <span className="text-xs text-gray-500">Attendance link not available</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Study Hours */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Study Hours</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyStudyHours}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#8B5CF6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Assignment Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Assignment Status</h3>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Assignments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Assignments</h3>
            <div className="space-y-4">
              {upcomingAssignments.map((assignment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{assignment.assignment}</p>
                    <p className="text-sm text-gray-600">{assignment.subject}</p>
                    <p className="text-sm text-gray-600">Due: {assignment.dueDate}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    assignment.difficulty === 'Hard' ? 'bg-red-100 text-red-800' :
                    assignment.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {assignment.difficulty}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
            <div className="space-y-4">
              {recentAchievements.map((achievement, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{achievement.achievement}</p>
                    <p className="text-sm text-gray-600">{achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            View All Assignments
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Study Schedule
          </button>
          <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Progress Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;