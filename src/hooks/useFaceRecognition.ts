import { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

export interface FaceRecognitionResult {
  isLoaded: boolean;
  isDetecting: boolean;
  faceDetected: boolean;
  confidence: number;
  error: string | null;
}

export const useFaceRecognition = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setError(null);
        
        // Load models from public/models directory
        const MODEL_URL = '/models';
        
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);

        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setError('Failed to load face recognition models');
      }
    };

    loadModels();
  }, []);

  const startVideo = async (): Promise<MediaStream | null> => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera');
      return null;
    }
  };

  const stopVideo = (stream: MediaStream | null) => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const detectFace = async (): Promise<FaceRecognitionResult> => {
    if (!videoRef.current || !isLoaded) {
      return {
        isLoaded,
        isDetecting: false,
        faceDetected: false,
        confidence: 0,
        error: 'Video or models not ready'
      };
    }

    setIsDetecting(true);
    
    try {
      // Real face detection using face-api.js
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const result: FaceRecognitionResult = {
        isLoaded: true,
        isDetecting: false,
        faceDetected: detections.length > 0,
        confidence: detections.length > 0 ? detections[0].detection.score : 0,
        error: null
      };

      // Draw detections on canvas
      if (canvasRef.current && detections.length > 0) {
        const canvas = canvasRef.current;
        const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
        faceapi.matchDimensions(canvas, displaySize);
        
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      }

      setIsDetecting(false);
      return result;
    } catch (err) {
      console.error('Face detection error:', err);
      setIsDetecting(false);
      return {
        isLoaded,
        isDetecting: false,
        faceDetected: false,
        confidence: 0,
        error: 'Face detection failed'
      };
    }
  };

  const captureAndVerifyFace = async (referenceImage?: string): Promise<{
    success: boolean;
    confidence: number;
    capturedImage: string | null;
    error?: string;
  }> => {
    if (!videoRef.current) {
      return {
        success: false,
        confidence: 0,
        capturedImage: null,
        error: 'Video not available'
      };
    }

    try {
      // Capture current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      ctx.drawImage(videoRef.current, 0, 0);
      const capturedImage = canvas.toDataURL('image/jpeg', 0.8);

      // Real face verification using face-api.js
      const detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return {
          success: false,
          confidence: 0,
          capturedImage,
          error: 'No face detected in captured image'
        };
      }

      // If reference image is provided, compare faces
      if (referenceImage) {
        const referenceImg = new Image();
        referenceImg.src = referenceImage;
        await new Promise((resolve, reject) => {
          referenceImg.onload = resolve;
          referenceImg.onerror = reject;
        });
        
        const referenceDetection = await faceapi
          .detectSingleFace(referenceImg, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (referenceDetection) {
          const distance = faceapi.euclideanDistance(
            detection.descriptor,
            referenceDetection.descriptor
          );
          
          const similarity = 1 - distance;
          const threshold = 0.6; // Adjust based on requirements
          
          return {
            success: similarity > threshold,
            confidence: similarity,
            capturedImage,
            error: similarity <= threshold ? 'Face does not match registered face' : undefined
          };
        } else {
          return {
            success: false,
            confidence: 0,
            capturedImage,
            error: 'Could not detect face in reference image'
          };
        }
      }

      return {
        success: true,
        confidence: detection.detection.score,
        capturedImage,
        error: undefined
      };
    } catch (err) {
      console.error('Face capture/verification error:', err);
      return {
        success: false,
        confidence: 0,
        capturedImage: null,
        error: 'Failed to capture or verify face'
      };
    }
  };

  return {
    isLoaded,
    isDetecting,
    error,
    videoRef,
    canvasRef,
    startVideo,
    stopVideo,
    detectFace,
    captureAndVerifyFace
  };
};