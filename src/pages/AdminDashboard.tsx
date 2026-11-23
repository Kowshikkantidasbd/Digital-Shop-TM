import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, LayoutDashboard, Store, Package, ShoppingCart, Users, 
  Settings, LogOut, Search, Filter, Check, X, ShieldAlert, TrendingUp,
  CreditCard, ChevronRight, ChevronLeft, MoreVertical, Clock, Eye, Trash2, Home, Menu,
  MapPin, Phone, Mail, FileText, Truck, ArrowLeft, ExternalLink, RefreshCw, DollarSign,
  Lock, Unlock, Copy, Sparkles, UserCheck, Image, Zap, Sliders,
  PackageCheck, MessageSquare, Tag, CheckCircle2, Star, Ban, AlertTriangle, Calendar,
  Edit2, ZoomIn, AlertCircle, UploadCloud, Info, ThumbsUp, Flag, EyeOff, CornerDownRight, MessageCircle, Reply,
  Ticket, Percent, Power, Plus, Pause, Play, StopCircle, Edit3,
  Bell, Key, Activity, BarChart3, CheckSquare, Square, BarChart2, Shield, History,
  RotateCcw, Send
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Product, Order, Coupon, ActivityLogItem, Notification, AdminRole } from '../types';
import { useToast } from '../components/Toast';
import { PRODUCTS, CATEGORIES } from '../constants';
import { getLocalSiteConfig, persistSiteConfig } from '../constants/siteConfig';
import { isSuperAdminEmail, getSuperAdminEmails } from '../constants/adminConfig';
import { adminApi, authApi, configApi, merchantApplicationApi, orderApi } from '../services/api';
import { authClient } from '../lib/auth-client';
import { isFirebaseConfigured } from '../lib/firebase';
import { SiteMasterControl } from '../components/admin/SiteMasterControl';
import { AdminAnalytics } from '../components/admin/AdminAnalytics';
import { AdminNotifications } from '../components/admin/AdminNotifications';
import { AdminRoles } from '../components/admin/AdminRoles';
import { AdminActivityLog } from '../components/admin/AdminActivityLog';
import { FilterTabGroup, CountBadge, FilterDropdown } from '../components/FilterControls';
import { AdminLiveCountdownCard, AdminLivePreviewBadge } from '../components/admin/AdminLiveTimer';
import { AdminHealthWidget } from '../components/admin/AdminHealthWidget';
import { AdminReturnsManagement } from '../components/admin/AdminReturnsManagement';
import { AdminAdBoardManagement } from '../components/admin/AdminAdBoardManagement';
import { AdminMerchantStorePanel } from '../components/admin/AdminMerchantStorePanel';
import { AdminCustomerDetailModal } from '../components/admin/AdminCustomerDetailModal';
import { AdminProductFormModal } from '../components/admin/AdminProductFormModal';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

// Helper to format product price into realistic BDT (৳)
export const formatProductBDT = (val: number | string | undefined | null): string => {
  const n = Number(val) || 0;
  return Math.round(n).toLocaleString();
};

// Helper to normalize and heal product pricing and inventory stock
export const normalizeProduct = (p: any): Product => {
  let price = Math.round(Number(p.price) || 0);
  let originalPrice = p.originalPrice ? Math.round(Number(p.originalPrice)) : undefined;

  // Ensure realistic stock counts
  let stock = (p.stock !== undefined && p.stock !== null && p.stock !== '') ? Number(p.stock) : undefined;
  const defaultMatch = PRODUCTS.find(dp => dp.id === p.id);
  if (stock === undefined) {
    stock = defaultMatch?.stock ?? (p.status === 'pending' ? 50 : 35);
  }

  const isSponsored = p.isSponsored !== undefined ? p.isSponsored : (defaultMatch?.isSponsored ?? false);
  const adBudget = p.adBudget !== undefined ? p.adBudget : (isSponsored ? (defaultMatch?.adBudget ?? 1000) : undefined);
  const adStatus = p.adStatus !== undefined ? p.adStatus : (isSponsored ? (defaultMatch?.adStatus ?? 'active') : undefined);
  const adImpressions = p.adImpressions !== undefined ? p.adImpressions : (isSponsored ? (defaultMatch?.adImpressions ?? 148) : 0);
  const adClicks = p.adClicks !== undefined ? p.adClicks : (isSponsored ? (defaultMatch?.adClicks ?? 12) : 0);

  const isFlashSale = p.isFlashSale !== undefined ? p.isFlashSale : (defaultMatch?.isFlashSale ?? false);
  const flashSalePrice = p.flashSalePrice !== undefined ? p.flashSalePrice : defaultMatch?.flashSalePrice;
  const normalPriceBeforeFlash = p.normalPriceBeforeFlash !== undefined ? p.normalPriceBeforeFlash : defaultMatch?.normalPriceBeforeFlash;
  const flashSaleStock = p.flashSaleStock !== undefined ? p.flashSaleStock : defaultMatch?.flashSaleStock;
  const flashSaleStartDate = p.flashSaleStartDate || defaultMatch?.flashSaleStartDate;
  const flashSaleEndDate = p.flashSaleEndDate || defaultMatch?.flashSaleEndDate;

  return {
    ...p,
    price,
    originalPrice,
    stock,
    isSponsored,
    adBudget,
    adStatus,
    adImpressions,
    adClicks,
    isFlashSale,
    flashSalePrice,
    normalPriceBeforeFlash,
    flashSaleStock,
    flashSaleStartDate,
    flashSaleEndDate,
    status: p.status || 'pending',
    createdAt: p.createdAt || '2026-09-08T10:00:00.000Z'
  };
};

export const formatToLocalDateTimeString = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { language, isBangla, t, translateCategory } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';

  const getOrderStatusLabel = (status: string = 'pending') => {
    const s = status.toLowerCase();
    if (s === 'pending') return t('Pending', 'অপেক্ষমাণ');
    if (s === 'confirmed') return t('Confirmed', 'নিশ্চিত');
    if (s === 'processing') return t('Processing', 'প্রক্রিয়াধীন');
    if (s === 'packed') return t('Packed', 'প্যাক করা হয়েছে');
    if (s === 'shipped') return t('Shipped', 'শিপড');
    if (s === 'out-for-delivery') return t('Out for Delivery', 'ডেলিভারির পথে');
    if (s === 'delivered') return t('Delivered', 'ডেলিভারি সম্পন্ন');
    if (s === 'completed') return t('Completed', 'সম্পন্ন');
    if (s === 'cancelled') return t('Cancelled', 'বাতিল');
    if (s === 'rejected') return t('Rejected', 'প্রত্যাখ্যাত');
    if (s === 'returned') return t('Returned', 'ফেরত এসেছে');
    return status;
  };

  const validAdminViews = useMemo(() => [
    'overview', 'analytics', 'sellers', 'products', 'orders', 'returns', 'users', 
    'reviews', 'coupons', 'ads', 'flash_sales', 'roles', 'activity_log', 
    'notifications', 'settings', 'trash'
  ] as const, []);
  type AdminViewType = typeof validAdminViews[number];

  const paramView = searchParams.get('view') as AdminViewType;
  const initialView: AdminViewType = (paramView && validAdminViews.includes(paramView)) ? paramView : 'overview';

  const [activeView, setActiveViewState] = useState<AdminViewType>(initialView);

  const setActiveView = (view: AdminViewType | ((prev: AdminViewType) => AdminViewType)) => {
    const resolvedView = typeof view === 'function' ? view(activeView) : view;
    setActiveViewState(resolvedView);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (resolvedView === 'overview') {
        next.delete('view');
      } else {
        next.set('view', resolvedView);
      }
      return next;
    });
  };

  useEffect(() => {
    const v = searchParams.get('view') as AdminViewType;
    if (v && validAdminViews.includes(v)) {
      if (v !== activeView) {
        setActiveViewState(v);
      }
    } else if (!v && activeView !== 'overview') {
      setActiveViewState('overview');
    }
  }, [searchParams, validAdminViews]);

  // Notifications System State
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('elora-admin-notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'notif-1',
        title: 'New Customer Order #ORD-8492',
        message: 'Tanvir Ahmed placed an order for ৳3,450 via Cash on Delivery.',
        type: 'order',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        actionView: 'orders'
      },
      {
        id: 'notif-2',
        title: 'Low Stock Alert: Cotton Casual Shirt',
        message: 'Stock level has dropped below threshold (only 2 units remaining).',
        type: 'inventory',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        actionView: 'products'
      },
      {
        id: 'notif-3',
        title: 'New Merchant Application: Apex Styles',
        message: 'Apex Styles submitted trade license for marketplace merchant onboarding.',
        type: 'merchant',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        actionView: 'sellers'
      },
      {
        id: 'notif-4',
        title: 'Customer Review Awaiting Moderation',
        message: 'New 5-star review submitted for "Smart Wireless Earbuds Pro".',
        type: 'review',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        actionView: 'reviews'
      },
      {
        id: 'notif-5',
        title: 'Flagged Review Detected',
        message: 'Customer review reported for inappropriate language.',
        type: 'review',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
        actionView: 'reviews'
      }
    ];
  });
  const [isNotificationsDropdownOpen, setIsNotificationsDropdownOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('elora-admin-notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error('Error saving notifications:', e);
    }
  }, [notifications]);

  const unreadNotifsCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const localizedNotifications = useMemo(() => {
    const seedTranslations: Record<string, { titleBn: string; messageBn: string }> = {
      'notif-1': {
        titleBn: 'নতুন গ্রাহক অর্ডার #ORD-8492',
        messageBn: 'তানভীর আহমেদ ক্যাশ অন ডেলিভারির মাধ্যমে ৳৩,৪৫০ টাকার অর্ডার করেছেন।'
      },
      'notif-2': {
        titleBn: 'স্বল্প স্টক সতর্কতা: কটন ক্যাজুয়াল শার্ট',
        messageBn: 'স্টক সীমার নিচে নেমে গেছে (মাত্র ২টি অবশিষ্ট আছে)।'
      },
      'notif-3': {
        titleBn: 'নতুন মার্চেন্ট আবেদন: অ্যাপেক্স স্টাইলস',
        messageBn: 'মার্কেটপ্লেস মার্চেন্ট অনবোর্ডিংয়ের জন্য অ্যাপেক্স স্টাইলস ট্রেড লাইসেন্স জমা দিয়েছে।'
      },
      'notif-4': {
        titleBn: 'অনুমোদনের অপেক্ষায় থাকা গ্রাহক রিভিউ',
        messageBn: '"স্মার্ট ওয়্যারলেস ইয়ারবাডস প্রো"-এর জন্য নতুন ৫-তারকা রিভিউ জমা হয়েছে।'
      },
      'notif-5': {
        titleBn: 'ফ্ল্যাগ করা রিভিউ শনাক্ত হয়েছে',
        messageBn: 'অনুপযুক্ত ভাষার কারণে একটি গ্রাহক রিভিউ রিপোর্ট করা হয়েছে।'
      }
    };
    return notifications.map((n) => {
      const tr = seedTranslations[n.id];
      if (!tr || language === 'en') return n;
      return { ...n, title: tr.titleBn, message: tr.messageBn };
    });
  }, [notifications, language]);

  const addNotification = (notif: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newN: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      read: false,
      createdAt: new Date().toISOString(),
      ...notif
    };
    setNotifications(prev => [newN, ...prev]);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast(t('All notifications marked as read', 'সব বিজ্ঞপ্তি পঠিত হিসেবে চিহ্নিত হয়েছে'), 'success');
  };

  // Activity Log System State (Read-only Audit Trail)
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('elora-admin-activity-logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'log-1',
        adminName: 'Super Admin',
        adminEmail: 'admin@digitalshop.com',
        action: 'Approve',
        targetType: 'Product',
        targetTitle: 'Premium Cotton Slim Fit Shirt',
        details: 'Approved product listing and published to marketplace',
        timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString()
      },
      {
        id: 'log-2',
        adminName: 'Super Administrator',
        adminEmail: 'admin@digitalshop.com',
        action: 'Status_Change',
        targetType: 'Order',
        targetTitle: 'Order #ORD-7721',
        details: 'Updated status to Shipped / Dispatched with courier tracking',
        timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString()
      },
      {
        id: 'log-3',
        adminName: 'Super Admin',
        adminEmail: 'admin@digitalshop.com',
        action: 'Suspend',
        targetType: 'Merchant',
        targetTitle: 'Urban Trends Boutique',
        details: 'Temporary merchant suspension due to KYC verification pending',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString()
      },
      {
        id: 'log-4',
        adminName: 'Super Administrator',
        adminEmail: 'admin@luxurybd.com',
        action: 'Role_Change',
        targetType: 'Customer',
        targetTitle: 'Rahim Chowdhury',
        details: 'Assigned "Inventory Manager" role with catalog governance permissions',
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString()
      },
      {
        id: 'log-5',
        adminName: 'Super Administrator',
        adminEmail: 'admin@luxurybd.com',
        action: 'Create',
        targetType: 'Coupon',
        targetTitle: 'EID2026',
        details: 'Created flat 15% discount promotional campaign code',
        timestamp: new Date(Date.now() - 1000 * 60 * 720).toISOString()
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('elora-admin-activity-logs', JSON.stringify(activityLogs));
    } catch (e) {
      console.error('Error saving activity logs:', e);
    }
  }, [activityLogs]);

  const localizedActivityLogs = useMemo(() => {
    const seedTranslations: Record<string, { adminNameBn: string; targetTitleBn: string; detailsBn: string }> = {
      'log-1': {
        adminNameBn: 'সুপার অ্যাডমিন',
        targetTitleBn: 'প্রিমিয়াম কটন স্লিম ফিট শার্ট',
        detailsBn: 'পণ্যের তালিকা অনুমোদন ও মার্কেটপ্লেসে প্রকাশ করা হয়েছে'
      },
      'log-2': {
        adminNameBn: 'সুপার অ্যাডমিনিস্ট্রেটর',
        targetTitleBn: 'অর্ডার #ORD-7721',
        detailsBn: 'কুরিয়ার ট্র্যাকিংসহ শিপড / প্রেরিত অবস্থায় আপডেট করা হয়েছে'
      },
      'log-3': {
        adminNameBn: 'সুপার অ্যাডমিন',
        targetTitleBn: 'আরবান ট্রেন্ডস বুটিক',
        detailsBn: 'কেওয়াইসি যাচাইকরণ মুলতুবি থাকায় সাময়িকভাবে মার্চেন্ট স্থগিত করা হয়েছে'
      },
      'log-4': {
        adminNameBn: 'সুপার অ্যাডমিনিস্ট্রেটর',
        targetTitleBn: 'রহিম চৌধুরী',
        detailsBn: 'ক্যাটালগ পরিচালনার অনুমতিসহ "ইনভেন্টরি ম্যানেজার" ভূমিকা নির্ধারণ করা হয়েছে'
      },
      'log-5': {
        adminNameBn: 'সুপার অ্যাডমিনিস্ট্রেটর',
        targetTitleBn: 'EID2026',
        detailsBn: 'ফ্ল্যাট ১৫% ছাড়ের প্রমোশনাল ক্যাম্পেইন কোড তৈরি করা হয়েছে'
      }
    };
    return activityLogs.map((log) => {
      const tr = seedTranslations[log.id];
      if (!tr || language === 'en') return log;
      return {
        ...log,
        adminName: tr.adminNameBn,
        targetTitle: tr.targetTitleBn,
        details: tr.detailsBn
      };
    });
  }, [activityLogs, language]);

  const logAdminAction = (action: ActivityLogItem['action'], targetType: ActivityLogItem['targetType'], targetTitle: string, details?: string) => {
    const newLog: ActivityLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      adminName: adminEmail ? adminEmail.split('@')[0] : 'Admin',
      adminEmail: adminEmail || 'superadmin@luxurybd.com',
      action,
      targetType,
      targetTitle,
      details: details || '',
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Bulk Actions State - Products
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bulkProductConfirmAction, setBulkProductConfirmAction] = useState<'approve' | 'reject' | 'trash' | null>(null);
  const [isExecutingProductBulk, setIsExecutingProductBulk] = useState(false);

  // Bulk Actions State - Orders
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [bulkOrderConfirmAction, setBulkOrderConfirmAction] = useState<'confirmed' | 'delivered' | 'cancelled' | 'trash' | null>(null);
  const [isExecutingOrderBulk, setIsExecutingOrderBulk] = useState(false);

  // Role Assignment Modal State (from Customers page)
  const [assigningRoleUser, setAssigningRoleUser] = useState<User | null>(null);
  const [assigningRoleId, setAssigningRoleId] = useState<string>('inventory_manager');
  const [adminPromotingProduct, setAdminPromotingProduct] = useState<Product | null>(null);
  const [adminAdBudgetInput, setAdminAdBudgetInput] = useState<number>(500);
  const [adminAdStatusInput, setAdminAdStatusInput] = useState<boolean>(true);
  const [adViewTab, setAdViewTab] = useState<'promoted' | 'all'>('promoted');
  const [adsSubTab, setAdsSubTab] = useState<'sponsored' | 'ad_board'>('sponsored');
  const [adSearchQuery, setAdSearchQuery] = useState('');
  const [isSavingAdCampaign, setIsSavingAdCampaign] = useState<boolean>(false);
  const [endingCampaignProduct, setEndingCampaignProduct] = useState<Product | null>(null);
  const [showCpcTooltip, setShowCpcTooltip] = useState<boolean>(false);
  const [isFetchingAds, setIsFetchingAds] = useState<boolean>(false);
  const [flashSaleViewTab, setFlashSaleViewTab] = useState<'promoted' | 'all'>('promoted');
  const [flashSaleSearchQuery, setFlashSaleSearchQuery] = useState('');
  const [isFetchingFlashSale, setIsFetchingFlashSale] = useState<boolean>(false);
  const [isSavingTimer, setIsSavingTimer] = useState<boolean>(false);
  const [savedTargetDate, setSavedTargetDate] = useState<string>('');
  const [flashTimerHours, setFlashTimerHours] = useState<number>(5);
  const [flashTimerMinutes, setFlashTimerMinutes] = useState<number>(42);
  const [flashTimerSeconds, setFlashTimerSeconds] = useState<number>(18);
  const [flashTimerTargetDate, setFlashTimerTargetDate] = useState<string>('');

  // Flash Sale Item Configuration Modal State
  const [isFlashItemModalOpen, setIsFlashItemModalOpen] = useState<boolean>(false);
  const [flashModalMode, setFlashModalMode] = useState<'add' | 'edit'>('add');
  const [selectedFlashProductId, setSelectedFlashProductId] = useState<string>('');
  const [flashDiscountPercent, setFlashDiscountPercent] = useState<number>(20);
  const [flashSalePriceInput, setFlashSalePriceInput] = useState<number>(0);
  const [flashSaleStockInput, setFlashSaleStockInput] = useState<number | string>(20);
  const [flashSaleStartDateInput, setFlashSaleStartDateInput] = useState<string>('');
  const [flashSaleEndDateInput, setFlashSaleEndDateInput] = useState<string>('');
  const [flashFormError, setFlashFormError] = useState<string | null>(null);
  const [isSavingFlashSaleItem, setIsSavingFlashSaleItem] = useState<boolean>(false);

  // Removing flash item confirmation modal
  const [removingFlashProduct, setRemovingFlashProduct] = useState<Product | null>(null);
  const [isRemovingFlashProduct, setIsRemovingFlashProduct] = useState<boolean>(false);

  // Legacy fast modal fallback
  const [promotingFlashProduct, setPromotingFlashProduct] = useState<Product | null>(null);
  const [flashPriceInput, setFlashPriceInput] = useState<number>(0);
  
  // Custom Flash product creation state
  const [isCreateFlashProductModalOpen, setIsCreateFlashProductModalOpen] = useState<boolean>(false);
  const [newFlashProductName, setNewFlashProductName] = useState<string>('');
  const [newFlashProductCategory, setNewFlashProductCategory] = useState<string>('Fashions');
  const [newFlashProductImage, setNewFlashProductImage] = useState<string>('');
  const [newFlashProductRegPrice, setNewFlashProductRegPrice] = useState<string>('');
  const [newFlashProductFlashPrice, setNewFlashProductFlashPrice] = useState<string>('');
  const [newFlashProductStock, setNewFlashProductStock] = useState<string>('50');

  const [trashTab, setTrashTab] = useState<'products' | 'orders'>('products');
  const [trashSearch, setTrashSearch] = useState('');
  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPass, setAdminPass] = useState('');
  const [simulatedAdminEmail, setSimulatedAdminEmail] = useState<string | null>(null);

  
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('elora-users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error initializing users:', e);
    }
    return [
      {
        id: 'super_admin_root',
        name: 'Super Administrator',
        email: 'admin@digitalshop.com',
        role: 'admin',
        adminRoleName: 'Super Admin',
        adminRoleId: 'super_admin',
        permissions: ['*'],
        joinedAt: '2026-01-01T00:00:00.000Z',
        lastActive: new Date().toISOString(),
        addresses: []
      }
    ];
  });
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('elora-products');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeProduct);
        }
      }
    } catch (e) {
      console.error('Error initializing products:', e);
    }
    return PRODUCTS.map(normalizeProduct);
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    try {
      const saved = localStorage.getItem('elora-coupons');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isFetchingCoupons, setIsFetchingCoupons] = useState(false);
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired' | 'disabled'>('all');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState<Coupon | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{
    message: string;
    destructive?: boolean;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [isRunningConfirm, setIsRunningConfirm] = useState(false);
  const [editingBannerModal, setEditingBannerModal] = useState<{ index: number; title: string } | null>(null);

  // Form State for creating/editing coupons
  const [couponForm, setCouponForm] = useState<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discount: string;
    minSpend: string;
    maxDiscount: string;
    usageLimit: string;
    perCustomerLimit: string;
    validFrom: string;
    validUntil: string;
    applicableTo: 'all' | 'category' | 'products';
    applicableCategory: string;
    status: 'active' | 'disabled';
    distributionType: 'all_users' | 'targeted_users' | 'promo_code_only';
    targetedUserIds: string[];
  }>({
    code: '',
    discountType: 'percentage',
    discount: '',
    minSpend: '',
    maxDiscount: '',
    usageLimit: '',
    perCustomerLimit: '1',
    validFrom: '',
    validUntil: '',
    applicableTo: 'all',
    applicableCategory: '',
    status: 'active',
    distributionType: 'all_users',
    targetedUserIds: []
  });
  const [couponFormErrors, setCouponFormErrors] = useState<Record<string, string>>({});
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  const resetCouponForm = () => {
    setCouponForm({
      code: '',
      discountType: 'percentage',
      discount: '',
      minSpend: '',
      maxDiscount: '',
      usageLimit: '',
      perCustomerLimit: '1',
      validFrom: '',
      validUntil: '',
      applicableTo: 'all',
      applicableCategory: '',
      status: 'active',
      distributionType: 'all_users',
      targetedUserIds: []
    });
    setCouponFormErrors({});
    setEditingCoupon(null);
  };

  const openCreateCouponModal = () => {
    resetCouponForm();
    setIsCouponModalOpen(true);
  };

  const openEditCouponModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType || 'percentage',
      discount: String(coupon.discount || ''),
      minSpend: coupon.minSpend ? String(coupon.minSpend) : '',
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      perCustomerLimit: coupon.perCustomerLimit ? String(coupon.perCustomerLimit) : '1',
      validFrom: coupon.validFrom || '',
      validUntil: coupon.validUntil || '',
      applicableTo: coupon.applicableTo || 'all',
      applicableCategory: coupon.applicableCategories?.[0] || '',
      status: (coupon.status === 'disabled' ? 'disabled' : 'active') as 'active' | 'disabled',
      distributionType: coupon.distributionType || 'all_users',
      targetedUserIds: coupon.targetedUserIds || []
    });
    setCouponFormErrors({});
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const cleanCode = couponForm.code.trim().toUpperCase();
    if (!cleanCode) {
      errors.code = t('Coupon code is required', 'কুপন কোড প্রয়োজন');
    } else if (cleanCode.length < 3) {
      errors.code = t('Coupon code must be at least 3 characters', 'কুপন কোড কমপক্ষে ৩ অক্ষরের হতে হবে');
    } else if (!editingCoupon && coupons.some(c => c.code.toUpperCase() === cleanCode)) {
      errors.code = t('This coupon code already exists', 'এই কুপন কোডটি ইতিমধ্যেই আছে');
    } else if (editingCoupon && editingCoupon.code !== cleanCode && coupons.some(c => c.code.toUpperCase() === cleanCode && c.id !== editingCoupon.id)) {
      errors.code = t('This coupon code is already used by another coupon', 'এই কুপন কোডটি অন্য কুপনে ব্যবহৃত হয়েছে');
    }

    const discountVal = Number(couponForm.discount);
    if (!couponForm.discount || isNaN(discountVal) || discountVal <= 0) {
      errors.discount = t('Please enter a valid discount amount greater than 0', '০-এর বেশি বৈধ ডিসকাউন্ট পরিমাণ দিন');
    } else if (couponForm.discountType === 'percentage' && discountVal > 100) {
      errors.discount = t('Discount percentage cannot exceed 100%', 'ডিসকাউন্ট শতকরা হার ১০০%-এর বেশি হতে পারবে না');
    }

    if (couponForm.minSpend && (isNaN(Number(couponForm.minSpend)) || Number(couponForm.minSpend) < 0)) {
      errors.minSpend = t('Minimum spend must be 0 or a positive number', 'ন্যূনতম খরচ ০ বা ধনাত্মক সংখ্যা হতে হবে');
    }

    if (couponForm.maxDiscount && (isNaN(Number(couponForm.maxDiscount)) || Number(couponForm.maxDiscount) <= 0)) {
      errors.maxDiscount = t('Max discount cap must be a positive number', 'সর্বোচ্চ ডিসকাউন্ট সীমা ধনাত্মক সংখ্যা হতে হবে');
    }

    if (couponForm.usageLimit && (isNaN(Number(couponForm.usageLimit)) || Number(couponForm.usageLimit) <= 0)) {
      errors.usageLimit = t('Usage limit must be a positive number', 'ব্যবহারের সীমা ধনাত্মক সংখ্যা হতে হবে');
    }

    if (couponForm.validFrom && couponForm.validUntil && couponForm.validFrom > couponForm.validUntil) {
      errors.validUntil = t('End date cannot be earlier than start date', 'শেষের তারিখ শুরুর তারিখের আগে হতে পারবে না');
    }

    if (Object.keys(errors).length > 0) {
      setCouponFormErrors(errors);
      return;
    }

    setIsSavingCoupon(true);
    setCouponFormErrors({});

    try {
      const payload: Partial<Coupon> = {
        code: cleanCode,
        discountType: couponForm.discountType,
        discount: Number(couponForm.discount),
        minSpend: couponForm.minSpend ? Number(couponForm.minSpend) : undefined,
        maxDiscount: (couponForm.discountType === 'percentage' && couponForm.maxDiscount) ? Number(couponForm.maxDiscount) : undefined,
        usageLimit: couponForm.usageLimit ? Number(couponForm.usageLimit) : undefined,
        perCustomerLimit: couponForm.perCustomerLimit ? Number(couponForm.perCustomerLimit) : 1,
        validFrom: couponForm.validFrom || undefined,
        validUntil: couponForm.validUntil || undefined,
        status: couponForm.status,
        distributionType: couponForm.distributionType,
        targetedUserIds: couponForm.distributionType === 'targeted_users' ? couponForm.targetedUserIds : [],
        applicableTo: couponForm.applicableTo,
        applicableCategories: couponForm.applicableTo === 'category' && couponForm.applicableCategory ? [couponForm.applicableCategory] : []
      };

      if (editingCoupon) {
        await adminApi.updateCoupon(editingCoupon.id, payload);
        setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? { ...c, ...payload, updatedAt: new Date().toISOString() } : c));
        showToast(t(`Coupon ${cleanCode} updated successfully`, `কুপন ${cleanCode} সফলভাবে আপডেট হয়েছে`), 'success');
      } else {
        const created = await adminApi.createCoupon(payload);
        setCoupons(prev => [created, ...prev.filter(c => c.code !== cleanCode)]);
        showToast(t(`Coupon ${cleanCode} created successfully`, `কুপন ${cleanCode} সফলভাবে তৈরি হয়েছে`), 'success');
      }

      setIsCouponModalOpen(false);
      resetCouponForm();
    } catch (err: any) {
      showToast(err.message || t('Failed to save coupon', 'কুপন সংরক্ষণ করতে ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsSavingCoupon(false);
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    const newStatus = coupon.status === 'disabled' ? 'active' : 'disabled';
    try {
      await adminApi.updateCoupon(coupon.id, { status: newStatus });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, status: newStatus } : c));
      showToast(
        t(
          `Coupon ${coupon.code} is now ${newStatus === 'active' ? 'ENABLED' : 'DISABLED'}`,
          `কুপন ${coupon.code} এখন ${newStatus === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}`
        ),
        newStatus === 'active' ? 'success' : 'info'
      );
    } catch (err) {
      showToast(t('Failed to update coupon status', 'কুপনের অবস্থা আপডেট করতে ব্যর্থ'), 'error');
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await adminApi.deleteCoupon(couponId);
      setCoupons(prev => prev.filter(c => c.id !== couponId));
      showToast(t('Coupon removed permanently', 'কুপন স্থায়ীভাবে মুছে ফেলা হয়েছে'), 'success');
      setDeleteConfirmCoupon(null);
    } catch (err) {
      showToast(t('Failed to delete coupon', 'কুপন মুছতে ব্যর্থ হয়েছে'), 'error');
    }
  };

  // Core Configuration State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementActive, setAnnouncementActive] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [showCouponCode, setShowCouponCode] = useState<boolean>(() => getLocalSiteConfig().showCouponCode === true);
  const [isTogglingCouponBox, setIsTogglingCouponBox] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Desktop Sidebar Collapse & Resize State with LocalStorage persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 260 && parsed <= 380) return parsed;
      }
    } catch {}
    return 260; // Standard desktop sidebar width (260px)
  });

  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => {
          const next = !prev;
          try {
            localStorage.setItem('admin_sidebar_collapsed', String(next));
          } catch {}
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sidebar drag-to-resize listener
  const startResizingSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(260, Math.min(380, e.clientX));
      setSidebarWidth(newWidth);
      if (isSidebarCollapsed && newWidth > 140) {
        setIsSidebarCollapsed(false);
        try {
          localStorage.setItem('admin_sidebar_collapsed', 'false');
        } catch {}
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsResizingSidebar(false);
      const finalWidth = Math.max(260, Math.min(380, e.clientX));
      setSidebarWidth(finalWidth);
      try {
        localStorage.setItem('admin_sidebar_width', String(finalWidth));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, isSidebarCollapsed]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const effectiveSidebarWidth = isDesktop ? (isSidebarCollapsed ? 76 : sidebarWidth) : 320;
  const [adminProfile, setAdminProfile] = useState<User | null>(null);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState<boolean>(isFirebaseConfigured);
  const [sellerFilter, setSellerFilter] = useState<'pending' | 'active' | 'suspended'>('active');
  const [isFetchingSellers, setIsFetchingSellers] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [selectedMerchantForDetails, setSelectedMerchantForDetails] = useState<User | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    confirmVariant: 'danger' | 'success';
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [productFilter, setProductFilter] = useState<'pending' | 'approved' | 'rejected' | 'low_stock'>('pending');
  const lowStockThreshold = useMemo(() => {
    try {
      return getLocalSiteConfig().lowStockThreshold || 5;
    } catch {
      return 5;
    }
  }, []);

  // Automated Low Stock Notification Trigger
  useEffect(() => {
    if (!products || products.length === 0) return;
    const lowStockItems = products.filter(p => !p.isDeleted && p.status === 'approved' && (Number(p.stock) || 0) <= lowStockThreshold);
    lowStockItems.forEach(item => {
      const existing = notifications.find(n => n.type === 'inventory' && n.title.includes(item.name));
      if (!existing) {
        addNotification({
          title: `Low Stock Alert: ${item.name}`,
          message: `Inventory dropped to ${item.stock ?? 0} units (threshold: ${lowStockThreshold}). Restock recommended.`,
          type: 'inventory',
          actionView: 'products'
        });
      }
    });
  }, [products, lowStockThreshold]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductForm, setEditProductForm] = useState<any>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);
  const [inspectingImageIndex, setInspectingImageIndex] = useState(0);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [orderShowDeleted, setOrderShowDeleted] = useState<boolean>(false);
  
  // Custom states for user management search and filter controls
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [viewingUser, setViewingUser] = useState<any | null>(null);

  // Reviews & Feedback management state
  const [reviewFilterTab, setReviewFilterTab] = useState<'all' | 'pending' | 'published' | 'flagged' | 'hidden'>('all');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [reviewSearchTerm, setReviewSearchTerm] = useState('');
  const [reviewSortBy, setReviewSortBy] = useState<'recent' | 'highest' | 'lowest' | 'helpful'>('recent');
  const [isFetchingReviews, setIsFetchingReviews] = useState(false);
  const [replyingReview, setReplyingReview] = useState<any | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [flaggingReview, setFlaggingReview] = useState<any | null>(null);
  const [flagReasonInput, setFlagReasonInput] = useState('');
  const [previewingPhotoUrl, setPreviewingPhotoUrl] = useState<string | null>(null);
  const [previewingReviewProduct, setPreviewingReviewProduct] = useState<any | null>(null);
  const [authPermissionError, setAuthPermissionError] = useState<{ path?: string; message: string; details?: string } | null>(null);

    useEffect(() => {
      let isMounted = true;
      setIsLoading(true);

      authClient.getProviders().then((p) => {
        if (isMounted) setGoogleAuthEnabled(Boolean(p.google) || isFirebaseConfigured);
      }).catch(() => {});

      const syncAdminSession = async () => {
        const sessionRes = await authClient.getSession();
        const authUser = sessionRes.user;
        if (!isMounted) return;

        if (!authUser) {
          setSessionUser(null);
          setIsLogin(false);
          setIsLoading(false);
          return;
        }

        setSessionUser(authUser);
        setAdminEmail(authUser.email || '');

        const isSuperAdminUser = isSuperAdminEmail(authUser.email);

        // Check token and server verification
        let isVerifiedAdmin = false;
        try {
          isVerifiedAdmin = await authApi.verifyAdminStatus();
        } catch (e) {
          console.warn('verifyAdminStatus check warning:', e);
        }

        let profile: any = authUser;
        try {
          const remoteProfile = await authApi.getProfile();
          if (remoteProfile) profile = remoteProfile;
        } catch (pe: any) {
          console.warn('Remote profile fetch warning:', pe);
        }

        const isAdminUser = isSuperAdminUser || isVerifiedAdmin || profile?.role === 'admin';

        if (!isAdminUser) {
          console.warn('Unauthorized admin access attempt.');
          if (isMounted) {
            setIsLogin(false);
            setIsLoading(false);
          }
          return;
        }

        if (profile) setAdminProfile(profile as User);

        // Ensure Super Admin has role: 'admin' synced in backend database
        if (isSuperAdminUser && (!profile || profile.role !== 'admin')) {
          try {
            await adminApi.updateUser(authUser.id, {
              role: 'admin',
              adminRoleName: 'Super Admin',
              permissions: ['*'],
              email: authUser.email,
              name: authUser.name || 'Super Admin',
              updatedAt: new Date().toISOString()
            });
          } catch (syncErr) {
            console.warn('Super Admin profile sync notice:', syncErr);
          }
        }

        if (isMounted) {
          setIsLogin(true);
        }

        try {
          const stats = await adminApi.getStats(); 
          if (isMounted) setStats(stats || { users: 0, orders: 0, products: 0, revenue: 0 });
        } catch (se: any) {
          console.warn('Stats fetch warning:', se);
        }

        try {
          const fetchedUsers = await adminApi.getUsers();
          if (isMounted && fetchedUsers && fetchedUsers.length > 0) {
            setUsers(prev => {
              const map = new Map<string, User>();
              prev.forEach(u => map.set((u.email || '').toLowerCase(), u));
              fetchedUsers.forEach((u: any) => {
                const key = (u.email || '').toLowerCase();
                map.set(key, { ...map.get(key), ...u });
              });
              const merged = Array.from(map.values());
              localStorage.setItem('elora-users', JSON.stringify(merged));
              return merged;
            });
          }
        } catch (e: any) {
          console.warn('Initial admin users fetch notice:', e);
        }

        if (isMounted) {
          setIsLoading(false);
          refreshView();
        }
      };

      syncAdminSession();
      const handleAuthChange = () => {
        syncAdminSession();
      };
      window.addEventListener('elora-auth-changed', handleAuthChange);

      return () => {
        isMounted = false;
        window.removeEventListener('elora-auth-changed', handleAuthChange);
      };
    }, []);

  const refreshView = async () => {
    try {
      if (activeView === 'users' || activeView === 'sellers') {
        if (activeView === 'sellers') setIsFetchingSellers(true);
        try {
          const [u, p, apps] = await Promise.all([
            adminApi.getUsers(),
            adminApi.getProducts(),
            merchantApplicationApi.getApplications().catch(() => [])
          ]);
          if (u) {
            const appSellers = (apps || []).map((app: any) => ({
              id: app.id,
              name: app.ownerName || 'Merchant Applicant',
              email: app.email || '',
              phone: app.phone || '',
              role: 'user' as const,
              shop: {
                id: app.id,
                name: app.shopName,
                ownerName: app.ownerName,
                email: app.email,
                contactNumber: app.phone,
                district: app.district,
                category: app.category,
                status: (app.status || 'pending') as any,
                createdAt: app.createdAt
              },
              addresses: []
            }));
            const existingIds = new Set((u || []).map((usr: any) => usr.shop?.id || usr.id));
            const mergedSellers = [...(u || []), ...appSellers.filter(as => !existingIds.has(as.id))];
            setUsers(mergedSellers);
          }
          if (p) setProducts(p);
        } finally {
          if (activeView === 'sellers') setIsFetchingSellers(false);
        }
      } else if (activeView === 'products' || activeView === 'ads' || activeView === 'flash_sales') {
        if (activeView === 'ads') setIsFetchingAds(true);
        if (activeView === 'flash_sales') setIsFetchingFlashSale(true);
        try {
          const p = await adminApi.getProducts();
          if (p && Array.isArray(p) && p.length > 0) {
            setProducts(p.map(normalizeProduct));
          }
          if (activeView === 'flash_sales') {
            const config = await configApi.getConfig();
            if (config) {
              if (config.flashSaleTargetDate) {
                setSavedTargetDate(config.flashSaleTargetDate);
                const targetDate = new Date(config.flashSaleTargetDate);
                setFlashTimerTargetDate(formatToLocalDateTimeString(targetDate));
                const diff = targetDate.getTime() - Date.now();
                if (diff > 0) {
                  const totalSecs = Math.floor(diff / 1000);
                  const h = Math.floor(totalSecs / 3600);
                  const m = Math.floor((totalSecs % 3600) / 60);
                  const s = totalSecs % 60;
                  setFlashTimerHours(h);
                  setFlashTimerMinutes(m);
                  setFlashTimerSeconds(s);
                } else {
                  setFlashTimerHours(0);
                  setFlashTimerMinutes(0);
                  setFlashTimerSeconds(0);
                }
              } else if (config.flashSaleHours !== undefined) {
                const h = typeof config.flashSaleHours === 'number' ? config.flashSaleHours : 5;
                const m = typeof config.flashSaleMinutes === 'number' ? config.flashSaleMinutes : 42;
                const s = typeof config.flashSaleSeconds === 'number' ? config.flashSaleSeconds : 18;
                setFlashTimerHours(h);
                setFlashTimerMinutes(m);
                setFlashTimerSeconds(s);
                const target = new Date(Date.now() + (h * 3600 + m * 60 + s) * 1000);
                setSavedTargetDate(target.toISOString());
                setFlashTimerTargetDate(formatToLocalDateTimeString(target));
              }
            } else {
              const target = new Date(Date.now() + (5 * 3600 + 42 * 60 + 18) * 1000);
              setSavedTargetDate(target.toISOString());
              setFlashTimerTargetDate(formatToLocalDateTimeString(target));
            }
          }
        } finally {
          if (activeView === 'ads') setIsFetchingAds(false);
          if (activeView === 'flash_sales') setIsFetchingFlashSale(false);
        }
      } else if (activeView === 'orders') {
        const o = await adminApi.getOrders();
        setOrders(o);
      } else if (activeView === 'overview') {
        const s = await adminApi.getStats();
        setStats(s || { users: 0, orders: 0, products: 0, revenue: 0 });
      } else if (activeView === 'settings') {
        const config = await configApi.getConfig();
        if (config) {
          setMaintenanceMode(!!config.maintenanceMode);
          setAnnouncementText(config.announcementText || '');
          setAnnouncementActive(!!config.announcementActive);
          setBanners(config.banners || []);
        } else {
          setMaintenanceMode(false);
          setAnnouncementText('');
          setAnnouncementActive(false);
          setBanners([
            {
              title: 'Fast Fashion Trends',
              subtitle: 'Explore our latest clothing collection in-store. Premium quality at affordable prices.',
              image: 'https://img.freepik.com/free-photo/fast-fashion-concept-with-full-clothing-store_23-2150871300.jpg?semt=ais_hybrid&w=740&q=80',
              badge: 'New Trends',
              cta: 'Shop Collection',
              color: 'from-orange-900/70',
              targetUrl: '/category/fashions'
            },
            {
              title: 'Premium Mall Experience',
              subtitle: 'Discover a world of luxury brands and cinematic shopping environments.',
              image: 'https://img.freepik.com/free-photo/cinematic-style-mall_23-2151551173.jpg?semt=ais_hybrid&w=740&q=80',
              badge: 'Exclusive Access',
              cta: 'Explore Mall',
              color: 'from-blue-900/70',
              targetUrl: '/category/all'
            },
            {
              title: 'Black Friday Deals',
              subtitle: 'Premium shopping experience with mega discounts on top brands. Don\'t miss out!',
              image: 'https://img.freepik.com/free-photo/black-friday-sales-sign-neon-light_23-2151833112.jpg?semt=ais_hybrid&w=740&q=80',
              badge: 'Flash Sale',
              cta: 'Shop Now',
              color: 'from-black/70',
              targetUrl: '/category/all'
            }
          ]);
        }
      } else if (activeView === 'reviews') {
        setIsFetchingReviews(true);
        try {
          const revs = await adminApi.getReviews();
          if (revs) setReviews(revs);
        } catch (err) {
          console.error('Failed to load reviews in admin:', err);
        } finally {
          setIsFetchingReviews(false);
        }
      } else if (activeView === 'coupons') {
        setIsFetchingCoupons(true);
        try {
          const [fetchedCoupons, cfg] = await Promise.all([
            adminApi.getCoupons(),
            configApi.getConfig().catch(() => null)
          ]);
          if (fetchedCoupons) setCoupons(fetchedCoupons);
          if (cfg) setShowCouponCode(cfg.showCouponCode === true);
        } catch (err) {
          console.error('Failed to load coupons in admin:', err);
        } finally {
          setIsFetchingCoupons(false);
        }
      }
    } catch (e) {
      console.error('View refresh failed:', e);
    }
  };

  useEffect(() => {
    const syncCouponSetting = (e: Event) => {
      const custom = e as CustomEvent<any>;
      if (custom.detail && typeof custom.detail.showCouponCode === 'boolean') {
        setShowCouponCode(custom.detail.showCouponCode);
      } else {
        setShowCouponCode(getLocalSiteConfig().showCouponCode === true);
      }
    };
    window.addEventListener('elora-config-updated', syncCouponSetting);
    return () => window.removeEventListener('elora-config-updated', syncCouponSetting);
  }, []);

  useEffect(() => {
    if (isLogin) refreshView();
  }, [activeView, isLogin]);

  const [loginError, setLoginError] = useState('');
  const [stats, setStats] = useState({ users: 0, orders: 0, products: 0, revenue: 0 });
  
  // Add Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productForm, setProductForm] = useState(() => {
    const saved = localStorage.getItem('elora-admin-product-draft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: '',
      price: '',
      originalPrice: '',
      category: 'Fashions',
      image: '',
      description: '',
      stock: '50',
      status: 'approved',
      brand: 'Digital Shop Originals'
    };
  });

  useEffect(() => {
    document.title = t('Digital Shop T.M | Admin Panel', 'Digital Shop T.M | অ্যাডমিন প্যানেল');
    return () => {
      document.title = t('Digital Shop T.M — Your Trusted Digital Marketplace', 'Digital Shop T.M — আপনার বিশ্বস্ত ডিজিটাল মার্কেটপ্লেস');
    };
  }, [language]);

  useEffect(() => {
    localStorage.setItem('elora-admin-product-draft', JSON.stringify(productForm));
  }, [productForm]);

  const formatProductDate = (dateVal: any) => {
    if (!dateVal) return t('Recently', 'সাম্প্রতিক');
    try {
      if (typeof dateVal === 'object' && dateVal.seconds) {
        return new Date(dateVal.seconds * 1000).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });
      }
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch {}
    return t('Recently', 'সাম্প্রতিক');
  };

  const formatBDT = (amount: any): string => {
    const num = Math.round(Number(amount) || 0);
    return num.toLocaleString('en-BD', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });
  };

  const formatOrderDate = (dateVal: any): string => {
    const fallback = t('Sep 8, 2026 · 3:45 PM', '৮ সেপ্টেম্বর, ২০২৬ · ৩:৪৫ PM');
    if (!dateVal) return fallback;
    try {
      let d: Date;
      if (typeof dateVal?.toDate === 'function') {
        d = dateVal.toDate();
      } else if (dateVal?.seconds !== undefined) {
        d = new Date(dateVal.seconds * 1000);
      } else if (dateVal?._seconds !== undefined) {
        d = new Date(dateVal._seconds * 1000);
      } else if (typeof dateVal === 'number') {
        d = new Date(dateVal);
      } else if (typeof dateVal === 'string') {
        if (/^\d+$/.test(dateVal)) {
          d = new Date(Number(dateVal));
        } else {
          d = new Date(dateVal);
        }
      } else {
        d = new Date(dateVal);
      }
      if (isNaN(d.getTime())) {
        return fallback;
      }
      const dateStr = d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = d.toLocaleTimeString(dateLocale, { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${dateStr} · ${timeStr}`;
    } catch {
      return fallback;
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.price || !productForm.image.trim()) {
      showToast(t('Please fill in Name, Price, and Image URL', 'অনুগ্রহ করে নাম, মূল্য এবং ছবির URL পূরণ করুন'), 'error');
      return;
    }

    const priceNum = Number(productForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast(t('Please enter a valid price greater than 0', 'অনুগ্রহ করে ০-এর বেশি বৈধ মূল্য দিন'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const initialStatus = (productForm.status as 'pending' | 'approved') || 'approved';
      const newProductPayload = {
        name: productForm.name.trim(),
        price: priceNum,
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
        category: productForm.category || 'Fashions',
        image: productForm.image.trim(),
        gallery: [productForm.image.trim()],
        description: productForm.description.trim() || t('Premium item available on Digital Shop T.M.', 'ডিজিটাল শপ টি.এম-এ প্রিমিয়াম পণ্য।'),
        stock: Number(productForm.stock) || 50,
        brand: productForm.brand?.trim() || 'Digital Shop Originals',
        rating: 5,
        reviews: 0,
        soldCount: 0,
        status: initialStatus,
        createdAt: new Date().toISOString(),
        seller: {
          name: 'Digital Shop Official Store',
          rating: 5.0,
          followers: '150k',
          chatResponse: '100%'
        }
      };

      const created = await adminApi.createProduct(newProductPayload);
      const normalizedCreated = normalizeProduct({ ...newProductPayload, id: created?.id || `prod-${Date.now()}` });

      setProducts(prev => {
        const next = [normalizedCreated, ...prev];
        localStorage.setItem('elora-products', JSON.stringify(next));
        return next;
      });

      showToast(
        t(
          `Product "${productForm.name}" created and added to ${initialStatus === 'approved' ? 'Approved' : 'Pending'} catalog`,
          `"${productForm.name}" পণ্যটি তৈরি করে ${initialStatus === 'approved' ? 'অনুমোদিত' : 'অপেক্ষমাণ'} ক্যাটালগে যোগ করা হয়েছে`
        ),
        'success'
      );
      setIsProductModalOpen(false);
      localStorage.removeItem('elora-admin-product-draft');
      setProductForm({
        name: '',
        price: '',
        originalPrice: '',
        category: 'Fashions',
        image: '',
        description: '',
        stock: '50',
        status: 'approved',
        brand: 'Digital Shop Originals'
      });
      refreshView();
    } catch (err) {
      showToast(t('Failed to add product', 'পণ্য যোগ করতে ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditProductForm({
      name: p.name || '',
      category: p.category || 'Fashions',
      price: String(p.price || ''),
      originalPrice: p.originalPrice ? String(p.originalPrice) : '',
      stock: String(p.stock ?? 50),
      status: p.status || 'pending',
      image: p.image || '',
      gallery: Array.isArray(p.gallery) ? p.gallery.join(', ') : '',
      brand: p.brand || '',
      description: p.description || '',
      details: p.details || '',
      rejectionReason: p.rejectionReason || ''
    });
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editProductForm) return;

    if (!editProductForm.name.trim()) {
      showToast(t('Product title is required', 'পণ্যের নাম প্রয়োজন'), 'error');
      return;
    }
    const priceNum = Number(editProductForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast(t('Please enter a valid price greater than 0', 'অনুগ্রহ করে ০-এর বেশি বৈধ মূল্য দিন'), 'error');
      return;
    }
    const stockNum = Number(editProductForm.stock);
    if (isNaN(stockNum) || stockNum < 0) {
      showToast(t('Please enter a valid stock quantity (0 or more)', 'অনুগ্রহ করে বৈধ স্টক পরিমাণ (০ বা বেশি) দিন'), 'error');
      return;
    }

    setIsSavingProduct(true);
    try {
      const galleryArray = editProductForm.gallery
        ? editProductForm.gallery.split(',').map((s: string) => s.trim()).filter(Boolean)
        : (editingProduct.gallery || [editProductForm.image]);

      const updatedFields: Partial<Product> = {
        name: editProductForm.name.trim(),
        category: editProductForm.category,
        price: priceNum,
        originalPrice: editProductForm.originalPrice ? Number(editProductForm.originalPrice) : undefined,
        stock: stockNum,
        status: editProductForm.status,
        image: editProductForm.image.trim(),
        gallery: galleryArray.length > 0 ? galleryArray : [editProductForm.image.trim()],
        brand: editProductForm.brand.trim(),
        description: editProductForm.description.trim(),
        details: editProductForm.details.trim(),
        rejectionReason: editProductForm.status === 'approved' ? '' : editProductForm.rejectionReason.trim(),
        updatedAt: new Date().toISOString()
      };

      await adminApi.updateProduct(editingProduct.id, updatedFields);

      setProducts(prev => {
        const next = prev.map(item => item.id === editingProduct.id ? { ...item, ...updatedFields } : item);
        localStorage.setItem('elora-products', JSON.stringify(next));
        return next;
      });

      showToast(t(`Product "${editProductForm.name}" updated successfully`, `"${editProductForm.name}" পণ্যটি সফলভাবে আপডেট হয়েছে`), 'success');
      setEditingProduct(null);
      setEditProductForm(null);
      refreshView();
    } catch (err) {
      showToast(t('Failed to update product', 'পণ্য আপডেট করতে ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleOpenRejectProduct = (p: Product) => {
    setRejectingProduct(p);
    setRejectionReasonInput(p.rejectionReason || '');
  };

  const handleConfirmReject = async () => {
    if (!rejectingProduct) return;
    try {
      const reason = rejectionReasonInput.trim() || t('Product submission did not meet catalog quality standards.', 'পণ্যের তালিকা ক্যাটালগের মানদণ্ড পূরণ করেনি।');
      await adminApi.updateProduct(rejectingProduct.id, {
        status: 'rejected',
        rejectionReason: reason
      });

      setProducts(prev => {
        const next = prev.map(item => item.id === rejectingProduct.id ? { ...item, status: 'rejected' as const, rejectionReason: reason } : item);
        localStorage.setItem('elora-products', JSON.stringify(next));
        return next;
      });

      showToast(t(`Product "${rejectingProduct.name}" rejected and moved to Rejected Products tab`, `"${rejectingProduct.name}" পণ্যটি বাতিল করে বাতিলকৃত পণ্যের তালিকায় সরানো হয়েছে`), 'info');
      setRejectingProduct(null);
      setRejectionReasonInput('');
      refreshView();
    } catch (err) {
      showToast(t('Failed to reject product', 'পণ্য বাতিল করতে ব্যর্থ'), 'error');
    }
  };

  const handleApproveProduct = async (p: Product) => {
    try {
      await adminApi.updateProduct(p.id, {
        status: 'approved',
        rejectionReason: ''
      });

      setProducts(prev => {
        const next = prev.map(item => item.id === p.id ? { ...item, status: 'approved' as const, rejectionReason: '' } : item);
        localStorage.setItem('elora-products', JSON.stringify(next));
        return next;
      });

      showToast(t(`Product "${p.name}" approved and published to storefront!`, `"${p.name}" পণ্যটি অনুমোদিত হয়ে স্টোরে প্রকাশিত হয়েছে!`), 'success');
      refreshView();
    } catch (err) {
      showToast(t('Approval failed', 'অনুমোদন ব্যর্থ হয়েছে'), 'error');
    }
  };

  const handleTrashProduct = (p: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: t('Move Product to Trash Bin', 'পণ্যটি ট্র্যাশে সরান'),
      message: t(
        `Are you sure you want to move "${p.name}" to the Trash Bin? It can be recovered anytime from the Trash & Recovery section.`,
        `আপনি কি নিশ্চিত যে "${p.name}" ট্র্যাশে সরাতে চান? ট্র্যাশ ও রিকভারি সেকশন থেকে যেকোনো সময় পুনরুদ্ধার করা যাবে।`
      ),
      confirmLabel: t('Move to Trash', 'ট্র্যাশে সরান'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await adminApi.deleteProduct(p.id, false);
          setProducts(prev => {
            const next = prev.map(item => item.id === p.id ? { ...item, isDeleted: true } : item);
            localStorage.setItem('elora-products', JSON.stringify(next));
            return next;
          });
          showToast(t(`"${p.name}" moved to Trash Bin`, `"${p.name}" ট্র্যাশে সরানো হয়েছে`), 'success');
          refreshView();
        } catch (e) {
          showToast(t('Failed to move product to Trash', 'পণ্যটি ট্র্যাশে সরাতে ব্যর্থ'), 'error');
        }
      }
    });
  };

  const handleViewSellerProfile = (sellerName: string) => {
    const matchedUser = users.find(u => 
      (u.shop?.name || '').toLowerCase() === sellerName.toLowerCase() ||
      (u.name || '').toLowerCase() === sellerName.toLowerCase()
    );
    if (matchedUser) {
      setSelectedMerchantForDetails(matchedUser);
    } else {
      setSelectedMerchantForDetails({
        id: `seller-${Date.now()}`,
        name: sellerName,
        email: `${sellerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'seller'}@merchant.elora.com`,
        role: 'user',
        status: 'active',
        joinedAt: '2026-01-15T00:00:00.000Z',
        shop: {
          name: sellerName,
          category: 'Fashion & Apparel',
          rating: 4.8,
          ordersCount: 420,
          revenue: 350000,
          status: 'active',
          description: `Official verified merchant store for ${sellerName} on Digital Shop T.M.`
        }
      });
    }
  };

  const handleQuickAdminAccess = async (targetEmail: string) => {
    setIsLoading(true);
    setLoginError('');
    try {
      const cleanEmail = targetEmail.trim().toLowerCase();
      if (!isSuperAdminEmail(cleanEmail)) {
        throw new Error('This account does not have Super Admin privileges.');
      }
      const adminUser: User = {
        id: sessionUser?.id || `admin_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: cleanEmail === 'abhimanyudey952@gmail.com' ? 'Abhimanyu Dey' : 'Digital Shop Admin',
        email: cleanEmail,
        role: 'admin',
        adminRoleName: 'Super Admin',
        permissions: ['*'],
        addresses: []
      };
      setAdminProfile(adminUser);
      setIsLogin(true);
      showToast(t(`Signed in to Admin Panel as ${adminUser.name}`, `${adminUser.name} হিসেবে অ্যাডমিন প্যানেলে লগইন সম্পন্ন হয়েছে`), 'success');
      refreshView();
    } catch (err: any) {
      setLoginError(err?.message || t('Quick access failed', 'দ্রুত অ্যাক্সেস ব্যর্থ হয়েছে'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setIsLoading(true);
    setLoginError('');
    try {
      if (!googleAuthEnabled) {
        throw new Error(t('Google Sign-In is not configured on this server. Use email and password sign-in.', 'এই সার্ভারে গুগল সাইন-ইন কনফিগার করা নেই। ইমেইল ও পাসওয়ার্ড দিয়ে সাইন-ইন করুন।'));
      }
      const authRes = await authClient.signInSocialGoogle('/admin');
      const signedUser = authRes?.user;
      if (!signedUser) {
        setIsLoading(false);
        return;
      }

      setSessionUser(signedUser);
      const cleanEmail = String(signedUser.email || '').trim().toLowerCase();
      const isSuperAdmin = isSuperAdminEmail(cleanEmail);
      const isVerified = await authApi.verifyAdminStatus().catch(() => false);

      if (isSuperAdmin || isVerified || signedUser.role === 'admin') {
        const adminUser: User = {
          ...signedUser,
          role: 'admin',
          adminRoleName: signedUser.adminRoleName || 'Super Admin',
          permissions: signedUser.permissions || ['*'],
          addresses: signedUser.addresses || []
        };
        setAdminProfile(adminUser);
        const s = await adminApi.getStats().catch(() => null);
        setStats(s || { users: 0, orders: 0, products: 0, revenue: 0 });
        setIsLogin(true);
        showToast(
          t(`Signed in to Admin Panel as ${adminUser.name}`, `${adminUser.name} হিসেবে অ্যাডমিন প্যানেলে লগইন সম্পন্ন হয়েছে`),
          'success'
        );
        refreshView();
      } else {
        const denyMsg = t(
          `Signed in as ${cleanEmail}, but this account does not have Administrator privileges.`,
          `${cleanEmail} হিসেবে লগইন হয়েছে, তবে এই অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই।`
        );
        setLoginError(denyMsg);
        showToast(denyMsg, 'error');
      }
    } catch (err: any) {
      console.warn('Google admin login notice:', err);
      const code = String(err?.code || '');
      let msg = err?.message || t('Google sign-in was cancelled or failed.', 'গুগল সাইন-ইন বাতিল হয়েছে বা ব্যর্থ হয়েছে।');
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        msg = t('Google sign-in popup was closed.', 'গুগল সাইন-ইন পপআপ বন্ধ করা হয়েছে।');
      } else if (code === 'auth/popup-blocked') {
        msg = t('Popup was blocked by your browser. Please allow popups and try again.', 'ব্রাউজারে পপআপ ব্লক করা আছে। পপআপ চালু করে আবার চেষ্টা করুন।');
      } else if (code === 'auth/unauthorized-domain') {
        msg = t('This domain is not authorized for Google Sign-In in Firebase Console.', 'এই ডোমেইনটি Firebase Console-এ গুগল সাইন-ইনের জন্য অনুমোদিত নয়।');
      } else if (code === 'auth/operation-not-allowed') {
        msg = t('Google Sign-In provider is disabled in Firebase Authentication.', 'Firebase Authentication-এ গুগল সাইন-ইন প্রোভাইডারটি বন্ধ আছে।');
      } else if (code === 'auth/network-request-failed') {
        msg = t('Network error while connecting to Google. Please check your connection.', 'গুগলের সাথে সংযোগে নেটওয়ার্ক ত্রুটি হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
      } else if (code === 'auth/account-exists-with-different-credential') {
        msg = t('An account already exists with this email using a different sign-in method.', 'এই ইমেইলে অন্য সাইন-ইন পদ্ধতিতে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।');
      }
      setLoginError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    const cleanEmail = adminEmail.trim().toLowerCase();
    const isSuperAdmin = isSuperAdminEmail(cleanEmail);

    try {
      let signedUser: User | null = null;
      if (cleanEmail && adminPass) {
        try {
          const authRes = await authClient.signInEmail({ email: cleanEmail, password: adminPass });
          signedUser = authRes.user;
          if (signedUser) setSessionUser(signedUser);
        } catch (authErr: any) {
          throw authErr;
        }
      }

      const isVerified = await authApi.verifyAdminStatus();
      const profile = (await authApi.getProfile().catch(() => null)) as any;

      if (isSuperAdmin || isVerified || (profile as User)?.role === 'admin' || signedUser?.role === 'admin') {
        const adminUser: User = (profile as User) || signedUser || {
          id: sessionUser?.id || `admin_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
          name: sessionUser?.name || cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'admin',
          adminRoleName: 'Super Admin',
          permissions: ['*'],
          addresses: []
        };
        setAdminProfile(adminUser);
        const s = await adminApi.getStats().catch(() => null);
        setStats(s || { users: 0, orders: 0, products: 0, revenue: 0 });
        setIsLogin(true);
        showToast(t('Signed in to Admin Panel', 'অ্যাডমিন প্যানেলে সাইন-ইন সম্পন্ন হয়েছে'), 'success');
        refreshView();
      } else {
        await authClient.signOut();
        setSessionUser(null);
        throw new Error('This account does not have Admin privileges.');
      }
    } catch (err: any) {
      let msg = err?.message || t('Authorization failed. Admin credentials required.', 'অনুমোদন ব্যর্থ। অ্যাডমিন তথ্য প্রয়োজন।');
      if (err?.message?.toLowerCase().includes('invalid') || err?.message?.toLowerCase().includes('credential') || err?.message?.toLowerCase().includes('password')) {
        msg = t('Invalid email or password. Please verify your credentials.', 'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে তথ্য যাচাই করুন।');
      } else if (err?.message?.includes('Admin privileges')) {
        msg = t('This account does not have Admin privileges. Only the authorized administrator can access this panel.', 'এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই। কেবল অনুমোদিত অ্যাডমিনিস্ট্রেটর এই প্যানেলে প্রবেশ করতে পারবেন।');
      }
      setLoginError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLogin(false);
    setAdminProfile(null);
    setSessionUser(null);
    try {
      await authClient.signOut();
    } catch {}
    navigate('/');
  };

  const updateGlobalUsers = async (userId: string, data: any) => {
    try {
      await adminApi.updateUser(userId, data);
      setUsers(prev => {
        const next = prev.map(u => u.id === userId ? { ...u, ...data } : u);
        localStorage.setItem('elora-users', JSON.stringify(next));
        return next;
      });
      await refreshView();
    } catch (e) {
      showToast(t('User update failed', 'ব্যবহারকারী আপডেট ব্যর্থ হয়েছে'), 'error');
    }
  };

  const handleCreateSiteAdmin = async (adminData: {
    name: string;
    email: string;
    permissions: string[];
    permissionsLevel: Record<string, 'read' | 'full'>;
  }) => {
    try {
      const created = await adminApi.createSiteAdmin(adminData);
      if (created) {
        setUsers(prev => {
          const exists = prev.some(u => (u.email || '').toLowerCase() === adminData.email.toLowerCase());
          const next = exists 
            ? prev.map(u => (u.email || '').toLowerCase() === adminData.email.toLowerCase() ? { ...u, ...created } : u)
            : [...prev, created];
          localStorage.setItem('elora-users', JSON.stringify(next));
          return next;
        });
      }
      logAdminAction('Create', 'Role', adminData.name, `Created Site Admin with ${adminData.permissions.length} module permissions`);
      showToast(t(`Site Admin created for ${adminData.name}`, `${adminData.name}-এর জন্য সাইট অ্যাডমিন তৈরি হয়েছে`), 'success');
    } catch (err) {
      console.error('Error creating site admin:', err);
      showToast(t('Failed to create Site Admin account', 'সাইট অ্যাডমিন অ্যাকাউন্ট তৈরি করতে ব্যর্থ'), 'error');
    }
  };

  const handleRevokeAdmin = async (userId: string) => {
    try {
      const target = users.find(u => u.id === userId);
      await updateGlobalUsers(userId, {
        role: 'user',
        adminRoleId: undefined,
        adminRoleName: undefined,
        permissions: [],
        permissionsLevel: {}
      });
      logAdminAction('Role_Change', 'Role', target?.name || 'Admin', 'Revoked administrative authority');
      showToast(t(`Admin privileges revoked for ${target?.name || 'user'}`, `${target?.name || 'ব্যবহারকারী'}-এর অ্যাডমিন অনুমতি প্রত্যাহার করা হয়েছে`), 'info');
      if (simulatedAdminEmail && target?.email.toLowerCase() === simulatedAdminEmail.toLowerCase()) {
        setSimulatedAdminEmail(null);
      }
    } catch (err) {
      console.error('Error revoking admin:', err);
      showToast(t('Failed to revoke admin privileges', 'অ্যাডমিন অনুমতি প্রত্যাহার করতে ব্যর্থ'), 'error');
    }
  };

  const updateGlobalProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem('elora-products', JSON.stringify(updatedProducts));
  };

  const updateGlobalOrders = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
  };

  const handleBulkProductAction = async (action: 'approve' | 'reject' | 'trash') => {
    if (selectedProductIds.length === 0) return;
    setIsExecutingProductBulk(true);
    try {
      const updatedProducts = products.map(p => {
        if (!selectedProductIds.includes(p.id)) return p;
        if (action === 'approve') return { ...p, status: 'approved' as const, isDeleted: false };
        if (action === 'reject') return { ...p, status: 'rejected' as const };
        if (action === 'trash') return { ...p, isDeleted: true };
        return p;
      });
      updateGlobalProducts(updatedProducts);

      logAdminAction(
        action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Trash',
        'Product',
        `${selectedProductIds.length} Products`,
        `Bulk ${action} executed on ${selectedProductIds.length} items`
      );

      addNotification({
        title: t(`Bulk Products: ${action.toUpperCase()}`, `বাল্ক পণ্য: ${action === 'approve' ? 'অনুমোদন' : action === 'reject' ? 'বাতিল' : 'ট্র্যাশ'}`),
        message: t(`Successfully executed bulk ${action} on ${selectedProductIds.length} products.`, `${selectedProductIds.length}টি পণ্যে বাল্ক অ্যাকশন সম্পন্ন হয়েছে।`),
        type: 'inventory',
        actionView: action === 'trash' ? 'trash' : 'products'
      });

      showToast(t(`Bulk ${action} applied to ${selectedProductIds.length} products`, `${selectedProductIds.length}টি পণ্যে অ্যাকশন প্রয়োগ হয়েছে`), 'success');
      setSelectedProductIds([]);
      setBulkProductConfirmAction(null);
    } catch (err: any) {
      showToast(err.message || t('Failed to apply bulk product action', 'বাল্ক পণ্য অ্যাকশন ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsExecutingProductBulk(false);
    }
  };

  const handleBulkOrderAction = async (action: 'confirmed' | 'delivered' | 'cancelled' | 'trash') => {
    if (selectedOrderIds.length === 0) return;
    setIsExecutingOrderBulk(true);
    try {
      const updatedOrders = orders.map(o => {
        if (!selectedOrderIds.includes(o.id)) return o;
        if (action === 'trash') return { ...o, isDeleted: true };
        return { ...o, status: action as any };
      });
      updateGlobalOrders(updatedOrders);

      logAdminAction(
        'Status_Change',
        'Order',
        `${selectedOrderIds.length} Orders`,
        `Bulk status update to ${action}`
      );

      addNotification({
        title: t(`Bulk Orders: ${action.toUpperCase()}`, `বাল্ক অর্ডার: ${action}`),
        message: t(`Updated status of ${selectedOrderIds.length} orders to ${action}.`, `${selectedOrderIds.length}টি অর্ডারের অবস্থা আপডেট হয়েছে।`),
        type: 'order',
        actionView: 'orders'
      });

      showToast(t(`Updated ${selectedOrderIds.length} orders to ${action}`, `${selectedOrderIds.length}টি অর্ডারের অবস্থা আপডেট হয়েছে`), 'success');
      setSelectedOrderIds([]);
      setBulkOrderConfirmAction(null);
    } catch (err: any) {
      showToast(err.message || t('Failed to apply bulk order action', 'বাল্ক অর্ডার অ্যাকশন ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsExecutingOrderBulk(false);
    }
  };

  const handleConfirmAssignRole = async () => {
    if (!assigningRoleUser) return;
    try {
      const roleMapping: Record<string, { roleName: string; permissions: string[] }> = {
        super_admin: { roleName: 'Super Administrator', permissions: ['*'] },
        inventory_manager: { roleName: 'Inventory & Products Manager', permissions: ['overview', 'products', 'sellers', 'trash'] },
        order_manager: { roleName: 'Order & Fulfillment Specialist', permissions: ['overview', 'orders', 'notifications'] },
        marketing_manager: { roleName: 'Marketing & Promotions Lead', permissions: ['overview', 'coupons', 'ads', 'flash_sales', 'reviews'] },
        support_staff: { roleName: 'Customer Support Agent', permissions: ['overview', 'orders', 'reviews', 'users'] },
      };

      const selectedConfig = roleMapping[assigningRoleId] || roleMapping.inventory_manager;

      await updateGlobalUsers(assigningRoleUser.id, {
        role: 'admin',
        adminRoleId: assigningRoleId,
        adminRoleName: selectedConfig.roleName,
        permissions: selectedConfig.permissions,
      });

      logAdminAction(
        'Role_Change',
        'Customer',
        assigningRoleUser.name || 'User',
        `Assigned administrative role: ${selectedConfig.roleName}`
      );

      addNotification({
        title: t('Admin Role Assigned', 'অ্যাডমিন ভূমিকা নির্ধারিত হয়েছে'),
        message: t(`User ${assigningRoleUser.name || assigningRoleUser.email} has been assigned as ${selectedConfig.roleName}.`, `${assigningRoleUser.name || assigningRoleUser.email}-কে ${selectedConfig.roleName} ভূমিকা দেওয়া হয়েছে।`),
        type: 'customer',
        actionView: 'roles'
      });

      showToast(t(`Assigned ${selectedConfig.roleName} to ${assigningRoleUser.name || 'User'}`, `${assigningRoleUser.name || 'ব্যবহারকারী'}-কে ${selectedConfig.roleName} নির্ধারণ করা হয়েছে`), 'success');
      setAssigningRoleUser(null);
    } catch (e: any) {
      showToast(e.message || t('Failed to assign role', 'ভূমিকা নির্ধারণ করতে ব্যর্থ'), 'error');
    }
  };

  // User RBAC / Granular Access Check
  const effectiveAdminEmail = (simulatedAdminEmail || adminEmail || sessionUser?.email || '').toLowerCase();
  const currentAdminUser = (users || []).find(u => (u.email || '').toLowerCase() === effectiveAdminEmail);

  // Super Admin check:
  // Explicit Super Admin role designation or wildcard permissions, unless active in Site Admin simulation mode
  const isSuperAdmin = !simulatedAdminEmail && (
    currentAdminUser?.adminRoleName === 'Super Admin' ||
    currentAdminUser?.adminRoleName === 'Super Administrator' ||
    (currentAdminUser?.role === 'admin' && (currentAdminUser?.permissions?.includes('*') || !currentAdminUser?.permissions || currentAdminUser.permissions.length === 0))
  );

  const currentPermissions = isSuperAdmin ? ['*'] : (currentAdminUser?.permissions || []);
  const currentPermissionsLevel = currentAdminUser?.permissionsLevel || {};

  const isItemPermitted = (itemId: string): boolean => {
    if (isSuperAdmin) return true;
    // Roles & Permissions is strictly Super Admin only — never accessible or visible to Site Admins
    if (itemId === 'roles') return false;
    // For all other sections, must be explicitly granted in permissions array
    return Array.isArray(currentPermissions) && currentPermissions.includes(itemId);
  };

  const isSectionReadOnly = (itemId: string): boolean => {
    if (isSuperAdmin) return false;
    return currentPermissionsLevel[itemId] === 'read';
  };

  const ALL_SIDEBAR_NAV_ITEMS = [
    { id: 'overview', label: t('Dashboard', 'ড্যাশবোর্ড'), icon: <LayoutDashboard size={18} strokeWidth={1.8} /> },
    { id: 'analytics', label: t('Analytics & Reports', 'অ্যানালিটিক্স ও রিপোর্ট'), icon: <BarChart2 size={18} strokeWidth={1.8} /> },
    { id: 'sellers', label: t('Merchants', 'মার্চেন্টস'), icon: <Store size={18} strokeWidth={1.8} /> },
    { id: 'products', label: t('Products', 'পণ্যসমূহ'), icon: <Package size={18} strokeWidth={1.8} /> },
    { id: 'orders', label: t('Orders', 'অর্ডারসমূহ'), icon: <ShoppingCart size={18} strokeWidth={1.8} /> },
    { id: 'returns', label: t('Returns', 'রিটার্ন অনুরোধ'), icon: <RotateCcw size={18} strokeWidth={1.8} /> },
    { id: 'users', label: t('Customers', 'ক্রেতাবৃন্দ'), icon: <Users size={18} strokeWidth={1.8} /> },
    { id: 'roles', label: t('Roles & Permissions', 'ভূমিকা ও অনুমতি'), icon: <Shield size={18} strokeWidth={1.8} /> },
    { id: 'reviews', label: t('Reviews & Feedback', 'রিভিউ ও মতামত'), icon: <MessageSquare size={18} strokeWidth={1.8} /> },
    { id: 'coupons', label: t('Promotions', 'প্রোমোশন ও কুপন'), icon: <CreditCard size={18} strokeWidth={1.8} /> },
    { id: 'ads', label: t('Ads & Campaigns', 'বিজ্ঞাপন ও ক্যাম্পেইন'), icon: <Sparkles size={18} strokeWidth={1.8} /> },
    { id: 'flash_sales', label: t('Flash Sales', 'ফ্ল্যাশ সেল'), icon: <Zap size={18} strokeWidth={1.8} /> },
    { id: 'activity_log', label: t('Activity Log', 'কার্যকলাপ লগ'), icon: <History size={18} strokeWidth={1.8} /> },
    { id: 'notifications', label: t('Notifications', 'বিজ্ঞপ্তি'), icon: <Bell size={18} strokeWidth={1.8} /> },
    { id: 'settings', label: t('Store Settings', 'স্টোর সেটিংস'), icon: <Sliders size={18} strokeWidth={1.8} /> },
    { id: 'trash', label: t('Trash', 'ট্র্যাশ'), icon: <Trash2 size={18} strokeWidth={1.8} /> },
  ];

  // Auto-redirect if active view is unauthorized for current admin (safely declared at top level)
  useEffect(() => {
    if (!isLogin || isLoading) return;
    if (!isItemPermitted(activeView)) {
      const permitted = ALL_SIDEBAR_NAV_ITEMS.find(item => isItemPermitted(item.id));
      if (permitted) {
        setActiveView(permitted.id as any);
      }
    }
  }, [isLogin, isLoading, effectiveAdminEmail, isSuperAdmin, currentPermissions, activeView]);

  const lowStockCount = (products || []).filter(p => !p.isDeleted && p.status === 'approved' && (Number(p.stock) || 0) <= lowStockThreshold).length;
  const unreadNotificationsCount = (notifications || []).filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('Loading Admin Panel...', 'অ্যাডমিন প্যানেল লোড হচ্ছে...')}</p>
        </div>
      </div>
    );
  }

  if (!isLogin) {
    if (sessionUser) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 font-sans">
          <div className="absolute top-6 right-6 z-20">
            <LanguageSwitcher variant="dark" />
          </div>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-orange/10 rounded-full blur-[120px]" />
          </div>

          <div className="w-full max-w-md bg-[#16161d] border border-rose-500/30 rounded-[40px] p-8 sm:p-10 shadow-[0_0_80px_rgba(244,63,94,0.15)] relative z-10 text-center">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <ShieldAlert size={40} />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">{t('Access Restricted', 'প্রবেশাধিকার সংরক্ষিত')}</h1>
            <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mt-2">{t('Administrative Privileges Required', 'অ্যাডমিনিস্ট্রেটিভ অনুমতি প্রয়োজন')}</p>
            
            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl text-left space-y-2">
              <p className="text-[11px] text-gray-400">{t('Signed in as:', 'লগইন করা অ্যাকাউন্ট:')}</p>
              <p className="text-xs font-mono font-bold text-white break-all">{sessionUser.email}</p>
              <p className="text-[11px] text-gray-400 pt-1 leading-relaxed">
                {t('Your account is currently assigned the role', 'আপনার অ্যাকাউন্টে বর্তমানে')}{' '}
                <span className="text-amber-400 font-bold">{adminProfile?.role || 'user'}</span>{' '}
                {t('in the database. To access the admin panel, your profile must have', 'ভূমিকা নির্ধারিত আছে। অ্যাডমিন প্যানেলে প্রবেশ করতে ডাটাবেসে')}{' '}
                <code className="text-brand-orange font-mono">role: &quot;admin&quot;</code> {t('', 'থাকতে হবে।')}
              </p>
            </div>

            {authPermissionError && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-left">
                <p className="text-[10px] font-black uppercase text-rose-400">{t('Permission Details', 'অনুমতির বিবরণ')}</p>
                <p className="text-[11px] text-rose-300 mt-0.5">{authPermissionError.message}</p>
                {authPermissionError.details && (
                  <p className="text-[10px] font-mono text-zinc-400 mt-1 line-clamp-2">{authPermissionError.details}</p>
                )}
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  window.location.reload();
                }}
                className="w-full h-12 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>{t('Retry Permission Check', 'অনুমতি পুনরায় যাচাই করুন')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLogout()}
                className="w-full h-12 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                {t('Sign In With Another Account', 'অন্য অ্যাকাউন্ট দিয়ে সাইন-ইন করুন')}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer pt-2"
              >
                ← {t('Return to Storefront', 'স্টোরফ্রন্টে ফিরে যান')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 font-sans">
        <div className="absolute top-6 right-6 z-20">
          <LanguageSwitcher variant="dark" />
        </div>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="w-full max-w-md bg-[#16161d] border border-white/10 rounded-[40px] p-8 sm:p-10 shadow-[0_0_80px_rgba(248,86,6,0.15)] relative z-10">
          <div className="text-center mb-6">
            <div className="w-18 h-18 bg-brand-orange text-white rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-orange-500/25">
               <ShieldCheck size={36} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">{t('Admin Portal', 'অ্যাডমিন পোর্টাল')}</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1.5">{t('Administrator Authentication', 'অ্যাডমিনিস্ট্রেটর যাচাইকরণ')}</p>
          </div>

          {/* Quick 1-Click Access for Super Admins */}
          <div className="mb-5 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 text-center">
              {t('Quick Verified Super Admin Access', 'দ্রুত যাচাইকৃত সুপার অ্যাডমিন অ্যাক্সেস')}
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAdminAccess('abhimanyudey952@gmail.com')}
                className="w-full py-2.5 px-3.5 bg-white/5 hover:bg-brand-orange/20 border border-white/10 hover:border-brand-orange/50 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-brand-orange/20 text-brand-orange flex items-center justify-center font-black text-xs group-hover:scale-105 transition-transform">
                    AD
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-brand-orange transition-colors">Abhimanyu Dey</p>
                    <p className="text-[10px] font-mono text-gray-400">abhimanyudey952@gmail.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange bg-brand-orange/15 px-2 py-1 rounded-md border border-brand-orange/30">
                  {t('Enter →', 'প্রবেশ →')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickAdminAccess('digitalshoptm.admin@gmail.com')}
                className="w-full py-2.5 px-3.5 bg-white/5 hover:bg-brand-orange/20 border border-white/10 hover:border-brand-orange/50 rounded-xl flex items-center justify-between text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-xs group-hover:scale-105 transition-transform">
                    DS
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-brand-orange transition-colors">Digital Shop T.M Admin</p>
                    <p className="text-[10px] font-mono text-gray-400">digitalshoptm.admin@gmail.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-orange bg-brand-orange/15 px-2 py-1 rounded-md border border-brand-orange/30">
                  {t('Enter →', 'প্রবেশ →')}
                </span>
              </button>
            </div>
          </div>

          {/* Google Sign-in Option (Better Auth OAuth) */}
          {googleAuthEnabled && (
            <div className="mb-4">
              <button 
                type="button" 
                onClick={handleGoogleAdminLogin}
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{t('Sign In with Google', 'গুগল দিয়ে সাইন-ইন করুন')}</span>
              </button>
            </div>
          )}

          <div className="relative py-2 flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">
              {t('Or with credentials', 'অথবা ইমেইল-পাসওয়ার্ড দিয়ে')}
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('Email Address', 'ইমেইল ঠিকানা')}</label>
              <input 
                type="email"
                placeholder="abhimanyudey952@gmail.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className={`w-full bg-white/5 border ${loginError ? 'border-rose-500/50 bg-rose-500/5' : adminEmail ? 'border-emerald-500/30' : 'border-white/10'} rounded-xl h-12 px-4 text-white text-sm font-bold outline-none focus:border-brand-orange transition-all`}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t('Password', 'পাসওয়ার্ড')}</label>
                <button 
                  type="button" 
                  onClick={() => {
                    navigate('/login');
                  }}
                  className="text-[10px] text-brand-orange font-bold hover:underline cursor-pointer"
                >
                  {t('Create / Reset Password', 'পাসওয়ার্ড তৈরি / রিসেট')}
                </button>
              </div>
              <input 
                type="password"
                placeholder="••••••••"
                value={adminPass}
                onChange={(e) => setAdminPass(e.target.value)}
                className={`w-full bg-white/5 border ${loginError ? 'border-rose-500/50 bg-rose-500/5' : adminPass ? 'border-emerald-500/30' : 'border-white/10'} rounded-xl h-12 px-4 text-white text-sm font-bold outline-none focus:border-brand-orange transition-all`}
              />
            </div>

            {loginError && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-black text-rose-400 uppercase tracking-widest text-center"
              >
                {loginError}
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-brand-orange text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? t('Verifying...', 'যাচাই হচ্ছে...') : t('Sign In to Admin Panel', 'অ্যাডমিন প্যানেলে সাইন-ইন করুন')}
            </button>
          </form>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full mt-5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer text-center block"
          >
            ← {t('Return to Storefront', 'স্টোরফ্রন্টে ফিরে যান')}
          </button>
        </div>
      </div>
    );
  }

  // --- RENDERING SECTIONS ---
  
  const renderOverview = () => {
    const totalDelivered = orders?.filter(o => o.status === 'delivered')?.length || 0;
    const fulfillmentPercentage = orders?.length ? Math.round((totalDelivered / orders.length) * 100) : (orders?.length === 0 ? 100 : 0);

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const currentOrders = (orders || []).filter(o => (now - new Date(o.createdAt).getTime()) <= thirtyDaysMs);
    const priorOrders = (orders || []).filter(o => {
      const diff = now - new Date(o.createdAt).getTime();
      return diff > thirtyDaysMs && diff <= thirtyDaysMs * 2;
    });

    const isRevEligible = (st: string) => !['cancelled', 'returned', 'refunded'].includes((st || '').toLowerCase().trim());
    const currentRevenue = currentOrders.filter(o => isRevEligible(o.status)).reduce((s, o) => s + Math.round(Number(o.total) || 0), 0);
    const priorRevenue = priorOrders.filter(o => isRevEligible(o.status)).reduce((s, o) => s + Math.round(Number(o.total) || 0), 0);

    const calcTrend = (cur: number, prev: number) => {
      if (prev > 0) {
        const pct = Math.round(((cur - prev) / prev) * 100);
        return `${pct >= 0 ? '+' : ''}${pct}%`;
      }
      return cur > 0 ? '+100%' : '0%';
    };

    const revenueTrend = calcTrend(currentRevenue, priorRevenue);
    const userCount = stats.users || (users || []).length || 0;
    const activeShopCount = (users || []).filter(u => u.shop?.status === 'active').length || 0;

    const overviewStats = [
      { 
        label: t('Total Revenue', 'মোট আয়'), 
        value: `৳${formatBDT(stats.revenue || 0)}`, 
        subtext: t('Gross sales volume across all channels', 'সব চ্যানেলের মোট বিক্রয় পরিমাণ'),
        icon: <TrendingUp className="text-emerald-400" size={20} />, 
        trend: revenueTrend 
      },
      { 
        label: t('Active Users', 'সক্রিয় ব্যবহারকারী'), 
        value: userCount, 
        subtext: t('Registered customers & shopper profiles', 'নিবন্ধিত ক্রেতা ও শপার প্রোফাইল'),
        icon: <Users className="text-blue-400" size={20} />, 
        trend: `${userCount} ${t('registered', 'নিবন্ধিত')}` 
      },
      { 
        label: t('Merchant Stores', 'মার্চেন্ট স্টোর'), 
        value: activeShopCount, 
        subtext: t('Approved seller storefronts with active catalogs', 'সক্রিয় ক্যাটালগসহ অনুমোদিত সেলার স্টোর'),
        icon: <Store className="text-brand-orange" size={20} />, 
        trend: `${activeShopCount} ${t('active', 'সক্রিয়')}` 
      },
      { 
        label: t('Fulfillment Rate', 'ডেলিভারি হার'), 
        value: `${fulfillmentPercentage}%`, 
        subtext: t(`${totalDelivered} of ${orders?.length || 0} orders delivered`, `${orders?.length || 0}টি অর্ডারের মধ্যে ${totalDelivered}টি ডেলিভারি সম্পন্ন`),
        icon: <ShoppingCart className="text-purple-400" size={20} />, 
        trend: `${totalDelivered} ${t('delivered', 'ডেলিভারড')}` 
      },
    ];

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewStats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/[0.08] hover:border-white/20 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <span className="text-[10px] font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">{stat.trend}</span>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white tracking-tight mb-2">{stat.value}</p>
              <p className="text-[11px] text-gray-400 font-medium leading-tight">{stat.subtext}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Recent Transactions */}
           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                  <CreditCard className="text-brand-orange" size={22} /> {t('Recent Transactions', 'সাম্প্রতিক লেনদেন')}
                </h3>
                <button 
                  onClick={() => setActiveView('orders')}
                  className="text-xs font-bold text-brand-orange hover:text-orange-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {t('View All Orders →', 'সব অর্ডার দেখুন →')}
                </button>
              </div>

              <div className="space-y-3 flex-1">
                {(orders?.slice(0, 5) || []).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/15 transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 font-mono font-bold text-xs">
                        #
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase">{t('Order', 'অর্ডার')} #{order.id?.slice(0, 8)}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{order.date || t('Recent', 'সাম্প্রতিক')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white font-mono">৳{(order.total || 0).toLocaleString()}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-orange/20 text-brand-orange'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(!orders || orders.length === 0) && (
                   <div className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                     <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 mb-3">
                       <ShoppingCart size={22} className="text-gray-400" />
                     </div>
                     <p className="text-sm font-bold text-white mb-1">{t('No recent transactions yet', 'এখনো কোনো সাম্প্রতিক লেনদেন নেই')}</p>
                     <p className="text-xs text-gray-400 max-w-xs">
                       {t('Customer orders and checkout records will appear here as soon as orders are placed.', 'ক্রেতাদের অর্ডার সম্পন্ন হওয়ার সাথে সাথে লেনদেনের তথ্য এখানে দেখা যাবে।')}
                     </p>
                   </div>
                )}
              </div>
           </div>

           {/* Pending Approvals */}
           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                   <ShieldAlert className="text-brand-orange" size={22} /> {t('Pending Approvals', 'অপেক্ষমাণ অনুমোদন')}
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 font-mono">
                  {t('Needs Attention', 'মনোযোগ প্রয়োজন')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                 {[
                   { label: t('Merchants', 'মার্চেন্টস'), view: 'sellers', color: 'bg-blue-500', count: (users || []).filter(u => u.shop?.status === 'pending').length, desc: t('Storefront applications', 'স্টোরফ্রন্ট আবেদন') },
                   { label: t('Products', 'পণ্যসমূহ'), view: 'products', color: 'bg-amber-500', count: (products || []).filter(p => (p.status || 'pending') === 'pending').length, desc: t('Catalog listings awaiting review', 'পর্যালোচনার অপেক্ষায় থাকা পণ্য') },
                   { label: t('Users', 'ব্যবহারকারী'), view: 'users', color: 'bg-emerald-500', count: (users || []).filter(u => u.status === 'pending').length, desc: t('Unverified user profiles', 'অযাচাইকৃত ব্যবহারকারী প্রোফাইল') },
                   { label: t('Orders', 'অর্ডারসমূহ'), view: 'orders', color: 'bg-purple-500', count: (orders || []).filter(o => o.status === 'pending').length, desc: t('Orders awaiting verification', 'যাচাইয়ের অপেক্ষায় থাকা অর্ডার') },
                 ].map((action, i) => (
                   <button 
                    key={i} 
                    onClick={() => setActiveView(action.view as any)}
                    className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/[0.08] transition-all text-left relative overflow-hidden group flex flex-col justify-between cursor-pointer"
                   >
                     <div>
                       <div className="flex items-center justify-between mb-2">
                         <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{action.label}</span>
                         <span className={`w-2 h-2 rounded-full ${action.count > 0 ? 'bg-amber-400 animate-pulse' : 'bg-gray-600'}`} />
                       </div>
                       <p className="text-2xl font-black text-white tracking-tight mb-1">
                         {action.count} <span className="text-xs font-medium text-gray-400">{t('Pending', 'অপেক্ষমাণ')}</span>
                       </p>
                       <p className="text-[11px] text-gray-400">{action.desc}</p>
                     </div>
                     <div className="mt-3 text-[10px] font-bold text-brand-orange group-hover:underline flex items-center gap-1">
                       {t('Review', 'পর্যালোচনা করুন')} {action.label} →
                     </div>
                     <div className={`absolute bottom-0 right-0 w-24 h-24 ${action.color}/5 rounded-full blur-2xl group-hover:scale-125 transition-transform`} />
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Quick-Action Inline Control Deck (Group 1) */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Sparkles className="text-brand-orange" size={20} /> {t('Quick-Action Catalog & Storefront Deck', 'দ্রুত ক্যাটালগ ও স্টোরফ্রন্ট কন্ট্রোল')}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {t(
                  'Direct inline Edit and Delete controls across featured products, promotional banners, and active ad listings without navigating away.',
                  'অন্য পেজে না গিয়েই ফিচার্ড পণ্য, ব্যানার এবং সক্রিয় বিজ্ঞাপন এখান থেকেই সরাসরি এডিট ও ডিলিট করুন।'
                )}
              </p>
            </div>
          </div>

          {/* 1. Quick Products Deck */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Package size={14} className="text-brand-orange" /> {t('Recent & Featured Products', 'সাম্প্রতিক ও ফিচার্ড পণ্য')} ({products.filter(p => !p.isDeleted).slice(0, 4).length})
              </span>
              <button
                onClick={() => setActiveView('products')}
                className="text-xs font-bold text-brand-orange hover:text-orange-400 cursor-pointer"
              >
                {t('Go to Products →', 'পণ্য তালিকায় যান →')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.filter(p => !p.isDeleted).slice(0, 4).map(p => (
                <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between hover:border-brand-orange/40 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-black/40 shrink-0 border border-white/10" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate group-hover:text-brand-orange transition-colors">{p.name}</p>
                      <p className="text-[11px] font-mono text-brand-orange font-bold">৳{formatProductBDT(p.price)}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        p.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{p.status === 'approved' ? t('Approved', 'অনুমোদিত') : p.status === 'rejected' ? t('Rejected', 'বাতিল') : t('Pending', 'অপেক্ষমাণ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProduct(p)}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-brand-orange text-gray-300 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} /> {t('Edit', 'এডিট')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTrashProduct(p)}
                      className="flex-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> {t('Delete', 'ডিলিট')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Quick Store Banners Deck */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Image size={14} className="text-blue-400" /> {t('Active Store Banners', 'সক্রিয় স্টোর ব্যানার')} ({(banners || []).slice(0, 3).length})
              </span>
              <button
                onClick={() => setActiveView('settings')}
                className="text-xs font-bold text-brand-orange hover:text-orange-400 cursor-pointer"
              >
                {t('Go to Banner Settings →', 'ব্যানার সেটিংসে যান →')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(banners && banners.length > 0 ? banners.slice(0, 3) : [
                { id: 'b1', title: t('Eid Festive Super Spotlight', 'ঈদ উৎসব সুপার স্পটলাইট'), image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600', link: '/category/fashions' },
                { id: 'b2', title: t('Tech Gadget Mega Fest', 'টেক গ্যাজেট মেগা ফেস্ট'), image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600', link: '/category/electronics' }
              ]).map((b: any, bIdx: number) => (
                <div key={b.id || bIdx} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group">
                  <div className="h-24 bg-black/40 relative">
                    <img src={b.image} alt={b.title || 'Banner'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <p className="absolute bottom-2 left-3 right-3 text-xs font-bold text-white truncate">{b.title || t('Promotional Banner', 'প্রোমোশনাল ব্যানার')}</p>
                  </div>
                  <div className="p-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingBannerModal({ index: bIdx, title: b.title || '' })}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-brand-orange text-gray-300 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} /> {t('Edit', 'এডিট')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          title: t('Remove Banner', 'ব্যানার সরান'),
                          message: t(`Are you sure you want to remove banner "${b.title || 'Item'}" from the storefront?`, `আপনি কি নিশ্চিত যে স্টোরফ্রন্ট থেকে "${b.title || 'ব্যানার'}" সরাতে চান?`),
                          confirmLabel: t('Remove Banner', 'ব্যানার সরান'),
                          confirmVariant: 'danger',
                          onConfirm: () => {
                            setBanners(prev => prev.filter((_, i) => i !== bIdx));
                            showToast(t('Banner removed', 'ব্যানার সরানো হয়েছে'), 'success');
                          }
                        });
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> {t('Delete', 'ডিলিট')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Quick Sponsored Ad Listings Deck */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" /> {t('Active Ad Campaigns', 'সক্রিয় বিজ্ঞাপন ক্যাম্পেইন')} ({products.filter(p => p.isSponsored && p.adStatus !== 'ended').slice(0, 3).length})
              </span>
              <button
                onClick={() => setActiveView('ads')}
                className="text-xs font-bold text-brand-orange hover:text-orange-400 cursor-pointer"
              >
                {t('Go to Ads & Campaigns →', 'বিজ্ঞাপন ও ক্যাম্পেইনে যান →')}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {products.filter(p => p.isSponsored && p.adStatus !== 'ended').slice(0, 3).map(p => (
                <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col justify-between group">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <p className="text-xs font-bold text-white truncate">{p.name}</p>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 font-mono">
                      <span>{t('Budget:', 'বাজেট:')} ৳{p.adBudget || 500}</span>
                      <span>{t('Clicks:', 'ক্লিক:')} {p.adClicks || 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 mt-3 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        setAdminPromotingProduct(p);
                        setAdminAdBudgetInput(p.adBudget || 500);
                        setAdminAdStatusInput(p.adStatus === 'active');
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-amber-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} /> {t('Edit Budget', 'বাজেট এডিট')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEndingCampaignProduct(p)}
                      className="flex-1 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> {t('End Campaign', 'ক্যাম্পেইন শেষ করুন')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getSellerProductCount = (merchantUser: User) => {
    if (!merchantUser.shop) return 0;
    const storeName = (merchantUser.shop.name || '').trim().toLowerCase();
    return (products || []).filter(p => {
      if (p.isDeleted) return false;
      return p.seller?.id === merchantUser.id || 
             (p.seller?.name && p.seller.name.trim().toLowerCase() === storeName);
    }).length;
  };

  const getSellerProducts = (merchantUser: User) => {
    if (!merchantUser.shop) return [];
    const storeName = (merchantUser.shop.name || '').trim().toLowerCase();
    return (products || []).filter(p => {
      if (p.isDeleted) return false;
      return p.seller?.id === merchantUser.id || 
             (p.seller?.name && p.seller.name.trim().toLowerCase() === storeName);
    });
  };

  const handleSuspendMerchant = async (merchantUser: User) => {
    if (!merchantUser.shop) return;
    const updatedShop = {
      ...merchantUser.shop,
      status: 'suspended' as const
    };
    setUsers(prev => prev.map(u => u.id === merchantUser.id ? { ...u, shop: updatedShop } : u));
    if (selectedMerchantForDetails?.id === merchantUser.id) {
      setSelectedMerchantForDetails({ ...merchantUser, shop: updatedShop });
    }
    showToast(t(`Merchant "${merchantUser.shop.name}" suspended`, `মার্চেন্ট "${merchantUser.shop.name}" স্থগিত করা হয়েছে`), 'error');
    try {
      await adminApi.updateUser(merchantUser.id, { shop: updatedShop });
    } catch (e) {
      console.error('Failed to update merchant in database:', e);
    }
  };

  const handleReactivateMerchant = async (merchantUser: User) => {
    if (!merchantUser.shop) return;
    const updatedShop = {
      ...merchantUser.shop,
      status: 'active' as const,
      isVerified: true
    };
    setUsers(prev => prev.map(u => u.id === merchantUser.id ? { ...u, shop: updatedShop } : u));
    if (selectedMerchantForDetails?.id === merchantUser.id) {
      setSelectedMerchantForDetails({ ...merchantUser, shop: updatedShop });
    }
    showToast(t(`Merchant "${merchantUser.shop.name}" reactivated`, `মার্চেন্ট "${merchantUser.shop.name}" পুনরায় সক্রিয় করা হয়েছে`), 'success');
    try {
      await adminApi.updateUser(merchantUser.id, { shop: updatedShop });
    } catch (e) {
      console.error('Failed to update merchant in database:', e);
    }
  };

  const handleApproveMerchant = async (merchantUser: User) => {
    if (!merchantUser.shop) return;
    const updatedShop = {
      ...merchantUser.shop,
      status: 'active' as const,
      isVerified: true
    };
    setUsers(prev => prev.map(u => u.id === merchantUser.id ? { ...u, shop: updatedShop } : u));
    if (selectedMerchantForDetails?.id === merchantUser.id) {
      setSelectedMerchantForDetails({ ...merchantUser, shop: updatedShop });
    }
    showToast(t(`Merchant application for "${merchantUser.shop.name}" approved`, `"${merchantUser.shop.name}"-এর মার্চেন্ট আবেদন অনুমোদিত হয়েছে`), 'success');
    try {
      await adminApi.updateUser(merchantUser.id, { shop: updatedShop });
    } catch (e) {
      console.error('Failed to update merchant in database:', e);
    }
  };

  const handleRejectMerchant = async (merchantUser: User) => {
    if (!merchantUser.shop) return;
    const updatedShop = {
      ...merchantUser.shop,
      status: 'rejected' as const
    };
    setUsers(prev => prev.map(u => u.id === merchantUser.id ? { ...u, shop: updatedShop } : u));
    if (selectedMerchantForDetails?.id === merchantUser.id) {
      setSelectedMerchantForDetails({ ...merchantUser, shop: updatedShop });
    }
    showToast(t(`Merchant application for "${merchantUser.shop.name}" rejected`, `"${merchantUser.shop.name}"-এর মার্চেন্ট আবেদন বাতিল করা হয়েছে`), 'info');
    try {
      await adminApi.updateUser(merchantUser.id, { shop: updatedShop });
    } catch (e) {
      console.error('Failed to update merchant in database:', e);
    }
  };

  const promptSuspend = (merchantUser: User) => {
    const storeName = merchantUser.shop?.name || t('this merchant', 'এই মার্চেন্ট');
    setConfirmDialog({
      isOpen: true,
      title: t('Suspend Merchant Store', 'মার্চেন্ট স্টোর স্থগিত করুন'),
      message: t(
        `Are you sure you want to suspend "${storeName}"? This merchant will be moved to the Suspended tab and their products will be hidden from shoppers until reactivated.`,
        `আপনি কি নিশ্চিত যে "${storeName}" স্থগিত করতে চান? পুনরায় সক্রিয় না হওয়া পর্যন্ত তাদের পণ্য স্টোরে দেখা যাবে না।`
      ),
      confirmLabel: t('Yes, Suspend Store', 'হ্যাঁ, স্টোর স্থগিত করুন'),
      confirmVariant: 'danger',
      onConfirm: () => handleSuspendMerchant(merchantUser)
    });
  };

  const promptReactivate = (merchantUser: User) => {
    const storeName = merchantUser.shop?.name || t('this merchant', 'এই মার্চেন্ট');
    setConfirmDialog({
      isOpen: true,
      title: t('Reactivate Merchant Store', 'মার্চেন্ট স্টোর পুনরায় সক্রিয় করুন'),
      message: t(
        `Are you sure you want to reactivate "${storeName}"? This will restore their active seller status and return their store to the active marketplace.`,
        `আপনি কি নিশ্চিত যে "${storeName}" পুনরায় সক্রিয় করতে চান? এর মাধ্যমে তাদের সক্রিয় সেলার স্ট্যাটাস ফিরে আসবে।`
      ),
      confirmLabel: t('Yes, Reactivate Store', 'হ্যাঁ, পুনরায় সক্রিয় করুন'),
      confirmVariant: 'success',
      onConfirm: () => handleReactivateMerchant(merchantUser)
    });
  };

  const promptApprove = (merchantUser: User) => {
    const storeName = merchantUser.shop?.name || t('this merchant', 'এই মার্চেন্ট');
    setConfirmDialog({
      isOpen: true,
      title: t('Approve Merchant Store', 'মার্চেন্ট স্টোর অনুমোদন করুন'),
      message: t(
        `Are you sure you want to approve "${storeName}"? The merchant will be verified and authorized to list and sell products on the platform.`,
        `আপনি কি নিশ্চিত যে "${storeName}" অনুমোদন করতে চান? এর ফলে মার্চেন্ট পণ্য বিক্রি করার অনুমতি পাবেন।`
      ),
      confirmLabel: t('Approve Merchant', 'মার্চেন্ট অনুমোদন করুন'),
      confirmVariant: 'success',
      onConfirm: () => handleApproveMerchant(merchantUser)
    });
  };

  const promptReject = (merchantUser: User) => {
    const storeName = merchantUser.shop?.name || t('this merchant', 'এই মার্চেন্ট');
    setConfirmDialog({
      isOpen: true,
      title: t('Reject Merchant Application', 'মার্চেন্ট আবেদন বাতিল করুন'),
      message: t(
        `Are you sure you want to reject "${storeName}"? The application will be moved to the suspended list.`,
        `আপনি কি নিশ্চিত যে "${storeName}"-এর আবেদন বাতিল করতে চান?`
      ),
      confirmLabel: t('Reject Application', 'আবেদন বাতিল করুন'),
      confirmVariant: 'danger',
      onConfirm: () => handleRejectMerchant(merchantUser)
    });
  };

  const renderSellers = () => {
    const pendingCount = (users || []).filter(u => u?.shop && u.shop.status === 'pending').length;
    const activeCount = (users || []).filter(u => u?.shop && u.shop.status === 'active').length;
    const suspendedCount = (users || []).filter(u => u?.shop && (u.shop.status === 'suspended' || u.shop.status === 'rejected')).length;

    const normalizedSearch = globalSearchTerm.trim().toLowerCase();
    const sellersToShow = (Array.isArray(users) ? users : []).filter(u => {
      if (!u?.shop) return false;

      const shopStatus = u.shop.status || 'pending';
      let matchesStatus = false;
      if (sellerFilter === 'pending') {
        matchesStatus = shopStatus === 'pending';
      } else if (sellerFilter === 'active') {
        matchesStatus = shopStatus === 'active';
      } else if (sellerFilter === 'suspended') {
        matchesStatus = shopStatus === 'suspended' || shopStatus === 'rejected';
      }

      if (!matchesStatus) return false;

      if (!normalizedSearch) return true;

      const shopName = (u.shop.name || '').toLowerCase();
      const ownerName = (u.name || '').toLowerCase();
      const email = (u.shop.email || u.email || '').toLowerCase();
      const phone = (u.shop.contactNumber || u.phone || '').toLowerCase();
      const category = (u.shop.category || '').toLowerCase();
      const address = (u.shop.fullAddress || u.shop.division || u.shop.district || '').toLowerCase();

      return shopName.includes(normalizedSearch) || 
             ownerName.includes(normalizedSearch) || 
             email.includes(normalizedSearch) || 
             phone.includes(normalizedSearch) || 
             category.includes(normalizedSearch) ||
             address.includes(normalizedSearch);
    });

    const sellerTabs = [
      { id: 'pending' as const, label: 'Pending', count: pendingCount },
      { id: 'active' as const, label: 'Active Sellers', count: activeCount },
      { id: 'suspended' as const, label: 'Suspended', count: suspendedCount },
    ];

    return (
      <div className="space-y-8 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('Merchants & Sellers', 'মার্চেন্ট ও সেলারসমূহ')}</h2>
            <p className="text-xs text-gray-400 mt-1">{t('Review merchant store applications and manage seller accounts', 'মার্চেন্ট স্টোরের আবেদন পর্যালোচনা এবং সেলার অ্যাকাউন্ট পরিচালনা করুন')}</p>
          </div>
          <FilterTabGroup
            tabs={[
              { id: 'pending', label: t('Pending', 'অপেক্ষমাণ'), count: pendingCount, badgeVariant: 'amber' },
              { id: 'active', label: t('Active Sellers', 'সক্রিয় সেলার'), count: activeCount, badgeVariant: 'green' },
              { id: 'suspended', label: t('Suspended', 'স্থগিত'), count: suspendedCount, badgeVariant: 'rose' },
            ]}
            activeTab={sellerFilter}
            onChange={(id) => setSellerFilter(id as any)}
            ariaLabel={t('Merchant Status Filter', 'মার্চেন্ট স্ট্যাটাস ফিল্টার')}
          />
        </div>

        {isFetchingSellers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl animate-pulse flex flex-col space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/10 rounded-md w-3/4" />
                    <div className="h-3 bg-white/5 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/5 rounded w-16" />
                    <div className="h-3 bg-white/10 rounded w-20" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/5 rounded w-16" />
                    <div className="h-3 bg-white/10 rounded w-24" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-white/5 rounded w-16" />
                    <div className="h-3 bg-white/10 rounded w-20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 mt-auto">
                  <div className="h-10 bg-white/10 rounded-xl" />
                  <div className="h-10 bg-white/10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : (sellersToShow?.length === 0) ? (
          <div className="py-24 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 px-6">
            <Store className="mx-auto text-gray-500 mb-3" size={36} />
            <p className="text-sm font-bold text-white mb-1">
              {globalSearchTerm
                ? t(`No merchants found matching "${globalSearchTerm}"`, `"${globalSearchTerm}"-এর সাথে কোনো মার্চেন্ট পাওয়া যায়নি`)
                : sellerFilter === 'pending'
                ? t('No pending merchant applications', 'কোনো অপেক্ষমাণ মার্চেন্ট আবেদন নেই')
                : sellerFilter === 'active'
                ? t('No active merchants found', 'কোনো সক্রিয় মার্চেন্ট পাওয়া যায়নি')
                : t('No suspended merchants found', 'কোনো স্থগিত মার্চেন্ট পাওয়া যায়নি')}
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {globalSearchTerm
                ? t('Try searching with a different merchant name, category, or owner email.', 'অন্য মার্চেন্টের নাম, ক্যাটাগরি বা মালিকের ইমেইল দিয়ে খুঁজুন।')
                : sellerFilter === 'pending'
                ? t('When new sellers submit their store registration for verification, they will appear here for review.', 'নতুন সেলাররা যাচাইয়ের জন্য আবেদন করলে তা এখানে দেখা যাবে।')
                : sellerFilter === 'active'
                ? t('Approved sellers with active shops will be displayed here with their sales and performance.', 'অনুমোদিত সক্রিয় সেলাররা তাদের বিক্রয় ও পারফরম্যান্সসহ এখানে দেখা যাবে।')
                : t('Merchants that have been suspended or restricted will be listed here.', 'স্থগিত বা সীমাবদ্ধ মার্চেন্টদের তালিকা এখানে থাকবে।')}
            </p>
            {globalSearchTerm && (
              <button
                onClick={() => setGlobalSearchTerm('')}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {t('Clear Search', 'অনুসন্ধান মুছুন')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sellersToShow.map((u) => {
              const productCount = getSellerProductCount(u);
              return (
                <motion.div 
                  key={u.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/[0.04] border border-white/10 p-6 rounded-3xl hover:border-brand-orange/40 hover:shadow-2xl hover:shadow-orange-500/5 transition-all flex flex-col relative group"
                >
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Consistent Store Logo with generic store icon fallback */}
                      <div className="w-14 h-14 bg-white/10 rounded-2xl overflow-hidden p-0.5 border border-white/10 flex-shrink-0 relative flex items-center justify-center">
                        {u.shop?.logo ? (
                          <img
                            src={u.shop.logo}
                            alt={u.shop.name}
                            className="w-full h-full object-cover rounded-xl"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              (e.target as HTMLElement).nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-brand-orange/15 rounded-xl flex items-center justify-center text-brand-orange ${u.shop?.logo ? 'hidden' : ''}`}>
                          <Store size={24} />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-black text-white uppercase truncate">{u.shop?.name}</h4>
                          {u.shop?.isVerified && (
                            <span title={t('Verified Store', 'যাচাইকৃত স্টোর')} className="inline-flex items-center">
                              <CheckCircle2 size={14} className="text-emerald-400 flex-shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{t('Owner:', 'মালিক:')} {u.name || t('Merchant', 'মার্চেন্ট')}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                            <Star size={12} className="fill-amber-400" />
                            {(u.shop?.rating || 5.0).toFixed(1)}
                          </span>
                          <span className="text-white/20 text-xs">•</span>
                          <span className="text-[11px] text-gray-400 font-medium">
                            {productCount} {productCount === 1 ? t('Product', 'পণ্য') : t('Products', 'পণ্য')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {u.shop?.status === 'active' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {t('Active', 'সক্রিয়')}
                        </span>
                      )}
                      {u.shop?.status === 'pending' && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                          <Clock size={11} />
                          {t('Pending', 'অপেক্ষমাণ')}
                        </span>
                      )}
                      {(u.shop?.status === 'suspended' || u.shop?.status === 'rejected') && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <Ban size={11} />
                          {t('Suspended', 'স্থগিত')}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 mb-6 text-xs bg-black/20 p-3.5 rounded-2xl border border-white/5">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-400">{t('Category', 'ক্যাটাগরি')}</span>
                      <span className="text-white font-semibold">{u.shop?.category ? translateCategory(u.shop.category) : t('General', 'সাধারণ')}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-400">{t('Contact', 'যোগাযোগ')}</span>
                      <span className="text-white font-mono">{u.shop?.contactNumber || u.phone || t('N/A', 'প্রযোজ্য নয়')}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-400">{t('Sales / Revenue', 'বিক্রয় / আয়')}</span>
                      <span className="text-white font-semibold">
                        {u.shop?.totalSales || 0} {t('orders', 'অর্ডার')} • ৳{(u.shop?.revenue || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-400">{t('Joined', 'যোগদান')}</span>
                      <span className="text-gray-300 font-medium">
                        {new Date(u.shop?.joinedAt || u.joinedAt || Date.now()).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mt-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedMerchantForDetails(u)}
                      className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <Eye size={13} /> {t('View Details', 'বিস্তারিত')}
                    </button>

                    {u.shop?.status === 'active' && (
                      <button 
                        type="button"
                        onClick={() => promptSuspend(u)}
                        className="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-rose-900/30 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Ban size={13} /> {t('Suspend', 'স্থগিত')}
                      </button>
                    )}

                    {(u.shop?.status === 'suspended' || u.shop?.status === 'rejected') && (
                      <button 
                        type="button"
                        onClick={() => promptReactivate(u)}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <RefreshCw size={13} /> {t('Reactivate', 'সক্রিয় করুন')}
                      </button>
                    )}

                    {u.shop?.status === 'pending' && (
                      <button 
                        type="button"
                        onClick={() => promptApprove(u)}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-emerald-900/30 flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Check size={13} /> {t('Approve', 'অনুমোদন')}
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderProducts = () => {
    const rawList = Array.isArray(products) ? products : [];
    const activeProducts = rawList.filter(p => !p.isDeleted);
    
    // Dynamic counts for all statuses
    const pendingCount = activeProducts.filter(p => (p.status || 'pending') === 'pending').length;
    const approvedCount = activeProducts.filter(p => p.status === 'approved').length;
    const rejectedCount = activeProducts.filter(p => p.status === 'rejected').length;
    const lowStockCount = activeProducts.filter(p => p.status === 'approved' && (Number(p.stock) || 0) <= lowStockThreshold).length;

    // Filter by tab status and real-time search term
    const productsToShow = activeProducts.filter(p => {
      if (productFilter === 'low_stock') {
        if (p.status !== 'approved' || (Number(p.stock) || 0) > lowStockThreshold) return false;
      } else {
        const status = p.status || 'pending';
        if (status !== productFilter) return false;
      }

      const search = (globalSearchTerm || '').trim().toLowerCase();
      if (!search) return true;

      return (
        (p.name || '').toLowerCase().includes(search) ||
        (p.category || '').toLowerCase().includes(search) ||
        (p.description || '').toLowerCase().includes(search) ||
        (p.brand || '').toLowerCase().includes(search) ||
        (p.seller?.name || '').toLowerCase().includes(search) ||
        (p.id || '').toLowerCase().includes(search)
      );
    });

    return (
      <div className="space-y-6 text-left">
        {/* Top Header & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950/40 p-6 rounded-3xl border border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl text-brand-orange">
                <Package size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('Product Approvals & Inventory', 'পণ্য অনুমোদন ও ইনভেন্টরি')}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{t('Review vendor submissions, monitor stock levels, and govern live marketplace catalog', 'ভেন্ডরদের জমা দেওয়া পণ্য পর্যালোচনা, স্টক পর্যবেক্ষণ এবং ক্যাটালগ পরিচালনা করুন')}</p>
              </div>
            </div>

            {/* Status Navigation Tabs with Unified FilterTabGroup & Count Badges */}
            <div className="mt-4">
              <FilterTabGroup
                tabs={[
                  { id: 'pending', label: t('Pending', 'অপেক্ষমাণ'), count: pendingCount, badgeVariant: 'amber', icon: <Clock size={13} /> },
                  { id: 'approved', label: t('Approved Products', 'অনুমোদিত পণ্য'), count: approvedCount, badgeVariant: 'green', icon: <CheckCircle2 size={13} /> },
                  { id: 'rejected', label: t('Rejected Products', 'বাতিলকৃত পণ্য'), count: rejectedCount, badgeVariant: 'rose', icon: <Ban size={13} /> },
                  { id: 'low_stock', label: t('Low Stock Alerts', 'কম স্টক সতর্কতা'), count: lowStockCount, badgeVariant: 'rose', icon: <AlertTriangle size={13} /> },
                ]}
                activeTab={productFilter}
                onChange={(id) => setProductFilter(id as any)}
                ariaLabel={t('Product Status Filter', 'পণ্য স্ট্যাটাস ফিল্টার')}
              />
            </div>
          </div>

          {/* Right Action: Refresh & Add Product Button */}
          <div className="flex items-center gap-3 self-start lg:self-auto">
            <button
              onClick={() => refreshView()}
              disabled={isFetchingProducts}
              className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-2xl transition-all cursor-pointer disabled:opacity-50"
              title={t('Refresh Catalog Data', 'ক্যাটালগ রিফ্রেশ করুন')}
            >
              <RefreshCw size={18} className={isFetchingProducts ? 'animate-spin text-brand-orange' : ''} />
            </button>
            <button 
              onClick={() => setIsProductModalOpen(true)}
              className="px-6 py-3.5 bg-brand-orange text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Package size={16} />
              <span>{t('+ Add Product', '+ নতুন পণ্য যোগ')}</span>
            </button>
          </div>
        </div>

        {/* Bulk Selection Bar for Products */}
        <div className="flex items-center justify-between bg-zinc-950/40 border border-white/10 px-5 py-3 rounded-2xl flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (selectedProductIds.length === productsToShow.length && productsToShow.length > 0) {
                  setSelectedProductIds([]);
                } else {
                  setSelectedProductIds(productsToShow.map(p => p.id));
                }
              }}
              className="flex items-center gap-2.5 text-xs font-bold text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              {selectedProductIds.length === productsToShow.length && productsToShow.length > 0 ? (
                <CheckSquare size={17} className="text-brand-orange" />
              ) : (
                <Square size={17} className="text-gray-400" />
              )}
              <span>{t('Select All on Page', 'সবগুলো নির্বাচন করুন')} ({selectedProductIds.length}/{productsToShow.length})</span>
            </button>
          </div>

          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs text-brand-orange font-bold mr-1">{selectedProductIds.length} {t('item(s) selected', 'টি নির্বাচিত')}</span>
              <button
                type="button"
                onClick={() => setBulkProductConfirmAction('approve')}
                className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={13} /> {t('Bulk Approve', 'বাল্ক অনুমোদন')}
              </button>
              <button
                type="button"
                onClick={() => setBulkProductConfirmAction('reject')}
                className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X size={13} /> {t('Bulk Reject', 'বাল্ক বাতিল')}
              </button>
              <button
                type="button"
                onClick={() => setBulkProductConfirmAction('trash')}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/15 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} /> {t('Bulk Trash', 'বাল্ক ট্র্যাশ')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                className="text-xs text-gray-400 hover:text-white font-bold ml-1 cursor-pointer"
              >
                {t('Clear', 'মুছুন')}
              </button>
            </div>
          )}
        </div>

        {/* Real-time search feedback banner */}
        {globalSearchTerm && (
          <div className="flex items-center justify-between bg-brand-orange/10 border border-brand-orange/20 px-4 py-2.5 rounded-2xl text-xs text-brand-orange font-bold">
            <div className="flex items-center gap-2">
              <Search size={14} />
              <span>{t('Filtering by', 'ফিল্টার করা হচ্ছে')} &ldquo;<strong className="text-white">{globalSearchTerm}</strong>&rdquo; &mdash; {productsToShow.length} {t('product(s) found', 'টি পণ্য পাওয়া গেছে')}</span>
            </div>
            <button 
              onClick={() => setGlobalSearchTerm('')}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              {t('Clear Search', 'অনুসন্ধান মুছুন')}
            </button>
          </div>
        )}
        
        {/* Product Cards Grid with Shimmer Skeleton Loading */}
        {isFetchingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-zinc-950/60 border border-white/10 p-5 rounded-3xl animate-pulse space-y-4">
                <div className="aspect-[4/3] bg-white/5 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 bg-white/5 rounded-xl" />
                  <div className="h-12 bg-white/5 rounded-xl" />
                </div>
                <div className="h-12 bg-white/5 rounded-xl" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-9 bg-white/10 rounded-xl" />
                  <div className="h-9 bg-white/10 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : productsToShow.length === 0 ? (
          <div className="py-24 text-center bg-zinc-950/40 rounded-3xl border border-dashed border-white/10 p-8">
            <Package className="mx-auto text-gray-500 mb-3" size={40} />
            <h3 className="text-base font-black text-white uppercase tracking-tight mb-1">
              {t(`No ${productFilter} products found`, 'কোনো পণ্য পাওয়া যায়নি')}
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
              {globalSearchTerm 
                ? t(`No products matching "${globalSearchTerm}" exist in this list.`, `"${globalSearchTerm}"-এর সাথে কোনো পণ্য মেলেনি।`)
                : t('Items matching this filter will automatically appear in this section for review.', 'এই বিভাগে পণ্য যুক্ত হলে তা পর্যালোচনার জন্য এখানে দেখা যাবে।')}
            </p>
            {globalSearchTerm && (
              <button
                onClick={() => setGlobalSearchTerm('')}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {t('Clear Search Filter', 'অনুসন্ধান ফিল্টার মুছুন')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {productsToShow.map((p) => {
              const stockNum = Number(p.stock ?? 0);
              const isPendingZeroStock = (p.status === 'pending') && (!p.stock || stockNum === 0);

              return (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-950/70 border border-white/10 p-5 rounded-3xl hover:bg-zinc-900/80 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/70 hover:border-white/20 transition-all duration-300 flex flex-col h-full group relative overflow-hidden isolate"
                >
                  {/* Thumbnail Image Container with Quick Inspect Trigger */}
                  <div 
                    onClick={() => {
                      setInspectingProduct(p);
                      setInspectingImageIndex(0);
                    }}
                    className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 relative group/img cursor-pointer bg-black/40 border border-white/5"
                    title={t('Click to inspect high-resolution images & details', 'বিস্তারিত ও উচ্চ-রেজোলিউশন ছবি দেখতে ক্লিক করুন')}
                  >
                    <img 
                      src={p.image} 
                      className="w-full h-full object-cover group-hover/img:scale-108 transition-transform duration-500" 
                      alt={p.name}
                      onError={(e: any) => {
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Top Badges Bar: Category & Status */}
                    <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between gap-1.5 pointer-events-none">
                      <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider border border-white/15 shadow-md min-w-0 max-w-[55%]">
                        <Tag size={10} className="text-brand-orange shrink-0" />
                        <span className="truncate">{p.category ? translateCategory(p.category) : t('General', 'সাধারণ')}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {p.status === 'approved' ? (
                          <div className="bg-emerald-500/95 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider shadow-lg flex items-center gap-1 shrink-0">
                            <Check size={11} strokeWidth={3} /> {t('Approved', 'অনুমোদিত')}
                          </div>
                        ) : p.status === 'rejected' ? (
                          <div className="bg-rose-500/95 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider shadow-lg flex items-center gap-1 shrink-0">
                            <X size={11} strokeWidth={3} /> {t('Rejected', 'বাতিল')}
                          </div>
                        ) : (
                          <div className="bg-amber-500/95 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider shadow-lg flex items-center gap-1 shrink-0">
                            <Clock size={11} strokeWidth={3} /> {t('Pending', 'অপেক্ষমাণ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bulk Selection Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProductIds(prev => 
                          prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                        );
                      }}
                      className={`absolute bottom-3 left-3 z-20 px-2 py-1 rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer backdrop-blur-md text-[10px] font-bold uppercase tracking-wider ${
                        selectedProductIds.includes(p.id)
                          ? 'bg-brand-orange border-brand-orange text-white shadow-lg shadow-orange-500/30'
                          : 'bg-black/70 border-white/20 text-gray-300 hover:text-white hover:border-white/40'
                      }`}
                      title={t('Select product for bulk action', 'বাল্ক অ্যাকশনের জন্য নির্বাচন করুন')}
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                        selectedProductIds.includes(p.id) ? 'border-white bg-white text-brand-orange' : 'border-white/40 bg-transparent'
                      }`}>
                        {selectedProductIds.includes(p.id) && <Check size={10} strokeWidth={3} className="text-brand-orange" />}
                      </div>
                      <span>{t('Select', 'নির্বাচন')}</span>
                    </button>

                    {/* Low Stock Warning Badge */}
                    {p.status === 'approved' && stockNum <= lowStockThreshold && (
                      <div className="absolute top-10 right-2.5 bg-rose-500/95 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] font-black text-white uppercase tracking-wider shadow-lg flex items-center gap-1 shrink-0 z-10 animate-pulse">
                        <AlertTriangle size={10} /> {t('Low Stock', 'কম স্টক')} ({stockNum})
                      </div>
                    )}

                    {/* Hover Inspect Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[2px] pointer-events-none">
                      <ZoomIn size={16} />
                      <span>{t('Inspect Details', 'বিস্তারিত দেখুন')}</span>
                    </div>
                  </div>

                  {/* Product Metadata Details */}
                  <div className="space-y-3 mb-4 flex-1">
                    {/* Title with native hover tooltip */}
                    <div>
                      <h4 
                        onClick={() => {
                          setInspectingProduct(p);
                          setInspectingImageIndex(0);
                        }}
                        title={p.name}
                        className="text-sm font-black text-white uppercase line-clamp-2 min-h-[2.5rem] tracking-tight hover:text-brand-orange transition-colors cursor-pointer"
                      >
                        {p.name}
                      </h4>
                    </div>

                    {/* Seller Link & Submission Date */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium gap-2 pt-0.5">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSellerProfile(p.seller?.name || 'Digital Shop Official Store');
                        }}
                        className="text-brand-orange/90 hover:text-brand-orange hover:underline font-bold flex items-center gap-1.5 truncate cursor-pointer transition-colors"
                        title={t('Click to view full seller profile and performance', 'সেলার প্রোফাইল ও পারফরম্যান্স দেখতে ক্লিক করুন')}
                      >
                        <Store size={12} className="shrink-0" />
                        <span className="truncate">{p.seller?.name || t('Digital Shop Official Store', 'ডিজিটাল শপ অফিসিয়াল স্টোর')}</span>
                      </button>

                      <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1 font-mono">
                        <Calendar size={11} className="text-gray-400" />
                        {formatProductDate(p.createdAt)}
                      </span>
                    </div>
                    
                    {/* Price and Stock Stats Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{t('Selling Price', 'বিক্রয় মূল্য')}</p>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-sm font-black text-white font-mono">৳{formatProductBDT(p.price)}</span>
                          {p.originalPrice && Number(p.originalPrice) > Number(p.price) && (
                            <span className="text-[10px] text-gray-400 line-through font-mono">৳{formatProductBDT(p.originalPrice)}</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                          {isPendingZeroStock ? t('Stock (on approval)', 'স্টক (অনুমোদনে)') : t('Stock Level', 'স্টক পরিমাণ')}
                        </p>
                        <span className={`text-sm font-black font-mono ${
                          isPendingZeroStock 
                            ? 'text-amber-400' 
                            : stockNum <= lowStockThreshold 
                              ? 'text-rose-400' 
                              : 'text-emerald-400'
                        }`}>
                          {isPendingZeroStock ? t('0 (Pending)', '০ (অপেক্ষমাণ)') : stockNum.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Rejection Note alert box if rejected */}
                    {p.status === 'rejected' && p.rejectionReason && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-[11px] text-rose-300">
                        <div className="flex items-center gap-1 font-bold text-rose-300 text-[10px] uppercase tracking-wider mb-0.5">
                          <AlertCircle size={11} /> {t('Rejection Note', 'বাতিলের কারণ')}
                        </div>
                        <p className="line-clamp-2 leading-relaxed text-gray-300 font-sans">{p.rejectionReason}</p>
                      </div>
                    )}

                    {/* Product Summary */}
                    <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">{t('Description', 'বিবরণ')}</p>
                      <p className="text-xs text-gray-300 leading-relaxed font-normal line-clamp-2">
                        {p.description || t('No detailed description provided.', 'বিস্তারিত বিবরণ দেওয়া হয়নি।')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Buttons: Clear Color-Coded Scheme */}
                  <div className="mt-auto pt-3 space-y-2">
                    {/* Primary Decision Row */}
                    <div className="flex items-center gap-2">
                      {p.status === 'pending' ? (
                        <>
                          <button 
                            type="button"
                            onClick={() => handleApproveProduct(p)}
                            className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                            title={t('Approve and make live on storefront', 'অনুমোদন করে স্টোরে লাইভ করুন')}
                          >
                            <Check size={14} strokeWidth={3} />
                            <span>{t('Approve', 'অনুমোদন')}</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOpenRejectProduct(p)}
                            className="py-2.5 px-3 bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                            title={t('Reject product with reason', 'কারণ উল্লেখ করে বাতিল করুন')}
                          >
                            <X size={14} strokeWidth={3} />
                            <span>{t('Reject', 'বাতিল')}</span>
                          </button>
                        </>
                      ) : p.status === 'approved' ? (
                        <>
                          <button 
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="flex-1 py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                            title={t('Edit product information, price, and stock', 'পণ্যের তথ্য, মূল্য এবং স্টক এডিট করুন')}
                          >
                            <Edit2 size={13} />
                            <span>{t('Edit Product', 'পণ্য এডিট')}</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOpenRejectProduct(p)}
                            className="py-2.5 px-3 bg-rose-500/15 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                            title={t('Revoke approval and move to rejected', 'অনুমোদন প্রত্যাহার করে বাতিল তালিকায় নিন')}
                          >
                            <X size={14} strokeWidth={3} />
                            <span>{t('Reject', 'বাতিল')}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            type="button"
                            onClick={() => handleApproveProduct(p)}
                            className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                            title={p.status === 'rejected' ? t('Re-approve rejected product and restore to catalog', 'পুনরায় অনুমোদন করে ক্যাটালগে ফেরত নিন') : t('Approve product and publish to live catalog', 'অনুমোদন করে লাইভ ক্যাটালগে প্রকাশ করুন')}
                          >
                            <Check size={14} strokeWidth={3} />
                            <span>{p.status === 'rejected' ? t('Re-Approve', 'পুনরায় অনুমোদন') : t('Approve', 'অনুমোদন')}</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                            title={t('Edit product', 'পণ্য এডিট')}
                          >
                            <Edit2 size={13} />
                            <span>{t('Edit', 'এডিট')}</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Secondary Action Row: Edit (for pending), Inspect, and Trash */}
                    <div className="flex items-center gap-2">
                      {p.status === 'pending' && (
                        <button 
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                        >
                          <Edit2 size={12} />
                          <span>{t('Edit', 'এডিট')}</span>
                        </button>
                      )}

                      <button 
                        type="button"
                        onClick={() => {
                          setInspectingProduct(p);
                          setInspectingImageIndex(0);
                        }}
                        className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                        title={t('View high-resolution images and specifications', 'ছবি ও বিস্তারিত তথ্য দেখুন')}
                      >
                        <Eye size={12} />
                        <span>{t('Inspect', 'পরিদর্শন')}</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleTrashProduct(p)}
                        className="py-2 px-3 bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center active:scale-95"
                        title={t('Move to Trash Bin (recoverable)', 'ট্র্যাশে সরান (পুনরুদ্ধারযোগ্য)')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderOrders = () => {
    const rawOrders = orders || [];
    const activeOrders = rawOrders.filter(o => !o.isDeleted);
    const deletedOrders = rawOrders.filter(o => o.isDeleted === true);

    const orderList = orderShowDeleted ? deletedOrders : activeOrders;
    
    // Calculate counters based on active ledger
    const totalTransactions = activeOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingCount = activeOrders.filter(o => o.status?.toLowerCase() === 'pending').length;
    const activeTransitCount = activeOrders.filter(o => ['confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery'].includes(o.status?.toLowerCase() || '')).length;
    const deliveredCount = activeOrders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase() || '')).length;
    const cancelledCount = activeOrders.filter(o => ['cancelled', 'returned'].includes(o.status?.toLowerCase() || '')).length;
    const activeTotal = activeOrders.length;
    const fulfillmentRate = activeTotal > 0 ? Math.round((deliveredCount / activeTotal) * 100) : 0;

    // Filter Logic
    const filtered = orderList.filter(o => {
      // search filter
      const searchLower = orderSearchTerm.toLowerCase();
      const matchesSearch = 
        o.id.toLowerCase().includes(searchLower) ||
        (o.address?.fullName || '').toLowerCase().includes(searchLower) ||
        (o.address?.phone || '').includes(searchLower) ||
        (o.transactionId || '').toLowerCase().includes(searchLower) ||
        (o.senderNumber || '').includes(searchLower) ||
        (o.paymentMethod || '').toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // status filter
      if (orderStatusFilter === 'all') return true;
      if (orderStatusFilter === 'pending') return o.status?.toLowerCase() === 'pending';
      if (orderStatusFilter === 'confirmed') return o.status?.toLowerCase() === 'confirmed';
      if (orderStatusFilter === 'processing') return o.status?.toLowerCase() === 'processing' || o.status?.toLowerCase() === 'packed';
      if (orderStatusFilter === 'hub') return o.status?.toLowerCase() === 'hub' || o.status?.toLowerCase() === 'shipped';
      if (orderStatusFilter === 'delivery') return ['delivery', 'out-for-delivery', 'transit'].includes(o.status?.toLowerCase() || '');
      if (orderStatusFilter === 'delivered') return ['delivered', 'completed'].includes(o.status?.toLowerCase() || '');
      if (orderStatusFilter === 'rejected') return ['rejected', 'cancelled', 'returned'].includes(o.status?.toLowerCase() || '');
      
      return o.status?.toLowerCase() === orderStatusFilter.toLowerCase();
    });

    // Sort orders by most recent first by default
    filtered.sort((a, b) => {
      const getOrderTime = (o: any) => {
        const c = o.createdAt;
        if (!c) return 0;
        if (typeof c?.toDate === 'function') return c.toDate().getTime();
        if (c?.seconds !== undefined) return c.seconds * 1000;
        if (c?._seconds !== undefined) return c._seconds * 1000;
        if (typeof c === 'number') return c;
        if (typeof c === 'string' && /^\d+$/.test(c)) return Number(c);
        const parsed = new Date(c).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };
      return getOrderTime(b) - getOrderTime(a);
    });

    // Helper to get status color
    const getStatusStyle = (status: string = 'pending') => {
      const s = status.toLowerCase();
      if (s === 'pending') return { text: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', label: t('Pending', 'অপেক্ষমাণ') };
      if (['confirmed', 'processing', 'packed'].includes(s)) return { text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', label: t('Processing', 'প্রক্রিয়াধীন') };
      if (['shipped', 'out-for-delivery'].includes(s)) return { text: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', label: t('In Transit', 'পথে আছে') };
      if (['delivered', 'completed'].includes(s)) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: t('Delivered', 'ডেলিভারি সম্পন্ন') };
      return { text: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20', label: t('Cancelled', 'বাতিল') };
    };

    return (
      <div className="space-y-8 text-left">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('Orders & Fulfillment', 'অর্ডার এবং ডেলিভারি')}</h2>
            <p className="text-xs text-gray-400 mt-1">
              {t('Manage customer orders, track dispatching, and audit transactions', 'গ্রাহকের অর্ডার পরিচালনা করুন, ডেলিভারি ট্র্যাক করুন এবং লেনদেন যাচাই করুন')}
            </p>
          </div>
          <button 
            onClick={() => {
              setOrderSearchTerm('');
              setOrderStatusFilter('all');
              refreshView();
              showToast(t('Orders refreshed', 'অর্ডার রিফ্রেশ করা হয়েছে'), 'success');
            }}
            className="self-start md:self-auto px-4 py-2.5 bg-white/5 border border-white/10 text-xs font-bold text-gray-300 hover:bg-white/10 hover:text-white rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={14} /> {t('Refresh Orders', 'অর্ডার রিফ্রেশ করুন')}
          </button>
        </div>

        {/* Active vs Deleted History Segment Control */}
        <div className="flex gap-6 border-b border-white/10 pb-2">
          <button
            onClick={() => setOrderShowDeleted(false)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-all cursor-pointer ${!orderShowDeleted ? 'text-brand-orange' : 'text-gray-400 hover:text-white'}`}
          >
            {t(`Active Orders (${activeOrders.length})`, `সক্রিয় অর্ডার (${activeOrders.length})`)}
            {!orderShowDeleted && (
              <motion.div layoutId="orderActiveLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
            )}
          </button>
          <button
            onClick={() => setOrderShowDeleted(true)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider relative transition-all flex items-center gap-2 cursor-pointer ${orderShowDeleted ? 'text-rose-400' : 'text-gray-400 hover:text-white'}`}
          >
            {t(`Trash Bin (${deletedOrders.length})`, `ট্র্যাশ বিন (${deletedOrders.length})`)}
            {orderShowDeleted && (
              <motion.div layoutId="orderActiveLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />
            )}
          </button>
        </div>

        {/* Counter KPI Hud Panel */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: t('Total Orders', 'মোট অর্ডার'), value: activeOrders.length, desc: t('Active registered orders', 'সক্রিয় নিবন্ধিত অর্ডার'), icon: <ShoppingCart size={16} className="text-blue-400" /> },
            { label: t('Gross Revenue', 'মোট আয়'), value: `৳${formatBDT(totalTransactions)}`, desc: t('Total sales value', 'মোট বিক্রয় মূল্য'), icon: <DollarSign size={16} className="text-emerald-400" /> },
            { label: t('Pending Orders', 'অপেক্ষমাণ অর্ডার'), value: pendingCount, desc: t('Awaiting confirmation', 'নিশ্চিতকরণের অপেক্ষায়'), icon: <Clock size={16} className="text-amber-400" /> },
            { label: t('In Transit', 'পথে আছে'), value: activeTransitCount, desc: t('Dispatched with courier', 'কুরিয়ারে পাঠানো হয়েছে'), icon: <Truck size={16} className="text-purple-400" /> },
            { label: t('Fulfillment Rate', 'সম্পন্ন করার হার'), value: `${fulfillmentRate}%`, desc: t(`${deliveredCount} of ${activeTotal} delivered`, `${activeTotal}টির মধ্যে ${deliveredCount}টি ডেলিভারি হয়েছে`), icon: <ShieldCheck size={16} className="text-emerald-400" /> }
          ].map((hud, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{hud.label}</span>
                <span className="p-1.5 bg-white/5 rounded-lg border border-white/10">{hud.icon}</span>
              </div>
              <p className="text-xl font-black text-white">{hud.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{hud.desc}</p>
            </div>
          ))}
        </div>

        {/* Search and Advanced Filters */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder={t('Search Order ID, Customer Name, Phone, or bKash TrxID...', 'অর্ডার আইডি, গ্রাহকের নাম, ফোন বা বিকাশ TrxID দিয়ে খুঁজুন...')}
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange transition-all"
              />
              {orderSearchTerm && (
                <button 
                  onClick={() => setOrderSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Filter Toggle Pills with Unified FilterTabGroup */}
            <FilterTabGroup
              tabs={[
                { id: 'all', label: t('All Orders', 'সব অর্ডার'), count: activeOrders.length, badgeVariant: 'grey' },
                { id: 'pending', label: t('Pending', 'অপেক্ষমাণ'), count: activeOrders.filter(o => o.status === 'pending').length, badgeVariant: 'amber' },
                { id: 'confirmed', label: t('Confirmed', 'নিশ্চিত'), count: activeOrders.filter(o => o.status === 'confirmed').length, badgeVariant: 'blue' },
                { id: 'processing', label: t('Processing', 'প্রক্রিয়াধীন'), count: activeOrders.filter(o => ['processing', 'packed'].includes(o.status || '')).length, badgeVariant: 'amber' },
                { id: 'hub', label: t('Hub', 'হাব'), count: activeOrders.filter(o => ['hub', 'shipped'].includes(o.status || '')).length, badgeVariant: 'blue' },
                { id: 'delivery', label: t('Delivery', 'ডেলিভারি'), count: activeOrders.filter(o => ['delivery', 'out-for-delivery', 'transit'].includes(o.status || '')).length, badgeVariant: 'amber' },
                { id: 'delivered', label: t('Delivered', 'ডেলিভার্ড'), count: deliveredCount, badgeVariant: 'green' },
                { id: 'rejected', label: t('Rejected', 'বাতিল/প্রত্যাখ্যাত'), count: activeOrders.filter(o => ['rejected', 'cancelled'].includes(o.status || '')).length, badgeVariant: 'rose' },
              ]}
              activeTab={orderStatusFilter}
              onChange={(id) => setOrderStatusFilter(id)}
              ariaLabel={t('Order Status Filter', 'অর্ডার স্ট্যাটাস ফিল্টার')}
            />
          </div>
        </div>

        {/* Bulk Action Bar for Orders */}
        {selectedOrderIds.length > 0 && (
          <div className="flex items-center justify-between bg-zinc-950/40 border border-white/10 px-5 py-3 rounded-2xl flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
              <span className="text-xs text-brand-orange font-bold">{t(`${selectedOrderIds.length} order(s) selected`, `${selectedOrderIds.length}টি অর্ডার নির্বাচিত`)}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setBulkOrderConfirmAction('confirmed')}
                className="px-3.5 py-1.5 bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white border border-blue-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check size={13} /> {t('Confirm Selected', 'নির্বাচিত নিশ্চিত করুন')}
              </button>
              <button
                type="button"
                onClick={() => setBulkOrderConfirmAction('delivered')}
                className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={13} /> {t('Mark Delivered', 'ডেলিভার্ড চিহ্নিত করুন')}
              </button>
              <button
                type="button"
                onClick={() => setBulkOrderConfirmAction('cancelled')}
                className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X size={13} /> {t('Cancel Selected', 'নির্বাচিত বাতিল করুন')}
              </button>
              <button
                type="button"
                onClick={() => setBulkOrderConfirmAction('trash')}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/15 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} /> {t('Trash Selected', 'ট্র্যাশে পাঠান')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="text-xs text-gray-400 hover:text-white font-bold ml-1 cursor-pointer"
              >
                {t('Clear', 'মুছুন')}
              </button>
            </div>
          </div>
        )}

        {/* Select all bar on mobile */}
        <div className="md:hidden flex items-center justify-between bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => {
              if (selectedOrderIds.length === filtered.length && filtered.length > 0) {
                setSelectedOrderIds([]);
              } else {
                setSelectedOrderIds(filtered.map(o => o.id));
              }
            }}
            className="flex items-center gap-2 text-gray-300 font-bold"
          >
            {selectedOrderIds.length === filtered.length && filtered.length > 0 ? (
              <CheckSquare size={16} className="text-brand-orange" />
            ) : (
              <Square size={16} className="text-gray-400" />
            )}
            <span>{t(`Select All (${filtered.length})`, `সব নির্বাচন করুন (${filtered.length})`)}</span>
          </button>
          <span className="text-[10px] text-gray-400 font-mono">{t(`${filtered.length} total`, `মোট ${filtered.length}টি`)}</span>
        </div>

        {/* Mobile Stacked Orders Cards (< 768px) */}
        <div className="md:hidden space-y-3.5">
          {filtered.length === 0 ? (
            <div className="text-center py-14 px-4 rounded-2xl border border-white/10 bg-white/5">
              <ShoppingCart className="mx-auto text-gray-500 mb-2" size={28} />
              <p className="text-sm font-bold text-white mb-1">{t('No matching orders found', 'কোনো মিল থাকা অর্ডার পাওয়া যায়নি')}</p>
              <p className="text-xs text-gray-400">{t('Try adjusting your search criteria or filter options.', 'আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে চেষ্টা করুন।')}</p>
            </div>
          ) : (
            filtered.map((o) => {
              const itemsCount = o.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
              const statusInfo = getStatusStyle(o.status);

              return (
                <div key={o.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderIds(prev => 
                            prev.includes(o.id) ? prev.filter(id => id !== o.id) : [...prev, o.id]
                          );
                        }}
                        className="text-gray-400 hover:text-white cursor-pointer shrink-0"
                      >
                        {selectedOrderIds.includes(o.id) ? (
                          <CheckSquare size={18} className="text-brand-orange" />
                        ) : (
                          <Square size={18} className="text-gray-500" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewingOrder(o)}
                        className="text-xs font-bold text-white font-mono hover:text-brand-orange transition-colors flex items-center gap-1 truncate"
                      >
                        <span>#{o.id.slice(0, 8)}</span>
                        <Eye size={12} className="text-brand-orange shrink-0" />
                      </button>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border inline-flex items-center gap-1.5 shrink-0 ${statusInfo.bg} ${statusInfo.text}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {getOrderStatusLabel(o.status || 'pending')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-y border-white/5 py-2.5">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">{t('Customer', 'গ্রাহক')}</p>
                      <p className="font-bold text-white truncate">{o.address?.fullName || t('Customer', 'গ্রাহক')}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{o.address?.phone || t('No phone', 'ফোন নেই')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-gray-400">{t(`Amount (${itemsCount} items)`, `পরিমাণ (${itemsCount}টি পণ্য)`)}</p>
                      <p className="font-bold text-emerald-400 font-mono text-sm">৳{formatBDT(o.total)}</p>
                      <p className="text-[9px] text-gray-400 font-mono">{formatOrderDate(o.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${o.paymentMethod?.toLowerCase().includes('bkash') || o.paymentMethod?.toLowerCase().includes('nagad') ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                      <span className="font-medium truncate">{o.paymentMethod || t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি')}</span>
                      {o.transactionId && (
                        <span className="text-[9px] font-mono text-brand-orange font-bold truncate">Trx: {o.transactionId}</span>
                      )}
                    </div>
                  </div>

                  {o.cancellationRequested && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="text-[10px] font-black uppercase text-rose-400 font-mono">⚠️ {t('Customer Requested Cancellation', 'গ্রাহক অর্ডার বাতিলের অনুরোধ করেছেন')}</span>
                        <p className="text-[11px] text-gray-300 truncate">{o.cancellationReason || t('No reason provided', 'কোনো কারণ উল্লেখ করা হয়নি')}</p>
                      </div>
                      <button
                        onClick={async () => {
                          await adminApi.updateOrderStatus(o.id, 'cancelled');
                          showToast(t('Order cancellation approved', 'অর্ডার বাতিল অনুমোদিত হয়েছে'), 'success');
                          refreshView();
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold uppercase shrink-0 cursor-pointer"
                      >
                        {t('Approve Cancel', 'বাতিল অনুমোদন')}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {/* Quick advance */}
                      {!orderShowDeleted && o.status?.toLowerCase() === 'pending' && (
                        <button 
                          onClick={async () => {
                            await adminApi.updateOrderStatus(o.id, 'confirmed');
                            showToast(t('Order confirmed', 'অর্ডার নিশ্চিত করা হয়েছে'), 'success');
                            refreshView();
                          }}
                          className="px-2.5 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold shrink-0"
                        >
                          {t('Confirm', 'নিশ্চিত করুন')}
                        </button>
                      )}
                      {!orderShowDeleted && o.status?.toLowerCase() === 'confirmed' && (
                        <button 
                          onClick={async () => {
                            await adminApi.updateOrderStatus(o.id, 'processing');
                            showToast(t('Order marked as processing', 'অর্ডার প্রক্রিয়াধীন চিহ্নিত হয়েছে'), 'success');
                            refreshView();
                          }}
                          className="px-2.5 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-bold shrink-0"
                        >
                          {t('Process', 'প্রক্রিয়া')}
                        </button>
                      )}
                      {!orderShowDeleted && o.status?.toLowerCase() === 'processing' && (
                        <button 
                          onClick={async () => {
                            await adminApi.updateOrderStatus(o.id, 'shipped');
                            showToast(t('Order marked as shipped', 'অর্ডার শিপড চিহ্নিত হয়েছে'), 'success');
                            refreshView();
                          }}
                          className="px-2.5 py-1.5 bg-pink-500/20 text-pink-400 rounded-lg text-xs font-bold shrink-0"
                        >
                          {t('Ship', 'পাঠান')}
                        </button>
                      )}
                      {!orderShowDeleted && o.status?.toLowerCase() === 'shipped' && (
                        <button 
                          onClick={async () => {
                            await adminApi.updateOrderStatus(o.id, 'delivered');
                            showToast(t('Order delivered successfully', 'অর্ডার সফলভাবে ডেলিভারি হয়েছে'), 'success');
                            refreshView();
                          }}
                          className="px-2.5 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold shrink-0"
                        >
                          {t('Deliver', 'ডেলিভারি')}
                        </button>
                      )}

                      {/* Select status on mobile */}
                      {!orderShowDeleted && (
                        <select 
                          value={o.status?.toLowerCase() || 'pending'}
                          onChange={async (e) => {
                            const newStat = e.target.value;
                            await adminApi.updateOrderStatus(o.id, newStat);
                            showToast(t(`Order status changed to ${newStat}`, `অর্ডারের অবস্থা পরিবর্তন করা হয়েছে: ${getOrderStatusLabel(newStat)}`), 'success');
                            refreshView();
                          }}
                          className="bg-[#12121a] border border-white/15 text-gray-200 rounded-lg text-xs p-1.5 font-medium flex-1 min-w-0"
                        >
                          <option value="pending">{t('Pending', 'অপেক্ষমাণ')}</option>
                          <option value="confirmed">{t('Confirmed', 'নিশ্চিত')}</option>
                          <option value="processing">{t('Processing', 'প্রক্রিয়াধীন')}</option>
                          <option value="packed">{t('Packed', 'প্যাক করা হয়েছে')}</option>
                          <option value="shipped">{t('Shipped', 'শিপড')}</option>
                          <option value="out-for-delivery">{t('Out for Delivery', 'ডেলিভারির পথে')}</option>
                          <option value="delivered">{t('Delivered', 'ডেলিভারি সম্পন্ন')}</option>
                          <option value="cancelled">{t('Cancelled', 'বাতিল')}</option>
                          <option value="returned">{t('Returned', 'ফেরত')}</option>
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {o.items && o.items[0] && (
                        <button
                          type="button"
                          onClick={() => {
                            const match = products.find(p => p.id === o.items[0].id || p.name === o.items[0].name);
                            if (match) {
                              handleOpenEditProduct(match);
                            } else {
                              navigate(`/search?q=${encodeURIComponent(o.items[0].name)}`);
                            }
                          }}
                          className="p-2 bg-white/5 hover:bg-brand-orange border border-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-bold"
                          title={t('View Product in Order', 'অর্ডারের পণ্য দেখুন')}
                        >
                          <Package size={14} className="text-brand-orange" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setActiveView('notifications');
                          showToast(t(`Chat thread opened for Order #${o.id.slice(0, 8)}`, `অর্ডার #${o.id.slice(0, 8)}-এর চ্যাট থ্রেড খোলা হয়েছে`), 'info');
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-blue-400 rounded-lg text-xs font-bold"
                        title={t('Customer Chat', 'গ্রাহক চ্যাট')}
                      >
                        <MessageSquare size={14} />
                      </button>

                      <button
                        onClick={() => setViewingOrder(o)}
                        className="p-2 bg-white/5 border border-white/10 text-gray-300 hover:text-white rounded-lg text-xs font-bold"
                        title={t('View Order Details', 'অর্ডারের বিস্তারিত দেখুন')}
                      >
                        <Eye size={14} />
                      </button>

                      {orderShowDeleted ? (
                        <>
                          <button 
                            onClick={async () => {
                              await adminApi.restoreOrder(o.id);
                              showToast(t('Order restored successfully', 'অর্ডার সফলভাবে পুনরুদ্ধার হয়েছে'), 'success');
                              refreshView();
                            }}
                            className="px-2.5 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold"
                          >
                            {t('Restore', 'পুনরুদ্ধার')}
                          </button>
                          <button 
                            onClick={() => {
                              setPendingConfirm({
                                message: t('Permanently delete this order?', 'স্থায়ীভাবে এই অর্ডারটি মুছে ফেলবেন?'),
                                destructive: true,
                                onConfirm: async () => {
                                  await adminApi.deleteOrder(o.id, true);
                                  showToast(t('Order permanently deleted', 'অর্ডার স্থায়ীভাবে মুছে ফেলা হয়েছে'), 'error');
                                  refreshView();
                                }
                              });
                            }}
                            className="p-2 bg-rose-600/20 text-rose-400 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => {
                            setPendingConfirm({
                              message: t('Move this order to Trash?', 'এই অর্ডারটি ট্র্যাশে পাঠাবেন?'),
                              destructive: true,
                              onConfirm: async () => {
                                await adminApi.deleteOrder(o.id, false);
                                showToast(t('Order moved to Trash', 'অর্ডার ট্র্যাশে পাঠানো হয়েছে'), 'info');
                                refreshView();
                              }
                            });
                          }}
                          className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"
                          title={t('Move to Trash', 'ট্র্যাশে পাঠান')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Orders Table (Desktop / Tablet >= 768px) */}
        <div className="hidden md:block overflow-x-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="p-5 pl-6 w-12">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedOrderIds.length === filtered.length && filtered.length > 0) {
                        setSelectedOrderIds([]);
                      } else {
                        setSelectedOrderIds(filtered.map(o => o.id));
                      }
                    }}
                    className="text-gray-400 hover:text-white cursor-pointer"
                    title={t('Select all orders', 'সব অর্ডার নির্বাচন করুন')}
                  >
                    {selectedOrderIds.length === filtered.length && filtered.length > 0 ? (
                      <CheckSquare size={16} className="text-brand-orange" />
                    ) : (
                      <Square size={16} className="text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Order ID', 'অর্ডার আইডি')}</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Customer', 'গ্রাহক')}</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Amount', 'পরিমাণ')}</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Payment Method', 'পেমেন্ট পদ্ধতি')}</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Status', 'অবস্থা')}</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-wider pr-6 text-right">{t('Actions', 'অ্যাকশন')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <ShoppingCart className="mx-auto text-gray-500 mb-2" size={28} />
                    <p className="text-sm font-bold text-white mb-1">
                      {t('No matching orders found', 'কোনো মিল থাকা অর্ডার পাওয়া যায়নি')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('Try adjusting your search criteria or filter options.', 'আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে চেষ্টা করুন।')}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const itemsCount = o.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
                  const statusInfo = getStatusStyle(o.status);

                  return (
                    <tr 
                      key={o.id} 
                      className="border-b border-white/5 last:border-none hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Checkbox Column */}
                      <td className="p-5 pl-6 w-12">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderIds(prev => 
                              prev.includes(o.id) ? prev.filter(id => id !== o.id) : [...prev, o.id]
                            );
                          }}
                          className="text-gray-400 hover:text-white cursor-pointer"
                        >
                          {selectedOrderIds.includes(o.id) ? (
                            <CheckSquare size={16} className="text-brand-orange" />
                          ) : (
                            <Square size={16} className="text-gray-500 hover:text-gray-300" />
                          )}
                        </button>
                      </td>

                      {/* Order Info */}
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingOrder(o)}
                            className="text-xs font-bold text-white font-mono tracking-wider hover:text-brand-orange transition-colors cursor-pointer text-left flex items-center gap-1.5 group/id"
                            title={t('View full order breakdown', 'সম্পূর্ণ অর্ডার বিস্তারিত দেখুন')}
                          >
                            <span className="group-hover/id:underline">#{o.id.slice(0, 8)}</span>
                            <Eye size={12} className="opacity-50 group-hover/id:opacity-100 text-brand-orange transition-opacity" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                          {formatOrderDate(o.createdAt)}
                        </p>
                      </td>

                      {/* Recipient Full Name */}
                      <td className="p-5">
                        <div className="max-w-[180px]">
                          <p className="text-xs font-bold text-white truncate">
                            {o.address?.fullName || t('Customer', 'গ্রাহক')}
                          </p>
                          <div className="flex items-center gap-1.5 text-gray-400 text-[10px] mt-0.5 font-mono">
                            <Phone size={10} className="text-gray-500" />
                            <span>{o.address?.phone || t('No phone', 'ফোন নেই')}</span>
                          </div>
                        </div>
                      </td>

                      {/* Financial Value Details */}
                      <td className="p-5">
                        <p className="text-xs font-bold text-white font-mono">
                          ৳{formatBDT(o.total)}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {itemsCount} {itemsCount === 1 ? t('item', 'টি পণ্য') : t('items', 'টি পণ্য')}
                        </p>
                      </td>

                      {/* Payment Mode Verification */}
                      <td className="p-5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${o.paymentMethod?.toLowerCase().includes('bkash') || o.paymentMethod?.toLowerCase().includes('nagad') ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                            <span className="text-xs font-semibold text-white uppercase">
                              {o.paymentMethod || t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি')}
                            </span>
                          </div>
                          {o.transactionId ? (
                            <p className="text-[9px] font-mono text-brand-orange font-bold mt-1 bg-brand-orange/10 border border-brand-orange/20 px-1.5 py-0.5 rounded inline-block max-w-[140px] truncate" title={o.transactionId}>
                              TrxID: {o.transactionId}
                            </p>
                          ) : (
                            <span className="text-[10px] text-gray-400">{t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি')}</span>
                          )}
                        </div>
                      </td>

                      {/* Unified Status Badge */}
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border inline-flex items-center gap-1.5 ${statusInfo.bg} ${statusInfo.text}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {getOrderStatusLabel(o.status || 'pending')}
                        </span>
                      </td>

                      {/* Calibrated Actions Dropdown & Modal trigger */}
                      <td className="p-5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {orderShowDeleted ? (
                            <>
                              {/* Restore Order */}
                              <button 
                                onClick={async () => {
                                  await adminApi.restoreOrder(o.id);
                                  showToast(t('Order restored successfully', 'অর্ডার সফলভাবে পুনরুদ্ধার হয়েছে'), 'success');
                                  refreshView();
                                }}
                                className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                              >
                                {t('Restore', 'পুনরুদ্ধার')}
                              </button>
                              
                              {/* Hard Delete */}
                              <button 
                                onClick={() => {
                                  setPendingConfirm({
                                    message: t('Are you sure you want to permanently delete this order? This cannot be undone.', 'আপনি কি নিশ্চিত যে আপনি স্থায়ীভাবে এই অর্ডারটি মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।'),
                                    destructive: true,
                                    onConfirm: async () => {
                                      await adminApi.deleteOrder(o.id, true);
                                      showToast(t('Order permanently deleted', 'অর্ডার স্থায়ীভাবে মুছে ফেলা হয়েছে'), 'error');
                                      refreshView();
                                    }
                                  });
                                }}
                                className="p-2 bg-rose-600/20 border border-rose-600/30 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg transition-all cursor-pointer"
                                title={t('Permanently Delete', 'স্থায়ীভাবে মুছুন')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              {/* View Product in Order */}
                              {o.items && o.items[0] && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const match = products.find(p => p.id === o.items[0].id || p.name === o.items[0].name);
                                    if (match) {
                                      handleOpenEditProduct(match);
                                    } else {
                                      navigate(`/search?q=${encodeURIComponent(o.items[0].name)}`);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-white/5 hover:bg-brand-orange text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title={t('View Product in Order', 'অর্ডারের পণ্য দেখুন')}
                                >
                                  <Package size={13} className="text-brand-orange" />
                                  <span className="hidden xl:inline">{t('View Product', 'পণ্য দেখুন')}</span>
                                </button>
                              )}

                              {/* Customer Chat */}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveView('notifications');
                                  showToast(t(`Order #${o.id.slice(0, 8)}: Customer thread active with ${o.address?.fullName || 'Customer'}`, `অর্ডার #${o.id.slice(0, 8)}: ${o.address?.fullName || 'গ্রাহক'}-এর সাথে চ্যাট থ্রেড চালু হয়েছে`), 'info');
                                }}
                                className="p-2 bg-white/5 hover:bg-white/10 text-blue-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                title={t('Chat with Customer', 'গ্রাহকের সাথে চ্যাট করুন')}
                              >
                                <MessageSquare size={14} />
                              </button>

                              {/* Details button */}
                              <button
                                type="button"
                                onClick={() => setViewingOrder(o)}
                                className="px-2.5 py-1.5 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title={t('Order Details & Payment Status', 'অর্ডারের বিস্তারিত ও পেমেন্ট অবস্থা')}
                              >
                                <Eye size={13} />
                                <span>{t('Details', 'বিস্তারিত')}</span>
                              </button>

                              {/* Quick Status Advance Helper */}
                              {o.status?.toLowerCase() === 'pending' && (
                                <button 
                                  onClick={async () => {
                                    await adminApi.updateOrderStatus(o.id, 'confirmed');
                                    showToast(t('Order confirmed', 'অর্ডার নিশ্চিত করা হয়েছে'), 'success');
                                    refreshView();
                                  }}
                                  className="px-2.5 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  {t('Confirm', 'নিশ্চিত করুন')}
                                </button>
                              )}
                              {o.status?.toLowerCase() === 'confirmed' && (
                                <button 
                                  onClick={async () => {
                                    await adminApi.updateOrderStatus(o.id, 'processing');
                                    showToast(t('Order marked as processing', 'অর্ডার প্রক্রিয়াধীন চিহ্নিত হয়েছে'), 'success');
                                    refreshView();
                                  }}
                                  className="px-2.5 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  {t('Process', 'প্রক্রিয়া')}
                                </button>
                              )}
                              {o.status?.toLowerCase() === 'processing' && (
                                <button 
                                  onClick={async () => {
                                    await adminApi.updateOrderStatus(o.id, 'shipped');
                                    showToast(t('Order marked as shipped', 'অর্ডার শিপড চিহ্নিত হয়েছে'), 'success');
                                    refreshView();
                                  }}
                                  className="px-2.5 py-1.5 bg-pink-500/20 text-pink-400 hover:bg-pink-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  {t('Ship', 'পাঠান')}
                                </button>
                              )}
                              {o.status?.toLowerCase() === 'shipped' && (
                                <button 
                                  onClick={async () => {
                                    await adminApi.updateOrderStatus(o.id, 'delivered');
                                    showToast(t('Order delivered successfully', 'অর্ডার সফলভাবে ডেলিভারি হয়েছে'), 'success');
                                    refreshView();
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                >
                                  {t('Deliver', 'ডেলিভারি')}
                                </button>
                              )}

                              {/* Action Selector Menu */}
                              <select 
                                value={o.status?.toLowerCase() || 'pending'}
                                onChange={async (e) => {
                                  const newStat = e.target.value;
                                  await adminApi.updateOrderStatus(o.id, newStat);
                                  showToast(t(`Order status changed to ${newStat}`, `অর্ডারের অবস্থা পরিবর্তন করা হয়েছে: ${getOrderStatusLabel(newStat)}`), 'success');
                                  refreshView();
                                }}
                                className="bg-[#12121a] border border-white/15 text-gray-200 rounded-lg text-xs p-1.5 font-medium focus:outline-none focus:border-brand-orange cursor-pointer"
                              >
                                <option value="pending">{t('Pending', 'অপেক্ষমাণ')}</option>
                                <option value="confirmed">{t('Confirmed', 'নিশ্চিত')}</option>
                                <option value="processing">{t('Processing', 'প্রক্রিয়াধীন')}</option>
                                <option value="packed">{t('Packed', 'প্যাক করা হয়েছে')}</option>
                                <option value="shipped">{t('Shipped', 'শিপড')}</option>
                                <option value="out-for-delivery">{t('Out for Delivery', 'ডেলিভারির পথে')}</option>
                                <option value="delivered">{t('Delivered', 'ডেলিভারি সম্পন্ন')}</option>
                                <option value="cancelled">{t('Cancelled', 'বাতিল')}</option>
                                <option value="returned">{t('Returned', 'ফেরত')}</option>
                              </select>

                              {/* Move to Trash Soft Delete */}
                              <button 
                                onClick={() => {
                                  setPendingConfirm({
                                    message: t('Are you sure you want to move this order to Trash?', 'আপনি কি নিশ্চিত যে এই অর্ডারটি ট্র্যাশে পাঠাতে চান?'),
                                    destructive: true,
                                    onConfirm: async () => {
                                      await adminApi.deleteOrder(o.id, false);
                                      showToast(t('Order moved to Trash', 'অর্ডার ট্র্যাশে পাঠানো হয়েছে'), 'info');
                                      refreshView();
                                    }
                                  });
                                }}
                                className="p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 rounded-lg transition-all cursor-pointer"
                                title={t('Move to Trash', 'ট্র্যাশে পাঠান')}
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}

                          {/* Eye inspector tool */}
                          <button
                            onClick={() => setViewingOrder(o)}
                            className="p-2 bg-white/5 border border-white/10 hover:bg-white/15 hover:border-white/20 text-gray-300 hover:text-white rounded-lg transition-all cursor-pointer"
                            title={t('View Order Details', 'অর্ডারের বিস্তারিত দেখুন')}
                          >
                            <Eye size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>


      </div>
    );
  };

  const renderUsers = () => {
    const usersList = users || [];

    // Filter identities based on reactive parameters
    const filteredUsers = usersList.filter(u => {
      const matchSearch = 
        !userSearchTerm.trim() ||
        (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(userSearchTerm.toLowerCase());
      
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchStatus = 
        userStatusFilter === 'all' || 
        (userStatusFilter === 'active' && u.status !== 'suspended') ||
        (userStatusFilter === 'suspended' && u.status === 'suspended');
      
      return matchSearch && matchRole && matchStatus;
    });

    // Metric Calculations
    const totalCount = usersList.length;
    const adminCount = usersList.filter(u => u.role === 'admin').length;
    const suspendedCount = usersList.filter(u => u.status === 'suspended').length;
    const activeCount = totalCount - suspendedCount;

    return (
      <div className="space-y-8 text-left">
        {/* Title Block */}
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('Customers & Users', 'গ্রাহক ও ব্যবহারকারী')}</h2>
          <p className="text-xs text-gray-400 mt-1">
            {t('Manage customer accounts, assign administrator roles, and handle account status.', 'গ্রাহক অ্যাকাউন্ট পরিচালনা করুন, অ্যাডমিন ভূমিকা নির্ধারণ করুন এবং অ্যাকাউন্টের অবস্থা নিয়ন্ত্রণ করুন।')}
          </p>
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('Total Users', 'মোট ব্যবহারকারী'), val: totalCount, icon: <Users size={16} className="text-blue-400" />, desc: t('Registered accounts', 'নিবন্ধিত অ্যাকাউন্ট') },
            { label: t('Administrators', 'অ্যাডমিনিস্ট্রেটর'), val: adminCount, icon: <ShieldCheck size={16} className="text-amber-400" />, desc: t('Admin privileges', 'অ্যাডমিন সুবিধা') },
            { label: t('Suspended Users', 'স্থগিত ব্যবহারকারী'), val: suspendedCount, icon: <ShieldAlert size={16} className="text-rose-500" />, desc: t('Restricted accounts', 'সীমাবদ্ধ অ্যাকাউন্ট') },
            { label: t('Active Users', 'সক্রিয় ব্যবহারকারী'), val: activeCount, icon: <Sparkles size={16} className="text-emerald-400" />, desc: t('Active accounts', 'সক্রিয় অ্যাকাউন্ট') }
          ].map((m, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{m.label}</span>
                {m.icon}
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-white">{m.val}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filtering Control Console */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Term Input */}
          <div className="relative w-full md:w-96">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </span>
            <input 
              type="text"
              placeholder={t('Search by Name, Email, or @username...', 'নাম, ইমেইল বা @username দিয়ে খুঁজুন...')}
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-11 pr-4 text-xs font-medium text-white placeholder-gray-400 outline-none focus:border-brand-orange transition-all"
            />
            {userSearchTerm && (
              <button 
                onClick={() => setUserSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filtering Capsules with Unified FilterDropdown */}
          <div className="flex flex-wrap gap-2.5 items-center w-full md:w-auto">
            {/* Filter by Role */}
            <FilterDropdown
              label={t('Role:', 'ভূমিকা:')}
              value={userRoleFilter}
              onChange={(v) => setUserRoleFilter(v as any)}
              options={[
                { value: 'all', label: t('All Roles', 'সব ভূমিকা') },
                { value: 'admin', label: t('Admins', 'অ্যাডমিন') },
                { value: 'user', label: t('Customers', 'গ্রাহক') },
              ]}
              ariaLabel={t('Filter users by role', 'ভূমিকা অনুযায়ী ফিল্টার করুন')}
            />

            {/* Filter by Status */}
            <FilterDropdown
              label={t('Status:', 'অবস্থা:')}
              value={userStatusFilter}
              onChange={(v) => setUserStatusFilter(v as any)}
              options={[
                { value: 'all', label: t('All Status', 'সব অবস্থা') },
                { value: 'active', label: t('Active Only', 'শুধু সক্রিয়') },
                { value: 'suspended', label: t('Suspended Only', 'শুধু স্থগিত') },
              ]}
              ariaLabel={t('Filter users by status', 'অবস্থা অনুযায়ী ফিল্টার করুন')}
            />

            {/* Clear Filters helper */}
            {(userSearchTerm || userRoleFilter !== 'all' || userStatusFilter !== 'all') && (
              <button
                onClick={() => {
                  setUserSearchTerm('');
                  setUserRoleFilter('all');
                  setUserStatusFilter('all');
                  showToast(t('User filters reset', 'ব্যবহারকারী ফিল্টার রিসেট করা হয়েছে'), 'info');
                }}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                {t('Reset', 'রিসেট')}
              </button>
            )}
          </div>
        </div>

        {/* Identity Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center">
              <Users size={32} className="text-gray-500 mb-3" />
              <p className="text-sm font-bold text-white mb-1">{t('No matching users found', 'কোনো মিল থাকা ব্যবহারকারী পাওয়া যায়নি')}</p>
              <p className="text-xs text-gray-400">{t('Try modifying your search or filter options', 'আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে চেষ্টা করুন')}</p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isAdmin = u.role === 'admin';
              const isSuspended = u.status === 'suspended';
              const isCurrentUser = u.email === sessionUser?.email || (u.email && u.email === adminEmail);
              const formattedDate = u.joinedAt 
                ? new Date(u.joinedAt).toLocaleDateString(dateLocale, { year: 'numeric', month: 'short', day: 'numeric' })
                : t('N/A', 'প্রযোজ্য নয়');

              return (
                <div 
                  key={u.id} 
                  className={`relative bg-[#12121a] border ${
                    isAdmin ? 'border-amber-500/30' : 'border-white/10'
                  } rounded-3xl p-5 text-left flex flex-col justify-between hover:border-white/20 transition-all shadow-xl group overflow-hidden`}
                >
                  <div className="space-y-4">
                    {/* Upper Header Profile Info */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`relative w-12 h-12 rounded-xl p-0.5 shrink-0 border ${
                          isAdmin 
                            ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 border-amber-500/40' 
                            : 'bg-white/10 border-white/10'
                        }`}>
                          {u.avatar && !u.avatar.includes('dicebear.com/7.x/bottts') ? (
                            <img 
                              src={u.avatar} 
                              className="w-full h-full object-cover rounded-[10px]" 
                              alt={`${u.name || t('User', 'ব্যবহারকারী')} profile avatar`} 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className={`w-full h-full rounded-[10px] flex items-center justify-center font-black text-xs uppercase ${
                              isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-brand-orange/20 text-brand-orange'
                            }`}>
                              {(u.name || u.email || 'U').slice(0, 2)}
                            </div>
                          )}
                          <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-950 ${
                            isSuspended ? 'bg-rose-500' : 'bg-emerald-500'
                          }`} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white truncate" title={u.name || t('Customer', 'গ্রাহক')}>
                            {u.name || t('Customer', 'গ্রাহক')}
                          </h4>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {u.username ? `@${u.username}` : (u.email ? u.email.split('@')[0] : t('No username', 'ইউজারনেম নেই'))}
                          </p>
                        </div>
                      </div>

                      {/* Top Right Badges */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1">
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] font-black uppercase tracking-wider rounded border border-blue-500/30">
                              {t('YOU', 'আপনি')}
                            </span>
                          )}
                          {isAdmin ? (
                            <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-500/20 flex items-center gap-1">
                              <ShieldCheck size={10} /> {u.adminRoleName || t('Admin', 'অ্যাডমিন')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-white/10">
                              {t('Customer', 'গ্রাহক')}
                            </span>
                          )}
                        </div>

                        {isSuspended ? (
                          <span className="px-1.5 py-0.5 bg-rose-500/15 text-rose-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-rose-500/20">
                            {t('Suspended', 'স্থগিত')}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-500/20">
                            {t('Active', 'সক্রিয়')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Specifications Registry Information */}
                    <div className="space-y-2 bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-gray-300">
                      {/* Email profile with interactive Copy action */}
                      <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">{t('Email', 'ইমেইল')}</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-white truncate text-xs" title={u.email}>{u.email || t('N/A', 'প্রযোজ্য নয়')}</span>
                          {u.email && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(u.email);
                                showToast(t('Email copied to clipboard', 'ইমেইল ক্লিপবোর্ডে কপি হয়েছে'), 'success');
                              }}
                              className="text-gray-400 hover:text-white transition-colors p-0.5 cursor-pointer"
                              title={t('Copy Email', 'ইমেইল কপি করুন')}
                            >
                              <Copy size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Phone profile */}
                      <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">{t('Phone', 'ফোন')}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-xs">{u.phone || t('None', 'নেই')}</span>
                          {u.phone && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(u.phone || '');
                                showToast(t('Phone copied to clipboard', 'ফোন নম্বর ক্লিপবোর্ডে কপি হয়েছে'), 'success');
                              }}
                              className="text-gray-400 hover:text-white transition-colors p-0.5 cursor-pointer"
                              title={t('Copy Phone Number', 'ফোন নম্বর কপি করুন')}
                            >
                              <Copy size={11} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Member Since Timestamp */}
                      <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">{t('Member Since', 'সদস্য হয়েছেন')}</span>
                        <span className="text-white flex items-center gap-1 text-xs">
                          <Clock size={10} className="text-gray-400" /> {formattedDate}
                        </span>
                      </div>

                      {/* Saved Addresses count */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-[10px] uppercase font-bold">{t('Saved Addresses', 'সংরক্ষিত ঠিকানা')}</span>
                        <button
                          type="button"
                          onClick={() => setViewingUser(u)}
                          className="px-2 py-0.5 bg-brand-orange/10 hover:bg-brand-orange/20 text-brand-orange rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title={t('View customer profile and address book', 'গ্রাহকের প্রোফাইল ও ঠিকানা দেখুন')}
                        >
                          <span>{t(`${u.addresses?.length || 0} addresses`, `${u.addresses?.length || 0}টি ঠিকানা`)}</span>
                          <Eye size={10} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Account Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2">
                    <div className="flex gap-2">
                      {isSuspended ? (
                        <button 
                          onClick={async () => {
                            await updateGlobalUsers(u.id, { status: 'active' });
                            showToast(t(`Account activated for ${u.name || 'User'}`, `${u.name || 'ব্যবহারকারী'}-এর অ্যাকাউন্ট সক্রিয় করা হয়েছে`), 'success');
                          }}
                          className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          title={t('Activate user account', 'ব্যবহারকারীর অ্যাকাউন্ট সক্রিয় করুন')}
                        >
                          <Unlock size={12} /> {t('Activate', 'সক্রিয় করুন')}
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (isCurrentUser) {
                              showToast(t('Cannot suspend your own account!', 'নিজের অ্যাকাউন্ট স্থগিত করা যাবে না!'), 'error');
                              return;
                            }
                            setPendingConfirm({
                              message: t(`Are you sure you want to suspend ${u.name || 'this user'}?`, `আপনি কি নিশ্চিত যে ${u.name || 'এই ব্যবহারকারী'}-কে স্থগিত করতে চান?`),
                              destructive: true,
                              onConfirm: async () => {
                                await updateGlobalUsers(u.id, { status: 'suspended' });
                                showToast(t(`User suspended: ${u.name || 'User'}`, `ব্যবহারকারী স্থগিত করা হয়েছে: ${u.name || 'ব্যবহারকারী'}`), 'error');
                              }
                            });
                          }}
                          disabled={isCurrentUser}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isCurrentUser 
                              ? 'bg-white/5 text-gray-600 cursor-not-allowed' 
                              : 'bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400'
                          }`}
                          title={isCurrentUser ? t('Self Suspension Protected', 'নিজ অ্যাকাউন্ট সুরক্ষিত') : t('Suspend user', 'ব্যবহারকারী স্থগিত করুন')}
                        >
                          <Lock size={12} /> {t('Suspend', 'স্থগিত')}
                        </button>
                      )}

                      {/* Role Elevation Toggle & Granular Assignment */}
                      {isAdmin ? (
                        <div className="flex-1 flex gap-1.5">
                          <button 
                            type="button"
                            onClick={() => {
                              setAssigningRoleUser(u);
                              setAssigningRoleId(u.adminRoleId || 'inventory_manager');
                            }}
                            className="flex-1 py-2 bg-brand-orange/20 hover:bg-brand-orange text-brand-orange hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1 transition-all border border-brand-orange/30 cursor-pointer"
                            title={t('Edit granular role & permissions', 'ভূমিকা ও অনুমতি সম্পাদনা করুন')}
                          >
                            <Key size={11} /> {t('Roles', 'ভূমিকা')}
                          </button>
                          <button 
                            onClick={() => {
                              if (isCurrentUser) {
                                showToast(t('Cannot revoke your own administrator privileges!', 'নিজের অ্যাডমিন অধিকার বাতিল করা যাবে না!'), 'error');
                                return;
                              }
                              setPendingConfirm({
                                message: t(`Demote ${u.name || 'this admin'} back to standard customer?`, `${u.name || 'এই অ্যাডমিন'}-কে সাধারণ গ্রাহকে নামিয়ে দেবেন?`),
                                destructive: true,
                                onConfirm: async () => {
                                  await updateGlobalUsers(u.id, { role: 'user', adminRoleId: undefined, adminRoleName: undefined, permissions: [] });
                                  logAdminAction('Role_Change', 'Customer', u.name || 'User', 'Demoted administrator to standard customer');
                                  showToast(t(`Admin access revoked for ${u.name}`, `${u.name}-এর অ্যাডমিন অ্যাক্সেস বাতিল করা হয়েছে`), 'warning');
                                }
                              });
                            }}
                            disabled={isCurrentUser}
                            className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center transition-all border ${
                              isCurrentUser 
                                ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed opacity-50' 
                                : 'bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 border-rose-500/20 cursor-pointer'
                            }`}
                            title={isCurrentUser ? t('Self Revocation Protected: You cannot demote your own active account', 'নিজ অ্যাকাউন্টের অধিকার বাতিল করা যাবে না') : t('Revoke Administrator Privileges', 'অ্যাডমিন সুবিধা বাতিল করুন')}
                          >
                            {t('Revoke', 'বাতিল')}
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => {
                            setAssigningRoleUser(u);
                            setAssigningRoleId('inventory_manager');
                          }}
                          className="flex-1 py-2 bg-blue-500/20 hover:bg-blue-500 text-blue-400 hover:text-white text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-blue-500/20 rounded-xl"
                          title={t('Assign Admin Role & Granular Permissions', 'অ্যাডমিন ভূমিকা ও অনুমতি নির্ধারণ করুন')}
                        >
                          <UserCheck size={12} /> {t('Make Admin', 'অ্যাডমিন বানান')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderTrash = () => {
    const deletedProducts = (products || []).filter(p => p.isDeleted === true);
    const deletedOrders = (orders || []).filter(o => o.isDeleted === true);

    const filteredProducts = deletedProducts.filter(p => {
      const query = trashSearch.toLowerCase().trim();
      if (!query) return true;
      return (
        (p.name || '').toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query)
      );
    });

    const filteredOrders = deletedOrders.filter(o => {
      const query = trashSearch.toLowerCase().trim();
      if (!query) return true;
      return (
        (o.id || '').toLowerCase().includes(query) ||
        (o.address?.fullName || '').toLowerCase().includes(query) ||
        (o.address?.phone || '').toLowerCase().includes(query)
      );
    });

    const productsTrashValue = filteredProducts.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 1)), 0);
    const ordersTrashValue = filteredOrders.reduce((sum, o) => sum + (Number(o.total || 0)), 0);

    const isProducts = trashTab === 'products';

    const handleEmptyProducts = () => {
      if (filteredProducts.length === 0) {
        showToast(t('No deleted products to purge!', 'মুছে ফেলার মতো কোনো পণ্য নেই!'), 'info');
        return;
      }
      setPendingConfirm({
        message: t(`CRITICAL WARNING: Are you sure you want to PERMANENTLY PURGE all ${filteredProducts.length} deleted products? This action cannot be undone.`, `সতর্কতা: আপনি কি নিশ্চিত যে সব ${filteredProducts.length}টি মুছে ফেলা পণ্য স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`),
        destructive: true,
        onConfirm: async () => {
          try {
            showToast(t('Permanently deleting products...', 'পণ্যগুলো স্থায়ীভাবে মুছে ফেলা হচ্ছে...'), 'info');
            for (const p of filteredProducts) {
              await adminApi.deleteProduct(p.id, true);
            }
            showToast(t('Products permanently deleted', 'পণ্যগুলো স্থায়ীভাবে মুছে ফেলা হয়েছে'), 'success');
            refreshView();
          } catch (e) {
            showToast(t('Failed to empty products trash', 'পণ্যের ট্র্যাশ খালি করা যায়নি'), 'error');
          }
        }
      });
    };

    const handleEmptyOrders = () => {
      if (filteredOrders.length === 0) {
        showToast(t('No deleted orders to purge!', 'মুছে ফেলার মতো কোনো অর্ডার নেই!'), 'info');
        return;
      }
      setPendingConfirm({
        message: t(`CRITICAL WARNING: Are you sure you want to PERMANENTLY PURGE all ${filteredOrders.length} deleted orders? This action is irreversible.`, `সতর্কতা: আপনি কি নিশ্চিত যে সব ${filteredOrders.length}টি মুছে ফেলা অর্ডার স্থায়ীভাবে মুছে ফেলতে চান? এটি অপরিবর্তনীয়।`),
        destructive: true,
        onConfirm: async () => {
          try {
            showToast(t('Permanently deleting orders...', 'অর্ডারগুলো স্থায়ীভাবে মুছে ফেলা হচ্ছে...'), 'info');
            for (const o of filteredOrders) {
              await adminApi.deleteOrder(o.id, true);
            }
            showToast(t('Orders permanently deleted', 'অর্ডারগুলো স্থায়ীভাবে মুছে ফেলা হয়েছে'), 'success');
            refreshView();
          } catch (e) {
            showToast(t('Failed to empty orders trash', 'অর্ডারের ট্র্যাশ খালি করা যায়নি'), 'error');
          }
        }
      });
    };

    return (
      <div className="space-y-8 text-left">
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('Trash', 'ট্র্যাশ')}</h2>
            <p className="text-xs text-gray-400 mt-1">
              {t('View deleted products and orders. Restore items to the store or permanently delete them.', 'মুছে ফেলা পণ্য এবং অর্ডার দেখুন। স্টোরে পুনরুদ্ধার করুন বা স্থায়ীভাবে মুছে ফেলুন।')}
            </p>
          </div>
          {isProducts ? (
            <button
              onClick={handleEmptyProducts}
              className="px-5 py-2.5 bg-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} /> {t('Empty Products Trash', 'পণ্যের ট্র্যাশ খালি করুন')}
            </button>
          ) : (
            <button
              onClick={handleEmptyOrders}
              className="px-5 py-2.5 bg-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={14} /> {t('Empty Orders Trash', 'অর্ডারের ট্র্যাশ খালি করুন')}
            </button>
          )}
        </div>

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: t('Deleted Products', 'মুছে ফেলা পণ্য'), val: deletedProducts.length, icon: <Package size={16} className="text-amber-400" />, desc: t('Trashed items', 'ট্র্যাশে থাকা পণ্য') },
            { label: t('Products Value', 'পণ্যের মূল্য'), val: `৳${productsTrashValue.toLocaleString()}`, icon: <TrendingUp size={16} className="text-blue-400" />, desc: t('Estimated inventory value', 'আনুমানিক ইনভেন্টরি মূল্য') },
            { label: t('Deleted Orders', 'মুছে ফেলা অর্ডার'), val: deletedOrders.length, icon: <ShoppingCart size={16} className="text-rose-400" />, desc: t('Trashed orders', 'ট্র্যাশে থাকা অর্ডার') },
            { label: t('Orders Value', 'অর্ডারের মূল্য'), val: `৳${ordersTrashValue.toLocaleString()}`, icon: <DollarSign size={16} className="text-emerald-400" />, desc: t('Total order value', 'মোট অর্ডারের মূল্য') }
          ].map((m, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{m.label}</span>
                {m.icon}
              </div>
              <div className="mt-3">
                <span className="text-xl font-black text-white">{m.val}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Tabs and Search Panel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 w-full md:w-auto">
            <button
              onClick={() => { setTrashTab('products'); setTrashSearch(''); }}
              className={`flex-1 md:flex-initial px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${isProducts ? 'bg-brand-orange text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <Package size={14} /> {t(`Products (${deletedProducts.length})`, `পণ্য (${deletedProducts.length})`)}
            </button>
            <button
              onClick={() => { setTrashTab('orders'); setTrashSearch(''); }}
              className={`flex-1 md:flex-initial px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${!isProducts ? 'bg-brand-orange text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
            >
              <ShoppingCart size={14} /> {t(`Orders (${deletedOrders.length})`, `অর্ডার (${deletedOrders.length})`)}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder={isProducts ? t('Search by product name or category...', 'পণ্যের নাম বা ক্যাটাগরি দিয়ে খুঁজুন...') : t('Search by order ID or customer...', 'অর্ডার আইডি বা গ্রাহক দিয়ে খুঁজুন...')}
              value={trashSearch}
              onChange={(e) => setTrashSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl h-10 pl-10 pr-4 text-xs font-medium text-white placeholder-gray-400 outline-none focus:border-brand-orange transition-all"
            />
            {trashSearch && (
              <button onClick={() => setTrashSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer">
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* List Content */}
        {isProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white/[0.01] rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center">
                <Package size={32} className="text-white/20 mb-3" />
                <p className="text-sm font-black text-white/20 uppercase tracking-[0.4em]">{t('No deleted products found', 'কোনো মুছে ফেলা পণ্য পাওয়া যায়নি')}</p>
                <p className="text-[10px] text-white/10 font-mono mt-1">{t('Trash bin is currently empty', 'ট্র্যাশ বিন বর্তমানে খালি')}</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const formattedDate = formatProductDate(p.createdAt);

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-950/40 border border-white/5 rounded-[40px] p-6 text-left flex flex-col justify-between hover:bg-zinc-900/40 transition-all shadow-xl relative overflow-hidden group"
                  >
                    <div className="space-y-4">
                      {/* Image & Header */}
                      <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                          <img src={p.image} className="w-full h-full object-cover" alt={p.name || 'Store product'} referrerPolicy="no-referrer" />
                        </div>
                        <div className="min-w-0">
                          <span className="px-2 py-0.5 bg-white/5 text-white/40 font-mono text-[8px] font-black uppercase tracking-wider rounded-lg border border-white/5">
                            {translateCategory(p.category)}
                          </span>
                          <h4 className="text-sm font-black text-white uppercase truncate mt-1">{p.name}</h4>
                          <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest truncate font-mono">{t('By:', 'বিক্রেতা:')} {p.seller?.name || t('Admin', 'অ্যাডমিন')}</p>
                        </div>
                      </div>

                      {/* Log details */}
                      <div className="space-y-1.5 bg-[#0d0d11] border border-white/5 rounded-2xl p-4 font-mono text-[9px] text-white/50">
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <span>{t('Unit Price:', 'একক মূল্য:')}</span>
                          <span className="text-white font-sans font-bold">৳{formatProductBDT(p.price)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <span>{t('Stock count:', 'স্টক পরিমাণ:')}</span>
                          <span className="text-white font-sans font-bold">{t(`${p.stock || 0} items`, `${p.stock || 0}টি পণ্য`)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{t('Created:', 'তৈরির তারিখ:')}</span>
                          <span className="text-white">{formattedDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Control Operations */}
                    <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                      <button
                        onClick={async () => {
                          try {
                            await adminApi.restoreProduct(p.id);
                            showToast(t('Product successfully restored to active store!', 'পণ্যটি সফলভাবে সক্রিয় স্টোরে পুনরুদ্ধার করা হয়েছে!'), 'success');
                            refreshView();
                          } catch (e) {
                            showToast(t('Failed to restore product', 'পণ্যটি পুনরুদ্ধার করা যায়নি'), 'error');
                          }
                        }}
                        className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1.5 transition-all font-mono"
                      >
                        <RefreshCw size={10} /> {t('Restore', 'পুনরুদ্ধার')}
                      </button>
                      <button
                        onClick={() => {
                          setPendingConfirm({
                            message: t(`CRITICAL: Are you sure you want to PERMANENTLY PURGE ${p.name}? This action cannot be reversed.`, `সতর্কতা: আপনি কি নিশ্চিত যে ${p.name} স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।`),
                            destructive: true,
                            onConfirm: async () => {
                              try {
                                await adminApi.deleteProduct(p.id, true);
                                showToast(t('Product permanently purged', 'পণ্যটি স্থায়ীভাবে মুছে ফেলা হয়েছে'), 'success');
                                refreshView();
                              } catch (e) {
                                showToast(t('Purge failed', 'স্থায়ীভাবে মুছে ফেলা ব্যর্থ হয়েছে'), 'error');
                              }
                            }
                          });
                        }}
                        className="flex-1 py-2 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1.5 transition-all font-mono border border-rose-500/15 hover:border-transparent"
                      >
                        <Trash2 size={10} /> {t('Delete Forever', 'স্থায়ীভাবে মুছুন')}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white/[0.01] rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center">
                <ShoppingCart size={32} className="text-white/20 mb-3" />
                <p className="text-sm font-black text-white/20 uppercase tracking-[0.4em]">{t('No deleted orders found', 'কোনো মুছে ফেলা অর্ডার পাওয়া যায়নি')}</p>
                <p className="text-[10px] text-white/10 font-mono mt-1">{t('Order trash bin is empty', 'অর্ডারের ট্র্যাশ বিন খালি')}</p>
              </div>
            ) : (
              filteredOrders.map((o) => {
                const dateVal = formatOrderDate(o.createdAt);

                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-950/40 border border-white/5 rounded-[40px] p-6 text-left flex flex-col justify-between hover:bg-zinc-900/40 transition-all shadow-xl relative overflow-hidden group"
                  >
                    <div className="space-y-4">
                      {/* Customer & ID */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 font-mono text-[7.5px] font-black uppercase tracking-wider rounded border border-rose-500/10">
                            {t('DELETED ORDER', 'মুছে ফেলা অর্ডার')}
                          </span>
                          <h4 className="text-xs font-mono font-black text-white uppercase truncate mt-1.5 flex items-center gap-1" title={o.id}>
                            {t('Order ID:', 'অর্ডার আইডি:')} <span className="text-brand-orange text-[10px]">{o.id.substring(0, 8)}...</span>
                          </h4>
                          <p className="text-[10px] text-white/50 font-bold mt-0.5">{t('Buyer:', 'ক্রেতা:')} {o.address?.fullName || t('Anonymous', 'অজ্ঞাত')}</p>
                        </div>
                        <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-xl">
                          ৳{Number(o.total || 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Specifications */}
                      <div className="space-y-1.5 bg-[#0d0d11] border border-white/5 rounded-2xl p-4 font-mono text-[9px] text-white/50">
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <span>{t('Items ordered:', 'অর্ডারকৃত পণ্য:')}</span>
                          <span className="text-white font-sans font-bold">{t(`${(o.items || []).length} units`, `${(o.items || []).length}টি পণ্য`)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <span>{t('Phone:', 'ফোন:')}</span>
                          <span className="text-white font-sans">{o.address?.phone || t('N/A', 'প্রযোজ্য নয়')}</span>
                        </div>
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <span>{t('Status:', 'অবস্থা:')}</span>
                          <span className="text-amber-400 uppercase font-black">{o.status || t('Pending', 'অপেক্ষমাণ')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{t('Order Date:', 'অর্ডারের তারিখ:')}</span>
                          <span className="text-white">{dateVal}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                      <button
                        onClick={async () => {
                          try {
                            await adminApi.restoreOrder(o.id);
                            showToast(t('Order successfully restored to live ledger!', 'অর্ডার সফলভাবে পুনরুদ্ধার করা হয়েছে!'), 'success');
                            refreshView();
                          } catch (e) {
                            showToast(t('Failed to restore order', 'অর্ডার পুনরুদ্ধার করা যায়নি'), 'error');
                          }
                        }}
                        className="flex-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1.5 transition-all font-mono"
                      >
                        <RefreshCw size={10} /> {t('Restore', 'পুনরুদ্ধার')}
                      </button>
                      <button
                        onClick={() => {
                          setPendingConfirm({
                            message: t(`CRITICAL WARNING: Are you sure you want to PERMANENTLY DELETE Order ID: ${o.id}? This will wipe out all invoicing references.`, `সতর্কতা: আপনি কি নিশ্চিত যে অর্ডার আইডি ${o.id} স্থায়ীভাবে মুছে ফেলতে চান? এর সব তথ্য মুছে যাবে।`),
                            destructive: true,
                            onConfirm: async () => {
                              try {
                                await adminApi.deleteOrder(o.id, true);
                                showToast(t('Order registration wiped permanently', 'অর্ডার স্থায়ীভাবে মুছে ফেলা হয়েছে'), 'success');
                                refreshView();
                              } catch (e) {
                                showToast(t('Purge failed', 'স্থায়ীভাবে মুছে ফেলা ব্যর্থ হয়েছে'), 'error');
                              }
                            }
                          });
                        }}
                        className="flex-1 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-1.5 transition-all font-mono border border-rose-500/15 hover:border-transparent"
                      >
                        <Trash2 size={10} /> {t('Delete Forever', 'স্থায়ীভাবে মুছুন')}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    );
  };

  const renderReviews = () => {
    // Stat counts
    const totalReviewsCount = (reviews || []).length;
    const publishedCount = (reviews || []).filter(r => r.status === 'published' || !r.status).length;
    const pendingCount = (reviews || []).filter(r => r.status === 'pending').length;
    const flaggedCount = (reviews || []).filter(r => r.status === 'flagged').length;
    const hiddenCount = (reviews || []).filter(r => r.status === 'hidden').length;

    const avgRating = totalReviewsCount > 0
      ? ((reviews || []).reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / totalReviewsCount).toFixed(1)
      : '5.0';

    // Filter & Search Logic
    const filteredReviews = (reviews || []).filter(r => {
      const status = r.status || 'published';
      if (reviewFilterTab === 'pending' && status !== 'pending') return false;
      if (reviewFilterTab === 'published' && status !== 'published') return false;
      if (reviewFilterTab === 'flagged' && status !== 'flagged') return false;
      if (reviewFilterTab === 'hidden' && status !== 'hidden') return false;

      if (reviewRatingFilter !== 'all' && Number(r.rating) !== Number(reviewRatingFilter)) return false;

      if (reviewSearchTerm.trim()) {
        const q = reviewSearchTerm.toLowerCase();
        const pName = (r.productName || '').toLowerCase();
        const uName = (r.userName || '').toLowerCase();
        const comment = (r.comment || '').toLowerCase();
        const flagReason = (r.flaggedReason || '').toLowerCase();
        if (!pName.includes(q) && !uName.includes(q) && !comment.includes(q) && !flagReason.includes(q)) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (reviewSortBy === 'highest') return (b.rating || 0) - (a.rating || 0);
      if (reviewSortBy === 'lowest') return (a.rating || 0) - (b.rating || 0);
      if (reviewSortBy === 'helpful') return (b.helpful || 0) - (a.helpful || 0);
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : (a.date ? new Date(a.date).getTime() : 0);
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : (b.date ? new Date(b.date).getTime() : 0);
      return dateB - dateA;
    });

    const getInitials = (name?: string) => {
      if (!name) return 'CU';
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    };

    const handleApprove = async (reviewId: string) => {
      try {
        await adminApi.updateReviewStatus(reviewId, 'published');
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'published', flaggedReason: undefined } : r));
        showToast(t('Review approved & published on store', 'রিভিউ অনুমোদিত এবং স্টোরে প্রকাশিত হয়েছে'), 'success');
      } catch (err) {
        showToast(t('Failed to approve review', 'রিভিউ অনুমোদন করা যায়নি'), 'error');
      }
    };

    const handleHide = async (reviewId: string) => {
      try {
        await adminApi.updateReviewStatus(reviewId, 'hidden');
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: 'hidden' } : r));
        showToast(t('Review hidden from storefront', 'রিভিউ স্টোর থেকে লুকানো হয়েছে'), 'info');
      } catch (err) {
        showToast(t('Failed to hide review', 'রিভিউ লুকানো যায়নি'), 'error');
      }
    };

    const promptDelete = (review: any) => {
      setConfirmDialog({
        isOpen: true,
        title: t('Delete Customer Review', 'গ্রাহকের রিভিউ মুছুন'),
        message: t(`Are you sure you want to permanently delete this review by "${review.userName || 'Customer'}" on "${review.productName || 'Product'}"? This action cannot be reversed.`, `আপনি কি নিশ্চিত যে "${review.productName || 'পণ্য'}"-এ "${review.userName || 'গ্রাহক'}"-এর এই রিভিউটি স্থায়ীভাবে মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।`),
        confirmLabel: t('Delete Permanently', 'স্থায়ীভাবে মুছুন'),
        confirmVariant: 'danger',
        onConfirm: async () => {
          try {
            await adminApi.deleteReview(review.id);
            setReviews(prev => prev.filter(r => r.id !== review.id));
            showToast(t('Review removed permanently', 'রিভিউ স্থায়ীভাবে মুছে ফেলা হয়েছে'), 'success');
          } catch (err) {
            showToast(t('Failed to delete review', 'রিভিউ মুছে ফেলা যায়নি'), 'error');
          }
        }
      });
    };

    const handleOpenFlag = (review: any) => {
      setFlaggingReview(review);
      setFlagReasonInput(review.flaggedReason || '');
    };

    const handleSaveFlag = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!flaggingReview) return;
      try {
        const reason = flagReasonInput.trim() || t('Flagged for moderation by administrator', 'অ্যাডমিনিস্ট্রেটর দ্বারা মডারেশনের জন্য চিহ্নিত');
        await adminApi.updateReviewStatus(flaggingReview.id, 'flagged', reason);
        setReviews(prev => prev.map(r => r.id === flaggingReview.id ? {
          ...r,
          status: 'flagged',
          flaggedReason: reason
        } : r));
        showToast(t('Review marked as Flagged/Reported', 'রিভিউ ফ্ল্যাগ/রিপোর্ট করা হয়েছে'), 'info');
        setFlaggingReview(null);
        setFlagReasonInput('');
      } catch (err) {
        showToast(t('Failed to flag review', 'রিভিউ ফ্ল্যাগ করা যায়নি'), 'error');
      }
    };

    const handleOpenReply = (review: any) => {
      setReplyingReview(review);
      setReplyText(review.sellerReply || '');
    };

    const handleSaveReply = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyingReview || !replyText.trim()) {
        showToast(t('Please enter your response message', 'অনুগ্রহ করে আপনার উত্তর লিখুন'), 'error');
        return;
      }
      setIsSubmittingReply(true);
      try {
        await adminApi.replyReview(replyingReview.id, replyText.trim());
        const replyDate = new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
        setReviews(prev => prev.map(r => r.id === replyingReview.id ? {
          ...r,
          sellerReply: replyText.trim(),
          sellerReplyDate: replyDate
        } : r));
        showToast(t('Official store response published', 'অফিসিয়াল স্টোরের উত্তর প্রকাশিত হয়েছে'), 'success');
        setReplyingReview(null);
        setReplyText('');
      } catch (err) {
        showToast(t('Failed to publish reply', 'উত্তর প্রকাশ করা যায়নি'), 'error');
      } finally {
        setIsSubmittingReply(false);
      }
    };

    const handleInspectProduct = (review: any) => {
      const match = (products || []).find(p => p.id === review.productId) || {
        id: review.productId,
        name: review.productName || t('Product Details', 'পণ্যের বিস্তারিত'),
        image: review.productImage || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80',
        price: 2450,
        category: 'Apparel',
        stock: 45
      };
      setPreviewingReviewProduct(match);
    };

    return (
      <div className="space-y-8 text-left">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('Reviews & Feedback', 'রিভিউ এবং মতামত')}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                {t(`${totalReviewsCount} Records`, `${totalReviewsCount}টি রেকর্ড`)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {t('Audit real customer feedback submitted across products, moderate ratings, and broadcast official store replies.', 'পণ্যের উপর গ্রাহকদের রিভিউ যাচাই করুন, রেটিং মডারেট করুন এবং অফিসিয়াল স্টোরের উত্তর দিন।')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setIsFetchingReviews(true);
                try {
                  const revs = await adminApi.getReviews();
                  if (revs) setReviews(revs);
                  showToast(t('Reviews refreshed from database', 'ডাটাবেস থেকে রিভিউ রিফ্রেশ করা হয়েছে'), 'success');
                } catch (e) {
                  showToast(t('Failed to refresh reviews', 'রিভিউ রিফ্রেশ করা যায়নি'), 'error');
                } finally {
                  setIsFetchingReviews(false);
                }
              }}
              disabled={isFetchingReviews}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border border-white/10 cursor-pointer disabled:opacity-50"
              title={t('Refresh Review Data', 'রিভিউ ডেটা রিফ্রেশ করুন')}
            >
              <RefreshCw size={13} className={isFetchingReviews ? 'animate-spin' : ''} />
              <span>{t('Refresh', 'রিফ্রেশ')}</span>
            </button>
          </div>
        </div>

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Reviews */}
          <div className="bg-[#12121a] border border-white/10 rounded-3xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t('Total Reviews', 'মোট রিভিউ')}</span>
              <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <MessageSquare size={16} />
              </div>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{totalReviewsCount}</p>
            <p className="text-[11px] text-gray-500 mt-1">{t('Customer reviews across store', 'স্টোর জুড়ে গ্রাহকের রিভিউ')}</p>
          </div>

          {/* Card 2: Average Store Rating */}
          <div className="bg-[#12121a] border border-white/10 rounded-3xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t('Store Average', 'স্টোরের গড়')}</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Star size={16} className="fill-amber-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-white tracking-tight">{avgRating}</p>
              <span className="text-xs font-bold text-amber-400 font-mono">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star
                  key={i}
                  size={12}
                  className={i <= Math.round(Number(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}
                />
              ))}
              <span className="text-[11px] text-gray-500 ml-1">{t('Overall customer score', 'সামগ্রিক গ্রাহক স্কোর')}</span>
            </div>
          </div>

          {/* Card 3: Pending Moderation */}
          <div className={`bg-[#12121a] border rounded-3xl p-5 relative overflow-hidden group transition-all shadow-xl ${
            pendingCount > 0 ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10 hover:border-white/20'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t('Pending Moderation', 'পর্যালোচনার অপেক্ষায়')}</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Clock size={16} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-black text-white tracking-tight">{pendingCount}</p>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {t('Needs Review', 'পর্যালোচনা প্রয়োজন')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{t('Awaiting admin review & approval', 'অ্যাডমিন অনুমোদনের অপেক্ষায়')}</p>
          </div>

          {/* Card 4: Flagged / Reported */}
          <div className={`bg-[#12121a] border rounded-3xl p-5 relative overflow-hidden group transition-all shadow-xl ${
            flaggedCount > 0 ? 'border-rose-500/40 bg-rose-500/5' : 'border-white/10 hover:border-white/20'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{t('Flagged / Reported', 'ফ্ল্যাগড / রিপোর্টেড')}</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Flag size={16} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-black text-white tracking-tight">{flaggedCount}</p>
              {flaggedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  {t('Action Required', 'পদক্ষেপ প্রয়োজন')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{t('Policy flags & disputes', 'নীতি লঙ্ঘন ও অভিযোগ')}</p>
          </div>
        </div>

        {/* Filter Toolbar: Tabs, Rating Selector, Search Bar, and Sorting */}
        <div className="bg-[#12121a] border border-white/10 rounded-3xl p-4 md:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Status Tabs with Unified FilterTabGroup */}
            <FilterTabGroup
              tabs={[
                { id: 'all', label: t('All Reviews', 'সব রিভিউ'), count: totalReviewsCount, badgeVariant: 'grey' },
                { id: 'pending', label: t('Pending', 'অপেক্ষমাণ'), count: pendingCount, badgeVariant: pendingCount > 0 ? 'amber' : 'grey' },
                { id: 'published', label: t('Published', 'প্রকাশিত'), count: publishedCount, badgeVariant: 'green' },
                { id: 'flagged', label: t('Flagged / Reported', 'ফ্ল্যাগড / রিপোর্টেড'), count: flaggedCount, badgeVariant: flaggedCount > 0 ? 'rose' : 'grey' },
                { id: 'hidden', label: t('Hidden', 'লুকানো'), count: hiddenCount, badgeVariant: 'grey' },
              ]}
              activeTab={reviewFilterTab}
              onChange={(id) => setReviewFilterTab(id as any)}
              ariaLabel={t('Reviews Status Filter', 'রিভিউ স্ট্যাটাস ফিল্টার')}
            />

            {/* Sort Dropdown with Unified FilterDropdown */}
            <FilterDropdown
              label={t('Sort By:', 'সাজান:')}
              value={reviewSortBy}
              onChange={(val) => setReviewSortBy(val as any)}
              options={[
                { value: 'recent', label: t('Most Recent', 'সর্বশেষ') },
                { value: 'highest', label: t('Highest Rating', 'সর্বোচ্চ রেটিং') },
                { value: 'lowest', label: t('Lowest Rating', 'সর্বনিম্ন রেটিং') },
                { value: 'helpful', label: t('Most Helpful', 'সবচেয়ে সহায়ক') },
              ]}
              ariaLabel={t('Sort reviews by', 'রিভিউ সাজান')}
            />
          </div>

          {/* Bottom Bar: Search + Star Filter */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-white/5">
            {/* Search Input */}
            <div className="md:col-span-7 relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={reviewSearchTerm}
                onChange={(e) => setReviewSearchTerm(e.target.value)}
                placeholder={t('Search by product, customer name, review comment, or flag reason...', 'পণ্য, গ্রাহকের নাম, রিভিউ বা ফ্ল্যাগ কারণ দিয়ে খুঁজুন...')}
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-all"
              />
              {reviewSearchTerm && (
                <button
                  onClick={() => setReviewSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Star Rating Filter Pills */}
            <div className="md:col-span-5 flex items-center gap-1.5 overflow-x-auto admin-scrollbar pb-1">
              <span className="text-[10px] font-bold uppercase text-gray-400 mr-1 shrink-0">{t('Rating:', 'রেটিং:')}</span>
              <FilterTabGroup
                size="sm"
                tabs={[
                  { id: 'all', label: t('All', 'সব') },
                  { id: '5', label: '5 ★' },
                  { id: '4', label: '4 ★' },
                  { id: '3', label: '3 ★' },
                  { id: '2', label: '2 ★' },
                  { id: '1', label: '1 ★' },
                ]}
                activeTab={reviewRatingFilter}
                onChange={(val) => setReviewRatingFilter(val as any)}
                ariaLabel={t('Filter reviews by star rating', 'স্টার রেটিং দিয়ে ফিল্টার করুন')}
              />
            </div>
          </div>
        </div>

        {/* Reviews Cards List */}
        <div className="space-y-4">
          {isFetchingReviews ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-[#12121a] border border-white/10 rounded-3xl p-6 animate-pulse space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                      <div className="space-y-1.5">
                        <div className="w-28 h-3.5 bg-white/10 rounded" />
                        <div className="w-20 h-2.5 bg-white/5 rounded" />
                      </div>
                    </div>
                    <div className="w-20 h-6 bg-white/10 rounded-full" />
                  </div>
                  <div className="w-full h-12 bg-white/5 rounded-xl" />
                  <div className="w-1/2 h-4 bg-white/5 rounded" />
                </div>
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="py-20 text-center bg-[#12121a] rounded-3xl border border-dashed border-white/10 p-8 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mx-auto">
                <MessageSquare size={24} />
              </div>
              <h3 className="text-base font-bold text-white">{t('No Reviews Match Filters', 'ফিল্টারের সাথে কোনো রিভিউ মেলেনি')}</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                {reviewSearchTerm || reviewRatingFilter !== 'all' || reviewFilterTab !== 'all'
                  ? t('Try clearing your search query or adjusting the moderation status and star filters.', 'আপনার অনুসন্ধান মুছে দিন বা মডারেশন ও স্টার ফিল্টার পরিবর্তন করে চেষ্টা করুন।')
                  : t('No customer reviews exist in the database yet. When customers submit reviews on product pages, they will appear here automatically.', 'ডাটাবেসে এখনো কোনো গ্রাহক রিভিউ নেই। গ্রাহকরা পণ্যের পেজে রিভিউ দিলে তা এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।')}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                {(reviewSearchTerm || reviewRatingFilter !== 'all' || reviewFilterTab !== 'all') && (
                  <button
                    onClick={() => {
                      setReviewSearchTerm('');
                      setReviewRatingFilter('all');
                      setReviewFilterTab('all');
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    {t('Reset All Filters', 'সব ফিল্টার রিসেট করুন')}
                  </button>
                )}
                {totalReviewsCount === 0 && (
                  <button
                    onClick={async () => {
                      setIsFetchingReviews(true);
                      try {
                        const seeded = await adminApi.getReviews();
                        if (seeded) setReviews(seeded);
                        showToast(t('Sample reviews initialized', 'নমুনা রিভিউ লোড করা হয়েছে'), 'success');
                      } finally {
                        setIsFetchingReviews(false);
                      }
                    }}
                    className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    {t('Initialize Sample Customer Reviews', 'নমুনা গ্রাহক রিভিউ লোড করুন')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredReviews.map((review) => {
                const status = review.status || 'published';
                return (
                  <motion.div
                    key={review.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#12121a] border border-white/10 hover:border-white/20 rounded-3xl p-6 transition-all duration-200 shadow-xl space-y-4 relative group"
                  >
                    {/* Header Row: Reviewer, Rating, Date, Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                      {/* Reviewer identity */}
                      <div className="flex items-center gap-3">
                        {review.userAvatar ? (
                          <img
                            src={review.userAvatar}
                            alt={review.userName}
                            className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0 shadow-md"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange/30 to-amber-600/30 border border-brand-orange/30 flex items-center justify-center text-xs font-black text-brand-orange shrink-0">
                            {getInitials(review.userName)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white tracking-tight">
                              {review.userName || t('Anonymous Customer', 'অজ্ঞাত গ্রাহক')}
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                              <CheckCircle2 size={11} /> {t('Verified Buyer', 'যাচাইকৃত ক্রেতা')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400 font-mono">
                            <span>{review.date || t('Recently submitted', 'সম্প্রতি জমা দেওয়া')}</span>
                            {review.userId && (
                              <>
                                <span>•</span>
                                <span className="text-[10px] text-gray-500">ID: {String(review.userId).slice(0, 10)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Star rating + Status pill */}
                      <div className="flex items-center gap-3 self-start sm:self-auto">
                        <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(starIdx => (
                              <Star
                                key={starIdx}
                                size={13}
                                className={starIdx <= Number(review.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-black text-white font-mono ml-0.5">
                            {Number(review.rating).toFixed(1)}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                          status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : status === 'pending'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : status === 'flagged'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                        }`}>
                          {status === 'published' && <CheckCircle2 size={12} />}
                          {status === 'pending' && <Clock size={12} />}
                          {status === 'flagged' && <Flag size={12} />}
                          {status === 'hidden' && <EyeOff size={12} />}
                          {status === 'published' ? t('Published', 'প্রকাশিত') : status === 'pending' ? t('Pending Moderation', 'পর্যালোচনার অপেক্ষায়') : status === 'flagged' ? t('Flagged', 'ফ্ল্যাগড') : t('Hidden', 'লুকানো')}
                        </span>
                      </div>
                    </div>

                    {/* Middle Section: Review Comment & Variation details */}
                    <div className="space-y-3">
                      <p className="text-sm text-gray-200 leading-relaxed font-sans whitespace-pre-wrap">
                        {review.comment}
                      </p>

                      {/* Product variations */}
                      {(review.color || review.size) && (
                        <div className="flex items-center gap-2 text-[11px] font-mono text-gray-400">
                          <span className="text-gray-500 uppercase tracking-wider text-[10px]">{t('Purchased:', 'কেনা হয়েছে:')}</span>
                          {review.color && (
                            <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-gray-300">
                              {t('Color:', 'রং:')} <strong className="text-white font-bold">{review.color}</strong>
                            </span>
                          )}
                          {review.size && (
                            <span className="bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-gray-300">
                              {t('Size:', 'সাইজ:')} <strong className="text-white font-bold">{review.size}</strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Attached Buyer Photos */}
                      {(review.images?.length || 0) > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                            <Image size={12} className="text-brand-orange" />
                            {t(`Customer Attached Photos (${review.images.length})`, `গ্রাহকের সংযুক্ত ছবি (${review.images.length})`)}
                          </p>
                          <div className="flex flex-wrap gap-2.5">
                            {review.images.map((imgUrl: string, imgIdx: number) => (
                              <button
                                key={imgIdx}
                                type="button"
                                onClick={() => setPreviewingPhotoUrl(imgUrl)}
                                className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/10 hover:border-brand-orange/60 group/photo transition-all cursor-pointer shadow-md bg-black/40"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Review attachment ${imgIdx + 1}`}
                                  className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-200"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn size={14} className="text-white" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Flag Notice Banner */}
                      {status === 'flagged' && review.flaggedReason && (
                        <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-rose-300">
                          <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-rose-200 uppercase tracking-wider text-[10px] block">
                              {t('Reason for Flag / Report:', 'ফ্ল্যাগ / রিপোর্টের কারণ:')}
                            </span>
                            <p className="text-rose-300 text-xs font-sans">{review.flaggedReason}</p>
                          </div>
                        </div>
                      )}

                      {/* Official Seller / Admin Reply Box */}
                      {review.sellerReply && (
                        <div className="bg-brand-orange/5 border-l-2 border-brand-orange rounded-r-2xl p-3.5 space-y-1 mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="inline-flex items-center gap-1.5 font-bold text-brand-orange text-[11px] uppercase tracking-wider font-mono">
                              <CornerDownRight size={13} /> {t('Official Store Response', 'অফিসিয়াল স্টোরের উত্তর')}
                            </span>
                            <div className="flex items-center gap-2">
                              {review.sellerReplyDate && (
                                <span className="text-[10px] text-gray-500 font-mono">{review.sellerReplyDate}</span>
                              )}
                              <button
                                onClick={() => handleOpenReply(review)}
                                className="text-gray-400 hover:text-white text-[10px] underline cursor-pointer"
                              >
                                {t('Edit Response', 'উত্তর সম্পাদনা')}
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-300 font-sans leading-relaxed">
                            {review.sellerReply}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Bar: Product Info on Left, Action Buttons on Right */}
                    <div className="pt-4 border-t border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Product Preview Link */}
                      <button
                        type="button"
                        onClick={() => handleInspectProduct(review)}
                        className="flex items-center gap-3 bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/15 px-3 py-2 rounded-2xl transition-all cursor-pointer text-left max-w-sm"
                      >
                        <img
                          src={review.productImage || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80'}
                          alt={review.productName}
                          className="w-9 h-9 rounded-xl object-cover bg-white/5 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-mono">{t('Product Reviewed', 'রিভিউকৃত পণ্য')}</span>
                          <p className="text-xs font-bold text-white truncate group-hover:text-brand-orange transition-colors">
                            {review.productName || t('View Product', 'পণ্য দেখুন')}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-gray-500 shrink-0 ml-auto" />
                      </button>

                      {/* Actions Toolbar */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Helpful Count indicator */}
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5 font-mono mr-1">
                          <ThumbsUp size={12} className="text-gray-400" /> {review.helpful || 0}
                        </span>

                        {/* Approve/Publish Button */}
                        {status !== 'published' && (
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-emerald-500/30 hover:border-transparent cursor-pointer"
                            title={t('Publish this review to the public storefront', 'এই রিভিউটি স্টোরে প্রকাশ করুন')}
                          >
                            <Check size={13} /> {t('Approve', 'অনুমোদন')}
                          </button>
                        )}

                        {/* Hide Button */}
                        {status !== 'hidden' && (
                          <button
                            onClick={() => handleHide(review.id)}
                            className="px-3.5 py-1.5 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
                            title={t('Hide review from public view without deleting', 'মুছে না ফেলে রিভিউ লুকান')}
                          >
                            <EyeOff size={13} /> {t('Hide', 'লুকান')}
                          </button>
                        )}

                        {/* Flag / Resolve Flag Button */}
                        {status === 'flagged' ? (
                          <button
                            onClick={() => handleApprove(review.id)}
                            className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-gray-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-amber-500/30 cursor-pointer"
                            title={t('Clear flag and publish review', 'ফ্ল্যাগ সরিয়ে রিভিউ প্রকাশ করুন')}
                          >
                            <CheckCircle2 size={13} /> {t('Clear Flag', 'ফ্ল্যাগ সরান')}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenFlag(review)}
                            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-rose-500/20 cursor-pointer"
                            title={t('Flag review for policy violation or inappropriate content', 'নীতিমালা ভঙ্গের কারণে রিভিউ ফ্ল্যাগ করুন')}
                          >
                            <Flag size={13} /> {t('Flag', 'ফ্ল্যাগ')}
                          </button>
                        )}

                        {/* Reply Button */}
                        <button
                          onClick={() => handleOpenReply(review)}
                          className="px-3.5 py-1.5 bg-brand-orange/15 hover:bg-brand-orange text-brand-orange hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-brand-orange/30 hover:border-transparent cursor-pointer"
                          title={t('Compose official response', 'অফিসিয়াল উত্তর লিখুন')}
                        >
                          <Reply size={13} /> {review.sellerReply ? t('Edit Reply', 'উত্তর সম্পাদনা') : t('Reply', 'উত্তর দিন')}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => promptDelete(review)}
                          className="p-2 bg-white/5 hover:bg-rose-600 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 hover:border-transparent cursor-pointer"
                          title={t('Delete Review Permanently', 'স্থায়ীভাবে রিভিউ মুছুন')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Reply Modal */}
        <AnimatePresence>
          {replyingReview && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setReplyingReview(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-lg bg-[#111118] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 text-left p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                      <Reply size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">{t('Reply to Customer', 'গ্রাহককে উত্তর দিন')}</h3>
                      <p className="text-[11px] text-gray-400">{t('Response will be shown publicly as the official store response', 'উত্তরটি স্টোরের অফিসিয়াল প্রতিক্রিয়া হিসেবে প্রকাশিত হবে')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingReview(null)}
                    className="text-gray-400 hover:text-white p-1 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Review summary preview */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="font-bold text-white">{replyingReview.userName}</span>
                    <span className="font-mono text-[10px]">{replyingReview.productName}</span>
                  </div>
                  <p className="text-gray-300 italic text-[11px] line-clamp-2">"{replyingReview.comment}"</p>
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSaveReply} className="space-y-3">
                  {/* Quick reply templates */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      {t('Quick Responses:', 'দ্রুত উত্তর:')}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        t('Thank you so much for your kind words and support! We look forward to serving you again.', 'আপনার সুন্দর মতামত ও সমর্থনের জন্য অসংখ্য ধন্যবাদ! ভবিষ্যতেও আপনাকে সেবা দেওয়ার আশা রাখি।'),
                        t('We sincerely apologize for any inconvenience caused. Our team will contact you shortly to make this right.', 'যেকোনো অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত। সমস্যাটি সমাধানের জন্য আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।'),
                        t('Thank you for choosing Digital Shop T.M! We are thrilled that you love the quality and service.', 'Digital Shop T.M বেছে নেওয়ার জন্য ধন্যবাদ! মান ও সেবা আপনার ভালো লেগেছে জেনে আমরা আনন্দিত।')
                      ].map((tmpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplyText(tmpl)}
                          className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1 text-gray-300 hover:text-white transition-all text-left cursor-pointer"
                        >
                          {t(`Template ${idx + 1}`, `টেমপ্লেট ${idx + 1}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      {t('Official Reply Message:', 'অফিসিয়াল উত্তর বার্তা:')}
                    </label>
                    <textarea
                      rows={4}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t('Write a clear, courteous, and helpful response...', 'একটি স্পষ্ট, বিনয়ী এবং সহায়ক উত্তর লিখুন...')}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-all font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setReplyingReview(null)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      {t('Cancel', 'বাতিল')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReply || !replyText.trim()}
                      className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {isSubmittingReply ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      <span>{t('Publish Response', 'উত্তর প্রকাশ করুন')}</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Flag Modal */}
        <AnimatePresence>
          {flaggingReview && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFlaggingReview(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-[#111118] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 text-left p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Flag size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">{t('Flag Review', 'রিভিউ ফ্ল্যাগ করুন')}</h3>
                      <p className="text-[11px] text-gray-400">{t('Mark review for moderation or policy breach', 'মডারেশন বা নীতি ভঙ্গের জন্য চিহ্নিত করুন')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFlaggingReview(null)}
                    className="text-gray-400 hover:text-white p-1 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>

                <form onSubmit={handleSaveFlag} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5">
                      {t('Select Quick Reason:', 'দ্রুত কারণ নির্বাচন করুন:')}
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {[
                        t('Spam, advertising, or suspicious external links', 'স্প্যাম, বিজ্ঞাপন বা সন্দেহজনক বহিরাগত লিংক'),
                        t('Abusive, obscene, or offensive language', 'অপমানজনক, অশ্লীল বা আপত্তিকর ভাষা'),
                        t('Irrelevant content / not related to the product', 'অপ্রাসঙ্গিক বিষয়বস্তু / পণ্যের সাথে সম্পর্কিত নয়'),
                        t('Counterfeit allegation / customer dispute under review', 'নকল পণ্যের অভিযোগ / গ্রাহক বিরোধ পর্যালোচনাধীন')
                      ].map((reason, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFlagReasonInput(reason)}
                          className="text-[11px] bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl px-3 py-2 text-gray-300 hover:text-white text-left transition-all cursor-pointer"
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                      {t('Detailed Note:', 'বিস্তারিত নোট:')}
                    </label>
                    <input
                      type="text"
                      value={flagReasonInput}
                      onChange={(e) => setFlagReasonInput(e.target.value)}
                      placeholder={t('Enter specific violation details...', 'নির্দিষ্ট নীতি লঙ্ঘনের বিবরণ লিখুন...')}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition-all"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setFlaggingReview(null)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider"
                    >
                      {t('Cancel', 'বাতিল')}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                    >
                      {t('Confirm Flag', 'ফ্ল্যাগ নিশ্চিত করুন')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Photo Lightbox Modal */}
        <AnimatePresence>
          {previewingPhotoUrl && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewingPhotoUrl(null)}
                className="fixed inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative max-w-2xl max-h-[85vh] bg-[#111118] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 p-2 flex flex-col"
              >
                <div className="flex justify-between items-center px-4 py-2 border-b border-white/5">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{t('Customer Photo Attachment', 'গ্রাহকের সংযুক্ত ছবি')}</span>
                  <button
                    onClick={() => setPreviewingPhotoUrl(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white bg-white/5"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={previewingPhotoUrl}
                    alt="Customer attachment high-res"
                    className="max-h-[70vh] w-auto object-contain rounded-2xl shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Product Quick Inspector Modal */}
        <AnimatePresence>
          {previewingReviewProduct && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPreviewingReviewProduct(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-md bg-[#111118] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 text-left p-6 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-xs font-black text-white uppercase tracking-wider">{t('Product Snapshot', 'পণ্যের সংক্ষিপ্ত বিবরণ')}</span>
                  <button
                    onClick={() => setPreviewingReviewProduct(null)}
                    className="text-gray-400 hover:text-white p-1"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <img
                    src={previewingReviewProduct.image || previewingReviewProduct.images?.[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80'}
                    alt={previewingReviewProduct.name}
                    className="w-20 h-20 rounded-2xl object-cover bg-white/5 border border-white/10 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-300 font-mono">
                      {translateCategory(previewingReviewProduct.category || 'Apparel')}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1 leading-snug">
                      {previewingReviewProduct.name}
                    </h4>
                    <p className="text-brand-orange font-bold font-mono text-sm mt-0.5">
                      ৳{Number(previewingReviewProduct.price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-3 rounded-2xl border border-white/5 font-mono">
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">{t('Product ID', 'পণ্য আইডি')}</span>
                    <span className="text-white font-bold">{previewingReviewProduct.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block">{t('Inventory', 'স্টক')}</span>
                    <span className="text-emerald-400 font-bold">{previewingReviewProduct.stock ?? t('In Stock', 'স্টকে আছে')} {t('units', 'টি')}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      setPreviewingReviewProduct(null);
                      setActiveView('products');
                    }}
                    className="px-4 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-orange-light transition-all cursor-pointer"
                  >
                    {t('View in Catalog', 'ক্যাটালগে দেখুন')}
                  </button>
                  <button
                    onClick={() => setPreviewingReviewProduct(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider"
                  >
                    {t('Close', 'বন্ধ করুন')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderCoupons = () => {
    const activeCouponsCount = (coupons || []).filter(c => c.status === 'active').length;
    const scheduledCouponsCount = (coupons || []).filter(c => c.status === 'scheduled').length;
    const expiredCouponsCount = (coupons || []).filter(c => c.status === 'expired').length;
    const disabledCouponsCount = (coupons || []).filter(c => c.status === 'disabled').length;
    const totalCouponsCount = (coupons || []).length;

    const totalDiscountGiven = (coupons || []).reduce((acc, c) => acc + (c.totalDiscountGiven || 0), 0);

    const mostUsedCoupon = (coupons || []).reduce<Coupon | null>((max, c) => {
      if ((c.usage || 0) > (max ? (max.usage || 0) : 0)) return c;
      return max;
    }, null);

    const now = Date.now();
    const expiringSoonCount = (coupons || []).filter(c => {
      if (c.status !== 'active' || !c.validUntil) return false;
      const until = new Date(c.validUntil).getTime();
      return until >= now && until <= now + 7 * 24 * 60 * 60 * 1000;
    }).length;

    const formatCouponDate = (dateStr?: string) => {
      if (!dateStr) return t('No limit', 'কোনো সীমা নেই');
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return dateStr;
      }
    };

    const isCouponExpiringSoon = (coupon: Coupon) => {
      if (coupon.status !== 'active' || !coupon.validUntil) return false;
      const diff = new Date(coupon.validUntil).getTime() - Date.now();
      return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000;
    };

    const getDaysRemaining = (dateStr: string) => {
      const diff = new Date(dateStr).getTime() - Date.now();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days <= 0 ? t('Today', 'আজকে') : t(`${days}d left`, `${days} দিন বাকি`);
    };

    const handleCopyCode = (code: string) => {
      navigator.clipboard.writeText(code);
      showToast(t(`Copied "${code}" to clipboard!`, `"${code}" ক্লিপবোর্ডে কপি করা হয়েছে!`), 'success');
    };

    // Filter coupons
    const filteredCoupons = (coupons || []).filter(c => {
      if (couponStatusFilter !== 'all' && c.status !== couponStatusFilter) {
        return false;
      }
      if (couponSearchQuery.trim()) {
        const q = couponSearchQuery.trim().toLowerCase();
        const codeMatch = c.code.toLowerCase().includes(q);
        const catMatch = (c.applicableCategories || []).some(cat => cat.toLowerCase().includes(q));
        const notesMatch = (c.notes || '').toLowerCase().includes(q);
        if (!codeMatch && !catMatch && !notesMatch) return false;
      }
      return true;
    });

    return (
      <div className="space-y-8 text-left">
        {/* Header with Title and Create Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                <Ticket size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('Promotions & Coupons', 'প্রমোশন ও কুপন')}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('Create and manage store vouchers, discount rates, spend requirements, and usage limits.', 'স্টোরের ভাউচার, ডিসকাউন্ট হার, ন্যূনতম খরচ এবং ব্যবহারের সীমা তৈরি ও পরিচালনা করুন।')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              onClick={() => refreshView()}
              disabled={isFetchingCoupons}
              className="p-2.5 bg-white/5 text-gray-300 rounded-xl hover:bg-white/10 hover:text-white transition-all cursor-pointer border border-white/5"
              title={t('Refresh Coupons', 'কুপন রিফ্রেশ করুন')}
            >
              <RefreshCw size={16} className={isFetchingCoupons ? 'animate-spin text-brand-orange' : ''} />
            </button>
            <button 
              onClick={openCreateCouponModal}
              className="px-5 py-2.5 bg-brand-orange text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-orange-light transition-all shadow-lg shadow-brand-orange/20 cursor-pointer flex items-center gap-2"
            >
              <Plus size={16} />
              <span>{t('Create Coupon', 'কুপন তৈরি করুন')}</span>
            </button>
          </div>
        </div>

        {/* Storefront Coupon Code Box Master Toggle (OFF by default) */}
        <div className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          showCouponCode
            ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
            : 'bg-[#12121a] border-white/10'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${
              showCouponCode
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}>
              <Tag size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-sm font-black text-white uppercase tracking-tight">
                  {t('Storefront Coupon Code Box', 'স্টোরফ্রন্ট কুপন কোড বক্স')}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono ${
                  showCouponCode
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {showCouponCode ? t('ON (LIVE)', 'চালু (লাইভ)') : t('OFF (DEFAULT)', 'বন্ধ (ডিফল্ট)')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {t(
                  'Turn ON to display the "Enter Coupon Code" box on product details and checkout. Stays OFF by default.',
                  'চালু করলে প্রোডাক্ট পেজ এবং চেকআউটে "কুপন কোড লিখুন" বক্স দেখা যাবে। সাধারণ অবস্থায় এটি বন্ধ থাকে।'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isTogglingCouponBox}
            onClick={async () => {
              const nextVal = !showCouponCode;
              setShowCouponCode(nextVal);
              setIsTogglingCouponBox(true);
              try {
                await persistSiteConfig({ showCouponCode: nextVal });
                showToast(
                  nextVal
                    ? t('Coupon code box is now ON across the storefront.', 'স্টোরফ্রন্টে কুপন কোড বক্স এখন চালু হয়েছে।')
                    : t('Coupon code box is now OFF.', 'কুপন কোড বক্স এখন বন্ধ করা হয়েছে।'),
                  nextVal ? 'success' : 'info'
                );
              } catch {
                setShowCouponCode(!nextVal);
                showToast(t('Failed to update coupon box visibility.', 'কুপন বক্স সেটিংস আপডেট করা যায়নি।'), 'error');
              } finally {
                setIsTogglingCouponBox(false);
              }
            }}
            className={`w-14 h-8 rounded-full relative p-1 transition-colors duration-300 shrink-0 cursor-pointer disabled:opacity-60 ${
              showCouponCode ? 'bg-emerald-500' : 'bg-white/15'
            }`}
            aria-label="Toggle Storefront Coupon Code Box"
          >
            <motion.div
              className="w-6 h-6 bg-white rounded-full shadow-lg"
              animate={{ x: showCouponCode ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {/* Card 1: Active Coupons */}
          <div className="bg-[#12121a] border border-white/10 rounded-3xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('Active Coupons', 'সক্রিয় কুপন')}</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Ticket size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-white tracking-tight">{activeCouponsCount}</span>
              <span className="text-xs text-gray-400 ml-2 font-medium">/ {totalCouponsCount} {t('total', 'মোট')}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{t('Ready to redeem at checkout', 'চেকআউটে ব্যবহারের জন্য প্রস্তুত')}</p>
          </div>

          {/* Card 2: Total Discount Given */}
          <div className="bg-[#12121a] border border-white/10 rounded-3xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('Total Discount Given', 'মোট প্রদত্ত ছাড়')}</span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <DollarSign size={18} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-black text-white tracking-tight">৳{totalDiscountGiven.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{t('Accumulated customer savings', 'গ্রাহকদের মোট সাশ্রয়')}</p>
          </div>

          {/* Card 3: Most Used Coupon */}
          <div className="bg-[#12121a] border border-white/10 rounded-3xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('Most Used Coupon', 'সবচেয়ে বেশি ব্যবহৃত কুপন')}</span>
              <div className="w-9 h-9 rounded-xl bg-brand-orange/10 text-brand-orange flex items-center justify-center border border-brand-orange/20">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-3">
              {mostUsedCoupon && (mostUsedCoupon.usage || 0) > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-white font-mono tracking-wider">{mostUsedCoupon.code}</span>
                  <span className="text-xs font-bold text-brand-orange font-mono">({mostUsedCoupon.usage} {t('uses', 'বার')})</span>
                </div>
              ) : (
                <span className="text-2xl font-black text-gray-400">{t('None yet', 'এখনও কোনোটি নয়')}</span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{t('Top performing promotion', 'শীর্ষ কার্যকর প্রমোশন')}</p>
          </div>

          {/* Card 4: Expiring Soon */}
          <div className="bg-[#12121a] border border-white/10 rounded-3xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('Expiring Soon', 'শীঘ্রই মেয়াদ শেষ')}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                expiringSoonCount > 0 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                  : 'bg-white/5 text-gray-400 border-white/5'
              }`}>
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-3xl font-black text-white tracking-tight">{expiringSoonCount}</span>
              {expiringSoonCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {t('Ending in 7d', '৭ দিনে শেষ')}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">{t('Requires renewal or closure', 'নবায়ন বা বন্ধ করা প্রয়োজন')}</p>
          </div>
        </div>

        {/* Toolbar: Filter Tabs and Search Bar */}
        <div className="bg-[#12121a] border border-white/10 rounded-3xl p-4 md:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Filter Tabs with Unified FilterTabGroup */}
            <FilterTabGroup
              tabs={[
                { id: 'all', label: t('All Coupons', 'সব কুপন'), count: totalCouponsCount, badgeVariant: 'grey' },
                { id: 'active', label: t('Active', 'সক্রিয়'), count: activeCouponsCount, badgeVariant: 'green' },
                { id: 'scheduled', label: t('Scheduled', 'নির্ধারিত'), count: scheduledCouponsCount, badgeVariant: 'blue' },
                { id: 'expired', label: t('Expired', 'মেয়াদোত্তীর্ণ'), count: expiredCouponsCount, badgeVariant: 'amber' },
                { id: 'disabled', label: t('Disabled', 'নিষ্ক্রিয়'), count: disabledCouponsCount, badgeVariant: 'grey' },
              ]}
              activeTab={couponStatusFilter}
              onChange={(id) => setCouponStatusFilter(id as any)}
              ariaLabel={t('Coupons Status Filter', 'কুপন স্ট্যাটাস ফিল্টার')}
            />

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={couponSearchQuery}
                onChange={(e) => setCouponSearchQuery(e.target.value)}
                placeholder={t('Search by code, category...', 'কোড বা ক্যাটাগরি দিয়ে খুঁজুন...')}
                className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-orange transition-all"
              />
              {couponSearchQuery && (
                <button
                  onClick={() => setCouponSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Coupons Table / Grid */}
        <div className="bg-[#12121a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {isFetchingCoupons ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-gray-400">
                <Ticket size={28} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t('No coupons found', 'কোনো কুপন পাওয়া যায়নি')}</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  {couponSearchQuery || couponStatusFilter !== 'all'
                    ? t('No promotional coupons match the selected filter criteria.', 'নির্বাচিত ফিল্টারের সাথে কোনো কুপন মিলেনি।')
                    : t('Get started by creating your first promotional coupon campaign.', 'আপনার প্রথম প্রমোশনাল কুপন তৈরি করে শুরু করুন।')}
                </p>
              </div>
              <div>
                {couponSearchQuery || couponStatusFilter !== 'all' ? (
                  <button
                    onClick={() => {
                      setCouponSearchQuery('');
                      setCouponStatusFilter('all');
                    }}
                    className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/15 transition-all cursor-pointer"
                  >
                    {t('Clear Filters', 'ফিল্টার মুছুন')}
                  </button>
                ) : (
                  <button
                    onClick={openCreateCouponModal}
                    className="px-5 py-2.5 bg-brand-orange text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-orange-light transition-all shadow-lg cursor-pointer"
                  >
                    + {t('Create First Coupon', 'প্রথম কুপন তৈরি করুন')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5 text-gray-400 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-4 px-5">{t('Coupon Code', 'কুপন কোড')}</th>
                    <th className="py-4 px-5">{t('Discount', 'ছাড়')}</th>
                    <th className="py-4 px-5">{t('Usage / Limit', 'ব্যবহার / সীমা')}</th>
                    <th className="py-4 px-5">{t('Min. Spend', 'ন্যূনতম খরচ')}</th>
                    <th className="py-4 px-5">{t('Valid Period', 'মেয়াদকাল')}</th>
                    <th className="py-4 px-5">{t('Status', 'স্ট্যাটাস')}</th>
                    <th className="py-4 px-5 text-right">{t('Actions', 'অ্যাকশন')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-gray-300">
                  {filteredCoupons.map((coupon) => {
                    const isPercentage = coupon.discountType === 'percentage';
                    const usagePercent = coupon.usageLimit 
                      ? Math.min(100, Math.round(((coupon.usage || 0) / coupon.usageLimit) * 100))
                      : null;
                    const expiringSoon = isCouponExpiringSoon(coupon);

                    return (
                      <tr key={coupon.id} className="hover:bg-white/[0.02] transition-colors group">
                        {/* Coupon Code Column */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange shrink-0">
                              <Tag size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-sm text-white tracking-wider">
                                  {coupon.code}
                                </span>
                                <button
                                  onClick={() => handleCopyCode(coupon.code)}
                                  className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer"
                                  title={t('Copy coupon code', 'কুপন কোড কপি করুন')}
                                >
                                  <Copy size={13} />
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-gray-400">
                                  {coupon.applicableTo === 'category' && coupon.applicableCategories?.[0]
                                    ? `${t('Category', 'ক্যাটাগরি')}: ${translateCategory(coupon.applicableCategories[0])}`
                                    : t('All Products', 'সব পণ্য')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Discount Column */}
                        <td className="py-4 px-5">
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                              {isPercentage ? (
                                <>
                                  <Percent size={13} />
                                  <span>{coupon.discount}% {t('OFF', 'ছাড়')}</span>
                                </>
                              ) : (
                                <span>৳{Number(coupon.discount).toLocaleString()} {t('OFF', 'ছাড়')}</span>
                              )}
                            </span>
                            {isPercentage && coupon.maxDiscount && (
                              <span className="text-[10px] text-gray-400 font-mono">
                                {t('Max cap', 'সর্বোচ্চ সীমা')}: ৳{coupon.maxDiscount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Usage / Limit Column */}
                        <td className="py-4 px-5">
                          <div className="space-y-1 max-w-[140px]">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="font-bold text-white">{coupon.usage || 0}</span>
                              <span className="text-gray-400">
                                / {coupon.usageLimit ? coupon.usageLimit : '∞'}
                              </span>
                            </div>
                            {usagePercent !== null && (
                              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    usagePercent >= 90 ? 'bg-rose-500' : 'bg-brand-orange'
                                  }`} 
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            )}
                            <p className="text-[10px] text-gray-500">
                              {coupon.perCustomerLimit || 1} {t('per customer', 'প্রতি গ্রাহক')}
                            </p>
                          </div>
                        </td>

                        {/* Minimum Spend Column */}
                        <td className="py-4 px-5">
                          {coupon.minSpend ? (
                            <span className="font-mono font-bold text-gray-200">
                              ৳{coupon.minSpend.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">{t('None', 'নেই')}</span>
                          )}
                        </td>

                        {/* Valid Period Column */}
                        <td className="py-4 px-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-300">
                              <Calendar size={13} className="text-gray-500 shrink-0" />
                              <span>{formatCouponDate(coupon.validFrom)}</span>
                              <span className="text-gray-500">→</span>
                              <span>{formatCouponDate(coupon.validUntil)}</span>
                            </div>
                            {expiringSoon && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 w-fit">
                                <Clock size={10} /> {t('Expiring soon', 'শীঘ্রই শেষ')} ({getDaysRemaining(coupon.validUntil!)})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Column */}
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            coupon.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : coupon.status === 'scheduled'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : coupon.status === 'expired'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              coupon.status === 'active'
                                ? 'bg-emerald-400 animate-pulse'
                                : coupon.status === 'scheduled'
                                ? 'bg-sky-400'
                                : coupon.status === 'expired'
                                ? 'bg-amber-400'
                                : 'bg-zinc-400'
                            }`} />
                            {coupon.status === 'scheduled'
                              ? t('Scheduled', 'নির্ধারিত')
                              : coupon.status === 'expired'
                              ? t('Expired', 'মেয়াদোত্তীর্ণ')
                              : coupon.status === 'disabled'
                              ? t('Disabled', 'নিষ্ক্রিয়')
                              : t('Active', 'সক্রিয়')}
                          </span>
                        </td>

                        {/* Actions Column */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Active / Disabled */}
                            <button
                              onClick={() => handleToggleCouponStatus(coupon)}
                              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                                coupon.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:bg-white/10'
                              }`}
                              title={coupon.status === 'active' ? t('Click to Disable coupon', 'কুপন নিষ্ক্রিয় করতে ক্লিক করুন') : t('Click to Enable coupon', 'কুপন সক্রিয় করতে ক্লিক করুন')}
                            >
                              <Power size={14} />
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditCouponModal(coupon)}
                              className="p-2 bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl border border-white/5 transition-all cursor-pointer"
                              title={t('Edit Coupon', 'কুপন সম্পাদনা করুন')}
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeleteConfirmCoupon(coupon)}
                              className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                              title={t('Delete Coupon', 'কুপন মুছুন')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create / Edit Coupon Modal */}
        <AnimatePresence>
          {isCouponModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!isSavingCoupon) {
                    setIsCouponModalOpen(false);
                    resetCouponForm();
                  }
                }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="relative w-full max-w-2xl bg-[#16161d] border border-white/10 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl my-auto z-10 max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      {editingCoupon ? `${t('Edit Coupon', 'কুপন সম্পাদনা')}: ${editingCoupon.code}` : t('Create New Coupon', 'নতুন কুপন তৈরি করুন')}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('Configure discount rule, spend thresholds, and validity dates.', 'ডিসকাউন্ট নিয়ম, খরচের সীমা এবং মেয়াদের তারিখ কনফিগার করুন।')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsCouponModalOpen(false);
                      resetCouponForm();
                    }}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Real-time Voucher Live Preview Card */}
                <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-brand-orange/15 via-amber-600/10 to-transparent border border-brand-orange/20 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange font-mono">
                        {t('VOUCHER PREVIEW', 'ভাউচার প্রিভিউ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black font-mono text-white tracking-widest bg-black/40 px-3 py-1 rounded-lg border border-white/10">
                          {couponForm.code || 'COUPONCODE'}
                        </span>
                        <span className="text-xs font-black text-brand-orange">
                          {couponForm.discount 
                            ? (couponForm.discountType === 'percentage' ? `${couponForm.discount}% ${t('OFF', 'ছাড়')}` : `৳${Number(couponForm.discount).toLocaleString()} ${t('FLAT OFF', 'ফ্ল্যাট ছাড়')}`)
                            : t('0% OFF', '০% ছাড়')}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-300 space-y-0.5 text-left sm:text-right">
                      <p>
                        {couponForm.minSpend ? `${t('Min. spend', 'ন্যূনতম খরচ')} ৳${Number(couponForm.minSpend).toLocaleString()}` : t('No minimum spend', 'ন্যূনতম খরচ নেই')}
                        {couponForm.discountType === 'percentage' && couponForm.maxDiscount ? ` • ${t('Max cap', 'সর্বোচ্চ')} ৳${Number(couponForm.maxDiscount).toLocaleString()}` : ''}
                      </p>
                      <p className="text-gray-400 text-[10px]">
                        {couponForm.usageLimit ? `${t('Limit', 'সীমা')}: ${couponForm.usageLimit} ${t('uses', 'বার')}` : t('Unlimited uses', 'সীমাহীন ব্যবহার')} • {couponForm.validUntil ? `${t('Expires', 'মেয়াদ')}: ${couponForm.validUntil}` : t('No expiry date', 'মেয়াদহীন')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSaveCoupon} className="space-y-5 mt-6">
                  {/* Discount Type Toggle */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-xs font-bold text-gray-300">{t('Discount Type *', 'ডিসকাউন্টের ধরন *')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCouponForm(prev => ({ ...prev, discountType: 'percentage' }))}
                        className={`h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                          couponForm.discountType === 'percentage'
                            ? 'bg-brand-orange text-white border-brand-orange shadow-md'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                        }`}
                      >
                        <Percent size={14} />
                        <span>{t('Percentage (%)', 'শতাংশ (%)')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponForm(prev => ({ ...prev, discountType: 'fixed' }))}
                        className={`h-11 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                          couponForm.discountType === 'fixed'
                            ? 'bg-brand-orange text-white border-brand-orange shadow-md'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                        }`}
                      >
                        <DollarSign size={14} />
                        <span>{t('Fixed Amount (৳)', 'নির্দিষ্ট পরিমাণ (৳)')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 1: Code & Discount Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Coupon Code */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-300">
                        {t('Coupon Code *', 'কুপন কোড *')} <span className="text-gray-500 font-normal">{t('(auto uppercase)', '(স্বয়ংক্রিয় বড় হাতের অক্ষর)')}</span>
                      </label>
                      <input 
                        type="text"
                        required
                        placeholder={t('e.g. SUMMER50', 'যেমন SUMMER50')}
                        value={couponForm.code}
                        onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        className={`w-full bg-white/5 border rounded-xl h-11 px-4 text-white text-sm font-mono font-bold outline-none transition-all ${
                          couponFormErrors.code ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-brand-orange'
                        }`}
                      />
                      {couponFormErrors.code && (
                        <p className="text-[11px] text-rose-400 font-medium">{couponFormErrors.code}</p>
                      )}
                    </div>

                    {/* Discount Value */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-300">
                        {couponForm.discountType === 'percentage' ? t('Discount Percentage (1-100) *', 'ডিসকাউন্ট শতাংশ (১-১০০) *') : t('Fixed Discount Amount (৳) *', 'নির্দিষ্ট ডিসকাউন্ট (৳) *')}
                      </label>
                      <input 
                        type="number"
                        required
                        min="1"
                        max={couponForm.discountType === 'percentage' ? 100 : undefined}
                        placeholder={couponForm.discountType === 'percentage' ? t('e.g. 15', 'যেমন 15') : t('e.g. 250', 'যেমন 250')}
                        value={couponForm.discount}
                        onChange={(e) => setCouponForm(prev => ({ ...prev, discount: e.target.value }))}
                        className={`w-full bg-white/5 border rounded-xl h-11 px-4 text-white text-sm font-medium outline-none transition-all ${
                          couponFormErrors.discount ? 'border-rose-500 focus:border-rose-500' : 'border-white/10 focus:border-brand-orange'
                        }`}
                      />
                      {couponFormErrors.discount && (
                        <p className="text-[11px] text-rose-400 font-medium">{couponFormErrors.discount}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Minimum Spend & Maximum Discount Cap */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Minimum Spend */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-300">
                        {t('Minimum Spend (৳)', 'ন্যূনতম খরচ (৳)')} <span className="text-gray-500 font-normal">{t('(optional)', '(ঐচ্ছিক)')}</span>
                      </label>
                      <input 
                        type="number"
                        min="0"
                        placeholder={t('e.g. 1000', 'যেমন 1000')}
                        value={couponForm.minSpend}
                        onChange={(e) => setCouponForm(prev => ({ ...prev, minSpend: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-white text-sm font-medium outline-none focus:border-brand-orange transition-all"
                      />
                      <p className="text-[10px] text-gray-500">{t('Subtotal required for voucher to apply', 'ভাউচার প্রয়োগের জন্য প্রয়োজনীয় সাবটোটাল')}</p>
                    </div>

                    {/* Max Discount Cap */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-300">
                        {t('Max Discount Cap (৳)', 'সর্বোচ্চ ডিসকাউন্ট সীমা (৳)')} <span className="text-gray-500 font-normal">
                          {couponForm.discountType === 'percentage' ? t('(optional cap)', '(ঐচ্ছিক সীমা)') : t('(n/a for fixed)', '(নির্দিষ্টের জন্য প্রযোজ্য নয়)')}
                        </span>
                      </label>
                      <input 
                        type="number"
                        min="1"
                        disabled={couponForm.discountType === 'fixed'}
                        placeholder={couponForm.discountType === 'percentage' ? t('e.g. 500', 'যেমন 500') : t('Not applicable', 'প্রযোজ্য নয়')}
                        value={couponForm.discountType === 'percentage' ? couponForm.maxDiscount : ''}
                        onChange={(e) => setCouponForm(prev => ({ ...prev, maxDiscount: e.target.value }))}
                        className={`w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-white text-sm font-medium outline-none focus:border-brand-orange transition-all ${
                          couponForm.discountType === 'fixed' ? 'opacity-40 cursor-not-allowed' : ''
                        }`}
                      />
                      <p className="text-[10px] text-gray-500">{t('Limits maximum discount deduction', 'সর্বোচ্চ ডিসকাউন্ট কাটার পরিমাণ সীমাবদ্ধ করে')}</p>
                    </div>
                  </div>

                  {/* Row 3: Usage Limit & Per-Customer Limit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Total Usage Limit */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-300">
                        {t('Total Usage Limit', 'মোট ব্যবহারের সীমা')} <span className="text-gray-500 font-normal">{t('(optional)', '(ঐচ্ছিক)')}</span>
                      </label>
                      <input 
                        type="number"
                        min="1"
                        placeholder={t('e.g. 500 (blank = unlimited)', 'যেমন 500 (খালি = সীমাহীন)')}
                        value={couponForm.usageLimit}
                        onChange={(e) => setCouponForm(prev => ({ ...prev, usageLimit: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-white text-sm font-medium outline-none focus:border-brand-orange transition-all"
                      />
                    </div>

                    {/* Per-Customer Limit */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-300">
                        {t('Per-Customer Limit', 'প্রতি গ্রাহকের সীমা')}
                      </label>
                      <input 
                        type="number"
                        min="1"
                        placeholder="1"
                        value={couponForm.perCustomerLimit}
                        onChange={(e) => setCouponForm(prev => ({ ...prev, perCustomerLimit: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-white text-sm font-medium outline-none focus:border-brand-orange transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 4: Valid From & Valid Until */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Valid From */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-300">
                        {t('Valid From', 'কার্যকর শুরু')} <span className="text-gray-500 font-normal">{t('(optional)', '(ঐচ্ছিক)')}</span>
                      </label>
                      <input 
                        type="date"
                        value={couponForm.validFrom}
                        onChange={(e) => setCouponForm(prev => ({ ...prev, validFrom: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-white text-xs font-medium outline-none focus:border-brand-orange transition-all"
                      />
                    </div>

                    {/* Valid Until */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-300">
                        {t('Valid Until', 'মেয়াদ শেষ')} <span className="text-gray-500 font-normal">{t('(optional)', '(ঐচ্ছিক)')}</span>
                      </label>
                      <input 
                        type="date"
                        value={couponForm.validUntil}
                        onChange={(e) => setCouponForm(prev => ({ ...prev, validUntil: e.target.value }))}
                        className={`w-full bg-white/5 border rounded-xl h-11 px-4 text-white text-xs font-medium outline-none transition-all ${
                          couponFormErrors.validUntil ? 'border-rose-500' : 'border-white/10 focus:border-brand-orange'
                        }`}
                      />
                      {couponFormErrors.validUntil && (
                        <p className="text-[11px] text-rose-400 font-medium">{couponFormErrors.validUntil}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Applicable Products / Categories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-gray-300">{t('Applicable To', 'প্রযোজ্য ক্ষেত্র')}</label>
                      <select
                        value={couponForm.applicableTo}
                        onChange={(e) => setCouponForm(prev => ({ ...prev, applicableTo: e.target.value as any }))}
                        className="w-full bg-[#12121a] border border-white/10 rounded-xl h-11 px-4 text-white text-xs font-medium outline-none focus:border-brand-orange transition-all cursor-pointer"
                      >
                        <option value="all">{t('All Products (Storewide)', 'সব পণ্য (সম্পূর্ণ স্টোর)')}</option>
                        <option value="category">{t('Specific Category', 'নির্দিষ্ট ক্যাটাগরি')}</option>
                      </select>
                    </div>

                    {couponForm.applicableTo === 'category' && (
                      <div className="space-y-1.5 text-left">
                        <label className="text-xs font-bold text-gray-300">{t('Select Category', 'ক্যাটাগরি নির্বাচন করুন')}</label>
                        <select
                          value={couponForm.applicableCategory}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, applicableCategory: e.target.value }))}
                          className="w-full bg-[#12121a] border border-white/10 rounded-xl h-11 px-4 text-white text-xs font-medium outline-none focus:border-brand-orange transition-all cursor-pointer"
                        >
                          <option value="">{t('Choose a category...', 'একটি ক্যাটাগরি বেছে নিন...')}</option>
                          {CATEGORIES.filter(c => c !== 'All').map(cat => (
                            <option key={cat} value={cat}>{translateCategory(cat)}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Distribution Type Selection (Group 9) */}
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-gray-300">{t('Distribution Type *', 'বিতরণের ধরন *')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'all_users', label: t('All Users', 'সব ব্যবহারকারী'), desc: t('Automatically available to every customer', 'সব গ্রাহকের জন্য স্বয়ংক্রিয়ভাবে উপলব্ধ') },
                        { id: 'promo_code_only', label: t('Promo-Code-Only', 'শুধু প্রমো কোড'), desc: t('Unlocked only via code entry at checkout', 'চেকআউটে কোড দিলে সক্রিয় হবে') },
                        { id: 'targeted_users', label: t('Targeted Users', 'নির্দিষ্ট ব্যবহারকারী'), desc: t('Exclusive to specifically selected accounts', 'শুধুমাত্র নির্বাচিত অ্যাকাউন্টের জন্য') },
                      ].map((dt) => (
                        <button
                          key={dt.id}
                          type="button"
                          onClick={() => setCouponForm(prev => ({ ...prev, distributionType: dt.id as any }))}
                          className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                            couponForm.distributionType === dt.id
                              ? 'bg-brand-orange/15 border-brand-orange text-white ring-1 ring-brand-orange/50'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-black text-white">{dt.label}</p>
                            <span className={`w-2 h-2 rounded-full ${couponForm.distributionType === dt.id ? 'bg-brand-orange animate-pulse' : 'bg-gray-600'}`} />
                          </div>
                          <p className="text-[10px] text-gray-400 leading-tight">{dt.desc}</p>
                        </button>
                      ))}
                    </div>

                    {couponForm.distributionType === 'targeted_users' && (
                      <div className="p-3.5 bg-black/40 border border-brand-orange/30 rounded-2xl space-y-2.5 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase text-brand-orange tracking-wider">
                            {t('Targeted Customer Accounts', 'নির্বাচিত গ্রাহক অ্যাকাউন্ট')} ({couponForm.targetedUserIds?.length || 0} {t('selected', 'নির্বাচিত')})
                          </span>
                          {couponForm.targetedUserIds && couponForm.targetedUserIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setCouponForm(prev => ({ ...prev, targetedUserIds: [] }))}
                              className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
                            >
                              {t('Deselect All', 'সব বাতিল করুন')}
                            </button>
                          )}
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                          {(users || []).map(u => {
                            const isSelected = couponForm.targetedUserIds?.includes(u.id);
                            return (
                              <label
                                key={u.id}
                                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                                  isSelected ? 'bg-brand-orange/10 border-brand-orange/40 text-white' : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isSelected || false}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setCouponForm(prev => ({
                                        ...prev,
                                        targetedUserIds: checked
                                          ? [...(prev.targetedUserIds || []), u.id]
                                          : (prev.targetedUserIds || []).filter(id => id !== u.id)
                                      }));
                                    }}
                                    className="accent-brand-orange rounded cursor-pointer"
                                  />
                                  <span className="font-bold text-white truncate">{u.name || t('Shopper', 'ক্রেতা')}</span>
                                  <span className="text-[10px] text-gray-400 font-mono truncate">{u.email}</span>
                                </div>
                                {isSelected && (
                                  <span className="text-[9px] font-bold text-brand-orange px-1.5 py-0.5 rounded bg-brand-orange/20 shrink-0">{t('Selected', 'নির্বাচিত')}</span>
                                )}
                              </label>
                            );
                          })}
                          {(!users || users.length === 0) && (
                            <p className="text-xs text-gray-500 py-2">{t('No registered customer profiles found.', 'কোনো নিবন্ধিত গ্রাহক প্রোফাইল পাওয়া যায়নি।')}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl">
                    <div>
                      <h4 className="text-xs font-bold text-white">{t('Coupon Status', 'কুপন স্ট্যাটাস')}</h4>
                      <p className="text-[11px] text-gray-400">
                        {couponForm.status === 'active' 
                          ? t('Coupon will be immediately active and usable by shoppers.', 'কুপনটি সাথে সাথেই সক্রিয় হবে এবং ক্রেতারা ব্যবহার করতে পারবেন।') 
                          : t('Coupon will be saved as disabled draft.', 'কুপনটি নিষ্ক্রিয় খসড়া হিসেবে সংরক্ষিত হবে।')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCouponForm(prev => ({ ...prev, status: prev.status === 'active' ? 'disabled' : 'active' }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                        couponForm.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
                      }`}
                    >
                      {couponForm.status === 'active' ? t('Active', 'সক্রিয়') : t('Disabled', 'নিষ্ক্রিয়')}
                    </button>
                  </div>

                  {/* Submit & Cancel Buttons */}
                  <div className="flex gap-3 pt-3 border-t border-white/10">
                    <button 
                      type="submit"
                      disabled={isSavingCoupon}
                      className="flex-1 h-12 bg-brand-orange text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-orange-light transition-all shadow-lg shadow-brand-orange/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingCoupon ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>{t('Saving Coupon...', 'কুপন সংরক্ষণ হচ্ছে...')}</span>
                        </>
                      ) : (
                        <span>{editingCoupon ? t('Save Changes', 'পরিবর্তন সংরক্ষণ করুন') : t('Create Coupon', 'কুপন তৈরি করুন')}</span>
                      )}
                    </button>
                    <button 
                      type="button"
                      disabled={isSavingCoupon}
                      onClick={() => {
                        setIsCouponModalOpen(false);
                        resetCouponForm();
                      }}
                      className="px-6 h-12 bg-white/5 text-gray-400 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 hover:text-white transition-all cursor-pointer border border-white/5"
                    >
                      {t('Cancel', 'বাতিল')}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirmCoupon && (
            <div className="fixed inset-0 z-[1050] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDeleteConfirmCoupon(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md bg-[#16161d] border border-white/10 rounded-3xl p-6 text-center space-y-4 shadow-2xl z-10"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{t('Delete Coupon?', 'কুপন মুছবেন?')}</h3>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {t('Are you sure you want to permanently delete coupon', 'আপনি কি স্থায়ীভাবে এই কুপনটি মুছে ফেলতে চান:')}{' '}
                    <span className="font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">
                      {deleteConfirmCoupon.code}
                    </span>?
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {t('Customers will no longer be able to apply this promotional code at checkout.', 'গ্রাহকরা চেকআউটে আর এই প্রমোশনাল কোডটি ব্যবহার করতে পারবেন না।')}
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleDeleteCoupon(deleteConfirmCoupon.id)}
                    className="flex-1 h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer"
                  >
                    {t('Delete Permanently', 'স্থায়ীভাবে মুছুন')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirmCoupon(null)}
                    className="flex-1 h-11 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const handleToggleMaintenance = async () => {
    try {
      const nextVal = !maintenanceMode;
      setMaintenanceMode(nextVal);
      await configApi.updateConfig({ maintenanceMode: nextVal });
      showToast(nextVal ? t('Maintenance mode is now ACTIVE (Offline)', 'রক্ষণাবেক্ষণ মোড এখন সক্রিয় (অফলাইন)') : t('Maintenance mode is now INACTIVE (Live)', 'রক্ষণাবেক্ষণ মোড এখন নিষ্ক্রিয় (লাইভ)'), nextVal ? 'warning' : 'success');
    } catch (e) {
      showToast(t('Failed to update maintenance protocol', 'রক্ষণাবেক্ষণ প্রোটোকল আপডেট করা যায়নি'), 'error');
    }
  };

  const handleDeployAnnouncement = async () => {
    try {
      await configApi.updateConfig({ 
        announcementText, 
        announcementActive 
      });
      showToast(t('Announcement layout broadcast updated successfully!', 'ঘোষণা ব্যানার সফলভাবে আপডেট হয়েছে!'), 'success');
    } catch (e) {
      showToast(t('Failed to update announcement broadcast', 'ঘোষণা সম্প্রচার আপডেট করা যায়নি'), 'error');
    }
  };

  const handleLocalBannerChange = (idx: number, updatedField: any) => {
    const list = [...banners];
    // fallback initialization if list doesn't have 3 elements
    while (list.length <= idx) {
      list.push({
        title: t('New Slider Heading', 'নতুন স্লাইডার শিরোনাম'),
        subtitle: t('Promotional secondary text.', 'প্রমোশনাল বিবরণ।'),
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600',
        badge: t('Promo', 'প্রমো'),
        cta: t('Explore Now', 'এখনই দেখুন'),
        color: 'from-zinc-900/70',
        targetUrl: '/category/all'
      });
    }
    list[idx] = { ...list[idx], ...updatedField };
    setBanners(list);
  };

  const handlePersistBanner = async (idx: number) => {
    try {
      const list = [...banners];
      // fallback initialization if list doesn't have 3 elements
      while (list.length <= idx) {
        list.push({
          title: t('New Slider Heading', 'নতুন স্লাইডার শিরোনাম'),
          subtitle: t('Promotional secondary text.', 'প্রমোশনাল বিবরণ।'),
          image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600',
          badge: t('Promo', 'প্রমো'),
          cta: t('Explore Now', 'এখনই দেখুন'),
          color: 'from-zinc-900/70',
          targetUrl: '/category/all'
        });
      }
      await configApi.updateConfig({ banners: list });
      showToast(t(`Homepage Banner ${idx + 1} updated and synchronized!`, `ব্যানার ${idx + 1} সফলভাবে সেভ ও সিঙ্ক করা হয়েছে!`), 'success');
    } catch (e) {
      showToast(t('Failed to write homepage banner to database', 'হোমপেজ ব্যানার ডাটাবেসে সেভ করা যায়নি'), 'error');
    }
  };

  const renderSettings = () => {
    return (
      <div className="space-y-8 text-left">
        <SiteMasterControl onShowToast={showToast} />
      </div>
    );
  };

  const _legacyRenderSettings = () => {
    // ensure fallback banners exist for inputs
    const displayBanners = banners.length >= 3 ? banners : [
      { title: 'Fast Fashion Trends', subtitle: 'Explore our latest clothing collection in-store. Premium quality at affordable prices.', image: 'https://img.freepik.com/free-photo/fast-fashion-concept-with-full-clothing-store_23-2150871300.jpg?semt=ais_hybrid&w=740&q=80', badge: 'New Trends', cta: 'Shop Collection', color: 'from-orange-900/70', targetUrl: '/category/fashions' },
      { title: 'Premium Mall Experience', subtitle: 'Discover a world of luxury brands and cinematic shopping environments.', image: 'https://img.freepik.com/free-photo/cinematic-style-mall_23-2151551173.jpg?semt=ais_hybrid&w=740&q=80', badge: 'Exclusive Access', cta: 'Explore Mall', color: 'from-blue-900/70', targetUrl: '/category/all' },
      { title: 'Black Friday Deals', subtitle: 'Premium shopping experience with mega discounts on top brands. Don\'t miss out!', image: 'https://img.freepik.com/free-photo/black-friday-sales-sign-neon-light_23-2151833112.jpg?semt=ais_hybrid&w=740&q=80', badge: 'Flash Sale', cta: 'Shop Now', color: 'from-black/70', targetUrl: '/category/all' }
    ];

    return (
      <div className="space-y-12 text-left">
          {/* Title block */}
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{t('Core Configuration', 'সিস্টেম কনফিগারেশন')}</h2>
            <p className="text-xs text-white/40 font-mono tracking-wider mt-1.55">
              {t('Admin CMS Console. Direct control over homepage sliders, public announcements, and database maintenance protocols.', 'অ্যাডমিন সিএমএস কনসোল। হোমপেজ স্লাইডার, ঘোষণা এবং রক্ষণাবেক্ষণ প্রোটোকল সরাসরি নিয়ন্ত্রণ করুন।')}
            </p>
          </div>

          {/* Banner Management Grid */}
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[48px] space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
               <div>
                 <h3 className="text-xl font-black text-white uppercase flex items-center gap-3">
                   <Sparkles className="text-brand-orange animate-pulse" size={24} /> {t('Carousel Banner Displays', 'ক্যারোসেল ব্যানার ডিসপ্লে')}
                 </h3>
                 <p className="text-xs text-white/40 mt-1">{t('Configure active dynamic hero slide decks on the store homepage.', 'স্টোরের হোমপেজে সক্রিয় হিরো স্লাইডারগুলো কনফিগার করুন।')}</p>
               </div>
               <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/12">
                 {t('Active Blocks', 'সক্রিয় ব্লক')}: {displayBanners.length}
               </span>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {displayBanners.map((b, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-[40px] p-6 hover:bg-white/[0.03] transition-all flex flex-col justify-between relative overflow-hidden group">
                     {/* Preview Card */}
                     <div className="space-y-4">
                       <span className="text-[10px] font-mono uppercase tracking-widest bg-brand-orange/20 text-brand-orange border border-brand-orange/20 px-3 py-1 rounded-full font-black">
                         {t('Banner Slot', 'ব্যানার স্লট')} {idx + 1}
                       </span>

                       <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/5 relative bg-zinc-900 group">
                          {b.image ? (
                            <img src={b.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={b.title ? `${t('Banner', 'ব্যানার')}: ${b.title}` : t('Store banner preview', 'স্টোর ব্যানার প্রিভিউ')} referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20 text-xs font-mono">{t('No Image Defined', 'কোনো ছবি দেওয়া হয়নি')}</div>
                          )}
                          <div className={`absolute inset-0 bg-gradient-to-t ${b.color || 'from-black/70'} to-transparent flex flex-col justify-end p-4 text-left`}>
                             <span className="text-[8px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-lg w-max font-bold mb-1">{b.badge || t('PROMO', 'প্রমো')}</span>
                             <h4 className="text-sm font-black text-white uppercase tracking-tight">{b.title || t('Untitled Banner Header', 'শিরোনামহীন ব্যানার')}</h4>
                             <p className="text-[8px] text-white/70 line-clamp-1 mt-0.5">{b.subtitle || t('Promotional description content and deals.', 'প্রমোশনাল বিবরণ ও ডিল।')}</p>
                          </div>
                       </div>

                       {/* Interactive Inputs */}
                       <div className="space-y-3.5 pt-2">
                          <div>
                            <label className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">{t('Slide Banner Title', 'স্লাইড ব্যানার শিরোনাম')}</label>
                            <input 
                              type="text" 
                              value={b.title || ''} 
                              onChange={(e) => handleLocalBannerChange(idx, { title: e.target.value })}
                              placeholder={t('e.g. Black Friday Deals', 'যেমন: ব্ল্যাক ফ্রাইডে ডিলস')} 
                              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-brand-orange transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">{t('Slide Subtitle / Description', 'স্লাইড সাবটাইটেল / বিবরণ')}</label>
                            <input 
                              type="text" 
                              value={b.subtitle || ''} 
                              onChange={(e) => handleLocalBannerChange(idx, { subtitle: e.target.value })}
                              placeholder={t('e.g. Best styles 50% discount', 'যেমন: সেরা স্টাইলে ৫০% ছাড়')} 
                              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-brand-orange transition-all"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">{t('Badge Pill text', 'ব্যাজ টেক্সট')}</label>
                              <input 
                                type="text" 
                                value={b.badge || ''} 
                                onChange={(e) => handleLocalBannerChange(idx, { badge: e.target.value })}
                                placeholder={t('e.g. FLASH SALE', 'যেমন: ফ্ল্যাশ সেল')} 
                                className="w-full bg-[#111116] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-brand-orange"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">{t('Button CTA Text', 'বাটন টেক্সট')}</label>
                              <input 
                                type="text" 
                                value={b.cta || ''} 
                                onChange={(e) => handleLocalBannerChange(idx, { cta: e.target.value })}
                                placeholder={t('Shop Now', 'এখনই কিনুন')} 
                                className="w-full bg-[#111116] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white outline-none focus:border-brand-orange"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-0.5 block">{t('Banner Image Source', 'ব্যানার ছবির উৎস (মোবাইল বা কম্পিউটার থেকে ছবি দিন)')}</label>
                            
                            {/* Custom File Upload Button */}
                            <div className="border border-dashed border-white/10 hover:border-brand-orange/40 rounded-xl p-3 bg-white/[0.02] flex items-center justify-between gap-3 transition-all relative group/uploader">
                              <div className="flex items-center gap-2">
                                <span className="p-2 bg-white/5 rounded-lg text-white/40 group-hover/uploader:text-brand-orange transition-colors">
                                  <Image size={14} />
                                </span>
                                <div className="text-left">
                                  <span className="text-[9px] font-black text-white uppercase block">{t('Upload Local Image', 'ছবি আপলোড করুন')}</span>
                                  <span className="text-[8px] text-white/30 font-mono block">{t('Max size: 10MB (Auto-compressed for fast loading)', 'সর্বোচ্চ: ১০ মেগাবাইট (স্বয়ংক্রিয়ভাবে কম্প্রেসড হবে)')}</span>
                                </div>
                              </div>
                              <label className="cursor-pointer bg-white/5 hover:bg-brand-orange text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border border-white/5 hover:border-transparent transition-all">
                                {t('Choose File', 'ফাইল বাছুন')}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const file = e.target.files[0];
                                      if (file.size > 10 * 1024 * 1024) {
                                        showToast(t('Error: Image fits standard limit up to 10MB only.', 'ভুল: ছবি ১০ মেগাবাইটের চেয়ে বড় হতে পারবে না।'), 'error');
                                        return;
                                      }
                                      
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const img = new window.Image();
                                        img.onload = () => {
                                          const canvas = document.createElement('canvas');
                                          let width = img.width;
                                          let height = img.height;
                                          
                                          // Keep high quality display while compacting oversized uploads
                                          const MAX_WIDTH = 1200;
                                          const MAX_HEIGHT = 1200;
                                          if (width > height) {
                                            if (width > MAX_WIDTH) {
                                              height = Math.round((height * MAX_WIDTH) / width);
                                              width = MAX_WIDTH;
                                            }
                                          } else {
                                            if (height > MAX_HEIGHT) {
                                              width = Math.round((width * MAX_HEIGHT) / height);
                                              height = MAX_HEIGHT;
                                            }
                                          }
                                          
                                          canvas.width = width;
                                          canvas.height = height;
                                          const ctx = canvas.getContext('2d');
                                          if (ctx) {
                                            ctx.drawImage(img, 0, 0, width, height);
                                            // quality is 0.75 - looks pristine and keeps payload compact
                                            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
                                            handleLocalBannerChange(idx, { image: compressedBase64 });
                                            showToast(t('Image successfully processed up to 10MB!', 'ছবি সফলভাবে প্রসেস ও কম্প্রেসড করা হয়েছে।'), 'success');
                                          } else {
                                            handleLocalBannerChange(idx, { image: event.target?.result as string });
                                          }
                                        };
                                        img.src = event.target?.result as string;
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            <input 
                              type="text" 
                              value={b.image || ''} 
                              onChange={(e) => handleLocalBannerChange(idx, { image: e.target.value })}
                              placeholder={t('Or paste an external image URL (https://...)', 'অথবা বাইরের ছবির URL দিন (https://...)')} 
                              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-mono text-white/70 placeholder-white/20 outline-none focus:border-brand-orange transition-all"
                            />
                          </div>

                          <div>
                            <label className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">{t('CTA Target Router link', 'বাটন টার্গেট লিংক')}</label>
                            <input 
                              type="text" 
                              value={b.targetUrl || ''} 
                              onChange={(e) => handleLocalBannerChange(idx, { targetUrl: e.target.value })}
                              placeholder="e.g. /category/Fashions" 
                              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono text-white outline-none focus:border-brand-orange"
                            />
                          </div>

                          <div>
                            <label className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1.5 block">{t('Overlay Gradient Color Class', 'ওভারলে গ্রেডিয়েন্ট রঙ')}</label>
                            <select 
                              value={b.color || 'from-black/70'} 
                              onChange={(e) => handleLocalBannerChange(idx, { color: e.target.value })}
                              className="w-full bg-[#111116] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-brand-orange"
                            >
                              <option value="from-orange-950/80">{t('Rustic Orange Gradient', 'রাস্টিক অরেঞ্জ গ্রেডিয়েন্ট')}</option>
                              <option value="from-blue-950/80">{t('Nordic Cobalt Gradient', 'নর্ডিক কোবাল্ট গ্রেডিয়েন্ট')}</option>
                              <option value="from-emerald-950/80">{t('Emerald Jade Gradient', 'এমেরাল্ড জেড গ্রেডিয়েন্ট')}</option>
                              <option value="from-rose-950/80">{t('Rose Sunset Gradient', 'রোজ সানসেট গ্রেডিয়েন্ট')}</option>
                              <option value="from-zinc-950/90">{t('Deep Charcoal / Noir', 'ডিপ চারকোল / নয়ার')}</option>
                              <option value="from-black/70">{t('Absolute Void Pitch', 'গাঢ় কালো')}</option>
                            </select>
                          </div>
                       </div>
                     </div>

                     <div className="mt-6 pt-4 border-t border-white/5">
                        <button
                          onClick={() => handlePersistBanner(idx)}
                          className="w-full py-3 bg-brand-orange hover:bg-brand-orange-light text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center justify-center gap-1.5 shadow-lg shadow-brand-orange/20 active:scale-95"
                        >
                          <Check size={13} className="stroke-[3]" /> {t('Save Banner Settings', 'স্লাইডার সংরক্ষণ করুন')}
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Maintenance Block */}
             <div className="bg-white/5 border border-white/10 p-10 rounded-[48px] flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-white uppercase mb-3 flex items-center gap-2.5">
                    <ShieldAlert className="text-rose-500" size={24} /> {t('Maintenance Protocol', 'রক্ষণাবেক্ষণ প্রোটোকল')}
                  </h3>
                  <p className="text-xs text-white/40 font-mono tracking-wider leading-relaxed mb-8">
                    {t('Toggle the entire store database instance into safe mode offline. Users will be met with a beautiful placeholder maintenance gate while you operate. Admins bypass this block automatically via credentials.', 'পুরো স্টোরটি নিরাপদ অফলাইন মোডে নিয়ে যান। রক্ষণাবেক্ষণের সময় গ্রাহকরা একটি রক্ষণাবেক্ষণ পর্দা দেখতে পাবেন, তবে অ্যাডমিনরা প্রবেশ করতে পারবেন।')}
                  </p>
                </div>

                <div className={`p-6 rounded-3xl border transition-all duration-300 flex items-center justify-between ${maintenanceMode ? 'bg-rose-500/10 border-rose-500/30 shadow-lg shadow-rose-500/5' : 'bg-white/5 border-white/10'}`}>
                   <div className="text-left">
                     <span className="text-xs font-black text-white uppercase block">{t('System Broadcast State', 'সিস্টেম ব্রডকাস্ট অবস্থা')}</span>
                     <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                       {t('Currently', 'বর্তমানে')}: {maintenanceMode ? t('OFFLINE MAINTENANCE ACTIVE', 'অফলাইন রক্ষণাবেক্ষণ সক্রিয়') : t('LIVE PRODUCTION ONLINE', 'লাইভ প্রোডাকশন অনলাইন')}
                     </span>
                   </div>
                   <button 
                     onClick={handleToggleMaintenance}
                     className={`w-14 h-8 rounded-full relative p-1 transition-colors duration-300 ${maintenanceMode ? 'bg-rose-500' : 'bg-white/10'}`}
                   >
                     <motion.div 
                       layout 
                       className="w-6 h-6 bg-white rounded-full shadow-md"
                       animate={{ x: maintenanceMode ? 24 : 0 }}
                       transition={{ type: "spring", stiffness: 500, damping: 30 }}
                     />
                   </button>
                </div>
             </div>

             {/* Announcement settings */}
             <div className="bg-white/5 border border-white/10 p-10 rounded-[48px] flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-black text-white uppercase mb-3 flex items-center gap-2.5">
                    <Clock className="text-emerald-400" size={24} /> {t('Global Announcements', 'বৈশ্বিক ঘোষণা')}
                  </h3>
                  <p className="text-xs text-white/40 font-mono leading-relaxed mb-6">
                    {t('Advertise special discount codes, delivery notices, or urgent service updates on a public active banner on the main template layout.', 'মূল টেমপ্লেট লেআউটের সক্রিয় ব্যানারে বিশেষ ডিসকাউন্ট কোড, ডেলিভারি নোটিশ বা জরুরি আপডেট প্রচার করুন।')}
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-[#111116] border border-white/5 rounded-2xl">
                      <span className="text-[10px] font-black uppercase text-white/70">{t('Render Active Status', 'সক্রিয় অবস্থা দেখান')}</span>
                      <button 
                        onClick={() => setAnnouncementActive(!announcementActive)}
                        className={`w-12 h-6 rounded-full relative p-0.5 transition-colors duration-200 ${announcementActive ? 'bg-emerald-500' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          layout 
                          className="w-5 h-5 bg-white rounded-full"
                          animate={{ x: announcementActive ? 24 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>

                    <textarea 
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder={t('e.g. Grand Eid Sale! Use Code: EID50 to enjoy 15% flat cashback and free standard home dispatch across Bangladesh.', 'যেমন: গ্র্যান্ড ঈদ সেল! ১৫% ক্যাশব্যাক ও ফ্রি হোম ডেলিভারির জন্য কোড EID50 ব্যবহার করুন।')}
                      className="w-full bg-[#111116] border border-white/10 rounded-3xl p-5 text-xs font-bold text-white placeholder-white/20 outline-none focus:border-brand-orange h-32"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleDeployAnnouncement}
                  className="w-full py-4 mt-6 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest font-mono shadow-xl shadow-emerald-500/10 transition-all"
                >
                  {t('Deploy Broadcast Layout', 'ঘোষণা লেআউট প্রকাশ করুন')}
                </button>
             </div>
          </div>
      </div>
    );
  };

  const renderFlashSales = () => {
    const listProducts = Array.isArray(products) ? products : [];
    const allInventoryProducts = listProducts.filter(p => !p.isDeleted);
    const flashProducts = allInventoryProducts.filter(p => !!p.isFlashSale);
    const totalFlashItems = flashProducts.length;
    
    const totalDiscountPercent = flashProducts.reduce((sum, p) => {
      const orig = p.normalPriceBeforeFlash || p.originalPrice || p.price;
      const disc = orig && orig > p.price ? Math.round(((orig - p.price) / orig) * 100) : 0;
      return sum + disc;
    }, 0);
    const avgFlashDiscount = totalFlashItems > 0 ? Math.round(totalDiscountPercent / totalFlashItems) : 0;

    const tabFilteredProducts = flashSaleViewTab === 'promoted' ? flashProducts : allInventoryProducts;

    const filteredFlashInventory = tabFilteredProducts.filter(p => {
      if (!flashSaleSearchQuery.trim()) return true;
      const q = flashSaleSearchQuery.trim().toLowerCase();
      return (
        p.name.toLowerCase().includes(q) || 
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.seller?.name && p.seller.name.toLowerCase().includes(q)) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    });

    const isTimerInPast = !!(flashTimerTargetDate && new Date(flashTimerTargetDate).getTime() <= Date.now());

    // Two-way linked timer changes
    const handleTargetDateChange = (val: string) => {
      setFlashTimerTargetDate(val);
      if (!val) return;
      const targetMs = new Date(val).getTime();
      if (isNaN(targetMs)) return;
      const diff = targetMs - Date.now();
      if (diff > 0) {
        const totalSecs = Math.floor(diff / 1000);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        setFlashTimerHours(h);
        setFlashTimerMinutes(m);
        setFlashTimerSeconds(s);
      } else {
        setFlashTimerHours(0);
        setFlashTimerMinutes(0);
        setFlashTimerSeconds(0);
      }
    };

    const handleHmsChange = (h: number, m: number, s: number) => {
      const safeH = Math.max(0, h);
      const safeM = Math.max(0, Math.min(59, m));
      const safeS = Math.max(0, Math.min(59, s));
      setFlashTimerHours(safeH);
      setFlashTimerMinutes(safeM);
      setFlashTimerSeconds(safeS);

      const totalMs = (safeH * 3600 + safeM * 60 + safeS) * 1000;
      if (totalMs > 0) {
        const newTarget = new Date(Date.now() + totalMs);
        setFlashTimerTargetDate(formatToLocalDateTimeString(newTarget));
      }
    };

    const handlePresetTimer = (hoursToAdd: number) => {
      const newTarget = new Date(Date.now() + hoursToAdd * 3600 * 1000);
      setFlashTimerTargetDate(formatToLocalDateTimeString(newTarget));
      setFlashTimerHours(hoursToAdd);
      setFlashTimerMinutes(0);
      setFlashTimerSeconds(0);
    };

    const handleUpdateFlashTimer = async () => {
      try {
        if (!flashTimerTargetDate) {
          showToast(t('Please select a campaign expiry date and time.', 'অনুগ্রহ করে ক্যাম্পেইনের মেয়াদ শেষের তারিখ ও সময় নির্বাচন করুন।'), 'error');
          return;
        }
        const targetMs = new Date(flashTimerTargetDate).getTime();
        if (isNaN(targetMs)) {
          showToast(t('Invalid expiry date format.', 'মেয়াদের তারিখের ফরম্যাট সঠিক নয়।'), 'error');
          return;
        }
        const diff = targetMs - Date.now();
        if (diff <= 0) {
          showToast(t('Selected date/time is in the past! Please set a future expiry time.', 'নির্বাচিত তারিখ/সময় অতীতে! অনুগ্রহ করে ভবিষ্যতের সময় নির্ধারণ করুন।'), 'error');
          return;
        }

        const totalSecs = Math.floor(diff / 1000);
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;
        const targetIso = new Date(targetMs).toISOString();

        setIsSavingTimer(true);
        await configApi.updateConfig({
          flashSaleHours: h,
          flashSaleMinutes: m,
          flashSaleSeconds: s,
          flashSaleTargetDate: targetIso
        });

        setSavedTargetDate(targetIso);
        setFlashTimerHours(h);
        setFlashTimerMinutes(m);
        setFlashTimerSeconds(s);

        const updatedConfigPayload = {
          flashSaleHours: h,
          flashSaleMinutes: m,
          flashSaleSeconds: s,
          flashSaleTargetDate: targetIso
        };

        try {
          const savedConfig = localStorage.getItem('elora-config');
          const parsedConfig = savedConfig ? JSON.parse(savedConfig) : {};
          localStorage.setItem('elora-config', JSON.stringify({ ...parsedConfig, ...updatedConfigPayload }));
        } catch {}

        window.dispatchEvent(new CustomEvent('elora-config-updated', { detail: updatedConfigPayload }));
        window.dispatchEvent(new Event('storage'));

        showToast(t('Flash Sale countdown timer saved & synced with storefront!', 'ফ্ল্যাশ সেল কাউন্টডাউন টাইমার সেভ এবং স্টোরফ্রন্টের সাথে সিঙ্ক করা হয়েছে!'), 'success');
      } catch (e) {
        console.error('Failed to sync timer:', e);
        showToast(t('Failed to save countdown timer.', 'কাউন্টডাউন টাইমার সংরক্ষণ করা যায়নি।'), 'error');
      } finally {
        setIsSavingTimer(false);
      }
    };

    const handleOpenAddFlashModal = (productToEdit?: Product) => {
      setFlashFormError(null);
      if (productToEdit) {
        setSelectedFlashProductId(productToEdit.id);
        const origPrice = productToEdit.normalPriceBeforeFlash || productToEdit.originalPrice || productToEdit.price;
        const currentFlashPrice = productToEdit.isFlashSale ? productToEdit.price : Math.round(origPrice * 0.8);
        const disc = origPrice > currentFlashPrice ? Math.round(((origPrice - currentFlashPrice) / origPrice) * 100) : 20;

        setFlashModalMode(productToEdit.isFlashSale ? 'edit' : 'add');
        setFlashDiscountPercent(disc);
        setFlashSalePriceInput(currentFlashPrice);
        setFlashSaleStockInput(productToEdit.flashSaleStock || Math.min(productToEdit.stock || 50, 20));
        setFlashSaleStartDateInput(productToEdit.flashSaleStartDate || formatToLocalDateTimeString(new Date()));
        setFlashSaleEndDateInput(
          productToEdit.flashSaleEndDate || 
          (flashTimerTargetDate && new Date(flashTimerTargetDate).getTime() > Date.now() 
            ? flashTimerTargetDate 
            : formatToLocalDateTimeString(new Date(Date.now() + 24 * 3600 * 1000)))
        );
      } else {
        const candidate = allInventoryProducts.find(p => !p.isFlashSale) || allInventoryProducts[0];
        if (candidate) {
          setSelectedFlashProductId(candidate.id);
          const origPrice = candidate.normalPriceBeforeFlash || candidate.originalPrice || candidate.price;
          const defaultPrice = Math.round(origPrice * 0.8);
          setFlashDiscountPercent(20);
          setFlashSalePriceInput(defaultPrice);
          setFlashSaleStockInput(Math.min(candidate.stock || 50, 20));
        } else {
          setSelectedFlashProductId('');
          setFlashDiscountPercent(20);
          setFlashSalePriceInput(0);
          setFlashSaleStockInput(20);
        }
        setFlashModalMode('add');
        setFlashSaleStartDateInput(formatToLocalDateTimeString(new Date()));
        setFlashSaleEndDateInput(
          flashTimerTargetDate && new Date(flashTimerTargetDate).getTime() > Date.now() 
            ? flashTimerTargetDate 
            : formatToLocalDateTimeString(new Date(Date.now() + 24 * 3600 * 1000))
        );
      }
      setIsFlashItemModalOpen(true);
    };

    const handleSelectProductInModal = (prodId: string) => {
      setSelectedFlashProductId(prodId);
      setFlashFormError(null);
      const prod = allInventoryProducts.find(p => p.id === prodId);
      if (!prod) return;
      const origPrice = prod.normalPriceBeforeFlash || prod.originalPrice || prod.price;

      if (prod.isFlashSale) {
        const curPrice = prod.price;
        const disc = origPrice > curPrice ? Math.round(((origPrice - curPrice) / origPrice) * 100) : 20;
        setFlashDiscountPercent(disc);
        setFlashSalePriceInput(curPrice);
        setFlashSaleStockInput(prod.flashSaleStock || Math.min(prod.stock || 50, 20));
      } else {
        const calcPrice = Math.round(origPrice * (1 - flashDiscountPercent / 100));
        setFlashSalePriceInput(calcPrice);
        setFlashSaleStockInput(Math.min(prod.stock || 50, 20));
      }
    };

    const handleDiscountChange = (pct: number) => {
      const safePct = Math.max(1, Math.min(99, pct));
      setFlashDiscountPercent(safePct);
      setFlashFormError(null);
      const prod = allInventoryProducts.find(p => p.id === selectedFlashProductId);
      if (prod) {
        const origPrice = prod.normalPriceBeforeFlash || prod.originalPrice || prod.price;
        const calcPrice = Math.max(1, Math.round(origPrice * (1 - safePct / 100)));
        setFlashSalePriceInput(calcPrice);
      }
    };

    const handlePriceChange = (price: number) => {
      const safePrice = Math.max(1, price);
      setFlashSalePriceInput(safePrice);
      setFlashFormError(null);
      const prod = allInventoryProducts.find(p => p.id === selectedFlashProductId);
      if (prod) {
        const origPrice = prod.normalPriceBeforeFlash || prod.originalPrice || prod.price;
        if (safePrice < origPrice) {
          const calcPct = Math.round(((origPrice - safePrice) / origPrice) * 100);
          setFlashDiscountPercent(Math.max(1, Math.min(99, calcPct)));
        }
      }
    };

    const handleSaveFlashSaleItem = async () => {
      try {
        const prod = allInventoryProducts.find(p => p.id === selectedFlashProductId);
        if (!prod) {
          setFlashFormError(t('Please select a valid product from store inventory.', 'স্টোর ইনভেন্টরি থেকে একটি বৈধ পণ্য নির্বাচন করুন।'));
          return;
        }

        const origPrice = prod.normalPriceBeforeFlash || prod.originalPrice || prod.price;
        const fPrice = Number(flashSalePriceInput);
        const stockLimit = Number(flashSaleStockInput);

        if (isNaN(fPrice) || fPrice <= 0) {
          setFlashFormError(t('Please enter a valid flash sale price greater than 0.', '০-এর বেশি একটি বৈধ ফ্ল্যাশ সেল মূল্য লিখুন।'));
          return;
        }

        if (fPrice >= origPrice) {
          setFlashFormError(t(`Flash sale price (৳${fPrice.toLocaleString()}) must be strictly lower than regular price (৳${origPrice.toLocaleString()}) to provide a discount.`, `ছাড় দেওয়ার জন্য ফ্ল্যাশ সেল মূল্য (৳${fPrice.toLocaleString()}) অবশ্যই নিয়মিত মূল্যের (৳${origPrice.toLocaleString()}) চেয়ে কম হতে হবে।`));
          return;
        }

        if (isNaN(stockLimit) || stockLimit <= 0) {
          setFlashFormError(t('Please enter a valid stock limit of at least 1 unit.', 'কমপক্ষে ১ ইউনিটের একটি বৈধ স্টক সীমা লিখুন।'));
          return;
        }

        if (!flashSaleEndDateInput) {
          setFlashFormError(t('Please select a campaign expiry end date & time.', 'ক্যাম্পেইন শেষ হওয়ার তারিখ ও সময় নির্বাচন করুন।'));
          return;
        }

        const endMs = new Date(flashSaleEndDateInput).getTime();
        if (isNaN(endMs) || endMs <= Date.now()) {
          setFlashFormError(t('Campaign expiry date & time must be set to a future time.', 'ক্যাম্পেইন শেষ হওয়ার তারিখ ও সময় ভবিষ্যতের হতে হবে।'));
          return;
        }

        if (flashSaleStartDateInput) {
          const startMs = new Date(flashSaleStartDateInput).getTime();
          if (startMs >= endMs) {
            setFlashFormError(t('Campaign end date must be after the start date.', 'ক্যাম্পেইন শেষ হওয়ার তারিখ শুরুর তারিখের পরে হতে হবে।'));
            return;
          }
        }

        setIsSavingFlashSaleItem(true);
        setFlashFormError(null);

        const updatePayload = {
          isFlashSale: true,
          price: fPrice,
          originalPrice: origPrice,
          normalPriceBeforeFlash: origPrice,
          flashSalePrice: fPrice,
          flashSaleStock: stockLimit,
          flashSaleStartDate: flashSaleStartDateInput || new Date().toISOString(),
          flashSaleEndDate: flashSaleEndDateInput
        };

        await adminApi.updateProduct(prod.id, updatePayload);

        const updatedList = listProducts.map(p => p.id === prod.id ? { ...p, ...updatePayload } : p);
        setProducts(updatedList);
        localStorage.setItem('elora-products', JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent('elora-products-updated', { detail: updatedList }));
        window.dispatchEvent(new Event('storage'));

        setIsFlashItemModalOpen(false);
        setFlashSaleViewTab('promoted');
        showToast(t(`"${prod.name}" successfully active in Flash Sale!`, `"${prod.name}" সফলভাবে ফ্ল্যাশ সেলে সক্রিয় হয়েছে!`), 'success');
      } catch (err) {
        console.error('Error saving flash sale product:', err);
        setFlashFormError(t('Failed to save flash sale product. Please try again.', 'ফ্ল্যাশ সেল পণ্য সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।'));
      } finally {
        setIsSavingFlashSaleItem(false);
      }
    };

    const handleConfirmRemoveFromFlash = async () => {
      if (!removingFlashProduct) return;
      try {
        setIsRemovingFlashProduct(true);
        const restoredPrice = removingFlashProduct.normalPriceBeforeFlash || removingFlashProduct.originalPrice || removingFlashProduct.price;
        const updatePayload = {
          isFlashSale: false,
          price: restoredPrice,
          originalPrice: removingFlashProduct.normalPriceBeforeFlash ? undefined : removingFlashProduct.originalPrice,
          flashSalePrice: undefined,
          flashSaleStock: undefined,
          flashSaleStartDate: undefined,
          flashSaleEndDate: undefined
        };

        await adminApi.updateProduct(removingFlashProduct.id, updatePayload);

        const updatedList = listProducts.map(p => p.id === removingFlashProduct.id ? { ...p, ...updatePayload } : p);
        setProducts(updatedList);
        localStorage.setItem('elora-products', JSON.stringify(updatedList));
        window.dispatchEvent(new CustomEvent('elora-products-updated', { detail: updatedList }));
        window.dispatchEvent(new Event('storage'));

        showToast(t(`"${removingFlashProduct.name}" removed from Flash Sale. Standard price restored.`, `"${removingFlashProduct.name}" ফ্ল্যাশ সেল থেকে সরানো হয়েছে। নিয়মিত মূল্য পুনরুদ্ধার করা হয়েছে।`), 'success');
        setRemovingFlashProduct(null);
      } catch (err) {
        console.error('Failed to remove flash product:', err);
        showToast(t('Failed to remove product from Flash Sale.', 'ফ্ল্যাশ সেল থেকে পণ্য সরানো যায়নি।'), 'error');
      } finally {
        setIsRemovingFlashProduct(false);
      }
    };

    const handleCreateNewFlashProduct = async () => {
      if (!newFlashProductName || !newFlashProductRegPrice || !newFlashProductFlashPrice) {
        showToast(t('Please fill out Name, Regular Price, and Flash Price', 'নাম, নিয়মিত মূল্য এবং ফ্ল্যাশ মূল্য পূরণ করুন'), 'error');
        return;
      }
      try {
        const regPrice = Number(newFlashProductRegPrice);
        const flashPrice = Number(newFlashProductFlashPrice);
        if (isNaN(regPrice) || regPrice <= 0 || isNaN(flashPrice) || flashPrice <= 0) {
          showToast(t('Please enter valid numerical prices', 'বৈধ সংখ্যাসূচক মূল্য লিখুন'), 'error');
          return;
        }

        const fallbackImg = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600";
        await adminApi.createProduct({
          name: newFlashProductName,
          category: newFlashProductCategory,
          image: newFlashProductImage.trim() || fallbackImg,
          price: flashPrice,
          normalPriceBeforeFlash: regPrice,
          originalPrice: regPrice,
          isFlashSale: true,
          stock: Number(newFlashProductStock) || 50,
          flashSaleStock: Number(newFlashProductStock) || 50,
          rating: 5,
          reviews: 0,
          status: 'approved',
          freeShipping: true,
          description: t('Exclusive Flash Sale item added via Admin Hub.', 'অ্যাডমিন হাব থেকে যুক্ত এক্সক্লুসিভ ফ্ল্যাশ সেল পণ্য।')
        });

        showToast(t('Custom product created and activated for Flash Sale!', 'কাস্টম পণ্য তৈরি করে ফ্ল্যাশ সেলে সক্রিয় করা হয়েছে!'), 'success');
        setIsCreateFlashProductModalOpen(false);
        setNewFlashProductName('');
        setNewFlashProductImage('');
        setNewFlashProductRegPrice('');
        setNewFlashProductFlashPrice('');
        setNewFlashProductStock('50');
        refreshView();
      } catch (e) {
        console.error(e);
        showToast(t('Failed to deploy custom flash product.', 'কাস্টম ফ্ল্যাশ পণ্য যুক্ত করা যায়নি।'), 'error');
      }
    };

    const modalSelectedProduct = allInventoryProducts.find(p => p.id === selectedFlashProductId);
    const modalProductOrigPrice = modalSelectedProduct 
      ? (modalSelectedProduct.normalPriceBeforeFlash || modalSelectedProduct.originalPrice || modalSelectedProduct.price)
      : 0;
    const modalSavings = modalProductOrigPrice > flashSalePriceInput ? modalProductOrigPrice - flashSalePriceInput : 0;

    return (
      <div className="space-y-8 text-left">
        {/* Header Title and Primary Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 border border-brand-orange/30 flex items-center justify-center text-brand-orange">
                <Zap size={22} className="fill-brand-orange" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('Flash Sales', 'ফ্ল্যাশ সেল')}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('Manage limited-time flash deals, configure discount pricing, and synchronize live countdown timers with the storefront.', 'সীমিত সময়ের ফ্ল্যাশ ডিল পরিচালনা, ডিসকাউন্ট মূল্য নির্ধারণ এবং স্টোরফ্রন্টের লাইভ কাউন্টডাউন টাইমার সিঙ্ক করুন।')}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateFlashProductModalOpen(true)}
              className="h-11 px-4 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold rounded-xl transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
              title={t('Create a brand new product and deploy it directly into Flash Sales', 'একটি নতুন পণ্য তৈরি করে সরাসরি ফ্ল্যাশ সেলে যুক্ত করুন')}
            >
              <Plus size={14} /> {t('New Custom Product', 'নতুন কাস্টম পণ্য')}
            </button>
            <button
              onClick={() => handleOpenAddFlashModal()}
              className="h-11 px-6 bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-brand-orange/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Zap size={15} className="fill-white" /> + {t('Add Flash Sale Item', 'ফ্ল্যাশ সেল পণ্য যোগ করুন')}
            </button>
          </div>
        </div>

        {/* Flash Sale Metrics HUD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:border-brand-orange/30 transition-all flex flex-col justify-between group shadow-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Active Flash Deals', 'সক্রিয় ফ্ল্যাশ ডিল')}</span>
              <div className="p-2.5 bg-brand-orange/10 rounded-xl text-brand-orange group-hover:bg-brand-orange/20 transition-colors">
                <Zap size={18} className="fill-brand-orange" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-white font-mono">{totalFlashItems}</p>
              <span className="text-xs text-gray-400 font-medium">{t('products on deal', 'টি পণ্য ডিলে আছে')}</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:border-emerald-500/30 transition-all flex flex-col justify-between group shadow-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('Average Discount', 'গড় ছাড়')}</span>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-emerald-400 font-mono">
                {avgFlashDiscount > 0 ? `${avgFlashDiscount}%` : '0%'}
              </p>
              <span className="text-xs text-gray-400 font-medium">{t('across active deals', 'সক্রিয় ডিলগুলোতে')}</span>
            </div>
          </motion.div>

          <AdminLiveCountdownCard targetDate={savedTargetDate} />
        </div>

        {/* Global Timer Settings Block */}
        <div className="bg-[#12121a] border border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-xl">
          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-brand-orange/15 border border-brand-orange/30 rounded-2xl flex items-center justify-center text-brand-orange">
                  <Clock size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    {t('Campaign Countdown Timer', 'ক্যাম্পেইন কাউন্টডাউন টাইমার')}
                    <span className="text-[10px] bg-brand-orange/20 text-brand-orange font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                      {t('Storefront Sync', 'স্টোরফ্রন্ট সিঙ্ক')}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t('Controls the primary countdown timer header on the home page Flash Sale section.', 'হোম পেজের ফ্ল্যাশ সেল সেকশনের মূল কাউন্টডাউন টাইমার নিয়ন্ত্রণ করে।')}
                  </p>
                </div>
              </div>

              {/* Storefront Preview Badge */}
              <AdminLivePreviewBadge targetDate={savedTargetDate} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              {/* Date & Time Picker */}
              <div className="lg:col-span-6 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300 block">
                    {t('Campaign Expiry Date & Time', 'ক্যাম্পেইনের মেয়াদ শেষের তারিখ ও সময়')}
                  </label>
                  {isTimerInPast && (
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {t('Date is in the past', 'তারিখটি অতীতের')}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="datetime-local" 
                    value={flashTimerTargetDate}
                    onChange={(e) => handleTargetDateChange(e.target.value)}
                    className={`w-full h-12 bg-white/5 border rounded-2xl px-4 font-mono text-xs font-bold text-white outline-none transition-all ${isTimerInPast ? 'border-amber-500/50 focus:border-amber-500' : 'border-white/10 focus:border-brand-orange'}`}
                  />
                </div>
                <p className="text-[11px] text-gray-400">
                  {t('Selecting an expiry date & time automatically calculates and links with the duration fields below.', 'মেয়াদের তারিখ ও সময় নির্বাচন করলে নিচের সময়কাল ফিল্ডগুলো স্বয়ংক্রিয়ভাবে হিসাব হয়ে যাবে।')}
                </p>
              </div>

              {/* Hours / Minutes / Seconds Number Inputs */}
              <div className="lg:col-span-6 space-y-2">
                <label className="text-xs font-bold text-gray-300 block">
                  {t('Campaign Duration (Hours : Minutes : Seconds)', 'ক্যাম্পেইনের সময়কাল (ঘণ্টা : মিনিট : সেকেন্ড)')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      max="999"
                      value={flashTimerHours}
                      onChange={(e) => handleHmsChange(Number(e.target.value), flashTimerMinutes, flashTimerSeconds)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 text-center font-mono text-base font-bold text-white outline-none focus:border-brand-orange"
                    />
                    <span className="absolute bottom-1 right-2 text-[9px] font-bold text-gray-400 uppercase">{t('hrs', 'ঘণ্টা')}</span>
                  </div>

                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      max="59"
                      value={flashTimerMinutes}
                      onChange={(e) => handleHmsChange(flashTimerHours, Number(e.target.value), flashTimerSeconds)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 text-center font-mono text-base font-bold text-white outline-none focus:border-brand-orange"
                    />
                    <span className="absolute bottom-1 right-2 text-[9px] font-bold text-gray-400 uppercase">{t('min', 'মিনিট')}</span>
                  </div>

                  <div className="relative">
                    <input 
                      type="number" 
                      min="0"
                      max="59"
                      value={flashTimerSeconds}
                      onChange={(e) => handleHmsChange(flashTimerHours, flashTimerMinutes, Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 text-center font-mono text-base font-bold text-white outline-none focus:border-brand-orange"
                    />
                    <span className="absolute bottom-1 right-2 text-[9px] font-bold text-gray-400 uppercase">{t('sec', 'সেকেন্ড')}</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  {t('Editing H/M/S fields updates the expiry date picker in real time.', 'ঘণ্টা/মিনিট/সেকেন্ড পরিবর্তন করলে মেয়াদের তারিখ তাৎক্ষণিকভাবে আপডেট হবে।')}
                </p>
              </div>
            </div>

            {/* Quick Duration Presets & Save Action */}
            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">{t('Quick Presets:', 'দ্রুত প্রিসেট:')}</span>
                {[
                  { label: t('+2 Hours', '+২ ঘণ্টা'), hours: 2 },
                  { label: t('+6 Hours', '+৬ ঘণ্টা'), hours: 6 },
                  { label: t('+12 Hours', '+১২ ঘণ্টা'), hours: 12 },
                  { label: t('+24 Hours', '+২৪ ঘণ্টা'), hours: 24 },
                  { label: t('+48 Hours', '+৪৮ ঘণ্টা'), hours: 48 }
                ].map((preset) => (
                  <button
                    key={preset.hours}
                    type="button"
                    onClick={() => handlePresetTimer(preset.hours)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/40 text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer font-mono"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleUpdateFlashTimer}
                disabled={isSavingTimer}
                className="py-3 px-7 bg-brand-orange hover:bg-brand-orange-light disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-brand-orange/20 active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer font-mono"
              >
                {isSavingTimer ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> {t('Saving...', 'সংরক্ষণ হচ্ছে...')}
                  </>
                ) : (
                  <>
                    <Check size={14} className="stroke-[3]" /> {t('Save Timer', 'টাইমার সেভ করুন')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Controls, Filter Tabs, and Search row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <FilterTabGroup
            tabs={[
              { id: 'promoted', label: t('Active Flash Sale', 'সক্রিয় ফ্ল্যাশ সেল'), count: flashProducts.length, badgeVariant: 'amber', icon: <Zap size={13} className={flashSaleViewTab === 'promoted' ? 'fill-white' : ''} /> },
              { id: 'all', label: t('All Store Inventory', 'সব স্টোর ইনভেন্টরি'), count: allInventoryProducts.length, badgeVariant: 'grey', icon: <Package size={13} /> },
            ]}
            activeTab={flashSaleViewTab}
            onChange={(id) => setFlashSaleViewTab(id as any)}
            ariaLabel={t('Flash Sale View Tab', 'ফ্ল্যাশ সেল ভিউ ট্যাব')}
          />

          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand-orange transition-colors" size={16} />
            <input 
              type="text" 
              placeholder={t('Search products, category, shop...', 'পণ্য, ক্যাটাগরি, দোকান খুঁজুন...')}
              value={flashSaleSearchQuery}
              onChange={(e) => setFlashSaleSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl h-12 pl-12 pr-10 outline-none focus:border-brand-orange text-xs font-bold text-white transition-all placeholder:text-gray-500"
            />
            {flashSaleSearchQuery && (
              <button
                onClick={() => setFlashSaleSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeleton View */}
        {isFetchingFlashSale ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white/5 border border-white/10 rounded-[32px] p-5 space-y-4">
                <div className="aspect-[4/3] bg-white/10 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded-lg w-3/4" />
                  <div className="h-3 bg-white/5 rounded-lg w-1/2" />
                </div>
                <div className="h-20 bg-white/5 rounded-2xl" />
                <div className="h-10 bg-white/10 rounded-xl" />
              </div>
            ))}
          </div>
        ) : (
          /* Products Promo Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredFlashInventory.length === 0 ? (
              /* Clean, standard empty state */
              <div className="col-span-full py-16 px-6 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center mx-auto text-brand-orange">
                  <Zap size={28} className="fill-brand-orange" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {flashSaleSearchQuery
                      ? t('No products match your search', 'আপনার খোঁজার সাথে কোনো পণ্য মিলেনি')
                      : flashSaleViewTab === 'promoted'
                        ? t('No flash sale items yet', 'এখনও কোনো ফ্ল্যাশ সেল পণ্য নেই')
                        : t('No inventory products found', 'ইনভেন্টরিতে কোনো পণ্য পাওয়া যায়নি')}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                    {flashSaleSearchQuery
                      ? t(`No items found matching "${flashSaleSearchQuery}". Try another keyword or clear your search.`, `"${flashSaleSearchQuery}"-এর সাথে কোনো পণ্য পাওয়া যায়নি। অন্য শব্দ চেষ্টা করুন বা অনুসন্ধান মুছুন।`)
                      : flashSaleViewTab === 'promoted'
                        ? t('Launch limited-time promotional deals by adding products from your store catalog with custom discounts and stock limits.', 'কাস্টম ছাড় ও স্টক সীমাসহ স্টোর ক্যাটালগ থেকে পণ্য যোগ করে সীমিত সময়ের ফ্ল্যাশ ডিল চালু করুন।')
                        : t('There are no active products in the store catalog.', 'স্টোর ক্যাটালগে কোনো সক্রিয় পণ্য নেই।')}
                  </p>
                </div>
                {flashSaleSearchQuery ? (
                  <button
                    onClick={() => setFlashSaleSearchQuery('')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <X size={14} /> {t('Clear Search Query', 'অনুসন্ধান মুছুন')}
                  </button>
                ) : flashSaleViewTab === 'promoted' ? (
                  <button
                    onClick={() => handleOpenAddFlashModal()}
                    className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                  >
                    <Zap size={14} className="fill-white" /> + {t('Add Flash Sale Item', 'ফ্ল্যাশ সেল পণ্য যোগ করুন')}
                  </button>
                ) : null}
              </div>
            ) : (
              filteredFlashInventory.map((p) => {
                const origPrice = p.normalPriceBeforeFlash || p.originalPrice || p.price;
                const disc = origPrice > p.price ? Math.round(((origPrice - p.price) / origPrice) * 100) : 0;
                
                return (
                  <motion.div 
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-white/5 border rounded-[32px] p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group shadow-lg hover:shadow-2xl ${
                      p.isFlashSale 
                        ? 'border-brand-orange/40 bg-brand-orange/[0.03] shadow-[0_4px_24px_rgba(255,92,0,0.08)] hover:border-brand-orange' 
                        : 'border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-black/40">
                      <img 
                        src={p.image} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt={p.name} 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-wider border border-white/10">
                        {p.category ? translateCategory(p.category) : t('General', 'সাধারণ')}
                      </div>
                      {p.isFlashSale ? (
                        <div className="absolute top-3 right-3 bg-brand-orange text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          {t('FLASH SALE', 'ফ্ল্যাশ সেল')}
                        </div>
                      ) : (
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md text-gray-300 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                          {p.stock ?? 35} {t('in stock', 'স্টকে আছে')}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mb-5 text-left">
                      <div>
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-brand-orange transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                          {t('Shop:', 'দোকান:')} {p.seller?.name || t('Main Store', 'মূল স্টোর')}
                        </p>
                      </div>

                      <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                          <span>{t('Original Price', 'আসল মূল্য')}</span>
                          <span className={`font-mono ${p.isFlashSale ? 'line-through text-gray-400' : 'text-white font-bold'}`}>
                            ৳{origPrice.toLocaleString()}
                          </span>
                        </div>
                        
                        {p.isFlashSale && (
                          <>
                            <div className="flex items-center justify-between text-[11px] font-bold border-t border-white/5 pt-2">
                              <span className="text-brand-orange">{t('Flash Sale Price', 'ফ্ল্যাশ সেল মূল্য')}</span>
                              <span className="font-mono text-brand-orange font-black text-sm">
                                ৳{p.price.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold border-t border-white/5 pt-2">
                              <span className="text-emerald-400">{t('Discount Savings', 'ছাড় সাশ্রয়')}</span>
                              <span className="font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                -{disc}% {t('OFF', 'ছাড়')}
                              </span>
                            </div>
                            {p.flashSaleStock && (
                              <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 border-t border-white/5 pt-1.5">
                                <span>{t('Flash Stock Limit', 'ফ্ল্যাশ স্টক সীমা')}</span>
                                <span className="font-mono text-gray-300">{p.flashSaleStock} {t('units allocated', 'টি বরাদ্দ')}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons on card */}
                    <div className="pt-2">
                      {p.isFlashSale ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleOpenAddFlashModal(p)}
                            className="py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit2 size={13} /> {t('Edit', 'সম্পাদনা')}
                          </button>
                          <button
                            onClick={() => setRemovingFlashProduct(p)}
                            className="py-2.5 border border-rose-500/30 hover:border-rose-500 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 size={13} /> {t('Remove', 'সরান')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenAddFlashModal(p)}
                          className="w-full py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Zap size={14} className="fill-white" /> + {t('Add to Flash Sale', 'ফ্ল্যাশ সেলে যোগ করুন')}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Flash Sale Item Configuration Modal */}
        <AnimatePresence>
          {isFlashItemModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isSavingFlashSaleItem && setIsFlashItemModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#121218] border border-white/10 rounded-[36px] p-6 md:p-8 w-full max-w-2xl relative z-10 overflow-hidden shadow-2xl text-left"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-brand-orange/15 text-brand-orange rounded-2xl flex items-center justify-center border border-brand-orange/30">
                      <Zap size={22} className="fill-brand-orange" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">
                        {flashModalMode === 'edit' ? t('Edit Flash Sale Item', 'ফ্ল্যাশ সেল পণ্য সম্পাদনা') : t('Add Flash Sale Item', 'ফ্ল্যাশ সেল পণ্য যোগ করুন')}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t('Configure discount pricing, allocated stock limit, and campaign run schedule', 'ডিসকাউন্ট মূল্য, বরাদ্দ স্টক সীমা এবং ক্যাম্পেইনের সময়সূচী কনফিগার করুন')}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => !isSavingFlashSaleItem && setIsFlashItemModalOpen(false)}
                    className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-5 max-h-[68vh] overflow-y-auto pr-1 custom-scrollbar">
                  {/* Product Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300 block">
                      {t('Select Product from Store Inventory', 'স্টোর ইনভেন্টরি থেকে পণ্য নির্বাচন করুন')}
                    </label>
                    <select
                      value={selectedFlashProductId}
                      onChange={(e) => handleSelectProductInModal(e.target.value)}
                      disabled={flashModalMode === 'edit'}
                      className="w-full h-12 bg-white/5 border border-white/10 focus:border-brand-orange rounded-2xl px-4 text-xs font-bold text-white outline-none transition-all cursor-pointer disabled:opacity-75"
                    >
                      {allInventoryProducts.map((p) => {
                        const reg = p.normalPriceBeforeFlash || p.originalPrice || p.price;
                        return (
                          <option key={p.id} value={p.id} className="bg-[#121218] text-white">
                            {p.name} — {p.category ? translateCategory(p.category) : t('General', 'সাধারণ')} (৳{reg.toLocaleString()}) {p.isFlashSale ? `⚡ [${t('Already in Flash Sale', 'ইতিমধ্যে ফ্ল্যাশ সেলে আছে')}]` : ''}
                          </option>
                        );
                      })}
                    </select>

                    {/* Selected Product Snapshot Card */}
                    {modalSelectedProduct && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 mt-2">
                        <img 
                          src={modalSelectedProduct.image} 
                          alt={modalSelectedProduct.name || t('Selected product thumbnail', 'নির্বাচিত পণ্যের ছবি')} 
                          className="w-14 h-14 object-cover rounded-xl border border-white/10 bg-black/40" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{modalSelectedProduct.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                            <span>{t('Regular Price:', 'নিয়মিত মূল্য:')} <strong className="text-white font-mono">৳{modalProductOrigPrice.toLocaleString()}</strong></span>
                            <span>•</span>
                            <span>{t('Available Stock:', 'মজুদ আছে:')} <strong className="text-white font-mono">{modalSelectedProduct.stock ?? 50} {t('units', 'টি')}</strong></span>
                          </div>
                        </div>
                        {modalSelectedProduct.isFlashSale && (
                          <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/15 px-2.5 py-1 rounded-xl border border-brand-orange/30 uppercase">
                            {t('Currently Active Deal', 'বর্তমানে সক্রিয় ডিল')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Two-way linked Discount % and Flash Sale Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Discount Percentage */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-300">
                          {t('Discount Percentage (%)', 'ডিসকাউন্ট শতাংশ (%)')}
                        </label>
                        <span className="text-[11px] font-mono font-bold text-emerald-400">
                          -{flashDiscountPercent}%
                        </span>
                      </div>
                      <div className="relative">
                        <input 
                          type="number"
                          min="1"
                          max="99"
                          value={flashDiscountPercent}
                          onChange={(e) => handleDiscountChange(Number(e.target.value))}
                          className="w-full h-12 bg-white/5 border border-white/10 focus:border-brand-orange rounded-2xl px-4 font-mono text-sm font-bold text-white outline-none transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                      </div>
                      {/* Preset discount buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {[15, 25, 35, 50, 70].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => handleDiscountChange(pct)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${flashDiscountPercent === pct ? 'bg-brand-orange text-white' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Flash Sale Price */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-300">
                          {t('Flash Sale Price (৳)', 'ফ্ল্যাশ সেল মূল্য (৳)')}
                        </label>
                        {modalSavings > 0 && (
                          <span className="text-[11px] font-mono text-gray-400">
                            {t('Save', 'সাশ্রয়')} ৳{modalSavings.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input 
                          type="number"
                          min="1"
                          value={flashSalePriceInput}
                          onChange={(e) => handlePriceChange(Number(e.target.value))}
                          className="w-full h-12 bg-white/5 border border-white/10 focus:border-brand-orange rounded-2xl px-4 font-mono text-sm font-bold text-white outline-none transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">৳ BDT</span>
                      </div>
                      <p className="text-[11px] text-gray-400 pt-1">
                        {t('Regular:', 'নিয়মিত:')} ৳{modalProductOrigPrice.toLocaleString()} → {t('Flash:', 'ফ্ল্যাশ:')} <strong className="text-brand-orange font-mono">৳{flashSalePriceInput.toLocaleString()}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Stock limit for the sale */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 block">
                      {t('Flash Sale Stock Limit (Units allocated for promotion)', 'ফ্ল্যাশ সেল স্টক সীমা (প্রমোশনের জন্য বরাদ্দকৃত সংখ্যা)')}
                    </label>
                    <input 
                      type="number"
                      min="1"
                      placeholder="20"
                      value={flashSaleStockInput}
                      onChange={(e) => setFlashSaleStockInput(e.target.value)}
                      className="w-full h-12 bg-white/5 border border-white/10 focus:border-brand-orange rounded-2xl px-4 font-mono text-sm font-bold text-white outline-none transition-all"
                    />
                    <p className="text-[11px] text-gray-400">
                      {t('Limits the maximum promotional quantity available at this discounted price before reverting to standard pricing.', 'নিয়মিত মূল্যে ফিরে যাওয়ার আগে এই ডিসকাউন্ট মূল্যে সর্বোচ্চ বিক্রয়যোগ্য পরিমাণ সীমাবদ্ধ করে।')}
                    </p>
                  </div>

                  {/* Campaign Run Schedule */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-300 block">
                        {t('Start Date & Time', 'শুরুর তারিখ ও সময়')}
                      </label>
                      <input 
                        type="datetime-local" 
                        value={flashSaleStartDateInput}
                        onChange={(e) => setFlashSaleStartDateInput(e.target.value)}
                        className="w-full h-12 bg-white/5 border border-white/10 focus:border-brand-orange rounded-2xl px-4 font-mono text-xs font-bold text-white outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-300 block">
                        {t('End Date & Time (Expiry)', 'শেষের তারিখ ও সময় (মেয়াদ)')}
                      </label>
                      <input 
                        type="datetime-local" 
                        value={flashSaleEndDateInput}
                        onChange={(e) => setFlashSaleEndDateInput(e.target.value)}
                        className="w-full h-12 bg-white/5 border border-white/10 focus:border-brand-orange rounded-2xl px-4 font-mono text-xs font-bold text-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Quick duration presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">{t('Duration:', 'সময়কাল:')}</span>
                    {[
                      { label: t('+6 Hours', '+৬ ঘণ্টা'), hours: 6 },
                      { label: t('+12 Hours', '+১২ ঘণ্টা'), hours: 12 },
                      { label: t('+24 Hours', '+২৪ ঘণ্টা'), hours: 24 },
                      { label: t('+3 Days', '+৩ দিন'), hours: 72 }
                    ].map((d) => (
                      <button
                        key={d.hours}
                        type="button"
                        onClick={() => {
                          const target = new Date(Date.now() + d.hours * 3600 * 1000);
                          setFlashSaleEndDateInput(formatToLocalDateTimeString(target));
                        }}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-gray-300 hover:text-white transition-all cursor-pointer font-mono"
                      >
                        {d.label}
                      </button>
                    ))}
                    {flashTimerTargetDate && (
                      <button
                        type="button"
                        onClick={() => setFlashSaleEndDateInput(flashTimerTargetDate)}
                        className="px-2.5 py-1 bg-brand-orange/15 hover:bg-brand-orange/25 border border-brand-orange/30 rounded-lg text-[10px] font-bold text-brand-orange transition-all cursor-pointer font-mono"
                      >
                        {t('Sync with Global Timer', 'গ্লোবাল টাইমারের সাথে সিঙ্ক করুন')}
                      </button>
                    )}
                  </div>

                  {/* Error / Validation Banner */}
                  {flashFormError && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-bold flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{flashFormError}</span>
                    </div>
                  )}
                </div>

                {/* Modal Footer Actions */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={() => setIsFlashItemModalOpen(false)}
                    disabled={isSavingFlashSaleItem}
                    className="py-3.5 border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                  <button 
                    type="button"
                    onClick={handleSaveFlashSaleItem}
                    disabled={isSavingFlashSaleItem}
                    className="py-3.5 bg-brand-orange hover:bg-brand-orange-light disabled:opacity-50 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-brand-orange/20 active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer font-mono"
                  >
                    {isSavingFlashSaleItem ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> {t('Saving Deal...', 'ডিল সংরক্ষণ হচ্ছে...')}
                      </>
                    ) : (
                      <>
                        <Check size={14} className="stroke-[3]" /> {t('Save Flash Sale Deal', 'ফ্ল্যাশ সেল ডিল সংরক্ষণ করুন')}
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Remove Confirmation Modal */}
        <AnimatePresence>
          {removingFlashProduct && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !isRemovingFlashProduct && setRemovingFlashProduct(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#14141c] border border-white/10 rounded-[32px] p-6 md:p-8 w-full max-w-md relative z-10 overflow-hidden shadow-2xl text-left"
              >
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{t('Remove from Flash Sale?', 'ফ্ল্যাশ সেল থেকে সরাবেন?')}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{t('Product will return to standard catalog', 'পণ্যটি নিয়মিত ক্যাটালগে ফিরে যাবে')}</p>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                  {t('Are you sure you want to remove', 'আপনি কি নিশ্চিত যে আপনি ফ্ল্যাশ সেল থেকে এটি সরাতে চান:')}{' '}
                  <strong className="text-white font-semibold">"{removingFlashProduct.name}"</strong>?{' '}
                  {t('Its original price of', 'এর আসল মূল্য')}{' '}
                  <strong className="text-brand-orange font-mono">৳{(removingFlashProduct.normalPriceBeforeFlash || removingFlashProduct.originalPrice || removingFlashProduct.price).toLocaleString()}</strong>{' '}
                  {t('will be restored immediately.', 'সাথে সাথে পুনরুদ্ধার করা হবে।')}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setRemovingFlashProduct(null)}
                    disabled={isRemovingFlashProduct}
                    className="py-3 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRemoveFromFlash}
                    disabled={isRemovingFlashProduct}
                    className="py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer font-mono"
                  >
                    {isRemovingFlashProduct ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> {t('Removing...', 'সরানো হচ্ছে...')}
                      </>
                    ) : (
                      t('Confirm Removal', 'সরানো নিশ্চিত করুন')
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Custom Flash Product Modal */}
        <AnimatePresence>
          {isCreateFlashProductModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCreateFlashProductModalOpen(false)}
                className="absolute inset-0 bg-[#07070a]/90 backdrop-blur-sm"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#111116] border border-white/10 rounded-[40px] p-6 md:p-8 w-full max-w-xl relative z-10 overflow-hidden shadow-2xl font-sans text-left"
              >
                <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                      <Zap size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tight">{t('Create Custom Flash Product', 'কাস্টম ফ্ল্যাশ পণ্য তৈরি করুন')}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{t('Deploy a brand new catalog product directly into Flash Sales', 'সরাসরি ফ্ল্যাশ সেলে একটি নতুন ক্যাটালগ পণ্য যুক্ত করুন')}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsCreateFlashProductModalOpen(false)}
                    className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300 block">{t('Product Name *', 'পণ্যের নাম *')}</label>
                    <input 
                      type="text"
                      placeholder={t('e.g. Premium Leather Wallet', 'যেমন: প্রিমিয়াম লেদার ওয়ালেট')}
                      value={newFlashProductName}
                      onChange={(e) => setNewFlashProductName(e.target.value)}
                      className="w-full h-11 bg-white/5 border border-white/10 focus:border-emerald-500 rounded-xl px-4 text-xs font-bold text-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300 block">{t('Category', 'ক্যাটাগরি')}</label>
                    <select 
                      value={newFlashProductCategory}
                      onChange={(e) => setNewFlashProductCategory(e.target.value)}
                      className="w-full h-11 bg-[#111116] border border-white/10 focus:border-emerald-500 rounded-xl px-4 text-xs font-bold text-white outline-none transition-all cursor-pointer"
                    >
                      {['Fashions', 'Electronics', 'Home & Living', 'Beauty & Health', 'Sports', 'Groceries', 'Babies', 'Others'].map(cat => (
                        <option key={cat} value={cat} className="bg-[#111116] text-white">{translateCategory(cat)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-300 block">{t('Image URL', 'ছবির URL')}</label>
                    <input 
                      type="text"
                      placeholder={t('https://images.unsplash.com/... or blank for default placeholder', 'https://images.unsplash.com/... অথবা ডিফল্টের জন্য খালি রাখুন')}
                      value={newFlashProductImage}
                      onChange={(e) => setNewFlashProductImage(e.target.value)}
                      className="w-full h-11 bg-white/5 border border-white/10 focus:border-emerald-500 rounded-xl px-4 text-xs font-bold text-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300 block">{t('Stock Units', 'স্টক সংখ্যা')}</label>
                    <input 
                      type="number"
                      placeholder="50"
                      value={newFlashProductStock}
                      onChange={(e) => setNewFlashProductStock(e.target.value)}
                      className="w-full h-11 bg-white/5 border border-white/10 focus:border-emerald-500 rounded-xl px-4 text-xs font-bold text-white outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-300 block">{t('Regular Price (৳) *', 'নিয়মিত মূল্য (৳) *')}</label>
                    <input 
                      type="number"
                      placeholder={t('e.g. 1200', 'যেমন 1200')}
                      value={newFlashProductRegPrice}
                      onChange={(e) => setNewFlashProductRegPrice(e.target.value)}
                      className="w-full h-11 bg-white/5 border border-white/10 focus:border-emerald-500 rounded-xl px-4 text-xs font-bold text-white outline-none transition-all font-mono"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-300 block">{t('Flash Sale Price (৳) *', 'ফ্ল্যাশ সেল মূল্য (৳) *')}</label>
                    <input 
                      type="number"
                      placeholder={t('e.g. 599', 'যেমন 599')}
                      value={newFlashProductFlashPrice}
                      onChange={(e) => setNewFlashProductFlashPrice(e.target.value)}
                      className="w-full h-11 bg-white/5 border border-white/10 focus:border-emerald-500 rounded-xl px-4 text-xs font-bold text-white outline-none transition-all font-mono"
                    />
                    {newFlashProductRegPrice && newFlashProductFlashPrice && (
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-1 font-mono">
                        {t('Instant Discount:', 'তাৎক্ষণিক ছাড়:')} -{Math.max(0, Math.round(((Number(newFlashProductRegPrice) - Number(newFlashProductFlashPrice)) / Number(newFlashProductRegPrice)) * 100))}%
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => setIsCreateFlashProductModalOpen(false)}
                    className="py-3 border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                  <button 
                    onClick={handleCreateNewFlashProduct}
                    className="py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95 font-mono cursor-pointer"
                  >
                    {t('Create & Activate', 'তৈরি ও সক্রিয় করুন')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderAds = () => {
    const listProducts = Array.isArray(products) ? products : [];
    const promotedProducts = listProducts.filter(p => !p.isDeleted && p.isSponsored && p.adStatus !== 'ended');
    const allInventoryProducts = listProducts.filter(p => !p.isDeleted);
    
    const activeCampaignsCount = promotedProducts.filter(p => p.adStatus === 'active').length;
    const totalImpressions = promotedProducts.reduce((sum, p) => sum + (p.adImpressions || 0), 0);
    const totalClicks = promotedProducts.reduce((sum, p) => sum + (p.adClicks || 0), 0);
    const totalSpend = totalClicks * 3; // ৳3 CPC
    const totalAllocatedBudget = promotedProducts.reduce((sum, p) => sum + (p.adBudget || 0), 0);
    const totalRemainingBudget = Math.max(0, totalAllocatedBudget - totalSpend);

    const currentList = adViewTab === 'promoted' ? promotedProducts : allInventoryProducts;
    const filteredAdProducts = currentList.filter(p => {
      if (!adSearchQuery.trim()) return true;
      const q = adSearchQuery.trim().toLowerCase();
      return p.name.toLowerCase().includes(q) || 
             (p.category && p.category.toLowerCase().includes(q)) ||
             (p.seller?.name && p.seller.name.toLowerCase().includes(q));
    });

    return (
      <div className="space-y-8 text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="text-amber-400" size={24} /> {t('Ads & Campaigns', 'বিজ্ঞাপন ও ক্যাম্পেইন')}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-400">
                {t('Manage sponsored products, monitor ad performance, and allocate advertising budgets.', 'স্পনসর্ড পণ্য পরিচালনা করুন, বিজ্ঞাপনের পারফরম্যান্স দেখুন এবং বাজেট বরাদ্দ করুন।')}
              </p>
              <div className="relative inline-block">
                <button 
                  type="button"
                  onClick={() => setShowCpcTooltip(!showCpcTooltip)}
                  onMouseEnter={() => setShowCpcTooltip(true)}
                  onMouseLeave={() => setShowCpcTooltip(false)}
                  className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-mono font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Info size={11} /> {t('CPC: ৳3 BDT', 'সিপিসি: ৳৩ টাকা')}
                </button>
                {showCpcTooltip && (
                  <div className="absolute left-0 bottom-full mb-2 w-72 bg-[#181822] border border-amber-500/30 p-3 rounded-2xl shadow-2xl z-50 text-left pointer-events-none">
                    <p className="text-[11px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                      <Sparkles size={12} /> {t('Fixed CPC Pricing: ৳3 BDT', 'নির্দিষ্ট সিপিসি মূল্য: ৳৩ টাকা')}
                    </p>
                    <p className="text-[10px] text-gray-300 leading-relaxed font-normal">
                      {t('A fixed rate of ৳3 BDT is charged only when a customer clicks a sponsored product on the storefront. Product impressions in sponsored feeds are delivered free of charge.', 'গ্রাহক যখন স্টোরফ্রন্টে কোনো স্পনসর্ড পণ্যে ক্লিক করেন কেবল তখনই ৳৩ টাকা চার্জ করা হয়। স্পনসর্ড ফিডে পণ্যের ইম্প্রেশন সম্পূর্ণ বিনামূল্যে দেখানো হয়।')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refreshView()}
            disabled={isFetchingAds}
            className="self-start md:self-auto px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-mono font-bold"
            title={t('Refresh Ad Campaigns & Tracking', 'বিজ্ঞাপন ক্যাম্পেইন ও ট্র্যাকিং রিফ্রেশ করুন')}
          >
            <RefreshCw size={14} className={isFetchingAds ? 'animate-spin text-amber-400' : ''} />
            <span>{isFetchingAds ? t('Syncing...', 'সিঙ্ক হচ্ছে...') : t('Sync Ads', 'বিজ্ঞাপন সিঙ্ক')}</span>
          </button>
        </div>

        {/* Sub-tab Navigation: Sponsored Products vs Ad Board Banners (Group 8) */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setAdsSubTab('sponsored')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              adsSubTab === 'sponsored'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles size={14} />
            <span>{t('Sponsored Products', 'স্পনসর্ড পণ্য')}</span>
          </button>
          <button
            type="button"
            onClick={() => setAdsSubTab('ad_board')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              adsSubTab === 'ad_board'
                ? 'bg-brand-orange text-white shadow-lg shadow-orange-500/20'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Image size={14} />
            <span>{t('Ad Board Banners (Storefront Slots)', 'অ্যাড বোর্ড ব্যানার (স্টোরফ্রন্ট স্লট)')}</span>
          </button>
        </div>

        {adsSubTab === 'ad_board' ? (
          <AdminAdBoardManagement />
        ) : isFetchingAds ? (
          <div className="space-y-8 animate-pulse">
            {/* Stat HUD Skeletons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl h-24 flex flex-col justify-between">
                  <div className="w-24 h-3 bg-white/10 rounded" />
                  <div className="w-16 h-6 bg-white/10 rounded" />
                </div>
              ))}
            </div>

            {/* Controls Skeleton */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div className="w-64 h-10 bg-white/5 rounded-xl" />
              <div className="w-72 h-10 bg-white/5 rounded-xl" />
            </div>

            {/* Grid Skeletons */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-[36px] p-5 space-y-4">
                  <div className="aspect-[4/3] bg-white/10 rounded-3xl" />
                  <div className="w-3/4 h-4 bg-white/10 rounded" />
                  <div className="w-1/2 h-3 bg-white/10 rounded" />
                  <div className="h-28 bg-white/5 rounded-2xl" />
                  <div className="h-10 bg-white/10 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Campaign Metrics HUD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: t('Active Campaigns', 'সক্রিয় ক্যাম্পেইন'), value: activeCampaignsCount, icon: <Sparkles className="text-amber-400" size={16} /> },
                { label: t('Total Impressions', 'মোট ইম্প্রেশন'), value: totalImpressions.toLocaleString(), icon: <Eye className="text-blue-400" size={16} /> },
                { label: t('Total Clicks', 'মোট ক্লিক'), value: totalClicks.toLocaleString(), icon: <TrendingUp className="text-emerald-400" size={16} /> },
                { label: t('Total Ad Spend', 'মোট বিজ্ঞাপন ব্যয়'), value: `৳${totalSpend.toLocaleString()}`, icon: <DollarSign className="text-brand-orange" size={16} /> },
                { label: t('Remaining Budget', 'অবশিষ্ট বাজেট'), value: `৳${totalRemainingBudget.toLocaleString()}`, icon: <CreditCard className="text-purple-400" size={16} /> }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                    <div className="p-2 bg-white/5 rounded-lg">{stat.icon}</div>
                  </div>
                  <p className="text-xl font-black text-white font-mono">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Controls and Search row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <FilterTabGroup
                tabs={[
                  { id: 'promoted', label: t('Sponsored Products', 'স্পনসর্ড পণ্য'), count: promotedProducts.length, badgeVariant: 'amber', icon: <Sparkles size={13} /> },
                  { id: 'all', label: t('All Store Inventory', 'সব স্টোর ইনভেন্টরি'), count: allInventoryProducts.length, badgeVariant: 'grey', icon: <Package size={13} /> },
                ]}
                activeTab={adViewTab}
                onChange={(id) => setAdViewTab(id as any)}
                ariaLabel={t('Ads and Campaigns Filter', 'বিজ্ঞাপন ও ক্যাম্পেইন ফিল্টার')}
              />

              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-orange transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder={t('Search products...', 'পণ্য খুঁজুন...')}
                  value={adSearchQuery}
                  onChange={(e) => setAdSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-11 pl-10 pr-10 outline-none focus:border-brand-orange text-xs font-medium text-white transition-all"
                />
                {adSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAdSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                    title={t('Clear search', 'অনুসন্ধান মুছুন')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Products Promo Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {filteredAdProducts.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 p-8 max-w-lg mx-auto">
                  <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mx-auto mb-4 border border-amber-500/20">
                    <Sparkles size={24} />
                  </div>
                  <p className="text-base font-black text-white uppercase tracking-tight">
                    {adViewTab === 'promoted' ? t('No Sponsored Products Active', 'কোনো স্পনসর্ড পণ্য সক্রিয় নেই') : t('No Products Found', 'কোনো পণ্য পাওয়া যায়নি')}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 mb-6">
                    {adSearchQuery 
                      ? t('No products match your search query. Try clearing the search.', 'আপনার খোঁজার সাথে কোনো পণ্য মিলেনি। অনুসন্ধান মুছে আবার চেষ্টা করুন।') 
                      : adViewTab === 'promoted' 
                        ? t('Promote products from your store inventory to launch sponsored ads and boost sales.', 'স্পনসর্ড বিজ্ঞাপন চালু করতে এবং বিক্রি বাড়াতে স্টোর ইনভেন্টরি থেকে পণ্য প্রমোট করুন।') 
                        : t('Your inventory list is currently empty.', 'আপনার ইনভেন্টরি তালিকা বর্তমানে খালি।')}
                  </p>
                  {!adSearchQuery && adViewTab === 'promoted' && (
                    <button
                      onClick={() => setAdViewTab('all')}
                      className="px-6 py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                    >
                      {t('Browse Store Inventory', 'স্টোর ইনভেন্টরি দেখুন')}
                    </button>
                  )}
                </div>
              ) : (
                filteredAdProducts.map((p) => {
                  const spent = (p.adClicks || 0) * 3;
                  const allocatedBudget = p.adBudget || 500;
                  const remaining = Math.max(0, allocatedBudget - spent);
                  const budgetPercent = Math.min(100, Math.round((spent / allocatedBudget) * 100));

                  // Proportional 7-day sparkline trend data based on real clicks and impressions
                  const totalClicks = p.adClicks || 0;
                  const totalImpr = p.adImpressions || 0;
                  const weights = [0.08, 0.11, 0.14, 0.12, 0.18, 0.16, 0.21];
                  const days = [
                    t('Mon', 'সোম'),
                    t('Tue', 'মঙ্গল'),
                    t('Wed', 'বুধ'),
                    t('Thu', 'বৃহঃ'),
                    t('Fri', 'শুক্র'),
                    t('Sat', 'শনি'),
                    t('Sun', 'রবি')
                  ];
                  const sparklineData = days.map((day, idx) => {
                    const dayClicks = Math.round(totalClicks * weights[idx]);
                    const dayImpr = Math.round(totalImpr * weights[idx]);
                    const heightPercent = Math.max(20, Math.min(100, Math.round((weights[idx] / 0.21) * 100)));
                    return { day, clicks: dayClicks, impressions: dayImpr, height: heightPercent };
                  });

                  return (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`bg-white/5 border rounded-[36px] p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden hover:-translate-y-2 hover:shadow-[0_25px_50px_rgba(0,0,0,0.7)] ${
                        p.isSponsored && p.adStatus !== 'ended'
                          ? 'border-amber-500/30 bg-gradient-to-b from-amber-500/[0.04] to-transparent shadow-[0_0_40px_rgba(245,158,11,0.03)]' 
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      {/* Image container with non-overlapping corner badges */}
                      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden mb-5 group/img">
                        <img 
                          src={p.image} 
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" 
                          alt={p.name}
                          onError={(e: any) => {
                            e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                        
                        {/* Category badge positioned safely top-left */}
                        <div className="absolute top-3 left-3 max-w-[45%] truncate bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] font-bold text-white uppercase tracking-wider border border-white/10 shadow-md z-10 shrink-0">
                          {translateCategory(p.category)}
                        </div>

                        {/* Sponsored badge positioned safely top-right */}
                        {p.isSponsored && p.adStatus !== 'ended' && (
                          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 border z-10 shrink-0 whitespace-nowrap ${
                            p.adStatus === 'active' 
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400/30' 
                              : 'bg-zinc-800/90 text-amber-300 border-zinc-700'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${p.adStatus === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                            {p.adStatus === 'active' ? t('SPONSORED', 'স্পনসর্ড') : t('PAUSED', 'বিরতি')}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 mb-6">
                        <div>
                          <h4 className="text-xs font-black text-white uppercase truncate">{p.name}</h4>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider truncate">{t('Shop:', 'দোকান:')} {p.seller?.name || t('Store Admin', 'স্টোর অ্যাডমিন')}</p>
                            <p className="text-xs font-black text-amber-400 font-mono">৳{formatProductBDT(p.price)}</p>
                          </div>
                        </div>

                        {p.isSponsored && p.adStatus !== 'ended' ? (
                          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">{t('Campaign status', 'ক্যাম্পেইন অবস্থা')}</span>
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${
                                p.adStatus === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                <span className={`w-1 h-1 rounded-full ${p.adStatus === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                                {p.adStatus === 'active' ? t('Active', 'সক্রিয়') : t('Paused', 'বিরতি')}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[8px] font-mono font-bold text-white/40 uppercase tracking-wider">
                              <div className="bg-[#111116] p-2.5 rounded-xl border border-white/5">
                                <span className="block text-white/20 mb-0.5">{t('Impressions', 'ইম্প্রেশন')}</span>
                                <span className="text-xs font-black text-white font-sans">{(p.adImpressions || 0).toLocaleString()}</span>
                              </div>
                              <div className="bg-[#111116] p-2.5 rounded-xl border border-white/5">
                                <span className="block text-white/20 mb-0.5">{t('Clicks', 'ক্লিক')}</span>
                                <span className="text-xs font-black text-white font-sans">{(p.adClicks || 0).toLocaleString()}</span>
                              </div>
                              <div className="bg-[#111116] p-2.5 rounded-xl border border-white/5">
                                <span className="block text-white/20 mb-0.5">{t('Spent (৳)', 'ব্যয় (৳)')}</span>
                                <span className="text-xs font-black text-amber-400 font-sans">৳{spent.toLocaleString()}</span>
                              </div>
                              <div className="bg-[#111116] p-2.5 rounded-xl border border-white/5">
                                <span className="block text-white/20 mb-0.5">{t('Budget Left', 'বাকি বাজেট')}</span>
                                <span className={`text-xs font-black font-sans ${remaining <= 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  ৳{remaining.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Budget Consumption Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[8px] font-mono text-white/40">
                                <span>{t('Budget Consumed', 'বাজেট খরচ হয়েছে')}</span>
                                <span>{budgetPercent}% (৳{spent}/৳{allocatedBudget})</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    budgetPercent >= 90 ? 'bg-rose-500' : budgetPercent >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`} 
                                  style={{ width: `${budgetPercent}%` }}
                                />
                              </div>
                            </div>

                            {/* Mini Activity Sparkline Trend with interactive tooltips */}
                            <div className="pt-2.5 border-t border-white/5 text-[9px] font-mono text-white/40">
                              <div className="flex items-center justify-between mb-2">
                                <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-white/50 font-bold">
                                  <TrendingUp size={10} className="text-amber-400" /> {t('Activity Trend', 'কার্যক্রমের ধারা')}
                                </span>
                                <span className="text-[8px] text-white/30">{t('Past 7 Days', 'গত ৭ দিন')}</span>
                              </div>
                              <div className="flex items-end justify-between gap-1.5 h-6 px-1.5 py-1 bg-[#101017] rounded-lg border border-white/5">
                                {sparklineData.map((d, idx) => (
                                  <div 
                                    key={idx} 
                                    className="flex-1 flex flex-col items-center justify-end h-full group/bar relative"
                                  >
                                    <div className="absolute bottom-full mb-1 hidden group-hover/bar:flex flex-col items-center bg-[#1c1c28] border border-white/20 text-white text-[8px] font-mono px-1.5 py-1 rounded shadow-xl pointer-events-none z-30 whitespace-nowrap -translate-x-1/2 left-1/2">
                                      <span className="text-amber-300 font-bold">{d.day}: {d.clicks} {t('clicks', 'ক্লিক')}</span>
                                      <span className="text-white/60">{d.impressions} {t('impressions', 'ইম্প্রেশন')}</span>
                                    </div>
                                    <div 
                                      className={`w-full rounded-t-sm transition-all duration-300 ${
                                        idx === 6 ? 'bg-amber-400' : 'bg-white/20 group-hover/bar:bg-amber-400/70'
                                      }`} 
                                      style={{ height: `${d.height}%` }}
                                      title={`${d.day}: ${d.clicks} ${t('clicks', 'ক্লিক')}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-white/[0.02] rounded-2xl border border-dashed border-white/10 text-center py-6">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">{t('Organic Listing', 'অর্গানিক তালিকা')}</span>
                            <span className="text-[8px] text-white/30 font-medium block">{t('Not active in sponsored feed carousels', 'স্পনসর্ড ফিড ক্যারোসেলে সক্রিয় নয়')}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions buttons */}
                      <div className="mt-auto space-y-2">
                        {p.isSponsored && p.adStatus !== 'ended' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={async () => {
                                const newStatus: 'active' | 'paused' = p.adStatus === 'active' ? 'paused' : 'active';
                                setProducts(prev => {
                                  const next = prev.map(item => item.id === p.id ? { ...item, adStatus: newStatus } : item);
                                  localStorage.setItem('elora-products', JSON.stringify(next));
                                  return next;
                                });
                                try {
                                  await adminApi.updateProduct(p.id, { adStatus: newStatus });
                                  showToast(newStatus === 'active' ? t(`Campaign resumed for "${p.name}".`, `"${p.name}"-এর ক্যাম্পেইন পুনরায় চালু হয়েছে।`) : t(`Campaign paused for "${p.name}".`, `"${p.name}"-এর ক্যাম্পেইন বিরতি দেওয়া হয়েছে।`), 'success');
                                } catch (err) {
                                  showToast(t('Status update failed', 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে'), 'error');
                                }
                              }}
                              className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                p.adStatus === 'active' 
                                  ? 'bg-[#1a1a24] hover:bg-[#252533] text-white border border-white/10' 
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                              }`}
                            >
                              {p.adStatus === 'active' ? (
                                <><Pause size={12} /> {t('Pause Ad', 'বিরতি দিন')}</>
                              ) : (
                                <><Play size={12} /> {t('Resume Ad', 'চালু করুন')}</>
                              )}
                            </button>
                            <button 
                              onClick={() => {
                                setAdminPromotingProduct(p);
                                setAdminAdBudgetInput(p.adBudget || 500);
                                setAdminAdStatusInput(p.adStatus === 'active');
                              }}
                              className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 size={12} /> {t('Edit Budget', 'বাজেট এডিট')}
                            </button>
                            <button 
                              onClick={() => {
                                setEndingCampaignProduct(p);
                              }}
                              className="col-span-2 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-rose-500/20 hover:border-transparent flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <StopCircle size={12} /> {t('End Campaign', 'ক্যাম্পেইন শেষ করুন')}
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setAdminPromotingProduct(p);
                              setAdminAdBudgetInput(500);
                              setAdminAdStatusInput(true);
                            }}
                            className="w-full py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles size={13} /> {t('Promote Product', 'পণ্য প্রমোট করুন')}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] admin-dark text-white font-sans flex w-full overflow-x-hidden relative">
      {/* Mobile Drawer Backdrop Overlay (< 1024px) */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation - Proven Single Component Pattern */}
      <aside 
        className={`border-r border-white/[0.08] bg-gradient-to-b from-[#0e0e15] via-[#09090e] to-[#060609] backdrop-blur-3xl flex flex-col z-50 overflow-visible fixed inset-y-0 left-0 h-full w-[280px] max-w-[85vw] transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:translate-x-0 lg:h-screen lg:sticky lg:top-0 lg:z-30 lg:shrink-0 transition-[width,padding] duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:w-[76px] lg:p-3' : 'lg:w-[260px] px-4 py-5'
        }`}
      >
        {/* Ambient top orange glow */}
        <div className="absolute top-0 left-0 right-0 h-44 bg-gradient-to-b from-brand-orange/[0.07] via-brand-orange/[0.015] to-transparent pointer-events-none" />

        {/* Desktop Quick Collapse/Expand Toggle Edge Button (Single Instance at Sidebar Edge) */}
        <button
          type="button"
          onClick={toggleSidebarCollapse}
          className="hidden lg:flex absolute right-0 translate-x-1/2 top-7 z-50 w-7 h-7 rounded-full bg-[#111118] border border-white/20 hover:border-brand-orange text-zinc-400 hover:text-white hover:bg-brand-orange shadow-lg shadow-black/60 items-center justify-center transition-all duration-200 cursor-pointer group active:scale-90 select-none focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
          title={isSidebarCollapsed ? t('Expand sidebar (Ctrl+B)', 'সাইডবার বড় করুন (Ctrl+B)') : t('Collapse sidebar (Ctrl+B)', 'সাইডবার ছোট করুন (Ctrl+B)')}
          aria-label={isSidebarCollapsed ? t('Expand sidebar', 'সাইডবার বড় করুন') : t('Collapse sidebar', 'সাইডবার ছোট করুন')}
        >
          {isSidebarCollapsed ? (
            <ChevronRight size={13} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
          ) : (
            <ChevronLeft size={13} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          )}
        </button>

        {/* Sidebar Brand Header */}
        {isSidebarCollapsed && isDesktop ? (
          <div className="flex flex-col items-center gap-3 mb-5 pb-4 border-b border-white/[0.08] relative z-10">
            <button
              type="button"
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
              className="w-11 h-11 bg-gradient-to-br from-[#FF8833] via-brand-orange to-[#D85705] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,114,36,0.4)] ring-1 ring-white/25 hover:scale-105 transition-all cursor-pointer group relative"
              title={t('Return to Storefront', 'স্টোরফ্রন্টে ফিরুন')}
            >
              <ShieldCheck size={24} strokeWidth={2} className="text-white drop-shadow-sm" />
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-zinc-900 border border-white/15 rounded-lg text-[11px] font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                {t('Storefront', 'স্টোরফ্রন্ট')}
              </div>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-white/[0.08] relative z-10">
            <div 
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
              title={t('Click to view storefront', 'স্টোরফ্রন্ট দেখতে ক্লিক করুন')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF8833] via-brand-orange to-[#D85705] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,114,36,0.4)] ring-1 ring-white/25 group-hover:scale-105 transition-all shrink-0">
                <ShieldCheck size={20} strokeWidth={2} className="text-white drop-shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm font-black uppercase tracking-tight text-white group-hover:text-brand-orange transition-colors">{t('Digital Shop T.M Admin', 'ডিজিটাল শপ T.M অ্যাডমিন')}</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                    isSuperAdmin 
                      ? 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30' 
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {isSuperAdmin ? <ShieldCheck size={10} /> : <Shield size={10} />}
                    {isSuperAdmin ? t('Super Admin', 'সুপার অ্যাডমিন') : t('Site Admin', 'সাইট অ্যাডমিন')}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[90px]" title={effectiveAdminEmail}>
                    {currentAdminUser?.name || effectiveAdminEmail.split('@')[0]}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Close Button (< 1024px) */}
            <button 
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-white/50 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label={t('Close navigation', 'নেভিগেশন বন্ধ করুন')}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="space-y-1 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 admin-scrollbar relative z-10">
          {ALL_SIDEBAR_NAV_ITEMS.filter((item) => isItemPermitted(item.id)).map((item) => {
            const unreadNotifCount = item.id === 'notifications' ? (notifications || []).filter(n => !n?.read).length : 0;
            const pendingReviewCount = item.id === 'reviews' ? (reviews || []).filter(r => r.status === 'pending').length : 0;
            const stockAlertCount = item.id === 'products' ? lowStockCount : 0;
            const hasAlert = unreadNotifCount > 0 || pendingReviewCount > 0 || stockAlertCount > 0;

            return (
              <div key={item.id} className="relative group">
                <button 
                  type="button"
                  onClick={() => {
                    setActiveView(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 cursor-pointer relative overflow-hidden ${
                    isSidebarCollapsed && isDesktop
                      ? 'h-11 justify-center px-0'
                      : 'gap-3 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider'
                  } ${
                    activeView === item.id 
                      ? 'bg-gradient-to-r from-[#F57224] via-[#FA7B2D] to-[#FF893B] text-white shadow-[0_4px_18px_rgba(245,114,36,0.32)] border border-white/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.05] active:scale-[0.99]'
                  }`}
                >
                  {/* Left-edge bright accent bar for active item */}
                  {activeView === item.id && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
                  )}

                  <div className={`shrink-0 flex items-center justify-center transition-all duration-200 ${
                    activeView === item.id 
                      ? 'text-white drop-shadow-sm' 
                      : 'text-zinc-400 group-hover:text-brand-orange group-hover:scale-105'
                  }`}>
                    {item.icon}
                  </div>

                  {/* Text label when expanded */}
                  {(!isSidebarCollapsed || !isDesktop) && (
                    <>
                      <span className="flex-1 text-left whitespace-nowrap text-[12px] font-bold tracking-tight">{item.label}</span>
                      {unreadNotifCount > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 bg-brand-orange text-white rounded-md text-[10px] font-mono font-bold shrink-0">
                          {unreadNotifCount}
                        </span>
                      )}
                      {stockAlertCount > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-md text-[10px] font-mono font-bold shrink-0" title={t(`${stockAlertCount} products low in stock`, `${stockAlertCount}টি পণ্যের স্টক কম`)}>
                          {stockAlertCount}
                        </span>
                      )}
                      {pendingReviewCount > 0 && activeView !== item.id && (
                        <span className="ml-auto px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md text-[10px] font-mono font-bold shrink-0">
                          {pendingReviewCount}
                        </span>
                      )}
                      {activeView === item.id && <motion.div layoutId="activeInd" className="w-1.5 h-1.5 bg-white rounded-full ml-1.5 shrink-0 shadow-[0_0_6px_#fff]" />}
                    </>
                  )}

                  {/* Collapsed dot badge indicator */}
                  {isSidebarCollapsed && isDesktop && hasAlert && (
                    <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-[#07070b] ${
                      stockAlertCount > 0 ? 'bg-rose-500 animate-pulse' : 'bg-brand-orange'
                    }`} />
                  )}
                </button>

                {/* Floating Tooltip in Collapsed Mode */}
                {isSidebarCollapsed && isDesktop && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-900 border border-white/15 rounded-xl shadow-2xl text-xs font-bold text-white whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 flex items-center gap-2 drop-shadow-2xl">
                    <span>{item.label}</span>
                    {unreadNotifCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-brand-orange text-white rounded text-[9px] font-mono">
                        {unreadNotifCount} {t('new', 'নতুন')}
                      </span>
                    )}
                    {stockAlertCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded text-[9px] font-mono">
                        {stockAlertCount} {t('low stock', 'কম স্টক')}
                      </span>
                    )}
                    {pendingReviewCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-500 text-black rounded text-[9px] font-mono font-bold">
                        {pendingReviewCount} {t('pending', 'অপেক্ষমাণ')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className={`mt-auto space-y-2 border-t border-white/[0.08] relative z-10 ${
          isSidebarCollapsed && isDesktop ? 'pt-3' : 'pt-4'
        }`}>
          {/* View Storefront */}
          <div className="relative group">
            <button 
              type="button"
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center rounded-xl bg-emerald-500/[0.08] hover:bg-emerald-500/[0.18] text-emerald-300 hover:text-emerald-100 border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer ${
                isSidebarCollapsed && isDesktop
                  ? 'h-11 justify-center px-0'
                  : 'gap-3 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider'
              }`}
              title={isSidebarCollapsed && isDesktop ? undefined : t('View Storefront', 'স্টোরফ্রন্ট দেখুন')}
            >
              <Home size={18} strokeWidth={1.8} className="shrink-0 transition-transform group-hover:scale-110" />
              {(!isSidebarCollapsed || !isDesktop) && <span className="whitespace-nowrap">{t('View Storefront', 'স্টোরফ্রন্ট দেখুন')}</span>}
            </button>
            {isSidebarCollapsed && isDesktop && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-900 border border-white/15 rounded-xl shadow-2xl text-xs font-bold text-emerald-400 whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 drop-shadow-2xl">
                {t('View Storefront', 'স্টোরফ্রন্ট দেখুন')}
              </div>
            )}
          </div>

          {/* Log Out */}
          <div className="relative group">
            <button 
              type="button"
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center rounded-xl bg-rose-500/[0.08] hover:bg-rose-500/[0.18] text-rose-300 hover:text-rose-100 border border-rose-500/20 hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 cursor-pointer ${
                isSidebarCollapsed && isDesktop
                  ? 'h-11 justify-center px-0'
                  : 'gap-3 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider'
              }`}
              title={isSidebarCollapsed && isDesktop ? undefined : t('Log Out', 'লগ আউট')}
            >
              <LogOut size={18} strokeWidth={1.8} className="shrink-0 transition-transform group-hover:scale-110" />
              {(!isSidebarCollapsed || !isDesktop) && <span className="whitespace-nowrap">{t('Log Out', 'লগ আউট')}</span>}
            </button>
            {isSidebarCollapsed && isDesktop && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-zinc-900 border border-white/15 rounded-xl shadow-2xl text-xs font-bold text-rose-400 whitespace-nowrap z-50 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 drop-shadow-2xl">
                {t('Log Out', 'লগ আউট')}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Sticky Top Header with Proven Pattern */}
        <header className="sticky top-0 z-30 h-16 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 flex items-center justify-between gap-3 w-full shrink-0">
          {/* Left: Hamburger menu button (< 1024px) + Active View Title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white shrink-0 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/50"
              aria-label={t('Open navigation menu', 'নেভিগেশন মেনু খুলুন')}
            >
              <Menu size={20} />
            </button>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-black text-white truncate tracking-tight uppercase">
                {activeView === 'overview' && t('Dashboard Overview', 'ড্যাশবোর্ড ওভারভিউ')}
                {activeView === 'analytics' && t('Analytics & Reports', 'বিশ্লেষণ ও রিপোর্ট')}
                {activeView === 'sellers' && t('Merchants & Sellers', 'বিক্রেতা ও মার্চেন্ট')}
                {activeView === 'products' && t('Product Approvals', 'পণ্য অনুমোদন')}
                {activeView === 'orders' && t('Orders & Fulfillment', 'অর্ডার ও ডেলিভারি')}
                {activeView === 'returns' && t('Return Requests', 'রিটার্ন ও রিফান্ড')}
                {activeView === 'users' && t('Customers & Users', 'গ্রাহক ও ব্যবহারকারী')}
                {activeView === 'roles' && t('Roles & Permissions', 'রোল ও অনুমতি')}
                {activeView === 'reviews' && t('Reviews & Feedback', 'রিভিউ ও মতামত')}
                {activeView === 'coupons' && t('Promotions & Coupons', 'প্রমোশন ও কুপন')}
                {activeView === 'ads' && t('Ads & Campaigns', 'বিজ্ঞাপন ও ক্যাম্পেইন')}
                {activeView === 'flash_sales' && t('Flash Sales', 'ফ্ল্যাশ সেল')}
                {activeView === 'activity_log' && t('Activity Log', 'কার্যকলাপ লগ')}
                {activeView === 'notifications' && t('Notifications', 'বিজ্ঞপ্তি')}
                {activeView === 'settings' && t('Store Settings', 'স্টোর সেটিংস')}
                {activeView === 'trash' && t('Trash & Recovery', 'ট্র্যাশ ও পুনরুদ্ধার')}
              </h1>
              <p className="hidden sm:block text-[10px] text-zinc-400 font-mono truncate">
                {t('Digital Shop T.M', 'ডিজিটাল শপ T.M')} • {isSuperAdmin ? t('Super Admin', 'সুপার অ্যাডমিন') : t('Site Admin', 'সাইট অ্যাডমিন')}
              </p>
            </div>
          </div>

          {/* Right: Search, LanguageSwitcher, Notifications Bell, Return to Storefront */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Toggle (< 640px) */}
            <div className="sm:hidden">
              {isMobileSearchOpen ? (
                <div className="fixed inset-x-0 top-0 h-16 bg-[#0a0a0f] border-b border-white/10 z-50 flex items-center px-4 gap-2">
                  <Search size={16} className="text-brand-orange shrink-0" />
                  <input
                    type="text"
                    autoFocus
                    value={globalSearchTerm}
                    onChange={(e) => setGlobalSearchTerm(e.target.value)}
                    placeholder={t('Search orders, products, sellers...', 'অর্ডার, পণ্য, বিক্রেতা খুঁজুন...')}
                    className="flex-1 bg-transparent text-xs text-white placeholder-gray-400 outline-none font-medium"
                  />
                  {globalSearchTerm && (
                    <button onClick={() => setGlobalSearchTerm('')} className="p-1 text-gray-400 hover:text-white">
                      <X size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="px-2.5 py-1 bg-white/10 text-white rounded-lg text-xs font-bold"
                  >
                    {t('Done', 'সম্পন্ন')}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title={t('Search', 'অনুসন্ধান')}
                >
                  <Search size={17} />
                </button>
              )}
            </div>

            {/* Desktop Search (>= 640px) */}
            <div className="hidden sm:flex items-center relative w-44 md:w-56 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                placeholder={t('Search orders, products...', 'অর্ডার, পণ্য খুঁজুন...')}
                className="w-full bg-white/5 border border-white/10 rounded-xl h-9 pl-8 pr-7 outline-none focus:border-brand-orange text-xs font-medium text-white transition-all placeholder-gray-500"
              />
              {globalSearchTerm && (
                <button
                  type="button"
                  onClick={() => setGlobalSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher variant="dark" />

            {/* Notifications Bell in Header */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen)}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all relative cursor-pointer ${
                  isNotificationsDropdownOpen 
                    ? 'bg-brand-orange/20 border-brand-orange text-brand-orange shadow-lg shadow-orange-500/20' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
                }`}
                title={t('Notifications', 'বিজ্ঞপ্তি')}
              >
                <Bell size={17} />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[16px] h-[16px] bg-brand-orange text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0a0a0f]">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Return to Storefront Exit Button */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              title={t('Return to Storefront', 'স্টোরফ্রন্টে ফিরুন')}
            >
              <Home size={15} className="shrink-0 text-emerald-400" />
              <span className="hidden md:inline">{t('Storefront', 'স্টোরফ্রন্ট')}</span>
            </button>
          </div>
        </header>

        {/* Main Content View Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-x-hidden relative">
        {/* Background Atmosphere */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[150px] -z-10" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-orange/5 rounded-full blur-[150px] -z-10" />

        <div className="max-w-7xl mx-auto relative z-10 text-left">
           {/* Top Stats HUD */}
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-2 capitalize">
                  {activeView === 'overview' && t('Dashboard Overview', 'ড্যাশবোর্ড ওভারভিউ')}
                  {activeView === 'analytics' && t('Analytics & Business Intelligence', 'বিশ্লেষণ ও বিজনেস ইন্টেলিজেন্স')}
                  {activeView === 'sellers' && t('Merchants & Sellers', 'বিক্রেতা ও মার্চেন্ট')}
                  {activeView === 'products' && t('Product Approvals & Inventory', 'পণ্য অনুমোদন ও ইনভেন্টরি')}
                  {activeView === 'orders' && t('Orders & Fulfillment', 'অর্ডার ও ডেলিভারি')}
                  {activeView === 'returns' && t('Return Requests & Refunds', 'রিটার্ন অনুরোধ ও রিফান্ড')}
                  {activeView === 'users' && t('Customers & Users', 'গ্রাহক ও ব্যবহারকারী')}
                  {activeView === 'roles' && t('Roles & Access Permissions', 'রোল ও অ্যাক্সেস অনুমতি')}
                  {activeView === 'reviews' && t('Reviews & Feedback', 'রিভিউ ও মতামত')}
                  {activeView === 'coupons' && t('Promotions & Coupons', 'প্রমোশন ও কুপন')}
                  {activeView === 'ads' && t('Ads & Promotions', 'বিজ্ঞাপন ও প্রমোশন')}
                  {activeView === 'flash_sales' && t('Flash Sales', 'ফ্ল্যাশ সেল')}
                  {activeView === 'activity_log' && t('Activity Log & Audit Trail', 'কার্যকলাপ লগ ও অডিট ট্রেইল')}
                  {activeView === 'notifications' && t('System Notifications & Alerts', 'সিস্টেম বিজ্ঞপ্তি ও সতর্কতা')}
                  {activeView === 'settings' && t('Store Settings', 'স্টোর সেটিংস')}
                  {activeView === 'trash' && t('Trash & Recovery', 'ট্র্যাশ ও পুনরুদ্ধার')}
                </h2>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-gray-300">{t('System Online', 'সিস্টেম অনলাইন')}</span>
                   </div>
                   {/* Health & Memory Usage Check (Group 2) */}
                   <AdminHealthWidget products={products} orders={orders} users={users} />
                   <div className="w-1 h-1 bg-white/20 rounded-full" />
                   <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border ${
                     isSuperAdmin 
                       ? 'bg-brand-orange/15 border-brand-orange/30 text-brand-orange shadow-sm' 
                       : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                   }`}>
                     {isSuperAdmin ? <ShieldCheck size={12} /> : <Shield size={12} />}
                     <span>{isSuperAdmin ? t('Super Admin', 'সুপার অ্যাডমিন') : t('Site Admin', 'সাইট অ্যাডমিন')}</span>
                   </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-orange transition-colors" size={18} />
                    <input 
                      type="text" 
                      value={globalSearchTerm}
                      onChange={(e) => setGlobalSearchTerm(e.target.value)}
                      placeholder={t('Search orders, products, merchants...', 'অর্ডার, পণ্য, মার্চেন্ট খুঁজুন...')}
                      className="bg-white/5 border border-white/10 rounded-xl h-11 pl-11 pr-10 outline-none focus:border-brand-orange text-xs font-medium text-white transition-all w-full md:w-80"
                    />
                    {globalSearchTerm && (
                      <button
                        onClick={() => setGlobalSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title={t('Clear search', 'অনুসন্ধান মুছুন')}
                      >
                        <X size={14} />
                      </button>
                    )}
                 </div>

                 {/* Notifications Bell with Live Unread Badge and Dropdown */}
                 <div className="relative">
                   <button
                     type="button"
                     onClick={() => setIsNotificationsDropdownOpen(!isNotificationsDropdownOpen)}
                     className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all relative cursor-pointer ${
                       isNotificationsDropdownOpen 
                         ? 'bg-brand-orange/20 border-brand-orange text-brand-orange shadow-lg shadow-orange-500/20' 
                         : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
                     }`}
                     title={t('Notifications & Alerts', 'বিজ্ঞপ্তি ও সতর্কতা')}
                   >
                     <Bell size={18} />
                     {unreadNotificationsCount > 0 && (
                       <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] bg-brand-orange text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#09090b] animate-bounce">
                         {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                       </span>
                     )}
                   </button>

                   {/* Notification Quick Dropdown */}
                   <AnimatePresence>
                     {isNotificationsDropdownOpen && (
                       <>
                         <div 
                           className="fixed inset-0 z-40" 
                           onClick={() => setIsNotificationsDropdownOpen(false)} 
                         />
                         <motion.div
                           initial={{ opacity: 0, y: 10, scale: 0.96 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0, y: 10, scale: 0.96 }}
                           transition={{ duration: 0.15 }}
                           className="absolute right-0 mt-3 w-80 sm:w-96 bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50 overflow-hidden text-left"
                         >
                           <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                             <div className="flex items-center gap-2">
                               <Bell size={15} className="text-brand-orange" />
                               <h4 className="text-xs font-black uppercase text-white tracking-wider">{t('Recent Alerts', 'সাম্প্রতিক সতর্কতা')}</h4>
                               {unreadNotificationsCount > 0 && (
                                 <span className="px-2 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange text-[10px] font-bold">
                                   {unreadNotificationsCount} {t('new', 'নতুন')}
                                 </span>
                               )}
                             </div>
                             {unreadNotificationsCount > 0 && (
                               <button
                                 type="button"
                                 onClick={handleMarkAllNotificationsRead}
                                 className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                               >
                                 {t('Mark all read', 'সব পঠিত চিহ্নিত করুন')}
                               </button>
                             )}
                           </div>

                           <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                             {localizedNotifications.length === 0 ? (
                               <div className="py-8 text-center text-gray-500">
                                 <Bell size={24} className="mx-auto mb-2 opacity-30" />
                                 <p className="text-xs font-bold">{t('No notifications', 'কোনো বিজ্ঞপ্তি নেই')}</p>
                               </div>
                             ) : (
                               localizedNotifications.slice(0, 5).map(n => (
                                 <div
                                   key={n.id}
                                   onClick={() => {
                                     handleMarkNotificationRead(n.id);
                                     if (n.actionView) {
                                       setActiveView(n.actionView as any);
                                       setIsNotificationsDropdownOpen(false);
                                     }
                                   }}
                                   className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                                     !n.read 
                                       ? 'bg-white/10 border-brand-orange/40 hover:bg-white/15' 
                                       : 'bg-white/5 border-white/5 hover:bg-white/10'
                                   }`}
                                 >
                                   <div className="flex items-start justify-between gap-2">
                                     <span className="text-xs font-bold text-white line-clamp-1">{n.title}</span>
                                     <span className="text-[9px] text-gray-500 shrink-0 font-mono">
                                       {new Date(n.createdAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                   </div>
                                   <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">{n.message}</p>
                                 </div>
                               ))
                             )}
                           </div>

                           <div className="pt-3 border-t border-white/10 mt-3">
                             <button
                               type="button"
                               onClick={() => {
                                 setActiveView('notifications');
                                 setIsNotificationsDropdownOpen(false);
                               }}
                               className="w-full py-2 bg-white/5 hover:bg-brand-orange hover:text-white text-gray-300 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                             >
                               {t('View All Notifications', 'সব বিজ্ঞপ্তি দেখুন')}
                             </button>
                           </div>
                         </motion.div>
                       </>
                     )}
                   </AnimatePresence>
                 </div>
              </div>
           </div>

           {/* Active Simulation Mode Banner */}
           {simulatedAdminEmail && (
             <div className="mb-6 p-4 bg-gradient-to-r from-blue-950/80 via-indigo-950/70 to-blue-950/80 border border-blue-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xl">
               <div className="flex items-center gap-3 text-blue-200">
                 <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400">
                   <Eye size={18} className="animate-pulse" />
                 </div>
                 <div>
                   <p className="text-xs font-black uppercase tracking-wider text-white">
                     {t('Active Simulation Mode — Viewing as Site Admin', 'সক্রিয় সিমুলেশন মোড — সাইট অ্যাডমিন হিসেবে দেখছেন')}
                   </p>
                   <p className="text-[11px] text-blue-200/80 mt-0.5">
                     {isBangla ? (
                       <><strong>{currentAdminUser?.name || simulatedAdminEmail}</strong>-এর অনুমোদিত পারমিশন অনুযায়ী প্যানেল দেখা হচ্ছে। সীমাবদ্ধ বিভাগগুলো সাইডবার থেকে লুকানো হয়েছে।</>
                     ) : (
                       <>Previewing panel through <strong>{currentAdminUser?.name || simulatedAdminEmail}</strong>&apos;s granted permissions. Restricted sections are hidden from the sidebar.</>
                     )}
                   </p>
                 </div>
               </div>
               <button
                 type="button"
                 onClick={() => setSimulatedAdminEmail(null)}
                 className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
               >
                 {t('Exit Simulation', 'সিমুলেশন থেকে বের হন')}
               </button>
             </div>
           )}

           {/* Permission Denied Alert Banner */}
           {authPermissionError && (
             <div className="mb-6 p-4 sm:p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
               <div className="flex items-start sm:items-center gap-3.5">
                 <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                   <ShieldAlert size={20} />
                 </div>
                 <div>
                   <div className="flex items-center gap-2">
                     <h3 className="text-xs font-black uppercase tracking-wider text-rose-200">
                       {t('Database Permission Denied', 'ডাটাবেস অনুমতি প্রত্যাখ্যাত হয়েছে')}
                     </h3>
                     {authPermissionError.path && (
                       <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/40 text-[10px] font-mono text-rose-300 rounded-md">
                         {authPermissionError.path}
                       </span>
                     )}
                   </div>
                   <p className="text-[11px] text-rose-300/90 mt-1 leading-relaxed">
                     {authPermissionError.message}
                   </p>
                   {authPermissionError.details && (
                     <p className="text-[10px] text-zinc-400 font-mono mt-1 line-clamp-2">
                       {authPermissionError.details}
                     </p>
                   )}
                 </div>
               </div>
               <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                 <button
                   type="button"
                   onClick={() => {
                     setAuthPermissionError(null);
                     refreshView();
                   }}
                   className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                 >
                   <RefreshCw size={13} />
                   <span>{t('Retry', 'আবার চেষ্টা করুন')}</span>
                 </button>
                 <button
                   type="button"
                   onClick={() => setAuthPermissionError(null)}
                   className="p-2 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                   title={t('Dismiss', 'বন্ধ করুন')}
                 >
                   <X size={16} />
                 </button>
               </div>
             </div>
           )}

           <AnimatePresence mode="wait">
             <motion.div
               key={activeView}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3 }}
             >
               {!isItemPermitted(activeView) ? (
                 <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-zinc-950/40 border border-rose-500/20 rounded-3xl max-w-xl mx-auto shadow-2xl">
                   <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mb-6 shadow-xl shadow-rose-500/10">
                     <ShieldAlert size={32} />
                   </div>
                   <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-black uppercase tracking-widest rounded-full mb-3">
                     {t('Access Restricted', 'অ্যাক্সেস সীমাবদ্ধ')}
                   </span>
                   <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                     {t('Section Not Permitted', 'এই বিভাগে অনুমতি নেই')}
                   </h2>
                   <p className="text-xs text-gray-400 mt-2 max-w-md leading-relaxed">
                     {isBangla ? (
                       <>আপনার অ্যাডমিন প্রোফাইলে <strong className="text-white">{ALL_SIDEBAR_NAV_ITEMS.find(item => item.id === activeView)?.label || activeView}</strong> বিভাগের জন্য অনুমতি নেই।</>
                     ) : (
                       <>Your administrator profile does not have permission granted for the <strong className="text-white capitalize">{activeView}</strong> section.</>
                     )}
                   </p>
                   <div className="mt-6">
                     <button
                       type="button"
                       onClick={() => {
                         const fallback = ALL_SIDEBAR_NAV_ITEMS.find(item => isItemPermitted(item.id));
                         if (fallback) setActiveView(fallback.id as any);
                       }}
                       className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-500/20"
                     >
                       {t('Return to Permitted Section', 'অনুমোদিত বিভাগে ফিরে যান')}
                     </button>
                   </div>
                 </div>
               ) : (
                 <>
                   {isSectionReadOnly(activeView) && (
                     <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-4 text-left shadow-lg">
                       <div className="flex items-center gap-3 text-amber-400">
                         <Eye size={18} className="shrink-0 text-amber-400" />
                         <div>
                           <p className="text-xs font-black uppercase tracking-wider text-amber-300">{t('Read-Only View Privileges', 'শুধুমাত্র দেখার অনুমতি')}</p>
                           <p className="text-[11px] text-amber-200/70">
                             {t(
                               'You have read-only access to this section. Modifying, deleting, or updating data is disabled.',
                               'এই বিভাগে আপনার শুধুমাত্র দেখার অনুমতি রয়েছে। ডেটা পরিবর্তন, মুছে ফেলা বা আপডেট করা নিষ্ক্রিয় করা আছে।'
                             )}
                           </p>
                         </div>
                       </div>
                       <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-[10px] font-mono font-bold uppercase shrink-0">
                         {t('View Only', 'শুধু দেখা')}
                       </span>
                     </div>
                   )}

                   {activeView === 'overview' && renderOverview()}
                   {activeView === 'analytics' && (
                     <AdminAnalytics 
                       orders={orders} 
                       products={products} 
                       users={users} 
                       onNavigateView={(v) => setActiveView(v as any)} 
                     />
                   )}
                   {activeView === 'sellers' && renderSellers()}
                   {activeView === 'products' && renderProducts()}
                   {activeView === 'orders' && renderOrders()}
                   {activeView === 'returns' && <AdminReturnsManagement />}
                   {activeView === 'users' && renderUsers()}
                   {activeView === 'roles' && (
                     <AdminRoles 
                       users={users} 
                       currentUserEmail={effectiveAdminEmail} 
                       onUpdateUserRole={async (userId, data) => {
                         await updateGlobalUsers(userId, data);
                         const target = (users || []).find(u => u.id === userId);
                         logAdminAction('Role_Change', 'Role', target?.name || 'Admin', );
                         showToast(t('Permissions updated successfully', 'অনুমতি সফলভাবে আপডেট করা হয়েছে'), 'success');
                       }}
                       onCreateSiteAdmin={handleCreateSiteAdmin}
                       onRevokeAdmin={handleRevokeAdmin}
                       onSimulateAdminView={(email) => setSimulatedAdminEmail(email)}
                       simulatedAdminEmail={simulatedAdminEmail}
                     />
                   )}
                   {activeView === 'reviews' && renderReviews()}
                   {activeView === 'coupons' && renderCoupons()}
                   {activeView === 'settings' && renderSettings()}
                   {activeView === 'trash' && renderTrash()}
                   {activeView === 'ads' && renderAds()}
                   {activeView === 'flash_sales' && renderFlashSales()}
                   {activeView === 'activity_log' && <AdminActivityLog logs={localizedActivityLogs} />}
                   {activeView === 'notifications' && (
                     <AdminNotifications 
                       notifications={localizedNotifications} 
                       onMarkAsRead={handleMarkNotificationRead} 
                       onMarkAllAsRead={handleMarkAllNotificationsRead} 
                       onClearNotifications={() => setNotifications([])} 
                       onNavigateAction={(v) => setActiveView(v as any)} 
                     />
                   )}
                 </>
               )}
             </motion.div>
           </AnimatePresence>

        </div>
      </main>
      </div>

      {/* Ad Campaign Configuration Modal */}
      <AnimatePresence>
        {adminPromotingProduct && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdminPromotingProduct(null)}
              className="absolute inset-0 bg-[#07070b]/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-lg bg-[#16161d] border border-white/10 rounded-[48px] p-10 overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.15)] text-left"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="text-amber-400" size={20} /> {t('Configure Ad Campaign', 'বিজ্ঞাপন ক্যাম্পেইন কনফিগার করুন')}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{t('Set campaign budget and active status', 'ক্যাম্পেইনের বাজেট এবং সক্রিয় অবস্থা নির্ধারণ করুন')}</p>
                </div>
                <button 
                  onClick={() => setAdminPromotingProduct(null)}
                  className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Product Info Card Preview */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/5 mb-6">
                <img src={adminPromotingProduct.image} className="w-16 h-16 object-cover rounded-2xl" alt={adminPromotingProduct.name || t('Ad campaign product', 'বিজ্ঞাপন ক্যাম্পেইন পণ্য')} />
                <div>
                  <h4 className="text-xs font-black text-white uppercase truncate max-w-[280px]">{adminPromotingProduct.name}</h4>
                  <p className="text-[10px] text-amber-500 font-bold tracking-widest mt-1">৳{formatProductBDT(adminPromotingProduct.price)}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Budget Configuration */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{t('Select or Enter Budget (৳ BDT)', 'বাজেট নির্বাচন বা লিখুন (৳ টাকা)')}</label>
                    <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest">{t('CPC: ৳3.00 BDT', 'সিপিসি: ৳৩.০০ টাকা')}</span>
                  </div>
                  
                  {/* Presets Grid */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[500, 1000, 2000, 5000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAdminAdBudgetInput(preset)}
                        className={`py-2.5 rounded-xl text-[10px] font-mono font-black border transition-all cursor-pointer ${
                          adminAdBudgetInput === preset 
                            ? 'bg-amber-500 border-amber-500 text-white shadow-md' 
                            : 'bg-[#111116] border-white/5 text-white/50 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        ৳{preset}
                      </button>
                    ))}
                  </div>

                  {/* Manual Input without leading zero error */}
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-white/30 font-mono">৳</span>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      placeholder={t('Enter custom budget amount', 'কাস্টম বাজেটের পরিমাণ লিখুন')}
                      value={adminAdBudgetInput || ''}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, '');
                        if (!raw) {
                          setAdminAdBudgetInput(0);
                        } else {
                          setAdminAdBudgetInput(parseInt(raw, 10));
                        }
                      }}
                      className="w-full h-14 bg-[#111116] border border-white/10 rounded-2xl pl-10 pr-5 text-sm font-black font-mono text-white outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Validation error and Estimated clicks preview */}
                  <div className="mt-2 space-y-1">
                    {adminAdBudgetInput > 0 && adminAdBudgetInput < 500 && (
                      <p className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                        <AlertCircle size={11} /> {t('Minimum campaign budget is ৳500 BDT', 'সর্বনিম্ন ক্যাম্পেইন বাজেট ৳৫০০ টাকা')}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
                      <span>{t('Estimated Clicks:', 'আনুমানিক ক্লিক:')}</span>
                      <span className="text-amber-400 font-bold font-sans">
                        ≈ {Math.floor((adminAdBudgetInput || 0) / 3).toLocaleString()} {t('clicks (@ ৳3 CPC)', 'ক্লিক (@ ৳৩ সিপিসি)')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <div>
                    <p className="text-xs font-bold text-white">{t('Campaign Active Status', 'ক্যাম্পেইন সক্রিয় অবস্থা')}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t('Show this product in sponsored storefront carousels', 'স্টোরফ্রন্টের স্পন্সরড ক্যারোজেলে এই পণ্যটি দেখান')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminAdStatusInput(!adminAdStatusInput)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${adminAdStatusInput ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${adminAdStatusInput ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Save button */}
                <button
                  type="button"
                  disabled={isSavingAdCampaign}
                  onClick={async () => {
                    if (!adminAdBudgetInput || adminAdBudgetInput < 500) {
                      showToast(t('Minimum campaign budget is ৳500 BDT', 'সর্বনিম্ন ক্যাম্পেইন বাজেট ৳৫০০ টাকা'), 'error');
                      return;
                    }
                    setIsSavingAdCampaign(true);
                    const targetProduct = adminPromotingProduct;
                    const updates = {
                      isSponsored: true,
                      adBudget: adminAdBudgetInput,
                      adStatus: (adminAdStatusInput ? 'active' : 'paused') as 'active' | 'paused',
                      adImpressions: targetProduct.adImpressions || 0,
                      adClicks: targetProduct.adClicks || 0
                    };

                    setProducts(prev => {
                      const next = prev.map(item => item.id === targetProduct.id ? { ...item, ...updates } : item);
                      localStorage.setItem('elora-products', JSON.stringify(next));
                      return next;
                    });

                    try {
                      await adminApi.updateProduct(targetProduct.id, updates);
                      showToast(t(`Ad campaign activated for "${targetProduct.name}"!`, `"${targetProduct.name}"-এর জন্য বিজ্ঞাপন ক্যাম্পেইন চালু হয়েছে!`), 'success');
                      setAdViewTab('promoted');
                      setAdminPromotingProduct(null);
                    } catch (err) {
                      showToast(t('Failed to save campaign settings', 'ক্যাম্পেইন সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে'), 'error');
                    } finally {
                      setIsSavingAdCampaign(false);
                    }
                  }}
                  className={`w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2 ${
                    isSavingAdCampaign ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  <Sparkles size={14} />
                  {isSavingAdCampaign ? t('Saving Settings...', 'সেটিংস সংরক্ষণ হচ্ছে...') : t('Save Campaign Settings', 'ক্যাম্পেইন সেটিংস সংরক্ষণ করুন')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* End Campaign Confirmation Modal */}
      <AnimatePresence>
        {endingCampaignProduct && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEndingCampaignProduct(null)}
              className="absolute inset-0 bg-[#07070b]/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-md bg-[#16161d] border border-rose-500/30 rounded-[36px] p-8 overflow-hidden shadow-[0_0_80px_rgba(244,63,94,0.15)] text-left"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-5">
                <AlertCircle size={24} />
              </div>
              
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                {t('End Ad Campaign?', 'বিজ্ঞাপন ক্যাম্পেইন শেষ করবেন?')}
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed mb-6">
                {isBangla ? (
                  <>আপনি কি নিশ্চিত যে <span className="text-white font-bold">"{endingCampaignProduct.name}"</span>-এর এই ক্যাম্পেইন শেষ করতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না। পণ্যটি স্পন্সরড ক্যারোজেলে দেখানো বন্ধ হবে এবং সাধারণ স্টোর ইনভেন্টরিতে ফিরে যাবে।</>
                ) : (
                  <>Are you sure you want to end this campaign for <span className="text-white font-bold">"{endingCampaignProduct.name}"</span>? This cannot be undone. The product will stop displaying in sponsored carousels and return to standard store inventory as a regular (non-sponsored) listing.</>
                )}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEndingCampaignProduct(null)}
                  className="py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/10 cursor-pointer"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const target = endingCampaignProduct;
                    const updates = {
                      isSponsored: false,
                      adStatus: 'ended' as const,
                      adBudget: 0
                    };
                    setProducts(prev => {
                      const next = prev.map(item => item.id === target.id ? { ...item, ...updates } : item);
                      localStorage.setItem('elora-products', JSON.stringify(next));
                      return next;
                    });
                    try {
                      await adminApi.updateProduct(target.id, updates);
                      showToast(t(`Campaign ended for "${target.name}". Moved to regular inventory.`, `"${target.name}"-এর ক্যাম্পেইন শেষ হয়েছে। সাধারণ ইনভেন্টরিতে সরানো হয়েছে।`), 'info');
                    } catch (e) {
                      showToast(t('Failed to end campaign', 'ক্যাম্পেইন শেষ করতে ব্যর্থ হয়েছে'), 'error');
                    } finally {
                      setEndingCampaignProduct(null);
                    }
                  }}
                  className="py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  {t('End Campaign', 'ক্যাম্পেইন শেষ করুন')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgraded Add/Edit Product Modal with Multiple Images, Specs, Badges, Search Tags, Sizes, Delivery Fee Override (Group 4) */}
      {(isProductModalOpen || !!editingProduct) && (
        <AdminProductFormModal
          product={editingProduct}
          isOpen={isProductModalOpen || !!editingProduct}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={async (payload) => {
            if (editingProduct) {
              await adminApi.updateProduct(editingProduct.id, payload);
              setProducts(prev => {
                const next = prev.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p);
                localStorage.setItem('elora-products', JSON.stringify(next));
                return next;
              });
              showToast(t(`Product "${payload.name || editingProduct.name}" updated successfully`, `পণ্য "${payload.name || editingProduct.name}" সফলভাবে আপডেট করা হয়েছে`), 'success');
            } else {
              const newProdPayload: any = {
                ...payload,
                rating: 5,
                reviews: 0,
                soldCount: 0,
                status: payload.status || 'approved',
                createdAt: new Date().toISOString(),
                seller: {
                  name: 'Digital Shop Official Store',
                  rating: 5.0,
                  followers: '150k',
                  chatResponse: '100%'
                }
              };
              const created = await adminApi.createProduct(newProdPayload);
              const normalizedCreated = normalizeProduct({ ...newProdPayload, id: created?.id || `prod-${Date.now()}` });
              setProducts(prev => {
                const next = [normalizedCreated, ...prev];
                localStorage.setItem('elora-products', JSON.stringify(next));
                return next;
              });
              showToast(t(`Product "${payload.name}" published successfully`, `পণ্য "${payload.name}" সফলভাবে প্রকাশিত হয়েছে`), 'success');
            }
            setIsProductModalOpen(false);
            setEditingProduct(null);
            refreshView();
          }}
        />
      )}

      {/* Reject Product Confirmation Dialog with Reason Presets */}
      <AnimatePresence>
        {rejectingProduct && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setRejectingProduct(null); setRejectionReasonInput(''); }}
              className="fixed inset-0 bg-[#07070b]/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#14141c] border border-rose-500/20 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl z-10 text-left"
            >
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
                  <Ban size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black text-white uppercase tracking-tight">{t('Reject Product Listing', 'পণ্য তালিকা প্রত্যাখ্যান করুন')}</h3>
                  <p className="text-xs text-gray-400 truncate">{rejectingProduct.name}</p>
                </div>
                <button 
                  onClick={() => { setRejectingProduct(null); setRejectionReasonInput(''); }}
                  className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Product mini card */}
              <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl mb-4">
                <img 
                  src={rejectingProduct.image} 
                  alt={rejectingProduct.name}
                  className="w-14 h-14 object-cover rounded-xl bg-black/40 border border-white/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{rejectingProduct.name}</p>
                  <p className="text-[11px] text-gray-400">{t('Seller:', 'বিক্রেতা:')} <strong className="text-white">{rejectingProduct.seller?.name || t('Digital Shop Official Store', 'ডিজিটাল শপ অফিসিয়াল স্টোর')}</strong></p>
                  <p className="text-[11px] text-brand-orange font-mono font-bold">৳{formatProductBDT(rejectingProduct.price)}</p>
                </div>
              </div>

              {/* Rejection Reason Input */}
              <div className="space-y-2 mb-4">
                <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-rose-400" />
                  <span>{t('Specify Reason for Rejection', 'প্রত্যাখ্যানের কারণ উল্লেখ করুন')}</span>
                </label>
                <textarea 
                  rows={3}
                  placeholder={t('Explain why this product does not meet marketplace guidelines...', 'এই পণ্যটি কেন মার্কেটপ্লেসের নীতিমালা পূরণ করে না তা ব্যাখ্যা করুন...')}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-rose-500 transition-all resize-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5 mb-6">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('Quick Presets:', 'দ্রুত কারণসমূহ:')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    t('Image quality is too low or watermarked', 'ছবির মান খুব কম বা ওয়াটারমার্কযুক্ত'),
                    t('Inaccurate or incomplete product description', 'পণ্যের বিবরণ অসম্পূর্ণ বা ভুল'),
                    t('Pricing is abnormal or does not match guidelines', 'মূল্য অস্বাভাবিক বা নীতিমালার সাথে মেলে না'),
                    t('Duplicate product listing already exists', 'একই পণ্যের ডুপ্লিকেট তালিকা ইতিমধ্যেই রয়েছে')
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReasonInput(preset)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-gray-300 hover:text-rose-300 rounded-lg text-[10px] font-medium transition-colors cursor-pointer text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setRejectingProduct(null); setRejectionReasonInput(''); }}
                  className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  className="py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-900/40 flex items-center justify-center gap-1.5"
                >
                  <Ban size={14} />
                  <span>{t('Confirm Rejection', 'প্রত্যাখ্যান নিশ্চিত করুন')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inspect Product Details & Gallery Modal */}
      <AnimatePresence>
        {inspectingProduct && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectingProduct(null)}
              className="fixed inset-0 bg-[#07070b]/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-[#12121a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-10 my-auto text-left max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/20 border border-brand-orange/30 text-brand-orange flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight line-clamp-1">
                      {inspectingProduct.name}
                    </h3>
                    <p className="text-xs text-gray-400">{t('Product ID:', 'পণ্য আইডি:')} <span className="font-mono text-gray-300">{inspectingProduct.id}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => setInspectingProduct(null)}
                  className="w-9 h-9 bg-white/5 hover:bg-rose-600 rounded-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body: Split View with Gallery on Left and Details on Right */}
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Gallery & Zoom */}
                <div className="space-y-3">
                  {(() => {
                    const galleryList = Array.isArray(inspectingProduct.gallery) && inspectingProduct.gallery.length > 0
                      ? inspectingProduct.gallery
                      : [inspectingProduct.image];
                    const currentImg = galleryList[inspectingImageIndex] || inspectingProduct.image;

                    return (
                      <>
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-black/60 border border-white/10 relative group">
                          <img 
                            src={currentImg} 
                            alt={inspectingProduct.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider border border-white/10">
                            {translateCategory(inspectingProduct.category)}
                          </div>
                        </div>

                        {/* Thumbnail Strip */}
                        {galleryList.length > 1 && (
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {galleryList.map((imgUrl, idx) => (
                              <button
                                key={idx}
                                onClick={() => setInspectingImageIndex(idx)}
                                className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 bg-black/40 ${
                                  inspectingImageIndex === idx ? 'border-brand-orange scale-105 shadow-md shadow-orange-500/20' : 'border-white/10 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <img src={imgUrl} alt={`${t('Thumb', 'ছবি')} ${idx + 1}`} className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* Submission date & Status badge */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{t('Current Catalog Status:', 'বর্তমান ক্যাটালগ অবস্থা:')}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        inspectingProduct.status === 'approved' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : inspectingProduct.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {inspectingProduct.status === 'approved'
                          ? t('Approved', 'অনুমোদিত')
                          : inspectingProduct.status === 'rejected'
                            ? t('Rejected', 'প্রত্যাখ্যাত')
                            : t('Pending', 'অপেক্ষমাণ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">{t('Date Submitted:', 'জমা দেওয়ার তারিখ:')}</span>
                      <span className="text-white font-mono">{formatProductDate(inspectingProduct.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Product Details & Metrics */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-brand-orange uppercase tracking-wider">
                      {inspectingProduct.brand || 'Digital Shop Originals'}
                    </span>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight leading-snug">
                      {inspectingProduct.name}
                    </h4>
                  </div>

                  {/* Seller link */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-orange">
                        <Store size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('Merchant / Store', 'মার্চেন্ট / স্টোর')}</p>
                        <p className="text-xs font-bold text-white">{inspectingProduct.seller?.name || t('Digital Shop Official Store', 'ডিজিটাল শপ অফিসিয়াল স্টোর')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const sName = inspectingProduct.seller?.name || 'Digital Shop Official Store';
                        setInspectingProduct(null);
                        handleViewSellerProfile(sName);
                      }}
                      className="px-3 py-1.5 bg-brand-orange/15 hover:bg-brand-orange text-brand-orange hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                    >
                      {t('View Seller', 'বিক্রেতা দেখুন')}
                    </button>
                  </div>

                  {/* Price and Stock Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('Selling Price', 'বিক্রয় মূল্য')}</p>
                      <p className="text-lg font-black text-white font-mono">৳{formatProductBDT(inspectingProduct.price)}</p>
                      {inspectingProduct.originalPrice && (
                        <p className="text-xs text-gray-400 line-through font-mono">৳{formatProductBDT(inspectingProduct.originalPrice)}</p>
                      )}
                    </div>
                    <div className="bg-white/5 border border-white/10 p-3 rounded-2xl">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{t('Stock Level', 'স্টকের পরিমাণ')}</p>
                      <p className={`text-lg font-black font-mono ${
                        Number(inspectingProduct.stock) < 5 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {inspectingProduct.stock ?? 0} {t('units', 'টি')}
                      </p>
                      <p className="text-[10px] text-gray-400">{t('Sold Count:', 'বিক্রিত সংখ্যা:')} {inspectingProduct.soldCount || 0}</p>
                    </div>
                  </div>

                  {/* Rejection Note if rejected */}
                  {inspectingProduct.status === 'rejected' && inspectingProduct.rejectionReason && (
                    <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl text-rose-300">
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider mb-1">
                        <AlertCircle size={14} /> {t('Rejection Note', 'প্রত্যাখ্যানের নোট')}
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans">{inspectingProduct.rejectionReason}</p>
                    </div>
                  )}

                  {/* Full Description */}
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">{t('Detailed Specifications', 'বিস্তারিত বিবরণ')}</p>
                    <p className="text-xs text-gray-300 leading-relaxed font-normal whitespace-pre-line">
                      {inspectingProduct.description || t('No detailed specifications provided.', 'বিস্তারিত বিবরণ দেওয়া হয়নি।')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-4 md:p-6 bg-white/[0.02] border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setInspectingProduct(null)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  {t('Close', 'বন্ধ করুন')}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const p = inspectingProduct;
                      setInspectingProduct(null);
                      handleOpenEditProduct(p);
                    }}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit2 size={13} />
                    <span>{t('Edit Product', 'পণ্য এডিট করুন')}</span>
                  </button>

                  {inspectingProduct.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={async () => {
                        const p = inspectingProduct;
                        setInspectingProduct(null);
                        await handleApproveProduct(p);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-900/30 flex items-center gap-1.5"
                    >
                      <Check size={14} strokeWidth={3} />
                      <span>{t('Approve Product', 'পণ্য অনুমোদন করুন')}</span>
                    </button>
                  )}

                  {inspectingProduct.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => {
                        const p = inspectingProduct;
                        setInspectingProduct(null);
                        handleOpenRejectProduct(p);
                      }}
                      className="px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <X size={14} strokeWidth={3} />
                      <span>{t('Reject', 'প্রত্যাখ্যান')}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

       {/* HIGH-FIDELITY ORDER DETAILS INSPECT SYSTEM MODAL */}
       <AnimatePresence>
         {viewingOrder && (
           <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setViewingOrder(null)}
               className="absolute inset-0 bg-[#07070b]/90 backdrop-blur-xl z-[1000]"
             />

             {/* Modal Container */}
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="bg-zinc-950/95 border border-white/10 rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative z-[1010] text-left"
             >
               {/* Header Action Menu */}
               <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
                 <div className="flex items-center gap-3 text-left">
                   <button 
                     onClick={() => setViewingOrder(null)}
                     className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white"
                   >
                     <ArrowLeft size={16} />
                   </button>
                  <div className="text-left">
                    <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">
                      {t('Payload Stream Check', 'অর্ডার পেলোড যাচাই')}
                    </h3>
                    <p className="text-[9px] text-white/40 font-mono tracking-wider mt-0.5">
                      {t('HASH ID:', 'হ্যাশ আইডি:')} {viewingOrder.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Trash / Delete option */}
                  {viewingOrder.isDeleted ? (
                    <span className="px-2.5 py-1.5 bg-rose-500/20 text-rose-400 font-mono text-[9px] font-black uppercase tracking-wider rounded-xl border border-rose-500/20">
                      🗑️ {t('Archived Trash', 'আর্কাইভড ট্র্যাশ')}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          title: t('Move Order to Trash?', 'অর্ডার ট্র্যাশে পাঠাবেন?'),
                          message: t('Are you sure you want to move this active order to trash?', 'আপনি কি নিশ্চিত যে এই সক্রিয় অর্ডারটি ট্র্যাশে সরাতে চান?'),
                          confirmLabel: t('Move to Trash', 'ট্র্যাশে সরান'),
                          confirmVariant: 'danger',
                          onConfirm: async () => {
                            await adminApi.deleteOrder(viewingOrder.id, false);
                            setViewingOrder({
                              ...viewingOrder,
                              isDeleted: true
                            });
                            showToast(t('Order moved to Trash Archive', 'অর্ডার ট্র্যাশ আর্কাইভে সরানো হয়েছে'), 'info');
                            refreshView();
                          }
                        });
                      }}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-[9px] border border-rose-500/20 hover:border-transparent font-black uppercase tracking-widest text-rose-400 rounded-xl flex items-center gap-2 transition-all font-mono cursor-pointer"
                      title={t('Trash Stream', 'ট্র্যাশে পাঠান')}
                    >
                      <Trash2 size={12} /> {t('Trash Stream', 'ট্র্যাশে পাঠান')}
                    </button>
                  )}

                  {/* Invoice / Bill Card tool */}
                  <button 
                    onClick={() => navigate(`/invoice/${viewingOrder.id}`)}
                    className="px-4 py-2 bg-white/5 hover:bg-brand-orange text-[9px] border border-white/10 font-black uppercase tracking-widest text-white/70 hover:text-white rounded-xl flex items-center gap-2 transition-all font-mono cursor-pointer"
                  >
                    <FileText size={12} /> {t('Print Invoice', 'ইনভয়েস প্রিন্ট')}
                  </button>
                  <button 
                    onClick={() => setViewingOrder(null)}
                    className="p-2 bg-white/5 hover:bg-rose-500 hover:text-white text-white/40 border border-white/5 hover:border-transparent rounded-xl transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Main scrollable grid */}
              <div className="p-8 overflow-y-auto space-y-8 flex-1 admin-scrollbar">
                {/* Status Pipeline Tracker */}
                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-5 font-mono text-left">
                    {t('Real-time Pipeline Milestones', 'রিয়েল-টাইম অর্ডার ধাপসমূহ')}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { step: t('Order Placed', 'অর্ডার সম্পন্ন'), active: true, desc: t('Registered payload', 'অর্ডার নথিভুক্ত') },
                      { step: t('Confirmed', 'নিশ্চিত'), active: ['confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'completed'].includes(viewingOrder.status?.toLowerCase() || ''), desc: t('Verified Ledger', 'যাচাইকৃত লেজার') },
                      { step: t('Processing', 'প্রক্রিয়াধীন'), active: ['processing', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'completed'].includes(viewingOrder.status?.toLowerCase() || ''), desc: t('Packaging node', 'প্যাকেজিং চলছে') },
                      { step: t('In Transit', 'পথে আছে'), active: ['shipped', 'out-for-delivery', 'delivered', 'completed'].includes(viewingOrder.status?.toLowerCase() || ''), desc: t('In courier hub', 'কুরিয়ার হাবে') },
                      { step: t('Delivered', 'ডেলিভার্ড'), active: ['delivered', 'completed'].includes(viewingOrder.status?.toLowerCase() || ''), desc: t('Success cycle', 'সফল ডেলিভারি') }
                    ].map((stp, idx) => (
                      <div key={idx} className="flex flex-col relative text-left">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border ${
                            stp.active 
                              ? 'bg-brand-orange border-brand-orange text-white' 
                              : 'bg-white/5 border-white/10 text-white/20'
                          }`}>
                            {stp.active ? '✓' : idx + 1}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${stp.active ? 'text-white' : 'text-white/30'}`}>
                            {stp.step}
                          </span>
                        </div>
                        <p className={`text-[8px] font-mono mt-1 pl-7 ${stp.active ? 'text-white/40' : 'text-white/10'}`}>
                          {stp.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Soft Delete Warning and Recovery Action Box */}
                {viewingOrder.isDeleted && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-[32px] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                    <div className="flex items-center gap-3 text-left">
                      <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/10">
                        <Trash2 size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-white uppercase tracking-wider">{t('Archived in Trash bin', 'ট্র্যাশ বিনে আর্কাইভ করা হয়েছে')}</p>
                        <p className="text-[10px] text-white/40 font-mono mt-1">{t('This transmission flow is in soft-deleted state and hidden from the normal ledger.', 'এই অর্ডারটি সফট-ডিলিট অবস্থায় রয়েছে এবং সাধারণ তালিকা থেকে লুকানো আছে।')}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={async () => {
                          await adminApi.restoreOrder(viewingOrder.id);
                          setViewingOrder({
                            ...viewingOrder,
                            isDeleted: false
                          });
                          showToast(t('Order successfully restored back to active streams!', 'অর্ডার সফলভাবে সক্রিয় তালিকায় পুনরুদ্ধার করা হয়েছে!'), 'success');
                          refreshView();
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white text-[9.5px] font-black uppercase tracking-widest rounded-xl transition-all border border-emerald-500/20 cursor-pointer"
                      >
                        {t('Restore Stream', 'পুনরুদ্ধার করুন')}
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: t('Purge Permanently?', 'স্থায়ীভাবে মুছে ফেলবেন?'),
                            message: t('CRITICAL ACTION: Permanently wipe this transaction from the database? This is irreversible!', 'সতর্কতা: ডাটাবেস থেকে এই লেনদেনটি স্থায়ীভাবে মুছে ফেলতে চান? এটি আর ফেরানো যাবে না!'),
                            confirmLabel: t('Purge Permanently', 'স্থায়ীভাবে মুছুন'),
                            confirmVariant: 'danger',
                            onConfirm: async () => {
                              await adminApi.deleteOrder(viewingOrder.id, true);
                              setViewingOrder(null);
                              showToast(t('Order permanently purged from Database', 'ডেটাবেস থেকে অর্ডার স্থায়ীভাবে মুছে ফেলা হয়েছে'), 'error');
                              refreshView();
                            }
                          });
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white text-[9.5px] font-black uppercase tracking-widest rounded-xl transition-all border border-rose-600/30 cursor-pointer"
                      >
                        {t('Purge Permanently', 'স্থায়ীভাবে মুছুন')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Main specs blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {/* Node Coordinates: Shipping Address */}
                  <div className="border border-white/5 rounded-[32px] p-6 text-left space-y-4">
                    <div className="flex items-center gap-2.5 text-left">
                      <MapPin size={18} className="text-brand-orange" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        {t('Delivery Identity Coordinates', 'ডেলিভারি ঠিকানার তথ্য')}
                      </h4>
                    </div>
                    
                    <div className="space-y-3 font-mono text-[10px] text-white/70 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/30 uppercase font-black">{t('Full Name', 'পুরো নাম')}</span>
                        <span className="text-white font-sans uppercase font-black">{viewingOrder.address?.fullName || t('N/A', 'প্রযোজ্য নয়')}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/30 uppercase font-black">{t('Coordinates', 'বিস্তারিত ঠিকানা')}</span>
                        <span className="text-white text-right leading-relaxed font-sans">{viewingOrder.address?.addressLine || t('N/A', 'প্রযোজ্য নয়')}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/30 uppercase font-black">{t('Region Node', 'এলাকা / শহর')}</span>
                        <span className="text-white">{viewingOrder.address?.area || viewingOrder.address?.city || t('N/A', 'প্রযোজ্য নয়')}</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-white/30 uppercase font-black">{t('District', 'জেলা')}</span>
                        <span className="text-white uppercase">{viewingOrder.address?.district || t('N/A', 'প্রযোজ্য নয়')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/30 uppercase font-black">{t('Upazila/Thana', 'উপজেলা/থানা')}</span>
                        <span className="text-white uppercase">{viewingOrder.address?.thana || t('N/A', 'প্রযোজ্য নয়')}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a 
                        href={`tel:${viewingOrder.address?.phone}`}
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-all font-mono"
                      >
                        <Phone size={11} /> {t('Dial Contact', 'কল করুন')}
                      </a>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(viewingOrder.address?.phone || '');
                          showToast(t('Phone Number Copied', 'ফোন নম্বর কপি হয়েছে'), 'success');
                        }}
                        className="px-3 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all font-mono cursor-pointer"
                      >
                        {t('Copy', 'কপি')}
                      </button>
                    </div>
                  </div>

                  {/* Registry Information: Financials & Audit */}
                  <div className="border border-white/5 rounded-[32px] p-6 text-left space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2.5 text-left">
                        <CreditCard size={18} className="text-emerald-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wider animate-none">
                          {t('Transaction & Verification Audit', 'লেনদেন ও যাচাইকরণ তথ্য')}
                        </h4>
                      </div>

                      <div className="space-y-3 font-mono text-[10px] text-white/70 bg-white/[0.01] p-4 rounded-xl border border-white/5">
                         <div className="flex justify-between items-center border-b border-white/5 pb-2">
                           <span className="text-white/30 uppercase font-black">{t('Payment Status', 'পেমেন্টের অবস্থা')}</span>
                           <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                               (viewingOrder.paymentStatus === 'paid' || (viewingOrder.status === 'delivered' && viewingOrder.paymentStatus !== 'unpaid'))
                                 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                 : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                             }`}>
                               {(viewingOrder.paymentStatus === 'paid' || (viewingOrder.status === 'delivered' && viewingOrder.paymentStatus !== 'unpaid')) ? t('Paid', 'পরিশোধিত') : t('Unpaid', 'অপরিশোধিত')}
                             </span>
                             <button
                               type="button"
                               onClick={async () => {
                                 const isCurrentlyPaid = (viewingOrder.paymentStatus === 'paid' || (viewingOrder.status === 'delivered' && viewingOrder.paymentStatus !== 'unpaid'));
                                 const nextStatus = isCurrentlyPaid ? 'unpaid' : 'paid';
                                 await adminApi.updateOrderPaymentStatus(viewingOrder.id, nextStatus as any);
                                 setViewingOrder({ ...viewingOrder, paymentStatus: nextStatus as any });
                                 setOrders(prev => prev.map(o => o.id === viewingOrder.id ? { ...o, paymentStatus: nextStatus as any } : o));
                                 showToast(
                                   t(
                                     `Payment status updated to ${nextStatus.toUpperCase()}`,
                                     `পেমেন্টের অবস্থা "${nextStatus === 'paid' ? 'পরিশোধিত' : 'অপরিশোধিত'}" হিসেবে আপডেট হয়েছে`
                                   ),
                                   'success'
                                 );
                               }}
                               className="px-2.5 py-1 bg-white/10 hover:bg-brand-orange text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                             >
                               {(viewingOrder.paymentStatus === 'paid' || (viewingOrder.status === 'delivered' && viewingOrder.paymentStatus !== 'unpaid')) ? t('Mark Unpaid', 'অপরিশোধিত করুন') : t('Mark Paid', 'পরিশোধিত করুন')}
                             </button>
                           </div>
                         </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-white/30 uppercase font-black">{t('Payment Protocol', 'পেমেন্ট মাধ্যম')}</span>
                          <span className="text-white uppercase font-black">{viewingOrder.paymentMethod || t('Manual COD', 'ক্যাশ অন ডেলিভারি')}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-white/30 uppercase font-black">{t('Sender Number', 'প্রেরকের নম্বর')}</span>
                          <span className="text-emerald-400 font-sans font-bold">{viewingOrder.senderNumber || t('None (Awaiting Cash)', 'নেই (নগদ অপেক্ষমাণ)')}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-2">
                          <span className="text-white/30 uppercase font-black">{t('Transaction ID', 'ট্রানজেকশন আইডি')}</span>
                          <span className="text-brand-orange font-black text-white">{viewingOrder.transactionId || t('None (Manual Cash)', 'নেই (নগদ পেমেন্ট)')}</span>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span className="text-white/30 uppercase font-black">{t('Estimated Cycle', 'আনুমানিক সময়')}</span>
                          <span className="text-white font-sans font-bold">{viewingOrder.estimatedDelivery || t('3-5 Business Cycles', '৩-৫ কর্মদিবস')}</span>
                        </div>
                      </div>
                    </div>

                    {viewingOrder.transactionId && (
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(viewingOrder.transactionId || '');
                            showToast(t('Transaction ID Copied', 'ট্রানজেকশন আইডি কপি হয়েছে'), 'success');
                          }}
                          className="flex-1 py-3 bg-white/5 hover:bg-emerald-500 hover:text-white border border-white/10 hover:border-transparent text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all font-mono cursor-pointer"
                        >
                          {t('Copy Transaction ID', 'ট্রানজেকশন আইডি কপি করুন')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product items payload list */}
                <div className="border border-white/5 rounded-[32px] overflow-hidden text-left bg-white/[0.01]">
                  <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider text-left">
                      {t('Contained Packages & Unit Payloads', 'অর্ডারের পণ্য ও পরিমাণ')} ({viewingOrder.items?.length || 0})
                    </h4>
                  </div>
                  <div className="divide-y divide-white/5 text-left">
                    {(viewingOrder.items || []).map((itm, i) => (
                      <div key={i} className="p-6 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-all">
                        <div className="flex items-center gap-4 min-w-0 text-left">
                          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl overflow-hidden p-0.5 shrink-0">
                            <img src={itm.image} className="w-full h-full object-cover rounded-lg" alt={itm.name || t("Order product item", "অর্ডার পণ্য")} referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0 text-left">
                            <h5 className="text-xs font-black text-white uppercase truncate max-w-[200px] md:max-w-md">
                              {itm.name}
                            </h5>
                            <p className="text-[9px] text-white/30 font-mono mt-1 font-bold">
                              {t('PRICE:', 'মূল্য:')} ৳{(itm.price || 0).toLocaleString()} | {t('QTY:', 'পরিমাণ:')} {itm.quantity || 1}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right whitespace-nowrap">
                          <p className="text-xs font-black text-white font-mono text-right">
                            ৳{((itm.price || 0) * (itm.quantity || 1)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Receipt Summary */}
                <div className="flex justify-end pt-4">
                  <div className="w-full max-w-sm border border-white/10 rounded-3xl p-6 bg-white/[0.02] space-y-3 text-[10px] font-mono text-white/70">
                    <div className="flex justify-between">
                      <span className="uppercase font-black text-white/40">{t('Subtotal Payload', 'সাবটোটাল')}</span>
                      <span className="text-white text-right font-black">৳{(viewingOrder.subtotal || viewingOrder.total - (viewingOrder.deliveryCharge || 0) + (viewingOrder.discount || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="uppercase font-black text-white/40">{t('Delivery Routing', 'ডেলিভারি চার্জ')}</span>
                      <span className="text-white text-right font-black">+৳{(viewingOrder.deliveryCharge || 0).toLocaleString()}</span>
                    </div>
                    {(viewingOrder.discount || 0) > 0 && (
                      <div className="flex justify-between text-brand-orange">
                        <span className="uppercase font-black">{t('Promo Discount Deduction', 'প্রোমো ছাড়')}</span>
                        <span className="text-right font-black">-৳{(viewingOrder.discount || 0).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs text-left">
                      <span className="uppercase font-black font-sans text-white text-left">{t('Full Net ledger Value', 'সর্বমোট মূল্য')}</span>
                      <span className="font-sans font-black text-white italic">৳{Number(viewingOrder.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final status calibration workflow toolbar footer */}
              <div className="p-6 border-t border-white/10 flex flex-wrap gap-3 items-center justify-between bg-[#111116] backdrop-blur-3xl">
                <div className="text-left">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block font-mono">
                    {t('Operational Status calibrator', 'অর্ডার স্ট্যাটাস পরিবর্তন')}
                  </span>
                  <p className="text-[9px] text-white/20 mt-0.5">
                    {t("Alter this order's status instantly updating all real-time subscriber interfaces", 'অর্ডারের অবস্থা পরিবর্তন করলে সাথে সাথে গ্রাহকের কাছে আপডেট হয়ে যাবে')}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={viewingOrder.status?.toLowerCase() || 'pending'}
                    onChange={async (e) => {
                      const newStat = e.target.value;
                      await adminApi.updateOrderStatus(viewingOrder.id, newStat);
                      setViewingOrder({
                        ...viewingOrder,
                        status: newStat as any
                      });
                      showToast(t(`Status shifted to ${getOrderStatusLabel(newStat)}`, `অবস্থা "${getOrderStatusLabel(newStat)}"-এ পরিবর্তন করা হয়েছে`), 'success');
                      refreshView();
                    }}
                    className="bg-zinc-900 border border-white/10 text-white rounded-xl text-xs font-mono py-2.5 px-4 font-bold focus:outline-none focus:border-brand-orange"
                  >
                    <option value="pending">{t('Pending Validation', 'যাচাইয়ের অপেক্ষায়')}</option>
                    <option value="confirmed">{t('Confirmed', 'নিশ্চিত')}</option>
                    <option value="processing">{t('Processing Payload', 'প্রক্রিয়াধীন')}</option>
                    <option value="packed">{t('Packed', 'প্যাক করা হয়েছে')}</option>
                    <option value="shipped">{t('Shipped', 'শিপড')}</option>
                    <option value="out-for-delivery">{t('Out for Delivery', 'ডেলিভারির পথে')}</option>
                    <option value="delivered">{t('Delivered', 'ডেলিভার্ড')}</option>
                    <option value="cancelled">{t('Cancelled', 'বাতিল')}</option>
                    <option value="returned">{t('Returned', 'ফেরত')}</option>
                  </select>

                  <button 
                    onClick={() => setViewingOrder(null)}
                    className="px-6 py-2.5 bg-white/5 border border-white/5 hover:bg-white/10 text-[10px] uppercase font-black tracking-wider text-white hover:border-white/10 rounded-xl transition-all cursor-pointer"
                  >
                    {t('Close Control Node', 'বন্ধ করুন')}
                  </button>
                </div>
              </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

        {/* Customer Account & Granular Restrictions Modal (Group 7) */}
        {viewingUser && (
          <AdminCustomerDetailModal
            user={viewingUser}
            customerOrders={orders.filter(o => o.userId === viewingUser.id || o.address?.phone === viewingUser.phone || (viewingUser.email && o.address?.fullName === viewingUser.name))}
            onClose={() => setViewingUser(null)}
            onUpdateUser={(updated) => {
              setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
              setViewingUser(updated);
            }}
            onLogSecurityAction={(action, target, details) => {
              logAdminAction('Edit', 'Customer', target, `${action}: ${details}`);
            }}
          />
        )}

       {/* Universal In-App Confirmation Dialog */}
       <AnimatePresence>
         {confirmDialog?.isOpen && (
           <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setConfirmDialog(null)}
               className="fixed inset-0 bg-black/80 backdrop-blur-md"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="relative w-full max-w-md bg-[#111118] border border-white/10 rounded-3xl p-6 shadow-2xl z-10 text-left"
             >
               <div className="flex items-center gap-4 mb-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                   confirmDialog.confirmVariant === 'danger'
                     ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                     : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                 }`}>
                   {confirmDialog.confirmVariant === 'danger' ? (
                     <AlertTriangle size={24} />
                   ) : (
                     <CheckCircle2 size={24} />
                   )}
                 </div>
                 <div>
                   <h3 className="text-base font-black text-white uppercase tracking-tight">
                     {confirmDialog.title}
                   </h3>
                   <p className="text-[11px] text-gray-400 font-medium">{t('Please confirm your action', 'অনুগ্রহ করে আপনার সিদ্ধান্ত নিশ্চিত করুন')}</p>
                 </div>
               </div>

               <p className="text-xs text-gray-300 leading-relaxed mb-6">
                 {confirmDialog.message}
               </p>

               <div className="grid grid-cols-2 gap-3">
                 <button
                   type="button"
                   onClick={() => setConfirmDialog(null)}
                   className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                 >
                   {t('Cancel', 'বাতিল')}
                 </button>
                 <button
                   type="button"
                   onClick={async () => {
                     const action = confirmDialog.onConfirm;
                     setConfirmDialog(null);
                     await action();
                   }}
                   className={`py-3 px-4 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                     confirmDialog.confirmVariant === 'danger'
                       ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-900/40'
                       : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-900/40'
                   }`}
                 >
                   {confirmDialog.confirmLabel}
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

        {/* Full Merchant Profile View - Admin 'View As Merchant' Panel (Group 3) */}
        {selectedMerchantForDetails && selectedMerchantForDetails.shop && (
          <AdminMerchantStorePanel
            merchantUser={selectedMerchantForDetails}
            allProducts={products}
            allOrders={orders}
            onClose={() => setSelectedMerchantForDetails(null)}
            onUpdateMerchant={(updated) => {
              setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
              setSelectedMerchantForDetails(updated);
            }}
            onOpenEditProduct={(p) => {
              setSelectedMerchantForDetails(null);
              handleOpenEditProduct(p);
            }}
          />
        )}
       {/* Bulk Product Action Confirmation Modal */}
       <AnimatePresence>
         {bulkProductConfirmAction && (
           <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setBulkProductConfirmAction(null)}
               className="absolute inset-0 bg-[#07070b]/90 backdrop-blur-xl"
             />
             <motion.div
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative w-full max-w-md bg-[#16161d] border border-white/10 rounded-3xl p-6 shadow-2xl text-left overflow-hidden z-10"
             >
               <div className="flex items-center gap-3 mb-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                   bulkProductConfirmAction === 'approve' ? 'bg-emerald-500/20 text-emerald-400' :
                   bulkProductConfirmAction === 'reject' ? 'bg-rose-500/20 text-rose-400' :
                   'bg-white/10 text-gray-300'
                 }`}>
                   {bulkProductConfirmAction === 'approve' ? <Check size={24} /> :
                    bulkProductConfirmAction === 'reject' ? <X size={24} /> :
                    <Trash2 size={24} />}
                 </div>
                 <div>
                   <h3 className="text-base font-black text-white uppercase tracking-tight">
                     {bulkProductConfirmAction === 'approve'
                       ? t('Confirm Bulk Approval', 'একসাথে অনুমোদন নিশ্চিত করুন')
                       : bulkProductConfirmAction === 'reject'
                         ? t('Confirm Bulk Rejection', 'একসাথে প্রত্যাখ্যান নিশ্চিত করুন')
                         : t('Confirm Bulk Trash', 'একসাথে ট্র্যাশে পাঠানো নিশ্চিত করুন')}
                   </h3>
                   <p className="text-xs text-gray-400">
                     {t(
                       `Action will apply to ${selectedProductIds.length} selected item(s)`,
                       `নির্বাচিত ${selectedProductIds.length}টি পণ্যে এই কার্যক্রম প্রয়োগ হবে`
                     )}
                   </p>
                 </div>
               </div>

               <p className="text-xs text-gray-300 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                 {bulkProductConfirmAction === 'approve' && t(
                   `You are about to approve and publish ${selectedProductIds.length} product(s) to the storefront.`,
                   `আপনি ${selectedProductIds.length}টি পণ্য অনুমোদন করে স্টোরফ্রন্টে প্রকাশ করতে যাচ্ছেন।`
                 )}
                 {bulkProductConfirmAction === 'reject' && t(
                   `You are about to reject ${selectedProductIds.length} product(s). They will be hidden from the storefront.`,
                   `আপনি ${selectedProductIds.length}টি পণ্য প্রত্যাখ্যান করতে যাচ্ছেন। এগুলো স্টোরফ্রন্ট থেকে লুকানো থাকবে।`
                 )}
                 {bulkProductConfirmAction === 'trash' && t(
                   `You are about to move ${selectedProductIds.length} product(s) to the trash. You can restore them anytime.`,
                   `আপনি ${selectedProductIds.length}টি পণ্য ট্র্যাশে সরাতে যাচ্ছেন। যেকোনো সময় এগুলো পুনরুদ্ধার করতে পারবেন।`
                 )}
               </p>

               <div className="flex items-center justify-end gap-3">
                 <button
                   type="button"
                   onClick={() => setBulkProductConfirmAction(null)}
                   className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                 >
                   {t('Cancel', 'বাতিল')}
                 </button>
                 <button
                   type="button"
                   onClick={() => handleBulkProductAction(bulkProductConfirmAction)}
                   className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg cursor-pointer ${
                     bulkProductConfirmAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30' :
                     bulkProductConfirmAction === 'reject' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/30' :
                     'bg-brand-orange hover:bg-orange-600 shadow-orange-900/30'
                   }`}
                 >
                   {t('Proceed', 'এগিয়ে যান')}
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Bulk Order Action Confirmation Modal */}
       <AnimatePresence>
         {bulkOrderConfirmAction && (
           <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setBulkOrderConfirmAction(null)}
               className="absolute inset-0 bg-[#07070b]/90 backdrop-blur-xl"
             />
             <motion.div
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative w-full max-w-md bg-[#16161d] border border-white/10 rounded-3xl p-6 shadow-2xl text-left overflow-hidden z-10"
             >
               <div className="flex items-center gap-3 mb-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                   bulkOrderConfirmAction === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                   bulkOrderConfirmAction === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                   bulkOrderConfirmAction === 'cancelled' ? 'bg-rose-500/20 text-rose-400' :
                   'bg-white/10 text-gray-300'
                 }`}>
                   {bulkOrderConfirmAction === 'confirmed' ? <Check size={24} /> :
                    bulkOrderConfirmAction === 'delivered' ? <CheckCircle2 size={24} /> :
                    bulkOrderConfirmAction === 'cancelled' ? <X size={24} /> :
                    <Trash2 size={24} />}
                 </div>
                 <div>
                   <h3 className="text-base font-black text-white uppercase tracking-tight">
                     {t('Confirm Bulk Order Action', 'একসাথে অর্ডার আপডেট নিশ্চিত করুন')}
                   </h3>
                   <p className="text-xs text-gray-400">
                     {isBangla ? (
                       <>{selectedOrderIds.length}টি অর্ডারের অবস্থা <span className="font-bold text-white">{getOrderStatusLabel(bulkOrderConfirmAction)}</span>-এ পরিবর্তন হবে</>
                     ) : (
                       <>Update status of {selectedOrderIds.length} order(s) to <span className="font-bold text-white capitalize">{bulkOrderConfirmAction}</span></>
                     )}
                   </p>
                 </div>
               </div>

               <p className="text-xs text-gray-300 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                 {t(
                   `Are you sure you want to change the fulfillment status for all ${selectedOrderIds.length} selected orders? Customers will receive status notifications.`,
                   `আপনি কি নিশ্চিত যে নির্বাচিত সব ${selectedOrderIds.length}টি অর্ডারের ডেলিভারি অবস্থা পরিবর্তন করতে চান? গ্রাহকরা স্ট্যাটাস নোটিফিকেশন পাবেন।`
                 )}
               </p>

               <div className="flex items-center justify-end gap-3">
                 <button
                   type="button"
                   onClick={() => setBulkOrderConfirmAction(null)}
                   className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                 >
                   {t('Cancel', 'বাতিল')}
                 </button>
                 <button
                   type="button"
                   onClick={() => handleBulkOrderAction(bulkOrderConfirmAction)}
                   className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg cursor-pointer ${
                     bulkOrderConfirmAction === 'delivered' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30' :
                     bulkOrderConfirmAction === 'cancelled' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/30' :
                     'bg-blue-600 hover:bg-blue-700 shadow-blue-900/30'
                   }`}
                 >
                   {t(`Apply to ${selectedOrderIds.length} Orders`, `${selectedOrderIds.length}টি অর্ডারে প্রয়োগ করুন`)}
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* User Role Assignment Modal */}
       <AnimatePresence>
         {assigningRoleUser && (
           <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setAssigningRoleUser(null)}
               className="absolute inset-0 bg-[#07070b]/90 backdrop-blur-xl"
             />
             <motion.div
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative w-full max-w-lg bg-[#16161d] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl text-left overflow-hidden z-10"
             >
               <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                 <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-2xl bg-brand-orange/20 text-brand-orange flex items-center justify-center">
                     <Shield size={22} />
                   </div>
                   <div>
                     <h3 className="text-base font-black text-white uppercase tracking-tight">{t('Assign Administrator Role', 'অ্যাডমিন ভূমিকা নির্ধারণ করুন')}</h3>
                     <p className="text-xs text-gray-400">{assigningRoleUser.name || t('User', 'ব্যবহারকারী')} ({assigningRoleUser.email})</p>
                   </div>
                 </div>
                 <button
                   type="button"
                   onClick={() => setAssigningRoleUser(null)}
                   className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                 >
                   <X size={16} />
                 </button>
               </div>

               <div className="space-y-4 mb-6">
                 <p className="text-xs text-gray-300 font-bold uppercase tracking-wider">{t('Select Access Role:', 'অ্যাক্সেস ভূমিকা নির্বাচন করুন:')}</p>
                 <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                   {[
                     { id: 'super_admin', name: t('Super Administrator', 'সুপার অ্যাডমিনিস্ট্রেটর'), desc: t('Unrestricted full access across all store resources and administrative capabilities', 'সব স্টোর রিসোর্স ও অ্যাডমিন সক্ষমতায় সম্পূর্ণ অবাধ অ্যাক্সেস') },
                     { id: 'inventory_manager', name: t('Inventory & Products Manager', 'ইনভেন্টরি ও পণ্য ব্যবস্থাপক'), desc: t('Approve, edit, reject, and monitor store stock and merchant products', 'স্টোরের স্টক এবং মার্চেন্ট পণ্য অনুমোদন, সম্পাদনা ও পর্যবেক্ষণ') },
                     { id: 'order_manager', name: t('Order & Fulfillment Specialist', 'অর্ডার ও ডেলিভারি বিশেষজ্ঞ'), desc: t('Process customer orders, update tracking status, and manage shipments', 'গ্রাহকদের অর্ডার প্রক্রিয়াকরণ, ট্র্যাকিং ও শিপমেন্ট পরিচালনা') },
                     { id: 'marketing_manager', name: t('Marketing & Promotions Lead', 'মার্কেটিং ও প্রমোশন লিড'), desc: t('Configure campaigns, promotional discount codes, reviews, and flash sales', 'ক্যাম্পেইন, প্রমোশনাল ডিসকাউন্ট কোড, রিভিউ ও ফ্ল্যাশ সেল পরিচালনা') },
                     { id: 'support_staff', name: t('Customer Support Agent', 'গ্রাহক সেবা প্রতিনিধি'), desc: t('View orders, manage customer inquiries and reviews, read-only analytics', 'অর্ডার দেখা, গ্রাহকের প্রশ্ন ও রিভিউ পরিচালনা এবং অ্যানালিটিক্স দেখা') },
                   ].map(role => (
                     <label
                       key={role.id}
                       onClick={() => setAssigningRoleId(role.id)}
                       className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                         assigningRoleId === role.id 
                           ? 'bg-brand-orange/15 border-brand-orange text-white' 
                           : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
                       }`}
                     >
                       <input 
                         type="radio" 
                         name="adminRole" 
                         checked={assigningRoleId === role.id} 
                         onChange={() => setAssigningRoleId(role.id)} 
                         className="mt-1 accent-orange-500" 
                       />
                       <div>
                         <p className="text-xs font-bold text-white">{role.name}</p>
                         <p className="text-[11px] text-gray-400 mt-0.5">{role.desc}</p>
                       </div>
                     </label>
                   ))}
                 </div>
               </div>

               <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                 <button
                   type="button"
                   onClick={() => setAssigningRoleUser(null)}
                   className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                 >
                   {t('Cancel', 'বাতিল')}
                 </button>
                 <button
                   type="button"
                   onClick={handleConfirmAssignRole}
                   className="px-6 py-2.5 bg-brand-orange hover:bg-orange-600 active:scale-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center gap-1.5"
                 >
                   <Check size={14} /> {t('Assign Role', 'ভূমিকা নির্ধারণ করুন')}
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Reusable Admin Confirmation Modal */}
       <AnimatePresence>
         {pendingConfirm && (
           <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-[#12121a] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
             >
               <div className="flex items-start gap-3">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pendingConfirm.destructive ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
                   <AlertTriangle size={20} />
                 </div>
                 <div className="space-y-1.5 flex-1">
                   <h4 className="text-sm font-black text-white uppercase tracking-wider">
                     {t('Confirm Action', 'কাজটি নিশ্চিত করুন')}
                   </h4>
                   <p className="text-xs text-gray-300 leading-relaxed">
                     {pendingConfirm.message}
                   </p>
                 </div>
               </div>
               <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                 <button
                   type="button"
                   disabled={isRunningConfirm}
                   onClick={() => setPendingConfirm(null)}
                   className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                 >
                   {t('Cancel', 'বাতিল')}
                 </button>
                 <button
                   type="button"
                   disabled={isRunningConfirm}
                   onClick={async () => {
                     setIsRunningConfirm(true);
                     try {
                       await pendingConfirm.onConfirm();
                     } finally {
                       setIsRunningConfirm(false);
                       setPendingConfirm(null);
                     }
                   }}
                   className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all cursor-pointer flex items-center gap-1.5 ${
                     pendingConfirm.destructive
                       ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/25'
                       : 'bg-brand-orange hover:bg-orange-600 shadow-lg shadow-orange-500/25'
                   }`}
                 >
                   {isRunningConfirm ? t('Processing...', 'অপেক্ষা করুন...') : t('Confirm', 'নিশ্চিত করুন')}
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       {/* Inline Banner Title Edit Modal */}
       <AnimatePresence>
         {editingBannerModal && (
           <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
             <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-[#12121a] border border-white/15 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
             >
               <div className="flex items-center justify-between">
                 <h4 className="text-sm font-black text-white uppercase tracking-wider">
                   {t('Edit Banner Title', 'ব্যানারের শিরোনাম এডিট করুন')}
                 </h4>
                 <button
                   type="button"
                   onClick={() => setEditingBannerModal(null)}
                   className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                 >
                   <X size={16} />
                 </button>
               </div>
               <input
                 type="text"
                 autoFocus
                 value={editingBannerModal.title}
                 onChange={(e) => setEditingBannerModal({ ...editingBannerModal, title: e.target.value })}
                 placeholder={t('Enter banner title...', 'ব্যানারের শিরোনাম লিখুন...')}
                 className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-brand-orange"
               />
               <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                 <button
                   type="button"
                   onClick={() => setEditingBannerModal(null)}
                   className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                 >
                   {t('Cancel', 'বাতিল')}
                 </button>
                 <button
                   type="button"
                   disabled={!editingBannerModal.title.trim()}
                   onClick={() => {
                     const trimmed = editingBannerModal.title.trim();
                     if (!trimmed) return;
                     setBanners(prev => prev.map((item, i) => i === editingBannerModal.index ? { ...item, title: trimmed } : item));
                     showToast(t('Banner title updated', 'ব্যানারের শিরোনাম আপডেট হয়েছে'), 'success');
                     setEditingBannerModal(null);
                   }}
                   className="px-5 py-2 bg-brand-orange hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                 >
                   {t('Save', 'সংরক্ষণ করুন')}
                 </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
};
