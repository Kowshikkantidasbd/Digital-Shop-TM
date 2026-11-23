import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, Shield, Phone, Mail, MapPin, Truck, CreditCard, 
  Layers, Megaphone, Image as ImageIcon, FileText, HelpCircle, 
  Save, Check, AlertCircle, RefreshCw, Sparkles, Zap, Trash2, 
  Plus, Eye, ExternalLink, Sliders, ToggleLeft, ToggleRight,
  MessageCircle, Clock, ShieldAlert, CheckCircle2, ChevronRight,
  Upload, Smartphone, Lock
} from 'lucide-react';
import { 
  SiteConfig, 
  DEFAULT_SITE_CONFIG, 
  getLocalSiteConfig, 
  saveLocalSiteConfig,
  persistSiteConfig, 
  SiteBanner, 
  SiteFaq 
} from '../../constants/siteConfig';
import { configApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface SiteMasterControlProps {
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SiteMasterControl: React.FC<SiteMasterControlProps> = ({ onShowToast }) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [config, setConfig] = useState<SiteConfig>(() => getLocalSiteConfig());
  const [lastSavedConfig, setLastSavedConfig] = useState<SiteConfig>(() => getLocalSiteConfig());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeSubTab, setActiveSubTab] = useState<
    'branding' | 'contact' | 'shipping' | 'sections' | 'banners' | 'announcement' | 'cms' | 'maintenance'
  >('branding');
  
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // New FAQ Modal / State
  const [newFaq, setNewFaq] = useState<Partial<SiteFaq>>({
    q: '',
    a: '',
    category: 'general'
  });
  const [isAddingFaq, setIsAddingFaq] = useState(false);

  // Load from local storage or cloud when component mounts
  useEffect(() => {
    const loaded = getLocalSiteConfig();
    setConfig(loaded);
    setLastSavedConfig(loaded);

    let active = true;
    configApi.getConfig().then((cloudData) => {
      if (active && cloudData) {
        const merged = saveLocalSiteConfig(cloudData);
        setConfig(merged);
        setLastSavedConfig(merged);
      }
    }).catch(() => {});

    const handleSync = (e: Event) => {
      const custom = e as CustomEvent<SiteConfig>;
      if (custom.detail) {
        setConfig(custom.detail);
        setLastSavedConfig(custom.detail);
      }
    };
    window.addEventListener('elora-config-updated', handleSync);
    return () => {
      active = false;
      window.removeEventListener('elora-config-updated', handleSync);
    };
  }, []);

  const hasUnsavedChanges = JSON.stringify(config) !== JSON.stringify(lastSavedConfig);

  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onShowToast) {
      onShowToast(msg, type);
    }
  };

  const validateConfig = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Branding: Name cannot be blank
    if (!config.siteName || !config.siteName.trim()) {
      errors.siteName = t('Website Brand Name is required and cannot be left empty.', 'ওয়েবসাইট ব্র্যান্ডের নাম আবশ্যক এবং খালি রাখা যাবে না।');
    }

    // 2. Helpline: Email format validation
    if (config.supportEmail && config.supportEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(config.supportEmail.trim())) {
        errors.supportEmail = t('Please enter a valid support email address (e.g. support@example.com).', 'অনুগ্রহ করে একটি সঠিক সাপোর্ট ইমেইল ঠিকানা দিন (যেমন: support@example.com)।');
      }
    }

    // URL validation helper
    const isValidUrl = (url?: string) => {
      if (!url || !url.trim()) return true;
      try {
        const withProtocol = url.trim().startsWith('http://') || url.trim().startsWith('https://')
          ? url.trim()
          : `https://${url.trim()}`;
        const parsed = new URL(withProtocol);
        return parsed.hostname.includes('.');
      } catch {
        return false;
      }
    };

    if (config.facebookUrl && !isValidUrl(config.facebookUrl)) {
      errors.facebookUrl = t('Invalid Facebook URL. Example: https://facebook.com/yourstore', 'অকার্যকর ফেসবুক লিংক। উদাহরণ: https://facebook.com/yourstore');
    }
    if (config.instagramUrl && !isValidUrl(config.instagramUrl)) {
      errors.instagramUrl = t('Invalid Instagram URL. Example: https://instagram.com/yourstore', 'অকার্যকর ইনস্টাগ্রাম লিংক। উদাহরণ: https://instagram.com/yourstore');
    }
    if (config.youtubeUrl && !isValidUrl(config.youtubeUrl)) {
      errors.youtubeUrl = t('Invalid YouTube URL. Example: https://youtube.com/@yourchannel', 'অকার্যকর ইউটিউব লিংক। উদাহরণ: https://youtube.com/@yourchannel');
    }
    if (config.tiktokUrl && !isValidUrl(config.tiktokUrl)) {
      errors.tiktokUrl = t('Invalid TikTok URL. Example: https://tiktok.com/@yourstore', 'অকার্যকর টিকটক লিংক। উদাহরণ: https://tiktok.com/@yourstore');
    }

    // 3. Shipping: Fees cannot be negative
    if (Number(config.deliveryFeeDhaka) < 0) {
      errors.deliveryFeeDhaka = t('Delivery fee inside Dhaka cannot be negative.', 'ঢাকার ভেতরের ডেলিভারি চার্জ ঋণাত্মক হতে পারবে না।');
    }
    if (Number(config.deliveryFeeSubDhaka) < 0) {
      errors.deliveryFeeSubDhaka = t('Delivery fee for Sub-Dhaka cannot be negative.', 'ঢাকা সংলগ্ন এলাকার ডেলিভারি চার্জ ঋণাত্মক হতে পারবে না।');
    }
    if (Number(config.deliveryFeeOutside) < 0) {
      errors.deliveryFeeOutside = t('Delivery fee outside Dhaka cannot be negative.', 'ঢাকার বাইরের ডেলিভারি চার্জ ঋণাত্মক হতে পারবে না।');
    }
    if (Number(config.freeShippingThreshold) < 0) {
      errors.freeShippingThreshold = t('Free shipping threshold cannot be negative.', 'ফ্রি ডেলিভারি সীমা ঋণাত্মক হতে পারবে না।');
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Auto-navigate to the tab containing the first error
      if (errors.siteName && activeSubTab !== 'branding') {
        setActiveSubTab('branding');
      } else if ((errors.supportEmail || errors.facebookUrl || errors.instagramUrl || errors.youtubeUrl || errors.tiktokUrl) && activeSubTab !== 'contact') {
        setActiveSubTab('contact');
      } else if ((errors.deliveryFeeDhaka || errors.deliveryFeeSubDhaka || errors.deliveryFeeOutside || errors.freeShippingThreshold) && activeSubTab !== 'shipping') {
        setActiveSubTab('shipping');
      }
      return false;
    }
    return true;
  };

  const handleDiscardChanges = () => {
    setConfig(lastSavedConfig);
    setFormErrors({});
    notify(t('Reverted all changes to the last saved configuration.', 'শেষ সংরক্ষিত কনফিগারেশনে ফিরিয়ে আনা হয়েছে।'), 'info');
  };

  const handleSaveAll = async () => {
    if (!validateConfig()) {
      notify(t('⚠️ Please fix the highlighted validation errors before saving.', '⚠️ সংরক্ষণ করার আগে চিহ্নিত ত্রুটিগুলো ঠিক করুন।'), 'error');
      return;
    }

    setIsSaving(true);
    try {
      // Clean and sanitize URLs and trim strings
      const cleanedConfig: SiteConfig = {
        ...config,
        siteName: config.siteName.trim(),
        siteTagline: config.siteTagline?.trim() || '',
        supportEmail: config.supportEmail?.trim() || '',
        facebookUrl: config.facebookUrl?.trim() && !config.facebookUrl.trim().startsWith('http') ? `https://${config.facebookUrl.trim()}` : config.facebookUrl?.trim() || '',
        instagramUrl: config.instagramUrl?.trim() && !config.instagramUrl.trim().startsWith('http') ? `https://${config.instagramUrl.trim()}` : config.instagramUrl?.trim() || '',
        youtubeUrl: config.youtubeUrl?.trim() && !config.youtubeUrl.trim().startsWith('http') ? `https://${config.youtubeUrl.trim()}` : config.youtubeUrl?.trim() || '',
        tiktokUrl: config.tiktokUrl?.trim() && !config.tiktokUrl.trim().startsWith('http') ? `https://${config.tiktokUrl.trim()}` : config.tiktokUrl?.trim() || '',
      };

      const saved = await persistSiteConfig(cleanedConfig);
      setConfig(saved);
      setLastSavedConfig(saved);
      setFormErrors({});
      const now = new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSavedTime(now);
      notify(t('🎉 Store settings saved and deployed live across the storefront!', '🎉 স্টোর সেটিংস সংরক্ষণ করা হয়েছে এবং লাইভ স্টোরে কার্যকর হয়েছে!'), 'success');
    } catch (err) {
      console.error(err);
      notify(t('Failed to deploy settings. Please try again.', 'সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Banner helpers
  const handleBannerChange = (index: number, patch: Partial<SiteBanner>) => {
    const updated = [...config.banners];
    updated[index] = { ...updated[index], ...patch };
    setConfig(prev => ({ ...prev, banners: updated }));
  };

  const handleAddBanner = () => {
    const newBanner: SiteBanner = {
      title: 'New Promotional Offer',
      subtitle: 'Exclusive discounts on trending collections today.',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=85&w=1200',
      badge: 'SPECIAL DEAL',
      cta: 'SHOP NOW',
      color: 'from-orange-950/80',
      targetUrl: '/search?category=All',
      active: true
    };
    setConfig(prev => ({ ...prev, banners: [...prev.banners, newBanner] }));
    notify(t('New banner slot added', 'নতুন ব্যানার স্লট যুক্ত হয়েছে'), 'info');
  };

  const handleDeleteBanner = (index: number) => {
    if (config.banners.length <= 1) {
      notify(t('At least one banner is required', 'কমপক্ষে একটি ব্যানার থাকা আবশ্যক'), 'error');
      return;
    }
    const updated = config.banners.filter((_, i) => i !== index);
    setConfig(prev => ({ ...prev, banners: updated }));
    notify(t('Banner deleted', 'ব্যানার মুছে ফেলা হয়েছে'), 'info');
  };

  // Image compressor helper for logo & banners
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (base64: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 8 * 1024 * 1024) {
        notify(t('File size cannot exceed 8MB', 'ফাইলের সাইজ ৮ মেগাবাইটের বেশি হতে পারবে না'), 'error');
        return;
      }
      const isPngOrSvg = file.type === 'image/png' || file.type === 'image/svg+xml';
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX = 1200;
          if (width > height && width > MAX) {
            height = Math.round((height * MAX) / width);
            width = MAX;
          } else if (height > MAX) {
            width = Math.round((width * MAX) / height);
            height = MAX;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (!isPngOrSvg) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
            }
            ctx.drawImage(img, 0, 0, width, height);
            const format = isPngOrSvg ? 'image/png' : 'image/jpeg';
            const compressed = canvas.toDataURL(format, isPngOrSvg ? undefined : 0.88);
            onComplete(compressed);
            notify(t('Image processed & preview updated successfully', 'ছবি সফলভাবে প্রসেস ও আপডেট হয়েছে'), 'success');
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // FAQ helpers
  const handleAddFaqSubmit = () => {
    if (!newFaq.q || !newFaq.a) {
      notify(t('Please enter both a question and an answer', 'প্রশ্ন এবং উত্তর উভয়ই লিখুন'), 'error');
      return;
    }
    const faqItem: SiteFaq = {
      id: `faq-${Date.now()}`,
      q: newFaq.q,
      a: newFaq.a,
      category: (newFaq.category as any) || 'general'
    };
    setConfig(prev => ({ ...prev, faqs: [...prev.faqs, faqItem] }));
    setNewFaq({ q: '', a: '', category: 'general' });
    setIsAddingFaq(false);
    notify(t('New FAQ added', 'নতুন প্রশ্নোত্তর যুক্ত হয়েছে'), 'success');
  };

  const handleDeleteFaq = (id: string) => {
    setConfig(prev => ({ ...prev, faqs: prev.faqs.filter(f => f.id !== id) }));
    notify(t('FAQ deleted', 'প্রশ্নোত্তর মুছে ফেলা হয়েছে'), 'info');
  };

  return (
    <div className="space-y-8 text-left pb-16">
      {/* Top Banner Control Header */}
      <div className="bg-gradient-to-r from-[#16161f] via-[#1a1a24] to-[#16161f] border border-white/10 p-8 md:p-10 rounded-[36px] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-orange/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center shadow-lg shadow-brand-orange/30">
                <Sliders size={20} />
              </span>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                  {t('Store Settings', 'স্টোর সেটিংস')}
                </h2>
                <span className="text-[11px] font-mono text-brand-orange uppercase font-bold tracking-widest block mt-0.5">
                  {t('Storefront Configuration & Content Management', 'স্টোরফ্রন্ট কনফিগারেশন ও কন্টেন্ট ব্যবস্থাপনা')}
                </span>
              </div>
            </div>
            <p className="text-xs text-white/50 font-medium max-w-2xl mt-3 leading-relaxed">
              {t('Configure your store branding, contact info, shipping rates, homepage sections, promotional banners, notices, and policies in real-time.', 'রিয়েল-টাইমে আপনার স্টোরের ব্র্যান্ডিং, যোগাযোগের তথ্য, ডেলিভারি চার্জ, হোমপেজ সেকশন, ব্যানার, নোটিশ এবং নীতিমালা পরিবর্তন করুন।')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasUnsavedChanges ? (
              <span className="text-[11px] font-mono text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold animate-pulse">
                <AlertCircle size={13} /> {t('Unsaved Changes', 'অসংরক্ষিত পরিবর্তন')}
              </span>
            ) : lastSavedTime ? (
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={13} /> {t('Live Sync:', 'লাইভ সিঙ্ক:')} {lastSavedTime}
              </span>
            ) : null}

            {hasUnsavedChanges && (
              <button
                onClick={handleDiscardChanges}
                disabled={isSaving}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
              >
                {t('Discard Changes', 'পরিবর্তন বাতিল করুন')}
              </button>
            )}

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-8 py-4 bg-gradient-to-r from-brand-orange to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-orange/30 flex items-center gap-2.5 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>{t('Deploying Live...', 'লাইভ করা হচ্ছে...')}</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>{t('Save & Deploy Live', 'সংরক্ষণ ও সাইটে লাইভ করুন')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Settings Navigation Bar (All 8 Tabs Accessible & Never Truncated) */}
      <div className="bg-[#14141c] border border-white/10 p-3 rounded-2xl sm:rounded-3xl shadow-xl space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 pb-1 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/50">
              {t('Settings Modules (8 Available):', 'সেটিংস মডিউল (৮টি উপলব্ধ):')}
            </span>
            <span className="text-[10px] font-mono bg-brand-orange/20 text-brand-orange px-2 py-0.5 rounded-full font-bold">
              {t('All Accessible', 'সব সক্রিয়')}
            </span>
          </div>
          <span className="text-[10px] font-mono text-white/40">
            {t('Selected:', 'নির্বাচিত:')} <span className="text-white font-bold uppercase">{activeSubTab}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'branding', label: 'Brand & Identity', bn: 'ব্র্যান্ড ও লোগো', icon: Globe },
            { id: 'contact', label: 'Helpline & Support', bn: 'হটলাইন ও যোগাযোগ', icon: Phone },
            { id: 'shipping', label: 'Delivery & Shipping', bn: 'ডেলিভারি চার্জ', icon: Truck },
            { id: 'sections', label: 'Homepage Sections', bn: 'হোমপেজ সেকশন কন্ট্রোল', icon: Layers },
            { id: 'banners', label: 'Hero Slide Carousel', bn: 'হিরো স্লাইডার', icon: ImageIcon },
            { id: 'announcement', label: 'Top Notice Bar', bn: 'অ্যানাউন্সমেন্ট নোটিশ', icon: Megaphone },
            { id: 'cms', label: 'Policies & FAQs', bn: 'পলিসি ও এফএকিউ', icon: FileText },
            { id: 'maintenance', label: 'Maintenance Mode', bn: 'সিস্টেম মেইনটেন্যান্স', icon: ShieldAlert },
          ].map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            const hasTabError = 
              (tab.id === 'branding' && !!formErrors.siteName) ||
              (tab.id === 'contact' && !!(formErrors.supportEmail || formErrors.facebookUrl || formErrors.instagramUrl || formErrors.youtubeUrl || formErrors.tiktokUrl)) ||
              (tab.id === 'shipping' && !!(formErrors.deliveryFeeDhaka || formErrors.deliveryFeeSubDhaka || formErrors.deliveryFeeOutside || formErrors.freeShippingThreshold));

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                id={`settings-tab-${tab.id}`}
                className={`px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/25 ring-1 ring-white/30 scale-[1.01]'
                    : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <Icon size={15} className={isActive ? 'text-white' : 'text-white/50'} />
                <span>{t(tab.label, tab.bn)}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-black/25 text-white font-bold' : 'bg-white/5 text-white/40'}`}>
                  {idx + 1}/8
                </span>
                {hasTabError && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#14141c] absolute -top-1 -right-1 animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: 1. Branding & Identity */}
      {activeSubTab === 'branding' && (
        <div className="space-y-6">
          <div className="bg-[#15151c] border border-white/10 rounded-[32px] p-8 md:p-10 space-y-8">
            <div className="border-b border-white/5 pb-6">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                <Globe className="text-brand-orange" size={22} /> {t('Store Branding & Identity', 'স্টোর ব্র্যান্ডিং ও পরিচিতি')}
              </h3>
              <p className="text-xs text-white/40 mt-1">
                {t('Configure your store name, tagline, logo image, and currency settings displayed across all user pages.', 'সকল ব্যবহারকারীর পেজে প্রদর্শিত স্টোরের নাম, স্লোগান, লোগো ছবি এবং মুদ্রার সেটিংস কনফিগার করুন।')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Site Name */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                    {t('Website Brand Name', 'ওয়েবসাইট ব্র্যান্ড নাম')} <span className="text-rose-400">*</span>
                  </label>
                  {formErrors.siteName && (
                    <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1 font-mono">
                      <AlertCircle size={11} /> {t('Required', 'আবশ্যক')}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={config.siteName}
                  onChange={(e) => {
                    setConfig({ ...config, siteName: e.target.value });
                    if (formErrors.siteName) {
                      setFormErrors({ ...formErrors, siteName: '' });
                    }
                  }}
                  placeholder={t('e.g. Digital Shop T.M', 'যেমন: Digital Shop T.M')}
                  className={`w-full bg-[#0d0d12] border rounded-2xl px-5 py-3.5 text-sm font-bold text-white outline-none transition-colors ${
                    formErrors.siteName
                      ? 'border-rose-500/70 focus:border-rose-500 bg-rose-500/5'
                      : 'border-white/10 focus:border-brand-orange'
                  }`}
                />
                {formErrors.siteName ? (
                  <span className="text-[11px] text-rose-400 font-medium block">{formErrors.siteName}</span>
                ) : (
                  <span className="text-[10px] text-white/30 font-mono block">{t('Displayed across the header, footer, and invoices.', 'হেডার, ফুটার এবং ইনভয়েসে এই নামটি প্রদর্শিত হবে।')}</span>
                )}
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                  {t('Store Slogan / Tagline', 'স্লোগান / সাব-টাইটেল')}
                </label>
                <input
                  type="text"
                  value={config.siteTagline}
                  onChange={(e) => setConfig({ ...config, siteTagline: e.target.value })}
                  placeholder={t('e.g. Digital Shop T.M — Your Trusted Digital Marketplace', 'যেমন: Digital Shop T.M — আপনার বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস')}
                  className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-bold text-white outline-none focus:border-brand-orange transition-colors"
                />
                <span className="text-[10px] text-white/30 font-mono block">{t('Shown beside the logo or in the browser title bar.', 'লোগোর পাশে বা ব্রাউজার টাইটেলবারে প্রদর্শিত হবে।')}</span>
              </div>

              {/* Currency Symbol & Code */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                  {t('Currency Symbol & Code', 'মুদ্রা প্রতীক ও কোড')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 font-mono">SYM</span>
                    <input
                      type="text"
                      value={config.currencySymbol}
                      onChange={(e) => setConfig({ ...config, currencySymbol: e.target.value })}
                      placeholder="৳"
                      className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-white outline-none focus:border-brand-orange text-center font-mono"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/30 font-mono">ISO</span>
                    <input
                      type="text"
                      value={config.currencyCode}
                      onChange={(e) => setConfig({ ...config, currencyCode: e.target.value })}
                      placeholder="BDT"
                      className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-white outline-none focus:border-brand-orange text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Logo Uploader & Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                    {t('Store Logo (Custom Image or URL)', 'স্টোর লোগো (কাস্টম ছবি বা লিংক)')}
                  </label>
                  {config.siteLogo && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, siteLogo: '' })}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer"
                    >
                      {t('Clear Logo (Use Monogram)', 'লোগো মুছুন (মনোগ্রাম ব্যবহার করুন)')}
                    </button>
                  )}
                </div>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#0d0d12] border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                    {config.siteLogo ? (
                      <img src={config.siteLogo} alt={t('Logo', 'লোগো')} className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="font-black text-brand-orange text-2xl font-mono">
                        {config.siteName?.trim() ? config.siteName.trim().charAt(0).toUpperCase() : 'L'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={config.siteLogo}
                      onChange={(e) => setConfig({ ...config, siteLogo: e.target.value })}
                      placeholder={t('Paste image URL (PNG, SVG, JPG)', 'ছবির লিংক পেস্ট করুন (PNG, SVG, JPG)')}
                      className="w-full bg-[#0d0d12] border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white outline-none focus:border-brand-orange"
                    />
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/5 hover:bg-brand-orange text-white text-[10px] font-bold rounded-lg cursor-pointer transition-colors">
                        <Upload size={12} /> {t('Upload from Device', 'ডিভাইস থেকে আপলোড')}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, (b64) => setConfig({ ...config, siteLogo: b64 }))}
                        />
                      </label>
                      <span className="text-[9px] text-white/30 font-mono">{t('PNG / SVG / JPG supported', 'PNG / SVG / JPG সমর্থিত')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Header Branding Preview Box */}
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/40 block">
                  {t('Live Header Appearance Preview', 'লাইভ হেডার প্রিভিউ (ওয়েবসাইটে যেমন দেখাবে)')}
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {t('Active Currency:', 'সক্রিয় মুদ্রা:')} {config.currencySymbol || '৳'} ({config.currencyCode || 'BDT'})
                </span>
              </div>
              <div className="p-4 bg-white rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#EA580C] via-brand-orange to-[#FBBF24] flex items-center justify-center text-white font-black text-2xl shadow-sm">
                    {config.siteLogo ? (
                      <img src={config.siteLogo} alt={`${config.siteName || 'Digital Shop'} brand logo preview`} className="w-9 h-9 object-contain" />
                    ) : (
                      config.siteName?.trim() ? config.siteName.trim().charAt(0).toUpperCase() : 'D'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-900 text-lg tracking-tight leading-none">
                        {config.siteName || 'Digital Shop T.M'}
                      </span>
                      <span className="text-[8px] font-black uppercase bg-orange-100 text-brand-orange px-1.5 py-0.5 rounded font-mono">
                        T.M
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 font-mono mt-1 line-clamp-1">
                      {config.siteTagline || t('Digital Shop T.M — Your Trusted Digital Marketplace', 'Digital Shop T.M — আপনার বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block font-mono">{t('Sample Product Price', 'নমুনা পণ্যের মূল্য')}</span>
                  <span className="text-base font-black text-brand-orange font-mono">
                    {config.currencySymbol || '৳'}2,450
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. Contact & Helpline */}
      {activeSubTab === 'contact' && (
        <div className="space-y-6">
          <div className="bg-[#15151c] border border-white/10 rounded-[32px] p-8 md:p-10 space-y-8">
            <div className="border-b border-white/5 pb-6">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                <Phone className="text-emerald-400" size={22} /> {t('Customer Helpline & Official Contacts', 'গ্রাহক হেল্পলাইন ও অফিসিয়াল যোগাযোগ')}
              </h3>
              <p className="text-xs text-white/40 mt-1">
                {t('Set customer care hotline, direct WhatsApp channel, official email, and physical office location.', 'কাস্টমার কেয়ার হটলাইন, সরাসরি হোয়াটসঅ্যাপ, অফিসিয়াল ইমেইল এবং অফিসের ঠিকানা নির্ধারণ করুন।')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Hotline Phone */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                  {t('Customer Care Hotline', 'কাস্টমার কেয়ার হটলাইন নম্বর')}
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={config.hotlinePhone}
                    onChange={(e) => setConfig({ ...config, hotlinePhone: e.target.value })}
                    placeholder="+880 1885-195658"
                    className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold text-white outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>

              {/* WhatsApp Support Number */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                  {t('WhatsApp Direct Support', 'হোয়াটসঅ্যাপ সরাসরি সাপোর্ট নম্বর')}
                </label>
                <div className="relative">
                  <MessageCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    type="text"
                    value={config.whatsappNumber}
                    onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                    placeholder="+880 1885-195658"
                    className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold text-white outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>

              {/* Official Support Email */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                    {t('Official Support Email', 'অফিসিয়াল সাপোর্ট ইমেইল ঠিকানা')}
                  </label>
                  {formErrors.supportEmail && (
                    <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1 font-mono">
                      <AlertCircle size={11} /> {t('Invalid', 'সঠিক নয়')}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={config.supportEmail}
                    onChange={(e) => {
                      setConfig({ ...config, supportEmail: e.target.value });
                      if (formErrors.supportEmail) {
                        setFormErrors({ ...formErrors, supportEmail: '' });
                      }
                    }}
                    placeholder="support@luxuryshoppingmall.com"
                    className={`w-full bg-[#0d0d12] border rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold text-white outline-none font-mono transition-colors ${
                      formErrors.supportEmail
                        ? 'border-rose-500/70 focus:border-rose-500 bg-rose-500/5'
                        : 'border-white/10 focus:border-brand-orange'
                    }`}
                  />
                </div>
                {formErrors.supportEmail && (
                  <span className="text-[11px] text-rose-400 font-medium block">{formErrors.supportEmail}</span>
                )}
              </div>

              {/* Operating Hours */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                  {t('Operating Hours', 'কাজের সময়সূচী')}
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={config.operatingHours}
                    onChange={(e) => setConfig({ ...config, operatingHours: e.target.value })}
                    placeholder={t('Daily 9:00 AM - 11:00 PM (BD Time)', 'প্রতিদিন সকাল ৯:০০ - রাত ১১:০০ (বাংলাদেশ সময়)')}
                    className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold text-white outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>

              {/* Office Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                  {t('Corporate Office / Warehouse Address', 'কর্পোরেট অফিস / ওয়্যারহাউজ ঠিকানা')}
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-4 text-white/30" />
                  <textarea
                    rows={2}
                    value={config.officeAddress}
                    onChange={(e) => setConfig({ ...config, officeAddress: e.target.value })}
                    placeholder={t('Level 4, Gulshan Centre Point, Road 90, Gulshan 2, Dhaka-1212, Bangladesh', 'লেভেল ৪, গুলশান সেন্টার পয়েন্ট, রোড ৯০, গুলশান ২, ঢাকা-১২১২, বাংলাদেশ')}
                    className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl pl-12 pr-5 py-3.5 text-sm font-bold text-white outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Social Channels with Validation and Quick Test links */}
              <div className="space-y-4 md:col-span-2 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white/80">
                    {t('Social Media Channels', 'সামাজিক যোগাযোগ মাধ্যম')}
                  </h4>
                  <span className="text-[10px] text-white/40 font-mono">
                    {t('Shown in Website Footer & Contact Widget', 'ওয়েবসাইট ফুটার ও যোগাযোগ উইজেটে প্রদর্শিত হবে')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Facebook */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-blue-400 flex items-center justify-between">
                      <span>Facebook</span>
                      {config.facebookUrl && (
                        <a
                          href={config.facebookUrl.startsWith('http') ? config.facebookUrl : `https://${config.facebookUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-brand-orange hover:underline font-mono"
                        >
                          {t('Test', 'পরীক্ষা')} ↗
                        </a>
                      )}
                    </label>
                    <input
                      type="text"
                      value={config.facebookUrl}
                      onChange={(e) => {
                        setConfig({ ...config, facebookUrl: e.target.value });
                        if (formErrors.facebookUrl) setFormErrors({ ...formErrors, facebookUrl: '' });
                      }}
                      placeholder="https://facebook.com/..."
                      className={`w-full bg-[#0d0d12] border rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono ${
                        formErrors.facebookUrl ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 focus:border-brand-orange'
                      }`}
                    />
                    {formErrors.facebookUrl && (
                      <span className="text-[9px] text-rose-400 block">{formErrors.facebookUrl}</span>
                    )}
                  </div>

                  {/* Instagram */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-pink-400 flex items-center justify-between">
                      <span>Instagram</span>
                      {config.instagramUrl && (
                        <a
                          href={config.instagramUrl.startsWith('http') ? config.instagramUrl : `https://${config.instagramUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-brand-orange hover:underline font-mono"
                        >
                          {t('Test', 'পরীক্ষা')} ↗
                        </a>
                      )}
                    </label>
                    <input
                      type="text"
                      value={config.instagramUrl}
                      onChange={(e) => {
                        setConfig({ ...config, instagramUrl: e.target.value });
                        if (formErrors.instagramUrl) setFormErrors({ ...formErrors, instagramUrl: '' });
                      }}
                      placeholder="https://instagram.com/..."
                      className={`w-full bg-[#0d0d12] border rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono ${
                        formErrors.instagramUrl ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 focus:border-brand-orange'
                      }`}
                    />
                    {formErrors.instagramUrl && (
                      <span className="text-[9px] text-rose-400 block">{formErrors.instagramUrl}</span>
                    )}
                  </div>

                  {/* YouTube */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-red-400 flex items-center justify-between">
                      <span>YouTube</span>
                      {config.youtubeUrl && (
                        <a
                          href={config.youtubeUrl.startsWith('http') ? config.youtubeUrl : `https://${config.youtubeUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-brand-orange hover:underline font-mono"
                        >
                          {t('Test', 'পরীক্ষা')} ↗
                        </a>
                      )}
                    </label>
                    <input
                      type="text"
                      value={config.youtubeUrl}
                      onChange={(e) => {
                        setConfig({ ...config, youtubeUrl: e.target.value });
                        if (formErrors.youtubeUrl) setFormErrors({ ...formErrors, youtubeUrl: '' });
                      }}
                      placeholder="https://youtube.com/@..."
                      className={`w-full bg-[#0d0d12] border rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono ${
                        formErrors.youtubeUrl ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 focus:border-brand-orange'
                      }`}
                    />
                    {formErrors.youtubeUrl && (
                      <span className="text-[9px] text-rose-400 block">{formErrors.youtubeUrl}</span>
                    )}
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-bold text-cyan-400 flex items-center justify-between">
                      <span>TikTok</span>
                      {config.tiktokUrl && (
                        <a
                          href={config.tiktokUrl.startsWith('http') ? config.tiktokUrl : `https://${config.tiktokUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] text-brand-orange hover:underline font-mono"
                        >
                          {t('Test', 'পরীক্ষা')} ↗
                        </a>
                      )}
                    </label>
                    <input
                      type="text"
                      value={config.tiktokUrl}
                      onChange={(e) => {
                        setConfig({ ...config, tiktokUrl: e.target.value });
                        if (formErrors.tiktokUrl) setFormErrors({ ...formErrors, tiktokUrl: '' });
                      }}
                      placeholder="https://tiktok.com/@..."
                      className={`w-full bg-[#0d0d12] border rounded-xl px-4 py-2.5 text-xs text-white outline-none font-mono ${
                        formErrors.tiktokUrl ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 focus:border-brand-orange'
                      }`}
                    />
                    {formErrors.tiktokUrl && (
                      <span className="text-[9px] text-rose-400 block">{formErrors.tiktokUrl}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. Delivery & Shipping */}
      {activeSubTab === 'shipping' && (
        <div className="space-y-6">
          <div className="bg-[#15151c] border border-white/10 rounded-[32px] p-8 md:p-10 space-y-8">
            <div className="border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                  <Truck className="text-amber-400" size={22} /> {t('Nationwide Delivery Charges & Rules', 'দেশব্যাপী ডেলিভারি চার্জ ও নিয়মাবলী')}
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  {t('Customize shipping fees across Dhaka, Dhaka Suburbs, and Outside Dhaka, set free delivery rules, and toggle Cash On Delivery.', 'ঢাকা, ঢাকা সংলগ্ন এলাকা ও ঢাকার বাইরের ডেলিভারি চার্জ, ফ্রি ডেলিভারি শর্ত এবং ক্যাশ অন ডেলিভারি সেটিংস নির্ধারণ করুন।')}
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold self-start sm:self-auto">
                {t('Real-time Checkout Synced', 'রিয়েল-টাইম চেকআউটের সাথে যুক্ত')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Delivery: Inside Dhaka */}
              <div className="bg-[#0d0d12] border border-white/10 p-6 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange block">
                  {t('Inside Dhaka City', 'ঢাকা শহরের ভেতরে')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white/40 font-mono">{config.currencySymbol || '৳'}</span>
                  <input
                    type="number"
                    min="0"
                    value={config.deliveryFeeDhaka}
                    onChange={(e) => {
                      setConfig({ ...config, deliveryFeeDhaka: Number(e.target.value) });
                      if (formErrors.deliveryFeeDhaka) setFormErrors({ ...formErrors, deliveryFeeDhaka: '' });
                    }}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-lg font-black text-white outline-none font-mono ${
                      formErrors.deliveryFeeDhaka ? 'border-rose-500' : 'border-white/10 focus:border-brand-orange'
                    }`}
                  />
                </div>
                {formErrors.deliveryFeeDhaka && (
                  <span className="text-[10px] text-rose-400 block">{formErrors.deliveryFeeDhaka}</span>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-white/40">{t('Estimated Duration', 'আনুমানিক সময়কাল')}</label>
                  <input
                    type="text"
                    value={config.deliveryDaysDhaka}
                    onChange={(e) => setConfig({ ...config, deliveryDaysDhaka: e.target.value })}
                    placeholder={t('1 - 2 Days', '১ - ২ দিন')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              {/* Delivery: Sub-Dhaka */}
              <div className="bg-[#0d0d12] border border-white/10 p-6 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                  {t('Sub-Dhaka / Dhaka Division', 'ঢাকা সংলগ্ন / ঢাকা বিভাগ')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white/40 font-mono">{config.currencySymbol || '৳'}</span>
                  <input
                    type="number"
                    min="0"
                    value={config.deliveryFeeSubDhaka}
                    onChange={(e) => {
                      setConfig({ ...config, deliveryFeeSubDhaka: Number(e.target.value) });
                      if (formErrors.deliveryFeeSubDhaka) setFormErrors({ ...formErrors, deliveryFeeSubDhaka: '' });
                    }}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-lg font-black text-white outline-none font-mono ${
                      formErrors.deliveryFeeSubDhaka ? 'border-rose-500' : 'border-white/10 focus:border-brand-orange'
                    }`}
                  />
                </div>
                {formErrors.deliveryFeeSubDhaka && (
                  <span className="text-[10px] text-rose-400 block">{formErrors.deliveryFeeSubDhaka}</span>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-white/40">{t('Estimated Duration', 'আনুমানিক সময়কাল')}</label>
                  <input
                    type="text"
                    value={config.deliveryDaysSubDhaka || ''}
                    onChange={(e) => setConfig({ ...config, deliveryDaysSubDhaka: e.target.value })}
                    placeholder={t('2 - 3 Days', '২ - ৩ দিন')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-mono"
                  />
                </div>
                <p className="text-[9px] text-white/30 font-mono">{t('Gazipur, Savar, Narayanganj, Keraniganj, etc.', 'গাজীপুর, সাভার, নারায়ণগঞ্জ, কেরানীগঞ্জ ইত্যাদি।')}</p>
              </div>

              {/* Delivery: Outside Dhaka */}
              <div className="bg-[#0d0d12] border border-white/10 p-6 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block">
                  {t('Outside Dhaka / All 64 Districts', 'ঢাকার বাইরে / সারা বাংলাদেশ')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white/40 font-mono">{config.currencySymbol || '৳'}</span>
                  <input
                    type="number"
                    min="0"
                    value={config.deliveryFeeOutside}
                    onChange={(e) => {
                      setConfig({ ...config, deliveryFeeOutside: Number(e.target.value) });
                      if (formErrors.deliveryFeeOutside) setFormErrors({ ...formErrors, deliveryFeeOutside: '' });
                    }}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-lg font-black text-white outline-none font-mono ${
                      formErrors.deliveryFeeOutside ? 'border-rose-500' : 'border-white/10 focus:border-brand-orange'
                    }`}
                  />
                </div>
                {formErrors.deliveryFeeOutside && (
                  <span className="text-[10px] text-rose-400 block">{formErrors.deliveryFeeOutside}</span>
                )}
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-white/40">{t('Estimated Duration', 'আনুমানিক সময়কাল')}</label>
                  <input
                    type="text"
                    value={config.deliveryDaysOutside}
                    onChange={(e) => setConfig({ ...config, deliveryDaysOutside: e.target.value })}
                    placeholder={t('2 - 4 Days', '২ - ৪ দিন')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Threshold & Payment Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
              {/* Free Delivery Threshold */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                  {t('Free Shipping Minimum Order Amount', 'ফ্রি ডেলিভারি পেতে ন্যূনতম অর্ডার পরিমাণ')}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-mono font-bold">
                    {config.currencySymbol || '৳'}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={config.freeShippingThreshold}
                    onChange={(e) => {
                      setConfig({ ...config, freeShippingThreshold: Number(e.target.value) });
                      if (formErrors.freeShippingThreshold) setFormErrors({ ...formErrors, freeShippingThreshold: '' });
                    }}
                    placeholder="1500"
                    className={`w-full bg-[#0d0d12] border rounded-2xl pl-10 pr-5 py-3.5 text-sm font-bold text-white outline-none font-mono ${
                      formErrors.freeShippingThreshold ? 'border-rose-500' : 'border-white/10 focus:border-brand-orange'
                    }`}
                  />
                </div>
                {formErrors.freeShippingThreshold ? (
                  <span className="text-[10px] text-rose-400 block">{formErrors.freeShippingThreshold}</span>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    {t('Orders meeting this cart subtotal automatically receive free delivery.', 'কার্টে এই পরিমাণের বেশি পণ্য থাকলে স্বয়ংক্রিয়ভাবে ডেলিভারি চার্জ ফ্রি হবে।')}
                  </span>
                )}
              </div>

              {/* COD Toggle & Handling Fee */}
              <div className="p-5 bg-[#0d0d12] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-white block">{t('Cash On Delivery (COD)', 'ক্যাশ অন ডেলিভারি (COD)')}</span>
                    <span className="text-[10px] text-white/40 font-mono mt-0.5 block">{t('Enable or disable pay-on-delivery option', 'পণ্য হাতে পেয়ে টাকা দেওয়ার সুবিধা চালু/বন্ধ করুন')}</span>
                    <span className="text-[9px] font-mono text-emerald-400 block mt-1">
                      {t('Current Status:', 'বর্তমান অবস্থা:')} {config.enableCOD ? t('Enabled (Available at Checkout)', 'চালু (চেকআউটে উপলব্ধ)') : t('Disabled (Pre-payment only)', 'বন্ধ (শুধুমাত্র অগ্রিম পেমেন্ট)')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, enableCOD: !config.enableCOD })}
                    className={`w-14 h-8 rounded-full relative p-1 transition-colors cursor-pointer shrink-0 ${
                      config.enableCOD ? 'bg-emerald-500' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white transition-transform ${
                        config.enableCOD ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {config.enableCOD && (
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                      {t('COD Handling Fee', 'সিওডি হ্যান্ডলিং চার্জ')} ({config.currencySymbol || '৳'})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={config.codHandlingFee ?? 0}
                      onChange={(e) => setConfig({ ...config, codHandlingFee: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-28 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-black text-white outline-none focus:border-brand-orange text-right font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Card Payment Toggle */}
              <div className="md:col-span-2 flex items-center justify-between p-5 bg-[#0d0d12] border border-white/10 rounded-2xl">
                <div>
                  <span className="text-xs font-black uppercase text-white block">{t('Visa / Mastercard / Amex (SSLCommerz)', 'কার্ড পেমেন্ট (Visa / Mastercard)')}</span>
                  <span className="text-[10px] text-white/40 font-mono mt-0.5 block">{t('Allow customers to verify & pay with debit/credit cards at checkout', 'চেকআউটে ডেবিট/ক্রেডিট কার্ডে পেমেন্ট সুবিধা চালু/বন্ধ করুন')}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, enableCard: config.enableCard === false ? true : false })}
                  className={`w-14 h-8 rounded-full relative p-1 transition-colors cursor-pointer shrink-0 ${
                    config.enableCard !== false ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-transform ${
                      config.enableCard !== false ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Mobile Wallets (bKash / Nagad / Rocket) */}
              <div className="md:col-span-2 p-5 bg-[#0d0d12] border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-white block">{t('Mobile Banking (bKash / Nagad / Rocket)', 'মোবাইল ব্যাংকিং (বিকাশ / নগদ / রকেট)')}</span>
                    <span className="text-[10px] text-white/40 font-mono mt-0.5 block">{t('Configure merchant numbers shown to customers during checkout payment', 'চেকআউটে গ্রাহকদের দেখানোর জন্য মার্চেন্ট নম্বর সেট করুন')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, enableBkashNagad: !config.enableBkashNagad })}
                    className={`w-14 h-8 rounded-full relative p-1 transition-colors cursor-pointer shrink-0 ${
                      config.enableBkashNagad ? 'bg-emerald-500' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white transition-transform ${
                        config.enableBkashNagad ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {config.enableBkashNagad && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/5">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#ff5c8a] block">{t('bKash Merchant No.', 'বিকাশ মার্চেন্ট নম্বর')}</label>
                      <input
                        type="text"
                        value={config.bkashNumber || ''}
                        onChange={(e) => setConfig({ ...config, bkashNumber: e.target.value })}
                        placeholder="01700-112233"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-brand-orange font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#ff6659] block">{t('Nagad Merchant No.', 'নগদ মার্চেন্ট নম্বর')}</label>
                      <input
                        type="text"
                        value={config.nagadNumber || ''}
                        onChange={(e) => setConfig({ ...config, nagadNumber: e.target.value })}
                        placeholder="01700-112233"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-brand-orange font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#c77dff] block">{t('Rocket Merchant No.', 'রকেট মার্চেন্ট নম্বর')}</label>
                      <input
                        type="text"
                        value={config.rocketNumber || ''}
                        onChange={(e) => setConfig({ ...config, rocketNumber: e.target.value })}
                        placeholder="01700-112233"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-bold text-white outline-none focus:border-brand-orange font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Low Stock Alert Threshold */}
              <div className="p-5 bg-[#0d0d12] border border-white/10 rounded-2xl md:col-span-2 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black uppercase text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      {t('Low Stock Alert Threshold', 'লো স্টক অ্যালার্ট সীমা')}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono mt-0.5 block">
                      {t('Triggers a Low Stock badge and notification in admin panel when stock reaches or falls below this limit', 'পণ্য এই পরিমাণের নিচে বা সমান হলে অ্যাডমিন প্যানেলে লো স্টক ব্যাজ ও নোটিফিকেশন ট্রিগার হবে')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.lowStockThreshold || 5}
                      onChange={(e) => setConfig({ ...config, lowStockThreshold: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-black text-amber-400 outline-none focus:border-brand-orange text-center font-mono"
                    />
                    <span className="text-xs font-bold text-white/60">{t('Units', 'টি')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Live Checkout Shipping Simulator */}
            <div className="bg-[#0e0e14] border border-white/5 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-amber-400" />
                  <span className="text-xs font-black uppercase text-white tracking-wider">
                    {t('Live Checkout Shipping Simulator', 'লাইভ চেকআউট শিপিং প্রিভিউ ক্যালকুলেটর')}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-white/40">
                  {t('Visualizes how customers experience your shipping rules', 'গ্রাহকরা কীভাবে আপনার ডেলিভারি নিয়ম দেখবে তা প্রদর্শন করে')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-brand-orange font-bold block">{t('Dhaka City', 'ঢাকা শহর')}</span>
                  <div className="text-lg font-black text-white font-mono">
                    {config.currencySymbol || '৳'}{config.deliveryFeeDhaka}
                  </div>
                  <div className="text-[10px] text-white/50 font-mono">{t('Est:', 'সময়:')} {config.deliveryDaysDhaka || t('1 - 2 Days', '১ - ২ দিন')}</div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-blue-400 font-bold block">{t('Sub-Dhaka', 'ঢাকা সংলগ্ন')}</span>
                  <div className="text-lg font-black text-white font-mono">
                    {config.currencySymbol || '৳'}{config.deliveryFeeSubDhaka}
                  </div>
                  <div className="text-[10px] text-white/50 font-mono">{t('Est:', 'সময়:')} {config.deliveryDaysSubDhaka || t('2 - 3 Days', '২ - ৩ দিন')}</div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-purple-400 font-bold block">{t('Outside Dhaka', 'ঢাকার বাইরে')}</span>
                  <div className="text-lg font-black text-white font-mono">
                    {config.currencySymbol || '৳'}{config.deliveryFeeOutside}
                  </div>
                  <div className="text-[10px] text-white/50 font-mono">{t('Est:', 'সময়:')} {config.deliveryDaysOutside || t('2 - 4 Days', '২ - ৪ দিন')}</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs font-mono text-emerald-400">
                <span>{t(`Free Shipping Rule: Orders ≥ ${config.currencySymbol || '৳'}${config.freeShippingThreshold} ship FREE nationwide`, `ফ্রি ডেলিভারি নিয়ম: ${config.currencySymbol || '৳'}${config.freeShippingThreshold}+ অর্ডারে সারা দেশে ফ্রি ডেলিভারি`)}</span>
                <span className="font-bold">{t('COD:', 'ক্যাশ অন ডেলিভারি:')} {config.enableCOD ? t('ACTIVE', 'চালু') : t('OFF', 'বন্ধ')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. Homepage Sections Master Switches */}
      {activeSubTab === 'sections' && (
        <div className="space-y-6">
          <div className="bg-[#15151c] border border-white/10 rounded-[32px] p-8 md:p-10 space-y-8">
            <div className="border-b border-white/5 pb-6">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                <Layers className="text-brand-orange" size={22} /> {t('Homepage Sections Master Toggles', 'হোমপেজ সেকশন মাস্টার সুইচ')}
              </h3>
              <p className="text-xs text-white/40 mt-1">
                {t('Instantly turn any homepage component on or off. Changes take effect on the storefront immediately upon saving.', 'যেকোনো হোমপেজ সেকশন তাৎক্ষণিকভাবে চালু বা বন্ধ করুন। সংরক্ষণের সাথে সাথেই পরিবর্তন লাইভ হবে।')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'showTopAnnouncement', label: t('Top Announcement Bar', 'শীর্ষ অফার ও নোটিশ মারকুই বার'), desc: t('Alert banner above header', 'হেডারের উপরের অ্যালার্ট ব্যানার') },
                { key: 'showHeroSlider', label: t('Main Hero Carousel Slider', 'হিরো ব্যানার স্লাইডার'), desc: t('Full-width promotional sliders', 'পূর্ণ প্রস্থের প্রমোশনাল স্লাইডার') },
                { key: 'showCategoryCircles', label: t('Category Circle Icons Grid', 'ক্যাটাগরি সার্কেল বাবল গ্রিড'), desc: t('Visual 3D category navigation', 'ভিজ্যুয়াল ৩ডি ক্যাটাগরি নেভিগেশন') },
                { key: 'showSponsoredAds', label: t('Sponsored Ad Campaigns', 'স্পনসরড বিজ্ঞাপন প্রোডাক্ট সেকশন'), desc: t('Promoted CPC merchant items', 'প্রমোটেড সিপিসি মার্চেন্ট পণ্য') },
                { key: 'showFlashSale', label: t('Flash Sale Countdown Section', 'ফ্ল্যাশ সেল কাউন্টডাউন সেকশন'), desc: t('Limited-time discounted items', 'সীমিত সময়ের ডিসকাউন্ট পণ্য') },
                { key: 'showBudgetFinder', label: t('AI Smart Budget Finder', 'স্মার্ট বাজেট ফিল্টার মডিউল'), desc: t('Price range slider finder', 'দাম অনুযায়ী স্মার্ট ফিল্টার স্লাইডার') },
                { key: 'showJustForYou', label: t('"Just For You" Recommendations', 'জাস্ট ফর ইউ প্রোডাক্ট গ্রিড'), desc: t('Organic personalized catalogue', 'ব্যক্তিগতকৃত পণ্যের ক্যাটালগ') },
                { key: 'showRecentlyViewed', label: t('Recently Viewed Products History', 'রিসেন্টলি ভিউড আইটেম'), desc: t('User browsing history trail', 'ব্যবহারকারীর ব্রাউজিং ইতিহাস') },
                { key: 'showLiveChatWidget', label: t('Floating Customer Concierge Chat', 'লাইভ কাস্টমার সাপোর্ট চ্যাট উইজেট'), desc: t('Interactive chat assistant bubble', 'ইন্টারঅ্যাক্টিভ চ্যাট সাপোর্ট বাবল') },
                { key: 'showCouponCode', label: t('Storefront Coupon Code Box', 'স্টোরফ্রন্ট কুপন কোড বক্স'), desc: t('Show coupon input on product details & checkout (OFF by default)', 'প্রোডাক্ট পেজ ও চেকআউটে কুপন কোড বক্স দেখান (সাধারণত বন্ধ থাকে)') },
              ].map((item) => {
                const isEnabled = (config as any)[item.key];
                return (
                  <div
                    key={item.key}
                    className="p-5 bg-[#0d0d12] border border-white/10 rounded-2xl flex items-center justify-between hover:border-white/20 transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-white">{item.label}</span>
                        <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded ${
                          isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {isEnabled ? t('ACTIVE', 'চালু') : t('OFF', 'লুকানো')}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40">{item.desc}</p>
                    </div>

                    <button
                      onClick={() => setConfig({ ...config, [item.key]: !isEnabled })}
                      className={`w-14 h-8 rounded-full relative p-1 transition-colors shrink-0 ${
                        isEnabled ? 'bg-emerald-500' : 'bg-white/10'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. Hero Slide Carousel */}
      {activeSubTab === 'banners' && (
        <div className="space-y-6">
          <div className="bg-[#15151c] border border-white/10 rounded-[32px] p-8 md:p-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                  <ImageIcon className="text-brand-orange" size={22} /> {t('Homepage Hero Slide Deck', 'হোমপেজ হিরো স্লাইড ডেক')}
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  {t('Add, edit, or remove slides displayed on the main carousel on the homepage.', 'হোমপেজের প্রধান ক্যারোসেলে প্রদর্শিত স্লাইড যোগ, এডিট বা মুছে ফেলুন।')}
                </p>
              </div>
              <button
                onClick={handleAddBanner}
                className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus size={16} /> {t('Add New Slide', 'নতুন স্লাইড যোগ করুন')}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {config.banners.map((banner, index) => (
                <div
                  key={index}
                  className="bg-[#0d0d12] border border-white/10 rounded-3xl p-6 space-y-4 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-brand-orange/20 text-brand-orange px-3 py-1 rounded-full font-mono">
                      {t(`Slide #${index + 1}`, `স্লাইড #${index + 1}`)}
                    </span>
                    <button
                      onClick={() => handleDeleteBanner(index)}
                      className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer"
                      title={t('Delete Slide', 'স্লাইড মুছুন')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Slide Image Preview */}
                  <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden relative border border-white/10 bg-black">
                    <img
                      src={banner.image}
                      alt={banner.title ? `Homepage banner slide: ${banner.title}` : 'Homepage promotional banner preview'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${banner.color || 'from-black/80'} to-transparent p-4 flex flex-col justify-end text-left`}>
                      <span className="text-[8px] font-bold bg-white/20 text-white px-2 py-0.5 rounded w-max font-mono mb-1">
                        {banner.badge || t('DEAL', 'ডিল')}
                      </span>
                      <h4 className="text-sm font-black text-white uppercase">{banner.title}</h4>
                      <p className="text-[9px] text-white/70 line-clamp-1">{banner.subtitle}</p>
                    </div>
                  </div>

                  {/* Edit Controls */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">{t('Slide Title', 'স্লাইডের শিরোনাম')}</label>
                      <input
                        type="text"
                        value={banner.title}
                        onChange={(e) => handleBannerChange(index, { title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-brand-orange"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">{t('Slide Subtitle / Description', 'স্লাইডের সাব-টাইটেল / বিবরণ')}</label>
                      <input
                        type="text"
                        value={banner.subtitle}
                        onChange={(e) => handleBannerChange(index, { subtitle: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-brand-orange"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">{t('Badge Text', 'ব্যাজ টেক্সট')}</label>
                        <input
                          type="text"
                          value={banner.badge || ''}
                          onChange={(e) => handleBannerChange(index, { badge: e.target.value })}
                          placeholder={t('e.g. FLASH SALE', 'যেমন: ফ্ল্যাশ সেল')}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-brand-orange font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">{t('Button CTA Text', 'বাটনের লেখা')}</label>
                        <input
                          type="text"
                          value={banner.cta || ''}
                          onChange={(e) => handleBannerChange(index, { cta: e.target.value })}
                          placeholder={t('e.g. SHOP NOW', 'যেমন: এখনই কিনুন')}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-brand-orange font-mono"
                        />
                      </div>
                    </div>

                    {/* Image URL & File Upload */}
                    <div>
                      <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">
                        {t('Banner Image Source (URL or Upload from Device)', 'ব্যানার ছবির সোর্স (ছবি লিংক বা ডিভাইস থেকে আপলোড)')}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={banner.image}
                          onChange={(e) => handleBannerChange(index, { image: e.target.value })}
                          placeholder="https://..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-brand-orange font-mono"
                        />
                        <label className="px-3 py-1.5 bg-white/10 hover:bg-brand-orange text-white text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer transition-colors shrink-0">
                          <Upload size={12} /> {t('Upload', 'আপলোড')}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, (b64) => handleBannerChange(index, { image: b64 }))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. Top Announcement Banner */}
      {activeSubTab === 'announcement' && (
        <div className="space-y-6">
          <div className="bg-[#15151c] border border-white/10 rounded-[32px] p-8 md:p-10 space-y-8">
            <div className="border-b border-white/5 pb-6">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                <Megaphone className="text-amber-400" size={22} /> {t('Top Notice & Announcement Broadcast', 'শীর্ষ নোটিশ ও অ্যানাউন্সমেন্ট প্রচার')}
              </h3>
              <p className="text-xs text-white/40 mt-1">
                {t('Post emergency store updates, discount coupons, or delivery notes on a prominent top ticker bar.', 'স্টোরের জরুরি আপডেট, ডিসকাউন্ট কুপন বা ডেলিভারি বার্তা শীর্ষ নোটিশ বারে প্রকাশ করুন।')}
              </p>
            </div>

            {/* Live Announcement Banner Preview */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-white/30">{t('Live Banner Preview', 'লাইভ ব্যানার প্রিভিউ')}</span>
              <div
                className={`w-full py-3 px-6 rounded-2xl flex items-center justify-between shadow-lg text-xs font-bold text-white ${
                  config.announcementBg === 'emerald'
                    ? 'bg-emerald-600'
                    : config.announcementBg === 'amber'
                    ? 'bg-amber-600'
                    : config.announcementBg === 'rose'
                    ? 'bg-rose-600'
                    : config.announcementBg === 'dark'
                    ? 'bg-zinc-900 border border-white/10'
                    : 'bg-gradient-to-r from-[#EA580C] via-brand-orange to-[#FBBF24]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Sparkles size={16} className="animate-spin shrink-0" />
                  <span className="truncate">{config.announcementText || t('Your announcement message goes here', 'আপনার ঘোষণার বার্তা এখানে প্রদর্শিত হবে')}</span>
                </div>
                {config.announcementLinkText && (
                  <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-all shrink-0 ml-4">
                    {config.announcementLinkText}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Active Toggle */}
              <div className="flex items-center justify-between p-5 bg-[#0d0d12] border border-white/10 rounded-2xl">
                <div>
                  <span className="text-xs font-black uppercase text-white block">{t('Broadcast Status', 'সম্প্রচারের অবস্থা (চালু/বন্ধ)')}</span>
                  <span className="text-[10px] text-white/40 font-mono mt-0.5 block">{t('Whether this top notice bar appears on the storefront', 'ওয়েবসাইটে এই নোটিশ বারটি দেখাবে কিনা')}</span>
                </div>
                <button
                  onClick={() => setConfig({ ...config, announcementActive: !config.announcementActive })}
                  className={`w-14 h-8 rounded-full relative p-1 transition-colors ${
                    config.announcementActive ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-transform ${
                      config.announcementActive ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                  {t('Announcement Text', 'ঘোষণার বার্তা')}
                </label>
                <textarea
                  rows={3}
                  value={config.announcementText}
                  onChange={(e) => setConfig({ ...config, announcementText: e.target.value })}
                  placeholder={t('e.g. 🔥 Mega Deals Live! 24h superfast free delivery inside Dhaka | Code: SAVE150', 'যেমন: 🔥 মেগা ডিলস চলছে! ঢাকার মধ্যে ২৪ ঘণ্টায় সুপারফাস্ট ফ্রি ডেলিভারি | কোড: SAVE150')}
                  className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl p-5 text-xs font-bold text-white outline-none focus:border-brand-orange"
                />
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                  {t('Color Theme', 'রঙের থিম নির্বাচন করুন')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'orange', name: t('Brand Orange', 'ব্র্যান্ড অরেঞ্জ'), bg: 'bg-brand-orange' },
                    { id: 'emerald', name: t('Emerald Promo', 'এমেরাল্ড প্রোমো'), bg: 'bg-emerald-600' },
                    { id: 'amber', name: t('Golden Amber', 'গোল্ডেন অ্যাম্বার'), bg: 'bg-amber-600' },
                    { id: 'rose', name: t('Crimson Rose', 'ক্রিমসন রোজ'), bg: 'bg-rose-600' },
                    { id: 'dark', name: t('Void Obsidian', 'ডার্ক অবসিডিয়ান'), bg: 'bg-zinc-900 border border-white/20' }
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setConfig({ ...config, announcementBg: theme.id as any })}
                      className={`p-3 rounded-xl flex items-center gap-2 border transition-all cursor-pointer ${
                        config.announcementBg === theme.id
                          ? 'border-white ring-2 ring-brand-orange text-white'
                          : 'border-white/10 text-white/50 hover:border-white/30'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${theme.bg}`} />
                      <span className="text-[10px] font-bold uppercase">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button & Target Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">{t('Button CTA Text', 'বাটনের লেখা')}</label>
                  <input
                    type="text"
                    value={config.announcementLinkText}
                    onChange={(e) => setConfig({ ...config, announcementLinkText: e.target.value })}
                    placeholder={t('Shop Deals', 'ডিল দেখুন')}
                    className="w-full bg-[#0d0d12] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-brand-orange font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">{t('Target Router Path', 'টার্গেট পাথ')}</label>
                  <input
                    type="text"
                    value={config.announcementLinkUrl}
                    onChange={(e) => setConfig({ ...config, announcementLinkUrl: e.target.value })}
                    placeholder="/search?category=All"
                    className="w-full bg-[#0d0d12] border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. Policies & FAQs CMS */}
      {activeSubTab === 'cms' && (
        <div className="space-y-6">
          <div className="bg-[#15151c] border border-white/10 rounded-[32px] p-8 md:p-10 space-y-8">
            <div className="border-b border-white/5 pb-6">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                <FileText className="text-brand-orange" size={22} /> {t('Store Policies & Customer FAQs', 'স্টোরের নীতিমালা ও সাধারণ প্রশ্নোত্তর')}
              </h3>
              <p className="text-xs text-white/40 mt-1">
                {t('Manage return policy, delivery guarantees, terms, and frequently asked customer support questions.', 'রিটার্ন নীতিমালা, ডেলিভারি গ্যারান্টি, শর্তাবলী এবং গ্রাহকের সাধারণ প্রশ্নোত্তর পরিচালনা করুন।')}
              </p>
            </div>

            {/* Policy Editors */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                  {t('About Us Summary', 'আমাদের সম্পর্কে বিবরণ')}
                </label>
                <textarea
                  rows={3}
                  value={config.aboutUsText}
                  onChange={(e) => setConfig({ ...config, aboutUsText: e.target.value })}
                  className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-brand-orange"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                    {t('Shipping Policy', 'শিপিং নীতিমালা')}
                  </label>
                  <textarea
                    rows={3}
                    value={config.shippingPolicy}
                    onChange={(e) => setConfig({ ...config, shippingPolicy: e.target.value })}
                    className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-brand-orange"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                    {t('Refund & Return Policy', 'রিফান্ড ও রিটার্ন নীতিমালা')}
                  </label>
                  <textarea
                    rows={3}
                    value={config.refundPolicy}
                    onChange={(e) => setConfig({ ...config, refundPolicy: e.target.value })}
                    className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-brand-orange"
                  />
                </div>
              </div>
            </div>

            {/* FAQ Manager */}
            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase text-white flex items-center gap-2">
                    <HelpCircle size={16} className="text-emerald-400" /> {t('Customer Support FAQs', 'গ্রাহক সাপোর্ট প্রশ্নোত্তর')} ({config.faqs.length})
                  </h4>
                  <p className="text-[10px] text-white/40 font-mono mt-0.5">{t('Displayed in the footer Help Center and FAQ pages.', 'ফুটারের হেল্প সেন্টার ও প্রশ্ন-উত্তরে প্রদর্শিত হয়।')}</p>
                </div>
                <button
                  onClick={() => setIsAddingFaq(!isAddingFaq)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} /> {t('Add FAQ Question', 'নতুন প্রশ্ন যোগ করুন')}
                </button>
              </div>

              {/* Add New FAQ Form */}
              {isAddingFaq && (
                <div className="p-6 bg-[#0d0d12] border border-emerald-500/30 rounded-2xl space-y-4">
                  <h5 className="text-xs font-black text-emerald-400 uppercase">{t('Write New Question & Answer', 'নতুন প্রশ্ন ও উত্তর লিখুন')}</h5>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder={t('Question, e.g. How long does delivery take?', 'প্রশ্ন, যেমন: ডেলিভারি পেতে কতদিন সময় লাগবে?')}
                      value={newFaq.q || ''}
                      onChange={(e) => setNewFaq({ ...newFaq, q: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                    />
                    <textarea
                      rows={2}
                      placeholder={t('Answer, e.g. Within 24-48 hours inside Dhaka...', 'উত্তর, যেমন: ঢাকার ভেতরে ২৪-৪৮ ঘণ্টার মধ্যে...')}
                      value={newFaq.a || ''}
                      onChange={(e) => setNewFaq({ ...newFaq, a: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsAddingFaq(false)}
                        className="px-4 py-2 text-white/40 hover:text-white text-xs font-bold"
                      >
                        {t('Cancel', 'বাতিল')}
                      </button>
                      <button
                        onClick={handleAddFaqSubmit}
                        className="px-5 py-2 bg-emerald-500 text-white text-xs font-bold uppercase rounded-xl"
                      >
                        {t('Save FAQ', 'সংরক্ষণ করুন')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ List */}
              <div className="space-y-3">
                {config.faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="p-4 bg-[#0d0d12] border border-white/10 rounded-2xl flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="text-brand-orange font-mono">{t('Q:', 'প্রশ্ন:')}</span> {faq.q}
                      </p>
                      <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                        <span className="text-emerald-400 font-mono font-bold">{t('A:', 'উত্তর:')}</span> {faq.a}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="text-white/30 hover:text-rose-400 p-1.5 transition-colors cursor-pointer"
                      title={t('Delete FAQ', 'প্রশ্ন মুছুন')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. System Maintenance & Safety */}
      {activeSubTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="bg-[#15151c] border border-white/10 rounded-[32px] p-8 md:p-10 space-y-8">
            <div className="border-b border-white/5 pb-6">
              <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                <ShieldAlert className="text-rose-500" size={22} /> {t('System Maintenance & Emergency Safe Mode', 'সিস্টেম মেইনটেন্যান্স ও জরুরি সেফ মোড')}
              </h3>
              <p className="text-xs text-white/40 mt-1">
                {t('Control the storefront accessibility. When Maintenance Mode is active, visitors see an elegant maintenance screen while admins continue full operation.', 'স্টোরের প্রবেশাধিকার নিয়ন্ত্রণ করুন। মেইনটেন্যান্স মোড চালু থাকলে সাধারণ ভিজিটররা মেইনটেন্যান্স স্ক্রিন দেখবে তবে অ্যাডমিনরা সম্পূর্ণ কার্যক্রম চালাতে পারবেন।')}
              </p>
            </div>

            {/* Maintenance Mode Switch Card */}
            <div className={`p-8 rounded-3xl border transition-all ${
              config.maintenanceMode
                ? 'bg-rose-500/10 border-rose-500/30'
                : 'bg-[#0d0d12] border-white/10'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${config.maintenanceMode ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                    <h4 className="text-lg font-black text-white uppercase">
                      {t('Maintenance Mode:', 'মেইনটেন্যান্স মোড:')} {config.maintenanceMode ? t('ACTIVE (Storefront Locked)', 'চালু (সাইট ভিজিটরদের জন্য বন্ধ)') : t('OFFLINE (Running Normally)', 'বন্ধ (স্বাভাবিক চলছে)')}
                    </h4>
                  </div>
                  <p className="text-xs text-white/40 mt-1 font-mono">
                    {config.maintenanceMode
                      ? t('⚠️ Warning: Public visitors cannot access the store right now. Only logged-in admins can browse.', '⚠️ সতর্কবার্তা: সাধারণ ভিজিটররা এখন সাইট দেখতে পারছেন না। কেবল অ্যাডমিন অ্যাকাউন্টে লগইন থাকলে সাইট দেখা যাবে।')
                      : t('✅ Website is live and operating normally for all shoppers and merchants.', '✅ ওয়েবসাইট স্বাভাবিকভাবে চালু আছে এবং সকল ভিজিটর ব্রাউজ ও অর্ডার করতে পারছেন।')}
                  </p>
                </div>

                <button
                  onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                  className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest font-mono transition-all shadow-xl cursor-pointer ${
                    config.maintenanceMode
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                      : 'bg-white/10 hover:bg-rose-600 text-white'
                  }`}
                >
                  {config.maintenanceMode ? t('Disable Safe Mode (Open Site)', 'সেফ মোড বন্ধ করুন (সাইট খুলুন)') : t('Enable Maintenance Mode', 'মেইনটেন্যান্স চালু করুন')}
                </button>
              </div>
            </div>

            {/* Maintenance Notice Message */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/60 block">
                {t('Maintenance Notice Message for Visitors', 'ভিজিটরদের জন্য মেইনটেন্যান্স বার্তা')}
              </label>
              <textarea
                rows={3}
                value={config.maintenanceNotice}
                onChange={(e) => setConfig({ ...config, maintenanceNotice: e.target.value })}
                placeholder={t('System optimization in progress, back shortly...', 'আমাদের সিস্টেম অপটিমাইজেশন চলছে...')}
                className="w-full bg-[#0d0d12] border border-white/10 rounded-2xl p-5 text-xs font-bold text-white outline-none focus:border-brand-orange"
              />
            </div>

            {/* Allow New Registrations */}
            <div className="flex items-center justify-between p-5 bg-[#0d0d12] border border-white/10 rounded-2xl">
              <div>
                <span className="text-xs font-black uppercase text-white block">{t('Allow New User Registrations', 'নতুন ইউজার রেজিস্ট্রেশনের অনুমতি')}</span>
                <span className="text-[10px] text-white/40 font-mono mt-0.5 block">{t('Whether new customers and sellers can sign up', 'নতুন কাস্টমার ও সেলার সাইন আপ করতে পারবে কিনা')}</span>
              </div>
              <button
                onClick={() => setConfig({ ...config, allowNewRegistrations: !config.allowNewRegistrations })}
                className={`w-14 h-8 rounded-full relative p-1 transition-colors ${
                  config.allowNewRegistrations ? 'bg-emerald-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white transition-transform ${
                    config.allowNewRegistrations ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Floating Action Bar */}
      <div className="sticky bottom-6 z-40 bg-[#16161f]/95 backdrop-blur-xl border border-white/15 p-4 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 pl-2">
          <span className={`w-2.5 h-2.5 rounded-full ${hasUnsavedChanges ? 'bg-amber-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
          <div>
            <span className="text-xs font-mono text-white font-bold block">
              {hasUnsavedChanges ? t('Unsaved Changes Pending Review', 'অসংরক্ষিত পরিবর্তন পর্যালোচনার অপেক্ষায়') : t('Store Settings Synced with Live Storefront', 'স্টোর সেটিংস লাইভ স্টোরের সাথে যুক্ত')}
            </span>
            <span className="text-[10px] font-mono text-white/40 block">
              {hasUnsavedChanges ? t('Press "Save & Deploy Live" to publish to customers', 'গ্রাহকদের জন্য প্রকাশ করতে "সংরক্ষণ ও লাইভ করুন" চাপুন') : t('All 8 modules operational', 'সব ৮টি মডিউল সচল রয়েছে')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {hasUnsavedChanges && (
            <button
              onClick={handleDiscardChanges}
              disabled={isSaving}
              className="px-5 py-3 bg-white/10 hover:bg-white/15 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
            >
              {t('Discard Changes', 'পরিবর্তন বাতিল করুন')}
            </button>
          )}

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-8 py-3.5 bg-gradient-to-r from-brand-orange to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-orange/30 flex items-center gap-2.5 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>{t('Deploying Changes...', 'পরিবর্তন লাইভ হচ্ছে...')}</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>{t('Save & Deploy Live', 'সংরক্ষণ ও সাইটে লাইভ করুন')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
