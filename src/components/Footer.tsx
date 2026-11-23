import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, ArrowUp, Instagram, Facebook, ShieldCheck, RefreshCw, 
  Truck, Lock, CheckCircle2, AlertCircle, X, Search, 
  HelpCircle, Store, Phone, Mail, Check, 
  Clock, MapPin, ChevronDown, ChevronUp, Sliders,
  MessageCircle, Youtube, Copy
} from 'lucide-react';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { merchantApplicationApi, apiUrl } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onOpenOrders?: () => void;
  onOpenChat?: (seller?: string) => void;
}

type ModalType = 'track' | 'shipping' | 'returns' | 'seller' | 'help' | 'privacy' | 'terms' | 'cookies' | null;

export const Footer: React.FC<FooterProps> = ({ onOpenOrders, onOpenChat }) => {
  const navigate = useNavigate();
  const { siteConfig } = useSiteConfig();
  const { t, isBangla, language } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  // Active Informational Modal
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Order Tracking Form State
  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [trackedOrderResult, setTrackedOrderResult] = useState<any | null>(null);
  const [hasSearchedOrder, setHasSearchedOrder] = useState(false);

  // Seller Registration Form State
  const [sellerForm, setSellerForm] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    district: 'Dhaka',
    category: 'Fashions',
    nid: ''
  });
  const [sellerRegistered, setSellerRegistered] = useState<{ id: string; shopName: string } | null>(null);

  // Help Center State
  const [faqCategory, setFaqCategory] = useState<'all' | 'orders' | 'payment' | 'returns' | 'shipping'>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [faqSearch, setFaqSearch] = useState('');

  // Cookie Preferences State
  const [cookiePrefs, setCookiePrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('lsm_cookie_prefs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      essential: true, // always true
      analytics: true,
      marketing: true
    };
  });
  const [cookieSavedToast, setCookieSavedToast] = useState(false);

  // Tracking input initialization
  useEffect(() => {
    // Purge any lingering legacy orders from localStorage
    try {
      localStorage.removeItem('elora-orders');
    } catch {}
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setNewsletterStatus('error');
      setErrorMessage(t('Please enter your email address.', 'অনুগ্রহ করে আপনার ইমেইল ঠিকানা লিখুন।'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setNewsletterStatus('error');
      setErrorMessage(t('Please enter a valid email address.', 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।'));
      return;
    }

    const activeWelcomeVoucher = 'SAVE200';
    setVoucherCode(activeWelcomeVoucher);
    setNewsletterStatus('success');
    setCopiedVoucher(false);
    setEmail('');
    setErrorMessage('');
    try {
      localStorage.setItem('lsm_welcome_voucher', activeWelcomeVoucher);
    } catch {}
  };

  const handleCopyVoucher = async () => {
    if (!voucherCode) return;
    try {
      await navigator.clipboard.writeText(voucherCode);
      setCopiedVoucher(true);
      setTimeout(() => setCopiedVoucher(false), 2000);
    } catch {}
  };

  const navigateToCategory = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [isTrackLoading, setIsTrackLoading] = useState(false);

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackingIdInput.trim();
    if (!query) return;

    setHasSearchedOrder(true);
    setIsTrackLoading(true);
    setTrackedOrderResult(null);

    try {
      const res = await fetch(apiUrl(`/api/orders/track/${encodeURIComponent(query)}`));
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.order) {
          const ord = data.order;
          const isConfirmed = ['confirmed', 'processing', 'shipped', 'delivered'].includes(ord.status);
          const isShipped = ['shipped', 'delivered'].includes(ord.status);
          const isDelivered = ord.status === 'delivered';
          const isCancelled = ord.status === 'cancelled';

          setTrackedOrderResult({
            id: ord.id,
            status: ord.status,
            carrier: t('Steadfast Courier / Pathao Express', 'স্টেডফাস্ট কুরিয়ার / পাঠাও এক্সপ্রেস'),
            consignmentId: ord.transactionId || `LSM-${ord.id.slice(-6)}`,
            estimatedDelivery: isDelivered ? t('Delivered', 'ডেলিভারি সম্পন্ন') : t('Within 24-48 Hours', '২৪-৪৮ ঘণ্টার মধ্যে'),
            currentLocation: ord.address?.district ? `${ord.address.district} ${t('Hub', 'হাব')}` : t('Central Sorting Hub, Tejgaon, Dhaka', 'কেন্দ্রীয় সর্টিং হাব, তেজগাঁও, ঢাকা'),
            total: ord.total,
            items: ord.items,
            steps: [
              { label: t('Order Received & Logged', 'অর্ডার গ্রহণ ও নিবন্ধন'), desc: `${t('Placed on', 'অর্ডার তারিখ')} ${ord.createdAt ? new Date(ord.createdAt).toLocaleDateString(dateLocale) : t('Recent', 'সম্প্রতি')}`, done: true },
              { label: t('Order Confirmed by Merchant', 'মার্চেন্ট কর্তৃক অর্ডার নিশ্চিত'), desc: isConfirmed ? t('Payment & inventory confirmed', 'পেমেন্ট ও স্টক নিশ্চিত হয়েছে') : t('Awaiting merchant confirmation', 'মার্চেন্ট কনফার্মেশনের অপেক্ষায়'), done: isConfirmed },
              { label: t('Dispatched to Courier Hub', 'কুরিয়ার হাবে পাঠানো হয়েছে'), desc: isShipped ? t('In transit with Steadfast / Pathao', 'স্টেডফাস্ট / পাঠাও-এর মাধ্যমে পথে আছে') : t('Awaiting courier pickup', 'কুরিয়ার পিকআপের অপেক্ষায়'), done: isShipped, current: isShipped && !isDelivered },
              { label: isCancelled ? t('Order Cancelled', 'অর্ডার বাতিল') : t('Out for Doorstep Delivery', 'ডোরস্টেপ ডেলিভারির জন্য বের হয়েছে'), desc: isCancelled ? t('Cancelled upon request', 'অনুরোধের প্রেক্ষিতে বাতিল') : (isDelivered ? t('Delivery completed', 'ডেলিভারি সম্পন্ন হয়েছে') : t('Courier assigned to route', 'রাইডার রুটে নির্ধারিত হয়েছেন')), done: isDelivered }
            ]
          });
          setIsTrackLoading(false);
          return;
        }
      }
      setTrackedOrderResult(null);
    } catch (err) {
      console.warn('Track order lookup failed:', err);
      setTrackedOrderResult(null);
    } finally {
      setIsTrackLoading(false);
    }
  };

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerForm.shopName || !sellerForm.ownerName || !sellerForm.phone) return;

    try {
      const app = await merchantApplicationApi.submitApplication({
        shopName: sellerForm.shopName,
        ownerName: sellerForm.ownerName,
        phone: sellerForm.phone,
        email: sellerForm.email,
        district: sellerForm.district,
        category: sellerForm.category
      });
      setSellerRegistered(app);
    } catch (err) {
      console.error('Merchant application submission error:', err);
    }
  };

  const saveCookieSettings = () => {
    try {
      localStorage.setItem('lsm_cookie_prefs', JSON.stringify(cookiePrefs));
    } catch {}
    setCookieSavedToast(true);
    setTimeout(() => {
      setCookieSavedToast(false);
      setActiveModal(null);
    }, 1500);
  };

  // FAQ Items Data
  const faqs = [
    {
      q: 'How can I track my parcel delivery in Bangladesh?',
      bengali: 'আমি কীভাবে আমার পার্সেল ট্র্যাক করব?',
      category: 'orders',
      a: 'You can track your parcel anytime using the "Track Your Order" feature in the footer or header. Enter your Order ID (e.g. ORD-10294) to view live fulfillment updates, courier consignment numbers (Steadfast/Pathao), and estimated delivery time.',
      aBn: 'ফুটার বা হেডারে থাকা "অর্ডার ট্র্যাক করুন" ফিচার ব্যবহার করে আপনি যেকোনো সময় আপনার পার্সেল ট্র্যাক করতে পারবেন। আপনার অর্ডার আইডি (যেমন ORD-10294) লিখলে লাইভ স্ট্যাটাস, কুরিয়ার কনসাইনমেন্ট নম্বর ও সম্ভাব্য ডেলিভারি সময় দেখতে পাবেন।'
    },
    {
      q: 'What are the delivery charges and timelines?',
      bengali: 'ডেলিভারি চার্জ এবং সময়সীমা কত?',
      category: 'shipping',
      a: 'Inside Dhaka City: 24 to 48 Hours (৳70). Sub-Dhaka (Gazipur, Narayanganj, Savar): 36 to 48 Hours (৳100). Nationwide (Outside Dhaka - All 64 Districts): 48 to 72 Hours (৳130). Orders above ৳1,500 qualify for FREE standard delivery!',
      aBn: 'ঢাকা সিটির ভেতরে: ২৪ থেকে ৪৮ ঘণ্টা (৳৭০)। সাব-ঢাকা (গাজীপুর, নারায়ণগঞ্জ, সাভার): ৩৬ থেকে ৪৮ ঘণ্টা (৳১০০)। সারাদেশে (ঢাকার বাইরে ৬৪ জেলা): ৪৮ থেকে ৭২ ঘণ্টা (৳১৩০)। ১,৫০০ টাকার বেশি অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি!'
    },
    {
      q: 'Can I pay via Cash on Delivery (COD)?',
      bengali: 'ক্যাশ অন ডেলিভারি (COD) পেমেন্ট কি গ্রহণযোগ্য?',
      category: 'payment',
      a: 'Yes! Cash on Delivery is available across all 64 districts in Bangladesh. You may inspect the parcel condition in front of the courier rider before handing over payment.',
      aBn: 'হ্যাঁ! বাংলাদেশের ৬৪ জেলায় ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে। টাকা পরিশোধের আগে আপনি কুরিয়ার রাইডারের সামনে পার্সেলটি দেখে নিতে পারবেন।'
    },
    {
      q: 'What is your 7-Day Return and Refund Policy?',
      bengali: '৭ দিনের রিটার্ন ও রিফান্ড পলিসি কী?',
      category: 'returns',
      a: 'If any product has defects, size mismatch, or is not as described, you can request a 100% free return within 7 calendar days of delivery. The item must be unworn, with tags and original packaging. Refunds are processed to your bKash/Nagad or bank account within 24-48 hours.',
      aBn: 'কোনো পণ্যে ত্রুটি, সাইজের অমিল বা বিবরণের সাথে না মিললে ডেলিভারির ৭ দিনের মধ্যে ১০০% ফ্রি রিটার্ন নিতে পারবেন। পণ্যটি অব্যবহৃত ও মূল ট্যাগ-প্যাকেজিংসহ থাকতে হবে। ২৪-৪৮ ঘণ্টার মধ্যে বিকাশ/নগদ বা ব্যাংক অ্যাকাউন্টে রিফান্ড পাঠানো হয়।'
    },
    {
      q: 'Which digital payment options do you support?',
      bengali: 'কোন কোন ডিজিটাল পেমেন্ট মাধ্যম সমর্থিত?',
      category: 'payment',
      a: 'We support bKash, Nagad, Rocket, VISA, MasterCard, UnionPay, and American Express. All digital payments are encrypted with 256-bit SSL protocols.',
      aBn: 'আমরা বিকাশ, নগদ, রকেট, ভিসা, মাস্টারকার্ড, ইউনিয়নপে ও আমেরিকান এক্সপ্রেস সমর্থন করি। সব ডিজিটাল পেমেন্ট ২৫৬-বিট SSL এনক্রিপশনে সুরক্ষিত।'
    },
    {
      q: 'Are all products 100% genuine and authentic?',
      bengali: 'সকল পণ্য কি ১০০% আসল ও অরিজিনাল?',
      category: 'orders',
      a: 'Every product sold on Digital Shop T.M is sourced directly from certified authorized brand distributors with genuine manufacturer warranties.',
      aBn: 'Digital Shop T.M-এ বিক্রি হওয়া প্রতিটি পণ্য অনুমোদিত ব্র্যান্ড ডিস্ট্রিবিউটরদের কাছ থেকে সরাসরি সংগৃহীত এবং মূল ওয়ারেন্টিসহ আসে।'
    }
  ];

  const filteredFaqs = faqs.filter(item => {
    const matchesCategory = faqCategory === 'all' || item.category === faqCategory;
    const matchesSearch = !faqSearch.trim() || 
      item.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
      item.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.bengali.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.aBn.toLowerCase().includes(faqSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const hotlineDisplay = siteConfig?.hotlinePhone || '+880 9612-880000';
  const whatsappDisplay = siteConfig?.whatsappNumber || hotlineDisplay;
  const emailDisplay = siteConfig?.supportEmail || 'support@digitalshop.com.bd';
  const addressDisplay = siteConfig?.officeAddress || 'Suite 6B, Navana Tower, 45 Gulshan Avenue, Gulshan 1, Dhaka-1212, Bangladesh';

  return (
    <footer className="relative bg-[#070b14] text-slate-300 font-sans border-t border-white/10 overflow-hidden">
      {/* Signature Architectural Top Hairline & Ambient Glow */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-90" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[min(860px,92vw)] h-56 bg-brand-orange/[0.08] blur-[120px] rounded-full"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-24 md:pb-9">
        
        {/* 1. Executive VIP Newsletter & Welcome Gift Strip */}
        <div className="pb-8 sm:pb-10 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-10">
          <div className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-orange mb-1.5">
              {t('Member Privileges & Early Access', 'মেম্বার সুবিধা ও আর্লি অ্যাক্সেস')}
            </p>
            <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-white font-luxury">
              {t('Unlock a ৳200 Welcome Gift & Priority Flash Alerts', '৳২০০ ওয়েলকাম গিফট ও ফ্ল্যাশ সেল অ্যালার্ট পান')}
            </h3>
            <p className="text-xs sm:text-[13px] text-slate-400 mt-1.5 leading-relaxed">
              {t(
                'Join verified shoppers receiving curated product drops, restock alerts, and subscriber-only promo codes.',
                'সাবস্ক্রাইব করে নতুন প্রোডাক্ট ড্রপ, রিস্টক অ্যালার্ট এবং এক্সক্লুসিভ প্রোমো কোড সবার আগে পান।'
              )}
            </p>
          </div>

          <div className="w-full lg:w-[440px] shrink-0">
            <form onSubmit={handleSubscribe} className="space-y-2.5">
              <div className="flex items-center bg-white/[0.04] border border-white/15 rounded-xl p-1.5 focus-within:border-brand-orange focus-within:bg-white/[0.06] focus-within:ring-2 focus-within:ring-brand-orange/20 transition-all">
                <Mail size={16} className="text-slate-400 ml-2.5 shrink-0 hidden sm:block" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (newsletterStatus === 'error') setNewsletterStatus('idle');
                  }}
                  placeholder={t('Enter your email address', 'আপনার ইমেইল ঠিকানা লিখুন')}
                  className="flex-1 min-w-0 bg-transparent px-3 py-2 text-xs sm:text-[13px] text-white placeholder:text-slate-500 outline-none focus:outline-none focus:ring-0 border-none"
                />
                <button
                  type="submit"
                  className="bg-brand-orange hover:bg-brand-orange-light text-white px-4 sm:px-5 py-2.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm"
                >
                  <span>{t('Subscribe', 'সাবস্ক্রাইব')}</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {newsletterStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-rose-400 text-[11px] font-medium px-1">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {newsletterStatus === 'success' && (
                <div className="bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <CheckCircle2 size={15} className="shrink-0" />
                    <span>{t('Welcome Voucher Ready:', 'ওয়েলকাম ভাউচার:')}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#05080f] border border-emerald-500/30 rounded-lg px-2.5 py-1">
                    <code className="font-mono font-bold text-white tracking-wider text-xs">{voucherCode}</code>
                    <button
                      type="button"
                      onClick={handleCopyVoucher}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-white cursor-pointer"
                    >
                      {copiedVoucher ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedVoucher ? t('Copied', 'কপি হয়েছে') : t('Copy', 'কপি')}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* 2. Architectural Service Guarantee Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-white/[0.08] divide-white/[0.08] lg:divide-x">
          {[
            {
              modal: 'shipping' as ModalType,
              icon: <Truck size={18} />,
              title: t('Nationwide Express', 'দ্রুত সারাদেশে ডেলিভারি'),
              sub: t('64 Districts · 24–72 hrs', 'বাংলাদেশের ৬৪ জেলায় · ২৪–৭২ ঘণ্টা'),
            },
            {
              modal: 'terms' as ModalType,
              icon: <ShieldCheck size={18} />,
              title: t('100% Authentic Goods', '১০০% আসল ও খাঁটি পণ্য'),
              sub: t('Authorized Brand Sourcing', 'যাচাইকৃত ব্র্যান্ড ডিস্ট্রিবিউটর'),
            },
            {
              modal: 'returns' as ModalType,
              icon: <RefreshCw size={18} />,
              title: t('7-Day Easy Returns', '৭ দিনে সহজ রিটার্ন'),
              sub: t('Instant bKash / Bank Refund', 'দ্রুত বিকাশ ও ব্যাংক রিফান্ড'),
            },
            {
              modal: 'privacy' as ModalType,
              icon: <Lock size={18} />,
              title: t('256-Bit SSL Checkout', '২৫৬-বিট SSL সুরক্ষিত'),
              sub: t('Verified PCI-DSS Security', '১০০% নিরাপদ পেমেন্ট ও তথ্য'),
            },
          ].map((pillar, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveModal(pillar.modal)}
              className={`flex items-start sm:items-center gap-3 py-5 sm:py-6 px-2 sm:px-5 first:pl-0 last:pr-0 hover:bg-white/[0.025] transition-colors text-left group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                idx >= 2 ? 'border-t lg:border-t-0 border-white/[0.08]' : ''
              } ${idx % 2 === 1 ? 'border-l sm:border-l lg:border-l-0 border-white/[0.08] pl-3.5 sm:pl-5' : ''}`}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/10 text-slate-200 group-hover:text-brand-orange group-hover:border-brand-orange/40 group-hover:bg-brand-orange/10 flex items-center justify-center shrink-0 transition-all">
                {pillar.icon}
              </div>
              <div className="min-w-0">
                <h5 className="text-xs sm:text-[13px] font-bold text-white group-hover:text-brand-orange transition-colors leading-snug">
                  {pillar.title}
                </h5>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 tabular-nums leading-snug">
                  {pillar.sub}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* 3. Main Balanced 12-Column Flagship Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-9 lg:gap-10 py-9 sm:py-12">
          
          {/* Brand, Concierge Contact & Socials (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ea580c] via-brand-orange to-amber-400 text-white flex items-center justify-center font-luxury font-black text-lg shadow-lg shadow-orange-500/20 overflow-hidden shrink-0">
                {siteConfig?.siteLogo ? (
                  <img src={siteConfig.siteLogo} alt={`${siteConfig?.siteName || 'Digital Shop T.M'} Official Brand Logo`} className="w-full h-full object-contain p-1" />
                ) : (
                  siteConfig?.siteName?.charAt(0) || 'D'
                )}
              </div>
              <div>
                <span className="text-lg sm:text-xl font-black tracking-tight text-white font-luxury block leading-none">
                  {siteConfig?.siteName || 'Digital Shop T.M'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {t('Flagship Online Marketplace · Bangladesh', 'বাংলাদেশের বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md lg:max-w-sm">
              {siteConfig?.aboutUsText || t(
                'Curated authentic smartphones, computing gear, fashion, and home essentials sourced from certified brand partners with nationwide doorstep delivery.',
                'Digital Shop T.M সরাসরি অনুমোদিত ব্র্যান্ড পার্টনার থেকে আসল ইলেকট্রনিক্স, গ্যাজেট, ফ্যাশন ও লাইফস্টাইল পণ্য দ্রুত সারাদেশে পৌঁছে দেয়।'
              )}
            </p>

            {/* Streamlined Concierge Contact Matrix */}
            <div className="pt-4 border-t border-white/[0.08] space-y-2.5 text-xs max-w-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <a href={`tel:${hotlineDisplay}`} className="inline-flex items-center gap-2 font-semibold text-white hover:text-brand-orange transition-colors tabular-nums">
                  <Phone size={14} className="text-brand-orange shrink-0" />
                  <span>{hotlineDisplay}</span>
                </a>
                <a
                  href={`https://wa.me/${whatsappDisplay.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  <MessageCircle size={13} className="text-emerald-400 shrink-0" />
                  <span>{t('WhatsApp Concierge', 'হোয়াটসঅ্যাপ')}</span>
                </a>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <a href={`mailto:${emailDisplay}`} className="text-slate-300 hover:text-brand-orange transition-colors truncate">
                  {emailDisplay}
                </a>
              </div>

              {siteConfig?.operatingHours && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400 tabular-nums">
                  <Clock size={13} className="text-slate-500 shrink-0" />
                  <span>{siteConfig.operatingHours}</span>
                </div>
              )}

              <div className="flex items-start gap-2 text-[11px] text-slate-400">
                <MapPin size={13} className="text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-snug">{addressDisplay}</span>
              </div>
            </div>

            {/* Social Media Channels */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <a
                href={siteConfig?.facebookUrl || 'https://www.facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.1] hover:border-white/25 flex items-center justify-center transition-all cursor-pointer"
              >
                <Facebook size={15} />
              </a>
              <a
                href={siteConfig?.instagramUrl || 'https://www.instagram.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.1] hover:border-white/25 flex items-center justify-center transition-all cursor-pointer"
              >
                <Instagram size={15} />
              </a>
              <a
                href={siteConfig?.youtubeUrl || 'https://www.youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.1] hover:border-white/25 flex items-center justify-center transition-all cursor-pointer"
              >
                <Youtube size={15} />
              </a>
              <a
                href={siteConfig?.tiktokUrl || 'https://www.tiktok.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.1] hover:border-white/25 flex items-center justify-center transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.3 6.3 0 0 0 1.86-4.49V8.52a8.28 8.28 0 0 0 4.91 1.62V6.69z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Mobile 2-Column Wrapper for Departments + Customer Care (unwraps into lg:grid-cols-12) */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:contents">
            {/* Shop Departments Column (2 cols) */}
            <div className="lg:col-span-2">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200 mb-4">
                {t('Departments', 'বিভাগসমূহ')}
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-slate-400">
                {[
                  { label: t('Smartphones & Mobiles', 'স্মার্টফোন ও মোবাইল'), path: `/search?category=${encodeURIComponent('Smartphones & Mobiles')}` },
                  { label: t('Laptops & Computers', 'ল্যাপটপ ও কম্পিউটার'), path: `/search?category=${encodeURIComponent('Laptops & Computers')}` },
                  { label: t('Headphones & Audio', 'হেডফোন ও অডিও'), path: `/search?category=${encodeURIComponent('Headphones & Audio')}` },
                  { label: t('Fashion & Apparel', 'ফ্যাশন ও পোশাক'), path: `/search?category=${encodeURIComponent('Fashions')}` },
                  { label: t('Health & Beauty', 'স্বাস্থ্য ও সৌন্দর্য'), path: `/search?category=${encodeURIComponent('Health & Beauty')}` },
                  { label: t('Home & Lifestyle', 'হোম ও লাইফস্টাইল'), path: `/search?category=${encodeURIComponent('Home & Lifestyle')}` },
                  { label: t('Home Appliances', 'গৃহস্থালী যন্ত্রপাতি'), path: `/search?category=${encodeURIComponent('Home Appliances')}` },
                ].map((item) => (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => navigateToCategory(item.path)}
                      className="group inline-flex items-center gap-1.5 text-left text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="group-hover:text-brand-orange transition-colors">{item.label}</span>
                      <ArrowRight size={12} className="hidden sm:inline opacity-0 -translate-x-1 text-brand-orange group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Care & Account Column (3 cols) */}
            <div className="lg:col-span-3">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200 mb-4">
                {t('Customer Care', 'গ্রাহক সেবা')}
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-[13px] text-slate-400">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('track')}
                    className="inline-flex items-center gap-2 text-left text-slate-200 hover:text-brand-orange transition-colors cursor-pointer font-semibold"
                  >
                    <span>{t('Track Your Order', 'অর্ডার ট্র্যাক করুন')}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-orange">
                      {t('Live', 'লাইভ')}
                    </span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenOrders) onOpenOrders();
                      else navigate('/profile');
                    }}
                    className="hover:text-brand-orange transition-colors text-left cursor-pointer"
                  >
                    {t('My Orders & Invoices', 'আমার অর্ডার ও ইনভয়েস')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('shipping')}
                    className="hover:text-brand-orange transition-colors text-left cursor-pointer"
                  >
                    {t('Shipping & Delivery Policy', 'শিপিং ও ডেলিভারি নীতি')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('returns')}
                    className="hover:text-brand-orange transition-colors text-left cursor-pointer"
                  >
                    {t('Returns & Refunds (7-Day)', 'রিটার্ন ও রিফান্ড (৭ দিন)')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('seller')}
                    className="hover:text-brand-orange transition-colors text-left cursor-pointer"
                  >
                    {t('Become a Verified Seller', 'ভেরিফায়েড সেলার হোন')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('help')}
                    className="hover:text-brand-orange transition-colors text-left cursor-pointer"
                  >
                    {t('Help Center & FAQs', 'সহায়তা কেন্দ্র ও প্রশ্নোত্তর')}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Verified Payments & Logistics Assurance (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200 mb-3.5">
                {t('Verified Payment Channels', 'নিরাপদ পেমেন্ট মাধ্যম')}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-semibold">
                {[
                  { label: t('bKash', 'বিকাশ'), dot: 'bg-pink-400' },
                  { label: t('Nagad', 'নগদ'), dot: 'bg-orange-400' },
                  { label: t('Rocket', 'রকেট'), dot: 'bg-violet-400' },
                  { label: 'VISA', dot: 'bg-sky-400' },
                  { label: 'Mastercard', dot: 'bg-amber-400' },
                  { label: t('COD', 'ক্যাশ অন'), dot: 'bg-emerald-400' },
                ].map((method) => (
                  <div
                    key={method.label}
                    className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-white/[0.03] border border-white/[0.09] text-slate-200"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${method.dot}`} />
                    <span className="truncate">{method.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">
                {t('Logistics Partners', 'অনুমোদিত কুরিয়ার পার্টনার')}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-300">
                <span>Steadfast</span>
                <span className="text-white/20">·</span>
                <span>Pathao</span>
                <span className="text-white/20">·</span>
                <span>RedX</span>
                <span className="text-white/20">·</span>
                <span>Paperfly</span>
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <Lock size={12} className="text-emerald-400 shrink-0" />
                <span>{t('PCI-DSS & 256-Bit SSL Encrypted Checkout', 'PCI-DSS ও ২৫৬-বিট SSL সুরক্ষিত চেকআউট')}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 4. Crisp Bottom Legal & Utility Bar (md:pr-20 keeps clear of floating LiveChatWidget) */}
        <div className="pt-5 sm:pt-6 border-t border-white/[0.08] flex flex-col md:flex-row justify-between items-center gap-3.5 sm:gap-4 text-xs text-slate-400 md:pr-20">
          <p className="text-center md:text-left tabular-nums">
            © {new Date().getFullYear()} {siteConfig?.siteName || 'Digital Shop T.M'}. {t('All rights reserved.', 'সর্বস্বত্ব সংরক্ষিত।')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2.5">
            <button
              type="button"
              onClick={() => setActiveModal('privacy')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t('Privacy Policy', 'গোপনীয়তা নীতি')}
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('terms')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t('Terms of Service', 'সেবার শর্তাবলী')}
            </button>
            <button
              type="button"
              onClick={() => setActiveModal('cookies')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t('Cookie Preferences', 'কুকি সেটিংস')}
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-brand-orange text-slate-200 hover:text-white border border-white/10 hover:border-brand-orange transition-all cursor-pointer text-[11px] font-semibold"
              aria-label={t('Back to top', 'উপরে যান')}
            >
              <span>{t('Top', 'উপরে')}</span>
              <ArrowUp size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COMPREHENSIVE MODAL SYSTEM FOR ALL FOOTER ACTIONS */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl z-10 my-0 sm:my-8 max-h-[88dvh] sm:max-h-[90vh] flex flex-col"
            >
              {/* Close Icon Button */}
              <button 
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 text-gray-400 hover:text-gray-900 transition-colors z-20 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
                aria-label={t('Close dialog', 'বন্ধ করুন')}
              >
                <X size={18} />
              </button>

              {/* ---------------- 1. TRACK YOUR ORDER MODAL ---------------- */}
              {activeModal === 'track' && (
                <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center gap-3 mb-5 sm:mb-6 pr-8">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center shrink-0">
                      <Truck size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">{t('Track Your Order', 'পার্সেল ট্র্যাকিং')}</h3>
                      <p className="text-xs text-gray-400">{t('Live status from Steadfast & Pathao logistics', 'স্টেডফাস্ট ও পাঠাও লজিস্টিকস থেকে লাইভ স্ট্যাটাস')}</p>
                    </div>
                  </div>

                  {/* Search Input */}
                  <form onSubmit={handleTrackOrder} className="flex flex-col sm:flex-row gap-2.5 mb-5 sm:mb-6">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text"
                        value={trackingIdInput}
                        onChange={(e) => setTrackingIdInput(e.target.value)}
                        placeholder={t('Enter Order ID (e.g. ORD-10294) or Phone Number', 'অর্ডার আইডি (যেমন ORD-10294) বা মোবাইল নম্বর লিখুন')}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-xs font-mono text-gray-900 focus:outline-none focus:border-brand-orange focus:bg-white transition-all font-bold"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full sm:w-auto bg-brand-orange hover:bg-brand-orange-light text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 cursor-pointer shrink-0"
                    >
                      {t('Track Now', 'ট্র্যাক করুন')}
                    </button>
                  </form>

                  {/* Quick Order History Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-orange-50/60 rounded-xl border border-orange-100 mb-6 text-xs">
                    <span className="text-gray-700 font-medium">{t('Have an account? View all your past purchases:', 'অ্যাকাউন্ট আছে? আপনার সব পূর্ববর্তী অর্ডার দেখুন:')}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        if (onOpenOrders) onOpenOrders();
                        else navigate('/profile');
                      }}
                      className="text-brand-orange font-bold hover:underline shrink-0 cursor-pointer text-left sm:text-right"
                    >
                      {t('My Orders List →', 'আমার অর্ডার তালিকা →')}
                    </button>
                  </div>

                  {/* Loading State */}
                  {isTrackLoading && (
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200 text-center space-y-2">
                      <div className="w-8 h-8 border-3 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-mono text-gray-600">{t('Verifying order status with logistics database...', 'লজিস্টিকস ডাটাবেজে অর্ডার স্ট্যাটাস যাচাই হচ্ছে...')}</p>
                    </div>
                  )}

                  {/* Order Not Found State */}
                  {hasSearchedOrder && !isTrackLoading && !trackedOrderResult && (
                    <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200/80 text-center space-y-2">
                      <p className="text-sm font-bold text-amber-900">{t('Order Not Found', 'অর্ডার পাওয়া যায়নি')}</p>
                      <p className="text-xs text-amber-700">
                        {t(
                          `No order was found matching "${trackingIdInput}". Please check your Order ID or registered phone number.`,
                          `"${trackingIdInput}" এর সাথে মিলে এমন কোনো অর্ডার পাওয়া যায়নি। আপনার অর্ডার আইডি বা মোবাইল নম্বর যাচাই করুন।`
                        )}
                      </p>
                    </div>
                  )}

                  {/* Tracked Result View */}
                  {trackedOrderResult && (
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200/80 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-2">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-gray-400">{t('Order Reference', 'অর্ডার রেফারেন্স')}</span>
                          <h4 className="text-base font-black text-gray-900 font-mono">{trackedOrderResult.id}</h4>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-[10px] font-mono uppercase text-gray-400">{t('Logistics Partner', 'কুরিয়ার পার্টনার')}</span>
                          <p className="text-xs font-bold text-gray-800">{trackedOrderResult.carrier || t('Steadfast Courier (Nationwide)', 'স্টেডফাস্ট কুরিয়ার (সারাদেশে)')}</p>
                        </div>
                      </div>

                      {/* Timeline Steps */}
                      <div className="space-y-4 pt-1">
                        <p className="text-xs font-black uppercase text-gray-700 font-mono tracking-wider">{t('Shipment Milestones', 'শিপমেন্ট ধাপসমূহ')}</p>
                        <div className="space-y-3">
                          {(trackedOrderResult.steps || []).map((step: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 relative">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold ${
                                step.done 
                                  ? 'bg-emerald-500 text-white' 
                                  : 'bg-gray-200 text-gray-400'
                              }`}>
                                {step.done ? <Check size={12} strokeWidth={3} /> : idx + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={`text-xs font-bold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {step.label}
                                  </p>
                                  {step.current && (
                                    <span className="bg-brand-orange text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                                      {t('Current Stage', 'বর্তমান ধাপ')}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-500 font-mono">{step.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
                        <span>{t('Need live rider assistance?', 'রাইডার সংক্রান্ত সহায়তা প্রয়োজন?')}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            setActiveModal(null);
                            if (onOpenChat) onOpenChat('Digital Shop T.M Courier Logistics');
                          }}
                          className="text-brand-orange font-bold hover:underline cursor-pointer text-left sm:text-right"
                        >
                          {t('Chat with Dispatch Support', 'ডিসপ্যাচ সাপোর্টে চ্যাট করুন')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- 2. SHIPPING & DELIVERY POLICY MODAL ---------------- */}
              {activeModal === 'shipping' && (
                <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center shrink-0">
                      <Truck size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">{t('Shipping & Delivery Policy', 'শিপিং ও ডেলিভারি নীতিমালা')}</h3>
                      <p className="text-xs text-gray-400 font-mono">{t('Fast & secure shipping across all 64 districts', 'দেশের সব ৬৪ জেলায় দ্রুত ও নিরাপদ ডেলিভারি')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100">
                      <span className="text-[10px] font-black uppercase text-brand-orange font-mono">{t('Inside Dhaka', 'ঢাকার ভেতরে')}</span>
                      <h4 className="text-base font-black text-gray-900 mt-1">{t('24 - 48 Hours', '২৪ - ৪৮ ঘণ্টা')}</h4>
                      <p className="text-xs font-mono text-gray-600 mt-1">{t('Standard: ৳70', 'চার্জ: ৳৭০')}</p>
                      <p className="text-[10px] text-gray-500 mt-2">{t('Same-day express dispatch available for morning orders.', 'সকালের অর্ডারের জন্য একই দিনে এক্সপ্রেস ডিসপ্যাচ সুবিধা।')}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100">
                      <span className="text-[10px] font-black uppercase text-amber-700 font-mono">{t('Sub-Dhaka', 'সাব-ঢাকা')}</span>
                      <h4 className="text-base font-black text-gray-900 mt-1">{t('36 - 48 Hours', '৩৬ - ৪৮ ঘণ্টা')}</h4>
                      <p className="text-xs font-mono text-gray-600 mt-1">{t('Standard: ৳100', 'চার্জ: ৳১০০')}</p>
                      <p className="text-[10px] text-gray-500 mt-2">{t('Gazipur, Narayanganj, Savar, Keraniganj.', 'গাজীপুর, নারায়ণগঞ্জ, সাভার, কেরানীগঞ্জ।')}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                      <span className="text-[10px] font-black uppercase text-emerald-700 font-mono">{t('Nationwide', 'সারাদেশে')}</span>
                      <h4 className="text-base font-black text-gray-900 mt-1">{t('48 - 72 Hours', '৪৮ - ৭২ ঘণ্টা')}</h4>
                      <p className="text-xs font-mono text-gray-600 mt-1">{t('Standard: ৳130', 'চার্জ: ৳১৩০')}</p>
                      <p className="text-[10px] text-gray-500 mt-2">{t('All 64 districts including divisional & upazila areas.', 'বিভাগ ও উপজেলাসহ দেশের সব ৬৪ জেলায়।')}</p>
                    </div>
                  </div>

                  {/* Free Delivery Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider font-mono">{t('Special Free Shipping Privilege', 'বিশেষ ফ্রি ডেলিভারি সুবিধা')}</p>
                      <p className="text-xs font-medium text-white/90 mt-0.5">{t('Orders over ৳1,500 qualify for 100% Free Shipping anywhere in Bangladesh!', '৳১,৫০০-এর বেশি অর্ডারে বাংলাদেশের যেকোনো স্থানে ১০০% ফ্রি ডেলিভারি!')}</p>
                    </div>
                    <span className="text-xl font-black font-mono shrink-0">৳0</span>
                  </div>

                  <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
                    <h5 className="text-sm font-black text-gray-900 uppercase tracking-tight">{t('Key Delivery Terms', 'ডেলিভারির মূল শর্তাবলী')}</h5>
                    <ul className="list-disc pl-5 space-y-1.5">
                      <li><strong>{t('Open-Box Verification:', 'ওপেন-বক্স যাচাই:')}</strong> {t('You are entitled to check the external product condition and contents with the courier hero before payment.', 'পেমেন্ট করার আগে কুরিয়ার রাইডারের সামনে পণ্যের বাহ্যিক অবস্থা ও ভেতরের পণ্য দেখে নেওয়ার অধিকার রয়েছে।')}</li>
                      <li><strong>{t('Cash on Delivery:', 'ক্যাশ অন ডেলিভারি:')}</strong> {t('Available throughout Bangladesh with no additional COD surcharge.', 'অতিরিক্ত কোনো COD চার্জ ছাড়াই সারাদেশে উপলব্ধ।')}</li>
                      <li><strong>{t('Authorized Logistics Partners:', 'অনুমোদিত কুরিয়ার পার্টনার:')}</strong> {t('Pathao Courier, Steadfast Courier, RedX Logistics, and Paperfly.', 'পাঠাও কুরিয়ার, স্টেডফাস্ট কুরিয়ার, রেডএক্স ও পেপারফ্লাই।')}</li>
                      <li><strong>{t('Delivery Tracking:', 'ডেলিভারি ট্র্যাকিং:')}</strong> {t('An SMS with a direct tracking link and rider phone number will be sent once the parcel leaves our central facility.', 'পার্সেল বের হওয়ার সাথে সাথে ট্র্যাকিং লিংক ও রাইডারের ফোন নম্বরসহ SMS পাঠানো হবে।')}</li>
                    </ul>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setActiveModal('track')}
                    className="w-full py-3.5 bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                  >
                    {t('Track Existing Parcel →', 'আপনার পার্সেল ট্র্যাক করুন →')}
                  </button>
                </div>
              )}

              {/* ---------------- 3. RETURNS & REFUNDS MODAL ---------------- */}
              {activeModal === 'returns' && (
                <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                      <RefreshCw size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">{t('7-Day Return & Refund Policy', '৭ দিনের রিটার্ন ও রিফান্ড নীতিমালা')}</h3>
                      <p className="text-xs text-gray-400 font-mono">{t('100% Easy Return & Money-Back Guarantee', '১০০% সহজ রিটার্ন এবং মানিব্যাক গ্যারান্টি')}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-blue-900 uppercase">{t('100% Money-Back Guarantee', '১০০% মানি-ব্যাক গ্যারান্টি')}</h4>
                      <p className="text-xs text-blue-800/80 mt-0.5 leading-relaxed">
                        {t(
                          'If your item arrives defective, damaged, incorrect size, or does not match the product description, you are eligible for an immediate replacement or full money refund within 7 calendar days of delivery.',
                          'যদি আপনার পণ্যটি ত্রুটিপূর্ণ, ক্ষতিগ্রস্ত, ভুল সাইজ বা বিবরণের সাথে না মিলে, তবে ডেলিভারির ৭ দিনের মধ্যে তাৎক্ষণিক রিপ্লেসমেন্ট অথবা সম্পূর্ণ অর্থ ফেরত পাবেন।'
                        )}
                      </p>
                    </div>
                  </div>

                  {/* 4 Steps to Return */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black uppercase tracking-wider text-gray-800 font-mono">{t('How to Request a Return', 'কীভাবে রিটার্ন অনুরোধ করবেন')}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50">
                        <div className="text-xs font-black text-brand-orange font-mono mb-1">{t('Step 1: Contact Support', 'ধাপ ১: সাপোর্টে যোগাযোগ')}</div>
                        <p className="text-xs text-gray-600">{t('Open Live Chat or message on WhatsApp with your Order ID and photo of the issue.', 'অর্ডার আইডি এবং সমস্যার ছবি সহ লাইভ চ্যাট বা হোয়াটসঅ্যাপে মেসেজ করুন।')}</p>
                      </div>
                      <div className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50">
                        <div className="text-xs font-black text-brand-orange font-mono mb-1">{t('Step 2: Free Pickup', 'ধাপ ২: ফ্রি পিকআপ')}</div>
                        <p className="text-xs text-gray-600">{t('Our courier partner picks up the item from your doorstep at zero cost.', 'আমাদের কুরিয়ার পার্টনার কোনো চার্জ ছাড়াই আপনার বাসা থেকে পণ্যটি সংগ্রহ করবে।')}</p>
                      </div>
                      <div className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50">
                        <div className="text-xs font-black text-brand-orange font-mono mb-1">{t('Step 3: Quality Check', 'ধাপ ৩: মান যাচাই')}</div>
                        <p className="text-xs text-gray-600">{t('Upon reaching our Dhaka warehouse, the item is inspected within 12-24 hours.', 'ঢাকা ওয়্যারহাউসে পৌঁছানোর ১২-২৪ ঘণ্টার মধ্যে পণ্যটি পরীক্ষা করা হয়।')}</p>
                      </div>
                      <div className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50">
                        <div className="text-xs font-black text-brand-orange font-mono mb-1">{t('Step 4: Instant Refund', 'ধাপ ৪: দ্রুত রিফান্ড')}</div>
                        <p className="text-xs text-gray-600">{t('Refund credited directly to your bKash, Nagad, or Bank Account within 24 hours.', '২৪ ঘণ্টার মধ্যে সরাসরি আপনার বিকাশ, নগদ বা ব্যাংক অ্যাকাউন্টে টাকা ফেরত পাঠানো হয়।')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-100 text-xs text-gray-700 space-y-1">
                    <p className="font-bold">{t('Return Eligibility Conditions:', 'রিটার্নের যোগ্যতার শর্তাবলী:')}</p>
                    <ul className="list-disc pl-4 space-y-1 text-gray-600 text-[11px]">
                      <li>{t('Product must be unworn, unwashed, and with all original designer tags attached.', 'পণ্যটি অব্যবহৃত, না ধোয়া এবং সব মূল ট্যাগযুক্ত থাকতে হবে।')}</li>
                      <li>{t('Original brand box or protective pouch must be included.', 'মূল ব্র্যান্ড বক্স বা পাউচ সঙ্গে থাকতে হবে।')}</li>
                      <li>{t('Electronics must include all accessories, cables, and warranty card.', 'ইলেকট্রনিক্সের সব অ্যাক্সেসরিজ, কেবল ও ওয়ারেন্টি কার্ড থাকতে হবে।')}</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setActiveModal(null);
                        if (onOpenChat) onOpenChat('Digital Shop T.M Returns Concierge');
                      }}
                      className="flex-1 py-3.5 bg-brand-orange text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-orange-light transition-all cursor-pointer"
                    >
                      {t('Start Return via Chat', 'চ্যাটের মাধ্যমে রিটার্ন শুরু করুন')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="w-full sm:w-auto px-6 py-3.5 bg-gray-200 text-gray-800 text-xs font-bold rounded-xl hover:bg-gray-300 transition-all cursor-pointer"
                    >
                      {t('Got It', 'বুঝেছি')}
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- 4. SELLER REGISTRATION MODAL ---------------- */}
              {activeModal === 'seller' && (
                <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Store size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">{t('Become a Seller on Digital Shop T.M', 'Digital Shop T.M-এ সেলার হিসেবে যুক্ত হোন')}</h3>
                      <p className="text-xs text-gray-400 font-mono">{t('Join as a merchant and grow your business', 'মার্চেন্ট হিসেবে যুক্ত হোন ও ব্যবসা বড় করুন')}</p>
                    </div>
                  </div>

                  {!sellerRegistered ? (
                    <>
                      {/* Benefits Banner */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { title: t('0% Commission', '০% কমিশন'), sub: t('First 30 days free', 'প্রথম ৩০ দিন ফ্রি') },
                          { title: t('500k+ Buyers', '৫ লক্ষ+ ক্রেতা'), sub: t('Nationwide reach', 'সারাদেশে ক্রেতা') },
                          { title: t('Weekly Payouts', 'সাপ্তাহিক পেআউট'), sub: t('bKash / Bank transfer', 'বিকাশ / ব্যাংক ট্রান্সফার') },
                          { title: t('Automated Logistics', 'অটোমেটেড লজিস্টিকস'), sub: t('Courier integration', 'কুরিয়ার ইন্টিগ্রেশন') }
                        ].map((b, i) => (
                          <div key={i} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-center">
                            <p className="text-[11px] font-black text-gray-900 leading-tight">{b.title}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">{b.sub}</p>
                          </div>
                        ))}
                      </div>

                      {/* Registration Form */}
                      <form onSubmit={handleSellerSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase text-gray-500 mb-1">{t('Shop / Business Name *', 'দোকান / ব্যবসার নাম *')}</label>
                            <input 
                              type="text" 
                              required
                              value={sellerForm.shopName}
                              onChange={(e) => setSellerForm(prev => ({ ...prev, shopName: e.target.value }))}
                              placeholder={t('e.g. Prestige Apparel Dhaka', 'যেমন: প্রেস্টিজ অ্যাপারেল ঢাকা')}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-brand-orange focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase text-gray-500 mb-1">{t('Owner / Contact Person *', 'মালিক / যোগাযোগকারীর নাম *')}</label>
                            <input 
                              type="text" 
                              required
                              value={sellerForm.ownerName}
                              onChange={(e) => setSellerForm(prev => ({ ...prev, ownerName: e.target.value }))}
                              placeholder={t('Full Legal Name', 'সম্পূর্ণ নাম')}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-brand-orange focus:bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase text-gray-500 mb-1">{t('Phone / Mobile (WhatsApp) *', 'ফোন / মোবাইল (হোয়াটসঅ্যাপ) *')}</label>
                            <input 
                              type="tel" 
                              required
                              value={sellerForm.phone}
                              onChange={(e) => setSellerForm(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="017XXXXXXXX"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-brand-orange focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase text-gray-500 mb-1">{t('Email Address', 'ইমেইল ঠিকানা')}</label>
                            <input 
                              type="email" 
                              value={sellerForm.email}
                              onChange={(e) => setSellerForm(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="shop@example.com"
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-brand-orange focus:bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase text-gray-500 mb-1">{t('City / Division', 'শহর / বিভাগ')}</label>
                            <select 
                              value={sellerForm.district}
                              onChange={(e) => setSellerForm(prev => ({ ...prev, district: e.target.value }))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-brand-orange focus:bg-white"
                            >
                              <option value="Dhaka">{t('Dhaka', 'ঢাকা')}</option>
                              <option value="Chittagong">{t('Chittagong', 'চট্টগ্রাম')}</option>
                              <option value="Sylhet">{t('Sylhet', 'সিলেট')}</option>
                              <option value="Rajshahi">{t('Rajshahi', 'রাজশাহী')}</option>
                              <option value="Khulna">{t('Khulna', 'খুলনা')}</option>
                              <option value="Barisal">{t('Barisal', 'বরিশাল')}</option>
                              <option value="Rangpur">{t('Rangpur', 'রংপুর')}</option>
                              <option value="Mymensingh">{t('Mymensingh', 'ময়মনসিংহ')}</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono font-bold uppercase text-gray-500 mb-1">{t('Product Category', 'পণ্যের ক্যাটাগরি')}</label>
                            <select 
                              value={sellerForm.category}
                              onChange={(e) => setSellerForm(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-brand-orange focus:bg-white"
                            >
                              <option value="Fashions">{t('Fashion & Clothing', 'ফ্যাশন ও পোশাক')}</option>
                              <option value="Electronics">{t('Electronic Accessories', 'ইলেকট্রনিক্স অ্যাক্সেসরিজ')}</option>
                              <option value="Health & Beauty">{t('Health & Beauty', 'স্বাস্থ্য ও সৌন্দর্য')}</option>
                              <option value="Home & Lifestyle">{t('Home & Lifestyle', 'হোম ও লাইফস্টাইল')}</option>
                              <option value="Home Appliances">{t('Home Appliances', 'হোম অ্যাপ্লায়েন্সেস')}</option>
                              <option value="Sports & Outdoors">{t('Sports & Outdoors', 'স্পোর্টস ও আউটডোর')}</option>
                            </select>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-4 bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
                        >
                          {t('Submit Merchant Application', 'মার্চেন্ট আবেদন জমা দিন')}
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-emerald-900 font-display">{t('Application Received!', 'আবেদন গৃহীত হয়েছে!')}</h4>
                        <p className="text-xs text-emerald-700 mt-1">
                          {t('Congratulations! Your merchant registration for', 'অভিনন্দন! আপনার মার্চেন্ট নিবন্ধন')} <strong>{sellerRegistered.shopName}</strong> {t('has been submitted.', 'সফলভাবে জমা হয়েছে।')}
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-emerald-200 inline-block font-mono text-xs text-emerald-800">
                        {t('Merchant ID:', 'মার্চেন্ট আইডি:')} <strong>{sellerRegistered.id}</strong>
                      </div>

                      <p className="text-xs text-gray-600 max-w-md mx-auto">
                        {t(
                          'Our merchant onboarding specialist will contact you via WhatsApp/Phone within 1 business day to verify your catalog and activate your live shop.',
                          'আমাদের অনবোর্ডিং বিশেষজ্ঞ ১ কর্মদিবসের মধ্যে হোয়াটসঅ্যাপ বা ফোনে যোগাযোগ করে আপনার শপ সক্রিয় করবেন।'
                        )}
                      </p>

                      <button 
                        type="button"
                        onClick={() => {
                          setSellerRegistered(null);
                          setActiveModal(null);
                        }}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        {t('Done', 'সম্পন্ন')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------- 5. HELP CENTER & FAQS MODAL ---------------- */}
              {activeModal === 'help' && (
                <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center shrink-0">
                      <HelpCircle size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">{t('Help Center & FAQs', 'সহায়তা কেন্দ্র ও প্রশ্নোত্তর')}</h3>
                      <p className="text-xs text-gray-400 font-mono">{t('24/7 Assistance for all your shopping queries', 'আপনার সব প্রশ্নের ২৪/৭ সহায়তা')}</p>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      placeholder={t('Search questions (e.g. tracking, bKash, return, sizes)...', 'প্রশ্ন খুঁজুন (যেমন: ট্র্যাকিং, বিকাশ, রিটার্ন, সাইজ)...')}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-brand-orange focus:bg-white transition-all font-medium"
                    />
                  </div>

                  {/* Category Chips */}
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: 'all', label: t('All Questions', 'সব প্রশ্ন') },
                      { id: 'orders', label: t('Orders & Tracking', 'অর্ডার ও ট্র্যাকিং') },
                      { id: 'shipping', label: t('Shipping & Delivery', 'শিপিং ও ডেলিভারি') },
                      { id: 'payment', label: t('bKash & Payments', 'বিকাশ ও পেমেন্ট') },
                      { id: 'returns', label: t('Returns & Refunds', 'রিটার্ন ও রিফান্ড') }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFaqCategory(cat.id as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          faqCategory === cat.id 
                            ? 'bg-brand-orange text-white shadow-xs' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* FAQ Accordions */}
                  <div className="space-y-2.5">
                    {filteredFaqs.map((faq, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div 
                          key={idx}
                          className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full p-4 text-left flex items-center justify-between gap-3 hover:bg-gray-50/50 cursor-pointer"
                          >
                            <div>
                              <p className="text-xs font-bold text-gray-900">{isBangla ? faq.bengali : faq.q}</p>
                            </div>
                            <span className="text-gray-400 shrink-0">
                              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="p-4 pt-3 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/30">
                              {isBangla ? faq.aBn : faq.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Direct Contact Channels */}
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-700 font-mono">{t('Need Direct Concierge Assistance?', 'সরাসরি সহায়তা প্রয়োজন?')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <a 
                        href={`tel:${hotlineDisplay}`}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2.5 text-gray-700 hover:text-brand-orange hover:border-brand-orange transition-all"
                      >
                        <Phone size={16} className="text-brand-orange shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-400 uppercase font-mono">{t('24/7 Hotline', '২৪/৭ হটলাইন')}</p>
                          <p className="font-bold truncate tabular-nums">{hotlineDisplay}</p>
                        </div>
                      </a>

                      <a 
                        href={`mailto:${emailDisplay}`}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2.5 text-gray-700 hover:text-brand-orange hover:border-brand-orange transition-all"
                      >
                        <Mail size={16} className="text-brand-orange shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-400 uppercase font-mono">{t('Official Email', 'অফিসিয়াল ইমেইল')}</p>
                          <p className="font-bold truncate">{emailDisplay}</p>
                        </div>
                      </a>

                      <button 
                        type="button"
                        onClick={() => {
                          setActiveModal(null);
                          if (onOpenChat) onOpenChat('Digital Shop T.M 24/7 Support');
                        }}
                        className="p-3 bg-brand-orange text-white rounded-xl flex items-center gap-2.5 hover:bg-brand-orange-light transition-all cursor-pointer shadow-sm"
                      >
                        <MessageCircle size={16} />
                        <div className="text-left">
                          <p className="text-[10px] text-white/80 uppercase font-mono">{t('Live Concierge', 'লাইভ সাপোর্ট')}</p>
                          <p className="font-bold">{t('Start Live Chat', 'লাইভ চ্যাট শুরু করুন')}</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------------- 6. PRIVACY POLICY MODAL ---------------- */}
              {activeModal === 'privacy' && (
                <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Lock size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">{t('Privacy & Data Protection Policy', 'গোপনীয়তা ও তথ্য সুরক্ষা নীতি')}</h3>
                      <p className="text-xs text-gray-400 font-mono">{t('Last updated:', 'সর্বশেষ আপডেট:')} {new Date().getFullYear()} • {t('256-Bit SSL Secured', '২৫৬-বিট SSL সুরক্ষিত')}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase">{t('1. Introduction & Security Commitment', '১. পরিচিতি ও নিরাপত্তা প্রতিশ্রুতি')}</h4>
                      <p className="mt-1">
                        {t(
                          'Digital Shop T.M values your privacy. We implement end-to-end 256-bit SSL encryption to safeguard all your personal data, orders, contact numbers, and delivery addresses.',
                          'Digital Shop T.M আপনার গোপনীয়তাকে সর্বোচ্চ গুরুত্ব দেয়। আপনার ব্যক্তিগত তথ্য, অর্ডার, ফোন নম্বর ও ঠিকানা সুরক্ষিত রাখতে আমরা ২৫৬-বিট SSL এনক্রিপশন ব্যবহার করি।'
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase">{t('2. Information We Collect', '২. আমরা যে তথ্য সংগ্রহ করি')}</h4>
                      <p className="mt-1">
                        {t(
                          'We collect your name, phone number, shipping address, and email solely to fulfill your orders, send tracking notifications, and handle warranty claims. We do not sell or rent user data to third parties.',
                          'শুধুমাত্র আপনার অর্ডার পৌঁছে দেওয়া, ট্র্যাকিং আপডেট পাঠানো ও ওয়ারেন্টি সেবার জন্য আমরা নাম, ফোন নম্বর, ঠিকানা ও ইমেইল সংগ্রহ করি। আমরা কোনো তৃতীয় পক্ষের কাছে তথ্য বিক্রি করি না।'
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase">{t('3. Payment Information', '৩. পেমেন্ট সংক্রান্ত তথ্য')}</h4>
                      <p className="mt-1">
                        {t(
                          'We do not store complete debit/credit card numbers or bKash PINs on our servers. All financial transactions are processed securely through PCI-DSS compliant payment gateways.',
                          'আমরা আমাদের সার্ভারে আপনার কার্ড নম্বর বা বিকাশ পিন সংরক্ষণ করি না। সব লেনদেন PCI-DSS অনুমোদিত নিরাপদ গেটওয়ের মাধ্যমে সম্পন্ন হয়।'
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase">{t('4. Your Data Rights', '৪. আপনার তথ্যের অধিকার')}</h4>
                      <p className="mt-1">
                        {t(
                          'You have the right to request a copy of your stored data, update your address information in your profile, or request complete account erasure at any time by contacting privacy@digitalshoptm.com.',
                          'আপনি যেকোনো সময় সংরক্ষিত তথ্যের কপি চাইতে, প্রোফাইল ঠিকানা আপডেট করতে অথবা privacy@digitalshoptm.com-এ যোগাযোগ করে অ্যাকাউন্ট মুছে ফেলার অনুরোধ করতে পারেন।'
                        )}
                      </p>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="w-full py-3.5 bg-gray-900 text-white text-xs font-bold uppercase rounded-xl hover:bg-black transition-all cursor-pointer"
                  >
                    {t('I Understand & Agree', 'আমি বুঝেছি ও সম্মত আছি')}
                  </button>
                </div>
              )}

              {/* ---------------- 7. TERMS OF SERVICE MODAL ---------------- */}
              {activeModal === 'terms' && (
                <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">{t('Terms of Service & Authenticity', 'সেবার শর্তাবলী ও পণ্যের সত্যতা')}</h3>
                      <p className="text-xs text-gray-400 font-mono">{t('Consumer Agreement & Product Authenticity', 'ভোক্তা চুক্তি ও অরিজিনাল পণ্যের নিশ্চয়তা')}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase">{t('1. Authenticity Guarantee', '১. অরিজিনাল পণ্যের নিশ্চয়তা')}</h4>
                      <p className="mt-1">
                        {t(
                          'All items sold through Digital Shop T.M are 100% genuine, brand-new, and sourced directly from official brand partners or authorized distributors. If any product is proven non-authentic, you are entitled to a 200% refund.',
                          'Digital Shop T.M-এ বিক্রি হওয়া প্রতিটি পণ্য ১০০% অরিজিনাল ও ব্র্যান্ডের অনুমোদিত ডিস্ট্রিবিউটর থেকে সংগৃহীত। কোনো পণ্য নকল প্রমাণিত হলে ২০০% রিফান্ড পাবেন।'
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase">{t('2. Order Acceptance & Pricing', '২. অর্ডার গ্রহণ ও মূল্য নির্ধারণ')}</h4>
                      <p className="mt-1">
                        {t(
                          'All product prices are quoted in Bangladeshi Taka (BDT) inclusive of applicable taxes. In rare instances of pricing errors, Digital Shop T.M reserves the right to cancel the order and provide a full refund.',
                          'সকল পণ্যের মূল্য বাংলাদেশি টাকায় (BDT) নির্ধারিত। কোনো মূল্যে অনিচ্ছাকৃত ভুল থাকলে প্রতিষ্ঠান অর্ডার বাতিল করে সম্পূর্ণ অর্থ ফেরত দেওয়ার অধিকার রাখে।'
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase">{t('3. Warranty & Defective Items', '৩. ওয়ারেন্টি ও ত্রুটিপূর্ণ পণ্য')}</h4>
                      <p className="mt-1">
                        {t(
                          'Electronics, watches, and smart appliances are covered by the official manufacturer warranty specified on the product page. Warranty claims are facilitated directly through our customer care team.',
                          'ইলেকট্রনিক্স, ঘড়ি ও স্মার্ট অ্যাপ্লায়েন্সে পণ্যের পেজে উল্লিখিত অফিসিয়াল ওয়ারেন্টি প্রযোজ্য এবং আমাদের কাস্টমার কেয়ার টিম তা সরাসরি পরিচালনা করে।'
                        )}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-gray-900 uppercase">{t('4. Governing Law', '৪. প্রযোজ্য আইন')}</h4>
                      <p className="mt-1">
                        {t(
                          'These terms and conditions are governed in accordance with the laws and Consumer Protection regulations of Bangladesh.',
                          'এই শর্তাবলী বাংলাদেশের প্রচলিত আইন ও ভোক্তা অধিকার সংরক্ষণ বিধিমালা অনুযায়ী পরিচালিত হয়।'
                        )}
                      </p>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="w-full py-3.5 bg-gray-900 text-white text-xs font-bold uppercase rounded-xl hover:bg-black transition-all cursor-pointer"
                  >
                    {t('Accept & Close', 'গ্রহণ করুন ও বন্ধ করুন')}
                  </button>
                </div>
              )}

              {/* ---------------- 8. COOKIE PREFERENCES MODAL ---------------- */}
              {activeModal === 'cookies' && (
                <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">
                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center shrink-0">
                      <Sliders size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display">{t('Cookie Preferences', 'কুকি সেটিংস')}</h3>
                      <p className="text-xs text-gray-400 font-mono">{t('Manage your browsing & personalization settings', 'আপনার ব্রাউজিং ও পছন্দসমূহ পরিচালনা করুন')}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t(
                      'We use cookies and local storage tokens to remember your shopping cart, wishlisted products, currency preferences, and ensure optimal performance.',
                      'আপনার শপিং কার্ট, উইশলিস্ট, ভাষা পছন্দ ও দ্রুত ব্রাউজিং অভিজ্ঞতা নিশ্চিত করতে আমরা কুকিজ ও লোকাল স্টোরেজ ব্যবহার করি।'
                    )}
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Strictly Necessary */}
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-bold text-gray-900">{t('Strictly Necessary Cookies', 'অত্যাবশ্যকীয় কুকিজ')}</p>
                          <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono uppercase font-bold">{t('Always Active', 'সর্বদা সক্রিয়')}</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{t('Required for secure authentication, shopping cart retention, and checkout.', 'নিরাপদ লগইন, কার্ট সংরক্ষণ ও চেকআউটের জন্য প্রয়োজনীয়।')}</p>
                      </div>
                      <input type="checkbox" checked disabled className="w-4 h-4 accent-brand-orange cursor-not-allowed shrink-0" />
                    </div>

                    {/* Analytics Cookies */}
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900">{t('Performance & Analytics', 'পারফরম্যান্স ও অ্যানালিটিক্স')}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{t('Helps us understand website traffic, popular departments, and speed optimization.', 'ওয়েবসাইটের গতি ও জনপ্রিয় বিভাগগুলো উন্নত করতে সাহায্য করে।')}</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={cookiePrefs.analytics}
                        onChange={(e) => setCookiePrefs(prev => ({ ...prev, analytics: e.target.checked }))}
                        className="w-4 h-4 accent-brand-orange cursor-pointer shrink-0" 
                      />
                    </div>

                    {/* Marketing Cookies */}
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900">{t('Personalization & Deals', 'পার্সোনালাইজেশন ও অফার')}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{t('Enables personalized recommendations and custom voucher discounts.', 'আপনার পছন্দ অনুযায়ী পণ্য ও বিশেষ ডিসকাউন্ট অফার দেখায়।')}</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={cookiePrefs.marketing}
                        onChange={(e) => setCookiePrefs(prev => ({ ...prev, marketing: e.target.checked }))}
                        className="w-4 h-4 accent-brand-orange cursor-pointer shrink-0" 
                      />
                    </div>
                  </div>

                  {cookieSavedToast && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>{t('Cookie preferences saved successfully!', 'কুকি সেটিংস সফলভাবে সংরক্ষিত হয়েছে!')}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                    <button 
                      type="button"
                      onClick={saveCookieSettings}
                      className="flex-1 py-3.5 bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-orange-500/20"
                    >
                      {t('Save Preferences', 'পছন্দ সংরক্ষণ করুন')}
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setCookiePrefs({ essential: true, analytics: true, marketing: true });
                        try {
                          localStorage.setItem('lsm_cookie_prefs', JSON.stringify({ essential: true, analytics: true, marketing: true }));
                        } catch {}
                        setCookieSavedToast(true);
                        setTimeout(() => {
                          setCookieSavedToast(false);
                          setActiveModal(null);
                        }, 1200);
                      }}
                      className="flex-1 py-3.5 bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                    >
                      {t('Accept All', 'সব গ্রহণ করুন')}
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
};
