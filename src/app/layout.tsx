import React from 'react';
import { LanguageProvider } from '../contexts/LanguageContext';
import { FirebaseProvider } from '../contexts/FirebaseContext';
import { ToastProvider } from '../components/Toast';

export interface RootLayoutProps {
  children: React.ReactNode;
}

export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <FirebaseProvider>
      <LanguageProvider>
        <ToastProvider>{children}</ToastProvider>
      </LanguageProvider>
    </FirebaseProvider>
  );
};

export default RootLayout;
