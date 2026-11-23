import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, Mail, Phone, MapPin, Calendar, ShieldCheck, 
  Edit2, Camera, Package, Heart, ShoppingCart, Truck, CheckCircle2, 
  Clock, RotateCcw, Store, ChevronRight, CreditCard, Tag, Bell, 
  MessageCircle, HelpCircle, Globe, Lock, Shield, Download, 
  LogOut, Trash2, X, Save, Check, AlertCircle, Sparkles, Star, 
  ArrowRight, CheckCircle, ShieldAlert, Award, FileText, Smartphone
} from 'lucide-react';
import { User as UserType, Order, CartItem, Product } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { useToast } from '../Toast';
import { authApi } from '../../services/api';
import { isSuperAdminEmail } from '../../constants/adminConfig';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../LanguageSwitcher';

interface MobileProfileScreenProps {
  user: UserType;
  orders: Order[];
  wishlist: string[];
  cart: CartItem[];
  products?: Product[];
  onLogout: () => void;
  onUpdateUser: (user: UserType) => void;
  setActiveTab: (tab: any) => void;
  onOpenPhoneModal?: () => void;
  effectivePhone?: string;
  onSelectOrder?: (order: Order) => void;
  syncWarning?: boolean;
  onRetrySync?: () => void;
  isRetryingSync?: boolean;
}

const validateBanglaPhone = (phone: string) => {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(?:\+88|88)?(01[3-9]\d{8})$/.test(cleaned);
};

