import React, { useEffect, useState } from 'react';
import { Camera, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { useFaceRecognition } from '../../hooks/useFaceRecognition';

interface FaceRecognitionCameraProps {
  onFaceVerified: (success: boolean, confidence: number, image: string | null) => void;
  onClose: () => void;
  referenceImage?: string;
  isOpen: boolean;
}

export const FaceRecognitionCamera: React.FC<FaceRecognitionCameraProps> = ({
  onFaceVerified,
  onClose,
  referenceImage,
  isOpen
}) => {
  const {
    isLoaded,
    isDetecting,
    error,
    videoRef,
    canvasRef,
    startVideo,
    stopVideo,
    detectFace,
    captureAndVerifyFace
  } = useFaceRecognition();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [detectionInterval, setDetectionInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && isLoaded) {
      initializeCamera();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, isLoaded]);

  const initializeCamera = async () => {
    try {
      const mediaStream = await startVideo();
      setStream(mediaStream);
      
      // Start continuous face detection
      if (mediaStream) {
        const interval = setInterval(async () => {
          const result = await detectFace();
          setFaceDetected(result.faceDetected);
        }, 1000);
        setDetectionInterval(interval);
      }
    } catch (err) {
      console.error('Failed to initialize camera:', err);
    }
  };

  const cleanup = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval);
      setDetectionInterval(null);
    }
    stopVideo(stream);
    setStream(null);
    setFaceDetected(false);
  };

  const handleCapture = async () => {
    setIsCapturing(true);
    
    try {
      const result = await captureAndVerifyFace(referenceImage);
      onFaceVerified(result.success, result.confidence, result.capturedImage);
      
      if (result.success) {
        cleanup();
      }
    } catch (err) {
      console.error('Capture failed:', err);
      onFaceVerified(false, 0, null);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <Camera className="h-6 w-6 mr-2 text-blue-600" />
              Face Recognition Verification
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!isLoaded ? (
            <div className="text-center py-8">
              <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading face recognition models...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Camera Feed */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-80 object-cover"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.play();
                    }
                  }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
                
                {/* Face Detection Indicator */}
                <div className="absolute top-4 right-4">
                  {isDetecting ? (
                    <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg">
                      <Loader className="h-4 w-4 animate-spin" />
                      <span className="text-sm font-medium">Detecting...</span>
                    </div>
                  ) : faceDetected ? (
                    <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Face Detected</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-2 rounded-lg">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">No Face</span>
                    </div>
                  )}
                </div>

                {/* Instructions Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black bg-opacity-75 text-white p-3 rounded-lg">
                    <p className="text-sm text-center">
                      {!faceDetected 
                        ? "Position your face clearly in the camera frame"
                        : "Face detected! Click capture to verify your identity"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Instructions:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Look directly at the camera</li>
                  <li>• Ensure good lighting on your face</li>
                  <li>• Remove any face coverings if possible</li>
                  <li>• Stay still when capturing</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleCapture}
                  disabled={!faceDetected || isCapturing}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                    faceDetected && !isCapturing
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCapturing ? (
                    <div className="flex items-center justify-center">
                      <Loader className="h-5 w-5 animate-spin mr-2" />
                      Verifying...
                    </div>
                  ) : (
                    'Capture & Verify'
                  )}
                </button>
                
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};