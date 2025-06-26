import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // For production, you would use a service account key
  // For development, we'll use the project ID only (limited functionality)
};

// Initialize Firebase Admin app if it hasn't been initialized already
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseAdminConfig);
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);

// Helper function to verify Firebase ID token
export async function verifyAuthToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    throw error;
  }
}