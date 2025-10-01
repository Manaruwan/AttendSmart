import React, { useState } from 'react';
import { Shield, User, Mail, Lock, CheckCircle, AlertCircle, GraduationCap, Users, Briefcase } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

interface AccountForm {
  role: 'admin' | 'student' | 'lecturer' | 'staff';
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  department?: string;
  studentId?: string;
  phone?: string;
}

export const AccountCreation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'student' | 'lecturer' | 'staff'>('admin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<AccountForm>({
    role: 'admin',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    studentId: '',
    phone: ''
  });

  const handleInputChange = (field: keyof AccountForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTabChange = (role: 'admin' | 'student' | 'lecturer' | 'staff') => {
    setActiveTab(role);
    setForm(prev => ({
      ...prev,
      role,
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      department: '',
      studentId: '',
      phone: ''
    }));
    setMessage('');
    setSuccess(false);
  };

  const validateForm = (): boolean => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setMessage('Please fill in all required fields');
      setSuccess(false);
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match');
      setSuccess(false);
      return false;
    }

    if (form.password.length < 6) {
      setMessage('Password must be at least 6 characters long');
      setSuccess(false);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setMessage('Please enter a valid email address');
      setSuccess(false);
      return false;
    }

    if (form.role === 'student' && !form.studentId) {
      setMessage('Student ID is required for student accounts');
      setSuccess(false);
      return false;
    }

    return true;
  };

  const createAccount = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage('Creating account...');
    
    try {
      // Simulate account creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      setMessage(`${form.role.charAt(0).toUpperCase() + form.role.slice(1)} account created successfully!`);
      
      // Reset form
      setForm({
        role: activeTab,
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        department: '',
        studentId: '',
        phone: ''
      });
      
    } catch (error: any) {
      setSuccess(false);
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const quickSetupAdmin = async () => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, 'admin@university.edu', 'admin123');
      if (result.user) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: 'admin@university.edu',
          fullName: 'System Administrator',
          role: 'admin',
          nic: 'A123456789',
          phone: '+94701234567',
          address: 'University Campus',
          department: 'Administration',
          employeeId: 'ADMIN001',
          jobTitle: 'System Administrator',
          createdAt: new Date(),
          status: 'active'
        });
        setSuccess(true);
        setMessage('Admin account created successfully! Email: admin@university.edu, Password: admin123');
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setSuccess(true);
        setMessage('Admin account already exists. Email: admin@university.edu, Password: admin123');
      } else {
        setSuccess(false);
        setMessage('Error creating admin account: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const createDemoAccount = async (roleType: string) => {
    setLoading(true);
    try {
      const demoAccounts = {
        student: {
          email: 'student@university.edu',
          password: 'student123',
          fullName: 'John Doe',
          nic: 'S123456789',
          phone: '+94712345678',
          address: '123 Student Lane, Colombo',
          studentId: 'STU001',
          course: 'Computer Science',
          year: '2nd Year',
          semester: '1st Semester'
        },
        lecturer: {
          email: 'lecturer@university.edu',
          password: 'lecturer123',
          fullName: 'Dr. Jane Smith',
          nic: 'L123456789',
          phone: '+94723456789',
          address: '456 Faculty Road, Colombo',
          department: 'Computer Science',
          employeeId: 'LEC001',
          qualification: 'PhD in Computer Science',
          subjects: 'Programming, Data Structures'
        },
        staff: {
          email: 'staff@university.edu',
          password: 'staff123',
          fullName: 'Mike Johnson',
          nic: 'ST123456789',
          phone: '+94734567890',
          address: '789 Staff Street, Colombo',
          department: 'Administration',
          employeeId: 'STF001',
          jobTitle: 'Academic Coordinator'
        }
      };

      const accountData = demoAccounts[roleType as keyof typeof demoAccounts];
      
      const result = await createUserWithEmailAndPassword(auth, accountData.email, accountData.password);
      if (result.user) {
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          role: roleType,
          createdAt: new Date(),
          status: 'active',
          ...accountData
        });
        setSuccess(true);
        setMessage(`${roleType.charAt(0).toUpperCase() + roleType.slice(1)} account created successfully! Email: ${accountData.email}, Password: ${accountData.password}`);
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        const accountData = {
          student: { email: 'student@university.edu', password: 'student123' },
          lecturer: { email: 'lecturer@university.edu', password: 'lecturer123' },
          staff: { email: 'staff@university.edu', password: 'staff123' }
        };
        const data = accountData[roleType as keyof typeof accountData];
        setSuccess(true);
        setMessage(`${roleType.charAt(0).toUpperCase() + roleType.slice(1)} account already exists. Email: ${data.email}, Password: ${data.password}`);
      } else {
        setSuccess(false);
        setMessage(`Error creating ${roleType} account: ` + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'admin', name: 'Admin', icon: Shield, color: 'purple' },
    { id: 'student', name: 'Student', icon: GraduationCap, color: 'blue' },
    { id: 'lecturer', name: 'Lecturer', icon: User, color: 'green' },
    { id: 'staff', name: 'Staff', icon: Briefcase, color: 'orange' }
  ];

  const getTabColor = (color: string, isActive: boolean) => {
    const colors = {
      purple: isActive ? 'bg-purple-100 text-purple-700 border-purple-300' : 'text-purple-600 hover:bg-purple-50',
      blue: isActive ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-blue-600 hover:bg-blue-50',
      green: isActive ? 'bg-green-100 text-green-700 border-green-300' : 'text-green-600 hover:bg-green-50',
      orange: isActive ? 'bg-orange-100 text-orange-700 border-orange-300' : 'text-orange-600 hover:bg-orange-50'
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Creation</h1>
          <p className="text-gray-600">Create accounts for different user roles</p>
        </div>

        {/* Quick Admin Setup */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Quick Setup - Demo Accounts
          </h3>
          <p className="text-purple-700 text-sm mb-3">Create demo accounts for testing different user roles</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={quickSetupAdmin}
              disabled={loading}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-xs"
            >
              Admin
            </button>
            <button
              onClick={() => createDemoAccount('student')}
              disabled={loading}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-xs"
            >
              Student
            </button>
            <button
              onClick={() => createDemoAccount('lecturer')}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs"
            >
              Lecturer
            </button>
            <button
              onClick={() => createDemoAccount('staff')}
              disabled={loading}
              className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 text-xs"
            >
              Staff
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? getTabColor(tab.color, true) + ' border'
                    : getTabColor(tab.color, false)
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Account Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter first name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
            />
          </div>

          {/* Role-specific fields */}
          {activeTab === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student ID *</label>
                <input
                  type="text"
                  value={form.studentId}
                  onChange={(e) => handleInputChange('studentId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., CS2024001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>
            </div>
          )}

          {(activeTab === 'lecturer' || activeTab === 'staff') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <select
                  value={form.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Engineering">Engineering</option>
                  {activeTab === 'staff' && <option value="Administration">Administration</option>}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+94771234567"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm password"
              />
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={createAccount}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Creating Account...' : `Create ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Account`}
          </button>

          {/* Status Message */}
          {message && (
            <div className={`flex items-center p-4 rounded-lg ${
              success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {success ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          {/* Navigation Links */}
          <div className="text-center space-y-2 pt-4 border-t">
            <div>
              <a href="/login" className="text-blue-600 hover:underline text-sm">
                Go to Login Page
              </a>
            </div>
            <div>
              <a href="/app/dashboard" className="text-gray-600 hover:underline text-sm">
                Access Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};