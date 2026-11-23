import React, { useState, useEffect, useRef } from 'react';
import { configApi, apiUrl } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface FlashSaleCountdownProps {
  onExpireChange?: (expired: boolean) => void;
}

export const FlashSaleCountdown: React.FC<FlashSaleCountdownProps> = ({ onExpireChange }) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [flashSaleTargetDate, setFlashSaleTargetDate] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const serverOffsetRef = useRef<number>(0);

  // Sync server time offset for clock accuracy
  useEffect(() => {
    fetch(apiUrl('/api/time'))
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.serverTime === 'number') {
          serverOffsetRef.current = data.serverTime - Date.now();
        }
      })
      .catch(() => {});
  }, []);

  // Fetch admin-set flash sale target date from site config API
  useEffect(() => {
    let isMounted = true;
    configApi.getConfig()
      .then(config => {
        if (isMounted) {
          if (config?.flashSaleTargetDate) {
            setFlashSaleTargetDate(config.flashSaleTargetDate);
          } else {
            setFlashSaleTargetDate(null);
          }
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Listen to realtime config updates dispatched by admin
  useEffect(() => {
    const handleConfigUpdated = (e: any) => {
      const detail = e.detail;
      if (detail) {
        if (detail.flashSaleTargetDate) {
          setFlashSaleTargetDate(detail.flashSaleTargetDate);
        } else if (detail.flashSaleTargetDate === null || detail.flashSaleTargetDate === '') {
          setFlashSaleTargetDate(null);
        }
      }
    };

    window.addEventListener('configUpdated', handleConfigUpdated);
    return () => window.removeEventListener('configUpdated', handleConfigUpdated);
  }, []);

  // Countdown timer relying on server time
  useEffect(() => {
    if (!flashSaleTargetDate) {
      setTimeLeft(null);
      setIsExpired(false);
      onExpireChange?.(false);
      return;
    }

    const target = new Date(flashSaleTargetDate).getTime();
    if (isNaN(target)) {
      setTimeLeft(null);
      setIsExpired(false);
      onExpireChange?.(false);
      return;
    }

    const updateCountdown = () => {
      const currentServerTime = Date.now() + serverOffsetRef.current;
      const diff = target - currentServerTime;
      if (diff > 0) {
        const totalSecs = Math.floor(diff / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const seconds = totalSecs % 60;
        setTimeLeft({ hours, minutes, seconds });
        setIsExpired(false);
        onExpireChange?.(false);
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        onExpireChange?.(true);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [flashSaleTargetDate, onExpireChange]);

  return (
    <div>
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-xl font-bold text-gray-800 font-display">{t('Flash Sale', 'ফ্ল্যাশ সেল')}</h2>
        {/* Only show countdown when a genuine admin-set end time exists */}
        {flashSaleTargetDate && timeLeft && (
          isExpired ? (
            <div className="flex items-center gap-2 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20">
              <span className="text-rose-600 text-[9px] font-black uppercase tracking-wider font-mono">{t('Campaign Ended', 'মেয়াদ শেষ')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-brand-orange/5 px-2.5 py-1 rounded-xl">
              <span className="text-[#ff5c00] text-[9px] font-black uppercase tracking-wider font-mono">{t('Ending In:', 'শেষ হতে বাকি:')}</span>
              <div className="flex gap-1 font-mono">
                {[
                  String(timeLeft.hours).padStart(2, '0'),
                  String(timeLeft.minutes).padStart(2, '0'),
                  String(timeLeft.seconds).padStart(2, '0')
                ].map((num, i) => (
                  <span key={i} className="bg-brand-orange text-white px-2 py-0.5 rounded-lg font-black text-[11px] shadow-sm tracking-tight leading-none">
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )
        )}
      </div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 font-mono">
        {flashSaleTargetDate && isExpired
          ? t('Standard Pricing Restored', 'সাধারণ মূল্য প্রযোজ্য')
          : t('Limited Time Offers', 'সীমিত সময়ের অফার সমূহ')}
      </p>
    </div>
  );
};
