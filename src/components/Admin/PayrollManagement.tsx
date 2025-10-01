import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Users, 
  Clock, 
  Download, 
  Eye, 
  Check, 
  X,
  Search,
  Plus,
  Settings
} from 'lucide-react';
import { PayrollService, EmployeePayrollInfo } from '../../services/payrollService';
import { PayrollRecord } from '../../types/firebaseTypes';
import { EmployeeSalarySetup } from './EmployeeSalarySetup';

interface PayrollManagementProps {
  onClose?: () => void;
}

export const PayrollManagement: React.FC<PayrollManagementProps> = () => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'attendance' | 'salary-setup'>('payroll');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  });
  
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeePayrollInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'approved' | 'paid'>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'payroll') {
      loadPayrollData();
      loadEmployees();
    }
  }, [selectedMonth, activeTab]);

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      const records = await PayrollService.getMonthlyPayroll(selectedMonth);
      setPayrollRecords(records);
    } catch (error) {
      console.error('Error loading payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const employeeList = await PayrollService.getAllEmployees();
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const generatePayroll = async () => {
    setLoading(true);
    try {
      await PayrollService.generateMonthlyPayroll(selectedMonth);
      await loadPayrollData();
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Error generating payroll:', error);
      alert('Error generating payroll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const approvePayroll = async (payrollId: string) => {
    try {
      await PayrollService.approvePayroll(payrollId, 'current-admin-id');
      await loadPayrollData();
    } catch (error) {
      console.error('Error approving payroll:', error);
    }
  };

  const markAsPaid = async (payrollId: string) => {
    try {
      await PayrollService.markPayrollPaid(payrollId);
      await loadPayrollData();
    } catch (error) {
      console.error('Error marking payroll as paid:', error);
    }
  };

  const filteredRecords = payrollRecords.filter(record => {
    const employee = employees.find(emp => emp.userId === record.userId);
    const matchesSearch = employee ? 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalPayroll = filteredRecords.reduce((sum, record) => sum + record.totalSalary, 0);
  const statusCounts = {
    draft: payrollRecords.filter(r => r.status === 'draft').length,
    approved: payrollRecords.filter(r => r.status === 'approved').length,
    paid: payrollRecords.filter(r => r.status === 'paid').length
  };

  const tabs = [
    { id: 'payroll', label: 'Payroll Records', icon: DollarSign },
    { id: 'attendance', label: 'Employee Attendance', icon: Clock },
    { id: 'salary-setup', label: 'Salary Setup', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payroll Management</h2>
            <p className="text-gray-600">Manage employee salaries and attendance-based payroll</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'payroll' && (
        <PayrollRecordsTab
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          payrollRecords={filteredRecords}
          employees={employees}
          loading={loading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          totalPayroll={totalPayroll}
          statusCounts={statusCounts}
          showGenerateModal={showGenerateModal}
          setShowGenerateModal={setShowGenerateModal}
          showAttendanceModal={showAttendanceModal}
          setShowAttendanceModal={setShowAttendanceModal}
          generatePayroll={generatePayroll}
          approvePayroll={approvePayroll}
          markAsPaid={markAsPaid}
          loadPayrollData={loadPayrollData}
        />
      )}

      {activeTab === 'attendance' && (
        <EmployeeAttendanceTab employees={employees} />
      )}

      {activeTab === 'salary-setup' && (
        <EmployeeSalarySetup />
      )}
    </div>
  );
};

// Payroll Records Tab Component
const PayrollRecordsTab: React.FC<{
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  payrollRecords: PayrollRecord[];
  employees: EmployeePayrollInfo[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: 'all' | 'draft' | 'approved' | 'paid';
  setFilterStatus: (status: 'all' | 'draft' | 'approved' | 'paid') => void;
  totalPayroll: number;
  statusCounts: { draft: number; approved: number; paid: number };
  showGenerateModal: boolean;
  setShowGenerateModal: (show: boolean) => void;
  showAttendanceModal: boolean;
  setShowAttendanceModal: (show: boolean) => void;
  generatePayroll: () => void;
  approvePayroll: (id: string) => void;
  markAsPaid: (id: string) => void;
  loadPayrollData: () => void;
}> = ({
  selectedMonth,
  setSelectedMonth,
  payrollRecords,
  employees,
  loading,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  totalPayroll,
  statusCounts,
  showGenerateModal,
  setShowGenerateModal,
  showAttendanceModal,
  setShowAttendanceModal,
  generatePayroll,
  approvePayroll,
  markAsPaid,
  loadPayrollData
}) => {
  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setShowAttendanceModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Clock className="w-4 h-4" />
          <span>Mark Attendance</span>
        </button>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Payroll</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payroll</p>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {totalPayroll.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.approved}</p>
            </div>
            <Check className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{statusCounts.draft}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
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
            
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Basic Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading payroll data...
                  </td>
                </tr>
              ) : payrollRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No payroll records found for {selectedMonth}
                  </td>
                </tr>
              ) : (
                payrollRecords.map((record) => {
                  const employee = employees.find(emp => emp.userId === record.userId);
                  if (!employee) return null;
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {employee.employeeId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.department}</div>
                        <div className="text-sm text-gray-500 capitalize">{employee.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Rs. {record.basicSalary.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.presentDays} / {record.workingDays} days
                        </div>
                        <div className="text-xs text-gray-500">
                          {((record.presentDays / record.workingDays) * 100).toFixed(1)}% attendance
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          Rs. {record.totalSalary.toLocaleString()}
                        </div>
                        {record.overtime > 0 && (
                          <div className="text-xs text-green-600">
                            +Rs. {record.overtime.toLocaleString()} overtime
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {record.status === 'draft' && (
                            <button
                              onClick={() => record.id && approvePayroll(record.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          {record.status === 'approved' && (
                            <button
                              onClick={() => record.id && markAsPaid(record.id)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Mark as Paid"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Payroll Modal */}
      {showGenerateModal && (
        <GeneratePayrollModal
          selectedMonth={selectedMonth}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={generatePayroll}
          loading={loading}
        />
      )}

      {/* Employee Attendance Modal */}
      {showAttendanceModal && (
        <EmployeeAttendanceModal
          employees={employees}
          onClose={() => setShowAttendanceModal(false)}
          onSuccess={() => {
            setShowAttendanceModal(false);
            loadPayrollData();
          }}
        />
      )}
    </div>
  );
};

// Employee Attendance Tab Component
const EmployeeAttendanceTab: React.FC<{
  employees: EmployeePayrollInfo[];
}> = ({ employees }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Employee Attendance Management
        </h3>
        <p className="text-gray-600 mb-6">
          Mark daily attendance for staff and lecturers to calculate accurate payroll.
        </p>
        
        <EmployeeAttendanceForm 
          employees={employees} 
          onSuccess={() => {
            // Refresh data or show success message
          }}
        />
      </div>
    </div>
  );
};

// Generate Payroll Modal Component
const GeneratePayrollModal: React.FC<{
  selectedMonth: string;
  onClose: () => void;
  onGenerate: () => void;
  loading: boolean;
}> = ({ selectedMonth, onClose, onGenerate, loading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Generate Payroll for {selectedMonth}
        </h3>
        <p className="text-gray-600 mb-6">
          This will generate payroll for all active employees based on their attendance records. 
          Existing payroll records for this month will be updated.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Employee Attendance Modal Component
const EmployeeAttendanceModal: React.FC<{
  employees: EmployeePayrollInfo[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ employees, onClose, onSuccess }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Employee Attendance
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <EmployeeAttendanceForm 
          employees={employees} 
          onSuccess={onSuccess}
        />
      </div>
    </div>
  );
};

// Employee Attendance Form Component
const EmployeeAttendanceForm: React.FC<{
  employees: EmployeePayrollInfo[];
  onSuccess: () => void;
}> = ({ employees, onSuccess }) => {
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('17:00');
  const [status, setStatus] = useState<'present' | 'absent' | 'late' | 'half-day'>('present');
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      await PayrollService.markEmployeeAttendance({
        userId: selectedEmployee,
        date: attendanceDate,
        checkInTime,
        checkOutTime,
        status,
        overtimeHours,
        notes
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Error marking attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee
          </label>
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Select Employee</option>
            {employees.map((employee) => (
              <option key={employee.userId} value={employee.userId}>
                {employee.name} - {employee.employeeId}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check In Time
          </label>
          <input
            type="time"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check Out Time
          </label>
          <input
            type="time"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="half-day">Half Day</option>
            <option value="absent">Absent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Overtime Hours
          </label>
          <input
            type="number"
            min="0"
            max="12"
            step="0.5"
            value={overtimeHours}
            onChange={(e) => setOvertimeHours(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Marking...' : 'Mark Attendance'}
        </button>
      </div>
    </form>
  );
};

export default PayrollManagement;