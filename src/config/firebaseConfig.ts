import bundledConfig from './firebase-applet-config.json';

const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;

export interface FirebaseWebConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
}

export const firebaseConfig: FirebaseWebConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || bundledConfig.projectId,
  appId: env.VITE_FIREBASE_APP_ID || bundledConfig.appId,
  apiKey: env.VITE_FIREBASE_API_KEY || bundledConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || bundledConfig.authDomain,
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || bundledConfig.firestoreDatabaseId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || bundledConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || bundledConfig.messagingSenderId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || bundledConfig.measurementId || ''
};

export default firebaseConfig;
