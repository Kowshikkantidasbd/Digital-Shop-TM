import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, Package, Heart, ShoppingCart, Settings, MapPin, 
  LogOut, Camera, ChevronRight, Bell, Shield, CreditCard, 
  Trash2, Plus, Edit2, Clock, CheckCircle2, Truck, X, Save, AlertCircle, Phone,
  RotateCcw, Info, Home, ShieldAlert, Search, Filter, Download,
  ExternalLink, FileText, MessageSquare, ListFilter, Calendar,
  Store, BarChart3, Wallet, Image as ImageIcon, Briefcase, 
  Star, Users, CheckCircle, ChevronDown, Minus, ArrowUpRight,
  TrendingUp, ShoppingBag, LayoutDashboard, Grid, ArrowRight, ArrowLeft, ShieldCheck, Check,
  Eye, EyeOff, Box, Upload, Loader2, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User as UserType, Order, CartItem, Product, Address } from '../types';
import { useToast } from '../components/Toast';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { authClient } from '../lib/auth-client';
import { DIVISIONS, DISTRICTS, getUpazilasForDistrict } from '../constants/locations';
import { CATEGORIES } from '../constants';
import { authApi, addressApi, productApi, orderApi, cartApi, adminApi } from '../services/api';
import { isSuperAdminEmail } from '../constants/adminConfig';
import { MobileProfileScreen } from '../components/profile/MobileProfileScreen';
import { formatDate } from '../utils/formatDate';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { CircularLoader } from '../components/CircularLoader';

function formatFriendlyError(err: any, fallback: string, t?: (en: string, bn: string) => string): string {
  const tr = t || ((en: string, bn: string) => bn);
  if (!err) return fallback;
  const raw = typeof err === 'string' ? err : err.message;
  if (!raw || typeof raw !== 'string') return fallback;

  // Never expose internal error objects, JSON blobs, paths, or user identifiers
  if (
    raw.includes('{') ||
    raw.includes('authInfo') ||
    raw.includes('operationType') ||
    raw.includes('@') ||
    raw.includes('uid') ||
    raw.includes('token') ||
    raw.includes('projects/') ||
    raw.includes('AuthError')
  ) {
    const lower = raw.toLowerCase();
    if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
      return tr('Permission denied. Please contact an administrator.', 'অনুমতি পাওয়া যায়নি। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।');
    }
    if (lower.includes('unauthenticated') || lower.includes('auth/user-token-expired')) {
      return tr('Your session has expired. Please log in again.', 'আপনার সেশন শেষ হয়ে গেছে। দয়া করে আবার লগইন করুন।');
    }
    if (lower.includes('network') || lower.includes('offline') || lower.includes('unavailable')) {
      return tr('Network error detected. Please check your connection and try again.', 'ইন্টারনেট সংযোগে সমস্যা দেখা দিয়েছে। সংযোগ চেক করে আবার চেষ্টা করুন।');
    }
    return fallback;
  }

  const lower = raw.toLowerCase();
  if (lower.includes('permission-denied') || lower.includes('insufficient permissions')) {
    return tr('Permission denied. Please contact an administrator.', 'অনুমতি পাওয়া যায়নি। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।');
  }
  if (lower.includes('not-found')) {
    return tr('Requested information was not found.', 'অনুরোধকৃত তথ্যটি পাওয়া যায়নি।');
  }
  if (lower.includes('network') || lower.includes('offline') || lower.includes('unavailable')) {
    return tr('Network error detected. Please check your connection and try again.', 'ইন্টারনেট সংযোগে সমস্যা দেখা দিয়েছে। সংযোগ চেক করে আবার চেষ্টা করুন।');
  }
  if (lower.includes('unauthenticated')) {
    return tr('Your session has expired. Please log in again.', 'আপনার সেশন শেষ হয়ে গেছে। দয়া করে আবার লগইন করুন।');
  }

  // If the error message is clean and doesn't look like technical stack trace
  if (raw.length < 120 && !raw.includes('Error:') && !raw.includes('at ') && !raw.includes('(')) {
    return raw;
  }

  return fallback;
}

