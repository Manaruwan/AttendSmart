import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Edit3, Save, X } from 'lucide-react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

const UserProfileWidget: React.FC = () => {
  const { firebaseUser, currentUser } = useFirebaseAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-populate user data
  useEffect(() => {
    let userName = '';
    let userEmail = '';
    
    if (firebaseUser) {
      userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '';
      userEmail = firebaseUser.email || '';
    } else if (currentUser) {
      userName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      userEmail = currentUser.email || '';
    } else {
      // Demo data for when no user is authenticated
      userName = 'John Lecturer';
      userEmail = 'lecturer@university.edu';
    }
    
    setFormData({
      name: userName,
      email: userEmail
    });
  }, [firebaseUser, currentUser]);

  const handleEdit = () => {
    setIsEditing(true);
    // Auto-focus and select name field when editing starts
    setTimeout(() => {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
    }, 100);
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to the database
    console.log('Saving user data:', formData);
    // You can add actual save logic here later
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset to original values
    let userName = '';
    let userEmail = '';
    
    if (firebaseUser) {
      userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '';
      userEmail = firebaseUser.email || '';
    } else if (currentUser) {
      userName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      userEmail = currentUser.email || '';
    } else {
      userName = 'John Lecturer';
      userEmail = 'lecturer@university.edu';
    }
    
    setFormData({
      name: userName,
      email: userEmail
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <User className="w-5 h-5 text-blue-500 mr-2" />
          Profile Information
        </h3>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 text-green-600 hover:text-green-700 text-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 text-sm"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          {isEditing ? (
            <input
              ref={nameInputRef}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your full name"
            />
          ) : (
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900">{formData.name}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email address"
            />
          ) : (
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900">{formData.email}</span>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Tip:</strong> Your name and email will be auto-filled in forms throughout the system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileWidget;