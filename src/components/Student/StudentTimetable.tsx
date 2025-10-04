import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface TimetableEntry {
  classId: string;
  className: string;
  courseCode: string;
  instructor: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  attendanceLink?: string;
  addedAt: any;
}

export const StudentTimetable: React.FC = () => {
  const { currentUser } = useAuth();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLinks, setShowLinks] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchTimetable();
  }, [currentUser]);

  const fetchTimetable = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      console.log('📚 Fetching timetable for user:', currentUser.email);
      
      const userDoc = await getDoc(doc(db, 'users', currentUser.id));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📋 User data received:', { 
          email: userData.email, 
          timetableLength: userData.timetable?.length || 0 
        });
        
        const userTimetable = userData.timetable || [];
        setTimetable(userTimetable);
        
        if (userTimetable.length === 0) {
          console.log('⚠️ No timetable entries found for user');
        } else {
          console.log('✅ Timetable loaded:', userTimetable.length, 'classes');
          userTimetable.forEach((entry: any, index: number) => {
            console.log(`📝 Class ${index + 1}: ${entry.className} (${entry.day} ${entry.startTime}-${entry.endTime})`);
          });
        }
      } else {
        console.log('❌ User document not found');
        setError('User data not found');
      }
    } catch (err) {
      console.error('❌ Error fetching timetable:', err);
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const toggleLinkVisibility = (classId: string) => {
    setShowLinks(prev => ({
      ...prev,
      [classId]: !prev[classId]
    }));
  };

  const generateMaskedLink = (link: string) => {
    if (!link) return '';
    const url = new URL(link);
    const parts = url.pathname.split('/');
    const lastPart = parts[parts.length - 1];
    return `${url.origin}/.../${lastPart.substring(0, 8)}***`;
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00-10:00', '10:00-12:00', '12:00-14:00', 
    '14:00-16:00', '16:00-18:00'
  ];

  const getClassesForDayAndTime = (day: string, timeSlot: string) => {
    const [startTime] = timeSlot.split('-');
    return timetable.filter(entry => 
      entry.day === day && entry.startTime === startTime
    );
  };

  const getDayClasses = (day: string) => {
    return timetable.filter(entry => entry.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading your schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.907-.833-2.677 0L4.138 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchTimetable}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (timetable.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-gray-400 mb-4">
          <Calendar className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Classes Scheduled</h3>
        <p className="text-gray-600 mb-4">
          You don't have any classes in your timetable yet.
        </p>
        <p className="text-sm text-gray-500">
          Classes will appear here once your batch schedule is set up by administration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
          <p className="text-gray-600">Your class schedule and attendance links</p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-500">
            {timetable.length} classes enrolled
          </span>
        </div>
      </div>

      {timetable.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Scheduled</h3>
          <p className="text-gray-600">Your timetable will appear here once classes are assigned to your batch.</p>
        </div>
      ) : (
        <>
          {/* Weekly Timetable View */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
            </div>
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
                            {dayClasses.map(entry => (
                              <div
                                key={entry.classId}
                                className="p-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 mb-2"
                              >
                                <div className="text-sm font-semibold text-blue-900">{entry.className}</div>
                                <div className="text-xs text-blue-700">{entry.courseCode}</div>
                                <div className="text-xs text-gray-600 flex items-center mt-1">
                                  <User className="h-3 w-3 mr-1" />
                                  {entry.instructor}
                                </div>
                                <div className="text-xs text-gray-600 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {entry.room}
                                </div>
                                {entry.attendanceLink && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-gray-500">Attendance Link:</span>
                                      <button
                                        onClick={() => toggleLinkVisibility(entry.classId)}
                                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                      >
                                        {showLinks[entry.classId] ? (
                                          <>
                                            <EyeOff className="h-3 w-3 mr-1" />
                                            Hide
                                          </>
                                        ) : (
                                          <>
                                            <Eye className="h-3 w-3 mr-1" />
                                            Show
                                          </>
                                        )}
                                      </button>
                                    </div>
                                    <div className="mt-1">
                                      {showLinks[entry.classId] ? (
                                        <a
                                          href={entry.attendanceLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                        >
                                          <ExternalLink className="h-3 w-3 mr-1" />
                                          Open Link
                                        </a>
                                      ) : (
                                        <span className="text-xs text-gray-400">
                                          {generateMaskedLink(entry.attendanceLink)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily View Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Classes by Day</h2>
            {days.map(day => {
              const dayClasses = getDayClasses(day);
              return (
                <div key={day} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-md font-medium text-gray-900">{day}</h3>
                    <p className="text-sm text-gray-500">{dayClasses.length} classes</p>
                  </div>
                  {dayClasses.length > 0 ? (
                    <div className="p-6 space-y-3">
                      {dayClasses.map(entry => (
                        <div key={entry.classId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <Clock className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900">{entry.className}</h4>
                                <p className="text-sm text-gray-600">{entry.courseCode}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {entry.startTime} - {entry.endTime}
                              </span>
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {entry.instructor}
                              </span>
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {entry.room}
                              </span>
                            </div>
                          </div>
                          {entry.attendanceLink && (
                            <div className="flex-shrink-0 ml-4">
                              <button
                                onClick={() => toggleLinkVisibility(entry.classId)}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                {showLinks[entry.classId] ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-1" />
                                    Hide Link
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-1" />
                                    Show Link
                                  </>
                                )}
                              </button>
                              {showLinks[entry.classId] && (
                                <a
                                  href={entry.attendanceLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-1 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <ExternalLink className="h-4 w-4 mr-1" />
                                  Open Attendance
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No classes scheduled for {day}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};