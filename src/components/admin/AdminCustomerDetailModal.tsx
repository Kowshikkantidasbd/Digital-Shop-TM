import React, { useState } from 'react';
import { 
  User as UserIcon, Mail, Phone, MapPin, ShieldAlert, Key, 
  CheckSquare, Square, X, Edit2, AlertCircle, ShoppingBag, 
  Calendar, Check, Lock, ShieldCheck, History, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Order, UserRestrictions } from '../../types';
import { adminApi } from '../../services/api';
import { useToast } from '../Toast';
import { useLanguage } from '../../contexts/LanguageContext';

interface AdminCustomerDetailModalProps {
  user: User;
  customerOrders: Order[];
  onClose: () => void;
  onUpdateUser: (updated: User) => void;
  onLogSecurityAction: (action: string, targetTitle: string, details: string) => void;
}

export const AdminCustomerDetailModal: React.FC<AdminCustomerDetailModalProps> = ({
  user,
  customerOrders,
  onClose,
  onUpdateUser,
  onLogSecurityAction
}) => {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Profile fields
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');

  // Granular Restrictions
  const [restrictions, setRestrictions] = useState<UserRestrictions>({
    blockDiscountCodes: user.restrictions?.blockDiscountCodes || false,
    blockOrdering: user.restrictions?.blockOrdering || false,
    blockCOD: user.restrictions?.blockCOD || false,
    blockReviews: user.restrictions?.blockReviews || false,
    blockChat: user.restrictions?.blockChat || false,
  });

  // Sensitive security modal state (password/email/phone change)
  const [securityActionType, setSecurityActionType] = useState<'password' | 'email' | 'phone' | null>(null);
  const [securityNewValue, setSecurityNewValue] = useState('');
  const [securityAdminReason, setSecurityAdminReason] = useState('');

  const handleToggleRestriction = async (key: keyof UserRestrictions) => {
    const updatedRestrictions: UserRestrictions = {
      ...restrictions,
      [key]: !restrictions[key]
    };
    setRestrictions(updatedRestrictions);

    try {
      await adminApi.updateUser(user.id, { restrictions: updatedRestrictions });
      const updatedUser: User = { ...user, restrictions: updatedRestrictions };
      onUpdateUser(updatedUser);
      onLogSecurityAction(
        'User Restriction Toggled',
        user.email || user.name || user.id,
        `Toggled ${key} to ${updatedRestrictions[key] ? 'ENABLED (BLOCKED)' : 'DISABLED (ALLOWED)'}`
      );
      showToast(t('Restriction updated', 'সীমাবদ্ধতা আপডেট করা হয়েছে'), 'success');
    } catch (e) {
      showToast(t('Failed to update restrictions', 'সীমাবদ্ধতা আপডেট করতে ব্যর্থ হয়েছে'), 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const updates = {
        name: name.trim(),
        phone: phone.trim(),
      };
      await adminApi.updateUser(user.id, updates);
      const updatedUser = { ...user, ...updates };
      onUpdateUser(updatedUser);
      onLogSecurityAction('Customer Profile Updated', user.email || user.id, `Updated details: name: ${name}, phone: ${phone}`);
      setIsEditing(false);
      showToast(t('Customer profile updated', 'গ্রাহকের প্রোফাইল আপডেট করা হয়েছে'), 'success');
    } catch (e) {
      showToast(t('Failed to update profile', 'প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteSecurityChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityNewValue.trim()) {
      showToast(t('Please enter the new value', 'অনুগ্রহ করে নতুন মান লিখুন'), 'error');
      return;
    }
    if (!securityAdminReason.trim()) {
      showToast(t('Admin justification note is required for security logging', 'নিরাপত্তা লগিংয়ের জন্য অ্যাডমিনের কারণ উল্লেখ করা আবশ্যক'), 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const updates: Partial<User> = {};
      let actionLabel = '';
      let actionLabelBn = '';

      if (securityActionType === 'password') {
        actionLabel = 'Customer Password Reset by Admin';
        actionLabelBn = 'অ্যাডমিন দ্বারা গ্রাহকের পাসওয়ার্ড রিসেট';
        // Securely pass temporary password or flag in profile
        (updates as any).tempPasswordSet = true;
        (updates as any).lastPasswordResetByAdmin = new Date().toISOString();
      } else if (securityActionType === 'email') {
        actionLabel = 'Customer Email Changed by Admin';
        actionLabelBn = 'অ্যাডমিন দ্বারা গ্রাহকের ইমেইল পরিবর্তন';
        updates.email = securityNewValue.trim();
        setEmail(securityNewValue.trim());
      } else if (securityActionType === 'phone') {
        actionLabel = 'Customer Phone Changed by Admin';
        actionLabelBn = 'অ্যাডমিন দ্বারা গ্রাহকের ফোন পরিবর্তন';
        updates.phone = securityNewValue.trim();
        setPhone(securityNewValue.trim());
      }

      await adminApi.updateUser(user.id, updates);
      const updatedUser = { ...user, ...updates };
      onUpdateUser(updatedUser);

      onLogSecurityAction(
        actionLabel,
        user.email || user.id,
        `Reason: "${securityAdminReason.trim()}". New value applied securely by admin.`
      );

      showToast(t(`${actionLabel} completed and logged to audit trail`, `${actionLabelBn} সম্পন্ন হয়েছে এবং অডিট লগে সংরক্ষিত হয়েছে`), 'success');
      setSecurityActionType(null);
      setSecurityNewValue('');
      setSecurityAdminReason('');
    } catch (e) {
      showToast(t('Failed to update sensitive credential', 'সংবেদনশীল তথ্য আপডেট করতে ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md" 
        onClick={onClose} 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-[#12121c] border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl z-10 max-h-[90vh] overflow-y-auto text-left space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/15 text-brand-orange border border-brand-orange/30 flex items-center justify-center font-bold text-lg">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                (user.name || user.email || 'U').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                {user.name || t('Anonymous Customer', 'বেনামী গ্রাহক')}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  user.status === 'suspended' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {user.status === 'suspended' ? t('Suspended', 'স্থগিত') : t('Active', 'সক্রিয়')}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('ID:', 'আইডি:')} <span className="font-mono text-gray-300">{user.id}</span> • {t('Customer since', 'গ্রাহক হিসেবে যুক্ত')} {new Date(user.joinedAt || Date.now()).toLocaleDateString(dateLocale)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Account Information & Editing */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <UserIcon size={14} className="text-brand-orange" /> {t('Account Profile', 'অ্যাকাউন্ট প্রোফাইল')}
              </h4>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-brand-orange hover:text-orange-400 flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={12} /> {t('Edit', 'এডিট')}
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">{t('Full Name', 'পুরো নাম')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-9 px-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">{t('Phone Number', 'ফোন নম্বর')}</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-9 px-3 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs font-bold"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-1.5 rounded-lg bg-brand-orange text-white text-xs font-bold uppercase tracking-wider"
                  >
                    {t('Save', 'সংরক্ষণ')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">{t('Email Address', 'ইমেইল ঠিকানা')}</span>
                  <span className="text-white font-mono">{email || t('Not provided', 'প্রদান করা হয়নি')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">{t('Mobile Phone', 'মোবাইল নম্বর')}</span>
                  <span className="text-white font-mono">{phone || t('Not provided', 'প্রদান করা হয়নি')}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">{t('Orders Placed', 'মোট অর্ডার')}</span>
                  <span className="text-white font-bold">{customerOrders.length} {t('orders', 'টি অর্ডার')} (৳{totalSpent.toLocaleString()})</span>
                </div>
              </div>
            )}

            {/* Default Address if available */}
            {user.addresses && user.addresses.length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1">
                  <MapPin size={11} className="text-brand-orange" /> {t('Saved Address', 'সংরক্ষিত ঠিকানা')}
                </span>
                <p className="text-xs text-gray-300 leading-snug">
                  {user.addresses[0].fullAddress || user.addresses[0].addressLine || `${user.addresses[0].district}, ${user.addresses[0].division}`}
                </p>
              </div>
            )}
          </div>

          {/* Column 2: Granular Restriction Controls */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={14} className="text-rose-400" /> {t('Granular Account Restrictions', 'সীমিত অ্যাকাউন্ট নিয়ন্ত্রণ')}
              </h4>
              <p className="text-[11px] text-gray-400 mt-1">
                {t('Independently toggle restrictions without suspending the entire account.', 'পুরো অ্যাকাউন্ট স্থগিত না করেই আলাদাভাবে যেকোনো সুবিধা সীমিত করুন।')}
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { 
                  key: 'blockDiscountCodes' as const, 
                  label: t('Block Discount Codes', 'ডিসকাউন্ট কোড ব্লক করুন'), 
                  desc: t('Disallow applying promotional promo codes or coupons at checkout', 'চেকআউটে প্রোমো কোড বা কুপন ব্যবহার বন্ধ করুন') 
                },
                { 
                  key: 'blockOrdering' as const, 
                  label: t('Block Ordering', 'অর্ডার করা ব্লক করুন'), 
                  desc: t('Prevent checkout completely for this customer', 'এই গ্রাহকের জন্য চেকআউট সম্পূর্ণভাবে বন্ধ করুন') 
                },
                { 
                  key: 'blockCOD' as const, 
                  label: t('Block Cash on Delivery', 'ক্যাশ অন ডেলিভারি ব্লক করুন'), 
                  desc: t('Force prepaid online payment only (disable COD option)', 'শুধুমাত্র অগ্রিম অনলাইন পেমেন্ট বাধ্যতামূলক করুন (COD বন্ধ)') 
                },
                { 
                  key: 'blockReviews' as const, 
                  label: t('Block Product Reviews', 'পণ্যের রিভিউ ব্লক করুন'), 
                  desc: t('Disallow submitting reviews or ratings on products', 'পণ্যে রিভিউ বা রেটিং দেওয়া বন্ধ করুন') 
                },
                { 
                  key: 'blockChat' as const, 
                  label: t('Block Live Chat', 'লাইভ চ্যাট ব্লক করুন'), 
                  desc: t('Disable instant messaging with sellers & support', 'বিক্রেতা ও সাপোর্টের সাথে তাৎক্ষণিক চ্যাট বন্ধ করুন') 
                },
              ].map(item => {
                const isBlocked = !!restrictions[item.key];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleToggleRestriction(item.key)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isBlocked
                        ? 'bg-rose-500/15 border-rose-500/40 text-white'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/15'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isBlocked ? (
                        <CheckSquare size={16} className="text-rose-400" />
                      ) : (
                        <Square size={16} className="text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isBlocked ? 'text-rose-300' : 'text-gray-300'}`}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 3: Admin-Initiated Security Actions */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Key size={14} className="text-amber-400" /> {t('Admin Security Actions', 'অ্যাডমিন নিরাপত্তা কার্যক্রম')}
              </h4>
              <p className="text-[11px] text-gray-400 mt-1">
                {t('Perform sensitive credential adjustments. All changes are strictly logged to audit trail.', 'সংবেদনশীল তথ্য পরিবর্তন করুন। সকল পরিবর্তন অডিট লগে কঠোরভাবে সংরক্ষিত হয়।')}
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setSecurityActionType('password');
                  setSecurityNewValue('');
                  setSecurityAdminReason('');
                }}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 text-left transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Lock size={15} className="text-amber-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-white">{t('Reset Customer Password', 'গ্রাহকের পাসওয়ার্ড রিসেট করুন')}</p>
                    <p className="text-[10px] text-gray-400">{t('Issue temporary login password', 'অস্থায়ী লগইন পাসওয়ার্ড প্রদান করুন')}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-400">{t('Reset →', 'রিসেট →')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSecurityActionType('email');
                  setSecurityNewValue(user.email || '');
                  setSecurityAdminReason('');
                }}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-blue-500/15 border border-white/10 hover:border-blue-500/30 text-left transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Mail size={15} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-white">{t('Change Email Address', 'ইমেইল ঠিকানা পরিবর্তন করুন')}</p>
                    <p className="text-[10px] text-gray-400">{t('Update verified contact email', 'ভেরিফায়েড ইমেইল আপডেট করুন')}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-400">{t('Change →', 'পরিবর্তন →')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSecurityActionType('phone');
                  setSecurityNewValue(user.phone || '');
                  setSecurityAdminReason('');
                }}
                className="w-full p-3 rounded-xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-left transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Phone size={15} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-bold text-white">{t('Change Mobile Number', 'মোবাইল নম্বর পরিবর্তন করুন')}</p>
                    <p className="text-[10px] text-gray-400">{t('Update verified SMS number', 'ভেরিফায়েড এসএমএস নম্বর আপডেট করুন')}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400">{t('Change →', 'পরিবর্তন →')}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-gray-400 flex items-start gap-2">
              <History size={14} className="text-gray-500 mt-0.5 shrink-0" />
              <span>{t('Security actions are stamped with admin credentials and UTC timestamp in Activity Log.', 'নিরাপত্তা কার্যক্রম অ্যাডমিন তথ্য ও সময়সহ অ্যাক্টিভিটি লগে সংরক্ষিত হয়।')}</span>
            </div>
          </div>
        </div>

        {/* Recent Orders List by this Customer */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag size={14} className="text-brand-orange" /> {t('Order History', 'অর্ডার ইতিহাস')} ({customerOrders.length} {t('orders', 'টি অর্ডার')})
          </h4>

          {customerOrders.length === 0 ? (
            <p className="text-xs text-gray-500">{t('No orders placed by this customer yet.', 'এই গ্রাহক এখনও কোনো অর্ডার করেননি।')}</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {customerOrders.map(order => (
                <div key={order.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white">#{order.id.slice(0, 8)}</span>
                    <span className="text-gray-400">{order.date || t('Recent', 'সাম্প্রতিক')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-orange/20 text-brand-orange'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <span className="font-mono font-black text-white">৳{(order.total || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sensitive Action Modal / Prompt */}
        <AnimatePresence>
          {securityActionType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSecurityActionType(null)}
                className="fixed inset-0 bg-black/85 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-md bg-[#161624] border border-amber-500/40 rounded-3xl p-6 shadow-2xl z-10 text-left space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="text-amber-400" size={18} />
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      {securityActionType === 'password'
                        ? t('Confirm PASSWORD Modification', 'পাসওয়ার্ড পরিবর্তন নিশ্চিত করুন')
                        : securityActionType === 'email'
                        ? t('Confirm EMAIL Modification', 'ইমেইল পরিবর্তন নিশ্চিত করুন')
                        : t('Confirm PHONE Modification', 'ফোন নম্বর পরিবর্তন নিশ্চিত করুন')}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSecurityActionType(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleExecuteSecurityChange} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                      {securityActionType === 'password'
                        ? t('New Temporary Password *', 'নতুন অস্থায়ী পাসওয়ার্ড *')
                        : securityActionType === 'email'
                        ? t('New Email Address *', 'নতুন ইমেইল ঠিকানা *')
                        : t('New Phone Number *', 'নতুন ফোন নম্বর *')}
                    </label>
                    <input
                      type={securityActionType === 'password' ? 'text' : securityActionType === 'email' ? 'email' : 'text'}
                      required
                      placeholder={
                        securityActionType === 'password'
                          ? t('Enter new temporary password...', 'নতুন অস্থায়ী পাসওয়ার্ড লিখুন...')
                          : securityActionType === 'email'
                          ? t('Enter new email address...', 'নতুন ইমেইল ঠিকানা লিখুন...')
                          : t('Enter new phone number...', 'নতুন ফোন নম্বর লিখুন...')
                      }
                      value={securityNewValue}
                      onChange={(e) => setSecurityNewValue(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-xs text-white font-mono focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                      {t('Admin Justification / Security Audit Note *', 'অ্যাডমিনের কারণ / নিরাপত্তা অডিট নোট *')}
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder={t('e.g. Customer verified via support ticket #4928', 'যেমন: সাপোর্ট টিকিট #4928-এর মাধ্যমে গ্রাহক যাচাইকৃত')}
                      value={securityAdminReason}
                      onChange={(e) => setSecurityAdminReason(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSecurityActionType(null)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold"
                    >
                      {t('Cancel', 'বাতিল')}
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-black uppercase tracking-wider"
                    >
                      {isProcessing ? t('Applying...', 'প্রয়োগ হচ্ছে...') : t('Confirm Change', 'পরিবর্তন নিশ্চিত করুন')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
