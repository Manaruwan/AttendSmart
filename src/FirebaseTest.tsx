import React, { useEffect, useState } from 'react';
import { db } from './config/firebase';
import { collection, getDocs } from 'firebase/firestore';

const FirebaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testFirebaseConnection = async () => {
      try {
        console.log('🔍 Testing Firebase connection...');
        
        // Try to access a simple collection
        const testCollection = collection(db, 'test');
        const snapshot = await getDocs(testCollection);
        
        setConnectionStatus('✅ Firebase connection successful!');
        console.log('✅ Firebase connection successful!');
        console.log(`📊 Test collection size: ${snapshot.size}`);
        
      } catch (error: any) {
        console.error('❌ Firebase connection failed:', error);
        setError(error.message);
        setConnectionStatus('❌ Firebase connection failed');
        
        if (error.code === 'permission-denied') {
          setError('🔒 Firestore security rules deny access');
        } else if (error.code === 'unavailable') {
          setError('🌐 Network connectivity issue');
        } else if (error.code === 'invalid-argument') {
          setError('⚙️ Invalid Firebase configuration');
        }
      }
    };

    testFirebaseConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Firebase Connection Test</h2>
      <div>
        <strong>Status:</strong> {connectionStatus}
      </div>
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Check browser console for detailed logs
      </div>
    </div>
  );
};

export default FirebaseTest;