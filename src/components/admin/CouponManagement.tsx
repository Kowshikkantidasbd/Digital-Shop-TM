import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tag, Plus, Search, Trash2, Edit2, 
  CheckCircle, XCircle, Calendar, Users, 
  Percent, DollarSign, Clock, X, Loader2, AlertCircle
} from 'lucide-react';
import { couponApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../Toast';
import { useSiteConfig } from '../../hooks/useSiteConfig';
import { persistSiteConfig } from '../../constants/siteConfig';

interface CouponItem {
  id: string;
  code: string;
  discount: string;
  value: number;
  type: 'percentage' | 'fixed';
  expiry: string;
  usage: string;
  usedCount?: number;
  usageLimit?: number;
  status: 'active' | 'expired' | 'inactive';
}

export const CouponManagement: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { siteConfig } = useSiteConfig();
  const isCouponBoxEnabled = siteConfig?.showCouponCode === true;
  const [isTogglingCouponBox, setIsTogglingCouponBox] = useState(false);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState<number>(20);
  const [limit, setLimit] = useState<number>(500);
  const [expiry, setExpiry] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const getStatusLabel = (status: string) => {
    if (status === 'active') return t('Active', 'সক্রিয়');
    if (status === 'expired') return t('Expired', 'মেয়াদোত্তীর্ণ');
    return t('Inactive', 'নিষ্ক্রিয়');
  };

  const mapCoupons = (rawCoupons: any[]): CouponItem[] =>
    rawCoupons.map((data) => {
      const couponType = (data.discountType || data.type) === 'fixed' ? 'fixed' : 'percentage';
      const discountVal =
        data.value !== undefined
          ? Number(data.value)
          : data.discount !== undefined
          ? Number(data.discount)
          : data.discountPercent || 10;
      const used = data.usedCount ?? data.usage ?? 0;
      const maxUse = data.usageLimit || data.maxUses || 500;
      const expDate = data.expiry || data.validUntil || data.expiryDate || '2026-12-31';
      const isExp = new Date(expDate).getTime() < Date.now();
      const stat = data.status || (isExp ? 'expired' : 'active');

      return {
        id: data.id || data.code,
        code: String(data.code || data.id).toUpperCase(),
        discount: couponType === 'percentage' ? `${discountVal}%` : `৳${discountVal.toLocaleString()}`,
        value: discountVal,
        type: couponType,
        expiry: expDate,
        usage: `${used}/${maxUse}`,
        usedCount: used,
        usageLimit: maxUse,
        status: stat
      };
    });

  const loadCoupons = async () => {
    try {
      const list = await couponApi.getCoupons();
      setCoupons(mapCoupons(list || []));
      setError(null);
    } catch (e: any) {
      setError(e?.message || t('Failed to load coupons from server.', 'সার্ভার থেকে কুপন লোড করতে ব্যর্থ।'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCode('');
    setType('percentage');
    setValue(20);
    setLimit(500);
    setExpiry(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CouponItem) => {
    setEditingId(c.id);
    setCode(c.code);
    setType(c.type);
    setValue(c.value);
    setLimit(c.usageLimit || 500);
    setExpiry(c.expiry || '');
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    setIsSaving(true);
    try {
      const status: 'active' | 'expired' = new Date(expiry).getTime() < Date.now() ? 'expired' : 'active';
      const payload: any = {
        id: editingId || cleanCode,
        code: cleanCode,
        discountType: type,
        discount: Number(value),
        value: Number(value),
        usageLimit: Number(limit),
        validUntil: expiry,
        expiry,
        status
      };

      if (editingId) {
        await couponApi.updateCoupon(editingId, payload);
      } else {
        await couponApi.createCoupon(payload);
      }

      await loadCoupons();
      showToast(editingId ? t('Campaign updated successfully.', 'ক্যাম্পেইন আপডেট হয়েছে।') : t('Campaign launched successfully.', 'ক্যাম্পেইন চালু হয়েছে।'), 'success');
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save coupon:', err);
      showToast(t('Error saving coupon: ', 'কুপন সংরক্ষণে ত্রুটি: ') + (err?.message || ''), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await couponApi.deleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
      showToast(t('Coupon deleted.', 'কুপন মুছে ফেলা হয়েছে।'), 'success');
    } catch (err: any) {
      console.error('Failed to delete coupon:', err);
      showToast(t('Failed to delete coupon: ', 'কুপন মুছতে ব্যর্থ: ') + (err?.message || ''), 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-brand-navy tracking-tight uppercase">{t('Promotion Engines', 'প্রমোশন ইঞ্জিন')}</h1>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Live Store Coupons & Vouchers', 'লাইভ স্টোর কুপন ও ভাউচার')}</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-orange/90 transition-all shadow-lg shadow-brand-orange/20 cursor-pointer"
        >
          <Plus size={16} /> {t('Create Campaign', 'ক্যাম্পেইন তৈরি করুন')}
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isCouponBoxEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
            <Tag size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-brand-navy uppercase">
                {t('Storefront Coupon Code Box', 'স্টোরফ্রন্ট কুপন কোড বক্স')}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                isCouponBoxEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
              }`}>
                {isCouponBoxEnabled ? t('ON', 'চালু') : t('OFF (Default)', 'বন্ধ (ডিফল্ট)')}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('Turn ON to show the coupon code input on product details & checkout. Off by default.', 'প্রোডাক্ট ডিটেইলস ও চেকআউটে কুপন কোড বক্স দেখাতে চালু করুন। সাধারণত বন্ধ থাকে।')}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={isTogglingCouponBox}
          onClick={async () => {
            const nextVal = !isCouponBoxEnabled;
            setIsTogglingCouponBox(true);
            try {
              await persistSiteConfig({ showCouponCode: nextVal });
              showToast(
                nextVal
                  ? t('Coupon code box enabled across the storefront.', 'স্টোরফ্রন্টে কুপন কোড বক্স চালু করা হয়েছে।')
                  : t('Coupon code box turned OFF.', 'কুপন কোড বক্স বন্ধ করা হয়েছে।'),
                'success'
              );
            } catch {
              showToast(t('Failed to update coupon visibility.', 'কুপন সেটিংস আপডেট করা যায়নি।'), 'error');
            } finally {
              setIsTogglingCouponBox(false);
            }
          }}
          className={`w-14 h-8 rounded-full relative p-1 transition-colors shrink-0 cursor-pointer ${
            isCouponBoxEnabled ? 'bg-emerald-500' : 'bg-gray-300'
          }`}
          aria-label="Toggle Storefront Coupon Box"
        >
          <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${isCouponBoxEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow">
          <Loader2 className="animate-spin text-brand-orange" size={28} />
          <p className="text-xs font-bold uppercase tracking-widest">{t('Loading coupons from database...', 'ডাটাবেস থেকে কুপন লোড হচ্ছে...')}</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-50 border border-rose-200 text-rose-700 rounded-[2rem] flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" />
          <span className="text-xs font-bold">{error}</span>
        </div>
      ) : coupons.length === 0 ? (
        <div className="p-16 text-center text-gray-400 bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow flex flex-col items-center justify-center">
          <Tag size={40} className="text-gray-300 mb-3" />
          <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">{t('No Active Coupons', 'কোনো সক্রিয় কুপন নেই')}</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">{t('No promotional coupon codes found in the database. Create your first campaign code above.', 'ডাটাবেসে কোনো প্রমোশনাল কুপন কোড পাওয়া যায়নি। উপরে আপনার প্রথম ক্যাম্পেইন কোড তৈরি করুন।')}</p>
          <button 
            onClick={handleOpenCreate}
            className="mt-6 px-6 py-3 bg-brand-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer"
          >
            {t('Create Now', 'এখনই তৈরি করুন')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {coupons.map((coupon) => (
              <motion.div 
                layout
                key={coupon.id} 
                className="bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow overflow-hidden group hover:border-brand-orange transition-all relative"
              >
                 <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="w-12 h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center">
                          <Tag size={24} />
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] ${
                          coupon.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                       }`}>
                          {getStatusLabel(coupon.status)}
                       </span>
                    </div>
                    
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{t('Coupon Secret', 'কুপন কোড')}</p>
                       <div className="flex items-center gap-2">
                          <h3 className="text-2xl font-black text-brand-navy tracking-widest">{coupon.code}</h3>
                          <button 
                            onClick={() => handleOpenEdit(coupon)}
                            className="text-brand-orange hover:scale-110 transition-transform cursor-pointer"
                            title={t('Edit campaign', 'ক্যাম্পেইন সম্পাদনা')}
                          >
                            <Edit2 size={14} />
                          </button>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Yield', 'ছাড়ের পরিমাণ')}</p>
                          <p className="text-sm font-black text-brand-navy">{coupon.discount}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Reach', 'ব্যবহার')}</p>
                          <p className="text-sm font-black text-gray-700">{coupon.usage}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                       <Clock size={16} className="text-gray-400" />
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Target Expiry', 'মেয়াদ শেষ')}</p>
                          <p className="text-[10px] font-bold text-brand-navy">{coupon.expiry}</p>
                       </div>
                    </div>
                 </div>
                 
                 <div className={`absolute top-4 right-4 transition-opacity flex items-center gap-1.5 ${confirmDeleteId === coupon.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {confirmDeleteId === coupon.id ? (
                      <div className="flex items-center gap-1.5 bg-white shadow-lg border border-rose-100 px-2.5 py-1.5 rounded-xl">
                        <span className="text-[9px] font-black text-rose-600">{t('Delete?', 'মুছবেন?')}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="px-2 py-0.5 bg-rose-500 text-white rounded-md text-[9px] font-black cursor-pointer"
                        >
                          {t('Yes', 'হ্যাঁ')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-black cursor-pointer"
                        >
                          {t('No', 'না')}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleOpenEdit(coupon)} 
                          className="p-2 text-gray-400 hover:text-brand-orange bg-white shadow-md rounded-lg cursor-pointer"
                          title={t('Edit', 'সম্পাদনা')}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(coupon.id)} 
                          className="p-2 text-gray-400 hover:text-rose-500 bg-white shadow-md rounded-lg cursor-pointer"
                          title={t('Delete', 'মুছুন')}
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                 </div>
              </motion.div>
           ))}
        </div>
      )}

      {/* Create / Edit Campaign Modal */}
      <AnimatePresence>
        {isModalOpen && (
           <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-brand-navy/60 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9, y: 20 }} 
                className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 space-y-8"
              >
                 <div className="flex items-center justify-between">
                    <div>
                       <h2 className="text-2xl font-black text-brand-navy tracking-tight uppercase">
                         {editingId ? t('Edit Campaign', 'ক্যাম্পেইন সম্পাদনা') : t('New Campaign', 'নতুন ক্যাম্পেইন')}
                       </h2>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Configure promotional yield', 'প্রমোশনাল ছাড় নির্ধারণ করুন')}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-brand-orange transition-colors cursor-pointer"><X size={24} /></button>
                 </div>

                 <form onSubmit={handleSaveCoupon} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Campaign Code', 'ক্যাম্পেইন কোড')}</label>
                       <input 
                         type="text" 
                         value={code}
                         onChange={(e) => setCode(e.target.value.toUpperCase())}
                         placeholder={t('e.g. SUMMER2026', 'যেমন: SUMMER2026')} 
                         className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-sm font-black text-brand-navy uppercase tracking-widest" 
                         required 
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Discount Type', 'ছাড়ের ধরন')}</label>
                          <select 
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-[10px] font-black uppercase tracking-widest text-gray-600"
                          >
                             <option value="percentage">{t('Percentage (%)', 'শতাংশ (%)')}</option>
                             <option value="fixed">{t('Fixed Amount (৳)', 'নির্দিষ্ট পরিমাণ (৳)')}</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Discount Value', 'ছাড়ের মান')}</label>
                          <input 
                            type="number" 
                            value={value}
                            onChange={(e) => setValue(Number(e.target.value))}
                            placeholder="20" 
                            min="1"
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-sm font-black text-brand-orange" 
                            required 
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Consumption Limit', 'ব্যবহারের সীমা')}</label>
                          <input 
                            type="number" 
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            placeholder="1000" 
                            min="1"
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-sm font-bold text-brand-navy" 
                            required 
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">{t('Target Expiry', 'মেয়াদ শেষ')}</label>
                          <input 
                            type="date" 
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-[10px] font-black text-brand-navy uppercase" 
                            required 
                          />
                       </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-5 bg-brand-navy text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-navy/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                       {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                       {isSaving ? t('Saving...', 'সংরক্ষণ হচ্ছে...') : editingId ? t('Update Campaign', 'ক্যাম্পেইন আপডেট করুন') : t('Launch Campaign', 'ক্যাম্পেইন চালু করুন')}
                    </button>
                 </form>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};
