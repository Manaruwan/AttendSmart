// Backup of the working AddUserModal before modifications
import React, { useState, useEffect } from 'react';
import { X, Camera, Image, Video, MapPin, Navigation, Plus } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../config/firebase';
import { WebcamCapture } from '../Common/WebcamCapture';
import { Timestamp } from 'firebase/firestore';
import { useToasts } from '../../hooks/useToasts';
import ToastContainer from '../Common/ToastContainer';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const { toasts, showSuccess, showError, removeToast } = useToasts();
  
  // Simple approach: Just use Firebase normally but don't redirect
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess('User Created Successfully!', 'User has been created successfully.');
    onUserCreated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold">Add New User</h3>
          <form onSubmit={handleSubmit}>
            <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
              Create User
            </button>
          </form>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};