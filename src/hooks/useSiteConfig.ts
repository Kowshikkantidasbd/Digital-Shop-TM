import { useState, useEffect, useMemo } from 'react';
import { SiteConfig, DEFAULT_SITE_CONFIG, getLocalSiteConfig, saveLocalSiteConfig, SiteFaq, SiteBanner } from '../constants/siteConfig';
import { configApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export interface UseSiteConfigReturn extends SiteConfig {
  siteConfig: SiteConfig;
  config: SiteConfig;
}

const EN_FAQ_MAP: Record<string, { q: string; a: string }> = {
  'faq-1': {
    q: 'How long will delivery take?',
    a: 'Delivery inside Dhaka typically completes within 24 to 48 hours, and nationwide across Bangladesh within 2 to 4 days.'
  },
  'faq-2': {
    q: 'Is Cash on Delivery (COD) available?',
    a: 'Yes, Cash on Delivery (COD) is available nationwide. You can inspect the parcel in front of the delivery rider before paying.'
  },
  'faq-3': {
    q: 'Can I pay in advance via bKash or Nagad?',
    a: 'Yes, you can pay securely online via bKash and Nagad at checkout and enjoy exclusive cashback offers.'
  },
  'faq-4': {
    q: 'How do I exchange or return a defective product?',
    a: 'Contact our hotline or support within 7 days of receiving your item for an instant free replacement or full refund.'
  },
  'faq-5': {
    q: 'What is the minimum order for Free Delivery?',
    a: 'Orders of ৳1,500 or more qualify for completely free delivery!'
  }
};

const BN_BANNER_MAP: Record<string, Partial<SiteBanner>> = {
  'Premium Mall Experience': {
    title: 'প্রিমিয়াম মল অভিজ্ঞতা',
    subtitle: 'কিউরেটেড ডিজাইনার ফ্যাশন, ফ্ল্যাগশিপ ইলেকট্রনিক্স এবং আসল লাইফস্টাইল পণ্য উপভোগ করুন দ্রুত ডেলিভারিসহ।',
    badge: 'এক্সক্লুসিভ অ্যাক্সেস',
    cta: 'মল ঘুরে দেখুন'
  },
  'Summer Luxury Collection 2026': {
    title: 'সামার লাক্সারি কালেকশন ২০২৬',
    subtitle: 'নিখুঁত কারুকার্য, খাঁটি অর্গানিক কটন এবং আধুনিক স্ট্রিটওয়্যার দিয়ে আপনার স্টাইলকে নতুন রূপ দিন।',
    badge: 'এক্সক্লুসিভ কালেকশন',
    cta: 'কালেকশন দেখুন'
  },
  'Mega Flash Deals Up To 60% OFF': {
    title: 'মেগা ফ্ল্যাশ ডিলস ৬০% পর্যন্ত ছাড়',
    subtitle: 'ফ্ল্যাগশিপ স্মার্ট ওয়্যারেবল, অডিও এবং টেক গ্যাজেটে যাচাইকৃত বিশাল ডিসকাউন্ট।',
    badge: 'ফ্ল্যাশ সেল',
    cta: 'অফার নিন'
  }
};

export const useSiteConfig = (): UseSiteConfigReturn => {
  const [config, setConfig] = useState<SiteConfig>(() => getLocalSiteConfig());
  const { isBangla } = useLanguage();

  useEffect(() => {
    const handleLocalUpdate = (e: Event) => {
      const custom = e as CustomEvent<SiteConfig>;
      if (custom.detail) {
        setConfig(custom.detail);
      } else {
        setConfig(getLocalSiteConfig());
      }
    };
    window.addEventListener('elora-config-updated', handleLocalUpdate);

    let active = true;
    configApi
      .getConfig()
      .then((cloudData) => {
        if (active && cloudData) {
          const merged = saveLocalSiteConfig(cloudData);
          setConfig(merged);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
      window.removeEventListener('elora-config-updated', handleLocalUpdate);
    };
  }, []);

  const localizedConfig = useMemo<SiteConfig>(() => {
    const base = config || DEFAULT_SITE_CONFIG;

    const localizedFaqs: SiteFaq[] = (base.faqs || DEFAULT_SITE_CONFIG.faqs).map((faq) => {
      if (!isBangla && EN_FAQ_MAP[faq.id]) {
        const defaultMatch = DEFAULT_SITE_CONFIG.faqs.find((d) => d.id === faq.id);
        if (defaultMatch && faq.q === defaultMatch.q) {
          return { ...faq, q: EN_FAQ_MAP[faq.id].q, a: EN_FAQ_MAP[faq.id].a };
        }
      }
      return faq;
    });

    const localizedBanners: SiteBanner[] = (base.banners || DEFAULT_SITE_CONFIG.banners).map((b) => {
      if (isBangla && BN_BANNER_MAP[b.title]) {
        return { ...b, ...BN_BANNER_MAP[b.title] };
      }
      return b;
    });

    return {
      ...base,
      siteTagline:
        base.siteTagline === DEFAULT_SITE_CONFIG.siteTagline
          ? (isBangla ? 'Digital Shop T.M — আপনার বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস' : DEFAULT_SITE_CONFIG.siteTagline)
          : base.siteTagline,
      officeAddress:
        base.officeAddress === DEFAULT_SITE_CONFIG.officeAddress
          ? (isBangla ? 'স্যুট ৬বি, নাভানা টাওয়ার, ৪৫ গুলশান এভিনিউ, গুলশান ১, ঢাকা-১২১২, বাংলাদেশ' : DEFAULT_SITE_CONFIG.officeAddress)
          : base.officeAddress,
      operatingHours:
        base.operatingHours === DEFAULT_SITE_CONFIG.operatingHours
          ? (isBangla ? 'প্রতিদিন সকাল ৯:০০ - রাত ১১:০০ (বাংলাদেশ সময়)' : DEFAULT_SITE_CONFIG.operatingHours)
          : base.operatingHours,
      deliveryDaysDhaka:
        base.deliveryDaysDhaka === DEFAULT_SITE_CONFIG.deliveryDaysDhaka
          ? (isBangla ? '১ - ২ দিন' : DEFAULT_SITE_CONFIG.deliveryDaysDhaka)
          : base.deliveryDaysDhaka,
      deliveryDaysSubDhaka:
        base.deliveryDaysSubDhaka === DEFAULT_SITE_CONFIG.deliveryDaysSubDhaka
          ? (isBangla ? '২ - ৩ দিন' : DEFAULT_SITE_CONFIG.deliveryDaysSubDhaka)
          : base.deliveryDaysSubDhaka,
      deliveryDaysOutside:
        base.deliveryDaysOutside === DEFAULT_SITE_CONFIG.deliveryDaysOutside
          ? (isBangla ? '২ - ৪ দিন' : DEFAULT_SITE_CONFIG.deliveryDaysOutside)
          : base.deliveryDaysOutside,
      announcementText:
        base.announcementText === DEFAULT_SITE_CONFIG.announcementText
          ? (isBangla
              ? DEFAULT_SITE_CONFIG.announcementText
              : '🔥 Mega Deals Live! 24-Hour Superfast Delivery Inside Dhaka | Code: SAVE150')
          : base.announcementText,
      announcementLinkText:
        base.announcementLinkText === DEFAULT_SITE_CONFIG.announcementLinkText
          ? (isBangla ? 'অফার দেখুন' : DEFAULT_SITE_CONFIG.announcementLinkText)
          : base.announcementLinkText,
      maintenanceNotice:
        base.maintenanceNotice === DEFAULT_SITE_CONFIG.maintenanceNotice
          ? (isBangla
              ? DEFAULT_SITE_CONFIG.maintenanceNotice
              : 'System optimization is in progress. We sincerely apologize for the temporary inconvenience. Back live shortly!')
          : base.maintenanceNotice,
      aboutUsText:
        base.aboutUsText === DEFAULT_SITE_CONFIG.aboutUsText
          ? (isBangla
              ? DEFAULT_SITE_CONFIG.aboutUsText
              : 'Digital Shop T.M is Bangladesh’s trusted online marketplace. We deliver genuine brand products, gadgets, and quality lifestyle items directly from authorized distributors and trusted merchants with fast nationwide delivery.')
          : base.aboutUsText,
      shippingPolicy:
        base.shippingPolicy === DEFAULT_SITE_CONFIG.shippingPolicy
          ? (isBangla
              ? DEFAULT_SITE_CONFIG.shippingPolicy
              : 'Orders are packaged and handed over to courier within 24 hours of confirmation. Home delivery arrives within 1–2 days inside Dhaka and 2–4 days nationwide across Bangladesh.')
          : base.shippingPolicy,
      refundPolicy:
        base.refundPolicy === DEFAULT_SITE_CONFIG.refundPolicy
          ? (isBangla
              ? DEFAULT_SITE_CONFIG.refundPolicy
              : 'If any defect or mismatch is found after receiving your item, enjoy a hassle-free full money-back guarantee or free replacement within 7 days.')
          : base.refundPolicy,
      faqs: localizedFaqs,
      banners: localizedBanners
    };
  }, [config, isBangla]);

  return {
    ...localizedConfig,
    siteConfig: localizedConfig,
    config: localizedConfig
  };
};
