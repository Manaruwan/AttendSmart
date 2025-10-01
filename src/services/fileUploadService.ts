import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../config/firebase';

export class FileUploadService {
  
  // Upload face images
  static async uploadFaceImage(
    userId: string, 
    file: File | Blob, 
    type: 'reference' | 'attendance'
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const extension = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const filename = `${type}_${userId}_${timestamp}.${extension}`;
      const storageRef = ref(storage, `face-images/${type}/${filename}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Face image upload error:', error);
      throw new Error(error.message || 'Failed to upload face image');
    }
  }

  // Upload assignment files
  static async uploadAssignmentFile(
    assignmentId: string, 
    studentId: string, 
    file: File
  ): Promise<string> {
    try {
      const extension = file.name.split('.').pop();
      const filename = `${studentId}_${Date.now()}.${extension}`;
      const storageRef = ref(storage, `assignments/${assignmentId}/submissions/${filename}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Assignment upload error:', error);
      throw new Error(error.message || 'Failed to upload assignment');
    }
  }

  // Upload assignment materials (by lecturer)
  static async uploadAssignmentMaterial(
    assignmentId: string, 
    file: File
  ): Promise<string> {
    try {
      const extension = file.name.split('.').pop();
      const filename = `material_${Date.now()}.${extension}`;
      const storageRef = ref(storage, `assignments/${assignmentId}/materials/${filename}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Assignment material upload error:', error);
      throw new Error(error.message || 'Failed to upload assignment material');
    }
  }

  // Upload exam files
  static async uploadExamFile(
    examId: string, 
    file: File,
    type: 'question' | 'answer' | 'material'
  ): Promise<string> {
    try {
      const extension = file.name.split('.').pop();
      const filename = `${type}_${Date.now()}.${extension}`;
      const storageRef = ref(storage, `exams/${examId}/${type}s/${filename}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Exam file upload error:', error);
      throw new Error(error.message || 'Failed to upload exam file');
    }
  }

  // Upload lecture materials
  static async uploadLectureMaterial(
    classId: string, 
    batchId: string, 
    file: File
  ): Promise<string> {
    try {
      const extension = file.name.split('.').pop();
      const filename = `${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}_${Date.now()}.${extension}`;
      const storageRef = ref(storage, `lecture-materials/${batchId}/${classId}/${filename}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Lecture material upload error:', error);
      throw new Error(error.message || 'Failed to upload lecture material');
    }
  }

  // Upload supporting documents for leave requests
  static async uploadLeaveDocument(
    userId: string, 
    requestId: string, 
    file: File
  ): Promise<string> {
    try {
      const extension = file.name.split('.').pop();
      const filename = `${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}_${Date.now()}.${extension}`;
      const storageRef = ref(storage, `leave-requests/${userId}/${requestId}/${filename}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Leave document upload error:', error);
      throw new Error(error.message || 'Failed to upload leave document');
    }
  }

  // Upload profile images
  static async uploadProfileImage(
    userId: string, 
    file: File
  ): Promise<string> {
    try {
      const extension = file.name.split('.').pop();
      const filename = `profile_${userId}_${Date.now()}.${extension}`;
      const storageRef = ref(storage, `profile-images/${filename}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error: any) {
      console.error('Profile image upload error:', error);
      throw new Error(error.message || 'Failed to upload profile image');
    }
  }

  // Delete file
  static async deleteFile(url: string): Promise<void> {
    try {
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (error: any) {
      console.error('File deletion error:', error);
      throw new Error(error.message || 'Failed to delete file');
    }
  }

  // List files in a directory
  static async listFiles(path: string): Promise<{ name: string; url: string }[]> {
    try {
      const storageRef = ref(storage, path);
      const result = await listAll(storageRef);
      
      const files = await Promise.all(
        result.items.map(async (item) => ({
          name: item.name,
          url: await getDownloadURL(item)
        }))
      );
      
      return files;
    } catch (error: any) {
      console.error('List files error:', error);
      throw new Error(error.message || 'Failed to list files');
    }
  }

  // Get batch-wise download folder structure
  static async getBatchFiles(batchId: string): Promise<{
    lectureMaterials: { name: string; url: string }[];
    assignments: { name: string; url: string }[];
    exams: { name: string; url: string }[];
  }> {
    try {
      const [lectureMaterials, assignments, exams] = await Promise.all([
        this.listFiles(`lecture-materials/${batchId}`),
        this.listFiles(`assignments`), // Filter by batchId in application logic
        this.listFiles(`exams`) // Filter by batchId in application logic
      ]);

      return {
        lectureMaterials,
        assignments: assignments.filter(file => file.name.includes(batchId)),
        exams: exams.filter(file => file.name.includes(batchId))
      };
    } catch (error: any) {
      console.error('Get batch files error:', error);
      throw new Error(error.message || 'Failed to get batch files');
    }
  }

  // Validate file type and size
  static validateFile(
    file: File, 
    allowedTypes: string[], 
    maxSizeMB: number = 10
  ): { valid: boolean; error?: string } {
    // Check file type
    const fileType = file.type;
    const isValidType = allowedTypes.some(type => {
      if (type.includes('*')) {
        return fileType.startsWith(type.replace('*', ''));
      }
      return fileType === type;
    });

    if (!isValidType) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      return {
        valid: false,
        error: `File size too large. Maximum size: ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }

  // Common file type groups
  static readonly FILE_TYPES = {
    IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
    DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    PRESENTATIONS: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ARCHIVES: ['application/zip', 'application/x-rar-compressed'],
    ALL_ACADEMIC: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png'
    ]
  };

  // Create a download link
  static createDownloadLink(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Convert file to base64 (useful for face images)
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Resize image before upload (client-side optimization)
  static resizeImage(
    file: File, 
    maxWidth: number = 1024, 
    maxHeight: number = 1024, 
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}
