import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'pill' | 'compact' | 'dark' | 'drawer' | 'segmented';
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { language, isBangla, setLanguage, toggleLanguage, t } = useLanguage();

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-xl bg-gray-100 border border-gray-200 shadow-inner shrink-0 ${className}`}
        role="group"
        aria-label={t('Select language', 'ভাষা নির্বাচন করুন')}
      >
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-white text-brand-orange shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage('bn')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide transition-all cursor-pointer ${
            language === 'bn'
              ? 'bg-brand-orange text-white shadow-xs'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          বাং
        </button>
      </div>
    );
  }

  if (variant === 'dark') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        title={t('Switch to বাংলা', 'Switch to English')}
        aria-label={t('Switch language to Bangla', 'ইংরেজি ভাষায় পরিবর্তন করুন')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[11px] font-black transition-all cursor-pointer shrink-0 active:scale-95 ${className}`}
      >
        <Globe size={13} className="text-brand-orange shrink-0" />
        <span>{isBangla ? 'EN' : 'বাংলা'}</span>
      </button>
    );
  }

  if (variant === 'drawer') {
    return (
      <div
        className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-orange-50/70 border border-orange-100 ${className}`}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
          <Globe size={15} className="text-brand-orange shrink-0" />
          <span>{t('Language', 'ভাষা')}</span>
        </div>
        <div className="flex items-center p-0.5 rounded-lg bg-white border border-orange-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-brand-orange text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('bn')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all cursor-pointer ${
              language === 'bn'
                ? 'bg-brand-orange text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            বাংলা
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        title={t('Switch to বাংলা', 'Switch to English')}
        aria-label={t('Switch language to Bangla', 'ইংরেজি ভাষায় পরিবর্তন করুন')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 hover:bg-orange-50 text-gray-800 hover:text-brand-orange border border-gray-200 hover:border-brand-orange/40 shadow-xs text-xs font-black transition-all cursor-pointer shrink-0 active:scale-95 ${className}`}
      >
        <Globe size={14} className="text-brand-orange shrink-0" />
        <span>{isBangla ? 'English' : 'বাংলা'}</span>
      </button>
    );
  }

  // 'compact' (default) - ultra compact for mobile, tablet & desktop header bars
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={t('Switch to বাংলা', 'Switch to English')}
      aria-label={t('Switch language to Bangla', 'ইংরেজি ভাষায় পরিবর্তন করুন')}
      className={`inline-flex items-center gap-1 px-2.5 h-9 rounded-xl bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-brand-orange border border-gray-200/90 hover:border-brand-orange/40 text-[11px] font-black tracking-tight transition-colors duration-200 cursor-pointer shrink-0 shadow-2xs ${className}`}
    >
      <Globe size={13} className="text-brand-orange shrink-0" />
      <span>{isBangla ? 'EN' : 'বাং'}</span>
    </button>
  );
};
