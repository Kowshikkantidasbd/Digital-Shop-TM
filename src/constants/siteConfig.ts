import { configApi } from '../services/api';

export interface SiteFaq {
  id: string;
  q: string;
  a: string;
  category: 'orders' | 'payment' | 'returns' | 'shipping' | 'general';
}

export interface SiteBanner {
  id?: string;
  title: string;
  subtitle: string;
  image: string;
  badge?: string;
  cta?: string;
  color?: string;
  targetUrl?: string;
  active?: boolean;
}

export interface SiteConfig {
  // Brand & Identity
  siteName: string;
  siteTagline: string;
  siteLogo: string;
  currencySymbol: string;
  currencyCode: string;
  
  // Contact & Support
  hotlinePhone: string;
  whatsappNumber: string;
  supportEmail: string;
  officeAddress: string;
  operatingHours: string;

  // Social Links
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;

  // Shipping & Logistics Engine
  deliveryFeeDhaka: number;
  deliveryFeeSubDhaka: number;
  deliveryFeeOutside: number;
  freeShippingThreshold: number;
  deliveryDaysDhaka: string;
  deliveryDaysSubDhaka: string;
  deliveryDaysOutside: string;
  enableCOD: boolean;
  enableBkashNagad: boolean;
  enableCard?: boolean;
  codHandlingFee: number;
  lowStockThreshold: number;
  bkashNumber?: string;
  nagadNumber?: string;
  rocketNumber?: string;

  // Homepage Section Controls
  showTopAnnouncement: boolean;
  showHeroSlider: boolean;
  showCategoryCircles: boolean;
  showSponsoredAds: boolean;
  showFlashSale: boolean;
  showBudgetFinder: boolean;
  showJustForYou: boolean;
  showRecentlyViewed: boolean;
  showLiveChatWidget: boolean;
  showCouponCode: boolean;

  // Announcement Bar
  announcementActive: boolean;
  announcementText: string;
  announcementBg: 'orange' | 'emerald' | 'amber' | 'dark' | 'rose';
  announcementLinkText: string;
  announcementLinkUrl: string;

  // Maintenance & System
  maintenanceMode: boolean;
  maintenanceNotice: string;
  allowNewRegistrations: boolean;

  // Policy & Content CMS
  aboutUsText: string;
  shippingPolicy: string;
  refundPolicy: string;
  refundGuaranteeDays: number;
  faqs: SiteFaq[];

  // Hero Banners
  banners: SiteBanner[];
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  // Brand & Identity
  siteName: 'Digital Shop T.M',
  siteTagline: 'Digital Shop T.M — Your Trusted Digital Marketplace',
  siteLogo: '',
  currencySymbol: '৳',
  currencyCode: 'BDT',

  // Contact & Support (#70)
  hotlinePhone: '+880 9612-880000',
  whatsappNumber: '+880 1885-195658',
  supportEmail: 'support@digitalshop.com.bd',
  officeAddress: 'Suite 6B, Navana Tower, 45 Gulshan Avenue, Gulshan 1, Dhaka-1212, Bangladesh',
  operatingHours: 'Daily 9:00 AM - 11:00 PM (BST)',

  // Social Links
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  tiktokUrl: 'https://tiktok.com',

  // Shipping & Logistics Engine
  deliveryFeeDhaka: 60,
  deliveryFeeSubDhaka: 100,
  deliveryFeeOutside: 120,
  freeShippingThreshold: 1500,
  deliveryDaysDhaka: '1 - 2 Days',
  deliveryDaysSubDhaka: '2 - 3 Days',
  deliveryDaysOutside: '2 - 4 Days',
  enableCOD: true,
  enableBkashNagad: true,
  enableCard: true,
  codHandlingFee: 0,
  lowStockThreshold: 5,
  bkashNumber: '01700-112233',
  nagadNumber: '01700-112233',
  rocketNumber: '01700-112233',

