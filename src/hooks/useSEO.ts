import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_SITE_CONFIG } from '../constants/siteConfig';
import { useLanguage } from '../contexts/LanguageContext';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
}

const ROUTE_SEO: Record<string, { en: { title: string; description: string }; bn: { title: string; description: string } }> = {
  '/': {
    en: {
      title: `${DEFAULT_SITE_CONFIG.siteName} — Official Digital Marketplace & Luxury Store`,
      description: 'Shop genuine electronics, flagship gadgets, fashion, and lifestyle collections in Bangladesh. 100% authentic with fast nationwide delivery.'
    },
    bn: {
      title: `${DEFAULT_SITE_CONFIG.siteName} — অফিসিয়াল ডিজিটাল মার্কেটপ্লেস ও প্রিমিয়াম স্টোর`,
      description: 'বাংলাদেশে ১০০% আসল ইলেকট্রনিক্স, গ্যাজেট, ফ্যাশন ও লাইফস্টাইল পণ্য কিনুন দ্রুত দেশব্যাপী ডেলিভারিসহ।'
    }
  },
  '/search': {
    en: {
      title: `Search Products & Collections — ${DEFAULT_SITE_CONFIG.siteName}`,
      description: 'Find verified gadgets, luxury watches, electronics, and accessories with smart price filters and genuine warranty.'
    },
    bn: {
      title: `পণ্য ও কালেকশন খুঁজুন — ${DEFAULT_SITE_CONFIG.siteName}`,
      description: 'স্মার্ট প্রাইস ফিল্টার ও অফিসিয়াল ওয়ারেন্টিসহ যাচাইকৃত গ্যাজেট, ঘড়ি, ইলেকট্রনিক্স এবং অ্যাক্সেসরিজ খুঁজুন।'
    }
  },
  '/checkout': {
    en: {
      title: `Secure Checkout & Instant Order — ${DEFAULT_SITE_CONFIG.siteName}`,
      description: 'Complete your purchase with Cash on Delivery (COD), bKash, Nagad, or credit card with bank-grade encryption.'
    },
    bn: {
      title: `নিরাপদ চেকআউট ও তাৎক্ষণিক অর্ডার — ${DEFAULT_SITE_CONFIG.siteName}`,
      description: 'ক্যাশ অন ডেলিভারি, বিকাশ, নগদ অথবা কার্ডের মাধ্যমে নিরাপদভাবে আপনার অর্ডার সম্পন্ন করুন।'
    }
  },
  '/profile': {
    en: {
      title: `My Account & Merchant Portal — ${DEFAULT_SITE_CONFIG.siteName}`,
      description: 'Manage your verified delivery addresses, live order tracking, merchant shop profile, and wishlist.'
    },
    bn: {
      title: `আমার অ্যাকাউন্ট ও মার্চেন্ট পোর্টাল — ${DEFAULT_SITE_CONFIG.siteName}`,
      description: 'আপনার ডেলিভারি ঠিকানা, লাইভ অর্ডার ট্র্যাকিং, মার্চেন্ট শপ এবং উইশলিস্ট পরিচালনা করুন।'
    }
  },
  '/invoice': {
    en: {
      title: `Official Invoice & Receipt — ${DEFAULT_SITE_CONFIG.siteName}`,
      description: 'Download and print verified digital tax invoices for your authentic orders on Digital Shop T.M.'
    },
    bn: {
      title: `অফিশিয়াল চালান ও রসিদ — ${DEFAULT_SITE_CONFIG.siteName}`,
      description: 'Digital Shop T.M-এ আপনার অর্ডারের যাচাইকৃত ডিজিটাল ট্যাক্স চালান ডাউনলোড ও প্রিন্ট করুন।'
    }
  },
  '/admin': {
    en: {
      title: `Executive Admin Dashboard — ${DEFAULT_SITE_CONFIG.siteName}`,
      description: 'Manage store orders, products catalog, merchant verification, coupon campaigns, and customer support.'
    },
    bn: {
      title: `অ্যাডমিন ড্যাশবোর্ড — ${DEFAULT_SITE_CONFIG.siteName}`,
      description: 'স্টোরের অর্ডার, পণ্যের ক্যাটালগ, মার্চেন্ট যাচাইকরণ, কুপন ক্যাম্পেইন এবং কাস্টমার সাপোর্ট পরিচালনা করুন।'
    }
  }
};

export function useSEO(customSEO?: SEOProps) {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const entry = ROUTE_SEO[location.pathname];
    const routeData = entry
      ? entry[language]
      : language === 'bn'
      ? {
          title: `${DEFAULT_SITE_CONFIG.siteName} — আপনার বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস`,
          description: 'বাংলাদেশে আসল পণ্য, ইলেকট্রনিক্স, গ্যাজেট এবং লাইফস্টাইল সামগ্রীর আপনার বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস।'
        }
      : {
          title: `${DEFAULT_SITE_CONFIG.siteName} — Your Trusted Digital Marketplace`,
          description: 'Your trusted digital marketplace for genuine products, electronics, gadgets, and curated lifestyle in Bangladesh.'
        };

    const finalTitle = customSEO?.title || routeData.title;
    const finalDescription = customSEO?.description || routeData.description;
    const finalImage = customSEO?.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200';

    document.title = finalTitle;

    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    setMeta('description', finalDescription);
    setMeta('og:title', finalTitle, true);
    setMeta('og:description', finalDescription, true);
    setMeta('og:image', finalImage, true);
    setMeta('og:url', window.location.href, true);
    setMeta('twitter:title', finalTitle);
    setMeta('twitter:description', finalDescription);
    setMeta('twitter:image', finalImage);
  }, [location.pathname, language, customSEO?.title, customSEO?.description, customSEO?.image]);
}

