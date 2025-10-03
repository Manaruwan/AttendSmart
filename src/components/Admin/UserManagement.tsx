import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Search, Filter, UserCheck, UserX, Download, Eye } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { DatabaseService } from '../../services/databaseService';
import { AddUserModal } from './AddUserModal';
import { EditUserModal } from './EditUserModal';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'student' | 'lecturer' | 'staff' | 'admin';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  department?: string;
  studentId?: string;
  batchId?: string;
  employeeId?: string;
  phone?: string;
  dateOfBirth?: string;
  assignments?: Array<{
    course: string;
    employmentType: string;
  }>;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; userId: string; userName: string }>({
    show: false,
    userId: '',
    userName: ''
  });

  // Utility function to get batch name from ID
  const getBatchName = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    return batch?.name || batchId;
  };

  // Prevent component rendering when not on users page
  useEffect(() => {
    if (window.location.pathname !== '/app/users') {
      console.log('UserManagement: Not on users page, preventing render');
      return;
    }
  }, []);

  // Debug URL changes - prevent unnecessary re-renders
  React.useEffect(() => {
    console.log('UserManagement: Current URL:', window.location.href);
    console.log('UserManagement: Component mounted/updated');
    
    // Force stay on UserManagement page
    if (window.location.pathname === '/app/users') {
      console.log('UserManagement: Staying on users page');
    }
  }, []);

  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const [snapshot, batchData] = await Promise.all([
          getDocs(collection(db, 'users')),
          DatabaseService.getBatches()
        ]);
        
        setBatches(batchData);
        
        const usersData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            firstName: data.fullName?.split(' ')[0] || '',
            lastName: data.fullName?.split(' ').slice(1).join(' ') || '',
            email: data.email || '',
            role: data.role || '',
            isActive: data.status === 'active',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0,10) : '',
            lastLogin: data.lastLogin ? (data.lastLogin.toDate ? data.lastLogin.toDate().toISOString().slice(0,10) : data.lastLogin) : 'Never',
            department: data.department || '',
            studentId: data.studentId || '',
            batchId: data.batchId || '',
            employeeId: data.employeeId || '',
            phone: data.phone || '',
            dateOfBirth: data.dateOfBirth || '',
            assignments: data.assignments || []
          };
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const handleUserCreated = async () => {
    console.log('handleUserCreated called - staying on UserManagement page');
    
    // Use setTimeout to prevent React Router state conflicts
    setTimeout(async () => {
      // Ensure modal is closed
      setShowAddModal(false);
      
      // Refresh users list after creating a new user
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const usersData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            firstName: data.fullName?.split(' ')[0] || '',
            lastName: data.fullName?.split(' ').slice(1).join(' ') || '',
            email: data.email || '',
            role: data.role || '',
            isActive: data.status === 'active',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0,10) : '',
            lastLogin: data.lastLogin ? (data.lastLogin.toDate ? data.lastLogin.toDate().toISOString().slice(0,10) : data.lastLogin) : 'Never',
            department: data.department || '',
            studentId: data.studentId || '',
            batchId: data.batchId || '',
            employeeId: data.employeeId || '',
            phone: data.phone || ''
          };
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error refreshing users:', error);
      }
      setLoading(false);
    }, 100);
  };

  const handleUserUpdated = async () => {
    setEditUser(null);
    // Refresh users list after updating a user
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          firstName: data.fullName?.split(' ')[0] || '',
          lastName: data.fullName?.split(' ').slice(1).join(' ') || '',
          email: data.email || '',
          role: data.role || '',
          isActive: data.status === 'active',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().slice(0,10) : '',
          lastLogin: data.lastLogin ? (data.lastLogin.toDate ? data.lastLogin.toDate().toISOString().slice(0,10) : data.lastLogin) : 'Never',
          department: data.department || '',
          studentId: data.studentId || '',
          batchId: data.batchId || '',
          employeeId: data.employeeId || '',
          phone: data.phone || '',
          dateOfBirth: data.dateOfBirth || ''
        };
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Remove from local state immediately for better UX
      setUsers(prev => prev.filter(user => user.id !== userId));
      setDeleteConfirm({ show: false, userId: '', userName: '' });
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', userId));
      console.log('User deleted from Firestore:', userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      // Optionally restore user in case of error
      window.location.reload();
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Update local state immediately for better UX
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, isActive: !currentStatus }
          : user
      ));

      // Update in Firestore
      const { db } = await import('../../config/firebase');
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', userId), {
        status: !currentStatus ? 'active' : 'inactive'
      });
      
      console.log(`User ${userId} status updated to:`, !currentStatus ? 'active' : 'inactive');
    } catch (error) {
      console.error('Error updating user status:', error);
      // Revert local state in case of error
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, isActive: currentStatus }
          : user
      ));
    }
  };

  const handleViewUser = (user: User) => {
    setViewUser(user);
  };

  const confirmDelete = (user: User) => {
    setDeleteConfirm({
      show: true,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`
    });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, userId: '', userName: '' });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Name,Email,Role,Status,Created At,Last Login\n"
      + users.map(user => 
          `${user.id},${user.firstName} ${user.lastName},${user.email},${user.role},${user.isActive ? 'Active' : 'Inactive'},${user.createdAt},${user.lastLogin || 'Never'}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('UserManagement rendered, showAddModal:', showAddModal);

  // Early return if not on correct page
  if (window.location.pathname !== '/app/users') {
    console.log('UserManagement: Wrong path, not rendering');
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage students, lecturers, and staff accounts</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          {/* Import button removed as requested */}
          <button
            onClick={() => {
              console.log('Add User button clicked');
              setShowAddModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="lecturer">Lecturers</option>
            <option value="staff">Staff</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'student').length}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lecturers</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'lecturer').length}
              </p>
            </div>
            <UserCheck className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <UserX className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Staff</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'staff').length}
              </p>
            </div>
            <UserX className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.studentId && (
                          <div className="text-xs text-gray-400">Student ID: {user.studentId}</div>
                        )}
                        {user.employeeId && (user.role === 'staff' || user.role === 'lecturer' || user.role === 'admin') && (
                          <div className="text-xs text-gray-400">Employee ID: {user.employeeId}</div>
                        )}
                        {user.batchId && (
                          <div className="text-xs text-gray-400">Batch: {getBatchName(user.batchId)}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'student' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'lecturer' ? 'bg-green-100 text-green-800' :
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin || 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="text-green-600 hover:text-green-900"
                        onClick={() => handleViewUser(user)}
                        title="View User Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => setEditUser(user)}
                        title="Edit User"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        className={`${user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                        onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                      >
                        {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button 
                        onClick={() => confirmDelete(user)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
        }}
        onUserCreated={handleUserCreated}
      />

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete User</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <span className="font-semibold">{deleteConfirm.userName}</span>? 
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(deleteConfirm.userId)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                <button
                  onClick={() => setViewUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {viewUser.firstName} {viewUser.lastName}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {viewUser.email}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg capitalize">
                      {viewUser.role}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="text-sm bg-gray-50 px-3 py-2 rounded-lg">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        viewUser.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {viewUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {viewUser.studentId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {viewUser.studentId}
                      </div>
                    </div>
                  )}
                  
                  {viewUser.batchId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {getBatchName(viewUser.batchId)}
                      </div>
                    </div>
                  )}
                  
                  {viewUser.employeeId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {viewUser.employeeId}
                      </div>
                    </div>
                  )}
                  
                  {viewUser.department && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {viewUser.department}
                      </div>
                    </div>
                  )}
                  
                  {viewUser.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {viewUser.phone}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {viewUser.createdAt || 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                      {viewUser.lastLogin || 'Never'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Lecturer Assignments Section */}
              {viewUser.role === 'lecturer' && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Course Assignments</h4>
                  
                  {viewUser.assignments && viewUser.assignments.length > 0 ? (
                    <div className="space-y-3">
                      {viewUser.assignments.map((assignment, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                              <div className="text-sm text-gray-900 font-medium">
                                {assignment.course}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                              <div className="text-sm text-gray-900">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  assignment.employmentType === 'full-time' 
                                    ? 'bg-green-100 text-green-800' 
                                    : assignment.employmentType === 'visiting'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {assignment.employmentType === 'full-time' ? 'Full Time' : 
                                   assignment.employmentType === 'visiting' ? 'Visiting' : 
                                   'Full Time + Visiting'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm bg-gray-50 p-4 rounded-lg">
                      No course assignments found for this lecturer.
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setViewUser(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewUser(null);
                    setEditUser(viewUser);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};