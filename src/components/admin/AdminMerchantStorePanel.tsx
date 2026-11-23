import React, { useState, useMemo } from 'react';
import { 
  Store, Package, ShoppingCart, DollarSign, Settings, ShieldCheck, 
  Ban, CheckCircle2, AlertTriangle, Eye, Edit2, Search, ExternalLink,
  ChevronRight, MapPin, Phone, Mail, Award, X, RefreshCw, Sliders, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Product, Order } from '../../types';
import { adminApi } from '../../services/api';
import { useToast } from '../Toast';
import { useLanguage } from '../../contexts/LanguageContext';

interface AdminMerchantStorePanelProps {
  merchantUser: User;
  allProducts: Product[];
  allOrders: Order[];
  onClose: () => void;
  onUpdateMerchant: (updated: User) => void;
  onOpenEditProduct?: (product: Product) => void;
}

export const AdminMerchantStorePanel: React.FC<AdminMerchantStorePanelProps> = ({
  merchantUser,
  allProducts,
  allOrders,
  onClose,
  onUpdateMerchant,
  onOpenEditProduct
}) => {
  const { showToast } = useToast();
  const { t, language, translateCategory } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'settings'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Editable store settings state
  const [storeName, setStoreName] = useState(merchantUser.shop?.name || '');
  const [storeDesc, setStoreDesc] = useState(merchantUser.shop?.description || '');
  const [storeCategory, setStoreCategory] = useState(merchantUser.shop?.category || 'General');
  const [contactNumber, setContactNumber] = useState(merchantUser.shop?.contactNumber || merchantUser.phone || '');
  const [fullAddress, setFullAddress] = useState(merchantUser.shop?.fullAddress || '');
  const [commissionRate, setCommissionRate] = useState<number>(merchantUser.shop?.commissionRate || 10);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Filter products belonging to this seller
  const merchantProducts = useMemo(() => {
    const storeNameLower = (merchantUser.shop?.name || '').trim().toLowerCase();
    return allProducts.filter(p => {
      if (p.isDeleted) return false;
      return p.seller?.id === merchantUser.id || 
             (p.seller?.name && p.seller.name.trim().toLowerCase() === storeNameLower);
    });
  }, [allProducts, merchantUser]);

  // Filter orders containing products from this merchant
  const merchantOrders = useMemo(() => {
    const productIds = new Set(merchantProducts.map(p => p.id));
    return allOrders.filter(o => {
      if (o.isDeleted) return false;
      return o.items?.some(item => productIds.has(item.id));
    });
  }, [allOrders, merchantProducts]);

  // Financial calculations
  const totalSalesRevenue = merchantOrders.reduce((sum, o) => {
    // Only count non-cancelled
    if (o.status === 'cancelled') return sum;
    const sellerItemSum = (o.items || [])
      .filter(item => merchantProducts.some(mp => mp.id === item.id))
      .reduce((sub, i) => sub + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
    return sum + (sellerItemSum || o.total || 0);
  }, 0);

  const estimatedEarnings = Math.round(totalSalesRevenue * (1 - (commissionRate / 100)));
  const totalOrdersCount = merchantOrders.length;
  const completedOrdersCount = merchantOrders.filter(o => o.status === 'delivered').length;

  const handleToggleSuspend = async () => {
    if (!merchantUser.shop) return;
    const isCurrentlyActive = merchantUser.shop.status === 'active';
    const nextStatus = isCurrentlyActive ? 'suspended' : 'active';
    setIsProcessing(true);
    try {
      const updatedShop = { ...merchantUser.shop, status: nextStatus as any };
      const updatedUser = { ...merchantUser, shop: updatedShop };
      await adminApi.updateUser(merchantUser.id, { shop: updatedShop });
      onUpdateMerchant(updatedUser);
      showToast(
        nextStatus === 'suspended'
          ? t('Merchant store suspended', 'মার্চেন্ট স্টোর স্থগিত করা হয়েছে')
          : t('Merchant store reactivated', 'মার্চেন্ট স্টোর পুনরায় সক্রিয় করা হয়েছে'),
        nextStatus === 'suspended' ? 'error' : 'success'
      );
    } catch (e) {
      showToast(t('Failed to update merchant status', 'মার্চেন্ট স্ট্যাটাস আপডেট করতে ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleVerified = async () => {
    if (!merchantUser.shop) return;
    const nextVerified = !merchantUser.shop.isVerified;
    setIsProcessing(true);
    try {
      const updatedShop = { ...merchantUser.shop, isVerified: nextVerified };
      const updatedUser = { ...merchantUser, shop: updatedShop };
      await adminApi.updateUser(merchantUser.id, { shop: updatedShop });
      onUpdateMerchant(updatedUser);
      showToast(
        nextVerified
          ? t('Merchant verification badge awarded', 'মার্চেন্ট ভেরিফিকেশন ব্যাজ প্রদান করা হয়েছে')
          : t('Merchant verification badge removed', 'মার্চেন্ট ভেরিফিকেশন ব্যাজ সরানো হয়েছে'),
        'success'
      );
    } catch (e) {
      showToast(t('Failed to toggle verification', 'ভেরিফিকেশন পরিবর্তন করতে ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantUser.shop) return;
    setIsProcessing(true);
    try {
      const updatedShop = {
        ...merchantUser.shop,
        name: storeName.trim(),
        description: storeDesc.trim(),
        category: storeCategory,
        contactNumber: contactNumber.trim(),
        fullAddress: fullAddress.trim(),
        commissionRate: Number(commissionRate) || 10
      };
      const updatedUser = { ...merchantUser, shop: updatedShop };
      await adminApi.updateUser(merchantUser.id, { shop: updatedShop });
      onUpdateMerchant(updatedUser);
      setIsEditingSettings(false);
      showToast(t('Store profile & commission rate saved', 'স্টোর প্রোফাইল ও কমিশন হার সংরক্ষিত হয়েছে'), 'success');
    } catch (e) {
      showToast(t('Failed to save store settings', 'স্টোর সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProductsList = merchantProducts.filter(p => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q));
  });

  const filteredOrdersList = merchantOrders.filter(o => {
    if (!orderSearch.trim()) return true;
    const q = orderSearch.toLowerCase();
    return o.id.toLowerCase().includes(q) || (o.address?.fullName && o.address.fullName.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md" 
        onClick={onClose} 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-6xl bg-[#0f0f17] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[92vh] text-left"
      >
        {/* Top Masquerade Banner for Admin */}
        <div className="bg-gradient-to-r from-amber-600/30 via-brand-orange/20 to-amber-600/30 border-b border-brand-orange/30 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
            <span className="w-2 h-2 rounded-full bg-brand-orange animate-ping" />
            <span>{t('Admin Storefront Console • Viewing as Merchant:', 'অ্যাডমিন স্টোরফ্রন্ট কনসোল • মার্চেন্ট হিসেবে দেখছেন:')} {merchantUser.shop?.name || merchantUser.name}</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Store Header / Hero */}
        <div className="relative bg-zinc-900 border-b border-white/10 shrink-0">
          {/* Banner image or default backdrop */}
          <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-zinc-900 via-neutral-900 to-zinc-900 overflow-hidden relative">
            {merchantUser.shop?.banner ? (
              <img src={merchantUser.shop.banner} alt={t('Banner', 'ব্যানার')} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/10 font-black text-6xl tracking-widest uppercase">
                {merchantUser.shop?.name || t('STORE', 'স্টোর')}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f17] via-transparent to-black/30" />
          </div>

          <div className="px-6 pb-5 pt-0 flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 relative z-10">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-[#161622] border-2 border-brand-orange/50 overflow-hidden shadow-xl shrink-0 flex items-center justify-center">
                {merchantUser.shop?.logo ? (
                  <img src={merchantUser.shop.logo} alt={t('Logo', 'লোগো')} className="w-full h-full object-cover" />
                ) : (
                  <Store size={36} className="text-brand-orange" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-black text-white tracking-tight">{merchantUser.shop?.name || merchantUser.name}</h2>
                  {merchantUser.shop?.isVerified && (
                    <span className="p-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30" title={t('Verified Merchant', 'ভেরিফায়েড মার্চেন্ট')}>
                      <ShieldCheck size={14} />
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    merchantUser.shop?.status === 'active' 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}>
                    {merchantUser.shop?.status === 'suspended' ? t('Suspended', 'স্থগিত') : t('Active', 'সক্রিয়')}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {t('Owner:', 'মালিক:')} <span className="text-white font-medium">{merchantUser.name || t('Merchant Owner', 'মার্চেন্ট মালিক')}</span> ({merchantUser.email}) • {t('Joined', 'যোগদান')} {new Date(merchantUser.joinedAt || Date.now()).toLocaleDateString(dateLocale)}
                </p>
              </div>
            </div>

            {/* Admin Overrides & Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleToggleVerified}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  merchantUser.shop?.isVerified 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' 
                    : 'bg-white/5 text-gray-300 border-white/10 hover:text-white'
                }`}
              >
                <Award size={14} />
                {merchantUser.shop?.isVerified ? t('Verified Seller', 'ভেরিফায়েড বিক্রেতা') : t('Mark Verified', 'ভেরিফায়েড করুন')}
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleToggleSuspend}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  merchantUser.shop?.status === 'active'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500 hover:text-white'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                }`}
              >
                {merchantUser.shop?.status === 'active' ? (
                  <>
                    <Ban size={14} /> {t('Suspend Store', 'স্টোর স্থগিত করুন')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> {t('Reactivate Store', 'স্টোর সক্রিয় করুন')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 border-t border-white/5 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'overview'
                  ? 'border-brand-orange text-brand-orange'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <DollarSign size={14} /> {t('Seller Dashboard & Wallet', 'বিক্রেতা ড্যাশবোর্ড ও ওয়ালেট')}
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'products'
                  ? 'border-brand-orange text-brand-orange'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Package size={14} /> {t('Full Product Catalog', 'সম্পূর্ণ পণ্যের ক্যাটালগ')} ({merchantProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'orders'
                  ? 'border-brand-orange text-brand-orange'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <ShoppingCart size={14} /> {t('Store Orders', 'স্টোর অর্ডার')} ({merchantOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === 'settings'
                  ? 'border-brand-orange text-brand-orange'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Settings size={14} /> {t('Store Profile & Policy', 'স্টোর প্রোফাইল ও নীতিমালা')}
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. OVERVIEW & EARNINGS TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('Gross Sales Revenue', 'মোট বিক্রয় আয়')}</p>
                  <p className="text-2xl font-black text-white font-mono">৳{totalSalesRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 mt-1">{t('Across all storefront orders', 'সব স্টোরফ্রন্ট অর্ডার জুড়ে')}</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">{t('Estimated Net Payout', 'আনুমানিক নিট পেমেন্ট')}</p>
                  <p className="text-2xl font-black text-emerald-300 font-mono">৳{estimatedEarnings.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-500 mt-1">{t(`After ${commissionRate}% platform fee`, `${commissionRate}% প্ল্যাটফর্ম ফি বাদে`)}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">{t('Active Catalog', 'সক্রিয় ক্যাটালগ')}</p>
                  <p className="text-2xl font-black text-blue-300">{merchantProducts.length} {t('items', 'টি পণ্য')}</p>
                  <p className="text-[10px] text-blue-500 mt-1">{merchantProducts.filter(p => p.status === 'approved').length} {t('approved & live', 'টি অনুমোদিত ও লাইভ')}</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">{t('Order Completion', 'অর্ডার সম্পন্নতার হার')}</p>
                  <p className="text-2xl font-black text-purple-300">
                    {totalOrdersCount > 0 ? `${Math.round((completedOrdersCount / totalOrdersCount) * 100)}%` : '100%'}
                  </p>
                  <p className="text-[10px] text-purple-500 mt-1">{t(`${completedOrdersCount} delivered of ${totalOrdersCount}`, `${totalOrdersCount}টির মধ্যে ${completedOrdersCount}টি ডেলিভারি`)}</p>
                </div>
              </div>

              {/* Business Credentials card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="text-brand-orange" size={16} /> {t('Official Seller Credentials & Details', 'অফিসিয়াল বিক্রেতা তথ্য ও প্রমাণপত্র')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">{t('Trade License:', 'ট্রেড লাইসেন্স:')}</span>
                    <p className="text-white font-mono font-medium">{merchantUser.shop?.tradeLicense || t('Not Submitted', 'জমা দেওয়া হয়নি')}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('NID Document:', 'এনআইডি নম্বর:')}</span>
                    <p className="text-white font-mono font-medium">{merchantUser.shop?.nid || t('Verified on file', 'নথিতে যাচাইকৃত')}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('Platform Commission:', 'প্ল্যাটফর্ম কমিশন:')}</span>
                    <p className="text-brand-orange font-bold font-mono">{commissionRate}%</p>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('Location / Region:', 'অবস্থান / অঞ্চল:')}</span>
                    <p className="text-white font-medium">
                      {merchantUser.shop?.district || t('Dhaka', 'ঢাকা')}, {merchantUser.shop?.division || t('Dhaka Division', 'ঢাকা বিভাগ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('Support Contact:', 'সাপোর্ট নম্বর:')}</span>
                    <p className="text-white font-mono">{merchantUser.shop?.contactNumber || merchantUser.phone || t('N/A', 'প্রযোজ্য নয়')}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">{t('Customer Rating:', 'গ্রাহক রেটিং:')}</span>
                    <p className="text-amber-400 font-bold">⭐ {(merchantUser.shop?.rating || 4.9).toFixed(1)} / 5.0</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. FULL PRODUCT CATALOG TAB */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="relative w-full sm:w-80">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("Search this seller's products...", 'এই বিক্রেতার পণ্য খুঁজুন...')}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <span className="text-xs text-gray-400 font-bold">
                  {t(`Showing ${filteredProductsList.length} products`, `${filteredProductsList.length}টি পণ্য দেখাচ্ছে`)}
                </span>
              </div>

              {filteredProductsList.length === 0 ? (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 text-gray-400 text-xs">
                  {t("No products in this merchant's catalog matching your query.", 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো পণ্য এই মার্চেন্টের ক্যাটালগে নেই।')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProductsList.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3.5 hover:border-brand-orange/40 transition-all group"
                    >
                      <img 
                        src={prod.image} 
                        alt={prod.name} 
                        className="w-20 h-20 rounded-xl object-cover bg-black/40 shrink-0 border border-white/5" 
                      />
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-bold text-white line-clamp-1 group-hover:text-brand-orange transition-colors">
                              {prod.name}
                            </h5>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 ${
                              prod.status === 'approved' 
                                ? 'bg-emerald-500/20 text-emerald-400' 
                                : prod.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {prod.status === 'approved' ? t('Approved', 'অনুমোদিত') : prod.status === 'rejected' ? t('Rejected', 'বাতিল') : t('Pending', 'অপেক্ষমাণ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{translateCategory(prod.category)}</p>
                        </div>

                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <span className="text-xs font-black text-white font-mono">৳{prod.price?.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{t('Stock:', 'স্টক:')} {prod.stock ?? 50}</span>
                          {onOpenEditProduct && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenEditProduct(prod);
                              }}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-brand-orange text-gray-300 hover:text-white text-[10px] font-bold transition-all cursor-pointer"
                            >
                              {t('Edit Item', 'এডিট করুন')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. STORE ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="relative w-full sm:w-80">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={t('Search by Order ID or Customer...', 'অর্ডার আইডি বা গ্রাহক দিয়ে খুঁজুন...')}
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange"
                  />
                </div>
                <span className="text-xs text-gray-400 font-bold">
                  {t(`${filteredOrdersList.length} orders contain items from this store`, `${filteredOrdersList.length}টি অর্ডারে এই স্টোরের পণ্য রয়েছে`)}
                </span>
              </div>

              {filteredOrdersList.length === 0 ? (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 text-gray-400 text-xs">
                  {t('No orders found for this merchant.', 'এই মার্চেন্টের কোনো অর্ডার পাওয়া যায়নি।')}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrdersList.map(order => (
                    <div 
                      key={order.id} 
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white font-mono uppercase">#{order.id.slice(0, 10)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-orange/20 text-brand-orange'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {t('Customer:', 'গ্রাহক:')} <span className="text-white font-medium">{order.address?.fullName || t('Customer', 'গ্রাহক')}</span> • {order.address?.phone || t('No phone', 'ফোন নেই')}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 self-end sm:self-auto">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{t('Order Total', 'মোট অর্ডার')}</p>
                          <p className="text-sm font-black text-white font-mono">৳{(order.total || 0).toLocaleString()}</p>
                        </div>
                        <span className="text-[11px] text-gray-500">{order.date || t('Recent', 'সাম্প্রতিক')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. STORE SETTINGS & PROFILE TAB */}
          {activeTab === 'settings' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6 max-w-3xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">{t('Storefront Information & Terms', 'স্টোরফ্রন্ট তথ্য ও শর্তাবলী')}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{t("Admin can directly adjust this seller's settings, contact, and commission.", 'অ্যাডমিন সরাসরি এই বিক্রেতার সেটিংস, যোগাযোগ ও কমিশন পরিবর্তন করতে পারবেন।')}</p>
                </div>
                {!isEditingSettings && (
                  <button
                    onClick={() => setIsEditingSettings(true)}
                    className="px-4 py-2 rounded-xl bg-brand-orange text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 size={13} /> {t('Edit Settings', 'সেটিংস এডিট করুন')}
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveStoreSettings} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Store Name', 'স্টোরের নাম')}</label>
                    <input
                      type="text"
                      disabled={!isEditingSettings}
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-xs text-white disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Store Category', 'স্টোর ক্যাটাগরি')}</label>
                    <input
                      type="text"
                      disabled={!isEditingSettings}
                      value={storeCategory}
                      onChange={(e) => setStoreCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-xs text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Contact Phone', 'যোগাযোগের ফোন')}</label>
                    <input
                      type="text"
                      disabled={!isEditingSettings}
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-xs text-white disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Platform Commission Rate (%)', 'প্ল্যাটফর্ম কমিশন হার (%)')}</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      disabled={!isEditingSettings}
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-xs text-white disabled:opacity-50 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Physical Store Address', 'স্টোরের ঠিকানা')}</label>
                  <input
                    type="text"
                    disabled={!isEditingSettings}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-xs text-white disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Store Biography / About', 'স্টোর পরিচিতি / বিবরণ')}</label>
                  <textarea
                    rows={3}
                    disabled={!isEditingSettings}
                    value={storeDesc}
                    onChange={(e) => setStoreDesc(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white disabled:opacity-50"
                  />
                </div>

                {isEditingSettings && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsEditingSettings(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold"
                    >
                      {t('Cancel', 'বাতিল')}
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="px-5 py-2 rounded-xl bg-brand-orange text-white text-xs font-bold uppercase tracking-wider"
                    >
                      {isProcessing ? t('Saving...', 'সংরক্ষণ হচ্ছে...') : t('Save Settings', 'সেটিংস সংরক্ষণ করুন')}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
