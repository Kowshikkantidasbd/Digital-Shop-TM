import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface CircularLoaderProps {
  label?: string;
  overlay?: boolean;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CircularLoader: React.FC<CircularLoaderProps> = ({
  label,
  overlay = false,
  fullScreen = false,
  size = 'md'
}) => {
  const { t } = useLanguage();
  const displayLabel = label ?? t('Loading...', 'লোড হচ্ছে...');

  const ringClass =
    size === 'sm'
      ? 'w-9 h-9 border-[3px]'
      : size === 'lg'
      ? 'w-14 h-14 border-[4px]'
      : 'w-12 h-12 border-[3.5px]';

  const innerInset = size === 'sm' ? 'inset-1.5 border-2' : 'inset-2 border-[2.5px]';

  const spinnerNode = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center">
        {/* Outer rotating circular ring */}
        <div
          className={`${ringClass} rounded-full border-orange-100 border-t-brand-orange border-r-brand-orange/65 animate-spin`}
        />
        {/* Inner counter-rotating accent circle */}
        <div
          style={{ animationDirection: 'reverse', animationDuration: '900ms' }}
          className={`absolute ${innerInset} rounded-full border-transparent border-b-amber-500 border-l-orange-300/70 animate-spin`}
        />
      </div>
      {displayLabel && (
        <span className="text-[11px] font-bold text-gray-600 tracking-wide">
          {displayLabel}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.14 }}
        className="fixed inset-0 z-[1200] bg-white/75 backdrop-blur-xs flex items-center justify-center pointer-events-none"
        aria-live="polite"
        aria-label={displayLabel}
      >
        <div className="bg-white/95 px-6 py-5 rounded-3xl shadow-xl border border-orange-100/80">
          {spinnerNode}
        </div>
      </motion.div>
    );
  }

  return (
    <div
      className={`${
        fullScreen ? 'min-h-screen bg-gray-50/80' : 'min-h-[55vh]'
      } flex flex-col items-center justify-center p-6`}
      aria-live="polite"
      aria-label={displayLabel}
    >
      {spinnerNode}
    </div>
  );
};
