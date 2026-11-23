import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeLeft(savedTargetDate?: string, currentPrev?: TimeLeft): TimeLeft {
  if (savedTargetDate) {
    const target = new Date(savedTargetDate).getTime();
    const diff = target - Date.now();
    if (diff > 0) {
      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      return { hours, minutes, seconds, isExpired: false };
    } else {
      return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }
  }

  if (!currentPrev) {
    return { hours: 2, minutes: 45, seconds: 30, isExpired: false };
  }

  if (currentPrev.isExpired || (currentPrev.hours === 0 && currentPrev.minutes === 0 && currentPrev.seconds === 0)) {
    return { ...currentPrev, isExpired: true };
  }

  let { hours, minutes, seconds } = currentPrev;
  if (seconds > 0) seconds--;
  else {
    seconds = 59;
    if (minutes > 0) minutes--;
    else {
      minutes = 59;
      if (hours > 0) hours--;
    }
  }
  const isExp = hours === 0 && minutes === 0 && seconds === 0;
  return { hours, minutes, seconds, isExpired: isExp };
}

export const AdminLiveCountdownCard: React.FC<{ targetDate?: string }> = ({ targetDate }) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetDate));
    const timer = setInterval(() => {
      setTimeLeft(prev => calculateTimeLeft(targetDate, prev));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:border-blue-500/30 transition-all flex flex-col justify-between group shadow-sm"
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Time Remaining', 'অবশিষ্ট সময়')}</span>
          <span className={`w-2 h-2 rounded-full ${timeLeft.isExpired ? 'bg-rose-500' : 'bg-emerald-400'}`} />
        </div>
        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 group-hover:bg-blue-500/20 transition-colors">
          <Clock size={18} />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <p className="text-3xl font-black text-white font-mono tracking-tight">
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </p>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${timeLeft.isExpired ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
          {timeLeft.isExpired ? t('Expired', 'মেয়াদ শেষ') : t('Storefront Live', 'স্টোরফ্রন্ট লাইভ')}
        </span>
      </div>
    </motion.div>
  );
};

export const AdminLivePreviewBadge: React.FC<{ targetDate?: string }> = ({ targetDate }) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetDate));
    const timer = setInterval(() => {
      setTimeLeft(prev => calculateTimeLeft(targetDate, prev));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3 w-fit">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Live Preview:', 'লাইভ প্রিভিউ:')}</span>
      <div className="flex items-center gap-1 font-mono font-black text-xs text-brand-orange bg-brand-orange/10 px-2.5 py-1 rounded-xl border border-brand-orange/20">
        <span className="bg-brand-orange text-white px-1.5 py-0.5 rounded text-[11px]">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-brand-orange text-white px-1.5 py-0.5 rounded text-[11px]">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span>:</span>
        <span className="bg-brand-orange text-white px-1.5 py-0.5 rounded text-[11px]">{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
};

