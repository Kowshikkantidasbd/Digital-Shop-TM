import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  isFirebaseConfigured,
  onAuthStateChanged,
  FirebaseUser
} from '../lib/firebase';

interface FirebaseContextValue {
  firebaseUser: FirebaseUser | null;
  authReady: boolean;
  isConfigured: boolean;
  auth: typeof auth;
  db: typeof db;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  firebaseUser: null,
  authReady: false,
  isConfigured: isFirebaseConfigured,
  auth,
  db
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(!isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        authReady,
        isConfigured: isFirebaseConfigured,
        auth,
        db
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
