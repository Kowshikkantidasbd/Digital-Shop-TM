import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { configApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface SlideData {
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  image: string;
  tag: string;
}

const DEFAULT_MOBILE_SLIDES: SlideData[] = [
  {
    badge: 'EXCLUSIVE ACCESS',
    title: 'Premium Mall Experience',
    subtitle: 'Discover curated designer fashion, flagship electronics, and genuine lifestyle luxury.',
    cta: 'EXPLORE MALL',
    link: '/search?category=All',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=85&w=1200',
    tag: '100% GENUINE'
  },
  {
    badge: 'EXCLUSIVE DROP',
    title: 'Summer Luxury Collection 2026',
    subtitle: 'Elevate your seasonal wardrobe with bespoke craftsmanship, pure organic cottons & streetwear.',
    cta: 'SHOP COLLECTION',
    link: '/search?category=Fashions',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=85&w=1200',
    tag: 'NEW ARRIVALS'
  },
  {
    badge: 'FLASH SALE',
    title: 'Mega Flash Deals Up To 60% OFF',
    subtitle: 'Verified authentic discounts on flagship smart wearables, noise-cancelling audio & tech gear.',
    cta: 'CLAIM DISCOUNTS',
    link: '#flash-sale-section',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=85&w=1200',
    tag: 'LIMITED TIME'
  },
  {
    badge: 'HOME LUXURY',
    title: 'Curated Home & Modern Living',
    subtitle: 'Transform your daily sanctuary with state-of-the-art kitchen appliances & designer aesthetics.',
    cta: 'EXPLORE LIVING',
    link: '/search?category=Home%20%26%20Lifestyle',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=85&w=1200',
    tag: 'INTERIOR ESSENTIALS'
  }
];

const DEFAULT_MOBILE_SLIDES_BN: SlideData[] = [
  {
    badge: 'এক্সক্লুসিভ কালেকশন',
    title: 'প্রিমিয়াম শপিং অভিজ্ঞতা',
    subtitle: 'বাছাইকৃত ডিজাইনার ফ্যাশন, ফ্ল্যাগশিপ ইলেকট্রনিক্স এবং শতভাগ আসল লাইফস্টাইল পণ্য।',
    cta: 'শপ ঘুরে দেখুন',
    link: '/search?category=All',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=85&w=1200',
    tag: '১০০% আসল'
  },
  {
    badge: 'নতুন ড্রপ',
    title: 'সামার লাক্সারি কালেকশন ২০২৬',
    subtitle: 'খাঁটি অর্গানিক কটন ও আধুনিক স্ট্রিটওয়্যারের সাথে আপনার স্টাইলকে নতুন রূপ দিন।',
    cta: 'কালেকশন দেখুন',
    link: '/search?category=Fashions',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=85&w=1200',
    tag: 'নতুন আগমন'
  },
  {
    badge: 'ফ্ল্যাশ সেল',
    title: 'মেগা ফ্ল্যাশ ডিলে ৬০% পর্যন্ত ছাড়',
    subtitle: 'স্মার্ট ওয়াচ, ওয়্যারলেস অডিও এবং টেক গ্যাজেটে নিশ্চিত আসল ডিসকাউন্ট।',
    cta: 'অফার নিন',
    link: '#flash-sale-section',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=85&w=1200',
    tag: 'সীমিত সময়'
  },
  {
    badge: 'হোম কালেকশন',
    title: 'আধুনিক হোম ও লাইফস্টাইল',
    subtitle: 'অত্যাধুনিক কিচেন অ্যাপ্লায়েন্স এবং ডিজাইনার ডেকোর দিয়ে আপনার ঘর সাজিয়ে তুলুন।',
    cta: 'এক্সপ্লোর করুন',
    link: '/search?category=Home%20%26%20Lifestyle',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=85&w=1200',
    tag: 'ঘরের প্রয়োজন'
  }
];

export const MobileHeroBanner: React.FC = () => {
  const navigate = useNavigate();
  const { isBangla } = useLanguage();
  const [activeIdx, setActiveIdx] = useState(0);
  const [customSlides, setCustomSlides] = useState<SlideData[] | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const slides = customSlides || (isBangla ? DEFAULT_MOBILE_SLIDES_BN : DEFAULT_MOBILE_SLIDES);

  // Sync CMS / dynamic banner configuration if configured
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const config = await configApi.getConfig();
        if (config && Array.isArray(config.banners) && config.banners.length > 0) {
          const mapped = config.banners.map((b: any, idx: number) => {
            const rawImg = b.image ? String(b.image) : '';
            const cleanImg =
              !rawImg || rawImg.includes('photo-1441986300917-64674bd600d8')
                ? DEFAULT_MOBILE_SLIDES[idx % DEFAULT_MOBILE_SLIDES.length].image
                : rawImg;
            return {
              badge: b.badge || 'EXCLUSIVE ACCESS',
              title: b.title || 'Premium Mall Experience',
              subtitle: b.subtitle || 'Curated luxury fashion, electronics & express nationwide delivery.',
              cta: b.cta || 'EXPLORE MALL',
              link: b.targetUrl || '/search?category=All',
              image: cleanImg,
              tag: b.headlinePrefix || 'FEATURED'
            };
          });
          setCustomSlides(mapped);
        }
      } catch (err) {
        console.error('Error fetching dynamic banners for mobile:', err);
      }
    };
    fetchBanners();
  }, []);

  // Auto-rotating timer with pause on user interaction
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length, isHovered]);

  const handleTouchStart = (e: React.TouchEvent) => {
    didSwipeRef.current = false;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    if (Math.abs(diff) > 30) {
      didSwipeRef.current = true;
      if (diff > 0) {
        setActiveIdx((prev) => (prev + 1) % slides.length);
      } else {
        setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
      }
    }
    touchStartXRef.current = null;
  };

  const handleBannerClick = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    const target = (slide.link || '/search?category=All').trim();
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

  const slide = slides[activeIdx] || DEFAULT_MOBILE_SLIDES[0];

  return (
    <div 
      className="block lg:hidden w-full px-3 sm:px-4 md:px-6 pt-2 pb-1 max-w-7xl mx-auto"
      id="mobile-hero-banner-standalone"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        role="link"
        tabIndex={0}
        aria-label={slide.title || 'Promotional Banner'}
        onClick={handleBannerClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBannerClick();
          }
        }}
        className="relative w-full h-[185px] xs:h-[210px] sm:h-[260px] md:h-[300px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-200/80 cursor-pointer select-none bg-gray-100 group outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
      >
        {/* Pure Full-Bleed Banner Photography (Zero text overlay) */}
        {slides.map((s, idx) => {
          const isActive = idx === activeIdx;
          return (
            <img
              key={idx}
              src={s.image}
              alt={s.title}
              fetchPriority={idx === 0 ? "high" : "auto"}
              loading={idx === 0 ? "eager" : "lazy"}
              decoding={idx === 0 ? "sync" : "async"}
              draggable={false}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-out ${
                isActive 
                  ? 'opacity-100 scale-100 group-hover:scale-[1.03]' 
                  : 'opacity-0 scale-105 pointer-events-none'
              }`}
            />
          );
        })}

        {/* Tablet/Desktop Hover Navigation Arrows */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveIdx((prev) => (prev - 1 + slides.length) % slides.length);
          }}
          aria-label="Previous slide"
          className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-brand-orange text-white backdrop-blur-md border border-white/20 items-center justify-center transition-colors cursor-pointer z-20"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setActiveIdx((prev) => (prev + 1) % slides.length);
          }}
          aria-label="Next slide"
          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-brand-orange text-white backdrop-blur-md border border-white/20 items-center justify-center transition-colors cursor-pointer z-20"
        >
          <ChevronRight size={18} />
        </button>

        {/* Minimal Bottom-Center Slide Dots */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/35 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/15"
        >
          {slides.map((_, i) => {
            const isSelected = i === activeIdx;
            return (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(i);
                }}
                className={`rounded-full transition-all duration-300 ease-out cursor-pointer ${
                  isSelected 
                    ? 'w-5 xs:w-6 h-1.5 bg-brand-orange' 
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

