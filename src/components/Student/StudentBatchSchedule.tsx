import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, BookOpen, Users, AlertCircle } from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Class {
  id: string;
  className: string;
  courseCode: string;
  instructor: string;
  batchId: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
  department: string;
  semester: string;
  academic_year: string;
  attendanceLink?: string;
}

interface Batch {
  id: string;
  name: string;
  year: number;
  department: string;
}

export const StudentBatchSchedule: React.FC = () => {
  const { currentUser, loading: authLoading } = useFirebaseAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  useEffect(() => {
    console.log('🔍 Auth state changed:', { 
      currentUser: currentUser?.email, 
      authLoading, 
      userId: currentUser?.id 
    });
    
    if (!authLoading && currentUser) {
      console.log('✅ Auth loaded, fetching classes...');
      fetchStudentBatchClasses();
    } else if (!authLoading && !currentUser) {
      console.log('❌ No user authenticated');
      setError('Please log in to view your schedule');
      setLoading(false);
    }
  }, [currentUser, authLoading]);

  const fetchStudentBatchClasses = async () => {
    if (!currentUser?.id) {
      console.log('❌ No current user ID found');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Fetching student batch classes for:', currentUser.email);
      console.log('👤 Current user ID:', currentUser.id);

      // Get student's batch information
      const studentDoc = await getDoc(doc(db, 'users', currentUser.id));
      if (!studentDoc.exists()) {
        console.log('❌ Student document not found');
        setError('Student information not found');
        return;
      }

      const studentData = studentDoc.data();
      console.log('📋 Student data:', {
        email: studentData.email,
        batchId: studentData.batchId,
        role: studentData.role,
        timetable: studentData.timetable?.length || 0
      });
      
      // Try to use timetable data first if available
      if (studentData.timetable && Array.isArray(studentData.timetable) && studentData.timetable.length > 0) {
        console.log('✅ Using timetable data directly');
        const timetableClasses: Class[] = studentData.timetable.map((entry: any) => {
          // Generate attendance link if not present
          let attendanceLink = entry.attendanceLink;
          if (!attendanceLink && entry.classId) {
            const baseUrl = window.location.origin;
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 10);
            attendanceLink = `${baseUrl}/attendance/${entry.classId}/${timestamp}-${randomString}?className=${encodeURIComponent(entry.className || 'Class')}`;
            console.log(`🔗 Generated attendance link for ${entry.className}: ${attendanceLink}`);
          } else if (attendanceLink) {
            console.log(`✅ Existing attendance link for ${entry.className}: ${attendanceLink}`);
          } else {
            console.log(`⚠️ No classId for ${entry.className}, cannot generate link`);
          }
          
          return {
            id: entry.classId || Math.random().toString(36).substr(2, 9),
            className: entry.className || '',
            courseCode: entry.courseCode || '',
            instructor: entry.instructor || '',
            batchId: entry.batchId || studentData.batchId || '',
            room: entry.room || '',
            day: entry.day || '',
            startTime: entry.startTime || '',
            endTime: entry.endTime || '',
            department: entry.department || '',
            semester: entry.semester || '',
            academic_year: entry.year || '',
            attendanceLink: attendanceLink || `${window.location.origin}/attendance/manual/${entry.className?.toLowerCase().replace(/\s+/g, '-') || 'class'}`
          };
        });
        
        console.log('🎯 Setting classes from timetable:', timetableClasses.length);
        console.log('🔗 Classes with attendance links:', timetableClasses.filter(c => c.attendanceLink).length);
        timetableClasses.forEach((cls, index) => {
          console.log(`📝 Class ${index + 1}: ${cls.className} - Link: ${cls.attendanceLink ? 'YES' : 'NO'} (${cls.attendanceLink?.substring(0, 50)}...)`);
        });
        setClasses(timetableClasses);
        setLoading(false);
        return;
      }
      
      const studentBatchId = studentData.batchId;

      if (!studentBatchId) {
        console.log('⚠️ No batch ID assigned to student');
        setError('You are not assigned to any batch. Please contact administration.');
        return;
      }

      console.log('🎯 Student batch ID:', studentBatchId);

      // Get batch information
      const batchDoc = await getDoc(doc(db, 'batches', studentBatchId));
      if (batchDoc.exists()) {
        const batchData = batchDoc.data();
        console.log('📚 Batch found:', batchData.name, batchData);
        setBatch({
          id: batchDoc.id,
          ...batchData
        } as Batch);
      } else {
        console.log('❌ Batch document not found for ID:', studentBatchId);
      }

      // Get all classes for this batch
      console.log('🔍 Querying classes for batch:', studentBatchId);
      const classesQuery = query(
        collection(db, 'classes'),
        where('batchId', '==', studentBatchId)
      );

      const classesSnapshot = await getDocs(classesQuery);
      console.log('📊 Found classes:', classesSnapshot.docs.length);
      
      const batchClasses: Class[] = classesSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        console.log('📝 Processing class:', data.className || data.name, data);
        return {
          id: docSnap.id,
          className: data.className || data.name || '',
          courseCode: data.courseCode || data.code || '',
          instructor: data.instructor || data.lecturer || '',
          batchId: data.batchId || '',
          room: data.schedule?.room || data.room || '',
          day: data.schedule?.day || data.day || '',
          startTime: data.schedule?.startTime || data.startTime || '',
          endTime: data.schedule?.endTime || data.endTime || '',
          department: data.department || '',
          semester: data.semester || '',
          academic_year: data.year || data.academic_year || '',
          attendanceLink: data.attendanceLink || ''
        };
      });

      console.log('✅ Setting classes:', batchClasses.length, 'classes');
      console.log('📋 Classes data:', batchClasses);
      setClasses(batchClasses);
      
    } catch (err) {
      console.error('❌ Error fetching batch classes:', err);
      setError('Failed to load your class schedule');
    } finally {
      setLoading(false);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00-10:00', '10:00-12:00', '12:00-14:00', 
    '14:00-16:00', '16:00-18:00', '18:00-20:00'
  ];

  const getClassesForDayAndTime = (day: string, timeSlot: string) => {
    const [startTime] = timeSlot.split('-');
    return classes.filter(cls => 
      cls.day === day && cls.startTime === startTime
    );
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'Computer Science': 'bg-blue-100 text-blue-800 border-blue-200',
      'Software Engineering': 'bg-green-100 text-green-800 border-green-200',
      'Information Technology': 'bg-purple-100 text-purple-800 border-purple-200',
      'Engineering': 'bg-orange-100 text-orange-800 border-orange-200',
      'Mathematics': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[department as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const CalendarView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Time
              </th>
              {days.map(day => (
                <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {timeSlots.map(timeSlot => (
              <tr key={timeSlot} className="hover:bg-gray-50">
                <td className="px-4 py-6 text-sm font-medium text-gray-900 bg-gray-50">
                  {timeSlot}
                </td>
                {days.map(day => {
                  const dayClasses = getClassesForDayAndTime(day, timeSlot);
                  return (
                    <td key={`${day}-${timeSlot}`} className="px-4 py-6 align-top">
                      {dayClasses.map(cls => (
                        <div 
                          key={cls.id}
                          className={`p-3 rounded-lg border-l-4 mb-2 ${getDepartmentColor(cls.department)} cursor-pointer hover:shadow-md transition-shadow`}
                        >
                          <div className="text-sm font-semibold">{cls.className}</div>
                          <div className="text-xs text-gray-600">{cls.courseCode}</div>
                          <div className="text-xs text-gray-600 flex items-center mt-1">
                            <User className="h-3 w-3 mr-1" />
                            {cls.instructor}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {cls.room}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {cls.startTime} - {cls.endTime}
                          </div>
                          {cls.attendanceLink && (
                            <div className="mt-2">
                              <button
                                onClick={() => window.open(cls.attendanceLink, '_blank')}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                              >
                                Mark Attendance
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {dayClasses.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-4">
                          No classes
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const ListView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Instructor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.map((cls) => (
              <tr key={cls.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{cls.className}</div>
                      <div className="text-sm text-gray-500">{cls.courseCode}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDepartmentColor(cls.department)}`}>
                        {cls.department}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{cls.instructor}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    {cls.day}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-2" />
                    {cls.startTime} - {cls.endTime}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    {cls.room}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {cls.attendanceLink ? (
                    <button
                      onClick={() => window.open(cls.attendanceLink, '_blank')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      Mark Attendance
                    </button>
                  ) : (
                    <span className="text-gray-400 text-sm">No link available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Authenticating...</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-600">Loading your schedule...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
          <div className="flex items-center justify-center text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-900 mb-1">Unable to Load Schedule</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={fetchStudentBatchClasses}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="mr-3 h-7 w-7 text-blue-600" />
              My Schedule
            </h1>
            <p className="text-gray-600 mt-1">
              View your class schedule {batch && `for ${batch.name} (${batch.year})`}
            </p>
          </div>
          <div className="flex space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Calendar View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Information */}
      {batch && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Batch Information</h3>
              <p className="text-blue-700 text-sm">
                <strong>{batch.name}</strong> • {batch.department} • Academic Year {batch.year}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Class Count */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              Total Classes: {classes.length}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {classes.filter(c => c.attendanceLink).length} classes have attendance links
          </div>
        </div>
      </div>

      {/* Schedule View */}
      {classes.length > 0 ? (
        viewMode === 'calendar' ? <CalendarView /> : <ListView />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Found</h3>
            <p className="text-gray-600">
              No classes are currently assigned to your batch. Please contact your administration if this seems incorrect.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};