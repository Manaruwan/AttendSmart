import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  writeBatch,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { PayrollRecord, AttendanceRecord, Staff, Lecturer } from '../types/firebaseTypes';

export interface PayrollCalculationData {
  userId: string;
  month: string; // YYYY-MM format
  basicSalary: number;
  workingDays: number;
  presentDays: number;
  overtimeHours: number;
  deductions: number;
  allowances: number;
}

export interface EmployeePayrollInfo {
  userId: string;
  employeeId: string;
  name: string;
  role: 'staff' | 'lecturer';
  department: string;
  basicSalary: number;
  hourlyRate: number;
  position?: string;
  subjects?: string[];
}

export class PayrollService {
  
  // Generate payroll for a specific month
  static async generateMonthlyPayroll(month: string): Promise<PayrollRecord[]> {
    try {
      console.log(`🚀 Starting payroll generation for ${month}...`);
      
      const employees = await this.getAllEmployees();
      console.log(`📋 Found ${employees.length} employees`);
      
      const payrollRecords: PayrollRecord[] = [];
      
      for (const employee of employees) {
        console.log(`💼 Processing employee: ${employee.name} (${employee.employeeId})`);
        
        const attendanceData = await this.getEmployeeAttendance(employee.userId, month);
        console.log(`📅 Found ${attendanceData.length} attendance records for ${employee.name}`);
        
        const payrollRecord = await this.calculatePayroll(employee, attendanceData, month);
        console.log(`💰 Calculated salary for ${employee.name}: Rs. ${payrollRecord.totalSalary}`);
        
        // Save to Firestore with detailed logging
        const payrollId = `${employee.userId}_${month}`;
        const payrollRef = doc(db, 'payroll', payrollId);
        
        console.log(`💾 Saving payroll record to Firebase: ${payrollId}`);
        await setDoc(payrollRef, payrollRecord, { merge: true });
        console.log(`✅ Successfully saved payroll record for ${employee.name}`);
        
        payrollRecords.push({ ...payrollRecord, id: payrollId });
      }
      
      console.log(`🎉 Payroll generation completed! Generated ${payrollRecords.length} records.`);
      return payrollRecords;
    } catch (error) {
      console.error('❌ Error generating monthly payroll:', error);
      throw error;
    }
  }