  // Homepage Section Controls
  showTopAnnouncement: true,
  showHeroSlider: true,
  showCategoryCircles: true,
  showSponsoredAds: true,
  showFlashSale: true,
  showBudgetFinder: false,
  showJustForYou: true,
  showRecentlyViewed: true,
  showLiveChatWidget: true,
  showCouponCode: false,

  // Announcement Bar
  announcementActive: true,
  announcementText: '🔥 মেগা ডিলস চলছে! ঢাকার মধ্যে ২৪ ঘণ্টায় সুপারফাস্ট ডেলিভারি | কোড: SAVE150',
  announcementBg: 'orange',
  announcementLinkText: 'Shop Deals',
  announcementLinkUrl: '/search?category=All',

  // Maintenance & System
  maintenanceMode: false,
  maintenanceNotice: 'আমাদের সিস্টেম অপটিমাইজেশন চলছে। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত। শীঘ্রই আবার লাইভ হচ্ছে!',
  allowNewRegistrations: true,

  // Policy & Content CMS
  aboutUsText: 'Digital Shop T.M হলো বাংলাদেশের বিশ্বস্ত অনলাইন মার্কেটপ্লেস। আমরা জেনুইন ব্র্যান্ডের প্রোডাক্ট, গ্যাজেটস এবং কোয়ালিটি লাইফস্টাইল সামগ্রী সরাসরি অনুমোদিত ডিস্ট্রিবিউটর ও বিশ্বস্ত মার্চেন্টদের কাছ থেকে দ্রুত ডেলিভারি নিশ্চিত করি।',
  shippingPolicy: 'অর্ডার কনফার্ম করার ২৪ ঘণ্টার মধ্যে প্যাকেজিং করে কুরিয়ারে হস্তান্তর করা হয়। ঢাকার মধ্যে ১-২ দিন এবং সারা বাংলাদেশের যেকোনো প্রান্তে ২-৪ দিনের মধ্যে হোম ডেলিভারি পৌঁছে দেওয়া হয়।',
  refundPolicy: 'পণ্য গ্রহণের পর কোনো ত্রুটি বা অমিল পরিলক্ষিত হলে ৭ দিনের মধ্যে কোনো ঝামেলা ছাড়াই সম্পূর্ণ মানি-ব্যাক গ্যারান্টি অথবা ফ্রি রিপ্লেসমেন্ট সুবিধা পাবেন।',
  refundGuaranteeDays: 7,
  faqs: [
    {
      id: 'faq-1',
      q: 'ডেলিভারি পেতে কতদিন সময় লাগবে?',
      a: 'ঢাকার ভেতরে সাধারণত ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে সারা বাংলাদেশে ২ থেকে ৪ দিনের মধ্যে আপনার ঠিকানায় ডেলিভারি সম্পন্ন হয়।',
      category: 'shipping'
    },
    {
      id: 'faq-2',
      q: 'ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে টাকা দেওয়া) কি সম্ভব?',
      a: 'হ্যাঁ, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি (COD) সুবিধা রয়েছে। ডেলিভারিম্যানের সামনে পার্সেল চেক করে মূল্য পরিশোধ করতে পারবেন।',
      category: 'payment'
    },
    {
      id: 'faq-3',
      q: 'বিকাশ বা নগদে অগ্রিম মূল্য পরিশোধ করা যাবে কি?',
      a: 'হ্যাঁ, চেকআউটের সময় বিকাশ (bKash) ও নগদ (Nagad) এর মাধ্যমে নিরাপদ অনলাইন পেমেন্ট করে ক্যাশব্যাক উপভোগ করতে পারবেন।',
      category: 'payment'
    },
    {
      id: 'faq-4',
      q: 'পণ্য পছন্দ না হলে বা নষ্ট বের হলে পরিবর্তনের উপায় কী?',
      a: 'পণ্য রিসিভ করার ৭ দিনের মধ্যে আমাদের হটলাইন অথবা সাপোর্টে জানালে তাৎক্ষণিক ফ্রি রিপ্লেসমেন্ট অথবা সম্পূর্ণ টাকা রিফান্ড প্রদান করা হবে।',
      category: 'returns'
    },
    {
      id: 'faq-5',
      q: 'ফ্রি ডেলিভারি পেতে কত টাকার অর্ডার করতে হবে?',
      a: 'এক সাথে ১৫০০ টাকা বা তার বেশি টাকার অর্ডার করলেই ডেলিভারি চার্জ সম্পূর্ণ ফ্রি!',
      category: 'shipping'
    }
  ],

