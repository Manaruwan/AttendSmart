import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import { BaseUser } from '../types/firebaseTypes';

export class AuthService {
  // Register new user
  static async register(
    email: string, 
    password: string, 
    userData: Omit<BaseUser, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<BaseUser> {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile
      await updateProfile(firebaseUser, {
        displayName: `${userData.firstName} ${userData.lastName}`,
        photoURL: userData.profileImage
      });

      // Create user document in Firestore
      const user: BaseUser = {
        id: firebaseUser.uid,
        ...userData,
        email: firebaseUser.email!,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), user);
      
      return user;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Login with email/password
  static async login(email: string, password: string): Promise<BaseUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      return userDoc.data() as BaseUser;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  // Login with Google
  static async loginWithGoogle(): Promise<BaseUser> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        return userDoc.data() as BaseUser;
      } else {
        // Create new user profile (default as student)
        const newUser: BaseUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          role: 'student',
          firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
          profileImage: firebaseUser.photoURL || undefined,
          isActive: true,
          createdAt: serverTimestamp() as Timestamp,
          updatedAt: serverTimestamp() as Timestamp,
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
        return newUser;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Google login failed');
    }
  }

  // Logout
  static async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: BaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            callback(userDoc.data() as BaseUser);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // Get current user
  static async getCurrentUser(): Promise<BaseUser | null> {
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) return null;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      return userDoc.exists() ? userDoc.data() as BaseUser : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Update user profile
  static async updateUserProfile(
    userId: string, 
    updates: Partial<BaseUser>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', userId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.message || 'Profile update failed');
    }
  }

  // Get users by role
  static async getUsersByRole(role: BaseUser['role']): Promise<BaseUser[]> {
    try {
      const q = query(collection(db, 'users'), where('role', '==', role));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BaseUser));
    } catch (error: any) {
      console.error('Error fetching users by role:', error);
      throw new Error(error.message || 'Failed to fetch users');
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<BaseUser | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? userDoc.data() as BaseUser : null;
    } catch (error: any) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  // Delete user
  static async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (error: any) {
      console.error('User deletion error:', error);
      throw new Error(error.message || 'User deletion failed');
    }
  }

  // Check if user has permission
  static hasPermission(user: BaseUser, requiredRole: BaseUser['role'][]): boolean {
    return requiredRole.includes(user.role);
  }

  // Check if user is admin
  static isAdmin(user: BaseUser): boolean {
    return user.role === 'admin';
  }

  // Check if user is lecturer
  static isLecturer(user: BaseUser): boolean {
    return user.role === 'lecturer';
  }

  // Check if user is student
  static isStudent(user: BaseUser): boolean {
    return user.role === 'student';
  }

  // Check if user is staff
  static isStaff(user: BaseUser): boolean {
    return user.role === 'staff';
  }
}
