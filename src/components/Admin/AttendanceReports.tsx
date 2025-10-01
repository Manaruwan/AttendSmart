import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Download, Filter, TrendingUp, Users, Clock, AlertCircle } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  time: string;
  status: 'present' | 'absent' | 'late';
  marked_by: string;
}

interface AttendanceStats {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

export const AttendanceReports: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Mock data
  useEffect(() => {
    const today = new Date();
    const mockRecords: AttendanceRecord[] = [];
    
    // Generate mock attendance data for the past 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Mock classes and students
      const classes = [
        { id: '1', name: 'Advanced Programming', students: 65 },
        { id: '2', name: 'Database Systems', students: 45 },
        { id: '3', name: 'Data Structures Lab', students: 28 },
        { id: '4', name: 'Calculus I', students: 85 }
      ];
      
      classes.forEach(cls => {
        for (let j = 1; j <= cls.students; j++) {
          const random = Math.random();
          let status: 'present' | 'absent' | 'late';
          
          if (random > 0.15) status = 'present';
          else if (random > 0.10) status = 'late';
          else status = 'absent';
          
          mockRecords.push({
            id: `${dateStr}-${cls.id}-${j}`,
            studentId: `STU${j.toString().padStart(3, '0')}`,
            studentName: `Student ${j}`,
            classId: cls.id,
            className: cls.name,
            date: dateStr,
            time: '09:00',
            status,
            marked_by: 'face_recognition'
          });
        }
      });
    }
    
    setAttendanceRecords(mockRecords);
    
    // Set default date range to last 7 days
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    setDateRange({ start: startDateStr, end: endDate });
  }, []);

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesDateRange = (!dateRange.start || record.date >= dateRange.start) &&
                            (!dateRange.end || record.date <= dateRange.end);
    const matchesClass = selectedClass === 'all' || record.classId === selectedClass;
    return matchesDateRange && matchesClass;
  });

  const getAttendanceStats = (): AttendanceStats[] => {
    const statsMap = new Map<string, AttendanceStats>();
    
    filteredRecords.forEach(record => {
      if (!statsMap.has(record.date)) {
        statsMap.set(record.date, {
          date: record.date,
          present: 0,
          absent: 0,
          late: 0,
          total: 0
        });
      }
      
      const stats = statsMap.get(record.date)!;
      stats[record.status]++;
      stats.total++;
    });
    
    return Array.from(statsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  const getClasswiseStats = () => {
    const classStats = new Map();
    
    filteredRecords.forEach(record => {
      if (!classStats.has(record.className)) {
        classStats.set(record.className, { present: 0, absent: 0, late: 0, total: 0 });
      }
      
      const stats = classStats.get(record.className);
      stats[record.status]++;
      stats.total++;
    });
    
    return Array.from(classStats.entries()).map(([className, stats]: [string, any]) => ({
      name: className,
      attendanceRate: stats.total > 0 ? ((stats.present + stats.late) / stats.total * 100).toFixed(1) : 0,
      ...stats
    }));
  };

  const getOverallStats = () => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === 'present').length;
    const late = filteredRecords.filter(r => r.status === 'late').length;
    const absent = filteredRecords.filter(r => r.status === 'absent').length;
    
    return {
      total,
      present,
      late,
      absent,
      attendanceRate: total > 0 ? ((present + late) / total * 100).toFixed(1) : 0
    };
  };

  const exportData = (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      const headers = ['Date', 'Student ID', 'Student Name', 'Class', 'Status', 'Time'];
      const csvContent = [
        headers.join(','),
        ...filteredRecords.map(record => [
          record.date,
          record.studentId,
          record.studentName,
          record.className,
          record.status,
          record.time
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${dateRange.start}-${dateRange.end}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const attendanceStats = getAttendanceStats();
  const classwiseStats = getClasswiseStats();
  const overallStats = getOverallStats();

  const pieData = [
    { name: 'Present', value: overallStats.present, color: '#10B981' },
    { name: 'Late', value: overallStats.late, color: '#F59E0B' },
    { name: 'Absent', value: overallStats.absent, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <TrendingUp className="mr-3 h-7 w-7 text-blue-600" />
              Attendance Reports
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive attendance analytics and reporting
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => exportData('csv')}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Classes</option>
              <option value="1">Advanced Programming</option>
              <option value="2">Database Systems</option>
              <option value="3">Data Structures Lab</option>
              <option value="4">Calculus I</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'daily' | 'weekly' | 'monthly')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <Filter className="inline h-4 w-4 mr-1" />
              {filteredRecords.length} records
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.attendanceRate}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Late Arrivals</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.late}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Absences</p>
              <p className="text-2xl font-bold text-gray-900">{overallStats.absent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendance Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="present" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Present"
              />
              <Line 
                type="monotone" 
                dataKey="absent" 
                stroke="#EF4444" 
                strokeWidth={2}
                name="Absent"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class-wise Attendance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Class-wise Attendance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classwiseStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="present" fill="#10B981" name="Present" />
            <Bar dataKey="late" fill="#F59E0B" name="Late" />
            <Bar dataKey="absent" fill="#EF4444" name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Class-wise Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Late
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classwiseStats.map((stat) => (
                <tr key={stat.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stat.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stat.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {stat.present}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                    {stat.late}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {stat.absent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${stat.attendanceRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {stat.attendanceRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};