  // Hero Banners
  banners: [
    {
      title: 'Premium Mall Experience',
      subtitle: 'Discover curated designer fashion, flagship electronics, and genuine lifestyle luxury with same-day express dispatch.',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=85&w=1200',
      badge: 'EXCLUSIVE ACCESS',
      cta: 'EXPLORE MALL',
      color: 'from-orange-950/80',
      targetUrl: '/search?category=All',
      active: true
    },
    {
      title: 'Summer Luxury Collection 2026',
      subtitle: 'Elevate your seasonal wardrobe with bespoke craftsmanship, pure organic cottons, and high-fashion streetwear.',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200',
      badge: 'EXCLUSIVE DROP',
      cta: 'SHOP COLLECTION',
      color: 'from-blue-950/80',
      targetUrl: '/search?category=Fashions',
      active: true
    },
    {
      title: 'Mega Flash Deals Up To 60% OFF',
      subtitle: 'Verified authentic discounts on flagship smart wearables, active noise-cancelling audio, and tech gear.',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1200',
      badge: 'FLASH SALE',
      cta: 'CLAIM DISCOUNTS',
      color: 'from-zinc-950/90',
      targetUrl: '/search?category=All',
      active: true
    }
  ]
};

const STORAGE_KEY = 'elora-site-config';

/**
 * Retrieves current site configuration with instant fallback to defaults.
 */
export const getLocalSiteConfig = (): SiteConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-migrate old default brand names (ELORA, Luxury Shopping Mall, L.S.M) to Digital Shop T.M
      if (!parsed.siteName || parsed.siteName === 'ELORA' || parsed.siteName === 'Luxury Shopping Mall' || parsed.siteName === 'L.S.M') {
        parsed.siteName = 'Digital Shop T.M';
      }
      if (!parsed.siteTagline || parsed.siteTagline.includes('L.S.M') || parsed.siteTagline.includes('Elora') || parsed.siteTagline.includes('Shopping Mall')) {
        parsed.siteTagline = 'Digital Shop T.M — Your Trusted Digital Marketplace';
      }
      if (!parsed.aboutUsText || parsed.aboutUsText.includes('Luxury Shopping Mall') || parsed.aboutUsText.includes('L.S.M')) {
        parsed.aboutUsText = DEFAULT_SITE_CONFIG.aboutUsText;
      }
      if (!parsed.deliveryDaysSubDhaka) {
        parsed.deliveryDaysSubDhaka = '2 - 3 Days';
      }
      return { ...DEFAULT_SITE_CONFIG, ...parsed };
    }
  } catch (err) {
    console.warn('Failed to parse local site config:', err);
  }
  return DEFAULT_SITE_CONFIG;
};

/**
 * Saves site config locally and dispatches a broadcast event for live reactive UI updates.
 */
export const saveLocalSiteConfig = (config: Partial<SiteConfig>): SiteConfig => {
  const current = getLocalSiteConfig();
  const merged = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('elora-config-updated', { detail: merged }));
  } catch (err) {
    console.error('Failed to save local site config:', err);
  }
  return merged;
};

/**
 * Persists site config to server database and local storage.
 */
export const persistSiteConfig = async (config: Partial<SiteConfig>): Promise<SiteConfig> => {
  const merged = saveLocalSiteConfig(config);
  try {
    await configApi.updateConfig(merged);
  } catch (err) {
    console.error('Cloud persistence error for site config:', err);
  }
  return merged;
};
