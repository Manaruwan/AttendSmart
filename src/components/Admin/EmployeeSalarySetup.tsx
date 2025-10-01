import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Edit, 
  X,
  Search
} from 'lucide-react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Staff, Lecturer } from '../../types/firebaseTypes';

interface SalaryConfiguration {
  id?: string;
  userId: string;
  employeeId: string;
  name: string;
  role: 'staff' | 'lecturer';
  department: string;
  position?: string;
  subjects?: string[];
  basicSalary: number;
  hourlyRate: number;
  allowances: {
    transport: number;
    meal: number;
    overtime: number;
    special: number;
  };
  deductions: {
    tax: number;
    providentFund: number;
    insurance: number;
  };
  effectiveDate: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EmployeeSalarySetupProps {
  onClose?: () => void;
}

export const EmployeeSalarySetup: React.FC<EmployeeSalarySetupProps> = () => {
  const [employees, setEmployees] = useState<(Staff | Lecturer)[]>([]);
  const [salaryConfigs, setSalaryConfigs] = useState<SalaryConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<SalaryConfiguration | null>(null);

  useEffect(() => {
    loadEmployees();
    loadSalaryConfigurations();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      // Load Staff
      const staffQuery = query(
        collection(db, 'users'),
        where('role', '==', 'staff'),
        where('isActive', '==', true)
      );
      const staffSnapshot = await getDocs(staffQuery);
      
      // Load Lecturers
      const lecturerQuery = query(
        collection(db, 'users'),
        where('role', '==', 'lecturer'),
        where('isActive', '==', true)
      );
      const lecturerSnapshot = await getDocs(lecturerQuery);
      
      const allEmployees: (Staff | Lecturer)[] = [];
      
      staffSnapshot.forEach((doc) => {
        allEmployees.push({ id: doc.id, ...doc.data() } as Staff);
      });
      
      lecturerSnapshot.forEach((doc) => {
        allEmployees.push({ id: doc.id, ...doc.data() } as Lecturer);
      });
      
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSalaryConfigurations = async () => {
    try {
      const salaryQuery = query(collection(db, 'salaryConfigurations'));
      const snapshot = await getDocs(salaryQuery);
      
      const configs: SalaryConfiguration[] = [];
      snapshot.forEach((doc) => {
        configs.push({ id: doc.id, ...doc.data() } as SalaryConfiguration);
      });
      
      setSalaryConfigs(configs);
    } catch (error) {
      console.error('Error loading salary configurations:', error);
    }
  };

  const openEditModal = (employee: Staff | Lecturer) => {
    const existingConfig = salaryConfigs.find(config => config.userId === employee.id);
    
    if (existingConfig) {
      setEditingEmployee(existingConfig);
    } else {
      // Create new configuration
      const newConfig: SalaryConfiguration = {
        userId: employee.id,
        employeeId: employee.employeeId,
        name: `${employee.firstName} ${employee.lastName}`,
        role: employee.role as 'staff' | 'lecturer',
        department: employee.department,
        position: employee.role === 'staff' ? (employee as Staff).position : undefined,
        subjects: employee.role === 'lecturer' ? (employee as Lecturer).subjects : undefined,
        basicSalary: getDefaultSalary(employee),
        hourlyRate: 0,
        allowances: {
          transport: 5000,
          meal: 3000,
          overtime: 0,
          special: 0
        },
        deductions: {
          tax: 0,
          providentFund: 0,
          insurance: 2000
        },
        effectiveDate: new Date().toISOString().split('T')[0],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      newConfig.hourlyRate = newConfig.basicSalary / (22 * 8); // 22 working days, 8 hours per day
      setEditingEmployee(newConfig);
    }
    
    setShowEditModal(true);
  };

  const getDefaultSalary = (employee: Staff | Lecturer): number => {
    if (employee.role === 'lecturer') {
      const lecturer = employee as Lecturer;
      switch (lecturer.department) {
        case 'Computer Science': return 150000;
        case 'Mathematics': return 140000;
        case 'Physics': return 145000;
        case 'Engineering': return 160000;
        default: return 130000;
      }
    } else {
      const staff = employee as Staff;
      switch (staff.position) {
        case 'Manager': return 120000;
        case 'Assistant Manager': return 100000;
        case 'Coordinator': return 80000;
        case 'Administrator': return 70000;
        default: return 60000;
      }
    }
  };

  const saveSalaryConfiguration = async (config: SalaryConfiguration) => {
    try {
      setLoading(true);
      
      const configRef = config.id 
        ? doc(db, 'salaryConfigurations', config.id)
        : doc(collection(db, 'salaryConfigurations'));
      
      const configData = {
        ...config,
        updatedAt: new Date(),
        createdAt: config.createdAt || new Date()
      };
      
      await setDoc(configRef, configData);
      
      // Reload configurations
      await loadSalaryConfigurations();
      setShowEditModal(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error saving salary configuration:', error);
      alert('Error saving salary configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSalaryConfiguration = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this salary configuration?')) return;
    
    try {
      await deleteDoc(doc(db, 'salaryConfigurations', configId));
      await loadSalaryConfigurations();
    } catch (error) {
      console.error('Error deleting salary configuration:', error);
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || 
           employee.employeeId.toLowerCase().includes(search) ||
           employee.department.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Salary Setup</h2>
          <p className="text-gray-600">Configure basic salaries, allowances, and deductions for employees</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredEmployees.length} employees found
          </div>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Loading employees...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No employees found
          </div>
        ) : (
          filteredEmployees.map((employee) => {
            const salaryConfig = salaryConfigs.find(config => config.userId === employee.id);
            
            return (
              <div key={employee.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">ID: {employee.employeeId}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    employee.role === 'lecturer' 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Department:</span>
                    <span className="text-sm font-medium">{employee.department}</span>
                  </div>
                  
                  {employee.role === 'staff' && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Position:</span>
                      <span className="text-sm font-medium">{(employee as Staff).position}</span>
                    </div>
                  )}
                  
                  {salaryConfig ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Basic Salary:</span>
                        <span className="text-sm font-bold text-green-600">
                          Rs. {salaryConfig.basicSalary.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Hourly Rate:</span>
                        <span className="text-sm font-medium">
                          Rs. {salaryConfig.hourlyRate.toFixed(2)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-sm text-orange-600 font-medium">Not Configured</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(employee)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{salaryConfig ? 'Edit' : 'Setup'}</span>
                  </button>
                  
                  {salaryConfig && (
                    <button
                      onClick={() => salaryConfig.id && deleteSalaryConfiguration(salaryConfig.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingEmployee && (
        <SalaryConfigurationModal
          employee={editingEmployee}
          onSave={saveSalaryConfiguration}
          onClose={() => {
            setShowEditModal(false);
            setEditingEmployee(null);
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

// Salary Configuration Modal Component
const SalaryConfigurationModal: React.FC<{
  employee: SalaryConfiguration;
  onSave: (config: SalaryConfiguration) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ employee, onSave, onClose, loading }) => {
  const [config, setConfig] = useState<SalaryConfiguration>(employee);

  const updateConfig = (field: keyof SalaryConfiguration, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updateAllowance = (field: keyof SalaryConfiguration['allowances'], value: number) => {
    setConfig(prev => ({
      ...prev,
      allowances: { ...prev.allowances, [field]: value }
    }));
  };

  const updateDeduction = (field: keyof SalaryConfiguration['deductions'], value: number) => {
    setConfig(prev => ({
      ...prev,
      deductions: { ...prev.deductions, [field]: value }
    }));
  };

  const handleBasicSalaryChange = (value: number) => {
    setConfig(prev => ({
      ...prev,
      basicSalary: value,
      hourlyRate: value / (22 * 8) // Recalculate hourly rate
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Salary Configuration - {config.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  value={config.employeeId}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={config.department}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  value={config.effectiveDate}
                  onChange={(e) => updateConfig('effectiveDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Salary Details */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Salary Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Basic Salary (Rs.)
                </label>
                <input
                  type="number"
                  value={config.basicSalary}
                  onChange={(e) => handleBasicSalaryChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate (Rs.)
                </label>
                <input
                  type="number"
                  value={config.hourlyRate.toFixed(2)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Allowances */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Allowances</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport (Rs.)
                </label>
                <input
                  type="number"
                  value={config.allowances.transport}
                  onChange={(e) => updateAllowance('transport', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meal (Rs.)
                </label>
                <input
                  type="number"
                  value={config.allowances.meal}
                  onChange={(e) => updateAllowance('meal', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overtime Rate (Rs.)
                </label>
                <input
                  type="number"
                  value={config.allowances.overtime}
                  onChange={(e) => updateAllowance('overtime', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special (Rs.)
                </label>
                <input
                  type="number"
                  value={config.allowances.special}
                  onChange={(e) => updateAllowance('special', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Deductions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax (%)
                </label>
                <input
                  type="number"
                  value={config.deductions.tax}
                  onChange={(e) => updateDeduction('tax', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provident Fund (%)
                </label>
                <input
                  type="number"
                  value={config.deductions.providentFund}
                  onChange={(e) => updateDeduction('providentFund', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance (Rs.)
                </label>
                <input
                  type="number"
                  value={config.deductions.insurance}
                  onChange={(e) => updateDeduction('insurance', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">Salary Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Basic Salary:</span>
                <div className="font-medium">Rs. {config.basicSalary.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Total Allowances:</span>
                <div className="font-medium text-green-600">
                  +Rs. {Object.values(config.allowances).reduce((sum, val) => sum + val, 0).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Estimated Deductions:</span>
                <div className="font-medium text-red-600">
                  -Rs. {(
                    (config.basicSalary * config.deductions.tax / 100) +
                    (config.basicSalary * config.deductions.providentFund / 100) +
                    config.deductions.insurance
                  ).toFixed(0)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Estimated Net:</span>
                <div className="font-bold text-blue-600">
                  Rs. {(
                    config.basicSalary + 
                    Object.values(config.allowances).reduce((sum, val) => sum + val, 0) -
                    (config.basicSalary * config.deductions.tax / 100) -
                    (config.basicSalary * config.deductions.providentFund / 100) -
                    config.deductions.insurance
                  ).toFixed(0)}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeSalarySetup;