import React, { useState } from 'react';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';

export const FirebaseConfigSetup: React.FC = () => {
  const [config, setConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, you'd validate and save this to environment variables
    console.log('Firebase Config:', config);
    localStorage.setItem('firebaseConfig', JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const configFields = [
    { key: 'apiKey', label: 'API Key', required: true },
    { key: 'authDomain', label: 'Auth Domain', required: true },
    { key: 'projectId', label: 'Project ID', required: true },
    { key: 'storageBucket', label: 'Storage Bucket', required: true },
    { key: 'messagingSenderId', label: 'Messaging Sender ID', required: true },
    { key: 'appId', label: 'App ID', required: true },
    { key: 'measurementId', label: 'Measurement ID (Optional)', required: false }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Firebase Configuration</h1>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Setup Instructions</h3>
              <div className="text-sm text-blue-700 mt-1">
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to <a href="https://console.firebase.google.com" className="underline" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
                  <li>Create a new project or select existing one</li>
                  <li>Go to Project Settings → General → Your apps</li>
                  <li>Add a new Web app or select existing one</li>
                  <li>Copy the configuration values and paste them below</li>
                  <li>Enable Authentication, Firestore, and Storage in Firebase Console</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {configFields.map(field => (
            <div key={field.key}>
              <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 mb-2">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                id={field.key}
                type="text"
                value={config[field.key as keyof typeof config]}
                onChange={(e) => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder={`Enter your ${field.label.toLowerCase()}`}
                required={field.required}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <p>After saving, update <code className="bg-gray-100 px-2 py-1 rounded">src/config/firebase.ts</code> with these values.</p>
          </div>
          
          <button
            onClick={handleSave}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {saved ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Configuration
              </>
            )}
          </button>
        </div>

        {/* Example Configuration */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Example Configuration Object:</h3>
          <pre className="text-xs text-gray-600 overflow-x-auto">
{`const firebaseConfig = {
  apiKey: "AIzaSyB...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};`}
          </pre>
        </div>

        {/* Next Steps */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-sm font-medium text-green-800 mb-2">Next Steps:</h3>
          <div className="text-sm text-green-700 space-y-1">
            <p>1. ✅ Enable Authentication (Email/Password & Google Sign-In)</p>
            <p>2. ✅ Create Firestore Database (Start in test mode)</p>
            <p>3. ✅ Enable Storage (Start in test mode)</p>
            <p>4. ✅ Set up Security Rules for production</p>
            <p>5. ✅ Enable Cloud Messaging (Optional)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
