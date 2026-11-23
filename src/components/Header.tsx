import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ShoppingBag, Search, User, Menu, MapPin, X, Smartphone, Store, LifeBuoy, 
  ChevronRight, CheckCircle2, Apple, Play, ArrowLeft, Banknote, Zap, Heart, 
  Package, LayoutDashboard, LogOut, ShieldCheck, Tag, Star, TrendingUp, Sparkles, Settings, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { User as UserType, Product } from '../types';
import { PRODUCTS } from '../constants';
import { configApi, couponApi } from '../services/api';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { isSuperAdminEmail } from '../constants/adminConfig';
import { authClient } from '../lib/auth-client';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  onCartClick: () => void;
  onWishlistClick: () => void;
  onLoginClick: () => void;
  onOrderHistoryClick: () => void;
  onLogout?: () => void;
  onSearch: (query: string) => void;
  user: UserType | null;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
}

const POPULAR_SEARCHES = [
  'Cotton Crew Neck T-Shirt',
  'Graphic Winter Hoodie',
  'Leather Watch',
  'Wireless Earbuds',
  'Slim Fit Denim Jeans',
  'Air Fryer 4.5L',
  'Silk Moisture Shampoo',
  'Running Shoes'
];

export const Header: React.FC<HeaderProps> = ({ 
  cartCount, 
  wishlistCount,
  onCartClick, 
  onWishlistClick, 
  onLoginClick, 
  onOrderHistoryClick,
  onLogout,
  onSearch, 
  user,
  products = PRODUCTS,
  onSelectProduct
}) => {
  const navigate = useNavigate();
  const { siteConfig } = useSiteConfig();
  const { t, translateCategory } = useLanguage();
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeTab, setActiveTab] = useState<'app' | 'seller' | 'support' | 'affiliate' | null>(null);
  const [activeSupportItem, setActiveSupportItem] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [isAnnouncementDismissed, setIsAnnouncementDismissed] = useState(false);
  const [appDownloadMsg, setAppDownloadMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);

  useEffect(() => {
    couponApi.getPublicCoupons().then(res => {
      if (Array.isArray(res) && res.length > 0) {
        setActiveCoupons(res);
      }
    }).catch(() => {});
  }, []);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsUserMenuOpen(false);
    setIsMobileDrawerOpen(false);
    try {
      localStorage.removeItem('elora-user');
      localStorage.removeItem('elora-admin-token');
      sessionStorage.clear();
    } catch {}
    try {
      if (onLogout) {
        await onLogout();
      }
    } catch (err) {
      console.warn('onLogout callback notice:', err);
    }
    try {
      await authClient.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    navigate('/');
  };

  useEffect(() => {
    let ticking = false;
    let lastScrolled = typeof window !== 'undefined' ? window.scrollY > 40 : false;
    if (lastScrolled) {
      setIsScrolled(true);
    }
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          const nextScrolled = lastScrolled ? y > 12 : y > 40;
          if (nextScrolled !== lastScrolled) {
            lastScrolled = nextScrolled;
            setIsScrolled(nextScrolled);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await configApi.getConfig();
        if (config) {
          setAnnouncementText(config.announcementText || '');
          setAnnouncementActive(!!config.announcementActive);
        }
      } catch (err) {
        console.error('Error fetching announcement:', err);
      }
    };
    fetchConfig();
  }, []);

  // Reset sub-tab when main tab closes
  useEffect(() => {
    if (!activeTab) setActiveSupportItem(null);
  }, [activeTab]);

  // Click outside listeners - ONLY active when search is focused or user menu is open
  useEffect(() => {
    if (!isSearchFocused && !isUserMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (isSearchFocused && searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsSearchFocused(false);
      }
      if (isUserMenuOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchFocused, isUserMenuOpen]);

  // Filter autocomplete suggestions
  const suggestedProducts = useMemo(() => {
    if (!searchValue.trim()) return [];
    const query = searchValue.toLowerCase().trim();
    const source = products && products.length > 0 ? products : PRODUCTS;
    return source
      .filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      )
      .slice(0, 5);
  }, [searchValue, products]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchValue.trim()) {
      setIsSearchFocused(false);
      setMobileSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleSuggestionClick = (product: Product) => {
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      navigate(`/search?q=${encodeURIComponent(product.name)}`);
    }
  };

  const handleKeywordClick = (keyword: string) => {
    setSearchValue(keyword);
    setIsSearchFocused(false);
    setMobileSearchOpen(false);
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <>
      {/* Dynamic Announcement Broadcast (scrolls naturally above sticky navbar) */}
      {((siteConfig?.announcementActive ?? announcementActive) && (siteConfig?.announcementText || announcementText) && !isAnnouncementDismissed) && (
        <div className="w-full max-w-full box-border bg-gradient-to-r from-orange-600 via-brand-orange to-amber-500 text-white px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-4 shadow-2xs relative overflow-hidden">
          <div className="flex-1 min-w-0 flex items-center justify-center">
            <span className="text-[11px] sm:text-xs font-sans font-semibold leading-snug tracking-normal truncate">
              {siteConfig?.announcementText || announcementText}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAnnouncementDismissed(true)}
            className="text-white/85 hover:text-white p-1 hover:bg-white/15 rounded-full transition-colors shrink-0 cursor-pointer"
            aria-label={t('Dismiss notification', 'বার্তা বন্ধ করুন')}
            title={t('Dismiss notification', 'বার্তা বন্ধ করুন')}
          >
            <X size={14} className="stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Top Utility Bar (Desktop only, scrolls naturally above sticky navbar) */}
      <div className="w-full max-w-full box-border bg-gray-50 px-4 md:px-6 py-1.5 border-b border-gray-200/70 hidden md:block">
        <div className="max-w-7xl w-full mx-auto flex flex-nowrap justify-between items-center gap-x-4 text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap overflow-x-auto no-scrollbar">
          <div className="flex items-center flex-nowrap gap-2 sm:gap-3 md:gap-4 shrink-0">
            <button 
              onClick={() => setActiveTab('app')} 
              className="text-brand-orange hover:text-brand-orange-light transition-all flex items-center gap-1 sm:gap-1.5 group cursor-pointer shrink-0"
            >
              <Smartphone size={12} className="group-hover:scale-110 transition-transform text-brand-orange shrink-0" />
              <span className="font-semibold">{t('Save More on App', 'অ্যাপে বেশি সাশ্রয়')}</span>
            </button>
            <span className="text-gray-300 select-none shrink-0">|</span>
            <button 
              onClick={() => setActiveTab('seller')} 
              className="hover:text-brand-orange transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Store size={12} className="text-gray-400 shrink-0" />
              <span>{t('Become a Seller', 'সেলার হোন')}</span>
            </button>
            <span className="text-gray-300 select-none shrink-0">|</span>
            <button 
              onClick={() => setActiveTab('support')} 
              className="hover:text-brand-orange transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <LifeBuoy size={12} className="text-gray-400 shrink-0" />
              <span>{t('Help & Support', 'সাহায্য ও সাপোর্ট')}</span>
            </button>
          </div>
          
          <div className="flex items-center flex-nowrap gap-2 sm:gap-3 md:gap-4 shrink-0">
            <button 
              onClick={() => setActiveTab('affiliate')} 
              className="text-brand-orange hover:text-orange-600 transition-colors font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Sparkles size={11} className="text-brand-orange shrink-0" />
              <span>{t('Digital Shop T.M Affiliate Program', 'অ্যাফিলিয়েট প্রোগ্রাম')}</span>
            </button>
            <span className="text-gray-300 select-none shrink-0">|</span>
            <span className="text-gray-400 font-mono text-[9.5px] sm:text-[10px] shrink-0">{t('Official BDT Store', 'অফিশিয়াল স্টোর (৳)')}</span>
          </div>
        </div>
      </div>
      
      {/* Info Modals */}
      <AnimatePresence>
        {activeTab && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTab(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl z-10"
            >
              <button 
                onClick={() => setActiveTab(null)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors z-20 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>

              {activeTab === 'app' && (
                <div className="p-8 sm:p-10 text-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-brand-orange">
                    <Smartphone size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight font-display">{t('Save More on App', 'অ্যাপে আরও বেশি সাশ্রয় করুন')}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8">
                    {t(
                      'Get exclusive app-only deals, early access to flash sales, and ৳200 bonus voucher on your first order.',
                      'শুধুমাত্র অ্যাপ ব্যবহারকারীদের জন্য এক্সক্লুসিভ ডিল, ফ্ল্যাশ সেলে আগাম প্রবেশাধিকার এবং প্রথম অর্ডারে ৳২০০ বোনাস ভাউচার পান।'
                    )}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button 
                      onClick={() => {
                        setAppDownloadMsg(t(
                          'Apple iOS App: Open in Safari, tap the Share icon [↑], and tap "Add to Home Screen" to install Digital Shop T.M instantly!',
                          'অ্যাপল আইওএস অ্যাপ: সাফারিতে খুলুন, শেয়ার আইকন [↑] ট্যাপ করে "Add to Home Screen" নির্বাচন করুন!'
                        ));
                      }}
                      className="bg-gray-900 text-white p-4 rounded-2xl flex items-center gap-3 hover:bg-gray-800 transition-all text-left group cursor-pointer"
                    >
                      <Apple size={22} className="group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-[8px] font-black uppercase text-gray-400">{t('Download on', 'ডাউনলোড করুন')}</p>
                        <p className="text-xs font-bold font-sans">App Store</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => {
                        setAppDownloadMsg(t(
                          'Android Google Play / PWA: Tap Chrome menu [⋮] and select "Install App" or "Add to Home Screen" to install on your Android device!',
                          'অ্যান্ড্রয়েড অ্যাপ: ক্রোম মেনু [⋮] ট্যাপ করে "Install App" বা "Add to Home Screen" নির্বাচন করে ইনস্টল করুন!'
                        ));
                      }}
                      className="bg-gray-900 text-white p-4 rounded-2xl flex items-center gap-3 hover:bg-gray-800 transition-all text-left group cursor-pointer"
                    >
                      <Play size={20} className="group-hover:scale-110 transition-transform text-brand-orange" />
                      <div>
                        <p className="text-[8px] font-black uppercase text-gray-400">{t('Get it on', 'সংগ্রহ করুন')}</p>
                        <p className="text-xs font-bold font-sans">Google Play</p>
                      </div>
                    </button>
                  </div>

                  {appDownloadMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-950 text-left font-medium mb-4 space-y-1"
                    >
                      <p className="font-bold flex items-center gap-1.5 text-brand-orange">
                        <Smartphone size={14} /> {t('Quick Installation Guide:', 'দ্রুত ইনস্টলেশন গাইড:')}
                      </p>
                      <p className="text-[11px] text-gray-700 leading-relaxed">{appDownloadMsg}</p>
                    </motion.div>
                  )}

                  <button
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(window.location.origin);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      } catch {}
                    }}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check size={14} className="text-emerald-600" />
                        <span className="text-emerald-600">{t('App Link Copied to Clipboard!', 'অ্যাপ লিংক কপি হয়েছে!')}</span>
                      </>
                    ) : (
                      <span>{t('Copy Direct Web App Link', 'ওয়েব অ্যাপ লিংক কপি করুন')}</span>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'seller' && (
                <div className="p-8 sm:p-10">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-5 text-brand-orange">
                    <Store size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight font-display">{t('Become a Verified Seller', 'ভেরিফায়েড সেলার হোন')}</h3>
                  <p className="text-gray-500 text-sm mb-6">{t("Join Bangladesh's premier luxury marketplace and expand your brand reach.", 'বাংলাদেশের শীর্ষ মার্কেটপ্লেসে যোগ দিন এবং আপনার ব্যবসা প্রসারিত করুন।')}</p>
                  
                  <div className="space-y-3.5 mb-8">
                    {(t('en', 'bn') === 'bn'
                      ? [
                          '০% রেজিস্ট্রেশন ফি এবং কোনো মাসিক চার্জ নেই',
                          'প্রতিদিন ১,০০,০০০+ সক্রিয় ক্রেতার কাছে পৌঁছানোর সুযোগ',
                          'সারা দেশে কুরিয়ার লজিস্টিকস এবং পরের দিনেই পেমেন্ট',
                          'লাইভ ইনভেন্টরি অ্যানালিটিক্সসহ ডেডিকেটেড মার্চেন্ট পোর্টাল'
                        ]
                      : [
                          '0% registration fee & no monthly maintenance charges',
                          'Access to over 100,000+ verified active shoppers daily',
                          'Integrated nationwide logistics & secure next-day payouts',
                          'Dedicated merchant portal with live inventory analytics'
                        ]
                    ).map((text, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                        <span className="text-xs font-medium text-gray-700 leading-snug">{text}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => {
                      setActiveTab(null);
                      navigate('/profile');
                    }}
                    className="w-full bg-brand-orange text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-orange-light transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
                  >
                    {t('Start Selling on Digital Shop T.M', 'বিক্রি শুরু করুন')}
                  </button>
                </div>
              )}

              {activeTab === 'affiliate' && (
                <div className="p-8 sm:p-10">
                  <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 text-amber-600">
                    <Sparkles size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight font-display">{t('Digital Shop T.M Affiliate Program', 'অ্যাফিলিয়েট প্রোগ্রাম')}</h3>
                  <p className="text-gray-500 text-sm mb-6">{t('Earn up to 12% commission by sharing products and lifestyle picks with your audience.', 'পণ্য শেয়ার করে সর্বোচ্চ ১২% পর্যন্ত কমিশন আয় করুন।')}</p>
                  
                  <div className="space-y-3 mb-8">
                    <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">{t('Fashion & Lifestyle Apparel', 'ফ্যাশন ও লাইফস্টাইল পোশাক')}</span>
                      <span className="text-xs font-black text-brand-orange font-mono">10% - 12%</span>
                    </div>
                    <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">{t('Watches & Accessories', 'ঘড়ি ও এক্সেসরিজ')}</span>
                      <span className="text-xs font-black text-brand-orange font-mono">8% - 10%</span>
                    </div>
                    <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">{t('Appliances & Electronics', 'ইলেকট্রনিক্স ও অ্যাপ্লায়েন্স')}</span>
                      <span className="text-xs font-black text-brand-orange font-mono">5% - 7%</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveTab(null);
                      navigate('/profile');
                    }}
                    className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all cursor-pointer"
                  >
                    {t('Join Partner Network', 'পার্টনার নেটওয়ার্কে যোগ দিন')}
                  </button>
                </div>
              )}

              {activeTab === 'support' && (
                <div className="p-8 sm:p-10">
                  <AnimatePresence mode="wait">
                    {!activeSupportItem ? (
                      <motion.div
                        key="main-support"
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 15 }}
                      >
                        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-5 text-brand-orange">
                          <LifeBuoy size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight font-display">{t('Help & Customer Care', 'সাহায্য ও কাস্টমার কেয়ার')}</h3>
                        <p className="text-gray-500 text-sm mb-6">{t('Our dedicated luxury shopping concierges are available 24/7.', 'আমাদের কাস্টমার সাপোর্ট টিম ২৪/৭ আপনার সেবায় নিয়োজিত।')}</p>
                        
                        <div className="grid grid-cols-1 gap-2 mb-8">
                          {[
                            { id: 'track', label: t('Track My Order Status', 'অর্ডার স্ট্যাটাস ট্র্যাক করুন'), icon: <MapPin size={16} /> },
                            { id: 'return', label: t('7-Day Return & Replacement Policy', '৭ দিনের রিটার্ন ও রিপ্লেসমেন্ট নীতি'), icon: <ArrowLeft size={16} /> },
                            { id: 'payment', label: t('bKash, Nagad & Card Payment Guide', 'বিকাশ, নগদ ও কার্ড পেমেন্ট গাইড'), icon: <Banknote size={16} /> },
                            { id: 'coupon', label: t('Promo Codes & Voucher Application', 'প্রোমো কোড ও ভাউচার ব্যবহার'), icon: <Zap size={16} /> }
                          ].map((item, i) => (
                            <button 
                              key={i} 
                              onClick={() => setActiveSupportItem(item.id)}
                              className="w-full text-left p-3.5 rounded-xl border border-gray-100 hover:border-brand-orange/40 hover:bg-orange-50/40 transition-all flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-gray-400 group-hover:text-brand-orange transition-colors">{item.icon}</span>
                                <span className="text-xs font-bold text-gray-700">{item.label}</span>
                              </div>
                              <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-orange" />
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => {
                              setActiveTab(null);
                              onOrderHistoryClick();
                            }}
                            className="flex-1 bg-brand-orange text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-brand-orange-light transition-all cursor-pointer"
                          >
                            {t('My Orders', 'আমার অর্ডার')}
                          </button>
                          <button 
                            onClick={() => setActiveTab(null)}
                            className="flex-1 bg-gray-100 text-gray-800 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-gray-200 transition-all cursor-pointer"
                          >
                            {t('Close', 'বন্ধ করুন')}
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="support-detail"
                        initial={{ opacity: 0, x: 15 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -15 }}
                      >
                        <button 
                          onClick={() => setActiveSupportItem(null)}
                          className="flex items-center gap-2 text-xs font-bold text-brand-orange uppercase tracking-wider mb-6 hover:gap-3 transition-all cursor-pointer"
                        >
                          <ArrowLeft size={16} /> {t('Back to Support Directory', 'সাপোর্ট মেনুতে ফিরে যান')}
                        </button>
                        
                        {activeSupportItem === 'track' && (
                          <div className="space-y-4">
                            <h4 className="text-xl font-black text-gray-900 font-display">{t('Track Your Order', 'অর্ডার ট্র্যাক করুন')}</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {t(
                                'You can track your order in real-time from the My Orders section. Once your parcel leaves our central Dhaka fulfillment center, you will receive an SMS and in-app tracking update (1-2 days Dhaka, 2-4 days Nationwide).',
                                'আপনি "আমার অর্ডার" সেকশন থেকে রিয়েল-টাইম অর্ডার ট্র্যাক করতে পারবেন। ঢাকায় ১-২ দিন এবং সারা দেশে ২-৪ দিনের মধ্যে ডেলিভারি হয়।'
                              )}
                            </p>
                            <button 
                              onClick={() => {
                                setActiveTab(null);
                                onOrderHistoryClick();
                              }}
                              className="w-full bg-brand-orange text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-widest cursor-pointer hover:bg-brand-orange-light"
                            >
                              {t('Open My Orders Log', 'অর্ডার তালিকা দেখুন')}
                            </button>
                          </div>
                        )}

                        {activeSupportItem === 'return' && (
                          <div className="space-y-4">
                            <h4 className="text-xl font-black text-gray-900 font-display">{t('7-Day Free Returns', '৭ দিনের ফ্রি রিটার্ন')}</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {t(
                                "If your purchased item doesn't fit or matches the description incorrectly, you are entitled to a 100% free return or replacement within 7 calendar days of delivery.",
                                'পণ্য সাইজ অনুযায়ী না হলে বা বিবরণের সাথে না মিললে ডেলিভারির ৭ দিনের মধ্যে ১০০% ফ্রি রিটার্ন বা রিপ্লেসমেন্ট পাবেন।'
                              )}
                            </p>
                            <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500 font-mono">
                              {t('Required: Original packaging, intact tags, and invoice receipt.', 'শর্তাবলী: আসল প্যাকেজিং, অক্ষত ট্যাগ এবং ইনভয়েস থাকতে হবে।')}
                            </div>
                          </div>
                        )}

                        {activeSupportItem === 'payment' && (
                          <div className="space-y-4">
                            <h4 className="text-xl font-black text-gray-900 font-display">{t('Payment Options', 'পেমেন্ট মাধ্যম')}</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {t(
                                'We accept Cash on Delivery (COD) nationwide across Bangladesh, along with instant bKash, Nagad, Rocket, Visa, and Mastercard with 256-bit SSL encryption.',
                                'আমরা সারা দেশে ক্যাশ অন ডেলিভারি (COD) এবং তাৎক্ষণিক বিকাশ, নগদ, রকেট, ভিসা ও মাস্টারকার্ড পেমেন্ট গ্রহণ করি।'
                              )}
                            </p>
                          </div>
                        )}

                        {activeSupportItem === 'coupon' && (
                          <div className="space-y-4">
                            <h4 className="text-xl font-black text-gray-900 font-display">{t('Coupons & Discounts', 'কুপন ও ডিসকাউন্ট')}</h4>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {t('Apply active promotional codes at checkout to unlock instant cart reductions:', 'চেকআউটে প্রোমো কোড ব্যবহার করে তাৎক্ষণিক ছাড় পান:')}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {(activeCoupons.length > 0 ? activeCoupons : [
                                { code: 'WELCOME50', discount: 50, discountType: 'fixed', minSpend: 500 },
                                { code: 'LUXURY10', discount: 10, discountType: 'percentage', minSpend: 1000 },
                                { code: 'SAVE200', discount: 200, discountType: 'fixed', minSpend: 2000 },
                                { code: 'EID2026', discount: 15, discountType: 'percentage', minSpend: 1500 },
                              ]).map((c: any) => (
                                <div key={c.code} className="p-2.5 bg-orange-50/70 border border-orange-200/80 rounded-xl flex items-center justify-between">
                                  <div>
                                    <span className="font-mono font-black text-brand-orange text-xs tracking-wider">{c.code}</span>
                                    <p className="text-[10px] text-gray-500">
                                      {c.discountType === 'percentage' ? `${c.discount}% ${t('OFF', 'ছাড়')}` : `৳${c.discount} ${t('OFF', 'ছাড়')}`}
                                      {c.minSpend ? ` (${t('Min', 'সর্বনিম্ন')} ৳${Number(c.minSpend).toLocaleString()})` : ''}
                                    </p>
                                  </div>
                                  <span className="text-[9px] uppercase tracking-wider font-bold bg-white text-gray-700 px-2 py-1 rounded-md border border-gray-200">
                                    {t('Active', 'সক্রিয়')}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Sticky Main Header (constant height to guarantee zero scroll layout jump) */}
      <header
        className={`sticky top-0 z-[200] w-full max-w-full shrink-0 box-border bg-white border-b transition-[box-shadow,border-color] duration-200 font-sans ${
          isScrolled
            ? 'shadow-md border-gray-200/90'
            : 'shadow-2xs border-gray-100'
        }`}
      >
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 h-16 md:h-[72px] flex items-center justify-between gap-2 sm:gap-3 lg:gap-5 box-border min-w-0">

          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="md:hidden w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/80 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label={t('Open Navigation Menu', 'নেভিগেশন মেনু খুলুন')}
          >
            <Menu size={18} />
          </button>

          {/* Brand Logo */}
          <button
            type="button"
            aria-label={`Go to ${siteConfig?.siteName || 'Digital Shop T.M'} homepage`}
            className="shrink-0 cursor-pointer flex items-center gap-2 group select-none mr-auto md:mr-0 text-left bg-transparent border-0 p-0"
            onClick={() => navigate('/')}
            id="header-brand-logo"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#EA580C] via-brand-orange to-[#FBBF24] flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:shadow-lg transition-shadow duration-200 overflow-hidden shrink-0">
              {siteConfig?.siteLogo ? (
                <img src={siteConfig.siteLogo} alt={`${siteConfig?.siteName || 'Digital Shop T.M'} Brand Logo`} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="font-luxury font-black tracking-tighter text-lg md:text-xl">
                  {siteConfig?.siteName?.charAt(0) || 'D'}
                </span>
              )}
            </div>
            {/* Brand text: Hidden on mobile & tablet (<lg), visible on desktop (lg+) */}
            <div className="hidden lg:flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-black tracking-tight text-gray-900 font-luxury leading-none group-hover:text-brand-orange transition-colors duration-200 truncate max-w-[190px] lg:max-w-none text-lg xl:text-2xl">
                  {siteConfig?.siteName || 'Digital Shop T.M'}
                </span>
                <span className="text-[8.5px] font-black uppercase tracking-wider bg-orange-100 text-brand-orange px-1.5 py-0.5 rounded font-mono shrink-0">
                  OFFICIAL
                </span>
              </div>
              <span className="font-extrabold uppercase tracking-[0.16em] lg:tracking-[0.2em] text-gray-400 font-mono truncate max-w-[190px] lg:max-w-none text-[8px] -mt-0.5">
                {siteConfig?.siteTagline || 'Digital Shop T.M — Your Trusted Digital Marketplace'}
              </span>
            </div>
          </button>

          {/* Tablet & Desktop Responsive Search Bar with Autosuggestions */}
          <div
            ref={searchContainerRef}
            className="flex-1 min-w-0 w-full md:max-w-none lg:max-w-xl xl:max-w-2xl hidden md:block relative z-50 mx-1 md:mx-2 lg:mx-3"
          >
            <form
              onSubmit={handleSearchSubmit}
              className={`w-full min-w-0 flex items-center bg-gray-100/90 rounded-2xl border-2 transition-colors duration-200 overflow-hidden ${
                isSearchFocused ? 'border-brand-orange bg-white shadow-lg shadow-orange-500/10' : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className={`pl-3.5 shrink-0 transition-colors ${isSearchFocused ? 'text-brand-orange' : 'text-gray-400'}`}>
                <Search size={17} />
              </div>
              <input
                type="text"
                placeholder={t('Search products, brands, gadgets...', 'পণ্য, ব্র্যান্ড বা গ্যাজেট খুঁজুন...')}
                className="flex-1 min-w-0 w-full bg-transparent border-none outline-none px-3 py-2.5 text-sm font-medium text-gray-800 placeholder:text-gray-400 placeholder:truncate"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              id="main-search-input"
              autoComplete="off"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue('')}
                className="p-1 hover:bg-gray-200/80 rounded-full text-gray-400 hover:text-gray-600 transition-all mr-1.5 shrink-0 cursor-pointer"
                title={t('Clear search', 'সার্চ মুছুন')}
              >
                <X size={14} />
              </button>
            )}
            <button 
              type="submit"
              className="bg-brand-orange hover:bg-brand-orange-light text-white px-4 md:px-5 lg:px-6 self-stretch font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <span>{t('Search', 'খুঁজুন')}</span>
            </button>
          </form>

          {/* Autocomplete / Search Suggestions Popup */}
          <AnimatePresence>
            {isSearchFocused && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 divide-y divide-gray-50 min-w-[300px] max-h-[75vh] overflow-y-auto custom-scrollbar"
              >
                {/* When user has typed a query and there are matching products */}
                {searchValue.trim() && suggestedProducts.length > 0 && (
                  <div className="p-3">
                    <div className="flex items-center justify-between px-3 py-1.5 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 font-mono">{t('Suggested Products', 'প্রস্তাবিত পণ্য')}</span>
                      <span className="text-[10px] text-brand-orange font-bold font-mono">{suggestedProducts.length} {t('Results', 'টি ফলাফল')}</span>
                    </div>
                    <div className="space-y-1 max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
                      {suggestedProducts.map((p) => (
                        <button 
                          key={p.id}
                          type="button"
                          aria-label={`Select product: ${p.name}`}
                          onClick={() => handleSuggestionClick(p)}
                          className="w-full flex items-center gap-3.5 p-2 rounded-xl hover:bg-orange-50/70 transition-all cursor-pointer group text-left bg-transparent border-0"
                        >
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            className="w-11 h-11 rounded-lg object-cover bg-gray-100 shrink-0 border border-gray-100 group-hover:scale-105 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-gray-800 truncate group-hover:text-brand-orange transition-colors">
                              {p.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.2 rounded">
                                {translateCategory(p.category)}
                              </span>
                              {p.rating && (
                                <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                                  <Star size={10} className="fill-amber-400 text-amber-400" />
                                  {p.rating}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-brand-orange font-mono">
                              ৳{Math.round(p.price).toLocaleString()}
                            </span>
                            {p.originalPrice && (
                              <p className="text-[10px] text-gray-400 line-through font-mono">
                                ৳{Math.round(p.originalPrice).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* When query returned 0 product matches */}
                {searchValue.trim() && suggestedProducts.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-xs font-bold text-gray-600 mb-1">{t(`No exact product match for "${searchValue}"`, `"${searchValue}" এর সাথে মিল পাওয়া যায়নি`)}</p>
                    <p className="text-[11px] text-gray-400">{t('Press Enter or click Search to browse the full catalog', 'সব পণ্য দেখতে Enter চাপুন বা খুঁজুন বাটনে ক্লিক করুন')}</p>
                  </div>
                )}

                {/* Trending / Popular search tags */}
                <div className="p-4 bg-gray-50/60">
                  <div className="flex items-center gap-1.5 text-gray-500 mb-2.5">
                    <TrendingUp size={13} className="text-brand-orange" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 font-mono">{t('Popular Searches', 'জনপ্রিয় অনুসন্ধান')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SEARCHES.map((tag, i) => (
                      <button 
                        key={i}
                        type="button"
                        onClick={() => handleKeywordClick(tag)}
                        className="text-[11px] font-medium bg-white hover:bg-brand-orange hover:text-white text-gray-700 px-3 py-1 rounded-lg border border-gray-200/80 transition-all cursor-pointer shadow-2xs"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {searchValue.trim() && (
                  <div className="p-2.5 bg-orange-50/50 text-center">
                    <button 
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="text-xs font-extrabold text-brand-orange hover:underline cursor-pointer flex items-center justify-center gap-1 w-full py-1"
                    >
                      <span>{t(`View all search results for "${searchValue}"`, `"${searchValue}" এর সব ফলাফল দেখুন`)}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Actions Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 shrink-0 ml-auto min-w-0">

          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={t('Search products', 'পণ্য খুঁজুন')}
            aria-label={t('Search', 'খুঁজুন')}
          >
            <Search size={17} />
          </button>

          {/* Admin Panel Quick Access Button - Hidden on mobile viewports to prevent navbar crowding */}
          {user && (user.role === 'admin' || isSuperAdminEmail(user.email)) && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 lg:py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl transition-opacity shadow-md shadow-orange-500/20 hover:opacity-95 group cursor-pointer shrink-0"
              title={t('Admin Dashboard', 'অ্যাডমিন ড্যাশবোর্ড')}
            >
              <ShieldCheck size={15} className="shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider font-mono">{t('Admin Panel', 'অ্যাডমিন')}</span>
            </button>
          )}

          {/* User Profile Avatar with Click Dropdown */}
          <div ref={userMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                if (user) {
                  setIsUserMenuOpen(!isUserMenuOpen);
                } else {
                  onLoginClick();
                }
              }}
              className="flex items-center gap-2 p-0.5 rounded-xl sm:rounded-2xl hover:bg-orange-50/80 transition-colors border border-transparent hover:border-orange-200/60 cursor-pointer group shrink-0"
              id="header-user-btn"
              aria-label="User Account"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center border border-orange-200/60 overflow-hidden shadow-2xs shrink-0 relative">
                {user ? (
                  <img 
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                    alt={user.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User size={16} className="text-brand-orange" />
                )}
                {/* Admin indicator badge on avatar */}
                {user && (user.role === 'admin' || isSuperAdminEmail(user.email)) && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full border border-white flex items-center justify-center text-white shadow-2xs" title="Super Admin">
                    <ShieldCheck size={7} />
                  </span>
                )}
              </div>
              <div className="hidden xl:flex flex-col items-start leading-tight text-left min-w-0 max-w-[90px] xl:max-w-[110px]">
                <span className="text-[8.5px] font-bold uppercase tracking-widest text-gray-400 truncate w-full">
                  {user ? t('Welcome', 'স্বাগতম') : t('Account', 'অ্যাকাউন্ট')}
                </span>
                <span className="text-xs font-black text-gray-800 group-hover:text-brand-orange transition-colors truncate w-full">
                  {user ? (user.name ? user.name.split(' ')[0] : t('Member', 'সদস্য')) : t('Sign In', 'সাইন ইন')}
                </span>
              </div>
            </button>

            {/* Dropdown Menu on Profile Avatar */}
            <AnimatePresence>
              {user && isUserMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[350] pointer-events-auto select-none"
                >
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50/50 border-b border-orange-100/60">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full border-2 border-white shadow-xs object-cover" 
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-gray-900 truncate">{user.name || t('Member', 'সদস্য')}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                        <span className="inline-block mt-0.5 text-[8.5px] font-black uppercase tracking-wider bg-orange-100 text-brand-orange px-1.5 py-0.2 rounded font-mono">
                          {(user.role === 'admin' || isSuperAdminEmail(user.email)) ? t('Super Admin', 'সুপার অ্যাডমিন') : t('Verified Member', 'ভেরিফায়েড সদস্য')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    {(user.role === 'admin' || isSuperAdminEmail(user.email)) && (
                      <button 
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full text-left p-2.5 text-xs font-black text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 active:scale-[0.98] rounded-xl transition-all flex items-center justify-between shadow-xs cursor-pointer mb-1"
                      >
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck size={16} />
                          <span>{t('Admin Dashboard', 'অ্যাডমিন ড্যাশবোর্ড')}</span>
                        </div>
                        <span className="text-[9px] bg-white/20 uppercase px-1.5 py-0.5 rounded font-mono font-bold">{t('Open', 'খুলুন')}</span>
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left p-2.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-brand-orange active:scale-[0.98] rounded-xl transition-all flex items-center gap-3 cursor-pointer"
                    >
                      <LayoutDashboard size={16} className="text-gray-400 group-hover:text-brand-orange" />
                      <span>{t('My Profile & Dashboard', 'আমার প্রোফাইল ও ড্যাশবোর্ড')}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOrderHistoryClick();
                      }}
                      className="w-full text-left p-2.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-brand-orange active:scale-[0.98] rounded-xl transition-all flex items-center gap-3 cursor-pointer"
                    >
                      <Package size={16} className="text-gray-400 group-hover:text-brand-orange" />
                      <span>{t('Orders & Tracking', 'অর্ডার ও ট্র্যাকিং')}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onWishlistClick();
                      }}
                      className="w-full text-left p-2.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-brand-orange active:scale-[0.98] rounded-xl transition-all flex items-center gap-3 cursor-pointer"
                    >
                      <Heart size={16} className="text-gray-400 group-hover:text-brand-orange" />
                      <span>{t('Saved Wishlist', 'পছন্দের তালিকা')} ({wishlistCount})</span>
                    </button>

                    <div className="h-[1px] bg-gray-100 my-1.5 mx-2" />

                    <button 
                      type="button"
                      onClick={(e) => {
                        setIsUserMenuOpen(false);
                        handleSignOut(e);
                      }}
                      className="w-full text-left p-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 active:scale-[0.98] rounded-xl transition-all flex items-center gap-3 cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>{t('Sign Out', 'সাইন আউট')}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Wishlist Icon Button */}
          <button
            type="button"
            className="w-9 h-9 rounded-xl sm:rounded-2xl bg-gray-50 hover:bg-pink-50 text-gray-600 hover:text-rose-500 border border-gray-200/80 hover:border-pink-200 transition-colors flex items-center justify-center relative shadow-2xs cursor-pointer shrink-0"
            onClick={onWishlistClick}
            id="header-wishlist-btn"
            title={t('My Saved Wishlist', 'পছন্দের তালিকা')}
            aria-label={t('Wishlist', 'উইশলিস্ট')}
          >
            <Heart size={16} className={wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-xs leading-none">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Cart Button */}
          <button
            type="button"
            className="w-9 h-9 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white transition-shadow flex items-center justify-center relative shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 cursor-pointer shrink-0"
            onClick={onCartClick}
            id="header-cart-btn"
            title={t('Shopping Cart', 'শপিং কার্ট')}
            aria-label={t('Shopping Cart', 'শপিং কার্ট')}
          >
            <ShoppingBag size={16} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[9px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-black border-2 border-white shadow-xs leading-none">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Expandable Bar */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden w-full max-w-full box-border px-3 sm:px-4 pb-3 pt-1 border-t border-gray-100 bg-white overflow-hidden"
          >
            <form onSubmit={handleSearchSubmit} className="w-full min-w-0 flex items-center bg-gray-100 rounded-xl px-3 py-2 box-border">
              <Search size={16} className="text-gray-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder={t('Search products in Digital Shop T.M...', 'Digital Shop T.M-এ পণ্য খুঁজুন...')}
                className="flex-1 min-w-0 w-full bg-transparent border-none outline-none text-xs font-medium text-gray-800 placeholder:text-gray-400"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                autoFocus
              />
              {searchValue && (
                <button type="button" onClick={() => setSearchValue('')} className="text-gray-400 mr-2 shrink-0">
                  <X size={14} />
                </button>
              )}
              <button type="submit" className="bg-brand-orange text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg shrink-0 cursor-pointer">
                {t('Go', 'খুঁজুন')}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      </header>

      {/* Mobile Slide-Out Navigation Drawer */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-[300] md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-[300px] sm:w-[340px] max-w-[85vw] h-full bg-white shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar"
            >
              {/* Drawer Header */}
              <div>
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-brand-orange text-white flex items-center justify-center font-luxury font-black text-lg shadow-md shadow-orange-500/20">
                      D
                    </div>
                    <div>
                      <h3 className="font-luxury font-black text-lg text-gray-900 leading-tight">Digital Shop T.M</h3>
                      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 font-mono">Digital Marketplace</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-white transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* User Status Bar */}
                {user ? (
                  <div>
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full border border-orange-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-gray-900 truncate">{user.name || 'Member'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                        {(user.role === 'admin' || isSuperAdminEmail(user.email)) && (
                          <span className="inline-block mt-0.5 text-[8.5px] font-black uppercase tracking-wider bg-orange-100 text-brand-orange px-1.5 py-0.2 rounded font-mono">
                            Super Admin
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Prominent Admin Access Card in Mobile Drawer */}
                    {(user.role === 'admin' || isSuperAdminEmail(user.email)) && (
                      <div className="p-3 mx-3 my-2.5 bg-gradient-to-r from-orange-500 via-brand-orange to-amber-500 text-white rounded-2xl shadow-md shadow-orange-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider font-mono">{t('Admin Panel', 'অ্যাডমিন প্যানেল')}</p>
                            <p className="text-[10px] text-orange-100">{t('Management & Orders', 'ম্যানেজমেন্ট ও অর্ডার')}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsMobileDrawerOpen(false);
                            navigate('/admin');
                          }}
                          className="px-3 py-1.5 bg-white text-brand-orange hover:bg-orange-50 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xs cursor-pointer active:scale-95 transition-transform shrink-0"
                        >
                          {t('Open', 'খুলুন')}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-orange-50/70 border-b border-orange-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-gray-900">{t('Welcome to Digital Shop T.M', 'Digital Shop T.M-এ স্বাগতম')}</p>
                      <p className="text-[10px] text-gray-500">{t('Sign in for member deals', 'মেম্বার ডিলের জন্য সাইন ইন করুন')}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        onLoginClick();
                      }}
                      className="px-3.5 py-1.5 bg-brand-orange text-white rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-sm"
                    >
                      {t('Login', 'লগইন')}
                    </button>
                  </div>
                )}

                {/* Quick Navigation Links */}
                <div className="p-4 space-y-1">
                  <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 block font-mono">
                    {t('Explore Mall', 'মল ঘুরে দেখুন')}
                  </span>
                  
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      navigate('/');
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-brand-orange transition-all flex items-center gap-3"
                  >
                    <Store size={16} className="text-brand-orange" />
                    <span>{t('Home Marketplace', 'হোম মার্কেটপ্লেস')}</span>
                  </button>

                  {/* Quick Department Links */}
                  <div className="pt-2 pb-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2.5 mb-1.5 block font-mono">
                      {t('Departments', 'ডিপার্টমেন্টসমূহ')}
                    </span>
                    <div className="grid grid-cols-2 gap-1 px-1">
                      {[
                        'Electronic Accessories',
                        'Fashions',
                        'Health & Beauty',
                        'Home & Lifestyle',
                        'Home Appliances',
                        'Sports & Outdoors',
                        'Groceries',
                        'Automotive'
                      ].map((dept, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setIsMobileDrawerOpen(false);
                            navigate(`/category/${dept.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`);
                          }}
                          className="text-left px-2.5 py-2 rounded-lg text-[11px] font-semibold text-gray-700 hover:bg-orange-50 hover:text-brand-orange transition-colors truncate"
                        >
                          {translateCategory(dept)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      setActiveTab('app');
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-brand-orange transition-all flex items-center gap-3"
                  >
                    <Smartphone size={16} className="text-brand-orange" />
                    <span>{t('Save More on App', 'অ্যাপে বেশি সাশ্রয়')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      setActiveTab('seller');
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-brand-orange transition-all flex items-center gap-3"
                  >
                    <Store size={16} className="text-amber-500" />
                    <span>{t('Become a Seller', 'সেলার হোন')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      setActiveTab('affiliate');
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-brand-orange transition-all flex items-center gap-3"
                  >
                    <Sparkles size={16} className="text-purple-500" />
                    <span>{t('Digital Shop T.M Affiliate Program', 'অ্যাফিলিয়েট প্রোগ্রাম')}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      setActiveTab('support');
                    }}
                    className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-brand-orange transition-all flex items-center gap-3"
                  >
                    <LifeBuoy size={16} className="text-blue-500" />
                    <span>{t('Help & Customer Support', 'সাহায্য ও কাস্টমার সাপোর্ট')}</span>
                  </button>

                  <div className="h-[1px] bg-gray-100 my-2" />

                  {/* Account Links if logged in */}
                  {user && (
                    <>
                      <span className="text-[9.5px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2 block font-mono">
                        {t('My Account', 'আমার অ্যাকাউন্ট')}
                      </span>
                      
                      <button
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-brand-orange transition-all flex items-center gap-3"
                      >
                        <LayoutDashboard size={16} className="text-gray-400" />
                        <span>{t('My Profile & Dashboard', 'আমার প্রোফাইল ও ড্যাশবোর্ড')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          onOrderHistoryClick();
                        }}
                        className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-brand-orange transition-all flex items-center gap-3"
                      >
                        <Package size={16} className="text-gray-400" />
                        <span>{t('My Orders', 'আমার অর্ডার')}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          onWishlistClick();
                        }}
                        className="w-full text-left p-2.5 rounded-xl text-xs font-bold text-gray-800 hover:bg-orange-50 hover:text-brand-orange transition-all flex items-center gap-3"
                      >
                        <Heart size={16} className="text-rose-500" />
                        <span>{t('Saved Wishlist', 'পছন্দের তালিকা')} ({wishlistCount})</span>
                      </button>

                      {user && (user.role === 'admin' || isSuperAdminEmail(user.email)) && (
                        <button
                          onClick={() => {
                            setIsMobileDrawerOpen(false);
                            navigate('/admin');
                          }}
                          className="w-full text-left p-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-orange-600 to-amber-600 transition-all flex items-center justify-between shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <ShieldCheck size={16} />
                            <span>{t('Admin Dashboard', 'অ্যাডমিন ড্যাশবোর্ড')}</span>
                          </div>
                          <span className="text-[9px] bg-white/20 uppercase px-1.5 py-0.5 rounded font-mono font-bold">{t('Open', 'খুলুন')}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/80 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                  <span>{t('Currency:', 'মুদ্রা:')}</span>
                  <span className="font-bold text-gray-800">{t('BDT (৳)', 'টাকা (৳)')}</span>
                </div>
                {user && (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>{t('Sign Out', 'সাইন আউট')}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