  // Get all employees (staff and lecturers)
  static async getAllEmployees(): Promise<EmployeePayrollInfo[]> {
    try {
      const employees: EmployeePayrollInfo[] = [];
      
      // Get Staff
      const staffQuery = query(
        collection(db, 'users'),
        where('role', '==', 'staff'),
        where('isActive', '==', true)
      );
      const staffSnapshot = await getDocs(staffQuery);
      
      staffSnapshot.forEach((doc) => {
        const staff = doc.data() as Staff;
        employees.push({
          userId: staff.id,
          employeeId: staff.employeeId,
          name: `${staff.firstName} ${staff.lastName}`,
          role: 'staff',
          department: staff.department,
          position: staff.position,
          basicSalary: this.getBasicSalary(staff),
          hourlyRate: this.getHourlyRate(staff)
        });
      });
      
      // Get Lecturers
      const lecturerQuery = query(
        collection(db, 'users'),
        where('role', '==', 'lecturer'),
        where('isActive', '==', true)
      );
      const lecturerSnapshot = await getDocs(lecturerQuery);
      
      lecturerSnapshot.forEach((doc) => {
        const lecturer = doc.data() as Lecturer;
        employees.push({
          userId: lecturer.id,
          employeeId: lecturer.employeeId,
          name: `${lecturer.firstName} ${lecturer.lastName}`,
          role: 'lecturer',
          department: lecturer.department,
          subjects: lecturer.subjects,
          basicSalary: this.getBasicSalary(lecturer),
          hourlyRate: this.getHourlyRate(lecturer)
        });
      });
      
      // Get salary configurations and update employee data
      const salaryConfigQuery = query(collection(db, 'salaryConfigurations'));
      const salaryConfigSnapshot = await getDocs(salaryConfigQuery);
      
      const salaryConfigs = new Map();
      salaryConfigSnapshot.forEach((doc) => {
        const config = doc.data();
        salaryConfigs.set(config.userId, config);
      });
      
      // Update employees with configured salaries
      employees.forEach(employee => {
        const config = salaryConfigs.get(employee.userId);
        if (config) {
          employee.basicSalary = config.basicSalary;
          employee.hourlyRate = config.hourlyRate;
        }
      });
      
      return employees;
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  }

  // Get employee attendance for a specific month
  static async getEmployeeAttendance(userId: string, month: string) {
    try {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      const attendanceQuery = query(
        collection(db, 'employeeAttendance'),
        where('userId', '==', userId),
        where('date', '>=', startDate.toISOString().split('T')[0]),
        where('date', '<=', endDate.toISOString().split('T')[0]),
        orderBy('date')
      );
      
      const snapshot = await getDocs(attendanceQuery);
      const attendanceRecords: any[] = [];
      
      snapshot.forEach((doc) => {
        attendanceRecords.push({ id: doc.id, ...doc.data() });
      });
      
      return attendanceRecords;
    } catch (error) {
      console.error('Error fetching employee attendance:', error);
      return [];
    }
  }

  // Calculate payroll for an employee
  static async calculatePayroll(
    employee: EmployeePayrollInfo, 
    attendanceRecords: any[], 
    month: string
  ): Promise<PayrollRecord> {
    const startDate = new Date(`${month}-01`);
    const workingDays = this.getWorkingDaysInMonth(startDate);
    
    const presentDays = attendanceRecords.filter(record => 
      record.status === 'present' || record.status === 'late'
    ).length;
    
    const overtimeHours = attendanceRecords.reduce((total, record) => 
      total + (record.overtimeHours || 0), 0
    );
    
    const leaveDays = workingDays - presentDays;
    
    // Calculate salary components
    const dailySalary = employee.basicSalary / workingDays;
    const salaryForPresentDays = dailySalary * presentDays;
    const overtimePay = overtimeHours * employee.hourlyRate * 1.5; // 1.5x for overtime
    
    // Calculate deductions
    const unpaidLeaveDays = Math.max(0, leaveDays - 2); // Allow 2 days paid leave
    const leaveDeduction = unpaidLeaveDays * dailySalary;
    const taxDeduction = this.calculateTax(salaryForPresentDays + overtimePay);
    const totalDeductions = leaveDeduction + taxDeduction;
    
    const totalSalary = salaryForPresentDays + overtimePay - totalDeductions;
    
    return {
      userId: employee.userId,
      month: month,
      basicSalary: employee.basicSalary,
      workingDays: workingDays,
      presentDays: presentDays,
      overtime: overtimePay,
      deductions: totalDeductions,
      totalSalary: Math.max(0, totalSalary),
      attendanceRecords: attendanceRecords.map(r => r.id),
      status: 'draft',
      generatedAt: serverTimestamp() as Timestamp
    };
  }

  // Mark employee attendance
  static async markEmployeeAttendance(data: {
    userId: string;
    date: string;
    checkInTime: string;
    checkOutTime?: string;
    status: 'present' | 'absent' | 'late' | 'half-day';
    overtimeHours?: number;
    notes?: string;
  }) {
    try {
      const attendanceId = `${data.userId}_${data.date}`;
      const attendanceRef = doc(db, 'employeeAttendance', attendanceId);
      
      await setDoc(attendanceRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return attendanceId;
    } catch (error) {
      console.error('Error marking employee attendance:', error);
      throw error;
    }
  }

  // Get payroll records for a month
  static async getMonthlyPayroll(month: string): Promise<PayrollRecord[]> {
    try {
      const payrollQuery = query(
        collection(db, 'payroll'),
        where('month', '==', month),
        orderBy('generatedAt', 'desc')
      );
      
      const snapshot = await getDocs(payrollQuery);
      const payrollRecords: PayrollRecord[] = [];
      
      snapshot.forEach((doc) => {
        payrollRecords.push({ id: doc.id, ...doc.data() } as PayrollRecord);
      });
      
      return payrollRecords;
    } catch (error) {
      console.error('Error fetching monthly payroll:', error);
      throw error;
    }
  }

  // Approve payroll record
  static async approvePayroll(payrollId: string, approvedBy: string): Promise<void> {
    try {
      const payrollRef = doc(db, 'payroll', payrollId);
      await updateDoc(payrollRef, {
        status: 'approved',
        approvedBy: approvedBy,
        approvedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error approving payroll:', error);
      throw error;
    }
  }

  // Mark payroll as paid
  static async markPayrollPaid(payrollId: string): Promise<void> {
    try {
      const payrollRef = doc(db, 'payroll', payrollId);
      await updateDoc(payrollRef, {
        status: 'paid',
        paidAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking payroll as paid:', error);
      throw error;
    }
  }

  // Helper methods
  private static getBasicSalary(employee: Staff | Lecturer): number {
    // Default salary based on role and position (fallback if no configuration exists)
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
  }

  private static getHourlyRate(employee: Staff | Lecturer): number {
    const basicSalary = this.getBasicSalary(employee);
    // Assuming 22 working days and 8 hours per day
    return basicSalary / (22 * 8);
  }

  private static getWorkingDaysInMonth(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    let workingDays = 0;
    for (let day = 1; day <= lastDay; day++) {
      const currentDay = new Date(year, month, day);
      const dayOfWeek = currentDay.getDay();
      // Count Monday to Friday as working days
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDays++;
      }
    }
    
    return workingDays;
  }

  private static calculateTax(grossSalary: number): number {
    // Simple tax calculation (10% for example)
    if (grossSalary > 100000) {
      return grossSalary * 0.1;
    } else if (grossSalary > 50000) {
      return grossSalary * 0.05;
    }
    return 0;
  }
}