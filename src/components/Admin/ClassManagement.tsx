import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, Edit2, Trash2, Search, BookOpen, User } from 'lucide-react';
import { AddClassModal } from './AddClassModal';
import { EditClassModal } from './EditClassModal';
import { doc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface Class {
  id: string;
  name: string;
  code: string;
  lecturer: string;
  lecturerId: string;
  room: string;
  building: string;
  day: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolled: number;
  department: string;
  semester: string;
  academic_year: string;
  description?: string;
}

interface Lecturer {
  id: string;
  name: string;
  employmentType: string;
  department: string;
}

interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  type: 'lecture' | 'lab' | 'seminar';
  equipment: string[];
}

export const ClassManagement: React.FC = () => {

  const [classes, setClasses] = useState<Class[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'timetable'>('list');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchLecturers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const lecturerList = snapshot.docs
        .map(docSnap => {
          const data = docSnap.data();
          if (data.role === 'lecturer') {
            let lecturerName = '';
            if (data.fullName) {
              lecturerName = data.fullName;
            } else if (data.firstName && data.lastName) {
              lecturerName = `${data.firstName} ${data.lastName}`;
            } else if (data.name) {
              lecturerName = data.name;
            } else if (data.displayName) {
              lecturerName = data.displayName;
            } else {
              lecturerName = data.email?.split('@')[0] || 'Unknown Lecturer';
            }
            
            return {
              id: docSnap.id,
              name: lecturerName,
              employmentType: data.employmentType || 'Not specified',
              department: data.department || 'No Department'
            };
          }
          return null;
        })
        .filter(Boolean) as Lecturer[];
      
      setLecturers(lecturerList);
    } catch (err) {
      console.error('Error fetching lecturers:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'classes'));
      const classList = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.className || data.name || '',
          code: data.courseCode || data.code || '',
          lecturer: data.instructor || data.lecturer || '',
          lecturerId: data.lecturerId || '',
          room: data.schedule?.room || data.room || '',
          building: data.building || '',
          day: data.schedule?.day || data.day || '',
          startTime: data.schedule?.startTime || data.startTime || '',
          endTime: data.schedule?.endTime || data.endTime || '',
          capacity: data.capacity || 0,
          enrolled: data.enrolledStudents || data.enrolled || 0,
          department: data.department || '',
          semester: data.semester || '',
          academic_year: data.year || data.academic_year || '',
          description: data.description || ''
        };
      });
      setClasses(classList);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchLecturers();
  }, []);

  // Edit modal state
  const [editClass, setEditClass] = useState<Class | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; classId: string; className: string }>({ show: false, classId: '', className: '' });

  const handleDeleteClass = async (classId: string) => {
    try {
      setClasses(prev => prev.filter(cls => cls.id !== classId));
      setDeleteConfirm({ show: false, classId: '', className: '' });
      await deleteDoc(doc(db, 'classes', classId));
      console.log('Class deleted from Firestore:', classId);
    } catch (err) {
      console.error('Error deleting class:', err);
    }
  };

  const handleEditClass = (cls: Class) => {
    setEditClass(cls);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditClass(null);
  };

  const handleClassUpdated = () => {
    fetchClasses(); // Reload classes after update
    setShowEditModal(false);
    setEditClass(null);
  };

  const confirmDelete = (cls: Class) => {
    setDeleteConfirm({ show: true, classId: cls.id, className: cls.name });
  };

  const getLecturerEmploymentType = (lecturerName: string) => {
    const lecturer = lecturers.find(l => l.name === lecturerName);
    return lecturer ? lecturer.employmentType : 'Not specified';
  };

  const getEmploymentTypeColor = (employmentType: string) => {
    const colors = {
      'Full-time': 'text-green-700 bg-green-100 border border-green-200',
      'Visiting': 'text-purple-700 bg-purple-100 border border-purple-200',
    };
    return colors[employmentType as keyof typeof colors] || 'text-gray-700 bg-gray-100 border border-gray-200';
  };

  const getLecturerInfo = (lecturerName: string) => {
    const lecturer = lecturers.find(l => l.name === lecturerName);
    if (lecturer) {
      return {
        name: lecturer.name,
        employmentType: lecturer.employmentType,
        department: lecturer.department
      };
    }
    return {
      name: lecturerName,
      employmentType: 'Not specified',
      department: 'No Department'
    };
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, classId: '', className: '' });
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cls.lecturer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDay = filterDay === 'all' || cls.day === filterDay;
    const matchesDepartment = filterDepartment === 'all' || cls.department === filterDepartment;
    
    return matchesSearch && matchesDay && matchesDepartment;
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '08:00-10:00', '10:00-12:00', '12:00-14:00', 
    '14:00-16:00', '16:00-18:00'
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
      'Mathematics': 'bg-green-100 text-green-800 border-green-200',
      'Physics': 'bg-purple-100 text-purple-800 border-purple-200',
      'Engineering': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[department as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getUtilizationColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const TimetableView = () => (
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
                          className={`p-2 rounded-lg border-l-4 mb-2 ${getDepartmentColor(cls.department)}`}
                        >
                          <div className="text-sm font-semibold">{cls.name}</div>
                          <div className="text-xs text-gray-600">{cls.code}</div>
                          <div className="text-xs text-gray-600">
                            {cls.lecturer} ({getLecturerEmploymentType(cls.lecturer)})
                          </div>
                          <div className="text-xs text-gray-600 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {cls.room}
                          </div>
                          <div className="text-xs text-gray-600 flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {cls.enrolled}/{cls.capacity}
                          </div>
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
                Lecturer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enrollment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClasses.map((cls) => (
              <tr key={cls.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{cls.name}</div>
                      <div className="text-sm text-gray-500">{cls.code}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDepartmentColor(cls.department)}`}>
                        {cls.department}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{cls.lecturer}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getEmploymentTypeColor(getLecturerEmploymentType(cls.lecturer))}`}>
                        {getLecturerEmploymentType(cls.lecturer)}
                      </span>
                    </div>
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
                  <div className="text-sm text-gray-500">{cls.building}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className={`text-sm font-medium ${getUtilizationColor(cls.enrolled, cls.capacity)}`}>
                      {cls.enrolled}/{cls.capacity}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50" onClick={() => handleEditClass(cls)}>
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50" onClick={() => confirmDelete(cls)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="mr-3 h-7 w-7 text-blue-600" />
              Class Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage class schedules, rooms, and timetables
            </p>
          </div>
          <div className="flex space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
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
              <button
                onClick={() => setViewMode('timetable')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'timetable' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Timetable
              </button>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Days</option>
            {days.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Engineering">Engineering</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <BookOpen className="mr-2 h-4 w-4" />
            {filteredClasses.length} classes
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'list' ? <ListView /> : <TimetableView />}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Enrollment</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.reduce((sum, cls) => sum + cls.enrolled, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Rooms Used</p>
              <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Avg Utilization</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(classes.reduce((sum, cls) => sum + (cls.enrolled / cls.capacity), 0) / classes.length * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Class Modal */}
      <AddClassModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClassCreated={() => {
          // Refresh class list
          setShowAddModal(false);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Delete Class</h2>
            <p className="mb-6">Are you sure you want to delete <span className="font-semibold">{deleteConfirm.className}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => handleDeleteClass(deleteConfirm.classId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && editClass && (
        <EditClassModal
          isOpen={showEditModal}
          onClose={handleCloseEditModal}
          onClassUpdated={handleClassUpdated}
          classData={editClass}
        />
      )}

      <AddClassModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onClassCreated={() => {
          setShowAddModal(false);
          fetchClasses();
        }} 
      />
    </div>
  );
};