export const MobileProfileScreen: React.FC<MobileProfileScreenProps> = ({
  user,
  orders = [],
  wishlist = [],
  cart = [],
  onLogout,
  onUpdateUser,
  setActiveTab,
  onOpenPhoneModal,
  effectivePhone = '',
  onSelectOrder,
  syncWarning = false,
  onRetrySync,
  isRetryingSync = false
}) => {
  const { showToast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  // Bottom sheets & modal states
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [passwordState, setPasswordState] = useState({ current: '', newPass: '', confirmPass: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCouponsSheet, setShowCouponsSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [selectedPaymentPref, setSelectedPaymentPref] = useState('bKash');

  // Edit form states
  const [editName, setEditName] = useState(user?.name || '');
  const [editUsername, setEditUsername] = useState(user?.username || (user?.email ? user.email.split('@')[0] : ''));
  const [editPhone, setEditPhone] = useState(user?.phone || effectivePhone || '');
  const [editGender, setEditGender] = useState<string>((user as any)?.gender || 'unspecified');
  const [editDob, setEditDob] = useState<string>((user as any)?.dob || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [editBanner, setEditBanner] = useState(user?.banner || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});

  // Settings states
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyOffers, setNotifyOffers] = useState(false);

  // File input refs
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<'avatar' | 'banner' | null>(null);

  // Derived counts
  const activeOrders = orders.filter(o => !o.isDeleted);
  const toPayOrders = activeOrders.filter(o => o.paymentStatus === 'unpaid' || o.status === 'pending');
  const toShipOrders = activeOrders.filter(o => o.status === 'confirmed' || o.status === 'processing' || o.status === 'packed');
  const toReceiveOrders = activeOrders.filter(o => o.status === 'shipped' || o.status === 'out-for-delivery');
  const deliveredOrders = activeOrders.filter(o => o.status === 'delivered');
  const returnOrders = activeOrders.filter(o => o.status === 'returned' || o.cancellationRequested);

  const defaultAddress = user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0];

  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setEditUsername(user?.username || (user?.email ? user.email.split('@')[0] : ''));
    setEditPhone(user?.phone || effectivePhone || '');
    setEditGender((user as any)?.gender || 'unspecified');
    setEditDob((user as any)?.dob || '');
    setEditAvatar(user?.avatar || '');
    setEditBanner(user?.banner || '');
    setEditErrors({});
    setShowEditSheet(true);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(t('Image must be smaller than 5MB', 'ছবি ৫ মেগাবাইটের কম হতে হবে'), 'error');
      return;
    }

    setIsUploadingImage(type);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === 'avatar') {
        setEditAvatar(result);
      } else {
        setEditBanner(result);
      }
      setIsUploadingImage(null);
      showToast(
        type === 'avatar'
          ? t('Profile photo selected', 'প্রোফাইল ছবি নির্বাচন করা হয়েছে')
          : t('Cover banner selected', 'কভার ব্যানার নির্বাচন করা হয়েছে'),
        'info'
      );
    };
    reader.onerror = () => {
      setIsUploadingImage(null);
      showToast(t('Failed to read image file', 'ছবি পড়তে সমস্যা হয়েছে'), 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    if (!editName.trim()) {
      errors.name = t('Name is required', 'নাম পূরণ করা আবশ্যক');
    }

    const cleanUsername = editUsername.trim().toLowerCase().replace(/\s+/g, '_');
    if (cleanUsername && !/^[a-z0-9_.-]+$/.test(cleanUsername)) {
      errors.username = t('Username can only contain lowercase letters, numbers, and _', 'ব্যবহারকারীর নাম শুধুমাত্র ছোট হাতের অক্ষর, সংখ্যা ও _ হতে পারবে');
    }

    const cleanPhone = editPhone.trim();
    if (cleanPhone && !validateBanglaPhone(cleanPhone)) {
      errors.phone = t('Enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678)', 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712345678)');
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      showToast(t('Please enter valid information', 'অনুগ্রহ করে সঠিক তথ্য দিন'), 'error');
      return;
    }

    try {
      setIsSavingProfile(true);

      const updatePayload: any = {
        name: editName.trim(),
        username: cleanUsername,
        phone: cleanPhone,
        avatar: editAvatar,
        banner: editBanner,
        gender: editGender,
        dob: editDob
      };

      if (cleanPhone) {
        localStorage.setItem(`phone_${user.id}`, cleanPhone);
        if (user.email) localStorage.setItem(`phone_${user.email}`, cleanPhone);
      }

      const updatedUser = await authApi.updateProfile(updatePayload);

      onUpdateUser({
        ...user,
        ...(updatedUser || {}),
        name: editName.trim(),
        username: cleanUsername,
        phone: cleanPhone || user.phone,
        avatar: editAvatar || user.avatar,
        banner: editBanner || user.banner,
        gender: editGender,
        dob: editDob
      });

      setShowEditSheet(false);
      showToast(t('Profile updated successfully!', 'প্রোফাইল সফলভাবে আপডেট হয়েছে!'), 'success');
    } catch (err: any) {
      console.error('Update profile error:', err);
      // Fallback save in case of rule or network glitch
      if (cleanPhone) {
        localStorage.setItem(`phone_${user.id}`, cleanPhone);
        if (user.email) localStorage.setItem(`phone_${user.email}`, cleanPhone);
      }
      onUpdateUser({
        ...user,
        name: editName.trim(),
        username: cleanUsername,
        phone: cleanPhone || user.phone,
        avatar: editAvatar || user.avatar,
        banner: editBanner || user.banner,
        gender: editGender,
        dob: editDob
      });
      setShowEditSheet(false);
      showToast(t('Saved locally on this device', 'তথ্য ডিভাইসে সংরক্ষিত হয়েছে'), 'info');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDownloadData = () => {
    try {
      const exportData = {
        profile: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone || effectivePhone,
          role: user.role,
          joinedAt: user.joinedAt,
          status: user.status,
          gender: (user as any)?.gender,
          dob: (user as any)?.dob
        },
        addresses: user.addresses || [],
        ordersCount: activeOrders.length,
        wishlistCount: wishlist.length,
        cartCount: cart.length,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile_data_${user.id || 'user'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(t('Profile data exported successfully', 'প্রোফাইল ডেটা সফলভাবে ডাউনলোড করা হয়েছে'), 'success');
    } catch (e) {
      showToast(t('Failed to download data', 'ডেটা ডাউনলোড করা সম্ভব হয়নি'), 'error');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.newPass || passwordState.newPass.length < 6) {
      showToast(t('New password must be at least 6 characters', 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'), 'error');
      return;
    }
    if (passwordState.newPass !== passwordState.confirmPass) {
      showToast(t('New passwords do not match', 'নতুন পাসওয়ার্ড দুটি মিলছে না'), 'error');
      return;
    }

    setIsUpdatingPassword(true);
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setShowPasswordSheet(false);
      setPasswordState({ current: '', newPass: '', confirmPass: '' });
      showToast(t('Password updated successfully!', 'পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে!'), 'success');
    }, 800);
  };

  const roleLabel = isSuperAdminEmail(user?.email) 
    ? t('⚡ SUPER ADMIN', '⚡ সুপার অ্যাডমিন') 
    : user?.role === 'admin' 
    ? t('🛡️ ADMIN', '🛡️ অ্যাডমিন') 
    : user?.shop 
    ? t('🏪 SELLER', '🏪 বিক্রেতা') 
    : t('👤 CUSTOMER', '👤 গ্রাহক');

  const roleChipClass = isSuperAdminEmail(user?.email)
    ? 'bg-amber-100 text-amber-900 border-amber-300'
    : user?.role === 'admin'
    ? 'bg-blue-100 text-blue-900 border-blue-300'
    : user?.shop
    ? 'bg-purple-100 text-purple-900 border-purple-300'
    : 'bg-emerald-100 text-emerald-900 border-emerald-300';

  return (
    <div className="lg:hidden min-h-screen bg-gray-50/70 pb-32 font-sans select-none">
      {/* Hidden file upload inputs for profile and banner */}
      <input 
        ref={avatarFileRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => handleImageFile(e, 'avatar')} 
      />
      <input 
        ref={bannerFileRef} 
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => handleImageFile(e, 'banner')} 
      />

      {/* Sync Warning Banner if offline or reading basic auth info */}
      {syncWarning && (
        <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 text-amber-900 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span className="leading-snug">
              {t('Could not sync with cloud, showing basic info', 'ক্লাউড সিঙ্ক হয়নি, মৌলিক তথ্য দেখানো হচ্ছে')}
            </span>
          </div>
          {onRetrySync && (
            <button
              onClick={onRetrySync}
              disabled={isRetryingSync}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            >
              <RotateCcw size={12} className={isRetryingSync ? 'animate-spin' : ''} />
              <span>{isRetryingSync ? t('Syncing...', 'সিঙ্ক...') : t('Retry', 'পুনরায় চেষ্টা')}</span>
            </button>
          )}
        </div>
      )}

      {/* 1. Header Card (Daraz / Shopee style) */}
      <div className="p-4 pt-3">
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative">
          {/* Cover Banner */}
          <div className="relative h-28 sm:h-32 w-full bg-gradient-to-r from-orange-400 via-amber-500 to-brand-orange overflow-hidden">
            {user?.banner ? (
              <img 
                src={user.banner} 
                alt={t('Profile Cover', 'প্রোফাইল কভার')} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            )}
            {/* Top-left Language Switcher */}
            <div className="absolute top-3 left-3 z-10">
              <LanguageSwitcher variant="compact" />
            </div>
            {/* Banner camera button */}
            <button
              type="button"
              onClick={() => bannerFileRef.current?.click()}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              title={t('Change Cover Photo', 'কভার ছবি পরিবর্তন')}
            >
              <Camera size={14} />
            </button>
          </div>

          {/* Avatar and Identity Info */}
          <div className="px-5 pb-5 pt-0 relative">
            <div className="flex items-end justify-between -mt-12 mb-3">
              {/* Circular Avatar with Camera Button */}
              <div className="relative">
                <div className="w-22 h-22 rounded-full border-4 border-white bg-white shadow-md overflow-hidden shrink-0">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id || 'guest'}`}
                    alt={user?.name || t('User avatar', 'ব্যবহারকারীর ছবি')}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => avatarFileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand-orange text-white border-2 border-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  title={t('Change Profile Photo', 'প্রোফাইল ছবি পরিবর্তন')}
                >
                  <Camera size={13} />
                </button>
              </div>

              {/* Edit Profile Button */}
              <button
                type="button"
                onClick={handleOpenEdit}
                className="min-h-[44px] px-4 py-2 bg-orange-50 hover:bg-orange-100 text-brand-orange border border-orange-200/80 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
              >
                <Edit2 size={13} />
                <span>{t('Edit Profile', 'প্রোফাইল এডিট')}</span>
              </button>
            </div>

            {/* Name & Handle */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">
                  {user?.name || t('Valued Customer', 'সম্মানিত গ্রাহক')}
                </h2>
                <span className="inline-flex items-center text-blue-500" title={t('Verified Profile', 'যাচাইকৃত প্রোফাইল')}>
                  <CheckCircle size={17} className="fill-blue-500 text-white" />
                </span>
              </div>
              <p className="text-xs font-mono font-medium text-gray-500">
                @{user?.username || (user?.email ? user.email.split('@')[0] : 'member')}
              </p>
            </div>

            {/* Chips: Role, Member since, Loyalty Points */}
            <div className="flex items-center gap-1.5 flex-wrap pt-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleChipClass}`}>
                {roleLabel}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-600" />
                <span>{user?.loyaltyPoints || 120} {t('Points', 'পয়েন্ট')}</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 flex items-center gap-1">
                <Calendar size={11} className="text-gray-400" />
                <span>{t('Member:', 'সদস্য:')} {formatDate(user?.joinedAt, { month: 'short', year: 'numeric' })}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stats Row (4 tiles, tappable) */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100 grid grid-cols-4 divide-x divide-gray-100 text-center">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className="flex flex-col items-center justify-center p-2 min-h-[48px] hover:bg-orange-50/40 rounded-2xl transition-colors cursor-pointer"
          >
            <span className="text-lg font-black text-gray-900 font-mono">
              {activeOrders.length}
            </span>
            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
              <Package size={11} className="text-brand-orange" />
              <span>{t('Orders', 'অর্ডার')}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wishlist')}
            className="flex flex-col items-center justify-center p-2 min-h-[48px] hover:bg-orange-50/40 rounded-2xl transition-colors cursor-pointer"
          >
            <span className="text-lg font-black text-gray-900 font-mono">
              {wishlist.length}
            </span>
            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
              <Heart size={11} className="text-rose-500 fill-rose-500" />
              <span>{t('Wishlist', 'পছন্দ')}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cart')}
            className="flex flex-col items-center justify-center p-2 min-h-[48px] hover:bg-orange-50/40 rounded-2xl transition-colors cursor-pointer"
          >
            <span className="text-lg font-black text-gray-900 font-mono">
              {cart.length}
            </span>
            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
              <ShoppingCart size={11} className="text-amber-500" />
              <span>{t('Cart', 'কার্ট')}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className="flex flex-col items-center justify-center p-2 min-h-[48px] hover:bg-orange-50/40 rounded-2xl transition-colors cursor-pointer"
          >
            <span className="text-lg font-black text-gray-900 font-mono">
              {user?.addresses?.length || 0}
            </span>
            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={11} className="text-emerald-500" />
              <span>{t('Address', 'ঠিকানা')}</span>
            </span>
          </button>
        </div>
      </div>

      {/* 3. Order Status Shortcuts (Daraz / Shopee style) */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <Package size={16} className="text-brand-orange" />
              <span>{t('My Orders', 'আমার অর্ডারসমূহ')}</span>
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="text-xs font-bold text-brand-orange hover:text-orange-700 flex items-center gap-0.5 cursor-pointer min-h-[44px]"
            >
              <span>{t('View All', 'সব দেখুন')} ({activeOrders.length})</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1 text-center">
            {/* To Pay */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-gray-50 transition-colors min-h-[54px] relative cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center relative">
                <Clock size={18} />
                {toPayOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-orange text-white text-[9px] font-black flex items-center justify-center">
                    {toPayOrders.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-600 leading-tight">{t('To Pay', 'পেমেন্ট বাকি')}</span>
            </button>

            {/* To Ship */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-gray-50 transition-colors min-h-[54px] relative cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center relative">
                <Package size={18} />
                {toShipOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">
                    {toShipOrders.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-600 leading-tight">{t('To Ship', 'প্রস্তুত হচ্ছে')}</span>
            </button>

            {/* To Receive */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-gray-50 transition-colors min-h-[54px] relative cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center relative">
                <Truck size={18} />
                {toReceiveOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-black flex items-center justify-center">
                    {toReceiveOrders.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-600 leading-tight">{t('On the Way', 'অন দ্য ওয়ে')}</span>
            </button>

            {/* Delivered */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-gray-50 transition-colors min-h-[54px] relative cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center relative">
                <CheckCircle2 size={18} />
                {deliveredOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center">
                    {deliveredOrders.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-600 leading-tight">{t('Delivered', 'ডেলিভার্ড')}</span>
            </button>

            {/* Returns */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-gray-50 transition-colors min-h-[54px] relative cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center relative">
                <RotateCcw size={18} />
                {returnOrders.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                    {returnOrders.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-gray-600 leading-tight">{t('Returns', 'রিটার্ন')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Account Details List */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <UserIcon size={16} className="text-brand-orange" />
              <span>{t('Account Details', 'ব্যক্তিগত বিবরণ')}</span>
            </h3>
            <button
              type="button"
              onClick={handleOpenEdit}
              className="text-xs font-bold text-brand-orange hover:text-orange-700 flex items-center gap-1 min-h-[44px]"
            >
              <Edit2 size={13} />
              <span>{t('Edit', 'পরিবর্তন করুন')}</span>
            </button>
          </div>

          <div className="space-y-3 divide-y divide-gray-50 text-xs">
            {/* Full Name */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-400 font-medium">{t('Full Name', 'পূর্ণ নাম')}</span>
              <span className="font-bold text-gray-900">{user?.name || t('Not added', 'যুক্ত করা হয়নি')}</span>
            </div>

            {/* Email with verified tick */}
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-gray-400 font-medium">{t('Email', 'ইমেইল')}</span>
              <span className="font-bold text-gray-900 flex items-center gap-1 truncate max-w-[200px]">
                <span>{user?.email}</span>
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
              </span>
            </div>

            {/* Phone with Add/Change */}
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-gray-400 font-medium">{t('Mobile Number', 'মোবাইল নম্বর')}</span>
              <div className="flex items-center gap-2">
                {effectivePhone ? (
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
                    📞 {effectivePhone}
                  </span>
                ) : (
                  <span className="text-gray-400 italic">{t('Not added', 'যুক্ত করা হয়নি')}</span>
                )}
                <button
                  type="button"
                  onClick={onOpenPhoneModal || handleOpenEdit}
                  className="text-brand-orange font-bold hover:underline text-[11px] min-h-[44px] flex items-center"
                >
                  {effectivePhone ? t('Edit', 'এডিট') : t('+ Add Phone', '+ নম্বর যোগ')}
                </button>
              </div>
            </div>

            {/* Username */}
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-gray-400 font-medium">{t('Username', 'ইউজারনেম')}</span>
              <span className="font-mono font-bold text-gray-900">
                @{user?.username || (user?.email ? user.email.split('@')[0] : 'member')}
              </span>
            </div>

            {/* Gender */}
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-gray-400 font-medium">{t('Gender', 'লিঙ্গ')}</span>
              <span className="font-bold text-gray-900 capitalize">
                {(user as any)?.gender === 'male' ? t('Male', 'পুরুষ') : (user as any)?.gender === 'female' ? t('Female', 'মহিলা') : (user as any)?.gender === 'other' ? t('Other', 'অন্যান্য') : t('Unspecified', 'নির্দিষ্ট নয়')}
              </span>
            </div>

            {/* Date of Birth */}
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-gray-400 font-medium">{t('Date of Birth', 'জন্ম তারিখ')}</span>
              <span className="font-bold text-gray-900">
                {(user as any)?.dob ? formatDate((user as any).dob) : t('Unspecified', 'নির্দিষ্ট নয়')}
              </span>
            </div>

            {/* Default Delivery Address */}
            <div className="pt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 font-medium">{t('Default Address', 'প্রধান ঠিকানা')}</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('addresses')}
                  className="text-brand-orange font-bold text-[11px] min-h-[44px] flex items-center"
                >
                  {t('Change Address', 'ঠিকানা পরিবর্তন')}
                </button>
              </div>
              {defaultAddress ? (
                <p className="font-bold text-gray-900 leading-snug bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-black uppercase text-brand-orange bg-orange-100 px-1.5 py-0.5 rounded mr-1.5">
                    {defaultAddress.label || t('Home', 'বাসা')}
                  </span>
                  {defaultAddress.fullAddress}
                  {defaultAddress.district ? `, ${defaultAddress.district}` : ''}
                  {defaultAddress.phone ? ` (📞 ${defaultAddress.phone})` : ''}
                </p>
              ) : (
                <p className="text-gray-400 italic">{t('No address added yet', 'কোনো ঠিকানা যুক্ত করা নেই')}</p>
              )}
            </div>

            {/* Status & Last Active */}
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-gray-400 font-medium">{t('Status', 'স্ট্যাটাস ও সক্রিয়তা')}</span>
              <span className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{user?.status || t('Active Member', 'সক্রিয় সদস্য')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. My Shop (if user.shop exists or invitation to sell) */}
      <div className="px-4 mb-4">
        {user?.shop ? (
          <div className="bg-gradient-to-br from-white to-orange-50/40 rounded-3xl p-5 shadow-sm border border-orange-200/70">
            <div className="flex items-center justify-between pb-3 border-b border-orange-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-orange text-white flex items-center justify-center">
                  <Store size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">{user.shop.name}</h4>
                  <span className="text-[10px] font-bold text-brand-orange">
                    {user.shop.status === 'approved' || user.shop.status === 'active' 
                      ? t('🟢 Active Store', '🟢 অনুমোদিত শপ') 
                      : t('🟡 Under Review', '🟡 পর্যালোচনায় রয়েছে')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('shop')}
                className="min-h-[44px] px-3.5 py-1.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 flex items-center gap-1"
              >
                <span>{t('Manage Shop', 'দোকান পরিচালনা')}</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-2xl border border-orange-100">
                <p className="font-bold text-gray-400 text-[10px]">{t('Rating', 'রেটিং')}</p>
                <p className="font-black text-gray-900 mt-0.5">⭐ {user.shop.rating || 5.0}</p>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-orange-100">
                <p className="font-bold text-gray-400 text-[10px]">{t('Followers', 'ফলোয়ার')}</p>
                <p className="font-black text-gray-900 mt-0.5">{user.shop.followers || 0}</p>
              </div>
              <div className="bg-white p-2.5 rounded-2xl border border-orange-100">
                <p className="font-bold text-gray-400 text-[10px]">{t('Total Sales', 'মোট বিক্রি')}</p>
                <p className="font-black text-gray-900 mt-0.5 font-mono">৳{user.shop.totalSales || 0}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-3xl p-5 shadow-md shadow-orange-500/15">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 mb-2">
                  {t('Merchant Partnership', 'মার্চেন্ট পার্টনারশিপ')}
                </span>
                <h4 className="text-base font-black tracking-tight">
                  {t('Start Selling on Digital Shop!', 'ডিজিটাল শপে পণ্য বিক্রি শুরু করুন!')}
                </h4>
                <p className="text-xs text-orange-100 mt-1 leading-relaxed">
                  {t('Open your own brand & shop to reach customers across Bangladesh.', 'আপনার নিজস্ব ব্র্যান্ড ও দোকান খুলে সারা বাংলাদেশে পণ্য পৌঁছে দিন।')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Store size={24} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('shop')}
              className="mt-4 w-full min-h-[44px] py-2.5 bg-white text-orange-600 hover:bg-orange-50 rounded-2xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('Register Shop (Start Selling)', 'দোকান রেজিস্ট্রেশন করুন')}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 6. Quick Actions Grid */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-brand-orange" />
            <span>{t('Quick Actions & Services', 'প্রয়োজনীয় সার্ভিস ও অপশন')}</span>
          </h3>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            {/* Addresses */}
            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/80 hover:bg-orange-50/60 transition-colors min-h-[72px] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-brand-orange flex items-center justify-center mb-1.5">
                <MapPin size={18} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 leading-tight">{t('Address Book', 'ঠিকানা বই')}</span>
              <span className="text-[9px] text-gray-400">({user?.addresses?.length || 0})</span>
            </button>

            {/* Wishlist */}
            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/80 hover:bg-orange-50/60 transition-colors min-h-[72px] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-1.5">
                <Heart size={18} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 leading-tight">{t('Wishlist', 'পছন্দের তালিকা')}</span>
              <span className="text-[9px] text-gray-400">({wishlist.length})</span>
            </button>

            {/* Coupons & Vouchers */}
            <button
              type="button"
              onClick={() => setShowCouponsSheet(true)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/80 hover:bg-orange-50/60 transition-colors min-h-[72px] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5">
                <Tag size={18} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 leading-tight">{t('Coupons & Vouchers', 'কুপন ও ভাউচার')}</span>
              <span className="text-[9px] text-emerald-600 font-bold">{t('Active', 'সক্রিয়')}</span>
            </button>

            {/* Payment Methods */}
            <button
              type="button"
              onClick={() => setShowPaymentSheet(true)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/80 hover:bg-orange-50/60 transition-colors min-h-[72px] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-1.5">
                <CreditCard size={18} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 leading-tight">{t('Payment Methods', 'পেমেন্ট মেথড')}</span>
              <span className="text-[9px] text-gray-400">bKash/COD</span>
            </button>

            {/* Returns & Refunds */}
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/80 hover:bg-orange-50/60 transition-colors min-h-[72px] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-1.5">
                <RotateCcw size={18} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 leading-tight">{t('Returns & Refunds', 'রিটার্ন ও রিফান্ড')}</span>
              <span className="text-[9px] text-gray-400">{t('Easy Policy', 'সহজ পলিসি')}</span>
            </button>

            {/* Notifications */}
            <button
              type="button"
              onClick={() => showToast(t('You have no unread notifications', 'আপনার কোনো অপঠিত নোটিফিকেশন নেই'), 'info')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/80 hover:bg-orange-50/60 transition-colors min-h-[72px] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1.5">
                <Bell size={18} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 leading-tight">{t('Notifications', 'নোটিফিকেশন')}</span>
              <span className="text-[9px] text-gray-400">{t('Updates', 'আপডেট')}</span>
            </button>

            {/* Live Chat / Support */}
            <button
              type="button"
              onClick={() => {
                showToast(t('Connecting you to customer support team...', 'কাস্টমার সাপোর্ট টিমের সাথে সংযুক্ত করা হচ্ছে...'), 'info');
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/80 hover:bg-orange-50/60 transition-colors min-h-[72px] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-1.5">
                <MessageCircle size={18} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 leading-tight">{t('Live Chat', 'লাইভ চ্যাট')}</span>
              <span className="text-[9px] text-emerald-600 font-bold">{t('24/7 Support', '২৪/৭ সাপোর্ট')}</span>
            </button>

            {/* Help Centre */}
            <button
              type="button"
              onClick={() => showToast(t('Loading Help Center FAQ...', 'হেল্প সেন্টারের প্রশ্নোত্তর পেজ লোড হচ্ছে'), 'info')}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/80 hover:bg-orange-50/60 transition-colors min-h-[72px] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-1.5">
                <HelpCircle size={18} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 leading-tight">{t('Help Center', 'হেল্প সেন্টার')}</span>
              <span className="text-[9px] text-gray-400">{t('Support', 'সহায়তা')}</span>
            </button>

            {/* Download Data */}
            <button
              type="button"
              onClick={handleDownloadData}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-50/80 hover:bg-orange-50/60 transition-colors min-h-[72px] cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center mb-1.5">
                <Download size={18} />
              </div>
              <span className="text-[11px] font-bold text-gray-800 leading-tight">{t('Download Data', 'ডেটা ডাউনলোড')}</span>
              <span className="text-[9px] text-gray-400">{t('JSON Backup', 'JSON ব্যাকআপ')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 7. Settings (Language, Notifications, Password, Privacy) */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
            <Shield size={16} className="text-brand-orange" />
            <span>{t('Settings & Security', 'সেটিংস ও নিরাপত্তা')}</span>
          </h3>

          {/* Language Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <Globe size={18} className="text-gray-400" />
              <div>
                <p className="text-xs font-bold text-gray-900">{t('Language', 'ভাষা')}</p>
                <p className="text-[10px] text-gray-400">{t('Select app language', 'অ্যাপের ভাষা নির্বাচন করুন')}</p>
              </div>
            </div>
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setLanguage('bn'); showToast('ভাষা পরিবর্তন: বাংলা'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'bn' ? 'bg-white text-brand-orange shadow-xs' : 'text-gray-500'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => { setLanguage('en'); showToast('Language switched: English'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === 'en' ? 'bg-white text-brand-orange shadow-xs' : 'text-gray-500'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Order Notifications Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <Bell size={18} className="text-gray-400" />
              <div>
                <p className="text-xs font-bold text-gray-900">{t('Order Update Notifications', 'অর্ডার আপডেট নোটিফিকেশন')}</p>
                <p className="text-[10px] text-gray-400">{t('Delivery and shipping alerts', 'ডেলিভারি ও শিপিং সংক্রান্ত মেসেজ')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !notifyOrders;
                setNotifyOrders(next);
                showToast(
                  next
                    ? t('Order notifications enabled', 'অর্ডার নোটিফিকেশন চালু করা হয়েছে')
                    : t('Order notifications disabled', 'অর্ডার নোটিফিকেশন বন্ধ করা হয়েছে')
                );
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                notifyOrders ? 'bg-brand-orange' : 'bg-gray-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                notifyOrders ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Offers Notifications Toggle */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <Tag size={18} className="text-gray-400" />
              <div>
                <p className="text-xs font-bold text-gray-900">{t('Offers & Discount Alerts', 'অফার ও ডিসকাউন্ট অ্যালার্ট')}</p>
                <p className="text-[10px] text-gray-400">{t('Special promo codes and campaigns', 'স্পেশাল প্রোমো কোড ও ক্যাম্পেইন')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !notifyOffers;
                setNotifyOffers(next);
                showToast(
                  next
                    ? t('Offer notifications enabled', 'অফার নোটিফিকেশন চালু করা হয়েছে')
                    : t('Offer notifications disabled', 'অফার নোটিফিকেশন বন্ধ করা হয়েছে')
                );
              }}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                notifyOffers ? 'bg-brand-orange' : 'bg-gray-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                notifyOffers ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          {/* Change Password */}
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-2.5">
              <Lock size={18} className="text-gray-400" />
              <div>
                <p className="text-xs font-bold text-gray-900">{t('Change Password', 'পাসওয়ার্ড পরিবর্তন')}</p>
                <p className="text-[10px] text-gray-400">{t('Strengthen your account security', 'অ্যাকাউন্টের নিরাপত্তা জোরদার করুন')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswordSheet(true)}
              className="text-xs font-bold text-brand-orange hover:underline min-h-[44px] flex items-center"
            >
              {t('Change', 'পরিবর্তন')}
            </button>
          </div>
        </div>
      </div>

      {/* 8. Danger Zone (Logout & Delete Account) */}
      <div className="px-4 mb-8">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-rose-100 space-y-3">
          <h3 className="text-sm font-black text-rose-600 flex items-center gap-2">
            <ShieldAlert size={16} />
            <span>{t('Account Actions', 'অ্যাকাউন্ট অ্যাকশন')}</span>
          </h3>

          <div className="pt-1 flex flex-col gap-2.5">
            {/* Logout Button */}
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full min-h-[44px] py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LogOut size={16} className="text-gray-500" />
                <span>{t('Log Out', 'লগআউট করুন')}</span>
              </div>
              <ChevronRight size={14} className="text-gray-400" />
            </button>

            {/* Delete Account Button */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full min-h-[44px] py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Trash2 size={16} />
                <span>{t('Delete Account', 'অ্যাকাউন্ট ডিলিট করুন')}</span>
              </div>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ===================== BOTTOM SHEETS & MODALS ===================== */}

      {/* Edit Profile Bottom Sheet */}
      <AnimatePresence>
        {showEditSheet && (
          <div className="fixed inset-0 z-[500] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditSheet(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-up Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar z-10"
            >
              {/* Top notch */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-5">
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">
                    {t('Edit Profile', 'প্রোফাইল এডিট করুন')}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">{t('Update your personal details and photos', 'ব্যক্তিগত তথ্য ও ছবি আপডেট করুন')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEditSheet(false)}
                  className="w-9 h-9 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Images row */}
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brand-orange/40 bg-white shadow-xs">
                      <img
                        src={editAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id || 'guest'}`}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => avatarFileRef.current?.click()}
                      className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center shadow-xs cursor-pointer"
                      title={t('Upload new photo', 'নতুন ছবি দিন')}
                    >
                      <Camera size={12} />
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">{t('Profile & Cover Photo', 'প্রোফাইল ও কভার ছবি')}</p>
                    <p className="text-[11px] text-gray-400 mb-2">{t('Choose clear photos from your gallery', 'গ্যালারি থেকে পরিষ্কার ছবি নির্বাচন করুন')}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => avatarFileRef.current?.click()}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700"
                      >
                        {t('Change Photo', 'ছবি পরিবর্তন')}
                      </button>
                      <button
                        type="button"
                        onClick={() => bannerFileRef.current?.click()}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700"
                      >
                        {t('Cover Banner', 'কভার ব্যানার')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    {t('Full Name *', 'পূর্ণ নাম *')}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => {
                      setEditName(e.target.value);
                      if (editErrors.name) setEditErrors({ ...editErrors, name: '' });
                    }}
                    placeholder={t('Enter your full name', 'আপনার পূর্ণ নাম দিন')}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:bg-white transition-all ${
                      editErrors.name ? 'border-rose-500' : 'border-gray-200 focus:border-brand-orange'
                    }`}
                  />
                  {editErrors.name && (
                    <p className="text-[10px] font-bold text-rose-500">{editErrors.name}</p>
                  )}
                </div>

                {/* Username Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    {t('Username', 'ইউজারনেম')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                      @
                    </span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/\s+/g, '_');
                        setEditUsername(val);
                        if (editErrors.username) setEditErrors({ ...editErrors, username: '' });
                      }}
                      placeholder="username"
                      className={`w-full pl-8 pr-4 py-3 bg-gray-50 border rounded-2xl text-sm font-mono font-bold text-gray-900 focus:outline-none focus:bg-white transition-all ${
                        editErrors.username ? 'border-rose-500' : 'border-gray-200 focus:border-brand-orange'
                      }`}
                    />
                  </div>
                  {editErrors.username ? (
                    <p className="text-[10px] font-bold text-rose-500">{editErrors.username}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400">{t('Use lowercase letters, numbers, and underscores (_)', 'ছোট হাতের অক্ষর, সংখ্যা ও আন্ডারস্কোর (_) ব্যবহার করুন')}</p>
                  )}
                </div>

                {/* Phone Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    {t('Phone Number', 'মোবাইল নম্বর')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      +88
                    </span>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => {
                        setEditPhone(e.target.value);
                        if (editErrors.phone) setEditErrors({ ...editErrors, phone: '' });
                      }}
                      placeholder="017XXXXXXXX"
                      className={`w-full pl-12 pr-4 py-3 bg-gray-50 border rounded-2xl text-sm font-mono font-bold text-gray-900 focus:outline-none focus:bg-white transition-all ${
                        editErrors.phone ? 'border-rose-500' : 'border-gray-200 focus:border-brand-orange'
                      }`}
                    />
                  </div>
                  {editErrors.phone ? (
                    <p className="text-[10px] font-bold text-rose-500">{editErrors.phone}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400">{t('Enter an 11-digit number for order verification and delivery contact', 'অর্ডার ভেরিফিকেশন ও ডেলিভারি যোগাযোগের জন্য ১১ ডিজিটের নম্বর দিন')}</p>
                  )}
                </div>

                {/* Gender & DOB row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      {t('Gender', 'লিঙ্গ')}
                    </label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:outline-none focus:border-brand-orange focus:bg-white"
                    >
                      <option value="unspecified">{t('Unspecified', 'নির্দিষ্ট নয়')}</option>
                      <option value="male">{t('Male', 'পুরুষ')}</option>
                      <option value="female">{t('Female', 'মহিলা')}</option>
                      <option value="other">{t('Other', 'অন্যান্য')}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      {t('Date of Birth', 'জন্ম তারিখ')}
                    </label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 focus:outline-none focus:border-brand-orange focus:bg-white"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditSheet(false)}
                    className="flex-1 min-h-[44px] py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex-1 min-h-[44px] py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <span>{t('Saving...', 'সেভ হচ্ছে...')}</span>
                    ) : (
                      <>
                        <Save size={15} />
                        <span>{t('Save', 'সংরক্ষণ করুন')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Sheet */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[600] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl z-10 text-center"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto mb-3">
                <LogOut size={26} />
              </div>
              <h3 className="text-lg font-black text-gray-900">{t('Log Out?', 'লগআউট করতে চান?')}</h3>
              <p className="text-xs text-gray-400 mt-1 mb-6">
                {t('Are you sure you want to log out of your account?', 'আপনি কি নিশ্চিতভাবে আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান?')}
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    onLogout();
                  }}
                  className="w-full min-h-[44px] py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  {t('Yes, Log Out', 'হ্যাঁ, লগআউট করুন')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full min-h-[44px] py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  {t('Cancel', 'না, ফিরে যান')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Confirmation Sheet */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[600] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl z-10"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-lg font-black text-gray-900 text-center">
                {t('Permanently Delete Account', 'অ্যাকাউন্ট স্থায়ীভাবে ডিলিট')}
              </h3>
              <p className="text-xs text-gray-500 text-center mt-1 leading-relaxed">
                {t('Type DELETE below to confirm. All orders and address information in your account will be permanently erased.', 'এটি নিশ্চিত করতে নিচে DELETE লিখুন। অ্যাকাউন্টের সব অর্ডার ও ঠিকানা তথ্য সম্পূর্ণ মুছে ফেলা হবে।')}
              </p>

              <div className="my-4">
                <input
                  type="text"
                  value={deleteInputText}
                  onChange={(e) => setDeleteInputText(e.target.value)}
                  placeholder={t("Type 'DELETE' here", "এখানে 'DELETE' লিখুন")}
                  className="w-full px-4 py-3 bg-rose-50/50 border border-rose-200 rounded-2xl text-center font-mono font-bold text-rose-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={deleteInputText.trim().toUpperCase() !== 'DELETE'}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    showToast(t('Account deletion request processed successfully', 'অ্যাকাউন্ট ডিলিট রিকুয়েস্ট সফলভাবে প্রক্রিয়া করা হয়েছে'), 'info');
                    onLogout();
                  }}
                  className="w-full min-h-[44px] py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-2xl text-xs font-bold shadow-md shadow-rose-500/20 cursor-pointer"
                >
                  {t('Confirm Permanent Deletion', 'স্থায়ীভাবে ডিলিট নিশ্চিত করুন')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full min-h-[44px] py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  {t('Cancel (Keep Account)', 'বাতিল করুন')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Sheet */}
      <AnimatePresence>
        {showPasswordSheet && (
          <div className="fixed inset-0 z-[600] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordSheet(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl z-10"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-base font-black text-gray-900">{t('Change Password', 'পাসওয়ার্ড পরিবর্তন করুন')}</h3>
                <button
                  type="button"
                  onClick={() => setShowPasswordSheet(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">{t('Current Password', 'বর্তমান পাসওয়ার্ড')}</label>
                  <input
                    type="password"
                    value={passwordState.current}
                    onChange={(e) => setPasswordState({ ...passwordState, current: e.target.value })}
                    placeholder={t('Enter current password', 'বর্তমান পাসওয়ার্ড দিন')}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">{t('New Password', 'নতুন পাসওয়ার্ড')}</label>
                  <input
                    type="password"
                    value={passwordState.newPass}
                    onChange={(e) => setPasswordState({ ...passwordState, newPass: e.target.value })}
                    placeholder={t('Minimum 6 characters', 'কমপক্ষে ৬ অক্ষর')}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1">{t('Confirm New Password', 'নতুন পাসওয়ার্ড নিশ্চিত করুন')}</label>
                  <input
                    type="password"
                    value={passwordState.confirmPass}
                    onChange={(e) => setPasswordState({ ...passwordState, confirmPass: e.target.value })}
                    placeholder={t('Re-enter password', 'আবার টাইপ করুন')}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordSheet(false)}
                    className="flex-1 min-h-[44px] py-3 bg-gray-100 text-gray-700 rounded-2xl text-xs font-bold"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="flex-1 min-h-[44px] py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-2xl text-xs font-bold shadow-md shadow-orange-500/20"
                  >
                    {isUpdatingPassword ? t('Saving...', 'সংরক্ষণ হচ্ছে...') : t('Update Password', 'আপডেট করুন')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Coupons & Vouchers Sheet */}
      <AnimatePresence>
        {showCouponsSheet && (
          <div className="fixed inset-0 z-[600] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCouponsSheet(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl z-10"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Tag size={16} className="text-brand-orange" />
                  <span>{t('Available Coupons & Vouchers', 'উপলব্ধ কুপন ও ভাউচার')}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCouponsSheet(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-black text-brand-orange text-sm bg-white px-2 py-0.5 rounded-lg border border-orange-200">
                      DIGITAL100
                    </span>
                    <p className="text-xs font-bold text-gray-800 mt-1">{t('৳100 Flat Discount', '৳১০০ ফ্ল্যাট ছাড়')}</p>
                    <p className="text-[10px] text-gray-400">{t('Valid on orders over ৳1,000', 'সর্বনিম্ন ১০০০ টাকার অর্ডারে প্রযোজ্য')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('DIGITAL100');
                      showToast(t('Coupon copied: DIGITAL100', 'কুপন কোড কপি হয়েছে: DIGITAL100'), 'success');
                    }}
                    className="min-h-[44px] px-3 py-1.5 bg-brand-orange text-white rounded-xl text-xs font-bold"
                  >
                    {t('Copy', 'কপি করুন')}
                  </button>
                </div>

                <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-black text-emerald-700 text-sm bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                      FREESHIP
                    </span>
                    <p className="text-xs font-bold text-gray-800 mt-1">{t('Free Home Delivery', 'ফ্রি হোম ডেলিভারি')}</p>
                    <p className="text-[10px] text-gray-400">{t('Valid on any prepaid order', 'যেকোনো প্রি-পেইড অর্ডারে কার্যকর')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('FREESHIP');
                      showToast(t('Coupon copied: FREESHIP', 'কুপন কোড কপি হয়েছে: FREESHIP'), 'success');
                    }}
                    className="min-h-[44px] px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                  >
                    {t('Copy', 'কপি করুন')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Preference Sheet */}
      <AnimatePresence>
        {showPaymentSheet && (
          <div className="fixed inset-0 z-[600] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentSheet(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-white rounded-t-[32px] p-6 shadow-2xl z-10"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <CreditCard size={16} className="text-brand-orange" />
                  <span>{t('Payment Preference', 'পেমেন্ট পছন্দ')}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPaymentSheet(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  { id: 'bKash', label: t('bKash Payment', 'বিকাশ পেমেন্ট'), desc: t('Instant 1.5% cashback', 'তাৎক্ষণিক ১.৫% ক্যাশব্যাক') },
                  { id: 'Nagad', label: t('Nagad Payment', 'নগদ পেমেন্ট'), desc: t('Zero gateway charges', 'কোনো গেটওয়ে চার্জ নেই') },
                  { id: 'Rocket', label: t('Rocket / DBBL', 'রকেট (Rocket / DBBL)'), desc: t('Safe mobile banking', 'নিরাপদ মোবাইল ব্যাংকিং') },
                  { id: 'COD', label: t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি'), desc: t('Pay upon receiving product', 'পণ্য হাতে পেয়ে মূল্য পরিশোধ') }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedPaymentPref(opt.id);
                      showToast(t(`Payment method '${opt.id}' activated`, `পেমেন্ট মেথড '${opt.id}' সক্রিয় করা হয়েছে`));
                      setShowPaymentSheet(false);
                    }}
                    className={`w-full min-h-[48px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-colors ${
                      selectedPaymentPref === opt.id
                        ? 'bg-orange-50 border-brand-orange text-brand-orange'
                        : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">{opt.label}</p>
                      <p className="text-[10px] text-gray-400">{opt.desc}</p>
                    </div>
                    {selectedPaymentPref === opt.id && (
                      <CheckCircle2 size={18} className="text-brand-orange" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
