import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../config/firebaseConfig';

export const isFirebaseConfigured = Boolean(
  firebaseConfig?.apiKey &&
    firebaseConfig?.projectId &&
    firebaseConfig.projectId !== 'remixed-project-id'
);

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/* CRITICAL: Always pass firebaseConfig.firestoreDatabaseId so the app targets the provisioned database */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email
        })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  if (!isFirebaseConfigured) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

const VALID_ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;

/**
 * Synchronizes the verified Google user's profile to Firestore `/users/{uid}`
 * strictly honoring firebase-blueprint.json maxLength and pattern bounds.
 */
export async function syncFirebaseUserProfile(fbUser: FirebaseUser): Promise<void> {
  if (!isFirebaseConfigured || !fbUser?.uid || !fbUser.email || !fbUser.emailVerified) {
    return;
  }

  const uid = fbUser.uid.trim().slice(0, 128);
  if (!VALID_ID_PATTERN.test(uid)) return;

  const email = fbUser.email.trim().slice(0, 254);
  if (email.length < 3) return;

  const rawName = (fbUser.displayName || email.split('@')[0] || 'Member').trim();
  const name = rawName.slice(0, 120) || 'Member';
  const avatar = String(fbUser.photoURL || '').trim().slice(0, 1024);

  const docPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  let snap;
  try {
    snap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }

  if (snap.exists()) {
    try {
      await updateDoc(userRef, {
        name,
        avatar,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  } else {
    try {
      await setDoc(userRef, {
        uid,
        name,
        email,
        avatar,
        provider: 'google',
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  }
}

export async function signInWithFirebaseGoogle(): Promise<{
  firebaseUser: FirebaseUser;
  idToken: string;
}> {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase Google Sign-In is not configured.');
  }

  const result = await signInWithPopup(auth, googleProvider);
  const firebaseUser = result.user;
  const idToken = await firebaseUser.getIdToken(true);

  // Sync verified Google profile to Firestore (non-blocking if offline, structured error on permission failure)
  try {
    await syncFirebaseUserProfile(firebaseUser);
  } catch (err) {
    console.warn('Firestore profile sync warning:', err);
  }

  return { firebaseUser, idToken };
}

export async function signOutFirebase(): Promise<void> {
  if (!isFirebaseConfigured) return;
  try {
    await firebaseSignOut(auth);
  } catch (err) {
    console.warn('Firebase sign-out notice:', err);
  }
}

export { onAuthStateChanged };
export type { FirebaseUser };
