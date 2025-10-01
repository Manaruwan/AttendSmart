import * as faceapi from 'face-api.js';

export class FaceRecognitionService {
  private static instance: FaceRecognitionService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): FaceRecognitionService {
    if (!FaceRecognitionService.instance) {
      FaceRecognitionService.instance = new FaceRecognitionService();
    }
    return FaceRecognitionService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize face recognition models:', error);
      return false;
    }
  }

  async detectFace(input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<{
    detected: boolean;
    confidence: number;
    descriptor?: Float32Array;
    landmarks?: faceapi.FaceLandmarks68;
  }> {
    if (!this.isInitialized) {
      throw new Error('Face recognition service not initialized');
    }

    try {
      const detection = await faceapi
        .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        return {
          detected: true,
          confidence: detection.detection.score,
          descriptor: detection.descriptor,
          landmarks: detection.landmarks
        };
      }

      return {
        detected: false,
        confidence: 0
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return {
        detected: false,
        confidence: 0
      };
    }
  }

  async compareFaces(
    descriptor1: Float32Array,
    descriptor2: Float32Array,
    threshold: number = 0.6
  ): Promise<{
    match: boolean;
    distance: number;
    similarity: number;
  }> {
    const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
    const similarity = 1 - distance;
    
    return {
      match: similarity > threshold,
      distance,
      similarity
    };
  }

  async extractFaceDescriptor(imageElement: HTMLImageElement): Promise<Float32Array | null> {
    if (!this.isInitialized) {
      throw new Error('Face recognition service not initialized');
    }

    try {
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      return detection ? detection.descriptor : null;
    } catch (error) {
      console.error('Face descriptor extraction error:', error);
      return null;
    }
  }

  async verifyIdentity(
    currentImage: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    referenceDescriptor: Float32Array,
    threshold: number = 0.6
  ): Promise<{
    verified: boolean;
    confidence: number;
    similarity: number;
  }> {
    const currentDetection = await this.detectFace(currentImage);
    
    if (!currentDetection.detected || !currentDetection.descriptor) {
      return {
        verified: false,
        confidence: 0,
        similarity: 0
      };
    }

    const comparison = await this.compareFaces(
      currentDetection.descriptor,
      referenceDescriptor,
      threshold
    );

    return {
      verified: comparison.match,
      confidence: currentDetection.confidence,
      similarity: comparison.similarity
    };
  }

  // Utility method to create a labeled face descriptor for training
  createLabeledFaceDescriptor(label: string, descriptors: Float32Array[]): faceapi.LabeledFaceDescriptors {
    return new faceapi.LabeledFaceDescriptors(label, descriptors);
  }

  // Method to create a face matcher for multiple people
  createFaceMatcher(labeledDescriptors: faceapi.LabeledFaceDescriptors[], threshold: number = 0.6): faceapi.FaceMatcher {
    return new faceapi.FaceMatcher(labeledDescriptors, threshold);
  }
}