# Vercel Deployment Instructions

## Environment Variables
When deploying to Vercel, you may want to use environment variables for Firebase configuration for better security.

### Optional: Using Environment Variables
If you want to use environment variables instead of hardcoded values, create these in your Vercel dashboard:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

Then update your firebase.ts file to use:
```typescript
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB36Ak1zysY2wH7VfQDQOIOjQMNOft5dU0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "smartattend-9cbc2.firebaseapp.com",
  // ... etc
};
```

## Deployment Steps
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Vercel will automatically build and deploy
4. Add environment variables in Vercel dashboard if using them