import React, { useState } from 'react';
import { Activity, Database, Server, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Order, User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface AdminHealthWidgetProps {
  products: Product[];
  orders: Order[];
  users: User[];
}

export const AdminHealthWidget: React.FC<AdminHealthWidgetProps> = ({
  products,
  orders,
  users
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const productCount = products?.length || 0;
  const orderCount = orders?.length || 0;
  const userCount = users?.length || 0;
  const totalRecords = productCount + orderCount + userCount;

  // Approximate database payload size estimation
  const estimatedStorageKb = Math.max(12, Math.round(productCount * 1.8 + orderCount * 2.2 + userCount * 1.2));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-gray-300 transition-all cursor-pointer group shadow-2xs"
        title={t('View System Health & Database Telemetry', 'সিস্টেমের অবস্থা এবং ডেটাবেস তথ্য দেখুন')}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Database size={13} className="text-brand-orange group-hover:rotate-12 transition-transform" />
        <span className="text-[11px] text-gray-300 font-bold">{totalRecords} {t('Records', 'রেকর্ড')}</span>
        <span className="text-[10px] text-gray-500 hidden sm:inline">({estimatedStorageKb} KB)</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 bg-[#12121a] border border-white/15 rounded-3xl p-5 shadow-2xl z-50 text-left space-y-4 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">{t('System Health & Status', 'সিস্টেমের অবস্থা ও তথ্য')}</h4>
                    <p className="text-[10px] text-gray-400 font-mono">{t('Status: Healthy (Better Auth + Server API)', 'অবস্থা: স্বাভাবিক (বেটার অথ + সার্ভার API)')}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t('Total Database Records', 'মোট ডেটাবেস রেকর্ড')}</span>
                  <span className="text-lg font-mono font-black text-white mt-0.5 block">{totalRecords.toLocaleString()}</span>
                  <span className="text-[9px] text-gray-500">{t('Live indexed docs', 'লাইভ ডকুমেন্ট')}</span>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">{t('Estimated Data Size', 'আনুমানিক ডেটা আকার')}</span>
                  <span className="text-lg font-mono font-black text-brand-orange mt-0.5 block">{estimatedStorageKb} KB</span>
                  <span className="text-[9px] text-gray-500">{t('Database payload', 'ডাটাবেস পেলোড')}</span>
                </div>
              </div>

              {/* Collections breakdown */}
              <div className="space-y-2 bg-black/30 p-3 rounded-2xl border border-white/5 font-mono text-[11px]">
                <div className="flex justify-between text-gray-300">
                  <span className="flex items-center gap-1.5"><Server size={12} className="text-blue-400" /> {t('Products Catalog:', 'পণ্য ক্যাটালগ:')}</span>
                  <span className="text-white font-bold">{productCount} {t('docs', 'টি')}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="flex items-center gap-1.5"><Server size={12} className="text-purple-400" /> {t('Orders Ledger:', 'অর্ডার লেজার:')}</span>
                  <span className="text-white font-bold">{orderCount} {t('docs', 'টি')}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span className="flex items-center gap-1.5"><Server size={12} className="text-emerald-400" /> {t('User Profiles:', 'ব্যবহারকারী প্রোফাইল:')}</span>
                  <span className="text-white font-bold">{userCount} {t('docs', 'টি')}</span>
                </div>
              </div>

              {/* Connection & Auth Health */}
              <div className="space-y-2 pt-1 border-t border-white/10">
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-400" /> {t('Better Auth Session', 'বেটার অথ সেশন')}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    {t('ACTIVE', 'সক্রিয়')}
                  </span>
                </div>
                <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 space-y-1 text-[10px] font-mono">
                  <div className="flex justify-between text-gray-400">
                    <span>{t('Auth Provider:', 'অথ প্রদানকারী:')}</span>
                    <span className="text-white font-bold">{t('Better Auth (Cookie + Bearer)', 'বেটার অথ (সেশন টোকেন)')}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>{t('Database Engine:', 'ডেটাবেস ইঞ্জিন:')}</span>
                    <span className="text-brand-orange font-bold">{t('MongoDB / Persistent Store', 'মঙ্গোডিবি / পারসিস্টেন্ট স্টোর')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

