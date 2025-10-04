import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Camera, MapPin, Clock, CheckCircle, XCircle, Calendar, Filter, Loader } from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { FaceRecognitionCamera } from '../../components/Attendance/FaceRecognitionCamera';
import { AttendanceService } from '../../services/attendanceService';
import { AttendanceRecord } from '../../types/firebaseTypes';
import { isWithinCampus, isWithinAllowedHours, getCampusInfo } from '../../utils/campusLocations';

export const AttendancePage: React.FC = () => {
  const { currentUser } = useFirebaseAuth();
  const { classId } = useParams<{ classId: string }>();
  const [searchParams] = useSearchParams();
  const [currentClassId, setCurrentClassId] = useState<string | null>(null);
  const [className, setClassName] = useState<string>('');
  const [showFaceCamera, setShowFaceCamera] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [faceStatus, setFaceStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [capturedFaceImage, setCapturedFaceImage] = useState<string | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    late: 0,
    absent: 0
  });

  useEffect(() => {
    // Extract class information from URL
    if (classId) {
      setCurrentClassId(classId);
      // Extract class name from search params or fetch from database
      const classNameParam = searchParams.get('className');
      if (classNameParam) {
        setClassName(classNameParam);
      }
      console.log('🎯 Attendance for class:', classId, classNameParam);
    }
  }, [classId, searchParams]);

  useEffect(() => {
    if (currentUser) {
      loadAttendanceData();
    }
  }, [currentUser]);

  const loadAttendanceData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Load attendance history for the current month
      const startDate = new Date();
      startDate.setDate(1); // First day of current month
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of current month

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const history = await AttendanceService.getStudentAttendance(
        currentUser.id,
        startDateStr,
        endDateStr
      );
      setAttendanceHistory(history);

      // Calculate attendance stats
      const stats = await AttendanceService.getAttendanceStats(
        undefined, // classId
        currentUser.id, // studentId
        startDateStr,
        endDateStr
      );
      
      setAttendanceStats({
        present: stats.presentDays,
        late: stats.lateDays,
        absent: stats.absentDays
      });
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    setLocationStatus('pending');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          console.log('📍 User location:', latitude, longitude);
          
          try {
            // Check if within campus boundaries
            const withinCampus = isWithinCampus(latitude, longitude, 'main-campus');
            
            // Check if within allowed hours
            const withinHours = isWithinAllowedHours('main-campus');
            
            console.log('🎯 Location verification:', { withinCampus, withinHours });
            
            if (withinCampus && withinHours) {
              setLocationStatus('verified');
              const campusInfo = getCampusInfo('main-campus');
              console.log(`✅ Location verified at ${campusInfo.name}`);
            } else {
              setLocationStatus('failed');
              if (!withinCampus) {
                console.log('❌ Not within campus boundaries');
              }
              if (!withinHours) {
                console.log('❌ Outside allowed hours');
              }
            }
          } catch (error) {
            console.error('Location verification failed:', error);
            setLocationStatus('failed');
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationStatus('failed');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setLocationStatus('failed');
    }
  };

  const handleFaceVerification = async (success: boolean, confidence: number, image: string | null) => {
    if (success) {
      setFaceStatus('verified');
      setFaceConfidence(confidence);
      setCapturedFaceImage(image);
    } else {
      setFaceStatus('failed');
      setFaceConfidence(0);
      setCapturedFaceImage(null);
    }
    setShowFaceCamera(false);
  };

  const markAttendance = async () => {
    if (locationStatus !== 'verified' || faceStatus !== 'verified' || !currentUser) {
      alert('Please verify both location and face recognition before marking attendance.');
      return;
    }

    if (!currentLocation || !capturedFaceImage) {
      alert('Missing location or face verification data.');
      return;
    }

    setIsMarkingAttendance(true);
    
    try {
      // First upload the captured face image
      const blob = await fetch(capturedFaceImage).then(r => r.blob());
      const imageUrl = await AttendanceService.uploadFaceImage(
        currentUser.id,
        blob,
        'attendance'
      );

      // Mark attendance
      await AttendanceService.markAttendance({
        studentId: currentUser.id,
        classId: currentClassId || 'default-class', // Use the actual class ID from URL
        faceVerified: true,
        locationVerified: true,
        faceConfidence: faceConfidence,
        location: currentLocation,
        capturedImage: imageUrl
      });

      alert(`Attendance marked successfully for ${className || 'class'}!`);
      
      // Reset verification status
      setLocationStatus('pending');
      setFaceStatus('pending');
      setFaceConfidence(0);
      setCapturedFaceImage(null);
      setCurrentLocation(null);
      
      // Reload attendance data
      await loadAttendanceData();
      
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      case 'absent': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVerificationIcon = (status: 'pending' | 'verified' | 'failed') => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {className ? `Attendance - ${className}` : 'Attendance Management'}
            </h1>
            <p className="text-gray-600 mt-1">
              {currentUser?.role === 'student' ? 
                (className ? `Mark attendance for ${className}` : 'Mark your attendance') : 
                'View and manage attendance'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Marking (Student Only) */}
      {currentUser?.role === 'student' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Mark Today's Attendance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location Verification */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location Verification
                </h3>
                {getVerificationIcon(locationStatus)}
              </div>
              
              <button
                onClick={getCurrentLocation}
                disabled={locationStatus === 'verified'}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  locationStatus === 'verified'
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : locationStatus === 'failed'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {locationStatus === 'pending' && 'Verify Location'}
                {locationStatus === 'verified' && 'Location Verified ✓'}
                {locationStatus === 'failed' && 'Retry Location'}
              </button>
              
              <p className="text-sm text-gray-600">
                {locationStatus === 'verified' && 'You are within campus bounds'}
                {locationStatus === 'failed' && 'You must be on campus to mark attendance'}
                {locationStatus === 'pending' && 'Click to verify your current location'}
              </p>
            </div>

            {/* Face Recognition */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium text-gray-900 flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Face Recognition
                </h3>
                {getVerificationIcon(faceStatus)}
              </div>

              {!showFaceCamera ? (
                <button
                  onClick={() => setShowFaceCamera(true)}
                  disabled={faceStatus === 'verified'}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    faceStatus === 'verified'
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : faceStatus === 'failed'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {faceStatus === 'pending' && 'Start Face Verification'}
                  {faceStatus === 'verified' && 'Face Verified ✓'}
                  {faceStatus === 'failed' && 'Retry Face Verification'}
                </button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">Face recognition camera is opening...</p>
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                {faceStatus === 'verified' && `Your identity has been verified (${Math.round(faceConfidence * 100)}% confidence)`}
                {faceStatus === 'failed' && 'Face verification failed, please try again'}
                {faceStatus === 'pending' && 'Position your face clearly in the camera'}
              </p>
            </div>
          </div>

          {/* Mark Attendance Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={markAttendance}
              disabled={locationStatus !== 'verified' || faceStatus !== 'verified' || isMarkingAttendance}
              className={`w-full py-4 px-6 rounded-lg text-lg font-semibold transition-colors ${
                locationStatus === 'verified' && faceStatus === 'verified' && !isMarkingAttendance
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isMarkingAttendance ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Marking Attendance...
                </div>
              ) : (
                'Mark Attendance'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Face Recognition Camera Modal */}
      <FaceRecognitionCamera
        isOpen={showFaceCamera}
        onFaceVerified={handleFaceVerification}
        onClose={() => setShowFaceCamera(false)}
        referenceImage={currentUser?.profileImage}
      />

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentUser?.role === 'student' ? 'My Attendance History' : 'Student Attendance'}
          </h2>
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Face Verified</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Location Verified</th>
              </tr>
            </thead>
            <tbody>
              {attendanceHistory.map((record, index) => (
                <tr key={record.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900">
                    {record.date}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {record.time.toDate().toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4">
                    {record.faceVerified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {record.locationVerified ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </td>
                </tr>
              ))}
              {attendanceHistory.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No attendance records found for this month.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <Loader className="h-6 w-6 animate-spin mx-auto text-blue-600" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Present Days</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{attendanceStats.present}</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Late Days</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{attendanceStats.late}</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent Days</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{attendanceStats.absent}</p>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
};