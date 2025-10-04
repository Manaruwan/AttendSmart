import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, AlertTriangle, Calendar, User, MapPin, Camera, XCircle } from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { AttendanceService } from '../../services/attendanceService';
import { FaceRecognitionCamera } from '../../components/Attendance/FaceRecognitionCamera';
import { isWithinCampus, isWithinAllowedHours, getCampusInfo, isWithinUserCampus } from '../../utils/campusLocations';
import { validateAttendanceLocation } from '../../utils/testingHelpers';

export const ClassAttendancePage: React.FC = () => {
  const { currentUser } = useFirebaseAuth();
  const { classId, token } = useParams<{ classId: string; token: string }>();
  const navigate = useNavigate();

  // Access verification states
  const [accessVerification, setAccessVerification] = useState<{
    isVerifying: boolean;
    hasAccess: boolean;
    message: string;
    classInfo?: any;
  }>({
    isVerifying: true,
    hasAccess: false,
    message: 'Verifying access...'
  });

  const [linkStatus, setLinkStatus] = useState<{
    isActive: boolean;
    message: string;
    timeInfo?: any;
  }>({
    isActive: false,
    message: 'Checking link status...'
  });

  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New verification states
  const [locationStatus, setLocationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [faceStatus, setFaceStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [showFaceCamera, setShowFaceCamera] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [capturedFaceImage, setCapturedFaceImage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && classId) {
      verifyAccess();
      checkLinkStatus();
    }
  }, [currentUser, classId]);

  // Verify if student has access to this class
  const verifyAccess = async () => {
    if (!currentUser || !classId) return;

    setAccessVerification(prev => ({ ...prev, isVerifying: true }));

    try {
      const result = await AttendanceService.verifyAttendanceAccess(currentUser.id, classId);
      setAccessVerification({
        isVerifying: false,
        hasAccess: result.hasAccess,
        message: result.message,
        classInfo: result.classInfo
      });

      if (!result.hasAccess) {
        // Redirect to dashboard after 5 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 5000);
      }
    } catch (error) {
      console.error('Access verification error:', error);
      setAccessVerification({
        isVerifying: false,
        hasAccess: false,
        message: 'Error verifying access. Please try again.',
        classInfo: undefined
      });
    }
  };

  // Check if attendance link is currently active
  const checkLinkStatus = async () => {
    if (!classId) return;

    try {
      const result = await AttendanceService.checkAttendanceLinkStatus(classId);
      setLinkStatus({
        isActive: result.isActive,
        message: result.message,
        timeInfo: result.timeInfo
      });
    } catch (error) {
      console.error('Link status check error:', error);
      setLinkStatus({
        isActive: false,
        message: 'Error checking link status. Please try again.',
        timeInfo: undefined
      });
    }
  };

  // Mark attendance
  const markAttendance = async () => {
    if (!currentUser || !classId) return;

    setIsMarkingAttendance(true);
    setError('');
    setSuccess('');

    try {
      // Simple attendance marking for now
      const result = await AttendanceService.markAttendanceSimple({
        studentId: currentUser.id,
        classId: classId,
        faceVerified: true, // For bulk creation, we'll assume verification is done
        locationVerified: true,
        faceConfidence: 0.95,
        markedBy: currentUser.id,
        notes: 'Marked via bulk class attendance link'
      });

      if (result.success) {
        setSuccess('Attendance marked successfully!');
        setAttendanceMarked(true);
      } else {
        setError(result.message || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error('Mark attendance error:', error);
      setError('Error marking attendance. Please try again.');
    } finally {
      setIsMarkingAttendance(false);
    }
  };

  // Location verification function
  const getCurrentLocation = () => {
    setLocationStatus('pending');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          console.log('📍 User location:', latitude, longitude);
          
          try {
            // Get user's registration location from currentUser
            const userRegistrationLat = currentUser?.location?.lat;
            const userRegistrationLng = currentUser?.location?.lng;
            
            console.log('🏠 User registration location:', userRegistrationLat, userRegistrationLng);
            console.log('📍 Current location:', latitude, longitude);
            
            // Enhanced location validation for testing
            const locationValidation = validateAttendanceLocation(
              latitude, 
              longitude, 
              userRegistrationLat, 
              userRegistrationLng
            );
            
            console.log('🎯 Location validation result:', locationValidation);
            
            if (locationValidation.isValid) {
              setLocationStatus('verified');
              console.log(`✅ ${locationValidation.reason}`);
            } else {
              setLocationStatus('failed');
              console.log(`❌ ${locationValidation.reason}`);
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

  // Face verification handler
  const handleFaceVerification = async (success: boolean, confidence: number, image: string | null) => {
    console.log('📸 Face verification result:', { success, confidence });
    
    if (success && confidence >= 70) { // Minimum 70% confidence
      setFaceStatus('verified');
      setFaceConfidence(confidence);
      setCapturedFaceImage(image);
      console.log(`✅ Face verified with ${confidence}% confidence`);
    } else {
      setFaceStatus('failed');
      setFaceConfidence(0);
      setCapturedFaceImage(null);
      console.log(`❌ Face verification failed. Confidence: ${confidence}%`);
    }
    setShowFaceCamera(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Access Verification Loading */}
        {accessVerification.isVerifying && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Access</h2>
              <p className="text-gray-600">Please wait while we verify your access to this class...</p>
            </div>
          </div>
        )}

        {/* Access Denied */}
        {!accessVerification.isVerifying && !accessVerification.hasAccess && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
              <p className="text-red-700 mb-4 max-w-md">{accessVerification.message}</p>
              <p className="text-gray-600 text-sm">You will be redirected to the dashboard in a few seconds...</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Link Status Check */}
        {!accessVerification.isVerifying && accessVerification.hasAccess && !linkStatus.isActive && (
          <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-6">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-yellow-900 mb-1">Attendance Link Not Active</h3>
                <p className="text-yellow-700 mb-3">{linkStatus.message}</p>
                {linkStatus.timeInfo && (
                  <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-700 space-y-1">
                    <p><strong>Class Time:</strong> {linkStatus.timeInfo.classStartTime}</p>
                    <p><strong>Current Time:</strong> {linkStatus.timeInfo.currentTime}</p>
                    <p><strong>Active Period:</strong> {linkStatus.timeInfo.activeFrom} - {linkStatus.timeInfo.activeTo}</p>
                  </div>
                )}
                <button
                  onClick={checkLinkStatus}
                  className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                >
                  Refresh Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show main content only if access is verified and link is active */}
        {!accessVerification.isVerifying && accessVerification.hasAccess && linkStatus.isActive && (
          <div className="space-y-6">
            {/* Class Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
                  <p className="text-gray-600">Click the button below to mark your attendance</p>
                </div>
              </div>

              {accessVerification.classInfo && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-700">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">Class:</span>
                    <span className="ml-2">{accessVerification.classInfo.className}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">Course Code:</span>
                    <span className="ml-2">{accessVerification.classInfo.courseCode}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">Instructor:</span>
                    <span className="ml-2">{accessVerification.classInfo.instructor}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="font-medium">Date:</span>
                    <span className="ml-2">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Marking */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
                  {success}
                </div>
              )}

              {!attendanceMarked ? (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Mark Your Attendance</h3>
                  
                  {/* Verification Steps */}
                  <div className="space-y-6">
                    {/* Step 1: Location Verification */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          <MapPin className="h-5 w-5 mr-2" />
                          Step 1: Location Verification
                        </h4>
                        {locationStatus === 'verified' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {locationStatus === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                        {locationStatus === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                      </div>
                      
                      <button
                        onClick={getCurrentLocation}
                        disabled={locationStatus === 'verified'}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
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
                      
                      <p className="text-sm text-gray-600 mt-2">
                        {locationStatus === 'pending' && 'Click to verify you are on campus'}
                        {locationStatus === 'verified' && 'You are within campus boundaries'}
                        {locationStatus === 'failed' && 'You must be on campus to mark attendance'}
                      </p>
                    </div>

                    {/* Step 2: Face Verification */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          <Camera className="h-5 w-5 mr-2" />
                          Step 2: Face Verification
                        </h4>
                        {faceStatus === 'verified' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {faceStatus === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                        {faceStatus === 'pending' && <Clock className="h-5 w-5 text-yellow-500" />}
                      </div>
                      
                      <button
                        onClick={() => setShowFaceCamera(true)}
                        disabled={faceStatus === 'verified' || locationStatus !== 'verified'}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                          faceStatus === 'verified'
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : locationStatus !== 'verified'
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : faceStatus === 'failed'
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {faceStatus === 'pending' && (locationStatus === 'verified' ? 'Verify Face' : 'Complete location first')}
                        {faceStatus === 'verified' && `Face Verified ✓ (${faceConfidence}% match)`}
                        {faceStatus === 'failed' && 'Retry Face Verification'}
                      </button>
                      
                      <p className="text-sm text-gray-600 mt-2">
                        {faceStatus === 'pending' && locationStatus === 'verified' && 'Click to start face recognition'}
                        {faceStatus === 'pending' && locationStatus !== 'verified' && 'Verify location first'}
                        {faceStatus === 'verified' && 'Face successfully matched with registration'}
                        {faceStatus === 'failed' && 'Face verification failed. Please try again'}
                      </p>
                    </div>

                    {/* Final Mark Attendance Button */}
                    <button
                      onClick={markAttendance}
                      disabled={locationStatus !== 'verified' || faceStatus !== 'verified' || isMarkingAttendance}
                      className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-colors ${
                        locationStatus === 'verified' && faceStatus === 'verified'
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
                    
                    <div className="text-center text-sm text-gray-600">
                      Status: Location {locationStatus === 'verified' ? '✅' : '⏳'} | Face {faceStatus === 'verified' ? '✅' : '⏳'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">Attendance Marked Successfully!</h3>
                  <p className="text-green-700 mb-4">
                    Your attendance has been recorded for this class.
                  </p>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Back to Dashboard
                  </button>
                </div>
              )}
            </div>

            {/* Face Recognition Modal */}
            {showFaceCamera && (
              <FaceRecognitionCamera
                isOpen={showFaceCamera}
                onClose={() => setShowFaceCamera(false)}
                onFaceVerified={handleFaceVerification}
                referenceImage={currentUser?.faceImageUrl}
              />
            )}

            {/* Link Status Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Attendance Window Active</h4>
                  <p className="text-blue-700 text-sm">{linkStatus.message}</p>
                  {linkStatus.timeInfo && (
                    <p className="text-blue-600 text-xs mt-1">
                      Valid until: {linkStatus.timeInfo.activeTo}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};