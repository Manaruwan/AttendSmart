import React, { useState } from 'react';
import { Shield, User, Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { Admin } from '../../types/firebaseTypes';

export const AdminSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const createAdminAccount = async () => {
    setLoading(true);
    setMessage('Creating admin account...');
    
    try {
      // Create admin user data
      const adminData: Omit<Admin, 'id' | 'createdAt' | 'updatedAt'> = {
        email: 'admin@smartattend.com',
        role: 'admin',
        firstName: 'System',
        lastName: 'Administrator',
        phoneNumber: '+94000000000',
        isActive: true,
        permissions: [
          'user_management',
          'class_management',
          'attendance_management',
          'report_generation',
          'system_settings',
          'database_access'
        ],
        department: 'IT Administration'
      };

      // Create the admin account
      await AuthService.register(
        'admin@smartattend.com',
        'Admin@123',
        adminData
      );
      
      setSuccess(true);
      setMessage('Admin account created successfully! Use: admin@smartattend.com / Admin@123');
      
    } catch (error: any) {
      setSuccess(false);
      if (error.message.includes('email-already-in-use')) {
        setMessage('Admin account already exists! You can login with: admin@smartattend.com / Admin@123');
        setSuccess(true);
      } else {
        setMessage(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Setup</h1>
          <p className="text-gray-600">Create default admin account</p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Default Admin Credentials:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-500 mr-2" />
                <span>admin@smartattend.com</span>
              </div>
              <div className="flex items-center">
                <Lock className="h-4 w-4 text-gray-500 mr-2" />
                <span>Admin@123</span>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-500 mr-2" />
                <span>System Administrator</span>
              </div>
            </div>
          </div>

          <button
            onClick={createAdminAccount}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Admin Account...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 mr-2" />
                Create Admin Account
              </>
            )}
          </button>

          {message && (
            <div className={`p-4 rounded-lg flex items-start ${
              success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {success ? (
                <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 text-red-600" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Next Steps:</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Click "Create Admin Account"</li>
              <li>2. Go to <a href="/firebase-login" className="text-blue-600 hover:underline">Firebase Login</a></li>
              <li>3. Login with admin credentials</li>
              <li>4. Access <a href="/dashboard" className="text-blue-600 hover:underline">Admin Dashboard</a></li>
            </ol>
          </div>

          <div className="flex space-x-2">
            <a
              href="/firebase-login"
              className="flex-1 bg-green-100 text-green-700 py-2 px-4 rounded-lg text-center hover:bg-green-200 transition-colors"
            >
              Go to Login
            </a>
            <a
              href="/test-firebase"
              className="flex-1 bg-purple-100 text-purple-700 py-2 px-4 rounded-lg text-center hover:bg-purple-200 transition-colors"
            >
              Test Firebase
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};