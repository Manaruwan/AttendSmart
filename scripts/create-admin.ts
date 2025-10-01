// Admin Account Creation TypeScript Script
// Run this script to create the default admin account for SmartAttend

import { AuthService } from '../src/services/authService';
import { Admin } from '../src/types/firebaseTypes';

// Admin credentials
const ADMIN_EMAIL = 'admin@smartattend.com';
const ADMIN_PASSWORD = 'Admin@123';

async function createAdminAccount(): Promise<void> {
  try {
    console.log('🚀 Creating admin account...');
    
    // Create admin user data
    const adminData: Omit<Admin, 'id' | 'createdAt' | 'updatedAt'> = {
      email: ADMIN_EMAIL,
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

    // Create the admin account using AuthService
    const adminUser = await AuthService.register(
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
      adminData
    ) as Admin;
    
    console.log('✅ Admin account created successfully!');
    console.log('👤 User ID:', adminUser.id);
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('🎯 Role:', adminUser.role);
    console.log('🏢 Department:', adminUser.department || 'N/A');
    console.log('🔐 Permissions:', adminData.permissions.join(', '));
    console.log('');
    console.log('🎉 You can now login to the SmartAttend system using these credentials!');
    console.log('🌐 Go to: /firebase-login or /admin-login');
    
  } catch (error: any) {
    if (error.message.includes('email-already-in-use')) {
      console.log('ℹ️  Admin account already exists!');
      console.log('📧 Email:', ADMIN_EMAIL);
      console.log('🔑 Password:', ADMIN_PASSWORD);
      console.log('');
      console.log('✅ You can login with the existing credentials.');
    } else {
      console.error('❌ Error creating admin account:', error.message);
      throw error;
    }
  }
}

// Export for use in other modules
export { createAdminAccount, ADMIN_EMAIL, ADMIN_PASSWORD };

// Run the script if called directly
if (require.main === module) {
  createAdminAccount()
    .then(() => {
      console.log('🏁 Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}