const SearchableSelect: React.FC<{
  label: string;
  value: string;
  options: { id: string | number; name: string; bn_name?: string }[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
}> = ({ label, value, options, onChange, placeholder, disabled, error }) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.bn_name && opt.bn_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedOption = options.find(opt => String(opt.id) === value);

  return (
    <div className={`space-y-1.5 relative ${error ? 'animate-shake' : ''}`}>
      <label className="text-[10px] font-black p-1 text-gray-400 uppercase tracking-widest">{label}</label>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-gray-50 border-2 rounded-lg p-3.5 text-sm font-medium cursor-pointer flex justify-between items-center transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed border-gray-100' : 
          error ? 'border-rose-500 bg-rose-50/10 focus:ring-4 focus:ring-rose-500/20' :
          'border-gray-100 hover:bg-white focus:ring-2 focus:ring-brand-orange/10'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption ? (
            <span className="flex items-center gap-1.5">
              {language === 'bn' && selectedOption.bn_name ? selectedOption.bn_name : selectedOption.name}
            </span>
          ) : placeholder}
        </span>
        <MapPin size={14} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-[410]" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[420] overflow-hidden"
            >
              <div className="p-2 border-b border-gray-50 sticky top-0 bg-white z-10">
                <input 
                  type="text"
                  autoFocus
                  placeholder={t('Type to search...', 'খুঁজতে টাইপ করুন...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2.5 text-sm border border-gray-100 rounded-lg outline-none focus:border-brand-orange bg-gray-50/50"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map(opt => (
                    <div
                      key={opt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(String(opt.id));
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`p-3.5 text-xs hover:bg-orange-50 cursor-pointer transition-colors border-l-4 ${value === String(opt.id) ? 'bg-orange-50/50 border-brand-orange text-brand-orange font-bold' : 'border-transparent text-gray-600'}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{language === 'bn' && opt.bn_name ? opt.bn_name : opt.name}</span>
                        {opt.bn_name && (
                          <span className="text-[10px] text-gray-400 font-medium font-serif bg-gray-50 px-2 py-0.5 rounded-full">
                            {language === 'bn' ? opt.name : opt.bn_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center flex flex-col items-center gap-2">
                    <MapPin size={24} className="text-gray-200" />
                    <span className="text-xs text-gray-400">{t('No locations found', 'কোনো স্থান পাওয়া যায়নি')}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const validateName = (name: string) => /^[a-zA-Z\s\u0980-\u09FF]+$/.test(name);
const validatePhone = (phone: string) => {
  const cleaned = phone.replace(/\s/g, '');
  return /^(?:\+88|88)?(01[3-9]\d{8})$/.test(cleaned);
};
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

interface ProfilePageProps {
  user: UserType | null;
  users: UserType[];
  orders: Order[];
  wishlist: string[];
  cart: CartItem[];
  products: Product[];
  onLogout: () => void;
  onUpdateUser: (user: UserType) => void;
  onUpdateAllUsers: (users: UserType[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onRemoveFromWishlist: (id: string) => void;
  onAddToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  onUpdateQuantity: (id: string, delta: number, size?: string, color?: string) => void;
  onToggleCartSelection: (id: string, size?: string, color?: string) => void;
  onSelectAll?: (selected: boolean) => void;
  onRemoveFromCart: (id: string, size?: string, color?: string) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

type Tab = 'dashboard' | 'orders' | 'trash' | 'wishlist' | 'cart' | 'addresses' | 'settings' | 'shop' | 'admin';

export const ProfilePage: React.FC<ProfilePageProps> = ({ 
  user: propUser, 
  users,
  orders, 
  wishlist, 
  cart, 
  products,
  onLogout,
  onUpdateUser,
  onUpdateAllUsers,
  onUpdateOrders,
  onRemoveFromWishlist,
  onAddToCart,
  onUpdateQuantity,
  onToggleCartSelection,
  onSelectAll,
  onRemoveFromCart,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { siteConfig } = useSiteConfig();
  const { language, t } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';

  const [sessionUser, setSessionUser] = useState<UserType | null>(null);
  const [authChecking, setAuthChecking] = useState(!propUser);
  const user: UserType | null = propUser || sessionUser;

  React.useEffect(() => {
    if (propUser) {
      setAuthChecking(false);
      return;
    }
    let active = true;
    authClient
      .getSession()
      .then((res) => {
        if (active && res?.user) {
          setSessionUser(res.user);
          onUpdateUser(res.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setAuthChecking(false);
      });
    return () => {
      active = false;
    };
  }, [propUser]);

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const isSyncFallback = !propUser && !!sessionUser;
  const [isRetryingSync, setIsRetryingSync] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleRetrySync = async () => {
    setIsRetryingSync(true);
    try {
      const fresh = await authApi.getProfile();
      if (fresh) {
        onUpdateUser(fresh);
        showToast(t('Profile data synced successfully!', 'প্রোফাইল তথ্য সফলভাবে সিঙ্ক হয়েছে!'), 'success');
      }
    } catch {
      showToast(t('Could not sync. Please check your internet connection.', 'সিঙ্ক করা যায়নি, অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।'), 'error');
    } finally {
      setIsRetryingSync(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.warn('SignOut error in ProfilePage:', err);
    }
    try {
      onLogout();
    } catch {}
    navigate('/');
  };

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UserType>>({});
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
    show: false
  });
  const [securitySettings, setSecuritySettings] = useState({
    sessionKey: 'SK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    orderLogs: true,
    marketing: false,
    identityAlerts: true
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [pendingDeleteProductId, setPendingDeleteProductId] = useState<string | null>(null);
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelModalReason, setCancelModalReason] = useState('');

  const effectivePhone = useMemo(() => {
    if (user?.phone && user.phone.trim()) return user.phone.trim();
    if (typeof window !== 'undefined') {
      const fromUid = user?.id ? localStorage.getItem(`phone_${user.id}`) : null;
      if (fromUid && fromUid.trim()) return fromUid.trim();
      const fromEmail = user?.email ? localStorage.getItem(`phone_${user.email}`) : null;
      if (fromEmail && fromEmail.trim()) return fromEmail.trim();
    }
    const fromAddress = (user?.addresses || []).find(a => a.phone && a.phone.trim())?.phone;
    if (fromAddress) return fromAddress.trim();
    if (user?.shop?.contactNumber && user.shop.contactNumber.trim()) return user.shop.contactNumber.trim();
    return '';
  }, [user]);

  const [editingAddressIdx, setEditingAddressIdx] = useState<number | null>(null);
  const [addressData, setAddressData] = useState<{
    fullName: string;
    phone: string;
    division: string;
    district: string;
    upazila: string;
    fullAddress: string;
    isDefault: boolean;
    label: string;
  }>({
    fullName: '',
    phone: '',
    division: '',
    district: '',
    upazila: '',
    fullAddress: '',
    isDefault: false,
    label: 'Home'
  });
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const shopLogoInputRef = useRef<HTMLInputElement>(null);
  const shopBannerInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner' | 'shopLogo' | 'shopBanner') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Quality check & size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast(t('File size must be less than 10MB', 'ফাইলের সাইজ ১০ মেগাবাইটের কম হতে হবে'), 'error');
      return;
    }

    try {
      setIsUploading(type);
      showToast(t(`Uploading ${type}...`, `${type} আপলোড হচ্ছে...`), 'info');
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        let imageData = reader.result as string;

        // Compress large images to stay within compact upload and storage limits
        if (file.size > 300 * 1024 || imageData.length > 500 * 1024) {
          try {
            const maxDimension = type.includes('banner') ? 1000 : 600;
            imageData = await compressImage(imageData, maxDimension, 0.6); 
          } catch (e) {
            console.error('Compression failed', e);
          }
        }
        
        try {
          // Determine where to save the data
          if (type.startsWith('shop')) {
            const shopType = type === 'shopLogo' ? 'logo' : 'banner';
            const updatedShopData = { ...(user.shop || {}), [shopType]: imageData };
            const updatedUser = await authApi.updateProfile({ shop: updatedShopData });
            if (updatedUser) {
              onUpdateUser(updatedUser as unknown as UserType);
              if (isEditingShop) {
                setShopEditData((prev: any) => ({ ...prev, [shopType]: imageData }));
              }
              showToast(t(`${shopType.charAt(0).toUpperCase() + shopType.slice(1)} updated successfully!`, 'শপের ছবি সফলভাবে আপডেট হয়েছে!'));
            }
          } else {
            const updatedUser = await authApi.updateProfile({ [type]: imageData });
            if (updatedUser) {
              onUpdateUser(updatedUser as unknown as UserType);
              if (isEditing) {
                setEditData(prev => ({ ...prev, [type]: imageData }));
              }
              showToast(t(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`, 'ছবি সফলভাবে আপডেট হয়েছে!'));
            }
          }
        } catch (error) {
          showToast(t(`Failed to update ${type}. Try a smaller or lower resolution image.`, 'ছবি আপলোড ব্যর্থ হয়েছে। অনুগ্রহ করে ছোট সাইজের ছবি ব্যবহার করুন।'), 'error');
        } finally {
          setIsUploading(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast(t('Error processing file', 'ফাইল প্রসেস করতে সমস্যা হয়েছে'), 'error');
      setIsUploading(null);
    }
  };

  // Helper function to compress images
  const compressImage = (base64: string, maxSize: number, quality = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality)); 
      };
      img.onerror = reject;
    });
  };

  // Advanced Order State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [confirmBulkRestore, setConfirmBulkRestore] = useState(false);

  // Shop Management State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [shopFilter, setShopFilter] = useState('all');
  const [shopSearchTerm, setShopSearchTerm] = useState('');
  const [shopCategoryFilter, setShopCategoryFilter] = useState('all');
  const [shopStatusFilter, setShopStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [promotingProduct, setPromotingProduct] = useState<Product | null>(null);
  const [adBudgetInput, setAdBudgetInput] = useState<number>(500);
  const [adStatusInput, setAdStatusInput] = useState<boolean>(true);
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [shopEditData, setShopEditData] = useState<any>({});
  const [productFormData, setProductFormData] = useState<any>(() => {
    const savedDraft = localStorage.getItem('elora-product-draft');
    if (savedDraft) {
      try {
        return JSON.parse(savedDraft);
      } catch (e) {
        console.error('Failed to parse product draft');
      }
    }
    return {
      name: '',
      brand: '',
      category: '',
      subcategory: '',
      sku: '',
      condition: 'new',
      price: '',
      originalPrice: '',
      stock: '',
      minOrderQuantity: 1,
      image: '',
      gallery: [] as string[],
      description: '',
      deliveryTime: '',
      deliveryFee: '',
      codAllowed: true,
      tags: [] as string[],
      variants: {
        sizes: [] as string[],
        colors: [] as string[]
      }
    };
  });

  const [productErrors, setProductErrors] = useState<any>({});
  const [sizeInputText, setSizeInputText] = useState('');
  const [colorInputText, setColorInputText] = useState('');
  const [uploadedImagesMeta, setUploadedImagesMeta] = useState<Record<number, { name: string; size: number; src: string }>>({});

  React.useEffect(() => {
    const meta: Record<number, { name: string; size: number; src: string }> = {};
    if (productFormData?.image) {
      meta[0] = { name: '', size: 0, src: productFormData.image };
    }
    if (productFormData?.gallery && Array.isArray(productFormData.gallery)) {
      productFormData.gallery.forEach((gSrc: string, index: number) => {
        if (gSrc) {
          meta[index + 1] = { name: '', size: 0, src: gSrc };
        }
      });
    }
    setUploadedImagesMeta(meta);
  }, []);

  const validateSizeString = (val: string): boolean => {
    const d = val.trim();
    if (!d) return true;
    if (/(.)\1{4,}/.test(d)) return false;
    if (/^[^a-zA-Z0-9]+$/.test(d)) return false;
    if (d.length > 12) return false;
    return /^[a-zA-Z0-9\s\-\/\+]+$/.test(d);
  };

  const validateColorString = (val: string): boolean => {
    const d = val.trim();
    if (!d) return true;
    if (/(.)\1{4,}/.test(d)) return false;
    if (/^[^a-zA-Z0-9]+$/.test(d)) return false;
    if (d.length > 25) return false;
    return /^[a-zA-Z0-9\s\-\/\+]+$/.test(d);
  };

  const getSizeStatus = () => {
    const sizes = productFormData.variants?.sizes || [];
    const text = sizeInputText.trim();
    if (sizes.length === 0 && !text) return 'empty';
    const hasInvalidInList = sizes.some(s => !validateSizeString(s));
    const isTypingInvalid = text !== '' && !validateSizeString(text);
    if (hasInvalidInList || isTypingInvalid) return 'invalid';
    return 'valid';
  };

  const getColorStatus = () => {
    const colors = productFormData.variants?.colors || [];
    const text = colorInputText.trim();
    if (colors.length === 0 && !text) return 'empty';
    const hasInvalidInList = colors.some(c => !validateColorString(c));
    const isTypingInvalid = text !== '' && !validateColorString(text);
    if (hasInvalidInList || isTypingInvalid) return 'invalid';
    return 'valid';
  };

  // Persistent Draft
  React.useEffect(() => {
    localStorage.setItem('elora-product-draft', JSON.stringify(productFormData));
  }, [productFormData]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const lastErrorRef = React.useRef<string | null>(null);
  const lastErrorAddrRef = React.useRef<string | null>(null);

  const isAdmin = user?.role === 'admin' || isSuperAdminEmail(user?.email);

  const handleRemoveProduct = (productId: string) => {
    setPendingDeleteProductId(productId);
  };

  const executeRemoveProduct = async () => {
    if (!pendingDeleteProductId) return;
    const productId = pendingDeleteProductId;
    setPendingDeleteProductId(null);
    try {
      setIsSaving(true);
      await productApi.deleteProduct(productId);
      onDeleteProduct(productId);
      showToast(t('Product deleted successfully', 'পণ্য সফলভাবে মুছে ফেলা হয়েছে'), 'success');
    } catch (e: any) {
      console.error('Delete product error:', e);
      showToast(formatFriendlyError(e, t('Could not delete product. Please try again.', 'পণ্যটি মুছে ফেলা সম্ভব হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'), t), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProductSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      showToast(t('You must be logged in to submit a product.', 'পণ্য সাবমিট করতে অনুগ্রহ করে লগইন করুন।'), 'error');
      return;
    }
    
    // Clear previous errors
    setProductErrors({});
    
    // Validation Logic
    const newErrors: any = {};
    if (!productFormData.name?.trim()) {
      newErrors.name = t('Product Name is required', 'পণ্যের নাম আবশ্যক');
    }
    if (!productFormData.category) {
      newErrors.category = t('Please select a category', 'ক্যাটাগরি নির্বাচন করুন');
    }
    
    // Robust number validation
    const priceVal = productFormData.price === '' ? NaN : Number(productFormData.price);
    if (isNaN(priceVal) || priceVal < 0) {
      newErrors.price = t('Valid price is required (0 or more)', 'সঠিক মূল্য দিন');
    } else if (priceVal === 0 && !editingProduct) {
      console.warn('Submitting product with 0 price');
    }

    const stockVal = productFormData.stock === '' ? NaN : Number(productFormData.stock);
    if (isNaN(stockVal) || stockVal < 0) {
      newErrors.stock = t('Valid stock quantity is required', 'সঠিক স্টক সংখ্যা দিন');
    }

    if (!productFormData.image) {
      newErrors.image = t('At least one image is required', 'কমপক্ষে একটি ছবি আপলোড করুন');
    }
    if (!productFormData.description?.trim()) {
      newErrors.description = t('Product description is required', 'পণ্যের বর্ণনা দিন');
    }

    // Optional Variant Fields Non-blocking Validation & Warnings
    const sizeStatus = getSizeStatus();
    const colorStatus = getColorStatus();
    if (sizeStatus === 'invalid') {
      showToast(t('Size information is invalid (e.g. S, M, L / 40, 42)', 'সাইজ তথ্য সঠিকভাবে লিখুন'), 'warning');
    }
    if (colorStatus === 'invalid') {
      showToast(t('Color name is invalid (e.g. Red, Black, Blue)', 'কালারের তথ্য সঠিক নয়'), 'warning');
    }

    if (Object.keys(newErrors).length > 0) {
      setProductErrors(newErrors);
      const errorCount = Object.keys(newErrors).length;
      showToast(t(`${errorCount} error(s) found in your form. Please fill the highlighted fields.`, `আপনার ফর্মে ${errorCount}টি ভুল পাওয়া গেছে। লাল চিহ্নিত ঘরগুলো পূরণ করুন।`), 'error');
      return;
    }

    // Warnings for empty sizes and colors, which do not block submit!
    const sEmpty = !productFormData.variants?.sizes || productFormData.variants.sizes.length === 0;
    const cEmpty = !productFormData.variants?.colors || productFormData.variants.colors.length === 0;
    if (sEmpty) {
      showToast(t('You have not added any sizes', 'আপনি সাইজ তথ্য যোগ করেননি'), 'warning');
    }
    if (cEmpty) {
      showToast(t('You have not added any colors', 'আপনি কালার তথ্য যোগ করেননি'), 'warning');
    }
    
    // Check shop status - allow active OR pending shops to submit for review
    const shopStatus = user.shop?.status;
    const canSubmit = shopStatus === 'active' || shopStatus === 'approved' || shopStatus === 'pending';
    
    if (!canSubmit && !isAdmin) {
      if (!user.shop) {
        showToast(t('You must create a shop profile before adding products.', 'পণ্য যোগ করার আগে আপনাকে একটি শপ প্রোফাইল তৈরি করতে হবে।'), 'error');
      } else if (shopStatus === 'rejected') {
        showToast(t('Your shop was rejected. Please contact the support team.', 'আপনার শপটি রিজেক্ট করা হয়েছে। অনুগ্রহ করে সাপোর্ট টিমের সাথে যোগাযোগ করুন।'), 'error');
      } else {
        showToast(t(`Your shop status (${shopStatus || 'unknown'}) does not allow adding products.`, `আপনার শপ স্ট্যাটাস (${shopStatus || 'unknown'}) পণ্য যোগ করার অনুমতি দিচ্ছে না।`), 'error');
      }
      return;
    }

    try {
      setIsSaving(true);
      const productData: any = {
        name: productFormData.name,
        brand: productFormData.brand,
        sku: productFormData.sku,
        category: productFormData.category,
        subcategory: productFormData.subcategory,
        condition: productFormData.condition,
        price: Number(productFormData.price) || 0,
        originalPrice: productFormData.originalPrice ? Number(productFormData.originalPrice) : undefined,
        stock: Number(productFormData.stock) || 0,
        minOrderQuantity: Number(productFormData.minOrderQuantity) || 1,
        image: productFormData.image,
        gallery: [
          productFormData.image,
          ...(productFormData.gallery || [])
        ].filter(Boolean).slice(0, 7),
        description: productFormData.description || '',
        details: productFormData.description || '',
        deliveryTime: productFormData.deliveryTime,
        deliveryFee: productFormData.deliveryFee ? Number(productFormData.deliveryFee) : undefined,
        codAllowed: productFormData.codAllowed,
        tags: productFormData.tags || [],
        variants: productFormData.variants,
        status: (editingProduct && isAdmin) ? (editingProduct.status || 'pending') : 'pending',
        reviews: editingProduct?.reviews || 0,
        rating: editingProduct?.rating || 5,
        seller: {
          id: user.id,
          name: user.shop?.name || user.name,
          verified: user.shop?.isVerified || false,
          rating: user.shop?.rating || 5,
          followers: user.shop?.followers?.toString() || '0',
          chatResponse: '100%'
        }
      };

      if (editingProduct) {
        const updated = await productApi.updateProduct(editingProduct.id, productData);
        onUpdateProduct(updated as Product);
        showToast(t('Product updated successfully!', 'প্রোডাক্ট আপডেট করা হয়েছে!'));
      } else {
        const created = await productApi.createProduct(productData);
        onAddProduct(created as Product);
        showToast(t('Your product has been submitted for admin review.', 'আপনার পণ্যটি অ্যাডমিন রিভিউয়ের জন্য পাঠানো হয়েছে।'), 'success');
      }
      
      setShowAddModal(false);
      setEditingProduct(null);
      setProductFormData({
        name: '',
        brand: '',
        category: 'electronics',
        subcategory: '',
        sku: '',
        condition: 'new',
        price: '',
        originalPrice: '',
        stock: '',
        minOrderQuantity: 1,
        image: '',
        gallery: [] as string[],
        description: '',
        deliveryTime: '2-3 days',
        deliveryFee: 60,
        codAllowed: true,
        tags: [],
        variants: {
          sizes: [],
          colors: []
        }
      });
    } catch (e: any) {
      console.error('Submit Error:', e);
      const friendlyMessage = formatFriendlyError(e, t('Could not save product. Please try again.', 'পণ্যটি সেভ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'), t);
      showToast(friendlyMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize Shop request if missing
  React.useEffect(() => {
    if (user && !user.shop && activeTab === 'shop' && !isEditingShop) {
      setShopEditData({
        id: 'shop-' + user.id,
        name: user.name + "'s Store",
        ownerName: user.name,
        description: t('New shop request pending configuration.', 'নতুন শপ রিকুয়েস্ট কনফিগারেশনের অপেক্ষায়।'),
        logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`,
        banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
        category: 'Multipurpose',
        followers: 0,
        rating: 5.0,
        verified: false,
        joinedAt: new Date().toISOString(),
        totalSales: 0,
        revenue: 0,
        status: 'pending',
        contactNumber: user.phone || '',
        email: user.email,
        division: '',
        district: '',
        upazila: '',
        fullAddress: '',
        nid: '',
        tradeLicense: ''
      });
      setIsEditingShop(true);
      showToast(t('Complete your shop details to submit for approval.', 'অনুমোদনের জন্য আপনার দোকানের তথ্য পূরণ করুন।'), 'info');
    }
  }, [activeTab, user, isEditingShop, showToast, t]);

  const handleSaveShop = async () => {
    const requiredFields = [
      'name', 
      'ownerName', 
      'email', 
      'contactNumber', 
      'division', 
      'district', 
      'upazila', 
      'fullAddress', 
      'description', 
      'nid',
      'logo',
      'banner'
    ];

    const missingFields = requiredFields.filter(field => !shopEditData[field]);

    if (missingFields.length > 0) {
      showToast(t('Please fill all required shop details (name, owner, email, phone, address, description, NID, logo & banner)', 'দোকানের সকল আবশ্যিক তথ্য (নাম, মালিকের নাম, ইমেইল, মোবাইল, ঠিকানা, বর্ণনা, এনআইডি এবং লোগো/ব্যানার) পূরণ করুন'), 'error');
      return;
    }

    if (errors.shop_phone || errors.shop_email || errors.shop_owner) {
      showToast(t('Please provide valid information', 'অনুগ্রহ করে সঠিক তথ্য প্রদান করুন'), 'error');
      return;
    }

    try {
      setIsSaving(true);
      const isNew = !user.shop || user.shop.status === 'rejected';
      const targetStatus = isNew ? 'pending' : (user.shop?.status || 'pending');
      const updatedUser = await authApi.updateProfile({
        shop: {
          ...(user.shop || {}),
          ...shopEditData,
          status: targetStatus
        }
      });
      try {
        const { shopApi } = await import('../services/api');
        if (isNew) {
          await shopApi.submitShopApplication({ ...shopEditData });
        } else {
          await shopApi.updateShopDetails({ ...shopEditData });
        }
      } catch (shopErr) {
        console.warn('Could not mirror to shops collection:', shopErr);
      }
      onUpdateUser(updatedUser as unknown as UserType);
      setIsEditingShop(false);
      showToast(
        isNew
          ? t('Your shop has been submitted for admin review!', 'আপনার শপটি পর্যালোচনার জন্য পাঠানো হয়েছে! অ্যাডমিন অ্যাপ্রুভ করলে আপনি প্রোফাইলে দেখতে পাবেন।')
          : t('Shop information updated!', 'দোকানের তথ্য আপডেট করা হয়েছে!')
      );
    } catch (e: any) {
      showToast(formatFriendlyError(e, t('Problem saving shop details. Please try again.', 'দোকানের তথ্য সংরক্ষণ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'), t), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (authChecking) {
    return (
      <CircularLoader
        fullScreen
        label={t('Loading profile...', 'প্রোফাইল লোড হচ্ছে...')}
      />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto shadow-inner">
            <UserIcon size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {t('Login Required', 'লগইন প্রয়োজন')}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t(
                'Please sign in to access your profile, saved addresses, and shopping dashboard.',
                'আপনার প্রোফাইল, সংরক্ষিত ঠিকানা ও ড্যাশবোর্ড দেখতে অনুগ্রহ করে লগইন করুন।'
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-brand-orange hover:bg-orange-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              {t('Go to Login', 'লগইন করুন')}
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-gray-200 cursor-pointer"
            >
              {t('Return Home', 'হোমপেজে ফিরে যান')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Task 2: Mobile-first profile screen when < 1024px and on dashboard overview
  if (isMobileView && activeTab === 'dashboard') {
    return (
      <MobileProfileScreen
        user={user}
        orders={orders}
        wishlist={wishlist}
        cart={cart}
        products={products}
        onLogout={handleLogout}
        onUpdateUser={onUpdateUser}
        setActiveTab={setActiveTab}
        onOpenPhoneModal={() => setShowPhoneModal(true)}
        effectivePhone={effectivePhone}
        onSelectOrder={setSelectedOrder}
        syncWarning={isSyncFallback}
        onRetrySync={handleRetrySync}
        isRetryingSync={isRetryingSync}
      />
    );
  }

  const wishlistProducts = (products || []).filter(p => (wishlist || []).includes(p.id));
  const myProducts = (products || []).filter(p => p?.seller?.id === user?.id || (user?.shop?.name && p?.seller?.name === user?.shop?.name));

  const handleEditDataChange = (field: string, value: string) => {
    let newValue = value;
    let error = '';

    if (field === 'name') {
      if (value && !validateName(value)) error = t('Letters only', 'আপনার নাম লিখুন (শুধু অক্ষর)');
    } else if (field === 'phone') {
      newValue = value.replace(/[^\d+]/g, '').replace(/\s/g, '');
      if (newValue.startsWith('+')) newValue = newValue.slice(0, 14);
      else if (newValue.startsWith('88')) newValue = newValue.slice(0, 13);
      else newValue = newValue.slice(0, 11);

      if (newValue && !validatePhone(newValue)) error = t('Enter a valid Bangladeshi phone number', 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন');
    } else if (field === 'email') {
      if (value && !validateEmail(value)) error = t('Enter a valid email address', 'সঠিক ইমেইল দিন');
    }

    if (error && error !== lastErrorRef.current) {
      showToast(error, 'error');
      lastErrorRef.current = error;
    } else if (!error) {
      lastErrorRef.current = null;
    }

    setEditData(prev => ({ ...prev, [field]: newValue }));
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleEditProfile = () => {
    if (!user) return;
    setEditData({
      name: user.name,
      username: (user as any).username || (user.email ? user.email.split('@')[0] : ''),
      email: user.email,
      phone: user.phone || effectivePhone || '',
      avatar: user.avatar || '',
      banner: user.banner || ''
    });
    setIsEditing(true);
    setErrors({});
  };

  const handleSaveProfile = async () => {
    if (!editData.name || !editData.email) {
      showToast(t('Name and email are required', 'নাম এবং ইমেইল আবশ্যিক'), 'error');
      return;
    }
    
    if (errors.name || errors.email || errors.phone) {
      showToast(t('Please enter valid details', 'অনুগ্রহ করে সঠিক তথ্য দিন'), 'error');
      return;
    }
    
    try {
      setIsSaving(true);
      const cleanedPhone = editData.phone ? editData.phone.replace(/[^\d+]/g, '').trim() : '';
      const cleanUsername = editData.username ? editData.username.trim().toLowerCase().replace(/\s+/g, '_') : '';
      if (cleanedPhone) {
        localStorage.setItem(`phone_${user.id}`, cleanedPhone);
        if (user.email) localStorage.setItem(`phone_${user.email}`, cleanedPhone);
      }
      const updatedUser = await authApi.updateProfile({
        name: editData.name,
        username: cleanUsername,
        phone: cleanedPhone,
        avatar: editData.avatar,
        banner: editData.banner
      });
      onUpdateUser(updatedUser ? { ...user, ...updatedUser, username: cleanUsername, banner: editData.banner, phone: cleanedPhone || user.phone } : { ...user, name: editData.name, username: cleanUsername, banner: editData.banner, phone: cleanedPhone || user.phone });
      setIsEditing(false);
      setErrors({});
      showToast(t('Profile updated successfully', 'তথ্য সঠিকভাবে আপডেট হয়েছে'), 'success');
    } catch (e: any) {
      showToast(formatFriendlyError(e, t('Problem updating profile. Please try again.', 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'), t), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhoneModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const cleaned = phoneInput.replace(/[^\d+]/g, '').trim();
    if (cleaned.length < 10) {
      showToast(t('Enter a valid Bangladeshi phone number (min 11 digits)', 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন (কমপক্ষে ১১ ডিজিট)'), 'error');
      return;
    }

    try {
      setIsSavingPhone(true);
      const updatedUser = await authApi.updateProfile({ phone: cleaned });
      localStorage.setItem(`phone_${user.id}`, cleaned);
      if (user.email) localStorage.setItem(`phone_${user.email}`, cleaned);
      onUpdateUser(updatedUser ? { ...user, ...updatedUser, phone: cleaned } : { ...user, phone: cleaned });
      setShowPhoneModal(false);
      showToast(t('Mobile number saved successfully!', 'মোবাইল নম্বর সফলভাবে সংরক্ষিত হয়েছে!'), 'success');
    } catch (err) {
      console.error('Phone save error:', err);
      localStorage.setItem(`phone_${user.id}`, cleaned);
      if (user.email) localStorage.setItem(`phone_${user.email}`, cleaned);
      onUpdateUser({ ...user, phone: cleaned });
      setShowPhoneModal(false);
      showToast(t('Mobile number saved on device!', 'মোবাইল নম্বর ডিভাইসে সংরক্ষিত হয়েছে!'), 'success');
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleEditShop = () => {
    if (user.shop) {
      setShopEditData({ ...user.shop });
    } else {
      setShopEditData({
         name: user.name + "'s Store",
         category: 'Multipurpose',
         description: '',
         logo: '',
         banner: '',
      });
    }
    setIsEditingShop(true);
  };

  const handleUpdateSecurityKey = () => {
    const newKey = 'SK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    setSecuritySettings({ ...securitySettings, sessionKey: newKey });
    showToast(t('New session security key generated', 'নতুন সেশন সিকিউরিটি কী তৈরি হয়েছে'));
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      showToast(t('All password fields must be filled', 'সবগুলো পাসওয়ার্ড ঘর পূরণ করুন'), 'error');
      return;
    }
    if (passwordData.new !== passwordData.confirm) {
      showToast(t('New passwords do not match', 'নতুন পাসওয়ার্ড দুটি মেলেনি'), 'error');
      return;
    }
    if (passwordData.new.length < 8) {
      showToast(t('Password must be at least 8 characters long', 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে'), 'error');
      return;
    }

    showToast(t('Password updated successfully', 'পাসওয়ার্ড সফলভাবে আপডেট হয়েছে'));
    setPasswordData({ current: '', new: '', confirm: '', show: false });
  };

  const handleAccountDeletion = () => {
    localStorage.removeItem('elora-user');
    localStorage.removeItem('elora-orders');
    localStorage.removeItem('elora-wishlist');
    localStorage.removeItem('elora-cart');
    localStorage.removeItem('elora-admin-token');
    
    showToast(t('Purging all user data from memory...', 'অ্যাকাউন্টের সব তথ্য মুছে ফেলা হচ্ছে...'), 'info');
    
    setTimeout(() => {
      showToast(t('Account deleted successfully', 'অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে'), 'error');
      setTimeout(() => {
        onLogout();
        navigate('/');
      }, 1000);
    }, 1500);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addressData.fullName || !addressData.phone || !addressData.division || !addressData.district || !addressData.upazila || !addressData.fullAddress) {
      showToast(t('Please fill all required fields correctly', 'সবগুলো ঘর সঠিকভাবে পূরণ করুন'), 'error');
      return;
    }

    if (errors.addr_phone || errors.addr_name) {
      showToast(t('Address details contain errors, please fix them', 'ঠিকানার তথ্যে ভুল আছে, অনুগ্রহ করে সংশোধন করুন'), 'error');
      return;
    }

    try {
      setIsSaving(true);
      
      if (!user) {
        showToast(t('Profile information not found', 'প্রোফাইল তথ্য পাওয়া যায়নি'), 'error');
        return;
      }

      const isDefaultAddress = addressData.isDefault || (!user.addresses || user.addresses.length === 0);
      const dataToSave: Address = {
        ...addressData,
        isDefault: isDefaultAddress,
        label: addressData.label || 'Home'
      };

      const isAuthenticatedUser = Boolean(user.id && !String(user.id).startsWith('guest_'));

      if (editingAddressIdx !== null && user.addresses) {
        let updated: Address;
        if (isAuthenticatedUser && user.addresses[editingAddressIdx].id) {
          const addressId = user.addresses[editingAddressIdx].id;
          updated = await addressApi.updateAddress(addressId!, dataToSave);
        } else {
          updated = { ...dataToSave, id: user.addresses[editingAddressIdx].id || `ADDR-${Date.now()}` };
        }
        
        let newAddresses = [...user.addresses];
        if (isDefaultAddress) {
          newAddresses = newAddresses.map((a, i) => i === editingAddressIdx ? updated : { ...a, isDefault: false });
        } else {
          newAddresses[editingAddressIdx] = updated;
        }
        onUpdateUser({ ...user, addresses: newAddresses });
        showToast(t('Address updated successfully', 'ঠিকানা সফলভাবে আপডেট হয়েছে'));
      } else {
        let created: Address;
        if (isAuthenticatedUser) {
          created = await addressApi.createAddress(dataToSave);
        } else {
          created = { ...dataToSave, id: `ADDR-${Math.random().toString(36).substr(2, 9).toUpperCase()}` };
        }
        
        let newAddresses = user.addresses || [];
        if (isDefaultAddress) {
          newAddresses = newAddresses.map(a => ({ ...a, isDefault: false }));
        }
        onUpdateUser({ ...user, addresses: [...newAddresses, created] });
        showToast(t('New address saved successfully', 'নতুন ঠিকানা সফলভাবে সংরক্ষিত হয়েছে'));
      }
      setShowAddressModal(false);
      setEditingAddressIdx(null);
    } catch (e: any) {
      showToast(formatFriendlyError(e, t('Problem saving address. Please try again.', 'ঠিকানা সেভ করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'), t), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddressInputChange = (field: string, value: string) => {
    let newValue = value;
    let error = '';

    if (field === 'fullName') {
      if (value && !validateName(value)) error = t('Enter a valid name (Letters only)', 'সঠিক নাম লিখুন (শুধু অক্ষর)');
    } else if (field === 'phone') {
      newValue = value.replace(/[^\d+]/g, '').replace(/\s/g, '');
      if (newValue.startsWith('+')) newValue = newValue.slice(0, 14);
      else if (newValue.startsWith('88')) newValue = newValue.slice(0, 13);
      else newValue = newValue.slice(0, 11);

      if (newValue && !validatePhone(newValue)) error = t('Enter a valid Bangladeshi phone number', 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন');
    }

    if (error && error !== lastErrorAddrRef.current) {
      showToast(error, 'error');
      lastErrorAddrRef.current = error;
    } else if (!error) {
      lastErrorAddrRef.current = null;
    }

    setAddressData(prev => ({ ...prev, [field]: newValue }));
    setErrors(prev => ({ ...prev, [`addr_${field}`]: error }));
  };
  const handleDeleteAddress = async (idx: number) => {
    if (!user || !user.addresses) return;
    const address = user.addresses[idx];
    
    try {
      setIsSaving(true);
      if (user.id && !String(user.id).startsWith('guest_') && address.id) {
        await addressApi.deleteAddress(address.id);
      }
      
      const newAddresses = user.addresses.filter((_, i) => i !== idx);
      onUpdateUser({ ...user, addresses: newAddresses });
      showToast(t('Address deleted', 'ঠিকানা মুছে ফেলা হয়েছে'), 'info');
    } catch (e: any) {
      showToast(formatFriendlyError(e, t('Problem deleting address. Please try again.', 'ঠিকানা মুছে ফেলতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'), t), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefaultAddress = async (idx: number) => {
    if (!user || !user.addresses) return;
    const address = user.addresses[idx];

    try {
      setIsSaving(true);
      let updated = { ...address, isDefault: true };
      
      if (user.id && !String(user.id).startsWith('guest_') && address.id) {
        updated = await addressApi.updateAddress(address.id, { ...address, isDefault: true });
      }
      
      const newAddresses = user.addresses.map((a, i) => i === idx ? updated : { ...a, isDefault: false });
      onUpdateUser({ ...user, addresses: newAddresses });
      showToast(t('Default address updated', 'ডিফল্ট ঠিকানা সেট করা হয়েছে'));
    } catch (e: any) {
      showToast(formatFriendlyError(e, t('Problem updating default address. Please try again.', 'ডিফল্ট ঠিকানা আপডেট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'), t), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelOrder = async (orderId: string, reason?: string) => {
    try {
      await orderApi.requestOrderCancellation(orderId, reason || 'Customer requested order cancellation');
      const updated = orders.map(o => o.id === orderId ? {
        ...o,
        cancellationRequested: true,
        cancellationReason: reason || 'Customer requested order cancellation',
        cancellationRequestedAt: new Date().toISOString()
      } : o);
      onUpdateOrders(updated);
      showToast(t('Cancellation request submitted for review.', 'অর্ডার বাতিলের অনুরোধ জমা দেওয়া হয়েছে।'), 'success');
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? {
          ...prev,
          cancellationRequested: true,
          cancellationReason: reason || 'Customer requested order cancellation',
          cancellationRequestedAt: new Date().toISOString()
        } : null);
      }
    } catch (err: any) {
      showToast(formatFriendlyError(err, t('Failed to submit cancellation request. Please try again.', 'অর্ডার বাতিলের অনুরোধ পাঠানো যায়নি। আবার চেষ্টা করুন।'), t), 'error');
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (product) onAddToCart(product, item.quantity, item.selectedSize, item.selectedColor);
    });
    showToast(t('Items added back to cart!', 'পণ্যগুলো পুনরায় কার্টে যোগ করা হয়েছে!'));
    setActiveTab('cart');
  };

  const handleSoftDelete = (orderId: string) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, isDeleted: true } : o);
    onUpdateOrders(updated);
    showToast(t('Order moved to trash', 'অর্ডারটি ট্র্যাশে সরানো হয়েছে'), 'info');
    setConfirmDelete(null);
  };

  const handleRestore = (orderId: string) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, isDeleted: false } : o);
    onUpdateOrders(updated);
    showToast(t('Order restored successfully', 'অর্ডারটি পুনরুদ্ধার করা হয়েছে'));
  };

  const handlePermanentDelete = (orderId: string) => {
    const updated = orders.filter(o => o.id !== orderId);
    onUpdateOrders(updated);
    showToast(t('Order permanently deleted', 'অর্ডারটি স্থায়ীভাবে মুছে ফেলা হয়েছে'), 'error');
  };

  const handleDeleteAllTrash = () => {
    const updated = orders.filter(o => !o.isDeleted);
    onUpdateOrders(updated);
    showToast(t('Trash cleared', 'ট্র্যাশ খালি করা হয়েছে'), 'error');
    setConfirmBulkDelete(false);
  };

  const handleRestoreAllTrash = () => {
    const updated = orders.map(o => ({ ...o, isDeleted: false }));
    onUpdateOrders(updated);
    showToast(t('All orders restored', 'সব অর্ডার পুনরুদ্ধার করা হয়েছে'));
    setConfirmBulkRestore(false);
  };

  const handleRemoveWishlist = (id: string) => {
    onRemoveFromWishlist(id);
    showToast(t('Removed from wishlist', 'পছন্দের তালিকা থেকে সরানো হয়েছে'), 'info');
  };

  const handleMoveToCart = (product: Product) => {
    onAddToCart(product);
    onRemoveFromWishlist(product.id);
    showToast(t('Moved to shopping cart', 'কার্টে যোগ করা হয়েছে'));
  };

  const stats = [
    { label: t('Total Orders', 'মোট অর্ডার'), value: (orders || []).filter(o => !o.isDeleted).length, icon: <Package size={20} strokeWidth={2} />, color: 'bg-blue-500', tab: 'orders' as Tab },
    { label: t('Saved Addresses', 'সংরক্ষিত ঠিকানা'), value: (user?.addresses || []).length, icon: <MapPin size={20} strokeWidth={2} />, color: 'bg-emerald-500', tab: 'addresses' as Tab },
    { label: t('Wishlist Items', 'পছন্দের পণ্য'), value: (wishlist || []).length, icon: <Heart size={20} strokeWidth={2} />, color: 'bg-rose-500', tab: 'wishlist' as Tab },
    { label: t('Cart Items', 'কার্টে পণ্য'), value: (cart || []).length, icon: <ShoppingCart size={20} strokeWidth={2} />, color: 'bg-brand-orange', tab: 'cart' as Tab },
  ];


  // Render Functions for Tabs
  const renderDashboard = () => (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t('Overview', 'ওভারভিউ')}</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Manage your shopping profile & account details', 'আপনার প্রোফাইল ও অ্যাকাউন্টের তথ্য পরিচালনা করুন')}</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={handleEditProfile}
            className="w-12 h-12 bg-white text-gray-900 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center hover:bg-orange-50 hover:text-brand-orange transition-all active:scale-95"
            title={t('Edit Profile', 'প্রোফাইল এডিট করুন')}
          >
            <Edit2 size={18} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="w-12 h-12 bg-white text-gray-400 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
            >
              <X size={18} />
            </button>
            <button 
              onClick={handleSaveProfile}
              disabled={!!errors.name || !!errors.email || !!errors.phone || !editData.name || !editData.email}
              className={`w-12 h-12 rounded-2xl shadow-sm border flex items-center justify-center transition-all active:scale-95 ${
                (!errors.name && !errors.email && !errors.phone && editData.name && editData.email)
                ? 'bg-brand-orange text-white border-brand-orange/20 hover:bg-orange-600'
                : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
              }`}
            >
              <Save size={18} />
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div 
          className="bg-white p-8 rounded-[44px] shadow-2xl border border-orange-100 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-visible transition-opacity duration-200 ease-in-out"
          style={{ transform: 'none !important' as any }}
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <UserIcon size={120} />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
             <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Profile Avatar', 'প্রোফাইল ছবি')}</label>
               <div 
                 className="relative group cursor-pointer w-full h-48 bg-gray-50 rounded-[32px] overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-100 hover:border-brand-orange transition-colors"
                 onClick={() => avatarInputRef.current?.click()}
               >
                 {isUploading === 'avatar' ? (
                    <div className="flex flex-col items-center gap-2">
                       <Loader2 className="animate-spin text-brand-orange" size={32} />
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{t('Uploading Avatar...', 'ছবি আপলোড হচ্ছে...')}</span>
                    </div>
                 ) : (
                   <>
                    <img 
                      src={editData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'guest'}`} 
                      className="w-32 h-32 rounded-[32px] object-cover shadow-2xl"
                      alt="Preview"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white/90 p-3 rounded-2xl flex items-center gap-2 shadow-xl">
                          <Camera size={20} className="text-brand-orange" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{t('Change Avatar', 'ছবি পরিবর্তন')}</span>
                      </div>
                    </div>
                   </>
                 )}
               </div>
             </div>

             <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Banner / Cover Image (Max 10MB)', 'কভার ব্যানার ছবি (সর্বোচ্চ ১০MB)')}</label>
               <div 
                 className="relative group cursor-pointer w-full h-48 bg-gray-50 rounded-[32px] overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-100 hover:border-brand-orange transition-colors"
                 onClick={() => bannerInputRef.current?.click()}
               >
                 {isUploading === 'banner' ? (
                   <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-brand-orange" size={32} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{t('Uploading Banner...', 'ব্যানার আপলোড হচ্ছে...')}</span>
                   </div>
                 ) : (
                   <>
                    {(editData.banner || user?.banner) ? (
                      <img src={editData.banner || user?.banner} className="w-full h-full object-cover" alt="Banner Preview" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <ImageIcon size={32} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('No Banner Set', 'কোনো ব্যানার নেই')}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 p-3 rounded-2xl flex items-center gap-2 shadow-xl">
                          <Camera size={20} className="text-brand-orange" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{t('Change Banner', 'ব্যানার পরিবর্তন')}</span>
                      </div>
                    </div>
                   </>
                 )}
               </div>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Full Name', 'পূর্ণ নাম')}</label>
            <div className="relative">
              <input 
                type="text"
                value={editData.name || ''}
                onChange={(e) => handleEditDataChange('name', e.target.value)}
                className={`w-full bg-gray-50 border-2 h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm pointer-events-auto relative z-10 pr-12 ${
                  errors.name ? 'border-rose-500 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20 animate-shake' : 
                  editData.name && !errors.name ? 'border-emerald-500 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10' : 
                  'border-gray-50 focus:border-brand-orange'
                }`}
                placeholder={t('e.g. John Doe', 'আপনার পূর্ণ নাম')}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                {editData.name && !errors.name && <CheckCircle2 size={18} className="text-emerald-500" />}
                {errors.name && <AlertCircle size={18} className="text-rose-500" />}
              </div>
            </div>
            {errors.name && <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Username', 'ইউজারনেম')}</label>
            <input 
              type="text"
              value={editData.username || ''}
              onChange={(e) => setEditData({ ...editData, username: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
              className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm pointer-events-auto relative z-10"
              placeholder="e.g. john_doe_01"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Email Address', 'ইমেইল ঠিকানা')}</label>
            <div className="relative">
              <input 
                type="email"
                value={editData.email || ''}
                onChange={(e) => handleEditDataChange('email', e.target.value)}
                className={`w-full bg-gray-50 border-2 h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm pointer-events-auto relative z-10 pr-12 ${
                  errors.email ? 'border-rose-500 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20 animate-shake' : 
                  editData.email && !errors.email ? 'border-emerald-500 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10' : 
                  'border-gray-50 focus:border-brand-orange'
                }`}
                placeholder="e.g. john@matrix.com"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                {editData.email && !errors.email && <CheckCircle2 size={18} className="text-emerald-500" />}
                {errors.email && <AlertCircle size={18} className="text-rose-500" />}
              </div>
            </div>
            {errors.email && <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Phone Number', 'মোবাইল নম্বর')}</label>
            <div className="relative">
              <input 
                type="tel"
                inputMode="numeric"
                value={editData.phone || ''}
                onChange={(e) => handleEditDataChange('phone', e.target.value)}
                className={`w-full bg-gray-50 border-2 h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm pointer-events-auto relative z-10 pr-12 ${
                  errors.phone ? 'border-rose-500 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/20 animate-shake' : 
                  editData.phone && !errors.phone ? 'border-emerald-500 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10' : 
                  'border-gray-50 focus:border-brand-orange'
                }`}
                placeholder="e.g. 017XXXXXXXXX"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                {editData.phone && !errors.phone && <CheckCircle2 size={18} className="text-emerald-500" />}
                {errors.phone && <AlertCircle size={18} className="text-rose-500" />}
              </div>
            </div>
            {errors.phone && <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Avatar Image URL', 'প্রোফাইল ছবির লিংক')}</label>
            <input 
              type="text"
              value={editData.avatar || ''}
              onChange={(e) => setEditData({ ...editData, avatar: e.target.value })}
              className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm pointer-events-auto relative z-10"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          {editData.shop && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Shop Name', 'শপের নাম')}</label>
              <input 
                type="text"
                value={editData.shop.name || ''}
                onChange={(e) => setEditData({ 
                  ...editData, 
                  shop: { ...editData.shop!, name: e.target.value } 
                })}
                className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm pointer-events-auto relative z-10"
                placeholder={t('Your Shop Name', 'আপনার শপের নাম')}
              />
            </div>
          )}

          <div className="md:col-span-2 pt-6 flex gap-4">
             <button 
                type="button"
                onClick={handleSaveProfile}
                disabled={!!errors.name || !!errors.email || !!errors.phone || !editData.name || !editData.email}
                className={`flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                  (!errors.name && !errors.email && !errors.phone && editData.name && editData.email)
                  ? 'bg-brand-orange text-white shadow-orange-100 hover:scale-[1.02] active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
             >
                <Save size={16} /> {t('Save Profile', 'প্রোফাইল সংরক্ষণ করুন')}
             </button>
             <button 
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-8 h-14 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
             >
                {t('Cancel', 'বাতিল')}
             </button>
          </div>
        </div>
      )}

      {/* Primary Identity & Account Information Card */}
      {!isEditing && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100/90 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-brand-orange/20 shadow-md shrink-0 bg-gray-50">
                <img 
                  src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'guest'}`} 
                  alt={user?.name || 'User'} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight capitalize">
                    {user?.name || t('Verified User', 'ভেরিফাইড ব্যবহারকারী')}
                  </h3>
                  {isSuperAdminEmail(user?.email) ? (
                    <span className="px-3 py-1 bg-amber-500/15 text-amber-700 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
                      ⚡ {t('SUPER ADMIN', 'সুপার অ্যাডমিন')}
                    </span>
                  ) : user?.role === 'admin' ? (
                    <span className="px-3 py-1 bg-blue-500/15 text-blue-700 border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
                      🛡️ {t('ADMIN', 'অ্যাডমিন')}
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
                      👤 {t('CUSTOMER', 'ক্রেতা')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <ShieldCheck size={16} />
                  <span>{t('Admin Dashboard', 'অ্যাডমিন ড্যাশবোর্ড')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleEditProfile}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-gray-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Edit2 size={15} />
                <span>{t('Edit Profile', 'প্রোফাইল এডিট')}</span>
              </button>
            </div>
          </div>

          {/* Detailed Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t('Phone Number', 'মোবাইল নম্বর')}
                </span>
                <p className="text-sm font-bold text-gray-900 font-mono">
                  {effectivePhone ? (
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1.5 border border-emerald-200/60">
                      <span>📞</span>
                      <span>{effectivePhone}</span>
                    </span>
                  ) : (
                    <span className="text-gray-400 italic font-sans font-normal text-xs">{t('Not provided', 'যুক্ত করা হয়নি')}</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhoneInput(effectivePhone || '');
                  setShowPhoneModal(true);
                }}
                className="mt-2.5 text-[11px] font-bold text-brand-orange hover:text-orange-700 flex items-center gap-1 cursor-pointer w-fit"
              >
                <Edit2 size={12} />
                <span>{effectivePhone ? t('Change / Edit Number', 'নম্বর পরিবর্তন / এডিট') : t('+ Add Number', '+ নম্বর যোগ করুন')}</span>
              </button>
            </div>

            <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                {t('Account Role', 'অ্যাকাউন্ট রোল')}
              </span>
              <p className="text-sm font-bold text-gray-900 uppercase">
                {isSuperAdminEmail(user?.email) ? t('Super Admin', 'সুপার অ্যাডমিন') : (user?.role === 'admin' ? t('Admin', 'অ্যাডমিন') : t('Customer', 'ক্রেতা'))}
              </p>
            </div>

            <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                {t('Joined Date', 'সংযুক্তির তারিখ')}
              </span>
              <p className="text-sm font-bold text-gray-900">
                {formatDate(user?.joinedAt, undefined, dateLocale)}
              </p>
            </div>

            <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                {t('Status', 'স্ট্যাটাস')}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-emerald-700 capitalize">
                  {user?.status || t('Active Member', 'সক্রিয় সদস্য')}
                </span>
              </div>
            </div>

            {/* Default Delivery Address in Overview */}
            <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 sm:col-span-2 md:col-span-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={12} className="text-brand-orange" />
                  {t('Default Delivery Address', 'প্রধান ডেলিভারি ঠিকানা')}
                </span>
                <button 
                  type="button"
                  onClick={() => setActiveTab('addresses')}
                  className="text-[10px] font-bold text-brand-orange hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>{t(`View all addresses (${user?.addresses?.length || 0})`, `সব ঠিকানা দেখুন (${user?.addresses?.length || 0})`)}</span>
                  <ChevronRight size={12} />
                </button>
              </div>
              {user?.addresses && user.addresses.length > 0 ? (
                (() => {
                  const def = user.addresses.find(a => a.isDefault) || user.addresses[0];
                  return (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                        <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-orange-100 text-brand-orange mr-2">
                          {def.label || t('Home', 'বাসা')}
                        </span>
                        {def.fullAddress || ''}
                        {def.upazila ? `, ${def.upazila}` : ''}
                        {def.district ? `, ${def.district}` : ''}
                        {def.division ? `, ${def.division}` : ''}
                        {def.phone ? <span className="text-gray-500 font-normal ml-2 font-mono text-xs">📞 {def.phone}</span> : null}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const idx = user.addresses!.findIndex(a => a.id === def.id || a === def);
                          setEditingAddressIdx(idx >= 0 ? idx : 0);
                          setAddressData({
                            fullName: def.fullName || user.name || '',
                            phone: def.phone || user.phone || '',
                            division: def.division || '',
                            district: def.district || '',
                            upazila: def.upazila || '',
                            fullAddress: def.fullAddress || '',
                            isDefault: Boolean(def.isDefault),
                            label: def.label || 'Home'
                          });
                          setShowAddressModal(true);
                        }}
                        className="text-[11px] font-bold text-gray-600 hover:text-brand-orange hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 size={11} /> {t('Change Address', 'ঠিকানা পরিবর্তন')}
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-gray-400 italic font-sans font-normal text-xs">
                    {t('No shipping address configured yet', 'কোনো ডেলিভারি ঠিকানা এখনো যুক্ত করা হয়নি')}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingAddressIdx(null);
                      setAddressData({
                        fullName: user?.name || '',
                        phone: user?.phone || '',
                        division: '',
                        district: '',
                        upazila: '',
                        fullAddress: '',
                        isDefault: true,
                        label: 'Home'
                      });
                      setShowAddressModal(true);
                    }}
                    className="text-xs font-bold text-brand-orange hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={13} /> {t('Add New Address', 'নতুন ঠিকানা যোগ করুন')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Shop & Storefront Showcase Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100/90 mb-8 relative overflow-hidden transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-brand-orange shrink-0">
              <Store size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                  {t('My Storefront', 'আমার শপ')}
                </h3>
                {user?.shop && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider font-mono ${
                    user.shop.status === 'approved' || user.shop.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : user.shop.status === 'pending'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {user.shop.status === 'approved' || user.shop.status === 'active' 
                      ? t('🟢 Active Store', '🟢 সচল শপ') 
                      : user.shop.status === 'pending' 
                      ? t('🟡 Under Review', '🟡 পর্যালোচনায়') 
                      : t('🔴 Needs Update', '🔴 সংশোধন প্রয়োজন')}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {t('Your online store details, location, and product catalog', 'আপনার অনলাইন শপের সকল বিবরণ, অবস্থান ও পণ্য তালিকা')}
              </p>
            </div>
          </div>

          {user?.shop ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('shop');
                  handleEditShop();
                }}
                className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs rounded-xl border border-gray-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Edit2 size={13} />
                <span>{t('Edit Shop Info', 'শপের তথ্য এডিট')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('shop')}
                className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>{t('Shop Dashboard', 'শপ ড্যাশবোর্ড')}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActiveTab('shop');
                setIsEditingShop(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-brand-orange to-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Sparkles size={14} />
              <span>{t('Launch Store', 'দোকান চালু করুন')}</span>
            </button>
          )}
        </div>

        {user?.shop ? (
          <div className="space-y-6">
            {/* Store Banner & Brand Header */}
            <div className="relative rounded-2xl overflow-hidden aspect-[21/6] sm:aspect-[21/5] bg-gray-900 shadow-inner">
              <img 
                src={user.shop.banner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=85&w=1200"} 
                className="w-full h-full object-cover opacity-75"
                alt={user.shop.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-5 right-3 sm:right-5 flex items-end justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-white/90 shadow-xl bg-white shrink-0">
                    <img 
                      src={user.shop.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${user.shop.name}`} 
                      className="w-full h-full object-cover" 
                      alt="Shop Logo" 
                    />
                  </div>
                  <div className="min-w-0 text-white">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h4 className="text-base sm:text-xl font-black truncate">{user.shop.name}</h4>
                      {(user.shop.isVerified || user.shop.verified || isAdmin) && (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 shadow">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-white/80 truncate">
                      {t('Owner', 'মালিক')}: {user.shop.ownerName || user.name} • {user.shop.category || t('General Store', 'জেনারেল স্টোর')}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-lg">
                    ⭐ {user.shop.rating || 5.0} {t('Rating', 'রেটিং')}
                  </span>
                  <span className="text-[10px] font-bold bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-lg">
                    👥 {(user.shop.followers || 0).toLocaleString()} {t('Followers', 'ফলোয়ার')}
                  </span>
                </div>
              </div>
            </div>

            {/* Shop Details Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t('Contact Number', 'যোগাযোগের নম্বর')}
                </span>
                <p className="text-xs font-bold text-gray-900 font-mono">
                  {user.shop.contactNumber || user.phone || t('Not provided', 'যুক্ত করা হয়নি')}
                </p>
              </div>

              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t('Shop Location', 'শপের অবস্থান')}
                </span>
                <p className="text-xs font-bold text-gray-900 truncate" title={user.shop.fullAddress}>
                  {[user.shop.upazila, user.shop.district, user.shop.division].filter(Boolean).join(', ') || user.shop.fullAddress || t('Not provided', 'যুক্ত করা হয়নি')}
                </p>
              </div>

              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t('Listed Products', 'শপে পণ্য সংখ্যা')}
                </span>
                <p className="text-xs font-bold text-brand-orange">
                  {t(`${myProducts.length} products listed`, `${myProducts.length} টি পণ্য তালিকাভুক্ত`)}
                </p>
              </div>

              <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  {t('Shop Created', 'শপ প্রতিষ্ঠার তারিখ')}
                </span>
                <p className="text-xs font-bold text-gray-900">
                  {formatDate(user?.shop?.joinedAt, undefined, dateLocale)}
                </p>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('shop');
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Plus size={14} />
                  <span>{t('Add New Product', 'নতুন প্রোডাক্ট যোগ করুন')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('shop')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Package size={14} />
                  <span>{t(`View My Products (${myProducts.length})`, `আমার পণ্যসমূহ দেখুন (${myProducts.length})`)}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('shop');
                  handleEditShop();
                }}
                className="text-xs font-bold text-brand-orange hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{t('Manage Full Shop Profile', 'সম্পূর্ণ শপ প্রোফাইল পরিচালনা করুন')}</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-orange-50/60 to-amber-50/40 p-6 rounded-2xl border border-orange-200/60 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center sm:text-left">
              <h4 className="text-base font-black text-gray-900">
                {t(`Launch Your Online Store on ${siteConfig?.siteName || 'Digital Shop T.M'}`, `${siteConfig?.siteName || 'Digital Shop T.M'}-এ আপনার অনলাইন দোকান চালু করুন`)}
              </h4>
              <p className="text-xs text-gray-600 max-w-xl leading-relaxed">
                {t(
                  'Do you run a physical or online business? Join us and sell directly to customers nationwide.',
                  'আপনার কি কোনো ফিজিক্যাল বা অনলাইন ব্যবসা রয়েছে? আমাদের সাথে যোগ দিয়ে সারাদেশের লক্ষাধিক ক্রেতার কাছে সরাসরি পণ্য বিক্রি করুন।'
                )}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-bold text-gray-500">
                <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-500" /> {t('Easy Product Listing', 'সহজ প্রোডাক্ট লিস্টিং')}</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-500" /> {t('Nationwide Delivery Support', 'সারাদেশে ডেলিভারি সাপোর্ট')}</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={13} className="text-emerald-500" /> {t('Secure Payment Settlement', 'নিরাপদ পেমেন্ট সেটেলমেন্ট')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('shop');
                setIsEditingShop(true);
              }}
              className="px-6 py-3.5 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/25 shrink-0 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Store size={16} />
              <span>{t('Create My Shop', 'আমার শপ তৈরি করুন')}</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            onClick={() => setActiveTab(stat.tab)}
            className="bg-white p-5 rounded-3xl shadow-sm hover:shadow-md border border-gray-100/90 flex flex-col justify-between cursor-pointer transition-all duration-300 group hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{stat.label}</span>
              <div className={`w-10 h-10 ${stat.color} text-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                {stat.icon}
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h4 className="text-2xl md:text-3xl font-black text-gray-900">{stat.value}</h4>
              <span className="text-[10px] font-bold text-gray-400 group-hover:text-brand-orange flex items-center gap-0.5 transition-colors">
                {t('View', 'দেখুন')} <ChevronRight size={12} />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100/90">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{t('Recent Activity', 'সাম্প্রতিক কার্যক্রম')}</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{t('Your latest orders and purchase history', 'আপনার সাম্প্রতিক অর্ডার ও কেনাকাটার ইতিহাস')}</p>
          </div>
          <button 
            onClick={() => setActiveTab('orders')} 
            className="text-xs font-bold text-brand-orange flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            <span>{t('View All', 'সব দেখুন')}</span>
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="space-y-3">
          {(orders || []).filter(o => !o.isDeleted).slice(0, 5).map((order) => (
             <div 
               key={order.id} 
               onClick={() => setSelectedOrder(order)}
               className="p-4 md:p-5 border border-gray-100/90 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-brand-orange/40 hover:bg-orange-50/20 transition-all duration-200 cursor-pointer group"
             >
                <div className="flex items-center gap-3.5">
                   <div className="w-11 h-11 bg-gray-50 group-hover:bg-orange-100/60 rounded-xl flex items-center justify-center text-gray-500 group-hover:text-brand-orange transition-colors">
                     <Package size={20} />
                   </div>
                   <div>
                     <p className="text-xs font-bold text-gray-900">{t('ORDER', 'অর্ডার')} #{order.id}</p>
                     <p className="text-[10px] text-gray-400 font-semibold">{formatDate(order.createdAt, undefined, dateLocale)}</p>
                   </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6">
                   <div className="text-left md:text-right">
                      <p className="text-sm font-black text-brand-orange">৳{order.total.toLocaleString()}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <div className={`w-2 h-2 rounded-full ${order.status === 'delivered' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{order.status}</span>
                      </div>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-brand-orange group-hover:text-white text-gray-400 flex items-center justify-center transition-all">
                     <ChevronRight size={16} />
                   </div>
                </div>
             </div>
          ))}
          {(orders || []).filter(o => !o.isDeleted).length === 0 && (
            <div className="py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-gray-300 shadow-sm border border-gray-100">
                <Package size={28} strokeWidth={1.5} />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">{t('No Orders Yet', 'এখনো কোনো অর্ডার নেই')}</h4>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed mb-4">
                {t("You haven't placed any orders yet. Discover our curated collections and place your first order.", 'আপনি এখনো কোনো অর্ডার করেননি। আমাদের পণ্যসমূহ দেখুন এবং প্রথম অর্ডার করুন।')}
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all"
              >
                {t('Start Shopping', 'কেনাকাটা শুরু করুন')}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );

  const renderOrders = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t('Order History', 'অর্ডার তালিকা')}</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Track and manage your orders', 'আপনার অর্ডারগুলো ট্র্যাক ও পরিচালনা করুন')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-orange transition-colors" size={16} />
            <input 
              type="text" 
              placeholder={t('Search Order ID or Product...', 'অর্ডার আইডি বা পণ্য খুঁজুন...')}
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="pl-11 pr-6 py-3.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-orange/10 transition-all min-w-[280px]"
            />
          </div>
          <div className="relative group">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-11 pr-10 py-3.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-brand-orange/10 cursor-pointer transition-all min-w-[160px]"
            >
              <option value="all">{t('All Status', 'সব স্ট্যাটাস')}</option>
              <option value="pending">{t('Pending', 'পেন্ডিং')}</option>
              <option value="confirmed">{t('Confirmed', 'নিশ্চিত')}</option>
              <option value="processing">{t('Processing', 'প্রক্রিয়াধীন')}</option>
              <option value="shipped">{t('Shipped', 'শিপড')}</option>
              <option value="delivered">{t('Delivered', 'ডেলিভারড')}</option>
              <option value="cancelled">{t('Cancelled', 'বাতিল')}</option>
            </select>
            <ListFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {(orders || [])
          .filter(order => !order?.isDeleted)
          .filter(order => {
            const matchesSearch = order?.id?.toLowerCase().includes(orderSearch.toLowerCase()) || 
              order?.items?.some(item => item?.name?.toLowerCase().includes(orderSearch.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || order?.status === statusFilter;
            return matchesSearch && matchesStatus;
          })
          .map((order) => (
          <motion.div 
            layout
            key={order.id} 
            className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 hover:border-brand-orange/20 hover:shadow-xl hover:shadow-orange-100/30 transition-all space-y-8 group"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-gray-50">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-900 shadow-inner group-hover:scale-110 transition-transform">
                    <Package size={32} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                     <div className="flex items-center gap-2">
                      <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest">{t('Order Recorded', 'অর্ডার নথিভুক্ত')}</p>
                      <span className="w-1 h-1 bg-gray-200 rounded-full" />
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formatDate(order.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }, dateLocale)}</p>
                     </div>
                     <h4 className="text-xl font-black text-gray-900 tracking-tight">{t('ORDER', 'অর্ডার')} #{order.id}</h4>
                  </div>
               </div>
               <div className="flex flex-wrap items-center gap-3">
                  {order.cancellationRequested && (
                    <div className="px-3.5 py-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 text-[10px] font-black uppercase tracking-wider font-mono">
                      {t('Cancellation Requested', 'বাতিলের অনুরোধ পাঠানো হয়েছে')}
                    </div>
                  )}
                  {['pending', 'processing', 'confirmed'].includes(order.status?.toLowerCase()) && !order.cancellationRequested && (
                    <button 
                      type="button"
                      onClick={() => {
                        setCancelModalReason('');
                        setCancelModalOrderId(order.id);
                      }}
                      className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-200/60 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xs cursor-pointer"
                    >
                      {t('Request Cancellation', 'বাতিলের অনুরোধ')}
                    </button>
                  )}
                  <div className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                    order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 
                    order.status === 'cancelled' ? 'bg-rose-50 text-rose-500' :
                    'bg-orange-50 text-brand-orange'
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      order.status === 'delivered' ? 'bg-emerald-500' : 
                      order.status === 'cancelled' ? 'bg-rose-500' :
                      'bg-brand-orange'
                    }`} />
                    {order.status}
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="px-8 py-2.5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:scale-105 transition-all shadow-lg shadow-gray-200"
                  >
                    {t('View Details', 'বিস্তারিত দেখুন')}
                  </button>
                  {(order.status === 'delivered' || order.status === 'cancelled') && (
                    <button 
                      onClick={() => handleReorder(order)}
                      className="p-2.5 bg-orange-50 text-brand-orange rounded-2xl hover:bg-brand-orange hover:text-white transition-all shadow-sm"
                      title={t('Reorder', 'পুনরায় অর্ডার')}
                    >
                      <RotateCcw size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => navigate('/invoice/' + order.id)}
                    className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 hover:text-gray-900 transition-all shadow-sm"
                    title={t('Invoice', 'ইনভয়েস')}
                  >
                    <FileText size={18} />
                  </button>
                  <button 
                    onClick={() => setConfirmDelete(order.id)}
                    className="p-2.5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    title={t('Move to Trash', 'ট্র্যাশে সরান')}
                  >
                    <Trash2 size={18} />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <div className="space-y-4">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <ShoppingCart size={12} /> {t('Package Items', 'প্যাকেজের পণ্য')}
                  </p>
                  <div className="flex -space-x-4 overflow-hidden py-1">
                    {order.items.map((item, idx) => (
                      <div key={item.id ? `${item.id}-${idx}` : `pkg-${idx}`} className="w-14 h-14 rounded-2xl border-4 border-white bg-gray-50 overflow-hidden shadow-md">
                        <img src={item.image} className="w-full h-full object-cover" alt={item.name || 'Order item thumbnail'} title={item.name} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-600 font-bold uppercase">{order.items[0].name.slice(0, 30)}...</p>
               </div>

               <div className="space-y-4">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <Truck size={12} /> {t('Delivery Details', 'ডেলিভারি তথ্য')}
                  </p>
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{t('Courier', 'কুরিয়ার')}</span>
                      <span className="text-[9px] font-black text-gray-900 uppercase">{t('Express Logistics', 'এক্সপ্রেস লজিস্টিকস')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{t('Estimated', 'সম্ভাব্য সময়')}</span>
                      <span className="text-[9px] font-black text-emerald-500 uppercase">
                        {order.status === 'delivered' ? t('Delivered', 'পৌঁছে গেছে') : t('48-72h Average', '৪৮-৭২ ঘণ্টা')}
                      </span>
                    </div>
                  </div>
               </div>

               <div className="space-y-4 md:col-span-2 lg:col-span-1">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <CreditCard size={12} /> {t('Payment Summary', 'পেমেন্ট তথ্য')}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{t('Total Amount', 'মোট মূল্য')}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{t('Via', 'মাধ্যম:')} {order.paymentMethod}</p>
                    </div>
                    <p className="text-2xl font-black text-brand-orange tracking-tight">৳{order.total.toLocaleString()}</p>
                  </div>
               </div>
            </div>
          </motion.div>
        ))}
        {(orders?.length || 0) === 0 && (
          <div className="bg-white rounded-[40px] p-32 shadow-sm border border-gray-100 text-center animate-in fade-in zoom-in duration-700">
             <div className="w-32 h-32 bg-gray-50 rounded-[48px] flex items-center justify-center mx-auto mb-10 text-gray-200 shadow-inner group-hover:rotate-12 transition-transform">
                <Package size={64} strokeWidth={1} />
             </div>
             <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
               {t('No Orders Placed Yet', 'কোনো অর্ডার নেই')}
             </h3>
             <p className="text-xs text-gray-400 font-medium mb-8 max-w-sm mx-auto leading-relaxed">
               {t("You haven't placed any orders yet. Discover our latest collections and start shopping!", 'আপনি এখনো কোনো অর্ডার করেননি। আমাদের নতুন কালেকশন দেখুন এবং কেনাকাটা শুরু করুন!')}
             </p>
             <button 
              type="button"
              onClick={() => navigate('/')} 
              className="px-10 py-4 bg-brand-orange hover:bg-brand-orange-light text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
             >
               {t('Start Shopping', 'কেনাকাটা শুরু করুন')}
             </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderTrash = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t('Trash Bin', 'ট্র্যাশ বিন')}</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Manage and restore deleted order records', 'মুছে ফেলা অর্ডারের তথ্য পরিচালনা ও পুনরুদ্ধার করুন')}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setConfirmBulkRestore(true)}
            className="flex items-center gap-2 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
          >
            <RotateCcw size={16} /> {t('Restore All', 'সব পুনরুদ্ধার')}
          </button>
          <button 
            onClick={() => setConfirmBulkDelete(true)}
            className="flex items-center gap-2 px-6 py-4 bg-rose-50 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
          >
            <Trash2 size={16} /> {t('Empty Trash', 'ট্র্যাশ খালি করুন')}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {(orders || []).filter(o => o?.isDeleted).map((order) => (
          <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            key={order.id} 
            className="bg-white rounded-[40px] p-8 md:p-10 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-100/50 transition-all group"
          >
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-gray-50">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 shadow-inner group-hover:bg-rose-50 group-hover:text-rose-500 transition-colors">
                     <Trash2 size={28} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-gray-900 tracking-tight uppercase">{t('ORDER', 'অর্ডার')} #{order.id}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Deleted on', 'মুছে ফেলা হয়েছে')} {new Date().toLocaleDateString(dateLocale)}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleRestore(order.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                  >
                    <RotateCcw size={14} /> {t('Restore', 'পুনরুদ্ধার')}
                  </button>
                  <button 
                    onClick={() => handlePermanentDelete(order.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <Trash2 size={14} /> {t('Delete Forever', 'স্থায়ীভাবে মুছুন')}
                  </button>
               </div>
             </div>
             
             <div className="flex flex-wrap items-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                   <Package size={14} /> {(order.items?.length || 0)} {t('Items', 'টি পণ্য')}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                   <CreditCard size={14} /> ৳{order.total.toLocaleString()}
                </div>
                <div className="ml-auto text-rose-300 italic">{t('Ready for permanent removal', 'স্থায়ীভাবে মুছে ফেলার জন্য প্রস্তুত')}</div>
             </div>
          </motion.div>
        ))}
        {(orders || []).filter(o => o?.isDeleted).length === 0 && (
          <div className="bg-white rounded-[44px] p-32 shadow-sm border border-gray-100 text-center">
             <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mx-auto mb-10 text-gray-200">
                <Trash2 size={48} strokeWidth={1} />
             </div>
             <h4 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">{t('Trash Bin is Clear', 'ট্র্যাশ বিন খালি')}</h4>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] max-w-xs mx-auto italic leading-relaxed">
               {t('Your trash bin is empty. No deleted orders are currently stored.', 'আপনার ট্র্যাশ বিন সম্পূর্ণ খালি। কোনো মুছে ফেলা অর্ডার নেই।')}
             </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderWishlist = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{t('Saved Favourites', 'পছন্দের তালিকা')}</h2>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Your personal collection of favourite products', 'আপনার সংরক্ষিত পছন্দের পণ্যসমূহ')}</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {wishlistProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-50 group transition-all hover:bg-orange-50/20 hover:border-orange-100">
             <div className="relative aspect-square rounded-[24px] overflow-hidden mb-4">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <button 
                  onClick={() => handleRemoveWishlist(product.id)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm text-rose-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-500 hover:text-white transition-all"
                >
                   <Trash2 size={16} />
                </button>
             </div>
             <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight mb-1 line-clamp-1">{product.name}</h4>
             <div className="flex items-center justify-between">
                <p className="text-sm font-black text-brand-orange">৳{Math.round(product.price).toLocaleString()}</p>
                <button 
                  onClick={() => handleMoveToCart(product)}
                  className="p-2 bg-gray-900 text-white rounded-lg hover:scale-110 transition-all flex items-center gap-2"
                >
                   <ShoppingCart size={14} />
                </button>
             </div>
          </div>
        ))}
        {(wishlistProducts?.length || 0) === 0 && (
          <div className="col-span-full bg-white rounded-[40px] p-32 shadow-sm border border-gray-100 text-center">
             <div className="relative w-32 h-32 mx-auto mb-10">
                <div className="absolute inset-0 bg-rose-50 rounded-[48px] animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center text-rose-200">
                  <Heart size={64} strokeWidth={1} />
                </div>
             </div>
             <h4 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mb-3">
               {t('Your Wishlist is Empty', 'পছন্দের তালিকা খালি')}
             </h4>
             <p className="text-xs text-gray-400 font-medium max-w-sm mx-auto leading-relaxed mb-8">
               {t('Save your favorite products to keep track of prices, discounts, and availability.', 'দাম, ডিসকাউন্ট ও স্টক সম্পর্কে জানতে আপনার পছন্দের পণ্য সংরক্ষণ করুন।')}
             </p>
             <button 
              type="button"
              onClick={() => navigate('/')}
              className="px-10 py-4 bg-brand-orange hover:bg-brand-orange-light text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-xl shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
             >
               {t('Explore Products', 'পণ্য দেখুন')}
             </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderAddresses = () => {
    const addressList = user?.addresses || [];
    const defaultAddress = addressList.find(a => a.isDefault);

    return (
      <div className="space-y-8">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-gray-100/80 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">{t('Saved Addresses', 'সংরক্ষিত ঠিকানা')}</h2>
              <span className="px-3 py-1 bg-orange-50 text-brand-orange border border-orange-100 rounded-full text-[10px] font-black uppercase tracking-wider">
                {addressList.length} {addressList.length === 1 ? t('Location', 'টি ঠিকানা') : t('Locations', 'টি ঠিকানা')}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-1">
              {t('Manage your delivery destinations and primary shipping base for express checkout', 'দ্রুত চেকআউটের জন্য আপনার ডেলিভারি ঠিকানা এবং প্রাথমিক শিপিং ঠিকানা পরিচালনা করুন')}
            </p>
          </div>
          <button 
            onClick={() => {
              setEditingAddressIdx(null);
              setAddressData({ 
                fullName: user?.name || '', 
                phone: user?.phone || '', 
                division: '', 
                district: '', 
                upazila: '', 
                fullAddress: '',
                isDefault: addressList.length === 0,
                label: 'Home'
              });
              setShowAddressModal(true);
            }}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-brand-orange hover:bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 shrink-0"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>{t('New Address', 'নতুন ঠিকানা')}</span>
          </button>
        </div>

        {/* Quick Delivery Metrics / Reassurance Strip to balance layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
              <MapPin size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('Primary Base', 'প্রাথমিক ঠিকানা')}</p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {defaultAddress ? `${defaultAddress.fullName} (${defaultAddress.label === 'Office' ? t('Office', 'অফিস') : defaultAddress.label === 'Other' ? t('Other', 'অন্যান্য') : t('Home', 'বাসা')})` : t('No Default Set', 'ডিফল্ট ঠিকানা সেট করা নেই')}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Truck size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('Coverage Matrix', 'ডেলিভারি কভারেজ')}</p>
              <p className="text-sm font-bold text-gray-900 truncate">{t('64 Districts Active', '৬৪ জেলায় ডেলিভারি চালু')}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={22} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('Doorstep Protocol', 'ডোরস্টেপ সেবা')}</p>
              <p className="text-sm font-bold text-gray-900 truncate">{t('Verified Safe Delivery', 'যাচাইকৃত নিরাপদ ডেলিভারি')}</p>
            </div>
          </div>
        </div>

        {/* Address Cards or Empty State */}
        {addressList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {addressList.map((addr, idx) => {
              const labelType = addr.label || 'Home';
              const localizedLabel = labelType === 'Home' ? t('Home', 'বাসা') : labelType === 'Office' ? t('Office', 'অফিস') : t('Other', 'অন্যান্য');
              const districtObj = (DISTRICTS[addr.division] || []).find(d => d.id === addr.district);
              const districtName = (language === 'bn' && districtObj?.bn_name ? districtObj.bn_name : districtObj?.name) || addr.district;
              const upazilaObj = getUpazilasForDistrict(addr.district).find(u => u.id === addr.upazila);
              const upazilaName = (language === 'bn' && upazilaObj?.bn_name ? upazilaObj.bn_name : upazilaObj?.name) || addr.upazila;
              const divisionObj = DIVISIONS.find(v => v.id === addr.division);
              const divisionName = (language === 'bn' && divisionObj?.bn_name ? divisionObj.bn_name : divisionObj?.name) || addr.division;

              return (
                <motion.div 
                  key={addr.id || idx} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                  className={`bg-white p-7 rounded-3xl border transition-all duration-300 relative group flex flex-col justify-between hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/50 ${
                    addr.isDefault 
                      ? 'border-brand-orange/60 ring-2 ring-brand-orange/15 shadow-sm' 
                      : 'border-gray-100/90 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Top Row: Label badge & Actions */}
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Label Pill */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                          labelType === 'Home' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          labelType === 'Office' 
                            ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                            'bg-orange-50 text-brand-orange border border-orange-100'
                        }`}>
                          {labelType === 'Home' ? <Home size={13} strokeWidth={2.2} /> :
                           labelType === 'Office' ? <Briefcase size={13} strokeWidth={2.2} /> :
                           <MapPin size={13} strokeWidth={2.2} />}
                          <span>{localizedLabel}</span>
                        </span>

                        {/* Default Badge */}
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow-sm">
                            <CheckCircle2 size={11} strokeWidth={2.5} />
                            <span>{t('Default Base', 'ডিফল্ট ঠিকানা')}</span>
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => {
                            setEditingAddressIdx(idx);
                            setAddressData({
                              fullName: addr.fullName,
                              phone: addr.phone,
                              division: addr.division,
                              district: addr.district,
                              upazila: addr.upazila,
                              fullAddress: addr.fullAddress,
                              isDefault: !!addr.isDefault,
                              label: addr.label || 'Home'
                            });
                            setShowAddressModal(true);
                          }}
                          className="w-8 h-8 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-all active:scale-95"
                          title={t('Edit Address', 'ঠিকানা সম্পাদনা করুন')}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteAddress(idx)}
                          className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all active:scale-95"
                          title={t('Delete Address', 'ঠিকানা মুছুন')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Recipient Identity */}
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        {addr.fullName}
                      </h4>
                      <p className="text-xs text-gray-400 font-semibold flex items-center gap-1.5">
                        <span className="text-gray-400">{t('Phone:', 'ফোন:')}</span>
                        <span className="text-gray-700">{addr.phone}</span>
                      </p>
                    </div>

                    {/* Formatted Address Box */}
                    <div className="mt-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-100/70 text-xs text-gray-600 leading-relaxed font-medium space-y-1">
                      <p className="text-gray-900 font-semibold">{addr.fullAddress}</p>
                      <p className="text-gray-500">
                        {[upazilaName, districtName, divisionName].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer / Default Switcher */}
                  <div className="mt-5 pt-4 border-t border-gray-100/80 flex items-center justify-between">
                    {addr.isDefault ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 size={14} strokeWidth={2.5} />
                        <span>{t('Pre-selected for Checkout', 'চেকআউটের জন্য নির্বাচিত')}</span>
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleSetDefaultAddress(idx)}
                        className="text-[11px] font-bold text-gray-400 hover:text-brand-orange flex items-center gap-1.5 transition-colors group/btn"
                      >
                        <span className="group-hover/btn:underline">{t('Set as Default Base', 'ডিফল্ট ঠিকানা হিসেবে সেট করুন')}</span>
                        <ChevronRight size={13} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                    <span className="text-[10px] text-gray-300 font-mono">#{idx + 1}</span>
                  </div>
                </motion.div>
              );
            })}

            {/* Quick Add Card directly in the grid */}
            <motion.div
              onClick={() => {
                setEditingAddressIdx(null);
                setAddressData({ 
                  fullName: user?.name || '', 
                  phone: user?.phone || '', 
                  division: '', 
                  district: '', 
                  upazila: '', 
                  fullAddress: '',
                  isDefault: false,
                  label: 'Home'
                });
                setShowAddressModal(true);
              }}
              className="border-2 border-dashed border-gray-200 hover:border-brand-orange/60 bg-gray-50/40 hover:bg-orange-50/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group hover:-translate-y-1 min-h-[220px]"
            >
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-brand-orange group-hover:scale-110 group-hover:border-brand-orange/30 transition-all mb-3">
                <Plus size={22} strokeWidth={2.5} />
              </div>
              <h4 className="text-sm font-bold text-gray-900 group-hover:text-brand-orange transition-colors">
                {t('Add Another Destination', 'নতুন আরেকটি ঠিকানা যোগ করুন')}
              </h4>
              <p className="text-xs text-gray-400 mt-1 max-w-xs">
                {t('Save an office, alternate flat, or shipping address for loved ones', 'অফিস, বিকল্প বাসা বা প্রিয়জনের ডেলিভারি ঠিকানা সংরক্ষণ করুন')}
              </p>
            </motion.div>
          </div>
        ) : (
          /* Empty State Illustration with proper rhythm and vertical balance */
          <div className="bg-white rounded-3xl p-10 md:p-14 border border-gray-100/90 shadow-sm text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
            {/* Friendly location/map-pin graphic */}
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-100 via-amber-50 to-orange-50 border border-orange-200/60 flex items-center justify-center shadow-inner relative group">
                <MapPin size={42} className="text-brand-orange drop-shadow-sm group-hover:scale-110 transition-transform duration-300" strokeWidth={1.8} />
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                  <Sparkles size={12} className="text-white fill-white" />
                </div>
              </div>
              <div className="w-16 h-2 rounded-full bg-gray-200/60 mx-auto mt-3 blur-xs" />
            </div>

            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
              {t('No Addresses Saved Yet', 'এখনো কোনো ঠিকানা সংরক্ষিত নেই')}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed mb-8">
              {t('Add your home, office, or favorite delivery destinations to unlock instant one-tap checkout, accurate courier rates, and live doorstep tracking.', 'এক-ক্লিকে দ্রুত চেকআউট, সঠিক কুরিয়ার চার্জ এবং লাইভ ডেলিভারি ট্র্যাকিং পেতে আপনার বাসা, অফিস বা পছন্দের ডেলিভারি ঠিকানা যোগ করুন।')}
            </p>

            <button 
              onClick={() => {
                setEditingAddressIdx(null);
                setAddressData({ 
                  fullName: user?.name || '', 
                  phone: user?.phone || '', 
                  division: '', 
                  district: '', 
                  upazila: '', 
                  fullAddress: '',
                  isDefault: true,
                  label: 'Home'
                });
                setShowAddressModal(true);
              }}
              className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>{t('Add Your First Address', 'আপনার প্রথম ঠিকানা যোগ করুন')}</span>
            </button>
          </div>
        )}

        {/* Supporting Delivery Information & Guidelines Card */}
        <div className="bg-gradient-to-r from-gray-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-800">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 text-brand-orange text-xs font-black uppercase tracking-wider">
                <Truck size={16} />
                <span>{t('Express Courier Guarantee', 'এক্সপ্রেস কুরিয়ার গ্যারান্টি')}</span>
              </div>
              <h4 className="text-lg font-bold tracking-tight">{t('Need deliveries to multiple locations?', 'একাধিক ঠিকানায় ডেলিভারি প্রয়োজন?')}</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t('You can save unlimited addresses for Home, Work, and Gifting. Select any saved destination during checkout, and our express couriers handle delivery confirmation via SMS.', 'আপনি বাসা, অফিস ও উপহারের জন্য সীমাহীন ঠিকানা সংরক্ষণ করতে পারেন। চেকআউটের সময় যেকোনো ঠিকানা নির্বাচন করুন, আর আমাদের এক্সপ্রেস কুরিয়ার এসএমএসের মাধ্যমে ডেলিভারি নিশ্চিত করবে।')}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 bg-white/10 rounded-xl text-center border border-white/10">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('Dhaka City', 'ঢাকা শহর')}</p>
                <p className="text-xs font-extrabold text-white mt-0.5">{t('24 - 48 Hours', '২৪ - ৪৮ ঘণ্টা')}</p>
              </div>
              <div className="px-4 py-2.5 bg-white/10 rounded-xl text-center border border-white/10">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('Nationwide', 'সারা বাংলাদেশ')}</p>
                <p className="text-xs font-extrabold text-white mt-0.5">{t('3 - 5 Days', '৩ - ৫ দিন')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    const strength = (passwordData.new.length > 0) ? (
      passwordData.new.length < 6 ? 25 :
      passwordData.new.length < 10 ? 50 :
      passwordData.new.length < 14 ? 75 : 100
    ) : 0;

    const strengthColor = strength <= 25 ? 'bg-rose-500' : strength <= 50 ? 'bg-orange-500' : strength <= 75 ? 'bg-blue-500' : 'bg-emerald-500';

    return (
      <div className="space-y-12">
        <div className="bg-white rounded-[44px] p-10 shadow-sm border border-gray-100">
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-8">{t('Security Matrix', 'সিকিউরিটি সেটিংস')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <form onSubmit={handlePasswordUpdate} className="space-y-8">
              <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                 <Shield size={16} className="text-brand-orange" /> {t('Authentication Protocol', 'পাসওয়ার্ড পরিবর্তন')}
              </h4>
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black p-1 text-gray-400 uppercase tracking-widest">{t('Current Password', 'বর্তমান পাসওয়ার্ড')}</label>
                  <input 
                    type={passwordData.show ? "text" : "password"} 
                    value={passwordData.current}
                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                    placeholder={t('Enter current password', 'বর্তমান পাসওয়ার্ড লিখুন')}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-brand-orange/10 focus:bg-white transition-all font-mono shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('New Password', 'নতুন পাসওয়ার্ড')}</label>
                    <button 
                      type="button"
                      onClick={() => setPasswordData({ ...passwordData, show: !passwordData.show })}
                      className="text-[9px] font-black text-brand-orange uppercase tracking-widest hover:underline"
                    >
                      {passwordData.show ? t('Hide', 'লুকান') : t('Show', 'দেখান')}
                    </button>
                  </div>
                  <input 
                    type={passwordData.show ? "text" : "password"} 
                    value={passwordData.new}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPasswordData({ ...passwordData, new: val });
                      const error = val && val.length < 8 ? t('Password too short', 'পাসওয়ার্ড খুবই ছোট') : '';
                      setErrors(prev => ({ ...prev, new_password: error }));
                    }}
                    placeholder={t('Minimum 8 characters', 'সর্বনিম্ন ৮ অক্ষরের পাসওয়ার্ড')}
                    className={`w-full bg-gray-50 border rounded-2xl p-4 text-sm font-medium outline-none transition-all font-mono shadow-sm ${
                      errors.new_password ? 'border-rose-500 focus:ring-rose-200' : 
                      passwordData.new && !errors.new_password ? 'border-emerald-500 focus:ring-emerald-200' : 
                      'border-gray-100 focus:ring-4 focus:ring-brand-orange/10 focus:bg-white'
                    }`}
                  />
                  {errors.new_password && <p className="text-[8px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.new_password}</p>}
                  {passwordData.new && (
                    <div className="px-2 space-y-1.5">
                      <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                        <span className="text-gray-400">{t('Password Strength', 'পাসওয়ার্ডের শক্তি')}</span>
                        <span className={strength <= 50 ? 'text-rose-500' : 'text-emerald-500'}>
                          {strength <= 25 ? t('Vulnerable', 'অতি দুর্বল') : strength <= 50 ? t('Weak', 'দুর্বল') : strength <= 75 ? t('Secure', 'নিরাপদ') : t('Strong', 'অত্যন্ত শক্তিশালী')}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${strength}%` }}
                          className={`h-full transition-all duration-500 ${strengthColor}`} 
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black p-1 text-gray-400 uppercase tracking-widest">{t('Confirm New Password', 'নতুন পাসওয়ার্ড নিশ্চিত করুন')}</label>
                  <input 
                    type={passwordData.show ? "text" : "password"} 
                    value={passwordData.confirm}
                    onChange={(e) => {
                       const val = e.target.value;
                       setPasswordData({ ...passwordData, confirm: val });
                       const error = val && val !== passwordData.new ? t('Passwords do not match', 'পাসওয়ার্ড মেলেনি') : '';
                       setErrors(prev => ({ ...prev, confirm_password: error }));
                    }}
                    placeholder={t('Confirm new password', 'নতুন পাসওয়ার্ড পুনরায় লিখুন')}
                    className={`w-full bg-gray-50 border rounded-2xl p-4 text-sm font-medium outline-none transition-all font-mono shadow-sm ${
                      errors.confirm_password ? 'border-rose-500 focus:ring-rose-200' : 
                      passwordData.confirm && !errors.confirm_password ? 'border-emerald-500 focus:ring-emerald-200' : 
                      'border-gray-100 focus:ring-4 focus:ring-brand-orange/10 focus:bg-white'
                    }`}
                  />
                  {errors.confirm_password && <p className="text-[8px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.confirm_password}</p>}
                </div>
                <button 
                  type="submit" 
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-200"
                >
                   {t('Update Password', 'পাসওয়ার্ড আপডেট করুন')}
                </button>
              </div>
            </form>
            
            <div className="space-y-10">
              <div className="space-y-6">
                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                   <ShieldCheck size={16} className="text-brand-orange" /> {t('Security Credentials', 'সিকিউরিটি কী')}
                </h4>
                <div className="p-6 bg-orange-50/50 border border-orange-100 rounded-[32px] space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('Active Session Key', 'সক্রিয় সেশন কী')}</p>
                    <p className="text-sm font-mono font-black text-gray-900 tracking-wider bg-white p-3 rounded-xl border border-orange-100/50 shadow-sm">{securitySettings.sessionKey}</p>
                  </div>
                  <button 
                    onClick={handleUpdateSecurityKey}
                    className="w-full py-3 bg-white text-brand-orange border border-orange-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-orange hover:text-white transition-all"
                  >
                     {t('Regenerate Security Key', 'নতুন সিকিউরিটি কী তৈরি করুন')}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                   <Bell size={16} className="text-brand-orange" /> {t('Notification Preferences', 'নোটিফিকেশন সেটিংস')}
                </h4>
                <div className="space-y-3">
                   {[
                     { id: 'orderLogs', label: t('Order Updates', 'অর্ডার আপডেট'), active: securitySettings.orderLogs, statusText: securitySettings.orderLogs ? t('Active', 'চালু') : t('Inactive', 'বন্ধ') },
                     { id: 'marketing', label: t('Promotional Offers', 'অফার ও প্রমোশন'), active: securitySettings.marketing, statusText: securitySettings.marketing ? t('Active', 'চালু') : t('Inactive', 'বন্ধ') },
                     { id: 'identityAlerts', label: t('Security Alerts', 'নিরাপত্তা সতর্কতা'), active: securitySettings.identityAlerts, statusText: securitySettings.identityAlerts ? t('Critical', 'জরুরি') : t('Inactive', 'বন্ধ') }
                   ].map((item) => (
                     <div key={item.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white transition-all group">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{item.label}</span>
                        <div className="flex items-center gap-3">
                           <span className={`text-[8px] font-black uppercase px-2 py-1 rounded transition-all ${!item.active ? 'bg-gray-200 text-gray-500' : 'bg-brand-orange text-white'}`}>{item.statusText}</span>
                           <button 
                            onClick={() => setSecuritySettings({ ...securitySettings, [item.id]: !securitySettings[item.id as keyof typeof securitySettings] })}
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${!item.active ? 'bg-gray-200' : 'bg-brand-orange shadow-lg shadow-orange-100'}`}
                           >
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${!item.active ? 'left-1' : 'left-7'}`} />
                           </button>
                        </div>
                     </div>
                   ))}
                   <div className="pt-2">
                     <LanguageSwitcher variant="drawer" />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-rose-50 rounded-[44px] p-10 border border-rose-100 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-rose-500 pointer-events-none group-hover:scale-110 transition-transform">
             <Trash2 size={120} />
           </div>
           <h3 className="text-2xl font-black text-rose-500 uppercase tracking-tight mb-4 flex items-center gap-3">
              <ShieldAlert size={28} /> {t('Danger Zone', 'বিপজ্জনক অংশ')}
           </h3>
           <p className="text-xs text-rose-400 font-bold uppercase tracking-widest leading-relaxed mb-8 max-w-xl">{t('Permanently erase your entire data profile from the e-commerce system. This operation is irreversible and all transaction history, addresses and user credentials will be purged.', 'সিস্টেম থেকে আপনার সম্পূর্ণ অ্যাকাউন্ট ও ডেটা স্থায়ীভাবে মুছে ফেলুন। এই প্রক্রিয়াটি অপরিবর্তনীয় এবং আপনার সকল অর্ডার ইতিহাস, ঠিকানা ও তথ্য চিরতরে মুছে যাবে।')}</p>
           <button 
            onClick={() => setShowDeleteModal(true)}
            className="px-10 py-5 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-rose-200 hover:bg-rose-600 hover:scale-105 active:scale-95 transition-all"
           >
              {t('Delete My Account', 'অ্যাকাউন্ট ডিলিট করুন')}
           </button>
        </div>
      </div>
    );
  };


  const renderShop = () => {
    const shop = user?.shop;
    
    const filteredMyProducts = myProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(shopSearchTerm.toLowerCase());
      const matchesCategory = shopCategoryFilter === 'all' || p.category === shopCategoryFilter;
      const matchesStatus = shopStatusFilter === 'all' || p.status === shopStatusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

    if (isEditingShop || !shop) {
      return (
        <div className="space-y-8 pb-12">
          <div className="bg-white p-10 rounded-[44px] shadow-2xl border border-orange-100">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-brand-orange text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
                <Store size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                  {!shop ? t('Open My Shop', 'আমার শপ তৈরি করুন') : t('Edit Shop Details', 'শপের তথ্য এডিট করুন')}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  {!shop ? t('Provide information about your online store', 'আপনার অনলাইন স্টোর সংক্রান্ত তথ্য দিন') : t('Update shop name, contact details & banner', 'শপের নাম, যোগাযোগের তথ্য ও ব্যানার আপডেট করুন')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Shop Name', 'শপের নাম')}</label>
                <input 
                  type="text"
                  required
                  value={shopEditData.name || ''}
                  onChange={(e) => setShopEditData({ ...shopEditData, name: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm"
                  placeholder={t('e.g. Digital Tech Store', 'যেমন: ডিজিটাল টেক স্টোর')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Owner Legal Full Name', 'মালিকের পূর্ণ নাম')}</label>
                <input 
                  type="text"
                  required
                  value={shopEditData.ownerName || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const error = val && !validateName(val) ? t('Only letters and spaces', 'শুধুমাত্র অক্ষর এবং স্পেস ব্যবহার করুন') : '';
                    setShopEditData({ ...shopEditData, ownerName: val });
                    setErrors(prev => ({ ...prev, shop_owner: error }));
                  }}
                  className={`w-full bg-gray-50 border-2 h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm ${
                    errors.shop_owner ? 'border-rose-500 focus:border-rose-600' : 
                    shopEditData.ownerName && !errors.shop_owner ? 'border-emerald-500 focus:border-emerald-600' : 
                    'border-gray-50 focus:border-brand-orange focus:bg-white'
                  }`}
                  placeholder={t("Owner's Name", 'মালিকের নাম')}
                />
                {errors.shop_owner && <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.shop_owner}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Market Category', 'শপের ক্যাটাগরি')}</label>
                <select 
                  value={shopEditData.category || ''}
                  onChange={(e) => setShopEditData({ ...shopEditData, category: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 px-5 rounded-2xl outline-none transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                >
                  <option value="Electronics">{t('Electronics', 'ইলেকট্রনিক্স')}</option>
                  <option value="Fashion">{t('Fashion', 'ফ্যাশন')}</option>
                  <option value="Lifestyle">{t('Lifestyle', 'লাইফস্টাইল')}</option>
                  <option value="Home & Living">{t('Home & Living', 'হোম ও লিভিং')}</option>
                  <option value="Multipurpose">{t('Multipurpose', 'বহুমুখী')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Business Email', 'ব্যবসায়িক ইমেইল')}</label>
                <input 
                  type="email"
                  required
                  value={shopEditData.email || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const error = val && !validateEmail(val) ? t('Invalid email format', 'সঠিক ইমেইল ফরম্যাট দিন') : '';
                    setShopEditData({ ...shopEditData, email: val });
                    setErrors(prev => ({ ...prev, shop_email: error }));
                  }}
                  className={`w-full bg-gray-50 border-2 h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm ${
                    errors.shop_email ? 'border-rose-500 focus:border-rose-600' : 
                    shopEditData.email && !errors.shop_email ? 'border-emerald-500 focus:border-emerald-600' : 
                    'border-gray-50 focus:border-brand-orange focus:bg-white'
                  }`}
                  placeholder="shop@example.com"
                />
                {errors.shop_email && <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.shop_email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Contact Phone', 'যোগাযোগের ফোন নম্বর')}</label>
                <input 
                  type="tel"
                  inputMode="tel"
                  required
                  value={shopEditData.contactNumber || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d+]/g, '').replace(/\s/g, '');
                    let finalVal = val;
                    if (val.startsWith('+')) finalVal = val.slice(0, 14);
                    else if (val.startsWith('88')) finalVal = val.slice(0, 13);
                    else finalVal = val.slice(0, 11);
                    
                    const error = finalVal && !validatePhone(finalVal) ? t('Enter a valid Bangladeshi phone number', 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন') : '';
                    setShopEditData({ ...shopEditData, contactNumber: finalVal });
                    setErrors(prev => ({ ...prev, shop_phone: error }));
                  }}
                  className={`w-full bg-gray-50 border-2 h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm ${
                    errors.shop_phone ? 'border-rose-500 focus:border-rose-600' : 
                    shopEditData.contactNumber && !errors.shop_phone ? 'border-emerald-500 focus:border-emerald-600' : 
                    'border-gray-50 focus:border-brand-orange focus:bg-white'
                  }`}
                  placeholder="017XXXXXXXX"
                />
                {errors.shop_phone && <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.shop_phone}</p>}
              </div>

              <div className="space-y-2">
                <SearchableSelect 
                  label={t('Division', 'বিভাগ')}
                  placeholder={t('Select Division', 'বিভাগ নির্বাচন করুন')}
                  value={shopEditData.division || ''}
                  options={DIVISIONS}
                  onChange={(val) => setShopEditData({ ...shopEditData, division: val, district: '', upazila: '' })}
                />
              </div>

              <div className="space-y-2">
                <SearchableSelect 
                  label={t('District', 'জেলা')}
                  placeholder={t('Select District', 'জেলা নির্বাচন করুন')}
                  disabled={!shopEditData.division}
                  value={shopEditData.district || ''}
                  options={DISTRICTS[shopEditData.division] || []}
                  onChange={(val) => setShopEditData({ ...shopEditData, district: val, upazila: '' })}
                />
              </div>

              <div className="space-y-2">
                <SearchableSelect 
                  label={t('Upazila', 'উপজেলা')}
                  placeholder={t('Select Upazila', 'উপজেলা নির্বাচন করুন')}
                  disabled={!shopEditData.district}
                  value={shopEditData.upazila || ''}
                  options={getUpazilasForDistrict(shopEditData.district)}
                  onChange={(val) => setShopEditData({ ...shopEditData, upazila: val })}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Full Physical Address', 'সম্পূর্ণ ঠিকানা')}</label>
                <input 
                  type="text"
                  required
                  value={shopEditData.fullAddress || ''}
                  onChange={(e) => setShopEditData({ ...shopEditData, fullAddress: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm"
                  placeholder={t('Street address, house number, etc.', 'রাস্তা, বাসা/দোকান নম্বর ইত্যাদি')}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Store Description', 'শপের বিবরণ')}</label>
                <textarea 
                  value={shopEditData.description || ''}
                  onChange={(e) => setShopEditData({ ...shopEditData, description: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-32 p-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm resize-none"
                  placeholder={t('Tell customers about your store and products...', 'ক্রেতাদের আপনার শপ ও পণ্য সম্পর্কে জানান...')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('National ID (NID)', 'জাতীয় পরিচয়পত্র (NID)')}</label>
                <input 
                  type="text"
                  required
                  value={shopEditData.nid || ''}
                  onChange={(e) => setShopEditData({ ...shopEditData, nid: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm font-mono"
                  placeholder={t('NID Number (Required)', 'NID নম্বর (আবশ্যক)')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Trade License Number (Optional)', 'ট্রেড লাইসেন্স নম্বর (ঐচ্ছিক)')}</label>
                <input 
                  type="text"
                  value={shopEditData.tradeLicense || ''}
                  onChange={(e) => setShopEditData({ ...shopEditData, tradeLicense: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm font-mono"
                  placeholder={t('License Number', 'লাইসেন্স নম্বর')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:col-span-2">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Shop Logo', 'শপ লোগো')}</label>
                  <div 
                    className="relative group cursor-pointer w-full h-40 bg-gray-50 rounded-[32px] overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-100 hover:border-brand-orange transition-colors"
                    onClick={() => shopLogoInputRef.current?.click()}
                  >
                    {isUploading === 'shopLogo' ? (
                      <Loader2 className="animate-spin text-brand-orange" size={24} />
                    ) : (
                      <>
                        <img 
                          src={shopEditData.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`} 
                          className="w-24 h-24 rounded-2xl object-cover shadow-xl"
                          alt="Logo Preview"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={20} className="text-white" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Shop Banner (Max 10MB)', 'শপ ব্যানার (সর্বোচ্চ ১০ মেগাবাইট)')}</label>
                  <div 
                    className="relative group cursor-pointer w-full h-40 bg-gray-50 rounded-[32px] overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-100 hover:border-brand-orange transition-colors"
                    onClick={() => shopBannerInputRef.current?.click()}
                  >
                    {isUploading === 'shopBanner' ? (
                      <Loader2 className="animate-spin text-brand-orange" size={24} />
                    ) : (
                      <>
                        {shopEditData.banner ? (
                          <img src={shopEditData.banner} className="w-full h-full object-cover" alt="Banner Preview" />
                        ) : (
                          <ImageIcon size={32} className="text-gray-300" />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={20} className="text-white" />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Logo URL (Optional if uploaded)', 'লোগো লিংক (আপলোড করলে প্রয়োজন নেই)')}</label>
                <input 
                  type="text"
                  value={shopEditData.logo || ''}
                  onChange={(e) => setShopEditData({ ...shopEditData, logo: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm"
                  placeholder="https://images.unsplash.com/logo..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 p-1">{t('Banner URL (Optional if uploaded)', 'ব্যানার লিংক (আপলোড করলে প্রয়োজন নেই)')}</label>
                <input 
                  type="text"
                  value={shopEditData.banner || ''}
                  onChange={(e) => setShopEditData({ ...shopEditData, banner: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 px-5 rounded-2xl outline-none transition-all text-sm font-bold shadow-sm"
                  placeholder="https://images.unsplash.com/banner..."
                />
              </div>

              <div className="md:col-span-2 flex gap-4 pt-6">
                <button 
                  onClick={handleSaveShop}
                  disabled={!!errors.shop_phone || !!errors.shop_email || !!errors.shop_owner}
                  className={`flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                    (!errors.shop_phone && !errors.shop_email && !errors.shop_owner)
                    ? 'bg-brand-orange text-white shadow-orange-100 hover:scale-[1.02] active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Save size={16} /> {!user.shop ? t('Submit Shop for Review', 'শপ পর্যালোচনার জন্য জমা দিন') : t('Save Shop Details', 'শপের তথ্য সংরক্ষণ করুন')}
                </button>
                {shop && (
                  <button 
                    onClick={() => setIsEditingShop(false)}
                    className="px-8 h-14 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all font-bold"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 pb-12">
        {/* Shop Header/Banner */}
        <div className="relative group rounded-[40px] overflow-hidden bg-gray-100 aspect-[21/9] md:aspect-[3/1] shadow-lg">
          <img 
            src={shop.banner || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=85&w=1200"} 
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-1000"
            alt="Shop Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
          
          <button 
            onClick={handleEditShop}
            className="absolute top-6 right-6 p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl hover:bg-white/40 transition-all shadow-xl group/btn"
          >
            <Camera size={20} />
          </button>

          <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-white group-hover:rotate-2 transition-transform">
                <img src={shop.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${shop.name}`} className="w-full h-full object-cover" alt="Logo" />
                <button 
                  onClick={handleEditShop}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white"
                >
                  <Camera size={24} />
                </button>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">{shop.name}</h1>
                  {shop.isVerified && (
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg transform rotate-12 scale-110">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-white/80 text-[10px] font-black uppercase tracking-widest">
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                    <Users size={12} /> {shop.followers.toLocaleString()} {t('Followers', 'অনুসারী')}
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" /> {shop.rating} {t('Rating', 'রেটিং')}
                  </div>
                  <div className="hidden md:flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                    <Calendar size={12} /> {t('Joined', 'যুক্ত হয়েছেন')} {formatDate(shop?.joinedAt, {}, dateLocale)}
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={handleEditShop}
              className="px-8 py-4 bg-brand-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-orange-950/20 hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
            >
              <Edit2 size={13} />
              <span>{t('Edit Shop', 'শপের তথ্য পরিবর্তন')}</span>
            </button>
          </div>
        </div>

        {/* Status Indicators */}
        {shop.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
               <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900 uppercase tracking-tight">{t('Verification in Progress', 'শপ যাচাইকরণ প্রক্রিয়াধীন')}</p>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-0.5">{t('Your shop is under review by admin. Product listings are temporarily paused.', 'আপনার শপটি অ্যাডমিনের পর্যালোচনাধীন রয়েছে। অনুমোদনের পর পণ্যগুলো প্রদর্শিত হবে।')}</p>
            </div>
          </div>
        )}

        {shop.status === 'rejected' && (
          <div className="bg-rose-50 border border-rose-100 p-6 rounded-[32px] mb-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
               <ShieldAlert size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-rose-900 uppercase tracking-tight">{t('Shop Application Rejected', 'শপের আবেদন বাতিল হয়েছে')}</p>
              <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mt-0.5">{t('Your merchant details failed validation. Please update your shop profile.', 'আপনার তথ্য যাচাইয়ে উত্তীর্ণ হয়নি। অনুগ্রহ করে শপের তথ্য পুনরায় আপডেট করুন।')}</p>
            </div>
          </div>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: t('Revenue', 'মোট আয়'), value: `৳${shop.revenue.toLocaleString()}`, icon: <TrendingUp size={24} />, color: 'bg-emerald-500', shadow: 'shadow-emerald-100' },
            { label: t('Total Sales', 'মোট বিক্রয়'), value: shop.totalSales, icon: <ShoppingBag size={24} />, color: 'bg-brand-orange', shadow: 'shadow-orange-100' },
            { label: t('Live Products', 'সক্রিয় পণ্য'), value: (myProducts?.filter(p => p.status === 'approved' || !p.status).length || 0), icon: <LayoutDashboard size={24} />, color: 'bg-blue-500', shadow: 'shadow-blue-100' },
            { label: t('Pending Review', 'পর্যালোচনাধীন'), value: (myProducts?.filter(p => p.status === 'pending').length || 0), icon: <Clock size={24} />, color: 'bg-amber-500', shadow: 'shadow-amber-100' },
            { label: t('Store Rating', 'স্টোর রেটিং'), value: shop.rating, icon: <Star size={24} />, color: 'bg-yellow-400', shadow: 'shadow-yellow-100' },
          ].map((stat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 group hover:border-brand-orange/20 transition-all"
            >
              <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight">{stat.value}</h4>
            </motion.div>
          ))}
        </div>

        {/* Product Management Section */}
        <section className="bg-white rounded-[44px] p-8 md:p-10 shadow-sm border border-gray-100">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10 pb-8 border-b border-gray-50">
            <div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{t('Inventory Control', 'পণ্য ও মজুদ ব্যবস্থাপনা')}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Deploy, monitor and scale your product line', 'আপনার পণ্য তালিকা যোগ, পর্যবেক্ষণ ও পরিচালনা করুন')}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-orange transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder={t('Search Products...', 'পণ্য খুঁজুন...')}
                  value={shopSearchTerm}
                  onChange={(e) => setShopSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white rounded-3xl text-[10px] font-black uppercase tracking-widest outline-none transition-all"
                />
              </div>
              <div className="relative">
                <select 
                  value={shopCategoryFilter}
                  onChange={(e) => setShopCategoryFilter(e.target.value)}
                  className="appearance-none pl-14 pr-12 py-4 bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white rounded-3xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer transition-all min-w-[180px]"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat === 'All' ? 'all' : cat}>
                      {cat === 'All' ? t('All Categories', 'সব ক্যাটাগরি') : cat}
                    </option>
                  ))}
                </select>
                <Grid className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              </div>

              <div className="relative">
                <select 
                  value={shopStatusFilter}
                  onChange={(e) => setShopStatusFilter(e.target.value as any)}
                  className="appearance-none pl-14 pr-12 py-4 bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white rounded-3xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer transition-all min-w-[180px]"
                >
                  <option value="all">{t('All Status', 'সব স্ট্যাটাস')}</option>
                  <option value="approved">{t('Live & Active', 'অনুমোদিত ও সক্রিয়')}</option>
                  <option value="pending">{t('Pending Review', 'পর্যালোচনাধীন')}</option>
                  <option value="rejected">{t('Rejected', 'বাতিলকৃত')}</option>
                </select>
                <div className={`absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${
                  shopStatusFilter === 'approved' ? 'bg-emerald-500 border-emerald-200' :
                  shopStatusFilter === 'pending' ? 'bg-amber-500 border-amber-200' :
                  shopStatusFilter === 'rejected' ? 'bg-rose-500 border-rose-200' :
                  'bg-gray-400 border-gray-200'
                }`} />
              </div>
              <button 
                onClick={() => {
                  if (user.shop?.status === 'rejected' && !isAdmin) {
                    showToast(t('Please update your shop details before adding products', 'পণ্য যোগ করার আগে শপের তথ্য আপডেট করুন'), 'error');
                    return;
                  }
                  setEditingProduct(null);
                  setProductFormData({ 
                    name: '', 
                    brand: '',
                    category: '', 
                    subcategory: '',
                    sku: '',
                    condition: 'new',
                    price: '', 
                    originalPrice: '',
                    stock: '', 
                    minOrderQuantity: 1,
                    image: '', 
                    gallery: [],
                    description: '',
                    deliveryTime: '',
                    deliveryFee: '',
                    codAllowed: true,
                    tags: [],
                    variants: { sizes: [], colors: [] }
                  });
                  setUploadedImagesMeta({});
                  setShowAddModal(true);
                }}
                disabled={(!user.shop || user.shop.status === 'rejected') && !isAdmin}
                className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 ${
                  (user.shop && user.shop.status !== 'rejected') || isAdmin
                    ? 'bg-brand-orange text-white shadow-orange-100 hover:scale-105 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={20} strokeWidth={3} /> {t('Add New Product', 'নতুন পণ্য যোগ করুন')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMyProducts.map((product) => (
              <motion.div 
                layout
                key={product.id} 
                className="bg-white rounded-[40px] p-6 shadow-sm border border-gray-50 group transition-all hover:shadow-2xl hover:shadow-gray-200 hover:border-gray-100"
              >
                <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden mb-6 bg-gray-50">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className={`absolute top-4 left-4 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-xl shadow-2xl border border-white/30 flex items-center gap-2 ${
                    product.status === 'approved' ? 'bg-emerald-500/90 text-white' :
                    product.status === 'rejected' ? 'bg-rose-500/90 text-white' :
                    'bg-amber-500/90 text-white'
                  }`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      product.status === 'approved' ? 'bg-emerald-200' :
                      product.status === 'rejected' ? 'bg-rose-200' :
                      'bg-amber-200'
                    }`} />
                    {product.status === 'approved' ? t('Live & Active', 'অনুমোদিত') : 
                     product.status === 'rejected' ? t('Rejected', 'বাতিল') : 
                     t('Pending Review', 'পর্যালোচনাধীন')}
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={() => onUpdateProduct({ ...product, isHidden: !product.isHidden })}
                      className={`w-10 h-10 ${product.isHidden ? 'bg-amber-500 text-white' : 'bg-white/90 text-gray-900'} backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all`}
                    >
                      {product.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setProductFormData({ ...product });
                        // Pre-populate uploaded image metadata
                        const meta: Record<number, { name: string; size: number; src: string }> = {};
                        if (product.image) {
                          meta[0] = { name: '', size: 0, src: product.image };
                        }
                        if (product.gallery && Array.isArray(product.gallery)) {
                          product.gallery.forEach((gSrc: string, index: number) => {
                            if (gSrc) {
                              meta[index + 1] = { name: '', size: 0, src: gSrc };
                            }
                          });
                        }
                        setUploadedImagesMeta(meta);
                        setShowAddModal(true);
                      }}
                      className="w-10 h-10 bg-white/90 backdrop-blur-md text-gray-900 rounded-xl flex items-center justify-center shadow-lg hover:bg-brand-orange hover:text-white transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleRemoveProduct(product.id)}
                      className="w-10 h-10 bg-white/90 backdrop-blur-md text-rose-500 rounded-xl flex items-center justify-center shadow-lg hover:bg-rose-500 hover:text-white transition-all transform hover:rotate-12"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest backdrop-blur-md ${
                      (product.stock || 0) > 5 ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'
                    }`}>
                      {product.stock || 0} {t('IN STOCK', 'স্টকে আছে')}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => onUpdateProduct({...product, stock: Math.max(0, (product.stock || 0) - 1)})}
                        className="w-8 h-8 bg-white/20 hover:bg-white/40 text-white rounded-lg flex items-center justify-center backdrop-blur-md text-xs font-black"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => onUpdateProduct({...product, stock: (product.stock || 0) + 1})}
                        className="w-8 h-8 bg-white/20 hover:bg-white/40 text-white rounded-lg flex items-center justify-center backdrop-blur-md text-xs font-black"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 px-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest">{product.category}</span>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">SKU-{product.id.slice(0, 8)}</span>
                  </div>
                  <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight group-hover:text-brand-orange transition-colors">{product.name}</h4>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <p className="text-xl font-black text-gray-900 tracking-tight">৳{(product.price).toLocaleString()}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase">
                      <TrendingUp size={14} /> {product.soldCount || 0} {t('Sold', 'বিক্রি')}
                    </div>
                  </div>
                  
                  {/* Ad Campaign Management Widget */}
                  <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-100 space-y-3">
                    {product.isSponsored ? (
                      <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-800 uppercase tracking-widest leading-none">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" /> {t('Active Promotion', 'স্পনসরড বিজ্ঞাপন')}
                          </span>
                          <span className="text-[10px] font-mono font-black text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded">
                            {t('৳3 / Click', '৳৩ / ক্লিক')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
                          <div className="bg-white/40 p-2 rounded-xl">
                            <span className="text-gray-400 block mb-0.5 font-mono">{t('Impressions', 'ইমপ্রেশন')}</span>
                            <span className="text-xs font-black text-gray-850 font-sans">{(product.adImpressions || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-white/40 p-2 rounded-xl">
                            <span className="text-gray-400 block mb-0.5 font-mono">{t('Clicks', 'ক্লিক')}</span>
                            <span className="text-xs font-black text-gray-850 font-sans">{(product.adClicks || 0).toLocaleString()}</span>
                          </div>
                          <div className="bg-white/40 p-2 rounded-xl">
                            <span className="text-gray-400 block mb-0.5 font-mono">{t('Spent budget', 'ব্যয়িত বাজেট')}</span>
                            <span className="text-xs font-black text-amber-700 font-sans">৳{((product.adClicks || 0) * 3).toLocaleString()}</span>
                          </div>
                          <div className="bg-white/40 p-2 rounded-xl">
                            <span className="text-gray-400 block mb-0.5 font-mono">{t('Remaining', 'অবশিষ্ট')}</span>
                            <span className="text-xs font-black text-[#ff5c00] font-sans font-mono font-bold">৳{(product.adBudget || 0).toLocaleString()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            setPromotingProduct(product);
                            setAdBudgetInput(product.adBudget || 500);
                            setAdStatusInput(product.isSponsored || false);
                          }}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 transition-colors text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md font-display mt-2"
                        >
                          {t('Modify Campaign', 'ক্যাম্পেইন বদলান')}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-gray-405 uppercase tracking-widest flex items-center gap-1.5 pl-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" /> {t('Organic Listing', 'সাধারণ লিস্টিং')}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            setPromotingProduct(product);
                            setAdBudgetInput(500);
                            setAdStatusInput(true);
                          }}
                          className="w-full py-2 bg-[#16171d]/5 hover:bg-brand-orange hover:text-white hover:shadow-brand-orange/15 text-gray-700 transition-all text-[10px] font-black uppercase tracking-widest rounded-xl font-display flex items-center justify-center gap-1.5 border border-transparent hover:border-brand-orange/10"
                        >
                          <Sparkles size={11} /> {t('Promote with Ads', 'বিজ্ঞাপন দিন')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {(filteredMyProducts?.length || 0) === 0 && (
              <div className="col-span-full py-24 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-gray-300 shadow-inner">
                  <LayoutDashboard size={48} />
                </div>
                <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">{t('No Products Found', 'কোনো পণ্য পাওয়া যায়নি')}</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('Add products to start growing your online shop', 'আপনার অনলাইন শপ বড় করতে নতুন পণ্য যোগ করুন')}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    )
  };

  const renderCart = () => {
    const selectedCount = (cart || []).filter(item => item.selected !== false).length;
    const selectedSubtotal = cart
      .filter(item => item.selected !== false)
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const isAllSelected = (cart?.length || 0) > 0 && cart.every(item => item.selected !== false);

    const handleClearCart = () => {
      cart.forEach(item => onRemoveFromCart(item.id, item.selectedSize, item.selectedColor));
      showToast(t('Cart cleared', 'কার্ট খালি করা হয়েছে'), 'info');
    };

    const handleToggleAllSelection = (selected: boolean) => {
      if (onSelectAll) {
        onSelectAll(selected);
      } else {
        cart.forEach(item => {
          if (Boolean(item.selected) !== selected) {
            onToggleCartSelection(item.id, item.selectedSize, item.selectedColor);
          }
        });
      }
    };

    return (
      <div className="space-y-6 pb-16 text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {t('My Shopping Cart', 'আমার শপিং কার্ট')}
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              {t('Review your selected items and proceed to checkout', 'আপনার নির্বাচিত পণ্যগুলো যাচাই করে চেকআউট করুন')}
            </p>
          </div>
          {cart.length > 0 && (
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={handleClearCart}
                className="px-4 py-2 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                title={t('Clear all items in cart', 'কার্টের সব পণ্য মুছুন')}
              >
                <Trash2 size={14} />
                <span>{t('Clear Cart', 'কার্ট খালি করুন')}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Cart Items Area */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-100 shadow-sm text-left">
              {cart.length > 0 && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <input 
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleToggleAllSelection(e.target.checked)}
                      className="w-5 h-5 rounded-md border-2 border-gray-300 text-brand-orange accent-orange-600 transition-all cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-800 group-hover:text-brand-orange transition-colors">
                      {t('Select All Items', 'সব পণ্য নির্বাচন করুন')}
                    </span>
                  </label>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    {cart.length} {cart.length === 1 ? t('Item', 'টি পণ্য') : t('Items', 'টি পণ্য')}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                {cart.map((item) => (
                  <div 
                    key={item.id + (item.selectedSize || '') + (item.selectedColor || '')} 
                    className="flex items-center gap-3 sm:gap-5 p-3 sm:p-4 rounded-2xl border border-gray-100 hover:border-orange-200/80 hover:bg-orange-50/20 transition-all group"
                  >
                    <label className="cursor-pointer shrink-0">
                      <input 
                        type="checkbox"
                        checked={item.selected !== false}
                        onChange={() => onToggleCartSelection(item.id, item.selectedSize, item.selectedColor)}
                        className="w-5 h-5 rounded-md border-2 border-gray-300 text-brand-orange accent-orange-600 transition-all cursor-pointer"
                      />
                    </label>

                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2 text-left">
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold text-brand-orange uppercase tracking-wider font-mono">
                            {item.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-tight line-clamp-1 group-hover:text-brand-orange transition-colors">
                            {item.name}
                          </h4>
                          {(item.selectedSize || item.selectedColor) && (
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-mono">
                              {item.selectedSize && `${t('Size:', 'সাইজ:')} ${item.selectedSize}`} {item.selectedColor && `• ${t('Color:', 'রঙ:')} ${item.selectedColor}`}
                            </p>
                          )}
                        </div>

                        <button 
                          type="button"
                          onClick={() => onRemoveFromCart(item.id, item.selectedSize, item.selectedColor)}
                          className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer active:scale-90 shrink-0"
                          title={t('Remove item', 'পণ্য সরান')}
                          aria-label={t('Remove item', 'পণ্য সরান')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <p className="text-sm sm:text-base font-black text-brand-orange font-mono">
                          ৳{Math.round(item.price * item.quantity).toLocaleString()}
                        </p>

                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                          <button 
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, -1, item.selectedSize, item.selectedColor)}
                            className="w-7 h-7 flex items-center justify-center bg-white hover:bg-orange-50 text-gray-700 hover:text-brand-orange rounded-lg shadow-xs transition-all cursor-pointer active:scale-90"
                            title={t('Decrease quantity', 'পরিমাণ কমান')}
                            aria-label={t('Decrease quantity', 'পরিমাণ কমান')}
                          >
                            <Minus size={12} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-black text-gray-900 w-6 text-center font-mono">
                            {item.quantity}
                          </span>
                          <button 
                            type="button"
                            onClick={() => onUpdateQuantity(item.id, 1, item.selectedSize, item.selectedColor)}
                            className="w-7 h-7 flex items-center justify-center bg-white hover:bg-orange-50 text-gray-700 hover:text-brand-orange rounded-lg shadow-xs transition-all cursor-pointer active:scale-90"
                            title={t('Increase quantity', 'পরিমাণ বাড়ান')}
                            aria-label={t('Increase quantity', 'পরিমাণ বাড়ান')}
                          >
                            <Plus size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {(cart?.length || 0) === 0 && (
                  <div className="py-16 text-center">
                    <div className="w-20 h-20 bg-orange-50 text-brand-orange rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                      <ShoppingCart size={32} />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">
                      {t('Your Cart is Empty', 'আপনার কার্ট খালি')}
                    </h4>
                    <p className="text-xs text-gray-400 font-medium mb-6 max-w-sm mx-auto">
                      {t("Looks like you haven't added anything to your cart yet. Discover your favorite products!", 'মনে হচ্ছে আপনি এখনো কার্টে কোনো পণ্য যোগ করেননি। আপনার পছন্দের পণ্যগুলো দেখুন!')}
                    </p>
                    <button 
                      type="button"
                      onClick={() => navigate('/')} 
                      className="px-8 py-3.5 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      {t('Start Shopping', 'কেনাকাটা শুরু করুন')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary / Checkout Card */}
          <div className="xl:col-span-1">
            <div className="bg-gray-900 text-white rounded-3xl p-6 shadow-xl sticky top-24 text-left border border-gray-800">
              <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
                <CreditCard size={18} className="text-brand-orange" />
                <h3 className="text-sm font-black uppercase tracking-wider font-mono">
                  {t('Order Summary', 'মূল্য তালিকা')}
                </h3>
              </div>
              
              <div className="space-y-3 mb-5 font-mono text-xs">
                <div className="flex justify-between items-center text-gray-400">
                  <span>{t(`Subtotal (${selectedCount} items)`, `সাবটোটাল (${selectedCount}টি পণ্য)`)}</span>
                  <span className="font-bold text-white text-sm">৳{Math.round(selectedSubtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-gray-400">
                  <span>{t('Shipping', 'ডেলিভারি চার্জ')}</span>
                  <span className="font-bold text-brand-orange">
                    {selectedSubtotal > 0 ? '৳120' : '৳0'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10 text-sm">
                  <span className="font-bold text-brand-orange uppercase font-sans">{t('Total Amount', 'সর্বমোট মূল্য')}</span>
                  <span className="text-2xl font-black text-white">৳{(selectedSubtotal > 0 ? Math.round(selectedSubtotal) + 120 : 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 mb-5 space-y-1">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-wider">{t('100% Secure Checkout', '১০০% নিরাপদ চেকআউট')}</p>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                  {t('Cash on Delivery (COD) & instant mobile payments (bKash/Nagad) supported nationwide.', 'সারা দেশে ক্যাশ অন ডেলিভারি (COD) এবং বিকাশ/নগদে তাৎক্ষণিক পেমেন্ট সুবিধা।')}
                </p>
              </div>

              <button 
                type="button"
                disabled={selectedCount === 0}
                onClick={() => navigate('/checkout')}
                className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  selectedCount > 0 
                  ? 'bg-brand-orange hover:bg-orange-600 text-white shadow-orange-500/25 active:scale-95' 
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
                id="profile-cart-checkout-btn"
              >
                <span>{t('Proceed to Checkout', 'চেকআউটে যান')}</span>
                <ArrowRight size={16} />
              </button>
              
              {selectedCount > 0 ? (
                <p className="text-[10px] font-bold text-center text-gray-400 uppercase tracking-wider mt-3 font-mono">
                  {selectedCount} {selectedCount === 1 ? t('item ready for checkout', 'টি পণ্য চেকআউটের জন্য প্রস্তুত') : t('items ready for checkout', 'টি পণ্য চেকআউটের জন্য প্রস্তুত')}
                </p>
              ) : (
                <p className="text-[10px] text-center text-amber-400/80 mt-2 font-medium">
                  {t('Please select at least 1 item to proceed', 'এগিয়ে যেতে অন্তত ১টি পণ্য নির্বাচন করুন')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdmin = () => {
    if (!isAdmin) return null;

    const pendingProducts = (products || []).filter(p => p.status === 'pending');
    const approvedProducts = (products || []).filter(p => p.status === 'approved');
    const rejectedProducts = (products || []).filter(p => p.status === 'rejected');
    
    // User account states
    const pendingUsers = (users || []).filter(u => u.status === 'pending');
    
    // Extract pending shops from users list
    const pendingShopsFromUsers = (users || []).filter(u => u.shop?.status === 'pending');
    
    return (
      <div className="space-y-8 pb-12 text-left">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">{t('Command Center', 'অ্যাডমিন কমান্ড সেন্টার')}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Global Moderation and Network Security', 'অ্যাকাউন্ট, শপ এবং পণ্য অনুমোদন নিয়ন্ত্রণ')}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-emerald-100">
               <ShieldCheck className="text-emerald-500" size={18} />
               <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t('Admin Access', 'অ্যাডমিন অ্যাক্সেস')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-6">
             {[
               { label: t('Pending Users', 'অপেক্ষমাণ ব্যবহারকারী'), value: (pendingUsers?.length || 0), color: 'text-brand-orange', bg: 'bg-orange-50' },
               { label: t('Pending Orders', 'অপেক্ষমাণ অর্ডার'), value: (orders || []).filter(o => o.status === 'pending').length, color: 'text-amber-500', bg: 'bg-amber-50' },
               { label: t('Pending Shops', 'অপেক্ষমাণ শপ'), value: (pendingShopsFromUsers?.length || 0), color: 'text-blue-500', bg: 'bg-blue-50' },
               { label: t('Pending Products', 'অপেক্ষমাণ পণ্য'), value: (pendingProducts?.length || 0), color: 'text-emerald-500', bg: 'bg-emerald-50' },
               { label: t('Rejected Products', 'বাতিলকৃত পণ্য'), value: (rejectedProducts?.length || 0), color: 'text-rose-500', bg: 'bg-rose-50' },
             ].map((stat, i) => (
               <div key={i} className={`${stat.bg} p-6 rounded-[32px] border border-white shadow-sm`}>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
               </div>
             ))}
          </div>

          {/* Account Moderation */}
          <div className="lg:col-span-3 bg-white p-8 rounded-[44px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
              <Users className="text-brand-orange" size={24} /> {t('Account Authorization Queue', 'অ্যাকাউন্ট অনুমোদন তালিকা')}
            </h3>
            {(pendingUsers?.length || 0) === 0 ? (
              <div className="py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">{t('All accounts verified. Queue empty.', 'সব অ্যাকাউন্ট যাচাইকৃত। কোনো অপেক্ষমাণ আবেদন নেই।')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                      <img src={u.avatar} className="w-12 h-12 rounded-2xl" alt={`${u.name || 'Merchant'} profile avatar`} />
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-gray-900 uppercase truncate">{u.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                         onClick={() => {
                           const updatedUsers = users.map(user => user.id === u.id ? { ...user, status: 'active' } : user);
                           onUpdateAllUsers(updatedUsers as any);
                           showToast(t(`Account authorized: ${u.email}`, `অ্যাকাউন্ট অনুমোদিত হয়েছে: ${u.email}`));
                         }}
                         className="py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 transition-all hover:translate-y-[-2px]"
                       >
                         {t('Authorize', 'অনুমোদন দিন')}
                       </button>
                       <button 
                         onClick={() => {
                           const updatedUsers = users.map(user => user.id === u.id ? { ...user, status: 'rejected' } : user);
                           onUpdateAllUsers(updatedUsers as any);
                           showToast(t(`Account rejected: ${u.email}`, `অ্যাকাউন্ট বাতিল করা হয়েছে: ${u.email}`), 'error');
                         }}
                         className="py-2.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 transition-all hover:translate-y-[-2px]"
                       >
                         {t('Reject', 'বাতিল করুন')}
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-3 bg-white p-8 rounded-[44px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
              <Store className="text-blue-500" size={24} /> {t('Pending Merchant Shops', 'অপেক্ষমাণ মার্চেন্ট শপ')}
            </h3>
            {(pendingShopsFromUsers?.length || 0) === 0 ? (
              <div className="py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">{t('No pending shop requests detected', 'কোনো অপেক্ষমাণ শপ আবেদন নেই')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingShopsFromUsers.map((u) => (
                  <div key={u.id} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden border border-gray-100 p-1 flex-shrink-0">
                        <img src={u.shop?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.id}`} className="w-full h-full object-cover rounded-xl" alt={u.shop?.name} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 uppercase">{u.shop?.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{t('Owner:', 'মালিক:')} {u.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={async () => {
                          try {
                            const updatedUser = await adminApi.updateUser(u.id, { 
                              shop: { ...u.shop!, status: 'active', isVerified: true } 
                            });
                            const updatedUsers = users.map(user => 
                              user.id === u.id ? updatedUser : user
                            );
                            onUpdateAllUsers(updatedUsers as any);
                            
                            // Sync existing products from this seller
                            products.forEach(async (p) => {
                              if (p.seller?.id === u.id) {
                                try {
                                  const updatedP = await productApi.updateProduct(p.id, {
                                    seller: { ...p.seller, verified: true }
                                  });
                                  onUpdateProduct(updatedP as Product);
                                } catch (err) {
                                  console.error('Failed to sync product verification', err);
                                }
                              }
                            });
                            
                            showToast(t(`Shop Authorized: ${u.shop?.name}`, `শপ অনুমোদিত হয়েছে: ${u.shop?.name}`));
                          } catch (err) {
                            showToast(t('Authorization failed', 'অনুমোদন ব্যর্থ হয়েছে'), 'error');
                          }
                        }}
                        className="p-3 bg-emerald-500 text-white rounded-xl hover:scale-105 transition-all shadow-lg shadow-emerald-200"
                       >
                         <Check size={18} />
                       </button>
                       <button 
                        onClick={async () => {
                          try {
                            const updatedUser = await adminApi.updateUser(u.id, { 
                              shop: { ...u.shop!, status: 'rejected' } 
                            });
                            const updatedUsers = users.map(user => 
                              user.id === u.id ? updatedUser : user
                            );
                            onUpdateAllUsers(updatedUsers as any);
                            showToast(t('Shop Rejected', 'শপ আবেদন বাতিল করা হয়েছে'), 'error');
                          } catch (err) {
                            showToast(t('Operation failed', 'অপারেশন ব্যর্থ হয়েছে'), 'error');
                          }
                        }}
                        className="p-3 bg-rose-500 text-white rounded-xl hover:scale-105 transition-all shadow-lg shadow-rose-200"
                       >
                         <X size={18} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-3 bg-white p-8 rounded-[44px] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center gap-3">
              <Package className="text-brand-orange" size={24} /> {t('Product Approval Queue', 'পণ্য অনুমোদন তালিকা')}
            </h3>
            {(pendingProducts?.length || 0) === 0 ? (
              <div className="py-12 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">{t('No products pending review.', 'পর্যালোচনার জন্য কোনো পণ্য অপেক্ষমাণ নেই।')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {pendingProducts.map((p) => (
                  <div key={p.id} className="bg-gray-50 p-4 rounded-[32px] border border-gray-100 group">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 relative">
                      <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-brand-orange">
                        {p.category}
                      </div>
                    </div>
                    <div className="mb-4 px-2">
                      <p className="text-xs font-black text-gray-900 uppercase truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t('By', 'বিক্রেতা:')} {p.seller?.name || t('Unknown Store', 'অজানা স্টোর')}</p>
                      <p className="text-lg font-black text-gray-900 mt-2">৳{p.price.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={async () => {
                          try {
                            const updated = await productApi.updateProduct(p.id, { status: 'approved' });
                            onUpdateProduct(updated as Product);
                            showToast(t('Product approved successfully! Now visible in shop.', 'প্রোডাক্ট সফলভাবে অ্যাপ্রুভ করা হয়েছে! এটি এখন শপে দেখা যাবে।'));
                          } catch (e) {
                            showToast(t('Approval failed', 'অনুমোদন ব্যর্থ হয়েছে'), 'error');
                          }
                        }}
                        className="py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        {t('Approve', 'অনুমোদন দিন')}
                      </button>
                      <button 
                         onClick={async () => {
                          try {
                            const updated = await productApi.updateProduct(p.id, { status: 'rejected' });
                            onUpdateProduct(updated as Product);
                            showToast(t('Product Rejected', 'পণ্য বাতিল করা হয়েছে'), 'error');
                          } catch (e) {
                            showToast(t('Rejection failed', 'বাতিল প্রক্রিয়া ব্যর্থ হয়েছে'), 'error');
                          }
                        }}
                        className="py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-100 hover:scale-[1.02] active:scale-95 transition-all"
                      >
                        {t('Reject', 'বাতিল করুন')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const navItems: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: t('Dashboard', 'ড্যাশবোর্ড'), icon: <LayoutDashboard size={18} /> },
    { id: 'orders', label: t('My Orders', 'আমার অর্ডার'), icon: <Package size={18} />, count: (orders || []).filter(o => !o.isDeleted).length },
    { id: 'shop', label: t('My Shop', 'আমার শপ'), icon: <Store size={18} />, count: myProducts.length > 0 ? myProducts.length : undefined },
    ...(isAdmin ? [{ id: 'admin' as Tab, label: t('Admin Panel', 'অ্যাডমিন প্যানেল'), icon: <ShieldCheck size={18} /> }] : []),
    { id: 'cart', label: t('Cart', 'কার্ট'), icon: <ShoppingCart size={18} />, count: (cart || []).length },
    { id: 'wishlist', label: t('Wishlist', 'পছন্দের তালিকা'), icon: <Heart size={18} />, count: (wishlist || []).length },
    { id: 'addresses', label: t('Addresses', 'ঠিকানা'), icon: <MapPin size={18} />, count: (user?.addresses || []).length },
    { id: 'settings', label: t('Settings', 'সেটিংস'), icon: <Settings size={18} /> },
    { id: 'trash', label: t('Trash Bin', 'ট্র্যাশ বিন'), icon: <Trash2 size={18} />, count: (orders || []).filter(o => o.isDeleted).length },
  ];

  const renderSidebar = () => (
    <div className="w-full lg:w-80 space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl shadow-sm hover:shadow-md border border-gray-100/90 text-center relative overflow-hidden transition-all duration-300 group">
        {/* Cover Photo Area with soft gradient / subtle luxury pattern */}
        <div 
          onClick={() => bannerInputRef.current?.click()}
          className="relative w-full h-36 cursor-pointer group/banner overflow-hidden"
          title={t('Click to change cover photo', 'কভার ফটো পরিবর্তন করতে ক্লিক করুন')}
        >
          {user?.banner ? (
            <img src={user.banner} className="w-full h-full object-cover transition-transform duration-500 group-hover/banner:scale-105" alt="Cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#334155] relative overflow-hidden">
              {/* Subtle ambient lighting spheres */}
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-brand-orange/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-amber-500/15 blur-xl pointer-events-none" />
              {/* Subtle geometric dot grid pattern */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
            </div>
          )}

          {/* Hover / Upload overlay */}
          {isUploading === 'banner' ? (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-20">
              <Loader2 className="animate-spin text-white mb-1.5" size={22} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{t('Uploading...', 'আপলোড হচ্ছে...')}</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-start justify-end p-3 pointer-events-none">
              <div className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white/90 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm pointer-events-auto">
                <Camera size={12} className="text-brand-orange" />
                <span className="tracking-wide">{t('Cover', 'কভার')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Circular Avatar & Profile Info */}
        <div className="relative z-20 px-6 pt-0 pb-6">
          {/* Floating Circular Avatar */}
          <div className="relative -mt-14 w-28 h-28 mx-auto mb-3 group/avatar">
            <img 
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
              alt={user?.name} 
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-xl shadow-gray-900/10 cursor-pointer hover:scale-[1.03] transition-all duration-300 bg-white ring-1 ring-black/5"
              onClick={() => avatarInputRef.current?.click()}
            />
            {isUploading === 'avatar' && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center backdrop-blur-sm z-20">
                <Loader2 className="animate-spin text-white" size={20} />
              </div>
            )}
            <button 
              onClick={() => avatarInputRef.current?.click()}
              aria-label={t('Upload profile photo', 'প্রোফাইল ছবি আপলোড করুন')}
              className="absolute bottom-0.5 right-0.5 w-8 h-8 bg-white hover:bg-brand-orange text-gray-700 hover:text-white rounded-full shadow-md border border-gray-100 flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Camera size={14} />
            </button>
          </div>

          {/* Typography Hierarchy: Name & Status */}
          <div className="space-y-1">
            <h3 className="text-lg font-black text-gray-900 tracking-tight capitalize truncate">
              {user?.name || t('Customer Account', 'গ্রাহক অ্যাকাউন্ট')}
            </h3>
            
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
              {isSuperAdminEmail(user?.email) ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 border border-amber-500/30 font-mono">
                  ⚡ {t('SUPER ADMIN', 'সুপার অ্যাডমিন')}
                </span>
              ) : user?.role === 'admin' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-700 border border-blue-500/30 font-mono">
                  🛡️ {t('ADMIN', 'অ্যাডমিন')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-mono">
                  👤 {t('CUSTOMER', 'গ্রাহক')}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                user?.status === 'active' || !user?.status 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                  : user?.status === 'pending'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{user?.status === 'active' || !user?.status ? t('Active', 'সক্রিয়') : user.status}</span>
              </span>
            </div>

            <p className="text-xs text-gray-400 font-medium truncate max-w-[240px] mx-auto pt-0.5">
              {user?.email}
            </p>

            <div className="pt-1.5 flex justify-center">
              {effectivePhone ? (
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput(effectivePhone);
                    setShowPhoneModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 hover:bg-orange-100 text-brand-orange border border-orange-200/60 rounded-full text-xs font-mono font-bold transition-colors cursor-pointer group"
                  title={t('Change mobile number', 'মোবাইল নম্বর পরিবর্তন করুন')}
                >
                  <Phone size={12} className="group-hover:scale-110 transition-transform" />
                  <span>{effectivePhone}</span>
                  <Edit2 size={10} className="text-orange-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPhoneInput('');
                    setShowPhoneModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold transition-colors cursor-pointer shadow-xs"
                  title={t('Add mobile number', 'মোবাইল নম্বর যোগ করুন')}
                >
                  <Phone size={11} />
                  <span>{t('+ Add Mobile Number', '+ মোবাইল নম্বর যোগ করুন')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Snapshot Metrics */}
          <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 divide-x divide-gray-100 text-center">
            <div className="px-1">
              <p className="text-base font-black text-gray-900">{(orders || []).filter(o => !o.isDeleted).length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('Orders', 'অর্ডার')}</p>
            </div>
            <div className="px-1">
              <p className="text-base font-black text-gray-900">{(wishlist || []).length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('Wishlist', 'পছন্দ')}</p>
            </div>
            <div className="px-1">
              <p className="text-base font-black text-gray-900">{(user?.addresses || []).length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('Addresses', 'ঠিকানা')}</p>
            </div>
          </div>

          {/* Admin Fast-Action Portal Button */}
          {isAdmin && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <ShieldCheck size={14} />
                <span>{t('Open Admin Dashboard', 'অ্যাডমিন ড্যাশবোর্ড খুলুন')}</span>
                <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Horizontal Navigation Tabs (Visible on < lg screens) */}
      <div className="block lg:hidden bg-white rounded-2xl p-2 shadow-sm border border-gray-100/90 overflow-x-auto no-scrollbar pb-2">
        <div className="flex items-center gap-1.5 min-w-max">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-orange to-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                    isActive ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sidebar Vertical Menu */}
      <div className="hidden lg:block bg-white rounded-3xl p-3 shadow-sm border border-gray-100/90 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group relative ${
                isActive 
                  ? 'bg-gradient-to-r from-brand-orange to-orange-600 text-white font-bold shadow-md shadow-orange-500/20' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/90'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span className={`transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand-orange'}`}>
                  {item.icon}
                </span>
                <span className="text-xs font-bold tracking-wide">{item.label}</span>
              </div>
              
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                  isActive 
                    ? 'bg-white/25 text-white' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Logout Button */}
        <div className="pt-2 mt-2 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-all duration-200"
          >
            <LogOut size={18} />
            <span>{t('Logout', 'লগআউট')}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-brand-orange selection:text-white pb-16">
      {/* Top Sticky Header for Profile Dashboard */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Left: Back button & Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-brand-orange hover:bg-orange-50 transition-all border border-gray-200 cursor-pointer shrink-0"
              title={t('Return to shopping', 'কেনাকাটায় ফিরুন')}
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{t('Storefront', 'হোমপেজে ফিরুন')}</span>
              <span className="sm:hidden">{t('Back', 'ফিরুন')}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-left cursor-pointer group shrink min-w-0"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#EA580C] via-brand-orange to-[#FBBF24] flex items-center justify-center text-white font-black text-base shadow-sm group-hover:scale-105 transition-transform shrink-0">
                {siteConfig?.siteName?.charAt(0) || 'D'}
              </div>
              <div className="hidden sm:block min-w-0">
                <span className="font-black text-sm sm:text-base text-gray-900 group-hover:text-brand-orange transition-colors truncate block">
                  {siteConfig?.siteName || 'Digital Shop T.M'}
                </span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-orange font-mono block">
                  {t('Profile & Dashboard', 'প্রোফাইল ও ড্যাশবোর্ড')}
                </span>
              </div>
            </button>
          </div>

          {/* Right: Quick actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher variant="compact" />

            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ShieldCheck size={15} />
                <span>{t('Admin Panel', 'অ্যাডমিন প্যানেল')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
            >
              <Home size={15} className="text-gray-400" />
              <span>{t('Browse Shop', 'শপ ব্রাউজ করুন')}</span>
            </button>

            <div className="h-6 w-[1px] bg-gray-200 hidden sm:block" />

            {/* User identity mini pill */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-brand-orange/30 shadow-2xs shrink-0">
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id || 'guest'}`}
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden lg:flex flex-col text-left leading-tight">
                <span className="text-xs font-black text-gray-900 truncate max-w-[120px]">
                  {user?.name || t('Member', 'সদস্য')}
                </span>
                <span className="text-[10px] font-bold text-brand-orange">
                  {isSuperAdminEmail(user?.email) ? t('Super Admin', 'সুপার অ্যাডমিন') : (user?.role === 'admin' ? t('Admin', 'অ্যাডমিন') : t('Member', 'সদস্য'))}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-1.5 cursor-pointer"
              title={t('Sign Out', 'সাইন আউট')}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">{t('Logout', 'লগআউট')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-b from-orange-50/70 via-white to-gray-50 border-b border-gray-100 py-6 sm:py-8 px-4 sm:px-6 lg:px-8 mb-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {isSyncFallback && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-amber-900 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-600 shrink-0" />
                <span>{t('Could not sync with cloud database, showing basic info', 'ক্লাউড ডেটাবেস সিঙ্ক হয়নি, সাধারণ তথ্য দেখানো হচ্ছে')}</span>
              </div>
              <button
                type="button"
                onClick={handleRetrySync}
                disabled={isRetryingSync}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                <RotateCcw size={13} className={isRetryingSync ? 'animate-spin' : ''} />
                <span>{isRetryingSync ? t('Syncing...', 'সিঙ্ক হচ্ছে...') : t('Retry', 'পুনরায় চেষ্টা')}</span>
              </button>
            </div>
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-1">
              <button onClick={() => navigate('/')} className="hover:text-brand-orange transition-colors cursor-pointer">{t('Home', 'হোম')}</button>
              <span>/</span>
              <span className="text-brand-orange font-bold">{t('Member Dashboard & Profile', 'সদস্য ড্যাশবোর্ড ও প্রোফাইল')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              <span>{t('My Profile & Dashboard', 'আমার প্রোফাইল ও ড্যাশবোর্ড')}</span>
              {isSuperAdminEmail(user?.email) && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full font-mono">
                  ⚡ {t('SUPER ADMIN', 'সুপার অ্যাডমিন')}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              {t('Welcome, ', 'স্বাগতম, ')}<strong className="text-gray-900 font-bold">{user?.name}</strong>{t('! Complete details of your profile, phone number, shop, and delivery addresses.', '! আপনার ব্যক্তিগত পরিচয়, যোগাযোগের নম্বর, শপ ও ডেলিভারি ঠিকানার পূর্ণাঙ্গ বিবরণ।')}
            </p>
          </div>

          {/* Quick tab chips for mobile/tablet */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'dashboard' as Tab, label: t('Overview', 'ওভারভিউ'), icon: <LayoutDashboard size={14} /> },
              { id: 'shop' as Tab, label: t('My Shop', 'আমার শপ'), icon: <Store size={14} />, badge: myProducts.length > 0 ? myProducts.length : undefined },
              { id: 'orders' as Tab, label: t('Orders', 'অর্ডারসমূহ'), icon: <Package size={14} />, badge: (orders || []).filter(o => !o.isDeleted).length },
              { id: 'addresses' as Tab, label: t('Addresses', 'ঠিকানা'), icon: <MapPin size={14} /> },
              { id: 'settings' as Tab, label: t('Settings', 'সেটিংস'), icon: <Settings size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-brand-orange text-white shadow-md shadow-orange-500/20'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === tab.id ? 'bg-white text-brand-orange' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
        {renderSidebar()}

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {isAdmin && (
                <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 rounded-2xl p-4 sm:p-5 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/20">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                      <ShieldCheck size={26} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                        {t('Super Administrator Portal', 'সুপার অ্যাডমিনিস্ট্রেটর পোর্টাল')}
                        <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-mono">{t('ACTIVE', 'সক্রিয়')}</span>
                      </h4>
                      <p className="text-xs text-orange-100 mt-0.5">{t('You have full store master control. Enter the comprehensive store management dashboard.', 'স্টোরের সম্পূর্ণ মাস্টার কন্ট্রোল আপনার হাতে। সম্পূর্ণ স্টোর ম্যানেজমেন্ট ড্যাশবোর্ডে প্রবেশ করুন।')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white text-orange-600 hover:bg-orange-50 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <span>{t('Enter Admin Dashboard', 'অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করুন')}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {isMobileView && activeTab !== 'dashboard' && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-brand-orange border border-orange-200/80 rounded-2xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <ArrowLeft size={16} />
                    <span>{t('Back to Profile', 'মূল প্রোফাইলে ফিরুন')}</span>
                  </button>
                </div>
              )}

              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'orders' && renderOrders()}
              {activeTab === 'trash' && renderTrash()}
              {activeTab === 'wishlist' && renderWishlist()}
              {activeTab === 'addresses' && renderAddresses()}
              {activeTab === 'settings' && renderSettings()}
              {activeTab === 'shop' && renderShop()}
              {activeTab === 'cart' && renderCart()}
              {activeTab === 'admin' && renderAdmin()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      </div>
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={avatarInputRef} 
        onChange={(e) => handleFileUpload(e, 'avatar')} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={bannerInputRef} 
        onChange={(e) => handleFileUpload(e, 'banner')} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={shopLogoInputRef} 
        onChange={(e) => handleFileUpload(e, 'shopLogo')} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={shopBannerInputRef} 
        onChange={(e) => handleFileUpload(e, 'shopBanner')} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Phone Modal */}
      <AnimatePresence>
        {showPhoneModal && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPhoneModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden border border-gray-100 z-10"
            >
              <div className="absolute top-4 right-4">
                <button 
                  type="button"
                  onClick={() => setShowPhoneModal(false)} 
                  className="w-9 h-9 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0 border border-orange-200/50">
                  <Phone size={22} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                    {t('Save Mobile Number', 'মোবাইল নম্বর সংরক্ষণ')}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">{t('Add your personal mobile number to your profile', 'আপনার প্রোফাইলে ব্যক্তিগত নম্বর যুক্ত করুন')}</p>
                </div>
              </div>

              <form onSubmit={handleSavePhoneModal} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
                    {t('BD Mobile Number', 'মোবাইল নম্বর')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      +88
                    </span>
                    <input
                      type="tel"
                      placeholder="017XXXXXXXX"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      autoFocus
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-brand-orange focus:bg-white transition-all font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400 font-medium">
                    {t('Enter an 11-digit number for order & delivery updates (e.g. 01712345678)', 'অর্ডার ও ডেলিভারি আপডেটের জন্য ১১ ডিজিটের নম্বর দিন (যেমন: 01712345678)')}
                  </p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPhoneModal(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPhone}
                    className="flex-1 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingPhone ? (
                      <span>{t('Saving...', 'সংরক্ষণ হচ্ছে...')}</span>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>{t('Save', 'সংরক্ষণ করুন')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddressModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="absolute top-0 right-0 p-5">
                 <button 
                   onClick={() => setShowAddressModal(false)} 
                   className="w-9 h-9 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center hover:bg-gray-100 hover:text-gray-900 transition-colors"
                 >
                   <X size={18} />
                 </button>
              </div>

              <div className="mb-6 flex items-center gap-3">
                 <div className="w-12 h-12 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
                   <MapPin size={22} strokeWidth={2} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                     {editingAddressIdx !== null ? t('Edit Address', 'ঠিকানা সম্পাদনা করুন') : t('New Address', 'নতুন ঠিকানা')}
                   </h3>
                   <p className="text-xs text-gray-400 font-medium">{t('Specify receiver details and delivery location', 'প্রাপকের নাম, মোবাইল ও ডেলিভারি ঠিকানা দিন')}</p>
                 </div>
              </div>

              <form onSubmit={handleAddressSubmit} className="space-y-4">
                 {/* Label Selector: Home, Office, Other */}
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{t('Address Label', 'ঠিকানার ধরন')}</label>
                   <div className="grid grid-cols-3 gap-2">
                     {[
                       { id: 'Home', label: t('Home', 'বাসা'), icon: <Home size={14} /> },
                       { id: 'Office', label: t('Office', 'অফিস'), icon: <Briefcase size={14} /> },
                       { id: 'Other', label: t('Other', 'অন্যান্য'), icon: <MapPin size={14} /> }
                     ].map(opt => (
                       <button
                         key={opt.id}
                         type="button"
                         onClick={() => setAddressData({ ...addressData, label: opt.id })}
                         className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                           (addressData.label || 'Home') === opt.id
                             ? 'bg-brand-orange text-white shadow-md shadow-orange-500/20'
                             : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                         }`}
                       >
                         {opt.icon}
                         <span>{opt.label}</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black p-1 text-gray-400 uppercase tracking-widest">{t('Full Name', 'পূর্ণ নাম')}</label>
                    <input 
                      type="text"
                      required
                      placeholder={t("Receiver's full name", 'প্রাপকের পূর্ণ নাম')}
                      value={addressData.fullName}
                      onChange={e => handleAddressInputChange('fullName', e.target.value)}
                      className={`w-full bg-gray-50 border-2 rounded-2xl p-3.5 text-sm font-medium outline-none transition-all shadow-sm ${
                        errors.addr_name ? 'border-rose-500 bg-rose-50/10 focus:ring-4 focus:ring-rose-500/20 animate-shake' : 
                        addressData.fullName && !errors.addr_name ? 'border-emerald-500 focus:ring-4 focus:ring-emerald-500/10' : 
                        'border-gray-100 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10'
                      }`}
                    />
                    {errors.addr_name && <p className="text-[8px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.addr_name}</p>}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SearchableSelect 
                      label={t('Division', 'বিভাগ')}
                      placeholder={t('Select Division', 'বিভাগ নির্বাচন করুন')}
                      value={addressData.division || ''}
                      options={DIVISIONS}
                      error={!!errors.addr_division}
                      onChange={(val) => {
                        setAddressData({ ...addressData, division: val, district: '', upazila: '' });
                        setErrors(prev => ({ ...prev, addr_division: '' }));
                      }}
                    />
                    <SearchableSelect 
                      label={t('District', 'জেলা')}
                      placeholder={t('Select District', 'জেলা নির্বাচন করুন')}
                      value={addressData.district || ''}
                      disabled={!addressData.division}
                      options={DISTRICTS[addressData.division || ''] || []}
                      error={!!errors.addr_district}
                      onChange={(val) => {
                        setAddressData({ ...addressData, district: val, upazila: '' });
                        setErrors(prev => ({ ...prev, addr_district: '' }));
                      }}
                    />
                    <SearchableSelect 
                      label={t('Upazila', 'উপজেলা')}
                      placeholder={t('Select Upazila', 'উপজেলা নির্বাচন করুন')}
                      value={addressData.upazila || ''}
                      disabled={!addressData.district}
                      options={getUpazilasForDistrict(addressData.district || '')}
                      error={!!errors.addr_upazila}
                      onChange={(val) => {
                        setAddressData({ ...addressData, upazila: val });
                        setErrors(prev => ({ ...prev, addr_upazila: '' }));
                      }}
                    />
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black p-1 text-gray-400 uppercase tracking-widest">{t('Mobile Number', 'মোবাইল নম্বর')}</label>
                       <input 
                         type="tel"
                         inputMode="tel"
                         placeholder="017XXXXXXXX"
                         required
                         value={addressData.phone}
                         onChange={e => handleAddressInputChange('phone', e.target.value)}
                         className={`w-full bg-gray-50 border-2 rounded-2xl p-3.5 text-sm font-medium outline-none transition-all shadow-sm ${
                            errors.addr_phone ? 'border-rose-500 bg-rose-50/10 focus:ring-4 focus:ring-rose-500/20 animate-shake' : 
                            addressData.phone && !errors.addr_phone ? 'border-emerald-500 focus:ring-4 focus:ring-emerald-500/10' : 
                            'border-gray-100 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10'
                         }`}
                       />
                       {errors.addr_phone && <p className="text-[8px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.addr_phone}</p>}
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black p-1 text-gray-400 uppercase tracking-widest">{t('Full Address (Road, Block, Area)', 'সম্পূর্ণ ঠিকানা (রোড, বাসা, এলাকা)')}</label>
                    <textarea 
                      required
                      value={addressData.fullAddress}
                      onChange={e => {
                        setAddressData({...addressData, fullAddress: e.target.value});
                        if (e.target.value) setErrors(prev => ({ ...prev, addr_fullAddress: '' }));
                      }}
                      placeholder={t('e.g. House 12, Road 5, Sector 7', 'যেমন: বাসা ১২, রোড ৫, সেক্টর ৭')}
                      className={`w-full bg-gray-50 border-2 rounded-2xl p-4 text-sm font-medium outline-none transition-all min-h-[90px] shadow-sm resize-none ${
                        errors.addr_fullAddress ? 'border-rose-500 bg-rose-50/10 focus:ring-4 focus:ring-rose-500/20 animate-shake' : 
                        addressData.fullAddress ? 'border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10' : 
                        'border-gray-100 focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10'
                      }`}
                    />
                 </div>

                 <div className="flex items-center gap-2 px-1">
                    <button 
                      type="button"
                      onClick={() => setAddressData({...addressData, isDefault: !addressData.isDefault})}
                      className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${addressData.isDefault ? 'bg-brand-orange border-brand-orange' : 'border-gray-200 bg-white'}`}
                    >
                      {addressData.isDefault && <CheckCircle2 size={12} className="text-white" />}
                    </button>
                    <span className="text-xs font-bold text-gray-600">{t('Set as primary delivery address', 'প্রাথমিক ডেলিভারি ঠিকানা হিসেবে সেট করুন')}</span>
                 </div>

                 <button 
                   type="submit" 
                   disabled={!!errors.addr_phone || !!errors.addr_name || !addressData.fullName || !addressData.phone || !addressData.fullAddress}
                   className={`w-full h-13 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                     (!errors.addr_phone && !errors.addr_name && addressData.fullName && addressData.phone && addressData.fullAddress)
                     ? 'bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/25 active:scale-98'
                     : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'
                   }`}
                 >
                   {editingAddressIdx !== null ? t('Save Address Changes', 'পরিবর্তন সংরক্ষণ করুন') : t('Confirm & Save Destination', 'ঠিকানা সংরক্ষণ করুন')}
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl text-center"
            >
               <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-rose-500">
                  <ShieldAlert size={40} />
               </div>
               <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">{t('Are you absolutely sure?', 'আপনি কি সম্পূর্ণ নিশ্চিত?')}</h3>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed mb-10">
                 {t('This action will permanently purge your identity from our database. All orders, wishlists, and store data will be permanently erased.', 'এই পদক্ষেপের মাধ্যমে ডেটাবেস থেকে আপনার অ্যাকাউন্ট সম্পূর্ণ মুছে যাবে। আপনার সকল অর্ডার, পছন্দের তালিকা ও শপের তথ্য স্থায়ীভাবে মুছে যাবে।')}
               </p>
               <div className="space-y-3">
                  <button 
                    onClick={handleAccountDeletion}
                    className="w-full py-5 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-rose-200 hover:bg-rose-600 transition-all"
                  >
                    {t('Permanently Delete Account', 'অ্যাকাউন্ট স্থায়ীভাবে ডিলিট করুন')}
                  </button>
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full py-5 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all font-bold"
                  >
                    {t('Cancel', 'বাতিল করুন')}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="relative w-full max-w-4xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left Side: Items & Status */}
              <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <p className="text-[10px] text-brand-orange font-black uppercase tracking-widest mb-1 text-left">{t('Detailed Order View', 'অর্ডারের বিস্তারিত বিবরণ')}</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight uppercase text-left">{t('ORDER', 'অর্ডার')} #{selectedOrder.id}</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)} 
                    className="!fixed !top-[15px] !right-[15px] !z-[999999] w-12 h-12 bg-white/40 backdrop-blur-md text-gray-900 rounded-full shadow-2xl border border-white/40 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all group !transform-none"
                  >
                    <X size={24} className="transition-transform group-hover:rotate-90" />
                  </button>
                </div>

                <div className="space-y-12">
                  {/* Status Tracker */}
                  <div className="relative pt-2 pb-8">
                    <div className="absolute top-7 left-[10%] right-[10%] h-1 bg-gray-100 rounded-full" />
                    <div 
                      className="absolute top-7 left-[10%] h-1 bg-brand-orange rounded-full transition-all duration-1000" 
                      style={{ 
                        width: selectedOrder.status === 'delivered' ? '80%' : 
                               selectedOrder.status === 'shipped' ? '53.3%' : 
                               selectedOrder.status === 'processing' ? '26.6%' : '0%' 
                      }} 
                    />
                    
                    <div className="relative flex justify-between px-[5%]">
                      {['pending', 'processing', 'shipped', 'delivered'].map((step) => {
                        const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];
                        const currentIdx = statusSteps.indexOf(selectedOrder.status);
                        const stepIdx = statusSteps.indexOf(step);
                        const isCompleted = stepIdx <= currentIdx;
                        const isActive = stepIdx === currentIdx;
                        const stepLabel = step === 'pending' ? t('Pending', 'অপেক্ষমাণ') : step === 'processing' ? t('Processing', 'প্রক্রিয়াধীন') : step === 'shipped' ? t('Shipped', 'পাঠানো হয়েছে') : t('Delivered', 'ডেলিভার্ড');

                        return (
                          <div key={step} className="flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 z-10 ${
                              isCompleted ? 'bg-brand-orange text-white scale-110' : 'bg-white text-gray-300 border border-gray-100'
                            }`}>
                              {step === 'pending' && <Clock size={16} />}
                              {step === 'processing' && <Settings size={16} className={isActive ? 'animate-spin-slow' : ''} />}
                              {step === 'shipped' && <Truck size={16} />}
                              {step === 'delivered' && <CheckCircle2 size={16} />}
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                              {stepLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-6">
                    <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4 text-left">{t('Package Items', 'প্যাকেজের পণ্যসমূহ')} ({(selectedOrder.items?.length || 0)} {t('Items', 'টি পণ্য')})</h5>
                    <div className="grid grid-cols-1 gap-4 text-left">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={item.id ? `${item.id}-${idx}` : `item-${idx}`} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                          <img src={item.image} className="w-20 h-20 rounded-2xl object-cover shadow-sm" alt={item.name || 'Order item thumbnail'} />
                          <div className="flex-1">
                            <h6 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.name}</h6>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                              {t('Variant:', 'ধরন:')} {item.selectedSize || 'OS'} / {item.selectedColor || 'STOCK'} · {t('Qty:', 'পরিমাণ:')} {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-gray-900">৳{Math.round(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Info Panel */}
              <div className="w-full md:w-80 bg-gray-50/50 p-8 md:p-12 border-l border-gray-100 space-y-10 text-left">
                <div className="space-y-6">
                  <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{t('Delivery Info', 'ডেলিভারি তথ্য')}</h5>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-900 uppercase tracking-tight mb-1">{selectedOrder.address.fullName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
                          {selectedOrder.address.fullAddress}<br/>
                          {selectedOrder.address.upazila}, {selectedOrder.address.district}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h5 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{t('Financial Summary', 'পেমেন্ট সারসংক্ষেপ')}</h5>
                  <div className="space-y-3 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between text-[10px] font-black text-gray-900 uppercase">
                      <span>{t('Total Paid', 'মোট পরিশোধিত')}</span>
                      <span className="text-brand-orange text-xl">৳{selectedOrder.total.toLocaleString()}</span>
                    </div>
                    <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest mt-2">{selectedOrder.paymentMethod} {t('Payment Confirmed', 'পেমেন্ট নিশ্চিত')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/invoice/' + selectedOrder.id)}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={14} /> {t('Download Invoice', 'ইনভয়েস ডাউনলোড')}
                  </button>

                  {selectedOrder.cancellationRequested ? (
                    <div className="w-full py-3 px-4 bg-amber-50 text-amber-800 rounded-2xl text-[11px] font-bold text-center border border-amber-200 font-mono">
                      {t('Cancellation Request Submitted', 'বাতিলের অনুরোধ জমা হয়েছে')} ({selectedOrder.cancellationReason || t('Under Review by Admin', 'অ্যাডমিন পর্যালোচনাধীন')})
                    </div>
                  ) : ['pending', 'processing', 'confirmed'].includes(selectedOrder.status?.toLowerCase()) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCancelModalReason('');
                        setCancelModalOrderId(selectedOrder.id);
                      }}
                      className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer font-mono"
                    >
                      {t('Request Order Cancellation', 'অর্ডার বাতিলের অনুরোধ')}
                    </button>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRMATION MODALS */}
      <AnimatePresence>
        {(confirmDelete || confirmBulkDelete || confirmBulkRestore) && (
          <div className="fixed inset-0 z-[800] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setConfirmDelete(null);
                setConfirmBulkDelete(false);
                setConfirmBulkRestore(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl overflow-hidden text-center"
            >
              <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-lg ${
                confirmBulkRestore ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
              }`}>
                {confirmBulkRestore ? <RotateCcw size={40} /> : <Trash2 size={40} />}
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">
                {confirmBulkRestore ? t('Restore All Data?', 'সব ডেটা পুনরুদ্ধার করবেন?') : 
                 confirmBulkDelete ? t('Permanent Delete?', 'স্থায়ীভাবে মুছবেন?') : 
                 t('Delete Order?', 'অর্ডার ডিলিট করবেন?')}
              </h3>
              
              <p className="text-xs text-gray-400 font-medium uppercase tracking-widest leading-relaxed mb-10">
                {confirmBulkRestore ? t('Are you sure you want to restore all items from the trash to your main order history?', 'আপনি কি ট্র্যাশ থেকে সব আইটেম মূল অর্ডার তালিকায় ফিরিয়ে আনতে চান?') :
                 confirmBulkDelete ? t('This will permanently erase all deleted order logs from the system. This cannot be reversed.', 'এতে সিস্টেম থেকে ডিলিট করা সব অর্ডার স্থায়ীভাবে মুছে যাবে। এটি আর ফেরত আনা যাবে না।') :
                 t('Are you sure you want to move this order to the trash? You can still restore it later from the deleted logs.', 'আপনি কি এই অর্ডারটি ট্র্যাশে পাঠাতে চান? পরে আপনি এটি ট্র্যাশ বিন থেকে পুনরুদ্ধার করতে পারবেন।')}
              </p>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setConfirmDelete(null);
                    setConfirmBulkDelete(false);
                    setConfirmBulkRestore(false);
                  }}
                  className={`flex-1 h-14 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl ${
                    confirmBulkRestore 
                      ? 'bg-emerald-500 shadow-emerald-100 hover:bg-emerald-600' 
                      : 'bg-rose-500 shadow-rose-100 hover:bg-rose-600'
                  }`}
                >
                  {confirmBulkRestore ? t('Restore All', 'সব পুনরুদ্ধার করুন') : 
                   confirmBulkDelete ? t('Delete Forever', 'স্থায়ীভাবে মুছুন') : 
                   t('Confirm Delete', 'ডিলিট নিশ্চিত করুন')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AD CAMPAIGN CONFIGURATION MODAL */}
      <AnimatePresence>
        {promotingProduct && (
          <div className="fixed inset-0 z-[800] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPromotingProduct(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] p-6 md:p-10 shadow-2xl overflow-hidden border border-gray-100/50"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight font-display">{t('AD CAMPAIGN', 'অ্যাড ক্যাম্পেইন')}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t('Promote Product with Ads', 'বিজ্ঞাপনের মাধ্যমে পণ্য প্রমোট করুন')}</p>
                </div>
              </div>

              {/* Product Info Summary */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl border border-gray-100 mb-6 font-sans">
                <img src={promotingProduct.image} alt={promotingProduct.name} className="w-14 h-14 object-cover rounded-2xl border border-white shadow-md shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black text-brand-orange uppercase tracking-widest leading-none block">{promotingProduct.category}</span>
                  <h4 className="text-sm font-bold text-gray-900 truncate tracking-tight mt-1">{promotingProduct.name}</h4>
                  <p className="text-xs font-black text-gray-500 font-mono mt-1">৳{promotingProduct.price.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Active Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-3xl border border-gray-100 gap-3">
                  <div>
                    <span className="text-xs font-black text-gray-800 uppercase tracking-widest block font-display">{t('Activate Campaign', 'ক্যাম্পেইন চালু করুন')}</span>
                    <span className="text-[10px] text-gray-400 font-medium font-sans">{t('Show this product inside sponsored carousels', 'স্পনসরড সেকশনে এই পণ্যটি প্রদর্শন করুন')}</span>
                  </div>
                  <button 
                    onClick={() => setAdStatusInput(!adStatusInput)}
                    className={`relative w-14 h-8 rounded-full transition-colors flex items-center ${
                      adStatusInput ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  >
                    <motion.div 
                      layout
                      className="absolute left-1 w-6 h-6 rounded-full bg-white shadow-md"
                      animate={{ x: adStatusInput ? 24 : 0 }}
                    />
                  </button>
                </div>

                {/* Campaign Lifetime Budget */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#16171d]/50 p-1 font-mono">{t('Campaign Budget (৳ BDT)', 'ক্যাম্পেইন বাজেট (৳ টাকা)')}</label>
                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider font-mono bg-amber-50 px-2 py-0.5 rounded leading-none">{t('CPC: ৳3', 'প্রতি ক্লিক: ৳৩')}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-gray-400 font-display">৳</span>
                    <input 
                      type="number"
                      required
                      min={100}
                      step={50}
                      value={adBudgetInput}
                      onChange={(e) => setAdBudgetInput(parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-50 border-2 border-gray-50 focus:border-brand-orange focus:bg-white h-14 pl-10 pr-5 rounded-2xl outline-none transition-all text-sm font-black shadow-sm font-mono"
                      placeholder={t('e.g. 1000', 'যেমন: ১০০০')}
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 font-medium leading-relaxed pl-1 font-sans">
                    {t('Budget is deducted at ৳3 per ad click. The campaign pauses automatically once the budget is used up.', 'বাজেট সরাসরি পণ্যের বিজ্ঞাপন ক্লিকে খরচ হবে। প্রতি ক্লিকে ৩ টাকা হারে বাজেট শেষ হলে ক্যাম্পেইন বন্ধ হয়ে যাবে।')}
                  </p>
                </div>

                {/* Fast presets */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#16171d]/50 p-1 block font-display">{t('Quick Presets', 'দ্রুত বাজেট নির্ধারণ')}</span>
                  <div className="flex gap-2">
                    {[500, 1000, 2000, 5000].map((preset) => (
                      <button 
                        key={preset}
                        onClick={() => setAdBudgetInput(preset)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black font-mono tracking-tight transition-all border ${
                          adBudgetInput === preset 
                            ? 'bg-[#16171d] border-[#16171d] text-white shadow-xl' 
                            : 'bg-gray-50 border-gray-150 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        ৳{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Action Block */}
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setPromotingProduct(null)}
                    className="flex-1 h-14 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-gray-100"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                  <button 
                    onClick={() => {
                      if (adBudgetInput < 100) {
                        showToast(t('Minimum budget is ৳100 BDT', 'সর্বনিম্ন বাজেট ১০০ টাকা'), 'error');
                        return;
                      }
                      
                      const updatedProduct: Product = {
                        ...promotingProduct,
                        isSponsored: adStatusInput,
                        adBudget: adBudgetInput,
                        adStatus: adStatusInput ? 'active' : 'paused',
                        // Initialize counts safely if starting new campaign, else preserve stats
                        adClicks: promotingProduct.isSponsored ? promotingProduct.adClicks || 0 : 0,
                        adImpressions: promotingProduct.isSponsored ? promotingProduct.adImpressions || 0 : Math.floor(Math.random() * 100) + 120
                      };

                      onUpdateProduct(updatedProduct);
                      setPromotingProduct(null);
                      showToast(t(`Campaign configured successfully for ${promotingProduct.name}!`, `${promotingProduct.name}-এর বিজ্ঞাপন ক্যাম্পেইন সফলভাবে সেট হয়েছে!`), 'success');
                    }}
                    className="flex-1 h-14 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl"
                  >
                    {t('Save Campaign', 'সেভ করুন')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Digital Shop Seller Product Upload Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[700] flex items-center justify-center p-0 md:p-4">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-6xl h-full md:h-[95vh] bg-gray-50 md:rounded-[24px] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-white border-b border-gray-100 p-4 md:p-6 flex flex-col gap-4 shrink-0 sticky top-0 z-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-orange text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                        {editingProduct ? t('Edit Product', 'পণ্য সম্পাদনা করুন') : t('Add New Product', 'নতুন পণ্য যোগ করুন')}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t('Seller Center / Product Management', 'সেলার সেন্টার / পণ্য ব্যবস্থাপনা')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowAddModal(false)}
                      className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all border border-gray-100"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Validation Error Summary */}
                {Object.keys(productErrors).length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-4 overflow-hidden"
                  >
                    <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                       <ShieldAlert size={20} />
                    </div>
                    <div className="flex-1">
                       <h4 className="text-xs font-black text-rose-900 uppercase tracking-widest leading-none mb-1">{t('Form Validation Error', 'তথ্য প্রদানে ভুল পাওয়া গেছে')}</h4>
                       <p className="text-[10px] text-rose-600/70 font-medium leading-relaxed max-w-lg">
                          {t(
                            `${Object.keys(productErrors).length} required fields are invalid or missing: ${Object.values(productErrors).join(', ')}.`,
                            `আপনার ফর্মে ${Object.keys(productErrors).length}টি প্রয়োজনীয় তথ্য ভুল বা বাদ পড়েছে। অনুগ্রহ করে নিচের বিষয়গুলো চেক করুন: ${Object.values(productErrors).join(', ')}।`
                          )}
                       </p>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Form Sections */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-8 bg-gray-50/50">
                  
                  {/* Basic Information */}
                  <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                      <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center font-black text-xs">01</div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t('Basic Info', 'পণ্যের সাধারণ তথ্য')}</h4>
                      {Object.keys(productErrors).length > 0 && (
                        <div className="ml-auto flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 animate-pulse">
                          <CheckCircle2 size={14} className="text-rose-500" />
                          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">{t('Errors Found', 'ভুল পাওয়া গেছে')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2 space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Product Name *', 'পণ্যের নাম *')}</label>
                        <input 
                          type="text"
                          required
                          placeholder={t('What are you selling? (e.g. Samsung Galaxy S23 Ultra - 12GB RAM - 256GB)', 'আপনি কী বিক্রি করছেন? (যেমন: Samsung Galaxy S23 Ultra)')}
                          value={productFormData.name}
                          onChange={e => setProductFormData({...productFormData, name: e.target.value})}
                          className={`w-full bg-white border ${productErrors.name ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-gray-200'} rounded-2xl p-4 text-base font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all`}
                        />
                        {productErrors.name && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 animate-pulse">{productErrors.name}</p>
                        )}
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Brand', 'ব্র্যান্ড')}</label>
                        <input 
                          type="text"
                          placeholder={t('e.g. Samsung, Nike, No Brand', 'যেমন: Samsung, Nike, সাধারণ')}
                          value={productFormData.brand}
                          onChange={e => setProductFormData({...productFormData, brand: e.target.value})}
                          className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Category *', 'ক্যাটাগরি *')}</label>
                        <select 
                          required
                          value={productFormData.category}
                          onChange={e => setProductFormData({...productFormData, category: e.target.value})}
                          className={`w-full h-14 px-4 bg-white border ${productErrors.category ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-gray-200'} rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all cursor-pointer`}
                        >
                          <option value="" disabled>{t('Select Category', 'ক্যাটাগরি নির্বাচন করুন')}</option>
                          {CATEGORIES.filter(c => c !== 'All').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        {productErrors.category && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 animate-pulse">{productErrors.category}</p>
                        )}
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('SKU (Stock Keeping Unit)', 'SKU কোড')}</label>
                        <input 
                          type="text"
                          placeholder="e.g. PH-S23U-BLK"
                          value={productFormData.sku}
                          onChange={e => setProductFormData({...productFormData, sku: e.target.value})}
                          className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Product Condition', 'পণ্যের অবস্থা')}</label>
                        <div className="flex gap-4">
                          {[
                            { id: 'new', label: t('New', 'নতুন') },
                            { id: 'used', label: t('Used', 'ব্যবহৃত') },
                            { id: 'refurbished', label: t('Refurbished', 'রিফার্বিশড') }
                          ].map((cond) => (
                            <label key={cond.id} className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer text-[10px] font-black uppercase tracking-widest ${productFormData.condition === cond.id ? 'bg-orange-50 border-orange-500 text-brand-orange' : 'border-gray-50 text-gray-400 hover:border-gray-100 bg-gray-50'}`}>
                              <input 
                                type="radio" 
                                className="hidden" 
                                name="condition" 
                                checked={productFormData.condition === cond.id}
                                onChange={() => setProductFormData({...productFormData, condition: cond.id})} 
                              />
                              {cond.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Product Images */}
                  <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                      <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center font-black text-xs">02</div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t('Product Images (Max 7)', 'পণ্যের ছবি (সর্বোচ্চ ৭টি)')}</h4>
                      {productErrors.image && (
                        <div className="ml-auto px-4 py-1.5 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-2">
                           <AlertCircle size={14} className="text-rose-500" />
                           <span className="text-[10px] text-rose-600 font-black uppercase tracking-widest leading-none">{productErrors.image}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                        const imgUrl = i === 0 ? productFormData.image : (productFormData.gallery?.[i - 1] || '');
                        const fileInputId = `product-image-${i}`;
                        
                        return (
                          <div key={i} className="space-y-3">
                            <div 
                              onClick={() => document.getElementById(fileInputId)?.click()}
                              className="relative group aspect-square rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center justify-center gap-1 hover:border-orange-500/30 hover:bg-orange-50 transition-all cursor-pointer"
                            >
                              <input 
                                type="file" 
                                id={fileInputId}
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    // Verify if it is an image file
                                    if (!file.type.startsWith('image/')) {
                                      showToast(t('Only image files are allowed', 'শুধুমাত্র ছবি আপলোড করা যাবে'), 'error');
                                      return;
                                    }

                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const base64 = reader.result as string;

                                      // Duplicate detection using File Name, File Size, or Image Source
                                      let isDuplicate = false;
                                      for (let idx = 0; idx <= 6; idx++) {
                                        const otherMeta = uploadedImagesMeta[idx];
                                        if (otherMeta) {
                                          if (otherMeta.src === base64) {
                                            isDuplicate = true;
                                            break;
                                          }
                                          if (otherMeta.name === file.name && otherMeta.size === file.size) {
                                            isDuplicate = true;
                                            break;
                                          }
                                        }
                                        const otherSrc = idx === 0 ? productFormData.image : (productFormData.gallery?.[idx - 1] || '');
                                        if (otherSrc === base64) {
                                          isDuplicate = true;
                                          break;
                                        }
                                      }

                                      if (isDuplicate) {
                                        showToast(t('Duplicate image detected. Cannot use same image twice.', 'একই ছবি ২ বার ব্যবহার করা যাবে না'), 'error');
                                        return;
                                      }

                                      // Track meta
                                      setUploadedImagesMeta(prev => ({
                                        ...prev,
                                        [i]: { name: file.name, size: file.size, src: base64 }
                                      }));

                                      if (i === 0) setProductFormData({...productFormData, image: base64});
                                      else {
                                        const newGallery = [...(productFormData.gallery || [])];
                                        while(newGallery.length < 6) newGallery.push('');
                                        newGallery[i - 1] = base64;
                                        setProductFormData({...productFormData, gallery: newGallery});
                                      }
                                    };
                                    reader.onerror = () => {
                                      showToast(t('Failed to read image file', 'ছবি আপলোড ব্যর্থ হয়েছে'), 'error');
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              {imgUrl ? (
                                <>
                                  <img src={imgUrl} className="w-full h-full object-cover" alt="Product" />
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUploadedImagesMeta(prev => {
                                        const updated = {...prev};
                                        delete updated[i];
                                        return updated;
                                      });
                                      if (i === 0) setProductFormData({...productFormData, image: ''});
                                      else {
                                        const newGallery = [...(productFormData.gallery || [])];
                                        newGallery[i - 1] = '';
                                        setProductFormData({...productFormData, gallery: newGallery});
                                      }
                                    }}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 size={20} className="text-white" />
                                  </button>
                                </>
                              ) : (
                                <div className="flex flex-col items-center text-center p-2">
                                  <Upload size={20} className="text-gray-300 mb-1" />
                                  <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter leading-tight">
                                    {i === 0 ? t('Main Photo', 'প্রধান ছবি') : t(`Angle ${i}`, `ছবি ${i}`)}
                                  </span>
                                  <span className="text-[6px] text-gray-300 font-bold uppercase mt-0.5">{t('Click to Upload', 'আপলোড করুন')}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* URL Input below image */}
                            <div className="space-y-1">
                               <input 
                                 type="text"
                                 placeholder={t('Paste Link', 'লিংক দিন')}
                                 value={imgUrl.startsWith('data:') ? '' : imgUrl}
                                 onChange={(e) => {
                                   const url = e.target.value.trim();
                                   if (!url) {
                                     setUploadedImagesMeta(prev => {
                                       const updated = {...prev};
                                       delete updated[i];
                                       return updated;
                                     });
                                     if (i === 0) setProductFormData({...productFormData, image: ''});
                                     else {
                                       const newGallery = [...(productFormData.gallery || [])];
                                       while(newGallery.length < 6) newGallery.push('');
                                       newGallery[i - 1] = '';
                                       setProductFormData({...productFormData, gallery: newGallery});
                                     }
                                     return;
                                   }

                                   // Duplicate URL detection
                                   let isDuplicate = false;
                                   for (let idx = 0; idx <= 6; idx++) {
                                     if (idx === i) continue;
                                     const otherSrc = idx === 0 ? productFormData.image : (productFormData.gallery?.[idx - 1] || '');
                                     if (otherSrc && otherSrc === url) {
                                       isDuplicate = true;
                                       break;
                                     }
                                     const otherMeta = uploadedImagesMeta[idx];
                                     if (otherMeta && otherMeta.src === url) {
                                       isDuplicate = true;
                                       break;
                                     }
                                   }

                                   if (isDuplicate) {
                                     showToast(t('Duplicate image URL detected', 'একই ছবির লিংক ২ বার ব্যবহার করা যাবে না'), 'error');
                                     return;
                                   }

                                   // Track meta
                                   setUploadedImagesMeta(prev => ({
                                     ...prev,
                                     [i]: { name: '', size: 0, src: url }
                                   }));

                                   if (i === 0) setProductFormData({...productFormData, image: url});
                                   else {
                                     const newGallery = [...(productFormData.gallery || [])];
                                     while(newGallery.length < 6) newGallery.push('');
                                     newGallery[i - 1] = url;
                                     setProductFormData({...productFormData, gallery: newGallery});
                                   }
                                 }}
                                 className="w-full h-7 bg-white border border-gray-100 rounded-lg px-2 text-[8px] font-bold outline-none focus:border-orange-500/30 transition-all placeholder:text-gray-200"
                               />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Price & Stock */}
                  <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                      <div className="w-8 h-8 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center font-black text-xs">03</div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t('Price & Inventory', 'মূল্য ও স্টক')}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Regular Selling Price (৳) *', 'বিক্রয় মূল্য (৳) *')}</label>
                        <div className="relative">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black">৳</span>
                          <input 
                            type="number"
                            required
                            placeholder="0.00"
                            value={productFormData.price ?? ''}
                            onChange={e => setProductFormData({...productFormData, price: e.target.value})}
                            className={`w-full pl-10 pr-6 h-14 bg-white border ${productErrors.price ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-gray-200'} rounded-2xl text-lg font-black outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all`}
                          />
                        </div>
                        {productErrors.price && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 animate-pulse">{productErrors.price}</p>
                        )}
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Compare-at Price (Original) (৳)', 'পূর্বের মূল্য / ছাড়ের আগে (৳)')}</label>
                        <div className="relative opacity-60">
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black">৳</span>
                          <input 
                            type="number"
                            placeholder={t('e.g. 5000', 'যেমন: ৫০০০')}
                            value={productFormData.originalPrice ?? ''}
                            onChange={e => setProductFormData({...productFormData, originalPrice: e.target.value})}
                            className="w-full pl-10 pr-6 h-14 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Total Stock Quantity *', 'মোট স্টকের পরিমাণ *')}</label>
                        <div className="relative">
                          <Box className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                          <input 
                            type="number"
                            required
                            placeholder={t('e.g. 100', 'যেমন: ১০০')}
                            value={productFormData.stock ?? ''}
                            onChange={e => setProductFormData({...productFormData, stock: e.target.value})}
                            className={`w-full pl-12 pr-6 h-14 bg-white border ${productErrors.stock ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-gray-200'} rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono`}
                          />
                        </div>
                        {productErrors.stock && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 animate-pulse">{productErrors.stock}</p>
                        )}
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Min Order Quantity (MOQ)', 'সর্বনিম্ন অর্ডার পরিমাণ')}</label>
                        <input 
                          type="number"
                          placeholder={t('e.g. 1', 'যেমন: ১')}
                          value={productFormData.minOrderQuantity ?? ''}
                          onChange={e => setProductFormData({...productFormData, minOrderQuantity: e.target.value})}
                          className="w-full px-6 h-14 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </section>

                   {/* Variations */}
                  <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                      <div className="w-8 h-8 bg-purple-50 text-purple-500 rounded-lg flex items-center justify-center font-black text-xs">04</div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t('Variant Selection (Optional)', 'ভ্যারিয়েন্ট নির্বাচন (ঐচ্ছিক)')}</h4>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-3 text-left">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Sizes (e.g. S, M, L / 40, 42, 44)', 'সাইজ (যেমন: S, M, L / 40, 42, 44)')}</label>
                          <span className="text-[9px] bg-gray-50 px-2 py-0.5 rounded-md font-bold text-gray-400 uppercase tracking-wide border border-gray-100">{t('Optional', 'ঐচ্ছিক')}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {productFormData.variants.sizes.map((s: string, idx: number) => {
                            const isVal = validateSizeString(s);
                            return (
                              <span key={idx} className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all ${
                                isVal 
                                  ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' 
                                  : 'bg-orange-50/80 border-orange-200 text-orange-950 animate-pulse'
                              }`}>
                                {s}
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const newSizes = productFormData.variants.sizes.filter((_: any, i: number) => i !== idx);
                                    setProductFormData({...productFormData, variants: {...productFormData.variants, sizes: newSizes}});
                                  }}
                                  className="text-gray-400 hover:text-rose-500 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        <input 
                          type="text" 
                          placeholder={t('Type size and press Enter...', 'সাইজ লিখে Enter চাপুন...')}
                          value={sizeInputText}
                          onChange={(e) => setSizeInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = sizeInputText.trim();
                              if (val) {
                                if (!validateSizeString(val)) {
                                  showToast(t('Enter valid size (e.g. S, M, L / 40, 42)', 'সাইজ তথ্য সঠিকভাবে লিখুন (যেমন: S, M, L / 40, 42)'), 'warning');
                                }
                                if (!productFormData.variants.sizes.includes(val)) {
                                  setProductFormData({
                                    ...productFormData, 
                                    variants: {...productFormData.variants, sizes: [...productFormData.variants.sizes, val]}
                                  });
                                }
                                setSizeInputText('');
                              }
                            }
                          }}
                          className={`w-full bg-gray-50 border rounded-xl p-3 text-sm focus:bg-white transition-all outline-none border-dashed ${
                            getSizeStatus() === 'invalid' ? 'border-orange-500 ring-4 ring-orange-500/10 focus:border-orange-600 focus:bg-orange-50/5' :
                            getSizeStatus() === 'valid' ? 'border-emerald-500 ring-4 ring-emerald-500/10 focus:border-emerald-600 focus:bg-emerald-50/5' :
                            'border-gray-200 focus:border-orange-500'
                          }`}
                        />
                        {getSizeStatus() === 'invalid' && (
                          <p className="text-[10px] text-orange-600 font-bold mt-1 ml-1 animate-pulse flex items-center gap-1">
                            <span>⚠</span> {t('Enter valid size entries (e.g. S, M, L / 40, 42)', 'সাইজ তথ্য সঠিকভাবে লিখুন (যেমন: S, M, L / 40, 42)')}
                          </p>
                        )}
                        {getSizeStatus() === 'valid' && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-1 ml-1 flex items-center gap-1">
                            <span>✓</span> {t('Valid size entries', 'সাইজ তথ্য সঠিক আছে')}
                          </p>
                        )}
                      </div>
 
                      <div className="space-y-3 text-left">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Colors (e.g. Red, Black, Blue)', 'রঙ (যেমন: Red, Black, Blue)')}</label>
                          <span className="text-[9px] bg-gray-50 px-2 py-0.5 rounded-md font-bold text-gray-400 uppercase tracking-wide border border-gray-100">{t('Optional', 'ঐচ্ছিক')}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {productFormData.variants.colors.map((c: string, idx: number) => {
                            const isVal = validateColorString(c);
                            return (
                              <span key={idx} className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all ${
                                isVal 
                                  ? 'bg-emerald-50/50 border-emerald-100 text-emerald-950' 
                                  : 'bg-orange-50/80 border-orange-200 text-orange-950 animate-pulse'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${isVal ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                {c}
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const newColors = productFormData.variants.colors.filter((_: any, i: number) => i !== idx);
                                    setProductFormData({...productFormData, variants: {...productFormData.variants, colors: newColors}});
                                  }}
                                  className="text-gray-400 hover:text-rose-500 transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        <input 
                          type="text" 
                          placeholder={t('Type color and press Enter...', 'রঙ লিখে Enter চাপুন...')}
                          value={colorInputText}
                          onChange={(e) => setColorInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = colorInputText.trim();
                              if (val) {
                                if (!validateColorString(val)) {
                                  showToast(t('Enter valid color (e.g. Red, Black, Blue)', 'কালারের তথ্য সঠিক নয় (যেমন: Red, Black, Blue)'), 'warning');
                                }
                                if (!productFormData.variants.colors.includes(val)) {
                                  setProductFormData({
                                    ...productFormData, 
                                    variants: {...productFormData.variants, colors: [...productFormData.variants.colors, val]}
                                  });
                                }
                                setColorInputText('');
                              }
                            }
                          }}
                          className={`w-full bg-gray-50 border rounded-xl p-3 text-sm focus:bg-white transition-all outline-none border-dashed ${
                            getColorStatus() === 'invalid' ? 'border-orange-500 ring-4 ring-orange-500/10 focus:border-orange-600 focus:bg-orange-50/5' :
                            getColorStatus() === 'valid' ? 'border-emerald-500 ring-4 ring-emerald-500/10 focus:border-emerald-600 focus:bg-emerald-50/5' :
                            'border-gray-200 focus:border-orange-500'
                          }`}
                        />
                        {getColorStatus() === 'invalid' && (
                          <p className="text-[10px] text-orange-600 font-bold mt-1 ml-1 animate-pulse flex items-center gap-1">
                            <span>⚠</span> {t('Invalid color format (e.g. Red, Black, Blue)', 'কালারের তথ্য সঠিক নয় (যেমন: Red, Black, Blue)')}
                          </p>
                        )}
                        {getColorStatus() === 'valid' && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-1 ml-1 flex items-center gap-1">
                            <span>✓</span> {t('Valid color entries', 'কালারের তথ্য সঠিক আছে')}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Delivery & Options */}
                  <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center font-black text-xs">05</div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t('Delivery Settings', 'ডেলিভারি তথ্য')}</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Delivery Time (Standard)', 'ডেলিভারি সময়')}</label>
                        <select 
                          value={productFormData.deliveryTime}
                          onChange={e => setProductFormData({...productFormData, deliveryTime: e.target.value})}
                          className="w-full h-14 px-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all cursor-pointer"
                        >
                          <option value="1-2 days">{t('Fast (1-2 Days)', 'দ্রুত (১-২ দিন)')}</option>
                          <option value="2-3 days">{t('Standard (2-3 Days)', 'সাধারণ (২-৩ দিন)')}</option>
                          <option value="3-5 days">{t('Normal (3-5 Days)', 'স্বাভাবিক (৩-৫ দিন)')}</option>
                          <option value="7-10 days">{t('Extended (7-10 Days)', 'বর্ধিত (৭-১০ দিন)')}</option>
                        </select>
                      </div>

                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Shipping Fee (৳)', 'ডেলিভারি চার্জ (৳)')}</label>
                        <input 
                          type="number"
                          value={productFormData.deliveryFee || ''}
                          onChange={e => setProductFormData({...productFormData, deliveryFee: Number(e.target.value)})}
                          className="w-full px-6 h-14 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono"
                          placeholder={t('e.g. 60', 'যেমন: ৬০')}
                        />
                      </div>

                      <div className="md:col-span-2 p-6 bg-gray-50 rounded-2xl flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100">
                               <Wallet size={18} />
                            </div>
                            <div>
                               <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{t('Cash on Delivery (COD)', 'ক্যাশ অন ডেলিভারি (COD)')}</p>
                               <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{t('Allow customers to pay at their doorstep', 'ক্রেতাদের পণ্য হাতে পেয়ে মূল্য পরিশোধের সুযোগ দিন')}</p>
                            </div>
                         </div>
                         <button 
                          type="button"
                          onClick={() => setProductFormData({...productFormData, codAllowed: !productFormData.codAllowed})}
                          className={`w-14 h-8 rounded-full relative transition-all duration-300 ${productFormData.codAllowed ? 'bg-emerald-500 shadow-lg shadow-emerald-100' : 'bg-gray-200'}`}
                         >
                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${productFormData.codAllowed ? 'left-7' : 'left-1'}`} />
                         </button>
                      </div>
                    </div>
                  </section>

                  {/* Description */}
                  <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                      <div className="w-8 h-8 bg-sky-50 text-sky-500 rounded-lg flex items-center justify-center font-black text-xs">06</div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t('Product Description', 'পণ্যের বর্ণনা')}</h4>
                    </div>
                    
                    <div className="space-y-4 text-left">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Detailed Description', 'বিস্তারিত বিবরণ')}</label>
                       <textarea 
                        required
                        value={productFormData.description}
                        onChange={e => setProductFormData({...productFormData, description: e.target.value})}
                        className={`w-full bg-white border ${productErrors.description ? 'border-rose-500 ring-4 ring-rose-500/10' : 'border-gray-200'} rounded-3xl p-6 text-sm font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all min-h-[300px] shadow-sm resize-none`}
                        placeholder={t('Detail your product specifications, features, and benefits...', 'পণ্যের বৈশিষ্ট্য, উপাদান ও সুবিধাসমূহ বিস্তারিত লিখুন...')}
                       />
                       {productErrors.description && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1 animate-pulse">{productErrors.description}</p>
                        )}
                    </div>
                  </section>

                  {/* Tags & Search */}
                  <section className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100 space-y-8">
                    <div className="flex items-center gap-3 border-b border-gray-50 pb-6">
                      <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center font-black text-xs">07</div>
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t('SEO & Tags', 'সার্চ এবং ট্যাগ')}</h4>
                    </div>
                    
                    <div className="space-y-4 text-left">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t('Search Tags (Max 5)', 'সার্চ ট্যাগ (সর্বোচ্চ ৫টি)')}</label>
                       <div className="flex flex-wrap gap-2 mb-2">
                          {(productFormData.tags || []).map((tag: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                              #{tag}
                              <button 
                                type="button"
                                onClick={() => {
                                  const newTags = productFormData.tags.filter((_: any, i: number) => i !== idx);
                                  setProductFormData({...productFormData, tags: newTags});
                                }}
                                className="text-rose-300 hover:text-rose-600"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                       </div>
                       <input 
                        type="text" 
                        placeholder={t('Type tag and press Enter...', 'ট্যাগ লিখে Enter চাপুন...')}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.currentTarget as HTMLInputElement).value.trim().replace(/^#/, '');
                            if (val && !(productFormData.tags || []).includes(val) && (productFormData.tags || []).length < 5) {
                              setProductFormData({
                                ...productFormData, 
                                tags: [...(productFormData.tags || []), val]
                              });
                              (e.currentTarget as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:bg-white transition-all outline-none shadow-sm"
                       />
                    </div>
                  </section>
                </div>

                {/* Live Preview Panel */}
                <div className="w-full lg:w-[400px] bg-white border-l border-gray-100 overflow-y-auto custom-scrollbar p-8 hidden lg:block sticky top-0">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                    <Eye className="text-brand-orange" size={18} />
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">{t('Live Product Preview', 'লাইভ প্রোডাক্ট প্রিভিউ')}</h4>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Preview Card */}
                    <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/50 group">
                      <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                        {productFormData.image ? (
                          <img src={productFormData.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Preview" />
                        ) : (
                          <div className="flex flex-col items-center text-gray-200">
                             <ImageIcon size={64} strokeWidth={1} />
                             <p className="text-[10px] font-black uppercase mt-2">{t('No Image Selected', 'ছবি নির্বাচন করা হয়নি')}</p>
                          </div>
                        )}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                           <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-gray-100 shadow-sm">
                             {productFormData.category}
                           </div>
                           {productFormData.originalPrice > productFormData.price && (
                             <div className="bg-rose-500 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg shadow-rose-200">
                               -{Math.round(((productFormData.originalPrice - productFormData.price) / productFormData.originalPrice) * 100)}% {t('OFF', 'ছাড়')}
                             </div>
                           )}
                        </div>
                      </div>
                      <div className="p-6 space-y-3 text-left">
                        <div className="flex items-center justify-between">
                           <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{productFormData.brand}</span>
                           <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => <Star key={s} size={8} className="text-yellow-400 fill-yellow-400" />)}
                           </div>
                        </div>
                        <h5 className="text-[14px] font-black text-gray-900 uppercase tracking-tight line-clamp-2 leading-snug">
                          {productFormData.name}
                        </h5>
                        <div className="pt-2 flex items-baseline gap-2">
                          <p className="text-2xl font-black text-brand-orange tracking-tighter">৳{(Number(productFormData.price) || 0).toLocaleString()}</p>
                          {productFormData.originalPrice && Number(productFormData.originalPrice) > Number(productFormData.price) && (
                            <p className="text-xs text-gray-300 font-bold line-through">৳{Number(productFormData.originalPrice).toLocaleString()}</p>
                          )}
                        </div>
                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                           <div className="flex items-center gap-1.5 text-emerald-500">
                             <CheckCircle size={10} />
                             <span className="text-[9px] font-black uppercase tracking-widest">{t('In Stock', 'স্টকে আছে')} ({productFormData.stock || 0})</span>
                           </div>
                           {productFormData.deliveryFee && (
                             <div className="flex items-center gap-1.5 text-blue-500">
                               <Truck size={10} />
                               <span className="text-[9px] font-black uppercase tracking-widest">৳{productFormData.deliveryFee}</span>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>

                      <div className="pt-8">
                       <button 
                        onClick={handleProductSubmit}
                        disabled={isSaving}
                        className={`w-full py-5 rounded-[22px] text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${
                          !isSaving
                          ? 'bg-brand-orange text-white shadow-orange-500/30 hover:scale-[1.03] active:scale-95' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        }`}
                       >
                         {isSaving ? <RotateCcw size={18} className="animate-spin" /> : <Save size={18} />}
                         {editingProduct ? t('Update Product', 'পণ্য আপডেট করুন') : t('Submit for Review', 'অনুমোদনের জন্য জমা দিন')}
                       </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Footer Action */}
              <div className="lg:hidden p-4 bg-white border-t border-gray-100 flex gap-3 shrink-0">
                  <button 
                    onClick={handleProductSubmit}
                    disabled={isSaving}
                    className="flex-1 py-4 bg-brand-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : (editingProduct ? t('Update Product', 'পণ্য আপডেট করুন') : t('Submit for Review', 'অনুমোদনের জন্য জমা দিন'))}
                  </button>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Delete Confirmation Modal */}
      <AnimatePresence>
        {pendingDeleteProductId && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Trash2 size={22} />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-base font-black text-gray-900">
                  {t('Delete Product?', 'পণ্যটি মুছে ফেলবেন?')}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {t('Delete this product? It will be removed from your store.', 'এই পণ্যটি ডিলিট করতে চান? এটি আপনার শপ থেকে মুছে ফেলা হবে।')}
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setPendingDeleteProductId(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button
                  type="button"
                  onClick={executeRemoveProduct}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
                >
                  {t('Delete', 'মুছে ফেলুন')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Cancellation Reason Modal */}
      <AnimatePresence>
        {cancelModalOrderId && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-base font-black text-gray-900">
                  {t('Request Order Cancellation', 'অর্ডার বাতিলের অনুরোধ')}
                </h4>
                <button
                  type="button"
                  onClick={() => setCancelModalOrderId(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 block">
                  {t('Please provide a reason for cancelling this order:', 'অর্ডারটি বাতিল করার কারণ লিখুন:')}
                </label>
                <textarea
                  rows={3}
                  value={cancelModalReason}
                  onChange={(e) => setCancelModalReason(e.target.value)}
                  placeholder={t('e.g., Ordered by mistake or changing delivery address', 'যেমন: ভুলবশত অর্ডার করা হয়েছে বা ঠিকানা পরিবর্তন করতে চাই')}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800 outline-none focus:border-brand-orange focus:bg-white transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCancelModalOrderId(null)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button
                  type="button"
                  disabled={!cancelModalReason.trim()}
                  onClick={() => {
                    const targetId = cancelModalOrderId;
                    const reason = cancelModalReason.trim();
                    if (!targetId || !reason) return;
                    setCancelModalOrderId(null);
                    setCancelModalReason('');
                    handleCancelOrder(targetId, reason);
                  }}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/25 transition-all cursor-pointer"
                >
                  {t('Submit Request', 'অনুরোধ পাঠান')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
