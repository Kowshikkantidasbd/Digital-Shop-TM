import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, ChevronRight, ShieldCheck, Truck, Banknote, 
  Headphones, X, Sparkles, Smartphone, ShoppingBag, 
  Home, Tv, Activity, Apple, Car, Grid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { configApi } from '../services/api';
import { DEFAULT_SITE_CONFIG } from '../constants/siteConfig';
import { useLanguage } from '../contexts/LanguageContext';

interface HeroProps {
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
}

export const Hero: React.FC<HeroProps> = ({ onCategorySelect, selectedCategory }) => {
  const navigate = useNavigate();
  const { isBangla, t } = useLanguage();
  const [activeFeature, setActiveFeature] = useState<null | { label: string, desc: string, icon: any, details: string }>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [dynamicBanners, setDynamicBanners] = useState<any[]>([]);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(DEFAULT_SITE_CONFIG.freeShippingThreshold);
  const [isDepartmentDrawerOpen, setIsDepartmentDrawerOpen] = useState(false);
  
  // Touch swipe support for mobile/tablet
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    const cleanBanners = (list: any[]) =>
      list.map((b, idx) => ({
        ...b,
        image:
          !b?.image || String(b.image).includes('photo-1441986300917-64674bd600d8')
            ? idx === 0
              ? 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=85&w=1200'
              : 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=85&w=1200'
            : b.image,
      }));

    try {
      const cachedBanners = localStorage.getItem('elora-cached-banners');
      if (cachedBanners) {
        const parsed = JSON.parse(cachedBanners);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDynamicBanners(cleanBanners(parsed));
        }
      }
    } catch {}

    const fetchBanners = async () => {
      try {
        const config = await configApi.getConfig();
        if (config) {
          if (Array.isArray(config.banners) && config.banners.length > 0) {
            const sanitized = cleanBanners(config.banners);
            setDynamicBanners(sanitized);
            try {
              localStorage.setItem('elora-cached-banners', JSON.stringify(sanitized));
            } catch {}
          }
          if (config.freeShippingThreshold) {
            setFreeShippingThreshold(Number(config.freeShippingThreshold));
          }
        }
      } catch (err) {
        console.error('Error fetching dynamic banners:', err);
      }
    };
    fetchBanners();
  }, []);

  const defaultSlides = isBangla ? [
    {
      title: 'প্রিমিয়াম শপিং অভিজ্ঞতা',
      headlinePrefix: 'এক্সক্লুসিভ অ্যাক্সেস',
      subtitle: 'বাছাইকৃত ডিজাইনার ফ্যাশন, ফ্ল্যাগশিপ ইলেকট্রনিক্স এবং শতভাগ আসল লাইফস্টাইল পণ্য দ্রুত ডেলিভারিতে।',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=85&w=1200',
      badge: 'এক্সক্লুসিভ কালেকশন',
      cta: 'শপ ঘুরে দেখুন',
      color: 'from-[#0B0F17] via-[#0B0F17]/90 to-[#0B0F17]/40',
      targetUrl: '/search?category=All',
      showCartGraphic: true
    },
    {
      title: 'সামার লাক্সারি কালেকশন ২০২৬',
      headlinePrefix: 'নতুন আগমন',
      subtitle: 'খাঁটি অর্গানিক কটন, আধুনিক স্ট্রিটওয়্যার এবং প্রিমিয়াম ডিজাইনের সাথে আপনার স্টাইলকে নতুন রূপ দিন।',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200',
      badge: 'নতুন ড্রপ',
      cta: 'কালেকশন দেখুন',
      color: 'from-[#0F172A] via-[#0F172A]/90 to-[#0F172A]/40',
      targetUrl: '/search?category=Fashions',
      showCartGraphic: true
    },
    {
      title: 'মেগা ফ্ল্যাশ ডিলে ৬০% পর্যন্ত ছাড়',
      headlinePrefix: 'সীমিত সময়ের অফার',
      subtitle: 'স্মার্ট ওয়াচ, ওয়্যারলেস অডিও এবং প্রিমিয়াম টেক গ্যাজেটে নিশ্চিত আসল ডিসকাউন্ট।',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200',
      badge: 'ফ্ল্যাশ সেল',
      cta: 'অফার নিন',
      color: 'from-[#1E110A] via-[#1E110A]/90 to-[#1E110A]/40',
      targetUrl: '#flash-sale-section',
      showCartGraphic: true
    },
    {
      title: 'আধুনিক হোম ও লাইফস্টাইল',
      headlinePrefix: 'ঘরের প্রয়োজনীয় সবকিছু',
      subtitle: 'অত্যাধুনিক কিচেন অ্যাপ্লায়েন্স এবং ডিজাইনার ডেকোর দিয়ে আপনার ঘরকে সাজিয়ে তুলুন।',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200',
      badge: 'হোম কালেকশন',
      cta: 'এক্সপ্লোর করুন',
      color: 'from-[#18181B] via-[#18181B]/90 to-[#18181B]/40',
      targetUrl: '/search?category=Home%20%26%20Lifestyle',
      showCartGraphic: true
    }
  ] : [
    {
      title: 'Premium Mall Experience',
      headlinePrefix: 'EXCLUSIVE ACCESS',
      subtitle: 'Discover curated designer fashion, flagship electronics, and genuine lifestyle luxury with same-day express dispatch.',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=85&w=1200',
      badge: 'EXCLUSIVE ACCESS',
      cta: 'EXPLORE MALL',
      color: 'from-[#0B0F17] via-[#0B0F17]/90 to-[#0B0F17]/40',
      targetUrl: '/search?category=All',
      showCartGraphic: true
    },
    {
      title: 'Summer Luxury Collection 2026',
      headlinePrefix: 'NEW ARRIVALS',
      subtitle: 'Elevate your seasonal wardrobe with bespoke craftsmanship, pure organic cottons, and high-fashion streetwear.',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200',
      badge: 'EXCLUSIVE DROP',
      cta: 'SHOP COLLECTION',
      color: 'from-[#0F172A] via-[#0F172A]/90 to-[#0F172A]/40',
      targetUrl: '/search?category=Fashions',
      showCartGraphic: true
    },
    {
      title: 'Mega Flash Deals Up To 60% OFF',
      headlinePrefix: 'LIMITED TIME EVENT',
      subtitle: 'Verified authentic discounts on flagship smart wearables, active noise-cancelling audio, and tech gear.',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200',
      badge: 'FLASH SALE',
      cta: 'CLAIM DISCOUNTS',
      color: 'from-[#1E110A] via-[#1E110A]/90 to-[#1E110A]/40',
      targetUrl: '#flash-sale-section',
      showCartGraphic: true
    },
    {
      title: 'Curated Home & Modern Living',
      headlinePrefix: 'INTERIOR ESSENTIALS',
      subtitle: 'Transform your daily sanctuary with state-of-the-art kitchen appliances and designer decor aesthetics.',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1200',
      badge: 'HOME LUXURY',
      cta: 'EXPLORE LIVING',
      color: 'from-[#18181B] via-[#18181B]/90 to-[#18181B]/40',
      targetUrl: '/search?category=Home%20%26%20Lifestyle',
      showCartGraphic: true
    }
  ];

  const activeSlides = dynamicBanners.length > 0 ? dynamicBanners : defaultSlides;

  // Auto-rotating timer with pause on hover
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [activeSlides.length, isHovered]);

  const departments = [
    { name: 'Electronic Accessories', icon: Smartphone, bengali: 'ইলেকট্রনিক্স' },
    { name: 'Fashions', icon: ShoppingBag, bengali: 'ফ্যাশন' },
    { name: 'Health & Beauty', icon: Sparkles, bengali: 'হেলথ ও বিউটি' },
    { name: 'Home & Lifestyle', icon: Home, bengali: 'হোম ও লাইফস্টাইল' },
    { name: 'Home Appliances', icon: Tv, bengali: 'অ্যাপ্লায়েন্স' },
    { name: 'Sports & Outdoors', icon: Activity, bengali: 'স্পোর্টস' },
    { name: 'Groceries', icon: Apple, bengali: 'গ্রোসারি' },
    { name: 'Automotive', icon: Car, bengali: 'অটোমোটিভ' }
  ];

  const features = [
    { 
      label: t('Safe Payments', 'নিরাপদ পেমেন্ট'), 
      desc: t('SSL 256-Bit Encrypted', '২৫৬-বিট সুরক্ষিত'), 
      icon: <ShieldCheck size={22} className="text-blue-500" />,
      details: t(
        'All payments are encrypted through bank-grade SSL gateways. We support bKash, Nagad, Rocket, Visa, Mastercard, and Cash on Delivery with zero risk.',
        'সকল পেমেন্ট ব্যাংক-গ্রেড SSL গেটওয়ে দ্বারা সুরক্ষিত। বিকাশ, নগদ, রকেট, ভিসা, মাস্টারকার্ড এবং ক্যাশ অন ডেলিভারির সুবিধা রয়েছে।'
      )
    },
    { 
      label: t('Express Nationwide Delivery', 'সারা দেশে দ্রুত ডেলিভারি'), 
      desc: t('Fast Doorstep Shipping', 'দ্রুত হোম ডেলিভারি'), 
      icon: <Truck size={22} className="text-emerald-500" />,
      details: t(
        `Fast doorstep delivery with real-time tracking across 64 districts in Bangladesh. Enjoy free shipping on eligible orders above ৳${freeShippingThreshold.toLocaleString()}.`,
        `বাংলাদেশের ৬৪ জেলায় রিয়েল-টাইম ট্র্যাকিংসহ দ্রুত হোম ডেলিভারি। ৳${freeShippingThreshold.toLocaleString()} এর বেশি অর্ডারে ফ্রি শিপিং সুবিধা।`
      )
    },
    { 
      label: t('Best Price Guarantee', 'সেরা দামের নিশ্চয়তা'), 
      desc: t('100% Authentic Products', '১০০% আসল পণ্য'), 
      icon: <Banknote size={22} className="text-brand-orange" />,
      details: t(
        'Every item on Digital Shop T.M is verified by our quality assurance team. We guarantee authentic products directly sourced from verified manufacturers.',
        'আমাদের প্রতিটি পণ্য কোয়ালিটি টিম দ্বারা যাচাইকৃত। সরাসরি অনুমোদিত সরবরাহকারীর কাছ থেকে সংগৃহীত শতভাগ আসল পণ্যের নিশ্চয়তা।'
      )
    },
    { 
      label: t('24/7 Dedicated Support', '২৪/৭ কাস্টমার সাপোর্ট'), 
      desc: t('Live Concierge Assistance', 'তাৎক্ষণিক সহায়তা'), 
      icon: <Headphones size={22} className="text-purple-500" />,
      details: t(
        'Our dedicated shopping assistants and support experts are available around the clock to answer your inquiries and assist with returns.',
        'আমাদের সাপোর্ট টিম যেকোনো প্রশ্ন ও রিটার্ন সহায়তার জন্য দিনরাত ২৪ ঘণ্টা প্রস্তুত রয়েছে।'
      )
    }
  ];

  const didSwipeRef = useRef(false);

  const navigateToSlideTarget = (rawTarget?: string) => {
    const target = (rawTarget || '/search?category=All').trim();
    if (target.startsWith('#')) {
      const el = document.getElementById(target.substring(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      navigate('/search?category=All');
      return;
    }
    if (/^https?:\/\//i.test(target)) {
      window.location.assign(target);
      return;
    }
    if (target.startsWith('/category/')) {
      const slug = target.replace('/category/', '').toLowerCase();
      let cat = 'All';
      if (slug === 'fashions' || slug === 'fashion') cat = 'Fashions';
      else if (slug === 'health-beauty' || slug === 'health_beauty') cat = 'Health & Beauty';
      else if (slug === 'home-lifestyle' || slug === 'home_lifestyle') cat = 'Home & Lifestyle';
      else if (slug === 'home-appliances' || slug === 'home_appliances') cat = 'Home Appliances';
      else if (slug === 'sports-outdoors' || slug === 'sports_outdoors') cat = 'Sports & Outdoors';
      else if (slug === 'groceries' || slug === 'grocery') cat = 'Groceries';
      else if (slug === 'automotive' || slug === 'auto') cat = 'Automotive';
      navigate(`/search?category=${encodeURIComponent(cat)}`);
      return;
    }
    navigate(target);
  };

  const handleDepartmentSelect = (categoryName: string) => {
    onCategorySelect?.(categoryName);
    requestAnimationFrame(() => {
      const el = document.getElementById('just-for-you-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    didSwipeRef.current = false;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 35) {
      didSwipeRef.current = true;
      if (diff > 0) {
        // Swiped left -> next slide
        setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
      } else {
        // Swiped right -> prev slide
        setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
      }
    }
    touchStartXRef.current = null;
  };

  const currentBanner = activeSlides[currentSlide] || defaultSlides[0];

  return (
    <div className="pt-2 sm:pt-3 pb-4 sm:pb-6 font-sans transition-colors duration-500 w-full overflow-hidden" id="homepage-hero-section">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 space-y-3 sm:space-y-4">
        
        {/* 1. HERO BANNER MAIN SHOWCASE LAYOUT (Desktop viewports) */}
        <div className="hidden lg:flex flex-row gap-3 sm:gap-4 items-stretch">
          
          {/* Desktop Categories Quick Sidebar (Left menu - Desktop only) */}
          <div className="hidden lg:block w-[240px] bg-white rounded-2xl p-4 shadow-xs border border-gray-200/80 h-[420px] shrink-0">
            <div className="pb-3 mb-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 font-mono">{t('Department', 'ডিপার্টমেন্ট')}</span>
              <Sparkles size={13} className="text-brand-orange" />
            </div>
            <ul className="space-y-1.5">
              {departments.map((dept, i) => {
                const Icon = dept.icon;
                const isSelected = selectedCategory === dept.name;
                return (
                  <li 
                    key={i} 
                    onClick={() => handleDepartmentSelect(dept.name)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-all group ${
                      isSelected 
                        ? 'bg-orange-50 text-brand-orange font-bold shadow-2xs' 
                        : 'text-gray-600 hover:text-brand-orange hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon size={14} className={`shrink-0 ${isSelected ? 'text-brand-orange' : 'text-gray-400 group-hover:text-brand-orange'}`} />
                      <span className="truncate">{isBangla ? dept.bengali : dept.name}</span>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 transition-transform group-hover:translate-x-1 ${isSelected ? 'text-brand-orange' : 'text-gray-300'}`} />
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Pure Image Auto-Rotating Clickable Banner (Zero text overlay) */}
          <div 
            role="link"
            tabIndex={0}
            aria-label={currentBanner?.title || 'Promotional Banner'}
            onClick={() => {
              if (didSwipeRef.current) {
                didSwipeRef.current = false;
                return;
              }
              navigateToSlideTarget(currentBanner?.targetUrl);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigateToSlideTarget(currentBanner?.targetUrl);
              }
            }}
            className="flex-1 w-full relative rounded-3xl overflow-hidden h-[420px] shadow-sm hover:shadow-md transition-shadow group bg-gray-100 border border-gray-200/80 select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            id="hero-banner-carousel"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0.25 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.25 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <img 
                  src={currentBanner?.image || defaultSlides[0].image}
                  alt={currentBanner?.title || 'Hero Banner'}
                  fetchPriority={currentSlide === 0 ? "high" : "auto"}
                  loading={currentSlide === 0 ? "eager" : "lazy"}
                  decoding={currentSlide === 0 ? "sync" : "async"}
                  draggable={false}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrow Controls */}
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
              }}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-brand-orange text-white backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all shadow-lg active:scale-95 cursor-pointer z-20"
              aria-label="Previous Slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-brand-orange text-white backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all shadow-lg active:scale-95 cursor-pointer z-20"
              aria-label="Next Slide"
            >
              <ChevronRight size={20} />
            </button>
            
            {/* Minimal Bottom-Center Slide Dot Indicators */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15"
            >
              {activeSlides.map((_, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentSlide(i);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    i === currentSlide 
                      ? 'w-6 h-1.5 bg-brand-orange' 
                      : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                  }`} 
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

           {/* Right Showcase Banners (Visible on XL screens) */}
          <div className="hidden xl:flex flex-col gap-4 w-[280px] shrink-0">
             <div className="flex-1 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100/60 p-5 flex flex-col justify-between relative overflow-hidden border border-orange-200/50 group">
               <div className="relative z-10">
                 <span className="text-[9.5px] font-black text-brand-orange uppercase tracking-wider font-mono bg-white px-2 py-0.5 rounded-md shadow-2xs">
                   {t('New Arrivals', 'নতুন কালেকশন')}
                 </span>
                 <h4 className="text-base font-black text-gray-900 mt-2 font-display">
                   {isBangla ? (<>সর্বশেষ ফ্যাশন <br/>কালেকশন ২০২৬</>) : (<>Latest Fashion <br/>Drops 2026</>)}
                 </h4>
               </div>
               <div className="relative z-10">
                 <button 
                   type="button"
                   onClick={() => navigate('/category/fashions')}
                   className="text-xs font-black uppercase tracking-wider text-brand-orange hover:text-orange-700 flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
                 >
                   <span>{t('Discover', 'দেখুন')}</span>
                   <ChevronRight size={14} />
                 </button>
               </div>
               <img 
                 src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=300" 
                 alt="New Arrivals"
                 loading="lazy"
                 decoding="async"
                 width="128"
                 height="128"
                 className="absolute -right-8 -bottom-4 w-32 h-32 object-cover rounded-full group-hover:scale-110 transition-transform opacity-60" 
               />
             </div>

             <div className="flex-1 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100/60 p-5 flex flex-col justify-between relative overflow-hidden border border-blue-200/50 group">
               <div className="relative z-10">
                 <span className="text-[9.5px] font-black text-blue-600 uppercase tracking-wider font-mono bg-white px-2 py-0.5 rounded-md shadow-2xs">
                   {t('Super Saver', 'সুপার সেভার')}
                 </span>
                 <h4 className="text-base font-black text-gray-900 mt-2 font-display">
                   {isBangla ? (<>বান্ডেল কিনুন <br/>অতিরিক্ত ২০% ছাড়</>) : (<>Bundle & Save <br/>Extra 20%</>)}
                 </h4>
               </div>
               <div className="relative z-10">
                 <button 
                   type="button"
                   onClick={() => navigate('/category/all')}
                   className="text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-800 flex items-center gap-1 group-hover:translate-x-1 transition-all cursor-pointer"
                 >
                   <span>{t('Check Deals', 'অফার দেখুন')}</span>
                   <ChevronRight size={14} />
                 </button>
               </div>
               <img 
                 src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=300" 
                 alt="Bundle Deals"
                 loading="lazy"
                 decoding="async"
                 width="128"
                 height="128"
                 className="absolute -right-8 -bottom-4 w-32 h-32 object-cover rounded-full group-hover:scale-110 transition-transform opacity-60" 
               />
             </div>
          </div>
        </div>

        {/* 2. MOBILE & TABLET DEPARTMENT QUICK ACCESS STRIP (Positioned directly below Hero Banner on mobile/tablet) */}
        <div className="block lg:hidden w-full pt-0.5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-0.5 px-0.5">
            {/* All Departments Trigger Button */}
            <button
              type="button"
              onClick={() => setIsDepartmentDrawerOpen(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gray-900 text-white shadow-sm hover:bg-black active:scale-95 transition-all cursor-pointer"
            >
              <Grid size={14} className="text-brand-orange" />
              <span>{t('Departments', 'ডিপার্টমেন্ট')}</span>
            </button>

            {/* Department Quick Chips */}
            {departments.map((dept, idx) => {
              const Icon = dept.icon;
              const isSelected = selectedCategory === dept.name;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleDepartmentSelect(dept.name)}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-brand-orange text-white border-brand-orange shadow-xs font-extrabold'
                      : 'bg-white text-gray-700 border-gray-200/90 hover:bg-orange-50 hover:text-brand-orange hover:border-orange-200'
                  }`}
                >
                  <Icon size={13} className={isSelected ? 'text-white' : 'text-gray-400'} />
                  <span className="whitespace-nowrap">{isBangla ? dept.bengali : dept.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. FEATURES TRUST VALUE BAR (Positioned directly below Departments/Banner) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 pt-1">
           {features.map((fea, i) => (
             <motion.button 
               key={i} 
               whileHover={{ y: -2 }}
               whileTap={{ scale: 0.98 }}
               onClick={() => setActiveFeature(fea)}
               className="bg-white p-2.5 sm:p-3.5 md:p-4 rounded-xl sm:rounded-2xl shadow-xs border border-gray-200/80 flex items-center gap-2 sm:gap-3 hover:border-brand-orange/40 hover:shadow-sm transition-all text-left min-w-0 cursor-pointer group"
             >
               <div className="shrink-0 w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gray-50 group-hover:bg-orange-50 flex items-center justify-center transition-colors">
                 {fea.icon}
               </div>
               <div className="min-w-0 flex-1">
                  <p className="text-[11px] xs:text-xs font-bold text-gray-900 font-display leading-snug line-clamp-2">{fea.label}</p>
                  <p className="text-[9.5px] sm:text-[10px] text-gray-400 font-mono truncate mt-0.5">{fea.desc}</p>
               </div>
             </motion.button>
           ))}
        </div>

        {/* Mobile / Tablet Slide-out Department Drawer */}
        <AnimatePresence>
          {isDepartmentDrawerOpen && (
            <div className="fixed inset-0 z-[600] flex justify-start">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDepartmentDrawerOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />

              {/* Drawer Sheet */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative w-[300px] max-w-[85vw] h-full bg-white shadow-2xl flex flex-col z-10"
              >
                {/* Drawer Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-brand-orange flex items-center justify-center">
                      <Grid size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 font-display uppercase tracking-tight">{t('Departments', 'ডিপার্টমেন্টসমূহ')}</h3>
                      <p className="text-[10px] text-gray-400 font-mono">{t('Select a shopping department', 'একটি ক্যাটাগরি নির্বাচন করুন')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDepartmentDrawerOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-200/60 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Drawer Department List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                  {departments.map((dept, i) => {
                    const Icon = dept.icon;
                    const isSelected = selectedCategory === dept.name;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          handleDepartmentSelect(dept.name);
                          setIsDepartmentDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-50 text-brand-orange font-bold border border-orange-200'
                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{isBangla ? dept.bengali : dept.name}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className={isSelected ? 'text-brand-orange' : 'text-gray-300'} />
                      </button>
                    );
                  })}
                </div>

                {/* Drawer Footer */}
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      handleDepartmentSelect('All');
                      setIsDepartmentDrawerOpen(false);
                    }}
                    className="w-full py-2.5 bg-brand-orange text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:bg-orange-600 transition-all cursor-pointer"
                  >
                    {t('View All Products', 'সব পণ্য দেখুন')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Feature Detail Modal */}
        <AnimatePresence>
          {activeFeature && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveFeature(null)}
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 z-10"
              >
                <button 
                  type="button"
                  onClick={() => setActiveFeature(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-5">
                  {activeFeature.icon}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1 font-display uppercase tracking-tight">{activeFeature.label}</h3>
                <p className="text-brand-orange text-[10px] font-black uppercase tracking-wider mb-4 font-mono">{activeFeature.desc}</p>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-6">{activeFeature.details}</p>
                <button 
                  type="button"
                  onClick={() => setActiveFeature(null)}
                  className="w-full bg-brand-orange text-white py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-brand-orange-light transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  {t('Understood', 'বুঝেছি')}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
