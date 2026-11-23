import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, ArrowLeft, CreditCard, Truck, CheckCircle2, Ticket, ShieldCheck, Phone, 
  Landmark, MapPin, RotateCcw, Plus, AlertCircle, Edit2, Lock, Tag, 
  ChevronDown, ChevronUp, Clock, Banknote, Sparkles, Eye, Check, Copy
} from 'lucide-react';
import { CartItem, Address, Order, User as UserType } from '../types';
import { useToast } from '../components/Toast';
import { DIVISIONS, DISTRICTS, getUpazilasForDistrict } from '../constants/locations';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { couponApi, paymentApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

// Custom Searchable Dropdown for Division / District / Upazila
const SearchableSelect: React.FC<{
  label: string;
  value: string;
  options: { id: string | number; name: string; bn_name?: string }[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}> = ({ label, value, options, onChange, placeholder, disabled, required, error }) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.bn_name && opt.bn_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedOption = options.find(opt => String(opt.id) === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-gray-600 flex items-center justify-between">
        <span>{label} {required && <span className="text-rose-500">*</span>}</span>
        {selectedOption?.bn_name && (
          <span className="text-[10px] text-gray-400 font-normal">{selectedOption.bn_name}</span>
        )}
      </label>

      <div 
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
          }
        }}
        className={`w-full min-h-[48px] rounded-xl px-4 py-3 text-sm font-medium cursor-pointer flex justify-between items-center transition-all border ${
          disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400' 
            : error 
            ? 'border-rose-400 bg-rose-50/20 text-gray-900 focus:ring-4 focus:ring-rose-500/10' 
            : value 
            ? 'border-emerald-300 bg-emerald-50/10 text-gray-900 shadow-xs' 
            : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
        }`}
      >
        <span className={selectedOption ? 'text-gray-900 font-semibold truncate' : 'text-gray-400'}>
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span>{language === 'bn' && selectedOption.bn_name ? selectedOption.bn_name : selectedOption.name}</span>
              {language === 'en' && selectedOption.bn_name && (
                <span className="text-xs text-gray-400 font-normal">({selectedOption.bn_name})</span>
              )}
            </span>
          ) : placeholder}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-brand-orange' : ''}`} />
      </div>

      {error && (
        <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </p>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 z-[120] overflow-hidden max-h-64 flex flex-col"
          >
            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
              <input 
                type="text"
                autoFocus
                placeholder={t('Type to filter...', 'ফিল্টার করতে লিখুন...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 bg-gray-50/60"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
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
                    className={`px-4 py-2.5 text-xs hover:bg-orange-50/60 cursor-pointer transition-colors flex items-center justify-between ${
                      value === String(opt.id) ? 'bg-orange-50 text-brand-orange font-bold' : 'text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{language === 'bn' && opt.bn_name ? opt.bn_name : opt.name}</span>
                    {opt.bn_name && (
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-sans">
                        {language === 'bn' ? opt.name : opt.bn_name}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-gray-400">
                  {t('No matching location found', 'কোনো মিল খুঁজে পাওয়া যায়নি')}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Formats phone numbers nicely like 01712-345678 (normalizes +88 / 88 prefixes)
const normalizeBDPhone = (raw: string): string => {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length >= 13) {
    digits = digits.slice(2);
  } else if (digits.startsWith('88') && digits.length >= 13) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 11);
};

const formatBDPhone = (raw: string): string => {
  const digits = normalizeBDPhone(raw);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 11)}`;
};

const formatCardNumber = (raw: string): string => {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

const formatCardExpiry = (raw: string): string => {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
};

const isValidCardLuhn = (raw: string): boolean => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
};

const detectCardBrand = (raw: string): string => {
  const d = String(raw || '').replace(/\D/g, '');
  if (/^4/.test(d)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard';
  if (/^3[47]/.test(d)) return 'Amex';
  return 'Card';
};

interface CheckoutPageProps {
  cart: CartItem[];
  subtotal: number;
  user: UserType | null;
  onUpdateUser: (user: UserType) => void;
  onPlaceOrder: (order: Order, options?: { skipSuccessModal?: boolean }) => Promise<Order> | void;
  onUpdateQuantity: (id: string, delta: number, size?: string, color?: string) => void;
  onToggleSelection: (id: string, size?: string, color?: string) => void;
  onSelectAll: (selected: boolean) => void;
  onRemove: (id: string, size?: string, color?: string) => void;
  onSetQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ 
  cart, 
  subtotal,
  user,
  onUpdateUser,
  onPlaceOrder,
  onUpdateQuantity,
  onToggleSelection,
  onSelectAll,
  onRemove,
  onSetQuantity
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { siteConfig } = useSiteConfig();
  const { language, t } = useLanguage();
  
  // Steps: 1 = Delivery Info, 2 = Payment Method (synced with URL search params for SPA Back/Forward support)
  const stepParam = searchParams.get('step');
  const [step, setStepState] = useState<1 | 2>(stepParam === 'payment' ? 2 : 1);

  const setStep = (newStep: 1 | 2 | ((prev: 1 | 2) => 1 | 2)) => {
    const resolvedStep = typeof newStep === 'function' ? newStep(step) : newStep;
    setStepState(resolvedStep);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (resolvedStep === 2) {
        next.set('step', 'payment');
      } else {
        next.delete('step');
      }
      return next;
    });
  };

  useEffect(() => {
    const s = searchParams.get('step');
    if (s === 'payment' && step !== 2) {
      setStepState(2);
    } else if ((!s || s === 'delivery') && step !== 1) {
      setStepState(1);
    }
  }, [searchParams]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Coupon state with session persistence across route navigation
  const [isCouponExpanded, setIsCouponExpanded] = useState(false);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ 
    code: string; 
    discountType?: 'percentage' | 'fixed';
    discount?: number;
    maxDiscount?: number;
    minSpend?: number;
    discountRate?: number; 
    flatDiscount?: number; 
    freeShipping?: boolean;
    couponId?: string;
  } | null>(() => {
    try {
      const saved = sessionStorage.getItem('elora-applied-coupon') || localStorage.getItem('elora-applied-coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (appliedCoupon) {
      try {
        sessionStorage.setItem('elora-applied-coupon', JSON.stringify(appliedCoupon));
      } catch {}
    } else {
      try {
        sessionStorage.removeItem('elora-applied-coupon');
      } catch {}
    }
  }, [appliedCoupon]);

  // Hover image preview
  const [hoveredPreviewImage, setHoveredPreviewImage] = useState<{ url: string; name: string; x: number; y: number } | null>(null);

  // Mobile Order Summary collapse toggle
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  // Payment selection & interactive gateway verification state
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [transactionId, setTransactionId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [merchantNumbers, setMerchantNumbers] = useState<Record<string, string>>({
    bkash: '01700-112233',
    nagad: '01700-112233',
    rocket: '01700-112233'
  });
  const [copiedMerchant, setCopiedMerchant] = useState(false);
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verifiedPayment, setVerifiedPayment] = useState<{
    method: string;
    amountBDT: number;
    paymentId: string;
    transactionId: string;
    paymentStatus: string;
    senderNumber?: string;
    cardBrand?: string;
    cardLast4?: string;
  } | null>(null);

  useEffect(() => {
    paymentApi.getMethods().then((res) => {
      if (res?.methods && Array.isArray(res.methods)) {
        const next: Record<string, string> = {};
        for (const m of res.methods) {
          if (m.merchantNumber) next[m.id] = m.merchantNumber;
        }
        if (Object.keys(next).length > 0) {
          setMerchantNumbers(prev => ({ ...prev, ...next }));
        }
      }
    }).catch(() => {});
  }, []);

  // Selected saved address index & confirmed address snapshot (supports guests & unsaved addresses)
  const [selectedAddressIdx, setSelectedAddressIdx] = useState<number | null>(() => {
    if (user && user.addresses && user.addresses.length > 0) {
      const defaultIdx = user.addresses.findIndex(a => a.isDefault);
      return defaultIdx !== -1 ? defaultIdx : 0;
    }
    return null;
  });
  const [confirmedAddress, setConfirmedAddress] = useState<Address | null>(null);

  // New or Edit Address form state
  const [isAddressFormOpen, setIsAddressFormOpen] = useState<boolean>(() => {
    return !user || !user.addresses || user.addresses.length === 0;
  });
  const [editingAddressIdx, setEditingAddressIdx] = useState<number | null>(null);
  const [saveToProfile, setSaveToProfile] = useState<boolean>(true);

  const [addressForm, setAddressForm] = useState<Address>({
    fullName: user?.name || '',
    phone: user?.phone || '',
    division: '',
    district: '',
    upazila: '',
    fullAddress: '',
    isDefault: false
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Validation functions
  const validateFullName = (name: string): string => {
    if (!name.trim()) return t('Full Name is required', 'আপনার পুরো নাম লিখুন');
    if (name.trim().length < 3) return t('Name must be at least 3 characters long', 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে');
    if (!/^[a-zA-Z\s\u0980-\u09FF.'-]+$/.test(name.trim())) {
      return t('Name contains invalid characters (Only letters allowed)', 'নামে অবৈধ অক্ষর রয়েছে (শুধুমাত্র অক্ষর ব্যবহার করুন)');
    }
    return '';
  };

  const validatePhone = (phone: string): string => {
    const raw = phone.replace(/\D/g, '');
    if (!raw) return t('Mobile number is required', 'মোবাইল নম্বর লিখুন');
    if (!/^(?:\+88|88)?(01[3-9]\d{8})$/.test(raw)) {
      return t('Please enter a valid 11-digit BD mobile number (e.g. 01712-345678)', 'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712-345678)');
    }
    return '';
  };

  const validateFullAddress = (addr: string): string => {
    if (!addr.trim()) return t('Detailed address is required', 'বিস্তারিত ঠিকানা লিখুন');
    if (addr.trim().length < 8) return t('Please provide more details (House, Road, Area, etc.)', 'অনুগ্রহ করে বিস্তারিত ঠিকানা লিখুন (বাসা, রোড, এলাকা ইত্যাদি)');
    return '';
  };

  const handleFieldChange = (field: keyof Address, value: any) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));

    if (field === 'phone') {
      const formatted = formatBDPhone(value);
      setAddressForm(prev => ({ ...prev, phone: formatted }));
      const err = validatePhone(formatted);
      setFormErrors(prev => ({ ...prev, phone: err }));
    } else if (field === 'fullName') {
      setAddressForm(prev => ({ ...prev, fullName: value }));
      const err = validateFullName(value);
      setFormErrors(prev => ({ ...prev, fullName: err }));
    } else if (field === 'fullAddress') {
      setAddressForm(prev => ({ ...prev, fullAddress: value }));
      const err = validateFullAddress(value);
      setFormErrors(prev => ({ ...prev, fullAddress: err }));
    } else if (field === 'division') {
      // Reset district and upazila on division change
      setAddressForm(prev => ({ ...prev, division: value, district: '', upazila: '' }));
      setFormErrors(prev => ({ ...prev, division: value ? '' : t('Please select a Division', 'একটি বিভাগ নির্বাচন করুন'), district: '', upazila: '' }));
    } else if (field === 'district') {
      // Reset upazila on district change
      setAddressForm(prev => ({ ...prev, district: value, upazila: '' }));
      setFormErrors(prev => ({ ...prev, district: value ? '' : t('Please select a District', 'একটি জেলা নির্বাচন করুন'), upazila: '' }));
    } else if (field === 'upazila') {
      setAddressForm(prev => ({ ...prev, upazila: value }));
      setFormErrors(prev => ({ ...prev, upazila: value ? '' : t('Please select an Upazila', 'একটি উপজেলা নির্বাচন করুন') }));
    } else {
      setAddressForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const savedSelectedAddress: Address | null =
    selectedAddressIdx !== null && user?.addresses?.[selectedAddressIdx]
      ? user.addresses[selectedAddressIdx]
      : null;

  const currentAddress: Address | null = isAddressFormOpen
    ? addressForm
    : confirmedAddress || savedSelectedAddress;

  // Keep Step 2 safe on direct reload if no address exists yet
  useEffect(() => {
    if (step === 2 && !currentAddress) {
      setStep(1);
    }
  }, [step, currentAddress]);

  // Selected items calculation
  const selectedCartItems = cart.filter(item => item.selected);
  const selectedSubtotal = selectedCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isAllSelected = cart.length > 0 && cart.every(i => i.selected);

  // Currency, Payment availability & Coupon visibility
  const currencySymbol = siteConfig?.currencySymbol || '৳';
  const isCodAvailable = siteConfig?.enableCOD !== false;
  const isMobileWalletAvailable = siteConfig?.enableBkashNagad !== false;
  const isCardAvailable = siteConfig?.enableCard !== false;
  const isCouponEnabled = siteConfig?.showCouponCode === true;

  useEffect(() => {
    const enabledIds = [
      ...(isCodAvailable ? ['cod'] : []),
      ...(isMobileWalletAvailable ? ['bkash', 'nagad', 'rocket'] : []),
      ...(isCardAvailable ? ['card'] : [])
    ];
    if (enabledIds.length > 0 && !enabledIds.includes(paymentMethod)) {
      setPaymentMethod(enabledIds[0]);
      setVerifiedPayment(null);
      setGeneralError(null);
    }
  }, [isCodAvailable, isMobileWalletAvailable, isCardAvailable, paymentMethod]);

  useEffect(() => {
    if (!isCouponEnabled) {
      setAppliedCoupon(null);
      setCouponCodeInput('');
      setIsCouponExpanded(false);
    }
  }, [isCouponEnabled]);

  // Delivery zone & estimation calculations (100% synchronized with backend)
  const deliveryZone: 'dhaka' | 'sub-dhaka' | 'outside' = !currentAddress?.division
    ? 'dhaka'
    : currentAddress.division === '3' && currentAddress.district === '18'
    ? 'dhaka'
    : currentAddress.division === '3'
    ? 'sub-dhaka'
    : 'outside';
  const isDhaka = deliveryZone !== 'outside';
  const isDhakaCity = deliveryZone === 'dhaka';
  
  const currentDeliveryDuration = isDhakaCity 
    ? (siteConfig?.deliveryDaysDhaka || t('1 - 2 Days', '১ - ২ দিন'))
    : isDhaka 
    ? (siteConfig?.deliveryDaysSubDhaka || t('2 - 3 Days', '২ - ৩ দিন'))
    : (siteConfig?.deliveryDaysOutside || t('2 - 4 Days', '২ - ৪ দিন'));

  const subtotalBDT = Math.round(selectedSubtotal);
  const isFreeDeliveryQualified = (siteConfig?.freeShippingThreshold || 0) > 0 && subtotalBDT >= (siteConfig?.freeShippingThreshold || 0);

  let baseDeliveryFee = 0;
  if (selectedCartItems.length > 0) {
    if (appliedCoupon?.freeShipping || isFreeDeliveryQualified) {
      baseDeliveryFee = 0;
    } else if (currentAddress) {
      baseDeliveryFee = deliveryZone === 'dhaka'
        ? (siteConfig?.deliveryFeeDhaka ?? 60) 
        : deliveryZone === 'sub-dhaka'
        ? (siteConfig?.deliveryFeeSubDhaka ?? 100) 
        : (siteConfig?.deliveryFeeOutside ?? 120);
    } else {
      baseDeliveryFee = siteConfig?.deliveryFeeDhaka ?? 60;
    }
  }

  const codFee = (paymentMethod === 'cod' && selectedCartItems.length > 0) ? (siteConfig?.codHandlingFee ?? 0) : 0;
  
  let calculatedDiscountBDT = 0;
  if (appliedCoupon) {
    const meetsMinSpend = !appliedCoupon.minSpend || subtotalBDT >= Number(appliedCoupon.minSpend);
    if (meetsMinSpend) {
      if (appliedCoupon.discountType === 'percentage' && appliedCoupon.discount !== undefined) {
        let amt = Math.round((subtotalBDT * Number(appliedCoupon.discount)) / 100);
        if (appliedCoupon.maxDiscount && amt > Number(appliedCoupon.maxDiscount)) {
          amt = Number(appliedCoupon.maxDiscount);
        }
        calculatedDiscountBDT = amt;
      } else if (appliedCoupon.discountType === 'fixed' && appliedCoupon.discount !== undefined) {
        calculatedDiscountBDT = Math.round(Math.min(Number(appliedCoupon.discount), subtotalBDT));
      } else if (appliedCoupon.discountRate) {
        calculatedDiscountBDT = Math.round(subtotalBDT * appliedCoupon.discountRate);
      } else if (appliedCoupon.flatDiscount) {
        calculatedDiscountBDT = Math.min(appliedCoupon.flatDiscount, subtotalBDT);
      }
    }
  }

  const totalInBDT = Math.max(0, Math.round(subtotalBDT + baseDeliveryFee + codFee - calculatedDiscountBDT));

  const today = new Date();
  const getEstimatedDates = () => {
    const minDays = isDhaka ? 1 : 3;
    const maxDays = isDhaka ? 2 : 5;
    const start = new Date(today.getTime() + minDays * 24 * 60 * 60 * 1000);
    const end = new Date(today.getTime() + maxDays * 24 * 60 * 60 * 1000);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const locale = language === 'bn' ? 'bn-BD' : 'en-US';
    return `${start.toLocaleDateString(locale, options)} – ${end.toLocaleDateString(locale, options)}`;
  };

  const handleApplyCoupon = async () => {
    if (!isCouponEnabled) return;
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      showToast(t('Please enter a coupon code', 'অনুগ্রহ করে একটি কুপন কোড লিখুন'), 'error');
      return;
    }

    try {
      const res = await couponApi.validateCoupon(code, subtotalBDT, user?.email);
      if (res.valid && res.coupon) {
        setAppliedCoupon({
          code: res.coupon.code,
          discountType: res.coupon.discountType,
          discount: res.coupon.discount,
          maxDiscount: res.coupon.maxDiscount,
          minSpend: res.coupon.minSpend,
          freeShipping: Boolean(res.coupon.freeShipping),
          flatDiscount: res.discountBDT,
          couponId: res.coupon.id
        });
        showToast(
          t(
            `Coupon ${res.coupon.code} applied! Saved ৳${res.discountBDT?.toLocaleString()}`,
            `কুপন ${res.coupon.code} সফলভাবে প্রয়োগ হয়েছে! ৳${res.discountBDT?.toLocaleString()} সাশ্রয়`
          ),
          'success'
        );
        setCouponCodeInput('');
      } else {
        showToast(res.error || t('Invalid or expired coupon code. Try WELCOME50 or LUXURY10', 'অবৈধ বা মেয়াদোত্তীর্ণ কুপন কোড। WELCOME50 অথবা LUXURY10 চেষ্টা করুন'), 'error');
      }
    } catch (err: any) {
      showToast(err.message || t('Failed to validate coupon code', 'কুপন কোড যাচাই করতে ব্যর্থ হয়েছে'), 'error');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    showToast(t('Coupon removed', 'কুপন মুছে ফেলা হয়েছে'), 'info');
  };

  // Switch to new address creation
  const handleAddNewAddress = () => {
    setEditingAddressIdx(null);
    setAddressForm({
      fullName: user?.name || '',
      phone: user?.phone || '',
      division: '',
      district: '',
      upazila: '',
      fullAddress: '',
      isDefault: false
    });
    setFormErrors({});
    setTouchedFields({});
    setIsAddressFormOpen(true);
  };

  // Switch to edit existing address
  const handleEditAddress = (idx: number) => {
    if (!user || !user.addresses[idx]) return;
    setEditingAddressIdx(idx);
    setAddressForm({ ...user.addresses[idx] });
    setFormErrors({});
    setTouchedFields({});
    setIsAddressFormOpen(true);
  };

  const validateAddressForm = (): boolean => {
    const errors: Record<string, string> = {};
    const nameErr = validateFullName(addressForm.fullName);
    if (nameErr) errors.fullName = nameErr;

    const phoneErr = validatePhone(addressForm.phone);
    if (phoneErr) errors.phone = phoneErr;

    if (!addressForm.division) errors.division = t('Please select a Division', 'অনুগ্রহ করে একটি বিভাগ নির্বাচন করুন');
    if (!addressForm.district) errors.district = t('Please select a District', 'অনুগ্রহ করে একটি জেলা নির্বাচন করুন');
    if (!addressForm.upazila) errors.upazila = t('Please select an Upazila', 'অনুগ্রহ করে একটি উপজেলা নির্বাচন করুন');

    const addrErr = validateFullAddress(addressForm.fullAddress);
    if (addrErr) errors.fullAddress = addrErr;

    setFormErrors(errors);
    setTouchedFields({
      fullName: true,
      phone: true,
      division: true,
      district: true,
      upazila: true,
      fullAddress: true
    });

    return Object.keys(errors).length === 0;
  };

  const getPaymentValidationError = (): string | null => {
    if (paymentMethod === 'cod') return null;

    if (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket') {
      const cleanPhone = normalizeBDPhone(senderNumber);
      if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
        return t(
          'Enter a valid 11-digit BD mobile number (e.g. 01712-345678)',
          'সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01712-345678)'
        );
      }
      const cleanTrx = transactionId.trim().toUpperCase();
      if (!/^[A-Z0-9]{6,24}$/.test(cleanTrx)) {
        return t(
          'Enter a valid Transaction ID (6–24 letters/digits, e.g. 9J82K3L4)',
          'সঠিক ট্রানজেকশন আইডি দিন (৬-২৪ অক্ষর/সংখ্যা, যেমন: 9J82K3L4)'
        );
      }
      return null;
    }

    if (paymentMethod === 'card') {
      if (!isValidCardLuhn(cardNumber)) {
        return t('Enter a valid 16-digit Visa / Mastercard / Amex number', 'সঠিক ১৬ ডিজিটের কার্ড নম্বর লিখুন');
      }
      const expMatch = cardExpiry.trim().match(/^(\d{2})\/(\d{2})$/);
      if (!expMatch) {
        return t('Enter card expiry date in MM/YY format', 'কার্ডের মেয়াদ MM/YY ফরম্যাটে লিখুন');
      }
      const mm = parseInt(expMatch[1], 10);
      const yy = 2000 + parseInt(expMatch[2], 10);
      const now = new Date();
      if (mm < 1 || mm > 12 || yy < now.getFullYear() || (yy === now.getFullYear() && mm < now.getMonth() + 1)) {
        return t('Card appears expired. Please use a valid future expiry date.', 'কার্ডের মেয়াদ শেষ হয়ে গেছে। সঠিক তারিখ দিন।');
      }
      if (cardCvv.replace(/\D/g, '').length < 3) {
        return t('Enter a valid 3 or 4 digit CVV', 'সঠিক ৩ বা ৪ ডিজিটের CVV লিখুন');
      }
      if (cardHolder.trim().length < 2) {
        return t('Enter the cardholder name', 'কার্ডহোল্ডারের নাম লিখুন');
      }
      return null;
    }

    return null;
  };

  const isPaymentValid = () => getPaymentValidationError() === null;

  const isCurrentPaymentVerified =
    paymentMethod !== 'cod' &&
    Boolean(
      verifiedPayment &&
        verifiedPayment.method === paymentMethod &&
        verifiedPayment.amountBDT === totalInBDT
    );

  const handleVerifyPaymentNow = async (closeModalAfter = false) => {
    setGeneralError(null);
    const validationErr = getPaymentValidationError();
    if (validationErr) {
      setGeneralError(validationErr);
      showToast(validationErr, 'error');
      return null;
    }
    setIsVerifyingPayment(true);
    try {
      const res = await paymentApi.verifyPayment({
        paymentMethod,
        amountBDT: totalInBDT,
        senderNumber: normalizeBDPhone(senderNumber),
        transactionId: transactionId.trim().toUpperCase(),
        cardNumber,
        cardExpiry,
        cardCvv,
        cardHolder
      });
      const verifiedObj = {
        method: paymentMethod,
        amountBDT: totalInBDT,
        paymentId: res.paymentId,
        transactionId: res.transactionId || transactionId.trim().toUpperCase(),
        paymentStatus: res.paymentStatus || 'paid',
        senderNumber: res.senderNumber || normalizeBDPhone(senderNumber) || undefined,
        cardBrand: res.cardBrand,
        cardLast4: res.cardLast4
      };
      setVerifiedPayment(verifiedObj);
      showToast(
        t(
          `Payment verified! Ref: ${verifiedObj.paymentId}`,
          `পেমেন্ট সফলভাবে যাচাই হয়েছে! রেফ: ${verifiedObj.paymentId}`
        ),
        'success'
      );
      if (closeModalAfter) {
        setIsGatewayModalOpen(false);
      }
      return verifiedObj;
    } catch (err: any) {
      const msg = err?.message || t('Payment verification failed', 'পেমেন্ট যাচাই ব্যর্থ হয়েছে');
      setGeneralError(msg);
      showToast(msg, 'error');
      return null;
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Main Submit Handler
  const handleMainAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (selectedCartItems.length === 0) {
      showToast(t('Please select at least one item from your bag', 'অনুগ্রহ করে আপনার ব্যাগ থেকে অন্তত একটি পণ্য নির্বাচন করুন'), 'error');
      return;
    }

    // Step 1: Validate & Save Confirmed Delivery Address Snapshot
    if (step === 1) {
      if (isAddressFormOpen) {
        const isValid = validateAddressForm();
        if (!isValid) {
          showToast(t('Please complete all required delivery fields correctly', 'অনুগ্রহ করে ডেলিভারির সকল প্রয়োজনীয় তথ্য সঠিকভাবে পূরণ করুন'), 'error');
          return;
        }

        const addressSnapshot: Address = { ...addressForm };
        setConfirmedAddress(addressSnapshot);

        if (user && (saveToProfile || editingAddressIdx !== null)) {
          const updatedAddresses = [...(user.addresses || [])];
          if (editingAddressIdx !== null) {
            updatedAddresses[editingAddressIdx] = { ...addressSnapshot };
            setSelectedAddressIdx(editingAddressIdx);
          } else {
            updatedAddresses.push({ ...addressSnapshot, isDefault: updatedAddresses.length === 0 });
            setSelectedAddressIdx(updatedAddresses.length - 1);
          }
          onUpdateUser({ ...user, addresses: updatedAddresses });
        }

        setIsAddressFormOpen(false);
        setEditingAddressIdx(null);
      } else {
        const chosenAddress =
          (selectedAddressIdx !== null && user?.addresses?.[selectedAddressIdx]) || confirmedAddress;
        if (!chosenAddress) {
          showToast(t('Please select or add a delivery address', 'অনুগ্রহ করে একটি ডেলিভারি ঠিকানা নির্বাচন বা যোগ করুন'), 'error');
          return;
        }
        setConfirmedAddress({ ...chosenAddress });
      }

      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Step 2: Final Payment Verification & Instant Printable Official Bill
    if (step === 2) {
      if (!currentAddress) {
        showToast(t('Delivery address is missing. Please review Step 1.', 'ডেলিভারির ঠিকানা পাওয়া যায়নি। অনুগ্রহ করে ধাপ ১ যাচাই করুন।'), 'error');
        setStep(1);
        return;
      }

      const paymentValidationErr = getPaymentValidationError();
      if (paymentValidationErr) {
        setGeneralError(paymentValidationErr);
        showToast(paymentValidationErr, 'error');
        return;
      }

      setIsProcessing(true);

      try {
        // Use existing pre-verified payment for this method & amount, or verify now
        let verification: any = isCurrentPaymentVerified ? verifiedPayment : null;
        if (!verification) {
          verification = await paymentApi.verifyPayment({
            paymentMethod,
            amountBDT: totalInBDT,
            senderNumber: normalizeBDPhone(senderNumber),
            transactionId: transactionId.trim().toUpperCase(),
            cardNumber,
            cardExpiry,
            cardCvv,
            cardHolder
          });
        }

        const division = DIVISIONS.find(d => d.id === currentAddress.division);
        const district = DISTRICTS[currentAddress.division]?.find(d => d.id === currentAddress.district);
        const upazila = getUpazilasForDistrict(currentAddress.district).find(u => String(u.id) === currentAddress.upazila);

        const locationPart = [
          upazila ? `${upazila.name}${upazila.bn_name ? ` (${upazila.bn_name})` : ''}` : '',
          district ? `${district.name}${district.bn_name ? ` (${district.bn_name})` : ''}` : '',
          division ? `${division.name}${division.bn_name ? ` (${division.bn_name})` : ''}` : ''
        ].filter(Boolean).join(', ');

        const fullLocationAddress = locationPart && !currentAddress.fullAddress.includes(locationPart)
          ? `${currentAddress.fullAddress}, ${locationPart}`
          : currentAddress.fullAddress;

        const orderItems = selectedCartItems.map(item => ({
          id: item.id || '',
          name: item.name || 'Unknown Product',
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.image || '',
          selectedSize: item.selectedSize || '',
          selectedColor: item.selectedColor || ''
        }));

        const orderPayload: Order = {
          id: `LSM-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          items: orderItems as CartItem[],
          address: {
            ...currentAddress,
            fullAddress: fullLocationAddress
          },
          deliveryZone,
          subtotal: subtotalBDT,
          baseDeliveryFee,
          codFee,
          deliveryCharge: baseDeliveryFee + codFee,
          discount: calculatedDiscountBDT,
          total: totalInBDT,
          paymentMethod,
          paymentStatus: verification.paymentStatus || (paymentMethod === 'cod' ? 'unpaid' : 'paid'),
          status: 'pending',
          createdAt: new Date().toISOString(),
          transactionId: verification.transactionId || transactionId || '',
          senderNumber: verification.senderNumber || normalizeBDPhone(senderNumber) || '',
          paymentAmount: totalInBDT,
          couponCode: appliedCoupon?.code,
          ...(verification.paymentId ? { paymentId: verification.paymentId } : {}),
          ...(verification.cardBrand ? { cardBrand: verification.cardBrand } : {}),
          ...(verification.cardLast4 ? { cardLast4: verification.cardLast4 } : {})
        } as Order;

        const createdOrder = (await onPlaceOrder(orderPayload, { skipSuccessModal: true })) || orderPayload;
        setAppliedCoupon(null);
        try {
          sessionStorage.removeItem('elora-applied-coupon');
        } catch {}
        setIsProcessing(false);
        navigate(`/invoice/${createdOrder.id}?new=1`);
      } catch (err: any) {
        setIsProcessing(false);
        const errMsg = err?.message || t('Order placement failed. Please try again.', 'অর্ডার সম্পন্ন হতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
        setGeneralError(errMsg);
        showToast(errMsg, 'error');
      }
    }
  };

  const paymentMethods = [
    ...(isCodAvailable ? [{ 
      id: 'cod', 
      label: t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি'), 
      sub: t('Pay with cash at your doorstep', 'পণ্য হাতে পেয়ে টাকা দিন'), 
      icon: <Banknote size={22} />, 
      color: 'bg-emerald-600 text-white',
      badge: t('Popular', 'জনপ্রিয়')
    }] : []),
    ...(isMobileWalletAvailable ? [
      { 
        id: 'bkash', 
        label: t('bKash', 'বিকাশ (bKash)'), 
        sub: t('Instant Mobile Wallet', 'তাৎক্ষণিক মোবাইল ওয়ালেট'), 
        icon: <Phone size={22} />, 
        color: 'bg-[#D12053] text-white',
        badge: t('Instant', 'তাৎক্ষণিক')
      },
      { 
        id: 'nagad', 
        label: t('Nagad', 'নগদ (Nagad)'), 
        sub: t('Post Office Digital Payment', 'ডাক বিভাগের ডিজিটাল পেমেন্ট'), 
        icon: <Phone size={22} />, 
        color: 'bg-[#ED1B24] text-white' 
      },
      { 
        id: 'rocket', 
        label: t('Rocket', 'রকেট (Rocket)'), 
        sub: t('Dutch-Bangla Mobile Banking', 'ডাচ-বাংলা মোবাইল ব্যাংকিং'), 
        icon: <Landmark size={22} />, 
        color: 'bg-[#8C3494] text-white' 
      }
    ] : []),
    ...(isCardAvailable ? [{ 
      id: 'card', 
      label: t('Visa / Mastercard', 'কার্ড পেমেন্ট'), 
      sub: t('SSLCommerz Secured Card', 'SSLCommerz কার্ড গেটওয়ে'), 
      icon: <CreditCard size={22} />, 
      color: 'bg-slate-900 text-white',
      badge: 'SSL'
    }] : [])
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans pb-24 lg:pb-16 text-gray-800 antialiased selection:bg-brand-orange selection:text-white">
      {/* Checkout Top Bar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-[100] px-4 md:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <button 
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-brand-orange transition-colors group cursor-pointer"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">{t('Back to Shopping', 'শপিংয়ে ফিরে যান')}</span>
            <span className="sm:hidden">{t('Back', 'ফিরুন')}</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/50 shadow-2xs">
              <Lock size={15} />
            </div>
            <div className="text-left">
              <h1 className="text-sm md:text-base font-extrabold uppercase tracking-wider text-gray-900 leading-none">
                {t('Checkout', 'চেকআউট')}
              </h1>
              <span className="text-[10px] text-emerald-600 font-semibold tracking-wide flex items-center gap-1">
                <span>{t('256-Bit SSL Encrypted', '২৫৬-বিট এসএসএল এনক্রিপ্টেড')}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">{t('Need help?', 'সহায়তা প্রয়োজন?')}</span>
              <a href={`tel:${siteConfig?.hotlinePhone || '09612-345678'}`} className="text-xs font-bold text-brand-orange hover:underline font-mono">
                {siteConfig?.hotlinePhone || '09612-345678'}
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mt-6 md:mt-8">
        
        {/* Step Indicator / Connected Progress Bar */}
        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-200/80 shadow-2xs mb-6 md:mb-8">
          <div className="max-w-xl mx-auto">
            <div className="relative flex items-center justify-between">
              {/* Background Connecting Track */}
              <div className="absolute top-1/2 left-10 right-10 -translate-y-1/2 h-1.5 bg-gray-100 rounded-full z-0 overflow-hidden">
                {/* Active Colored Fill Bar */}
                <motion.div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: step === 1 ? '50%' : '100%' }}
                />
              </div>

              {/* Step 1 Node */}
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
              >
                <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-xs md:text-sm font-black transition-all shadow-md ${
                  step === 1 
                    ? 'bg-brand-orange text-white ring-4 ring-orange-100 scale-105' 
                    : 'bg-emerald-500 text-white'
                }`}>
                  {step > 1 ? <Check size={18} strokeWidth={3} /> : '1'}
                </div>
                <div className="text-center mt-2">
                  <span className={`text-[11px] md:text-xs font-extrabold uppercase tracking-wider block ${
                    step === 1 ? 'text-brand-orange' : 'text-gray-700'
                  }`}>
                    {t('1. Delivery Info', '১. ডেলিভারি তথ্য')}
                  </span>
                  <span className="text-[9px] text-gray-400 hidden sm:block">{t('Address & Contact', 'ঠিকানা ও যোগাযোগ')}</span>
                </div>
              </button>

              {/* Step 2 Node */}
              <div className="relative z-10 flex flex-col items-center">
                <div className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-xs md:text-sm font-black transition-all ${
                  step === 2 
                    ? 'bg-brand-orange text-white ring-4 ring-orange-100 shadow-md scale-105' 
                    : 'bg-gray-100 text-gray-400 border border-gray-200'
                }`}>
                  2
                </div>
                <div className="text-center mt-2">
                  <span className={`text-[11px] md:text-xs font-extrabold uppercase tracking-wider block ${
                    step === 2 ? 'text-brand-orange' : 'text-gray-400'
                  }`}>
                    {t('2. Payment Method', '২. পেমেন্ট মেথড')}
                  </span>
                  <span className="text-[9px] text-gray-400 hidden sm:block">{t('Confirm & Place Order', 'নিশ্চিত করুন ও অর্ডার দিন')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Collapsible Order Summary Bar (< lg screens) */}
        <div className="lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setIsMobileSummaryOpen(!isMobileSummaryOpen)}
            className="w-full bg-white border border-gray-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center font-black">
                <Ticket size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900 uppercase">{t('Order Summary', 'অর্ডার সারসংক্ষেপ')}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                    {selectedCartItems.length} {selectedCartItems.length === 1 ? t('item', 'টি পণ্য') : t('items', 'টি পণ্য')}
                  </span>
                </div>
                <p className="text-xs text-brand-orange font-black font-mono mt-0.5">
                  {t('Payable:', 'সর্বমোট পরিশোধ্য:')} ৳{totalInBDT.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
              <span>{isMobileSummaryOpen ? t('Hide', 'লুকান') : t('View', 'দেখুন')}</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isMobileSummaryOpen ? 'rotate-180 text-brand-orange' : ''}`} />
            </div>
          </button>

          <AnimatePresence>
            {isMobileSummaryOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden bg-white border-x border-b border-gray-200/90 rounded-b-2xl p-4 shadow-sm space-y-4"
              >
                <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {cart.map(item => (
                    <div key={`${item.id}-${item.selectedSize}`} className="py-2.5 flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-100" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-500">{t('Qty:', 'পরিমাণ:')} {item.quantity} × ৳{Math.round(item.price).toLocaleString()}</p>
                      </div>
                      <span className="text-xs font-black text-brand-orange font-mono">
                        ৳{Math.round(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>{t('Subtotal:', 'পণ্যের মূল্য:')}</span>
                    <span className="font-semibold text-gray-800">৳{subtotalBDT.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{t('Delivery', 'ডেলিভারি চার্জ')} ({deliveryZone === 'dhaka' ? t('Dhaka City', 'ঢাকা সিটি') : deliveryZone === 'sub-dhaka' ? t('Sub-Dhaka', 'ঢাকা সংলগ্ন') : t('Outside Dhaka', 'ঢাকার বাইরে')}):</span>
                    <span className="font-semibold text-gray-800">{baseDeliveryFee === 0 ? t('FREE', 'ফ্রি') : `৳${baseDeliveryFee}`}</span>
                  </div>
                  {codFee > 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>{t('COD Fee:', 'সিওডি চার্জ:')}</span>
                      <span className="font-semibold text-gray-800">৳{codFee}</span>
                    </div>
                  )}
                  {appliedCoupon && calculatedDiscountBDT > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>{t('Discount', 'ছাড়')} ({appliedCoupon.code}):</span>
                      <span>-৳{calculatedDiscountBDT.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
                    <span>{t('Total:', 'মোট:')}</span>
                    <span className="text-brand-orange font-mono">৳{totalInBDT.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Layout Grid: Form (Left) & Sticky Order Summary (Right) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT COLUMN: Steps Form */}
          <div className="flex-1 w-full space-y-6">
            <form onSubmit={handleMainAction} noValidate>
              <AnimatePresence mode="wait">
                
                {/* STEP 1: DELIVERY DESTINATION */}
                {step === 1 && (
                  <motion.div
                    key="step-delivery"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="bg-white rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-200/80 shadow-2xs">
                      
                      {/* Header with Title & Add Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5 sm:mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center border border-orange-100 shrink-0">
                            <Truck size={20} />
                          </div>
                          <div>
                            <h2 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-tight">
                              {t('Delivery Address', 'ডেলিভারি ঠিকানা')}
                            </h2>
                            <p className="text-xs text-gray-500">{t('Where should we deliver your order?', 'আপনার অর্ডারটি কোথায় পৌঁছে দেব?')}</p>
                          </div>
                        </div>

                        {!isAddressFormOpen && (
                          <button
                            type="button"
                            onClick={handleAddNewAddress}
                            className="self-start sm:self-auto px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-brand-orange text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-brand-orange/20 shrink-0"
                          >
                            <Plus size={14} />
                            <span>{t('Add New Address', 'নতুন ঠিকানা যোগ করুন')}</span>
                          </button>
                        )}
                      </div>

                      {/* Case A: Saved Addresses List */}
                      {!isAddressFormOpen && user?.addresses && user.addresses.length > 0 && (
                        <div className="space-y-3.5">
                          {user.addresses.map((addr, idx) => {
                            const isSelected = selectedAddressIdx === idx;
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  setSelectedAddressIdx(idx);
                                  setConfirmedAddress({ ...addr });
                                }}
                                className={`p-4 md:p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                                  isSelected 
                                    ? 'border-brand-orange bg-orange-50/20 shadow-sm ring-2 ring-brand-orange/10' 
                                    : 'border-gray-200/80 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                                      isSelected ? 'border-brand-orange bg-brand-orange text-white' : 'border-gray-300 bg-white'
                                    }`}>
                                      {isSelected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-extrabold text-gray-900">{addr.fullName}</h4>
                                        {addr.isDefault && (
                                          <span className="bg-gray-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            {t('Default', 'ডিফল্ট')}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500 font-semibold mt-0.5 flex items-center gap-1">
                                        <Phone size={12} /> {addr.phone}
                                      </p>
                                      <p className="text-xs text-gray-700 font-medium mt-2 leading-relaxed">
                                        {addr.fullAddress}, {getUpazilasForDistrict(addr.district).find(u => u.id === addr.upazila)?.name || addr.upazila}, {(DISTRICTS[addr.division] || []).find(d => d.id === addr.district)?.name || addr.district}, {DIVISIONS.find(v => v.id === addr.division)?.name || addr.division}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditAddress(idx);
                                    }}
                                    className="text-gray-400 hover:text-brand-orange p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                    title={t('Edit this address', 'এই ঠিকানা পরিবর্তন করুন')}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Case B: Address Entry / Edit Form */}
                      {isAddressFormOpen && (
                        <div className="space-y-5">
                          {user?.addresses && user.addresses.length > 0 && (
                            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                              <span className="text-xs font-bold text-gray-700">
                                {editingAddressIdx !== null ? t('Editing Saved Address', 'সংরক্ষিত ঠিকানা পরিবর্তন') : t('Adding New Delivery Address', 'নতুন ডেলিভারি ঠিকানা যোগ')}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddressFormOpen(false);
                                  setEditingAddressIdx(null);
                                }}
                                className="text-xs font-bold text-gray-500 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-200"
                              >
                                {t('Cancel & Choose Existing', 'বাতিল করুন ও সংরক্ষিত ঠিকানা বেছে নিন')}
                              </button>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                            
                            {/* Full Name */}
                            <div className="space-y-1.5 md:col-span-1">
                              <label className="text-[11px] font-bold text-gray-600 flex items-center justify-between">
                                <span>{t('Full Name', 'আপনার পূর্ণ নাম')} <span className="text-rose-500">*</span></span>
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={addressForm.fullName}
                                  onChange={(e) => handleFieldChange('fullName', e.target.value)}
                                  placeholder={t('e.g. Abhimanyu Dey', 'যেমন: অভিমন্যু দে')}
                                  className={`w-full min-h-[48px] px-4 rounded-xl text-sm font-medium outline-none transition-all border ${
                                    formErrors.fullName && touchedFields.fullName
                                      ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
                                      : addressForm.fullName && !formErrors.fullName
                                      ? 'border-emerald-300 bg-emerald-50/10 focus:ring-4 focus:ring-emerald-500/10'
                                      : 'border-gray-200 bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10'
                                  }`}
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                  {addressForm.fullName && !formErrors.fullName && (
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                  )}
                                  {formErrors.fullName && touchedFields.fullName && (
                                    <AlertCircle size={16} className="text-rose-500" />
                                  )}
                                </div>
                              </div>
                              {formErrors.fullName && touchedFields.fullName && (
                                <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                                  <AlertCircle size={12} className="shrink-0" />
                                  <span>{formErrors.fullName}</span>
                                </p>
                              )}
                            </div>

                            {/* Mobile Number with Auto-Formatting */}
                            <div className="space-y-1.5 md:col-span-1">
                              <label className="text-[11px] font-bold text-gray-600 flex items-center justify-between">
                                <span>{t('Mobile Number', 'মোবাইল নম্বর')} <span className="text-rose-500">*</span></span>
                                <span className="text-[10px] text-gray-400 font-normal">{t('11 digits', '১১ ডিজিট')}</span>
                              </label>
                              <div className="relative">
                                <input
                                  type="tel"
                                  inputMode="numeric"
                                  value={addressForm.phone}
                                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                                  placeholder="01712-345678"
                                  className={`w-full min-h-[48px] px-4 rounded-xl text-sm font-medium outline-none transition-all font-mono border ${
                                    formErrors.phone && touchedFields.phone
                                      ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
                                      : addressForm.phone && !formErrors.phone
                                      ? 'border-emerald-300 bg-emerald-50/10 focus:ring-4 focus:ring-emerald-500/10'
                                      : 'border-gray-200 bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10'
                                  }`}
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                  {addressForm.phone && !formErrors.phone && (
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                  )}
                                  {formErrors.phone && touchedFields.phone && (
                                    <AlertCircle size={16} className="text-rose-500" />
                                  )}
                                </div>
                              </div>
                              {formErrors.phone && touchedFields.phone && (
                                <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                                  <AlertCircle size={12} className="shrink-0" />
                                  <span>{formErrors.phone}</span>
                                </p>
                              )}
                            </div>

                            {/* Cascading Location Dropdowns: Division -> District -> Upazila */}
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Division */}
                              <SearchableSelect
                                label={t('Division', 'বিভাগ')}
                                placeholder={t('Choose Division', 'বিভাগ নির্বাচন করুন')}
                                value={addressForm.division}
                                options={DIVISIONS}
                                required
                                error={touchedFields.division ? formErrors.division : undefined}
                                onChange={(val) => handleFieldChange('division', val)}
                              />

                              {/* District */}
                              <SearchableSelect
                                label={t('District', 'জেলা')}
                                placeholder={addressForm.division ? t('Choose District', 'জেলা নির্বাচন করুন') : t('Select Division first', 'আগে বিভাগ নির্বাচন করুন')}
                                value={addressForm.district}
                                disabled={!addressForm.division}
                                options={DISTRICTS[addressForm.division] || []}
                                required
                                error={touchedFields.district ? formErrors.district : undefined}
                                onChange={(val) => handleFieldChange('district', val)}
                              />

                              {/* Upazila */}
                              <SearchableSelect
                                label={t('Upazila / Thana', 'উপজেলা / থানা')}
                                placeholder={addressForm.district ? t('Choose Upazila', 'উপজেলা নির্বাচন করুন') : t('Select District first', 'আগে জেলা নির্বাচন করুন')}
                                value={addressForm.upazila}
                                disabled={!addressForm.district}
                                options={getUpazilasForDistrict(addressForm.district)}
                                required
                                error={touchedFields.upazila ? formErrors.upazila : undefined}
                                onChange={(val) => handleFieldChange('upazila', val)}
                              />
                            </div>

                            {/* Full Address */}
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[11px] font-bold text-gray-600 flex items-center justify-between">
                                <span>{t('Detailed Street Address', 'বিস্তারিত ঠিকানা (বাসা, রোড ও এলাকা)')} <span className="text-rose-500">*</span></span>
                                <span className="text-[10px] text-gray-400 font-normal">{t('Min 8 characters', 'ন্যূনতম ৮ অক্ষর')}</span>
                              </label>
                              <div className="relative">
                                <textarea
                                  rows={3}
                                  value={addressForm.fullAddress}
                                  onChange={(e) => handleFieldChange('fullAddress', e.target.value)}
                                  placeholder={t('e.g. House 12, Road 5, Block B, Dhanmondi, Dhaka', 'যেমন: বাসা ১২, রোড ৫, ব্লক বি, ধানমন্ডি, ঢাকা')}
                                  className={`w-full p-4 rounded-xl text-sm font-medium outline-none transition-all resize-none border ${
                                    formErrors.fullAddress && touchedFields.fullAddress
                                      ? 'border-rose-400 bg-rose-50/20 focus:ring-4 focus:ring-rose-500/10'
                                      : addressForm.fullAddress && !formErrors.fullAddress
                                      ? 'border-emerald-300 bg-emerald-50/10 focus:ring-4 focus:ring-emerald-500/10'
                                      : 'border-gray-200 bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10'
                                  }`}
                                />
                                <div className="absolute right-3.5 bottom-3.5">
                                  {addressForm.fullAddress && !formErrors.fullAddress && (
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                  )}
                                  {formErrors.fullAddress && touchedFields.fullAddress && (
                                    <AlertCircle size={16} className="text-rose-500" />
                                  )}
                                </div>
                              </div>
                              {formErrors.fullAddress && touchedFields.fullAddress && (
                                <p className="text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1">
                                  <AlertCircle size={12} className="shrink-0" />
                                  <span>{formErrors.fullAddress}</span>
                                </p>
                              )}
                            </div>

                            {/* Save to profile checkbox */}
                            <div className="md:col-span-2 flex items-center gap-2 pt-1">
                              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={saveToProfile}
                                  onChange={(e) => setSaveToProfile(e.target.checked)}
                                  className="w-4 h-4 rounded text-brand-orange focus:ring-brand-orange/20 border-gray-300 cursor-pointer"
                                />
                                <span>{t('Save this address to my profile for future orders', 'ভবিষ্যতের অর্ডারের জন্য এই ঠিকানা প্রোফাইলে সংরক্ষণ করুন')}</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Single Prominent Action Button for Step 1 */}
                    <button
                      type="submit"
                      disabled={selectedCartItems.length === 0}
                      className="w-full bg-brand-orange hover:bg-brand-orange-light text-white h-14 md:h-16 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/25 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{t('Proceed to Payment', 'পেমেন্ট ধাপে এগিয়ে যান')}</span>
                      <ArrowLeft className="rotate-180" size={18} />
                    </button>
                  </motion.div>
                )}

                {/* STEP 2: PAYMENT METHOD & REVIEW */}
                {step === 2 && (
                  <motion.div
                    key="step-payment"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Selected Address Summary Card with Edit trigger */}
                    {currentAddress && (
                      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200/80 shadow-2xs flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-gray-900 uppercase">{t('Deliver to:', 'প্রাপক:')} {currentAddress.fullName}</span>
                              <span className="text-[11px] text-gray-500 font-mono">({currentAddress.phone})</span>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-1 mt-0.5">
                              {currentAddress.fullAddress}, {(DISTRICTS[currentAddress.division] || []).find(d => d.id === currentAddress.district)?.name || currentAddress.district}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs font-bold text-brand-orange hover:underline shrink-0 ml-3 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 size={13} />
                          <span>{t('Change', 'পরিবর্তন')}</span>
                        </button>
                      </div>
                    )}

                    {/* Payment Selector Panel */}
                    <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-gray-200/80 shadow-2xs space-y-6">
                      <div className="border-b border-gray-100 pb-4">
                        <h3 className="text-base md:text-lg font-black text-gray-900 uppercase tracking-tight">
                          {t('Select Payment Method', 'পেমেন্ট পদ্ধতি নির্বাচন করুন')}
                        </h3>
                        <p className="text-xs text-gray-500">{t('Choose your preferred safe payment gateway', 'আপনার পছন্দের নিরাপদ পেমেন্ট মাধ্যম বেছে নিন')}</p>
                      </div>

                      {/* Payment Methods Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {paymentMethods.map((method) => {
                          const isSelected = paymentMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => {
                                setPaymentMethod(method.id);
                                setGeneralError(null);
                                if (verifiedPayment && verifiedPayment.method !== method.id) {
                                  setVerifiedPayment(null);
                                }
                              }}
                              className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center gap-2.5 transition-all relative cursor-pointer ${
                                isSelected 
                                  ? 'border-brand-orange bg-orange-50/30 ring-2 ring-brand-orange/20 shadow-xs scale-102' 
                                  : 'border-gray-200/80 hover:border-gray-300 bg-white'
                              }`}
                            >
                              {method.badge && (
                                <span className="absolute -top-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                                  {method.badge}
                                </span>
                              )}
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xs ${method.color}`}>
                                {method.icon}
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-900 leading-tight">{method.label}</p>
                                <span className="text-[9px] text-gray-400 leading-tight block mt-0.5">{method.sub}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {paymentMethods.length === 0 && (
                        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center text-xs font-bold text-rose-700">
                          {t('No payment methods are currently enabled. Please contact store support.', 'বর্তমানে কোনো পেমেন্ট মাধ্যম চালু নেই। অনুগ্রহ করে স্টোর সাপোর্টে যোগাযোগ করুন।')}
                        </div>
                      )}

                      {/* Verified Payment Banner when pre-verified */}
                      {isCurrentPaymentVerified && verifiedPayment && (
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                                {t('Payment Verified & Locked', 'পেমেন্ট সফলভাবে যাচাই ও লক করা হয়েছে')}
                              </p>
                              <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                                Ref: {verifiedPayment.paymentId} • TrxID: {verifiedPayment.transactionId} • ৳{verifiedPayment.amountBDT.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setVerifiedPayment(null)}
                            className="text-xs font-bold text-emerald-800 hover:underline self-start sm:self-center cursor-pointer"
                          >
                            {t('Change Details', 'তথ্য পরিবর্তন')}
                          </button>
                        </div>
                      )}

                      {/* Payment Method Details Form */}
                      <AnimatePresence mode="wait">
                        
                        {/* 1. Cash on Delivery */}
                        {paymentMethod === 'cod' && (
                          <motion.div
                            key="cod-box"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200/70 text-center space-y-3"
                          >
                            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                              <Truck size={28} />
                            </div>
                            <h4 className="text-sm font-black text-gray-900 uppercase">{t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি (হাতে পেয়ে টাকা দিন)')}</h4>
                            <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                              {t('You can inspect the packaging upon delivery and pay the total amount of', 'ডেলিভারির সময় পার্সেল যাচাই করে কুরিয়ার প্রতিনিধির হাতে সর্বমোট')} <strong className="text-brand-orange font-mono">৳{totalInBDT.toLocaleString()}</strong> {t('in cash to the courier representative.', 'টাকা নগদ পরিশোধ করতে পারবেন।')}
                            </p>
                            <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 text-[11px] font-semibold text-gray-700 shadow-2xs">
                              <ShieldCheck size={14} className="text-emerald-500" />
                              <span>{t('Zero Risk • Inspection Allowed', 'ঝুঁকিমুক্ত • যাচাই করে নেওয়ার সুবিধা')}</span>
                            </div>
                          </motion.div>
                        )}

                        {/* Mobile Wallets (bKash / Nagad / Rocket) */}
                        {(paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket') && (() => {
                          const walletNum =
                            merchantNumbers[paymentMethod] ||
                            (paymentMethod === 'bkash' ? siteConfig?.bkashNumber : paymentMethod === 'nagad' ? siteConfig?.nagadNumber : siteConfig?.rocketNumber) ||
                            '01700-112233';
                          const cleanSender = normalizeBDPhone(senderNumber);
                          const isPhoneValid = /^01[3-9]\d{8}$/.test(cleanSender);
                          const isTrxValid = /^[A-Z0-9]{6,24}$/.test(transactionId.trim().toUpperCase());

                          return (
                            <motion.div
                              key="wallet-box"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-gray-50/80 rounded-2xl p-6 border border-gray-200/70 space-y-5 text-center"
                            >
                              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-md ${
                                paymentMethod === 'bkash' ? 'bg-[#D12053] text-white' : paymentMethod === 'nagad' ? 'bg-[#ED1B24] text-white' : 'bg-[#8C3494] text-white'
                              }`}>
                                {paymentMethod === 'rocket' ? <Landmark size={28} /> : <Phone size={28} />}
                              </div>

                              <div>
                                <h4 className="text-sm font-black text-gray-900 uppercase">
                                  {paymentMethod.toUpperCase()} {t('Merchant Checkout', 'মার্চেন্ট পেমেন্ট')}
                                </h4>
                                <p className="text-xs text-gray-500 mt-0.5">{t('Send Payment / Make Payment to Merchant Account, then verify below', 'মার্চেন্ট অ্যাকাউন্টে পেমেন্ট করে নিচে যাচাই করুন')}</p>
                              </div>

                              <div className="bg-white rounded-xl p-4 border-2 border-dashed border-brand-orange/30 max-w-sm mx-auto shadow-2xs">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                  {t('Merchant Account Number', 'মার্চেন্ট অ্যাকাউন্ট নম্বর')}
                                </span>
                                <div className="flex items-center justify-center gap-2">
                                  <span className="text-2xl font-black text-brand-orange font-mono tracking-wider select-all">
                                    {walletNum}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(walletNum.replace(/\D/g, ''));
                                      setCopiedMerchant(true);
                                      showToast(t('Merchant number copied!', 'মার্চেন্ট নম্বর কপি হয়েছে!'), 'success');
                                      setTimeout(() => setCopiedMerchant(false), 1800);
                                    }}
                                    className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-brand-orange border border-orange-200 transition-colors cursor-pointer"
                                    title={t('Copy Number', 'নম্বর কপি করুন')}
                                  >
                                    {copiedMerchant ? <Check size={14} /> : <Copy size={14} />}
                                  </button>
                                </div>
                                <span className="text-[10px] text-gray-500 font-semibold block mt-1">{t('Payable Amount:', 'পরিশোধ্য পরিমাণ:')} ৳{totalInBDT.toLocaleString()}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-md mx-auto pt-1">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">{t('Sender Mobile Number', 'প্রেরকের মোবাইল নম্বর')}</label>
                                  <input
                                    type="tel"
                                    value={senderNumber}
                                    onChange={(e) => {
                                      setSenderNumber(formatBDPhone(e.target.value));
                                      setVerifiedPayment(null);
                                      setGeneralError(null);
                                    }}
                                    placeholder="01712-345678"
                                    className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono outline-none ${
                                      senderNumber && !isPhoneValid
                                        ? 'border-rose-400 focus:border-rose-500'
                                        : isPhoneValid
                                        ? 'border-emerald-400 focus:border-emerald-500'
                                        : 'border-gray-200 focus:border-brand-orange'
                                    }`}
                                  />
                                  {senderNumber && !isPhoneValid && (
                                    <p className="text-[10px] text-rose-500 font-semibold">
                                      {t('Enter 11 digits starting with 01 (e.g. 017...)', '০১ দিয়ে শুরু ১১ ডিজিটের নম্বর দিন')}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">{t('Transaction ID (TrxID)', 'ট্রানজেকশন আইডি (TrxID)')}</label>
                                  <input
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => {
                                      setTransactionId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                                      setVerifiedPayment(null);
                                      setGeneralError(null);
                                    }}
                                    placeholder={t('e.g. 9J82K3L4', 'যেমন: 9J82K3L4')}
                                    className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase outline-none ${
                                      transactionId && !isTrxValid
                                        ? 'border-rose-400 focus:border-rose-500'
                                        : isTrxValid
                                        ? 'border-emerald-400 focus:border-emerald-500'
                                        : 'border-gray-200 focus:border-brand-orange'
                                    }`}
                                  />
                                  {transactionId && !isTrxValid && (
                                    <p className="text-[10px] text-rose-500 font-semibold">
                                      {t('Minimum 6 alphanumeric characters required', 'কমপক্ষে ৬ অক্ষরের সঠিক TrxID দিন')}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Interactive Gateway Modal Trigger & Inline Verify Action */}
                              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setIsGatewayModalOpen(true)}
                                  className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-brand-orange text-gray-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                >
                                  {t('Open Interactive Gateway Guide', 'ইন্টারঅ্যাক্টিভ গেটওয়ে উইন্ডো খুলুন')}
                                </button>
                                <button
                                  type="button"
                                  disabled={!isPhoneValid || !isTrxValid || isVerifyingPayment || isCurrentPaymentVerified}
                                  onClick={() => handleVerifyPaymentNow(false)}
                                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isCurrentPaymentVerified
                                      ? 'bg-emerald-600 text-white cursor-default'
                                      : 'bg-gray-900 hover:bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  {isVerifyingPayment ? (
                                    <span>{t('Verifying...', 'যাচাই হচ্ছে...')}</span>
                                  ) : isCurrentPaymentVerified ? (
                                    <>
                                      <CheckCircle2 size={14} />
                                      <span>{t('Verified', 'যাচাইকৃত')}</span>
                                    </>
                                  ) : (
                                    <span>{t('Verify TrxID Now', 'এখনই TrxID যাচাই করুন')}</span>
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          );
                        })()}

                        {/* Visa / Mastercard / Amex Card Checkout */}
                        {paymentMethod === 'card' && (() => {
                          const expMatch = cardExpiry.trim().match(/^(\d{2})\/(\d{2})$/);
                          let isExpiryValid = false;
                          let expiryError = '';
                          if (expMatch) {
                            const mm = parseInt(expMatch[1], 10);
                            const yy = 2000 + parseInt(expMatch[2], 10);
                            const now = new Date();
                            const curYear = now.getFullYear();
                            const curMonth = now.getMonth() + 1;
                            if (mm < 1 || mm > 12) {
                              expiryError = t('Invalid month (01-12)', 'সঠিক মাস দিন (০১-১২)');
                            } else if (yy < curYear || (yy === curYear && mm < curMonth)) {
                              expiryError = t('Card is expired', 'মেয়াদ শেষ');
                            } else {
                              isExpiryValid = true;
                            }
                          } else if (cardExpiry.length > 0) {
                            expiryError = t('Use MM/YY format', 'MM/YY লিখুন');
                          }
                          const isCvvValid = cardCvv.replace(/\D/g, '').length >= 3;
                          const isHolderValid = cardHolder.trim().length >= 2;
                          const digitsOnly = cardNumber.replace(/\D/g, '');

                          return (
                            <motion.div
                              key="card-box"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="bg-gray-50/80 rounded-2xl p-5 sm:p-6 border border-gray-200/70 space-y-4"
                            >
                              <div className="flex items-center justify-between border-b border-gray-200/70 pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
                                    <CreditCard size={22} />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-black text-gray-900 uppercase">
                                      {t('Card Payment (SSLCommerz)', 'কার্ড পেমেন্ট (SSLCommerz)')}
                                    </h4>
                                    <p className="text-[11px] text-gray-500">
                                      {t('Visa, Mastercard & Amex • 256-Bit Encrypted', 'ভিসা, মাস্টারকার্ড ও অ্যামেক্স • সুরক্ষিত গেটওয়ে')}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs font-black font-mono text-brand-orange bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 shrink-0">
                                  ৳{totalInBDT.toLocaleString()}
                                </span>
                              </div>

                              {/* Live Visual Card Preview */}
                              <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-4 sm:p-5 shadow-md border border-slate-700/60 flex flex-col justify-between gap-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                    {t('Secured Checkout Card', 'সুরক্ষিত পেমেন্ট কার্ড')}
                                  </span>
                                  <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 border border-white/15 text-amber-300">
                                    {detectCardBrand(cardNumber)}
                                  </span>
                                </div>
                                <p className="text-base sm:text-lg font-mono font-bold tracking-[0.16em] text-white/95">
                                  {cardNumber || '•••• •••• •••• ••••'}
                                </p>
                                <div className="flex items-center justify-between text-[11px]">
                                  <div>
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                                      {t('Cardholder', 'কার্ডহোল্ডার')}
                                    </span>
                                    <span className="font-bold uppercase tracking-wide text-slate-100 truncate max-w-[170px] block">
                                      {cardHolder.trim() || t('FULL NAME', 'পূর্ণ নাম')}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] uppercase tracking-wider text-slate-400 block">
                                      {t('Expires', 'মেয়াদ')}
                                    </span>
                                    <span className="font-mono font-bold text-slate-100">
                                      {cardExpiry || 'MM/YY'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">{t('Card Number', 'কার্ড নম্বর')}</label>
                                    {digitsOnly.length >= 1 && (
                                      <span className="text-[10px] font-black text-slate-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                                        {detectCardBrand(cardNumber)}
                                      </span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={cardNumber}
                                    onChange={(e) => {
                                      setCardNumber(formatCardNumber(e.target.value));
                                      setVerifiedPayment(null);
                                      setGeneralError(null);
                                    }}
                                    placeholder="4532 •••• •••• 8910"
                                    className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono outline-none ${
                                      digitsOnly.length >= 13 && !isValidCardLuhn(cardNumber)
                                        ? 'border-rose-400 focus:border-rose-500'
                                        : isValidCardLuhn(cardNumber)
                                        ? 'border-emerald-400 focus:border-emerald-500'
                                        : 'border-gray-200 focus:border-brand-orange'
                                    }`}
                                  />
                                  {digitsOnly.length >= 13 && !isValidCardLuhn(cardNumber) && (
                                    <p className="text-[10px] text-rose-500 font-semibold">
                                      {t('Card number check failed. Please verify the digits.', 'কার্ড নম্বর সঠিক নয়, অনুগ্রহ করে যাচাই করুন।')}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">{t('Expiry (MM/YY)', 'মেয়াদ (MM/YY)')}</label>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={cardExpiry}
                                    onChange={(e) => {
                                      setCardExpiry(formatCardExpiry(e.target.value));
                                      setVerifiedPayment(null);
                                      setGeneralError(null);
                                    }}
                                    placeholder="08/28"
                                    className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono outline-none ${
                                      expiryError && cardExpiry.length >= 4
                                        ? 'border-rose-400 focus:border-rose-500'
                                        : isExpiryValid
                                        ? 'border-emerald-400 focus:border-emerald-500'
                                        : 'border-gray-200 focus:border-brand-orange'
                                    }`}
                                  />
                                  {expiryError && cardExpiry.length >= 4 && (
                                    <p className="text-[10px] text-rose-500 font-semibold">{expiryError}</p>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">{t('CVV / CVC', 'CVV কোড')}</label>
                                  <input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={cardCvv}
                                    onChange={(e) => {
                                      setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4));
                                      setVerifiedPayment(null);
                                      setGeneralError(null);
                                    }}
                                    placeholder="123"
                                    className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono outline-none ${
                                      cardCvv.length > 0 && !isCvvValid
                                        ? 'border-rose-400 focus:border-rose-500'
                                        : isCvvValid
                                        ? 'border-emerald-400 focus:border-emerald-500'
                                        : 'border-gray-200 focus:border-brand-orange'
                                    }`}
                                  />
                                </div>

                                <div className="sm:col-span-2 space-y-1">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">{t('Cardholder Name', 'কার্ডহোল্ডারের নাম')}</label>
                                  <input
                                    type="text"
                                    value={cardHolder}
                                    onChange={(e) => {
                                      setCardHolder(e.target.value);
                                      setVerifiedPayment(null);
                                      setGeneralError(null);
                                    }}
                                    placeholder={t('Name on card', 'কার্ডে থাকা পুরো নাম')}
                                    className={`w-full bg-white border px-3.5 py-2.5 rounded-xl text-xs font-bold outline-none ${
                                      isHolderValid
                                        ? 'border-emerald-400 focus:border-emerald-500'
                                        : 'border-gray-200 focus:border-brand-orange'
                                    }`}
                                  />
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                                <button
                                  type="button"
                                  disabled={!isPaymentValid() || isVerifyingPayment || isCurrentPaymentVerified}
                                  onClick={() => handleVerifyPaymentNow(false)}
                                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isCurrentPaymentVerified
                                      ? 'bg-emerald-600 text-white cursor-default'
                                      : 'bg-slate-900 hover:bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed'
                                  }`}
                                >
                                  {isVerifyingPayment ? (
                                    <span>{t('Authorizing...', 'অনুমোদন হচ্ছে...')}</span>
                                  ) : isCurrentPaymentVerified ? (
                                    <>
                                      <CheckCircle2 size={14} />
                                      <span>{t('Card Authorized', 'কার্ড অনুমোদিত')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock size={13} />
                                      <span>{t('Verify & Authorize Card', 'কার্ড যাচাই ও অনুমোদন করুন')}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
                    </div>

                    {/* Error Banner if order write fails */}
                    {generalError && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-xs">
                        <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-rose-900">{t('Order placement could not be completed', 'অর্ডার প্রক্রিয়া সম্পন্ন করা যায়নি')}</p>
                          <p className="text-rose-700 mt-0.5 leading-relaxed">{generalError}</p>
                        </div>
                      </div>
                    )}

                    {/* Validation Helper Notice when non-COD details are incomplete */}
                    {paymentMethod !== 'cod' && getPaymentValidationError() && !generalError && (
                      <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium flex items-center gap-2">
                        <AlertCircle size={15} className="text-amber-600 shrink-0" />
                        <span>{getPaymentValidationError()}</span>
                      </div>
                    )}

                    {/* Navigation Buttons for Step 2 */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-4 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                      >
                        <ArrowLeft size={16} />
                        <span>{t('Edit Delivery Details', 'ডেলিভারি তথ্য পরিবর্তন করুন')}</span>
                      </button>

                      <button
                        type="submit"
                        disabled={!isPaymentValid() || isProcessing}
                        className="flex-1 bg-brand-orange hover:bg-brand-orange-light text-white h-14 md:h-16 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/25 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{t('Verifying Payment...', 'পেমেন্ট যাচাই করা হচ্ছে...')}</span>
                          </div>
                        ) : (
                          <>
                            <span>{t('Confirm & Place Order', 'অর্ডার নিশ্চিত করুন')} (৳{totalInBDT.toLocaleString()})</span>
                            <CheckCircle2 size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* RIGHT COLUMN: Cohesive Order Summary Sidebar */}
          <div className="w-full lg:w-[410px] lg:sticky lg:top-24 space-y-6">
            <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-7 border border-gray-200/80 shadow-2xs space-y-6">
              
              {/* Header with Item Count & Select All */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">{t('Order Summary', 'অর্ডার সারসংক্ষেপ')}</h3>
                  <span className="text-[11px] bg-orange-50 text-brand-orange font-mono font-bold px-2 py-0.5 rounded-full border border-orange-100">
                    {selectedCartItems.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectAll(!isAllSelected)}
                  className="text-xs font-bold text-gray-500 hover:text-brand-orange flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isAllSelected ? 'bg-brand-orange border-brand-orange text-white' : 'border-gray-300 bg-white'
                  }`}>
                    {isAllSelected && <Check size={11} strokeWidth={3} />}
                  </div>
                  <span>{t('Select All', 'সব নির্বাচন করুন')}</span>
                </button>
              </div>

              {/* Product Items List with Hover Image Preview & Live Quantity */}
              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 font-medium">
                    {t('Your shopping bag is empty', 'আপনার শপিং ব্যাগ খালি')}
                  </div>
                ) : (
                  cart.map((item) => {
                    const isSelected = item.selected;
                    return (
                      <div
                        key={`${item.id}-${item.selectedSize}-${item.selectedColor || ''}`}
                        className={`p-3.5 rounded-2xl border transition-all flex gap-3.5 items-center relative group ${
                          isSelected ? 'bg-orange-50/15 border-brand-orange/30 shadow-2xs' : 'bg-gray-50/60 border-gray-200/60 opacity-60'
                        }`}
                      >
                        {/* Select checkbox */}
                        <button
                          type="button"
                          onClick={() => onToggleSelection(item.id, item.selectedSize, item.selectedColor)}
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                            isSelected ? 'bg-brand-orange border-brand-orange text-white' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </button>

                        {/* Thumbnail with Hover Zoom Trigger */}
                        <div 
                          className="w-16 h-18 rounded-xl bg-white border border-gray-200/80 overflow-hidden shrink-0 relative cursor-zoom-in"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredPreviewImage({ url: item.image, name: item.name, x: rect.left, y: rect.top });
                          }}
                          onMouseLeave={() => setHoveredPreviewImage(null)}
                        >
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Eye size={14} className="text-white drop-shadow-md" />
                          </div>
                        </div>

                        {/* Item Details & Live Quantity Controls */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate leading-snug" title={item.name}>
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium mt-0.5">
                            <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{t('Size:', 'সাইজ:')} {item.selectedSize || 'M'}</span>
                            {item.selectedColor && (
                              <span className="bg-gray-100 px-1.5 py-0.5 rounded">{item.selectedColor}</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-black text-brand-orange font-mono">
                              ৳{Math.round(item.price).toLocaleString()}
                            </span>

                            {/* Quantity Controls */}
                            <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, -1, item.selectedSize, item.selectedColor)}
                                disabled={item.quantity <= 1}
                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-orange hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-bold font-mono text-gray-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, 1, item.selectedSize, item.selectedColor)}
                                className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-brand-orange hover:bg-gray-50 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Expandable Coupon Code Field inside Order Summary (Controlled by Admin toggle, OFF by default) */}
              {isCouponEnabled && (
              <div className="pt-2 border-t border-gray-100">
                {!appliedCoupon ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsCouponExpanded(!isCouponExpanded)}
                      className="w-full flex items-center justify-between text-xs font-bold text-gray-700 hover:text-brand-orange transition-colors py-1"
                    >
                      <div className="flex items-center gap-2">
                        <Ticket size={15} className="text-brand-orange" />
                        <span>{t('Have a Promo Coupon?', 'প্রোমো কুপন আছে কি?')}</span>
                      </div>
                      <ChevronDown size={15} className={`transition-transform ${isCouponExpanded ? 'rotate-180 text-brand-orange' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isCouponExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden pt-3 space-y-2.5"
                        >
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={couponCodeInput}
                              onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                              placeholder={t('e.g. LUXURY10', 'যেমন: LUXURY10')}
                              className="flex-1 px-3 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-gray-200 outline-none focus:border-brand-orange bg-gray-50/50"
                            />
                            <button
                              type="button"
                              onClick={handleApplyCoupon}
                              className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            >
                              {t('Apply', 'প্রয়োগ করুন')}
                            </button>
                          </div>

                          {/* Quick preset suggestions */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-400 font-semibold">{t('Try:', 'চেষ্টা করুন:')}</span>
                            {['WELCOME50', 'LUXURY10', 'SAVE200', 'EID2026', 'FLASH25'].map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setCouponCodeInput(c);
                                }}
                                className="text-[10px] bg-orange-50 hover:bg-orange-100 text-brand-orange px-2 py-0.5 rounded-md font-mono font-bold border border-orange-200 transition-colors"
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-600" />
                      <div>
                        <span className="text-xs font-bold text-emerald-800 font-mono">{appliedCoupon.code}</span>
                        <span className="text-[10px] text-emerald-600 block">
                          {appliedCoupon.freeShipping
                            ? t('Free Shipping Applied', 'ফ্রি ডেলিভারি প্রয়োগ হয়েছে')
                            : t(`৳${calculatedDiscountBDT.toLocaleString()} Discount Applied`, `৳${calculatedDiscountBDT.toLocaleString()} ছাড় প্রয়োগ হয়েছে`)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                    >
                      {t('Remove', 'মুছুন')}
                    </button>
                  </div>
                )}
              </div>
              )}

              {/* Price Breakdown */}
              <div className="space-y-3 pt-2 border-t border-gray-100 text-xs">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>{t('Items Subtotal', 'পণ্যের মোট মূল্য')}</span>
                  <span className="font-mono font-bold text-gray-900">{currencySymbol}{subtotalBDT.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-gray-600 font-medium items-start">
                  <div>
                    <span>{t('Shipping Fee', 'ডেলিভারি ফি')}</span>
                    <span className="text-[10px] text-gray-400 block font-normal flex items-center gap-1 mt-0.5">
                      <Clock size={11} className="text-brand-orange" />
                      <span>{t('Est.', 'সম্ভাব্য ডেলিভারি:')} {getEstimatedDates()} ({currentDeliveryDuration})</span>
                    </span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">
                    {baseDeliveryFee === 0 ? <span className="text-emerald-600">{t('FREE', 'ফ্রি')}</span> : `${currencySymbol}${baseDeliveryFee}`}
                  </span>
                </div>

                {paymentMethod === 'cod' && selectedCartItems.length > 0 && (
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>{t('Cash on Delivery Handling', 'ক্যাশ অন ডেলিভারি হ্যান্ডলিং চার্জ')}</span>
                    <span className="font-mono font-bold text-gray-900">{currencySymbol}{codFee}</span>
                  </div>
                )}

                {calculatedDiscountBDT > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>{t('Coupon Voucher Discount', 'কুপন ভাউচার ছাড়')}</span>
                    <span className="font-mono">-{currencySymbol}{calculatedDiscountBDT.toLocaleString()}</span>
                  </div>
                )}

                {/* Payable Total */}
                <div className="pt-4 border-t border-gray-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-black text-gray-900 uppercase tracking-wider">{t('Payable Total', 'সর্বমোট পরিশোধ্য')}</span>
                    <span className="text-[10px] text-gray-400 block font-medium">{t('VAT & Taxes included', 'ভ্যাট ও ট্যাক্স অন্তর্ভুক্ত')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-brand-orange font-mono tracking-tight">
                      {currencySymbol}{totalInBDT.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trust & Guarantee Reassurance Badges */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
                    <RotateCcw size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">{t('7 Days Free Return', '৭ দিনের ফ্রি রিটার্ন সুবিধা')}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{t('Hassle-free replacement or full refund', 'ঝামেলামুক্ত পরিবর্তন বা সম্পূর্ণ রিফান্ড')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">{t('256-Bit SSL Secured Gateway', '২৫৬-বিট এসএসএল সুরক্ষিত গেটওয়ে')}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{t('Bank-grade PCI-DSS payment protection', 'ব্যাংক-মানের পিসিআই-ডিএসএস পেমেন্ট সুরক্ষা')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Truck size={15} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-900 leading-tight">{t('Cash on Delivery Available', 'ক্যাশ অন ডেলিভারি সুবিধা')}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{t('Inspect parcel at doorstep before payment', 'পেমেন্টের আগে দরজায় পার্সেল যাচাই করুন')}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Hover Floating Product Thumbnail Preview Portal */}
      <AnimatePresence>
        {hoveredPreviewImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-[300] pointer-events-none hidden lg:block bg-white p-2 rounded-2xl shadow-2xl border border-gray-200 max-w-[200px]"
            style={{
              left: Math.max(10, hoveredPreviewImage.x - 220),
              top: Math.max(80, hoveredPreviewImage.y - 40)
            }}
          >
            <div className="w-44 h-48 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
              <img src={hoveredPreviewImage.url} alt={t('Preview', 'প্রিভিউ')} className="w-full h-full object-cover" />
            </div>
            <p className="text-[10px] font-bold text-gray-800 truncate mt-1.5 px-1">{hoveredPreviewImage.name}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Mobile Banking Payment Gateway Modal */}
      <AnimatePresence>
        {isGatewayModalOpen && (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket') && (() => {
          const walletNum =
            merchantNumbers[paymentMethod] ||
            (paymentMethod === 'bkash' ? siteConfig?.bkashNumber : paymentMethod === 'nagad' ? siteConfig?.nagadNumber : siteConfig?.rocketNumber) ||
            '01700-112233';
          const brandBg =
            paymentMethod === 'bkash'
              ? 'bg-[#D12053]'
              : paymentMethod === 'nagad'
              ? 'bg-[#ED1B24]'
              : 'bg-[#8C3494]';
          const cleanSender = normalizeBDPhone(senderNumber);
          const isPhoneValid = /^01[3-9]\d{8}$/.test(cleanSender);
          const isTrxValid = /^[A-Z0-9]{6,24}$/.test(transactionId.trim().toUpperCase());

          return (
            <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsGatewayModalOpen(false)}
                className="fixed inset-0 bg-black/65 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="relative z-10 w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-200"
              >
                <div className={`${brandBg} text-white px-6 py-5 flex items-center justify-between`}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                      {t('Verified Payment Gateway', 'সুরক্ষিত পেমেন্ট গেটওয়ে')}
                    </p>
                    <h3 className="text-lg font-black uppercase tracking-tight">
                      {paymentMethod.toUpperCase()} — ৳{totalInBDT.toLocaleString()}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGatewayModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 space-y-5 text-left">
                  <ol className="space-y-2.5 text-xs text-gray-700 bg-gray-50 rounded-2xl p-4 border border-gray-200/80">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>
                        {t(
                          `Open your ${paymentMethod.toUpperCase()} app and choose "Send Money" or "Make Payment".`,
                          `আপনার ${paymentMethod.toUpperCase()} অ্যাপ থেকে "Make Payment" অথবা "Send Money" সিলেক্ট করুন।`
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span className="flex-1">
                        {t('Pay exactly', 'সঠিক পরিমাণ পাঠান:')} <strong className="font-mono text-gray-900">৳{totalInBDT.toLocaleString()}</strong> {t('to', 'এই নম্বরে:')}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(walletNum.replace(/\D/g, ''));
                            showToast(t('Merchant number copied!', 'মার্চেন্ট নম্বর কপি হয়েছে!'), 'success');
                          }}
                          className="font-mono font-black text-brand-orange underline cursor-pointer"
                        >
                          {walletNum}
                        </button>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>{t('Enter your mobile number & TrxID below and verify.', 'নিচে আপনার প্রেরক নম্বর ও TrxID দিয়ে যাচাই করুন।')}</span>
                    </li>
                  </ol>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        {t('Your Wallet Mobile Number', 'আপনার ওয়ালেট নম্বর')}
                      </label>
                      <input
                        type="tel"
                        value={senderNumber}
                        onChange={(e) => {
                          setSenderNumber(formatBDPhone(e.target.value));
                          setVerifiedPayment(null);
                          setGeneralError(null);
                        }}
                        placeholder="01712-345678"
                        className="w-full bg-white border border-gray-200 focus:border-brand-orange px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">
                        {t('Transaction ID (TrxID)', 'ট্রানজেকশন আইডি (TrxID)')}
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => {
                          setTransactionId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                          setVerifiedPayment(null);
                          setGeneralError(null);
                        }}
                        placeholder="9J82K3L4"
                        className="w-full bg-white border border-gray-200 focus:border-brand-orange px-3.5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase outline-none"
                      />
                    </div>
                  </div>

                  {generalError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                      {generalError}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsGatewayModalOpen(false)}
                      className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      {t('Close', 'বন্ধ করুন')}
                    </button>
                    <button
                      type="button"
                      disabled={!isPhoneValid || !isTrxValid || isVerifyingPayment}
                      onClick={() => handleVerifyPaymentNow(true)}
                      className={`flex-1 py-3 rounded-xl ${brandBg} text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isVerifyingPayment
                        ? t('Verifying Payment...', 'পেমেন্ট যাচাই হচ্ছে...')
                        : t('Verify Payment & Continue', 'যাচাই করে এগিয়ে যান')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Processing Order Modal Backdrop */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center"
            >
              <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-6" />
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-wider mb-2">
                {t('Securing Your Order', 'আপনার অর্ডার সুরক্ষিত করা হচ্ছে')}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {t('Verifying transaction credentials and generating your official digital bill...', 'লেনদেনের তথ্য যাচাই করা হচ্ছে এবং অফিসিয়াল ডিজিটাল বিল তৈরি হচ্ছে...')}
              </p>
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <Lock size={12} />
                <span>{t('SSLCommerz Secured Channel', 'এসএসএলকমার্জ সুরক্ষিত চ্যানেল')}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
