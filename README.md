# AttendSmart - Smart Campus Management System

A modern, AI-powered campus management system with intelligent attendance tracking, built with React, TypeScript, Firebase, and Face-API.js.

## 🚀 Features

- **Face Recognition Attendance**: Automated attendance marking using facial recognition
- **Real-time Dashboard**: Live attendance monitoring and analytics
- **Location Verification**: GPS-based location verification for attendance
- **Multi-role Support**: Admin, Lecturer, Staff, and Student roles
- **Class Management**: Create and manage classes, schedules, and batches
- **Attendance Reports**: Comprehensive reporting and analytics
- **Firebase Integration**: Secure cloud-based data storage and authentication

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Face Recognition**: Face-API.js
- **State Management**: React Hooks
- **Routing**: React Router v7

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartattend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Download Face-API.js models**
   ```bash
   node scripts/download-models.js
   ```

4. **Set up Firebase** (see [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md))

5. **Create Admin Account**
   ```bash
   npm run create-admin
   ```

## 👨‍💼 Admin Account Setup

### Default Admin Credentials
- **Email**: `admin@smartattend.com`
- **Password**: `Admin@123`
- **Role**: `admin`

### Setup Methods

#### Method 1: Using npm script (Recommended)
```bash
npm run create-admin
```

#### Method 2: Using the web interface
1. Navigate to `/admin-setup.html`
2. Click "Create Admin Account"
3. The account will be created automatically

#### Method 3: Manual script execution
```bash
node scripts/create-admin.js
```

### Admin Permissions
The default admin account has the following permissions:
- `user_management` - Create, edit, delete users
- `class_management` - Manage classes and schedules
- `attendance_management` - View and manage attendance records
- `report_generation` - Generate and export reports
- `system_settings` - Configure system settings
- `database_access` - Full database access

## 🔐 Authentication

### Login Options
1. **Firebase Login**: `/firebase-login` - Standard email/password login
2. **Admin Login**: `/admin-login` - Dedicated admin interface
3. **Google Login**: Available through Firebase Auth

### User Roles
- **Admin**: Full system access and management
- **Lecturer**: Class management and attendance viewing
- **Staff**: Limited administrative functions
- **Student**: Attendance marking and viewing own records

## 🎯 Getting Started

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Create admin account** (if not already done)
   ```bash
   npm run create-admin
   ```

3. **Access the application**
   - Open `http://localhost:5173`
   - Go to `/firebase-login`
   - Login with admin credentials

4. **Initial Setup**
   - Configure system settings
   - Add users (lecturers, staff, students)
   - Create classes and schedules
   - Set up attendance locations

## 📱 Usage

### For Administrators
1. Login with admin credentials
2. Access the admin dashboard at `/dashboard`
3. Manage users, classes, and attendance
4. Generate reports and analytics

### For Students
1. Register or get credentials from admin
2. Login to the system
3. Use face recognition for attendance
4. View attendance history

### For Lecturers/Staff
1. Login with provided credentials
2. Access assigned classes
3. Monitor student attendance
4. Generate class reports

## 🔧 Configuration

### Firebase Setup
See [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md) for detailed Firebase configuration instructions.

### Face-API.js Setup
See [FACE_API_GUIDE.md](./FACE_API_GUIDE.md) for face recognition configuration.

## 📊 Testing

### Test Pages Available
- `/test.html` - General system testing
- `/test-firebase` - Firebase connection testing
- Component-specific test pages

### Running Tests
```bash
npm run test  # When test framework is added
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run create-admin` - Create default admin account
- `npm run setup-admin` - Alias for create-admin

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
1. Check the documentation files in the project
2. Review the test pages for debugging
3. Check Firebase console for backend issues
4. Review browser console for frontend errors

## 📚 Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP_GUIDE.md)
- [Face-API.js Guide](./FACE_API_GUIDE.md)
- [Admin Setup Instructions](#admin-account-setup)

---

**Happy Attending! 🎓**