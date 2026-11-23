import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CATEGORY_LABELS_BN } from '../constants/categories';

export type Language = 'en' | 'bn';

const STORAGE_KEY = 'elora-lang';

const CATEGORY_MAP: Record<string, string> = CATEGORY_LABELS_BN;

interface LanguageContextValue {
  language: Language;
  isBangla: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (en: string, bn: string) => string;
  translateCategory: (category: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const readInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'bn' || saved === 'en') return saved;
  } catch {
    // Ignore storage errors
  }
  return 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      if (language === 'bn') {
        document.documentElement.classList.add('lang-bn');
      } else {
        document.documentElement.classList.remove('lang-bn');
      }
    }
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'en' ? 'bn' : 'en'));
  }, []);

  const t = useCallback(
    (en: string, bn: string) => (language === 'bn' ? bn : en),
    [language]
  );

  const translateCategory = useCallback(
    (category: string) => {
      if (language === 'en') return category;
      return CATEGORY_MAP[category] || category;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        isBangla: language === 'bn',
        setLanguage,
        toggleLanguage,
        t,
        translateCategory,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
