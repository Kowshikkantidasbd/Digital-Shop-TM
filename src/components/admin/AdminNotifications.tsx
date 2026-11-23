import React, { useState } from 'react';
import { 
  Bell, CheckCheck, Trash2, ShoppingBag, 
  AlertTriangle, UserPlus, ShieldAlert, Sparkles, MessageSquare, 
  Search, CheckCircle2
} from 'lucide-react';
import { Notification } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface AdminNotificationsProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onNavigateAction: (view: string, targetId?: string) => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  onNavigateAction
}) => {
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmClear, setConfirmClear] = useState(false);

  const viewNameMap: Record<string, string> = {
    orders: t('Orders', 'অর্ডার'),
    products: t('Products', 'পণ্য'),
    sellers: t('Sellers', 'বিক্রেতা'),
    reviews: t('Reviews', 'রিভিউ'),
    users: t('Users', 'ব্যবহারকারী'),
    overview: t('Overview', 'ওভারভিউ'),
    coupons: t('Coupons', 'কুপন'),
    settings: t('Settings', 'সেটিংস')
  };

  const filtered = notifications.filter(n => {
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag size={16} className="text-blue-400" />;
      case 'inventory':
        return <AlertTriangle size={16} className="text-rose-400" />;
      case 'customer':
        return <UserPlus size={16} className="text-emerald-400" />;
      case 'merchant':
        return <ShieldAlert size={16} className="text-purple-400" />;
      case 'review':
        return <MessageSquare size={16} className="text-amber-400" />;
      default:
        return <Sparkles size={16} className="text-brand-orange" />;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/40 p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl text-brand-orange relative">
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-orange text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('System Notifications & Alerts', 'সিস্টেম বিজ্ঞপ্তি ও সতর্কতা')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{t('Live store event alerts, checkout updates, inventory thresholds, and merchant operations', 'লাইভ স্টোর ইভেন্ট সতর্কতা, চেকআউট আপডেট, স্টক সীমা এবং মার্চেন্ট কার্যক্রম')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCheck size={14} className="text-emerald-400" />
              <span>{t('Mark All as Read', 'সব পঠিত হিসেবে চিহ্নিত করুন')}</span>
            </button>
          )}

          {notifications.length > 0 && !confirmClear && (
            <button
              onClick={() => setConfirmClear(true)}
              className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>{t('Clear History', 'ইতিহাস মুছুন')}</span>
            </button>
          )}

          {notifications.length > 0 && confirmClear && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded-xl p-1">
              <button
                onClick={() => {
                  onClearNotifications();
                  setConfirmClear(false);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {t('Confirm Clear', 'নিশ্চিত মুছুন')}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                {t('Cancel', 'বাতিল')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex overflow-x-auto gap-1 p-1 bg-black/20 rounded-xl border border-white/5 w-full md:w-auto admin-scrollbar pb-1">
          {[
            { id: 'all', label: `${t('All', 'সব')} (${notifications.length})` },
            { id: 'order', label: t('Orders', 'অর্ডার') },
            { id: 'inventory', label: t('Low Stock', 'কম স্টক') },
            { id: 'merchant', label: t('Merchants', 'মার্চেন্ট') },
            { id: 'review', label: t('Reviews', 'রিভিউ') },
            { id: 'customer', label: t('Customers', 'গ্রাহক') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterType === tab.id ? 'bg-brand-orange text-white shadow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('Search notification alerts...', 'বিজ্ঞপ্তি খুঁজুন...')}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-brand-orange"
          />
        </div>
      </div>

      {/* Notification Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-zinc-950/40 border border-white/10 rounded-3xl">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-gray-500 flex items-center justify-center mx-auto mb-3">
              <Bell size={20} />
            </div>
            <p className="text-sm font-bold text-white mb-1">{t('No Notifications', 'কোনো বিজ্ঞপ্তি নেই')}</p>
            <p className="text-xs text-gray-400">{t('You are all caught up! No recent alerts found.', 'সব দেখা হয়ে গেছে! সাম্প্রতিক কোনো সতর্কতা পাওয়া যায়নি।')}</p>
          </div>
        ) : (
          filtered.map(notif => {
            const timeAgo = (() => {
              const diffMs = Date.now() - new Date(notif.createdAt).getTime();
              const mins = Math.floor(diffMs / 60000);
              if (mins < 1) return t('Just now', 'এইমাত্র');
              if (mins < 60) return t(`${mins}m ago`, `${mins} মি. আগে`);
              const hours = Math.floor(mins / 60);
              if (hours < 24) return t(`${hours}h ago`, `${hours} ঘ. আগে`);
              const days = Math.floor(hours / 24);
              return t(`${days}d ago`, `${days} দিন আগে`);
            })();

            return (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) onMarkAsRead(notif.id);
                  if (notif.actionView) onNavigateAction(notif.actionView);
                }}
                className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  notif.read 
                    ? 'bg-zinc-950/20 border-white/5 hover:border-white/15 opacity-80 hover:opacity-100' 
                    : 'bg-[#181822] border-brand-orange/30 hover:border-brand-orange shadow-lg shadow-orange-500/5'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${
                    notif.read ? 'bg-white/5 border-white/10' : 'bg-brand-orange/10 border-brand-orange/20'
                  }`}>
                    {getTypeIcon(notif.type)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-brand-orange" />
                      )}
                      <span className="text-[10px] text-gray-500 font-mono">
                        &bull; {timeAgo}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">
                      {notif.message}
                    </p>

                    {notif.actionView && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-orange hover:underline">
                          {t(`View details in ${viewNameMap[notif.actionView] || notif.actionView}`, `${viewNameMap[notif.actionView] || notif.actionView} বিভাগে বিস্তারিত দেখুন`)} &rarr;
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {!notif.read && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(notif.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      title={t('Mark as read', 'পঠিত হিসেবে চিহ্নিত করুন')}
                    >
                      <CheckCircle2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

