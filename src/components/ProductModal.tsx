import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  X, ShoppingCart, Heart, Share2, Star, 
  ShieldCheck, Truck, RotateCcw, MessageCircle, 
  Store, ChevronRight, ChevronLeft, Facebook, Twitter, Link,
  Zap, Sparkles, MapPin, Ruler, Tag, CreditCard, Flame, HelpCircle, Check, Plus
} from 'lucide-react';
import { Product, User as UserType } from '../types';
import { PRODUCTS } from '../constants';
import { ProductReviews } from './ProductReviews';
import { ProductQA } from './ProductQA';
import { SizeGuideModal } from './SizeGuideModal';
import { AiProductAssistant } from './AiProductAssistant';
import { ErrorBoundary } from './ErrorBoundary';
import { couponApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteConfig } from '../hooks/useSiteConfig';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (p: Product, q: number, s: string, c: string) => void;
  onBuyNow: (p: Product, q: number, s: string, c: string) => void;
  onProductSelect?: (p: Product) => void;
  isWishlisted: boolean;
  onWishlistToggle: () => void;
  onChatWithSeller: (sellerName: string) => void;
  user: UserType | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({ 
  product, 
  onClose, 
  onAddToCart,
  onBuyNow,
  onProductSelect,
  isWishlisted,
  onWishlistToggle,
  onChatWithSeller,
  user
}) => {
  const navigate = useNavigate();
  const { language, t, translateCategory } = useLanguage();
  const { siteConfig } = useSiteConfig();
  const isCouponEnabled = siteConfig?.showCouponCode === true;
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Color 1');
  const [activeTab, setActiveTab] = useState<'reviews' | 'qa'>('reviews');
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [reviewPreview, setReviewPreview] = useState<string | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountRate: number; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [bundleSelected, setBundleSelected] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Dhaka, Banani / Gulshan 2');
  const [selectedArea, setSelectedArea] = useState('Road 11, Dhaka 1213, Bangladesh');
  const [expressFee, setExpressFee] = useState(85);

  useEffect(() => {
    if (product) {
      setActiveImg(0);
      setQuantity(1);
      setSelectedColor('Color 1');
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('');
      // Reset scroll position
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [product?.id]);

  useEffect(() => {
    if (!isCouponEnabled) {
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError('');
    }
  }, [isCouponEnabled]);

  // Frequently bought together bundle complementary items
  const bundleItems = useMemo(() => {
    if (!product) return [];
    return PRODUCTS.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 2);
  }, [product?.id, product?.category]);

  useEffect(() => {
    if (bundleItems.length > 0) {
      const initialMap: Record<string, boolean> = {};
      bundleItems.forEach((item) => {
        initialMap[item.id] = true;
      });
      setBundleSelected(initialMap);
    }
  }, [bundleItems]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setShowStickyBar(scrollRef.current.scrollTop > 500);
      }
    };
    const el = scrollRef.current;
    el?.addEventListener('scroll', handleScroll);
    return () => el?.removeEventListener('scroll', handleScroll);
  }, []);

  const basePrice = product ? product.price : 0;
  const discountPercent = (product && product.originalPrice) 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  // Final price after coupon
  const finalPrice = appliedCoupon 
    ? Math.max(0, basePrice - appliedCoupon.discountAmount) 
    : basePrice;

  // EMI calculation (3 installments)
  const emiPerMonth = Math.round(finalPrice / 3);

  // Dynamic delivery dates
  const today = new Date();
  const deliveryStart = new Date(today);
  deliveryStart.setDate(today.getDate() + 3);
  const deliveryEnd = new Date(today);
  deliveryEnd.setDate(today.getDate() + 6);
  
  const formatDate = (date: Date) => date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' });

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCouponEnabled) return;
    const clean = couponCode.trim().toUpperCase();
    if (!clean) return;

    try {
      const res = await couponApi.validateCoupon(clean, basePrice, user?.email);
      if (res.valid && res.coupon) {
        const discountRate = res.coupon.discountType === 'percentage' ? res.coupon.discount : 0;
        setAppliedCoupon({ 
          code: clean, 
          discountRate, 
          discountAmount: res.discountBDT || 0 
        });
        setCouponError('');
      } else {
        setCouponError(res.error || t('Invalid or expired coupon code.', 'কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ।'));
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError(t('Failed to validate coupon code', 'কুপন কোড যাচাই করা যায়নি'));
      setAppliedCoupon(null);
    }
  };

  const handleAddBundleToCart = () => {
    if (!product) return;
    // Add main product
    onAddToCart(product, quantity, selectedSize, selectedColor);
    // Add selected bundle products
    bundleItems.forEach((bItem) => {
      if (bundleSelected[bItem.id]) {
        onAddToCart(bItem, 1, 'M', 'Color 1');
      }
    });
  };

  const bundleTotal = useMemo(() => {
    if (!product) return 0;
    let total = basePrice;
    bundleItems.forEach((bItem) => {
      if (bundleSelected[bItem.id]) {
        total += bItem.price;
      }
    });
    return total;
  }, [basePrice, bundleItems, bundleSelected]);

  const bundleSavings = useMemo(() => {
    let savings = 0;
    bundleItems.forEach((bItem) => {
      if (bundleSelected[bItem.id]) {
        savings += 150; // extra bundle discount per item
      }
    });
    return savings;
  }, [bundleItems, bundleSelected]);

  const handleShare = async () => {
    if (!product) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsLinkCopied(true);
        setTimeout(() => setIsLinkCopied(false), 2000);
      } catch (err) {
        console.error('Clipboard write failed:', err);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <AnimatePresence>
      {product && (
        <div className="fixed inset-0 z-[300] bg-[#F5F5F5] w-full h-full flex flex-col font-sans overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="w-full h-full bg-[#F5F5F5] overflow-hidden flex flex-col"
          >
            {/* Immersive Top Navigation Bar */}
            <div className="bg-white border-b border-gray-100 px-3 sm:px-5 md:px-8 py-3 flex items-center justify-between gap-2 sticky top-0 z-50 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={onClose} 
                  className="flex items-center gap-1.5 group text-gray-600 hover:text-brand-orange font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                  id="back-to-shop-btn"
                >
                  <ChevronRight size={18} className="rotate-180 transition-transform group-hover:-translate-x-1" />
                  <span>{t('Back to Shop', 'শপে ফিরুন')}</span>
                </button>

                {/* Breadcrumbs */}
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                  <span>/</span>
                  <span 
                    className="hover:text-brand-orange cursor-pointer transition-colors" 
                    onClick={() => {
                      onClose();
                      navigate('/');
                    }}
                  >
                    {t('Home', 'হোম')}
                  </span>
                  <span>/</span>
                  <span 
                    className="hover:text-brand-orange cursor-pointer transition-colors" 
                    onClick={() => {
                      onClose();
                      navigate(`/search?category=${encodeURIComponent(product.category)}`);
                    }}
                  >
                    {translateCategory(product.category)}
                  </span>
                  <span>/</span>
                  <span className="text-gray-700 font-bold truncate max-w-[200px]">{product.name}</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-center">
                <div className="relative">
                  <button onClick={handleShare} className="p-2.5 bg-gray-50 border border-gray-100 hover:bg-brand-orange/5 hover:text-brand-orange rounded-full text-gray-500 transition-all cursor-pointer" title={t('Share Product', 'পণ্য শেয়ার করুন')}>
                    <Share2 size={16} />
                  </button>
                  {isLinkCopied && (
                    <span className="absolute -bottom-7 right-0 bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap shadow-md">
                      {t('Link Copied!', 'লিংক কপি হয়েছে!')}
                    </span>
                  )}
                </div>
                <button 
                  onClick={onWishlistToggle}
                  className={`p-2.5 rounded-full border shadow-xs transition-all cursor-pointer ${isWishlisted ? 'bg-brand-orange/10 border-brand-orange/20 text-brand-orange' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-brand-orange'}`}
                  title={isWishlisted ? t('Remove from Wishlist', 'উইশলিস্ট থেকে সরান') : t('Add to Wishlist', 'উইশলিস্টে যোগ করুন')}
                >
                  <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} className={isWishlisted ? 'animate-heart-pop' : ''} />
                </button>
                <button 
                  onClick={onClose} 
                  className="w-9 h-9 bg-gray-900 hover:bg-rose-500 hover:rotate-90 text-white rounded-full transition-all flex items-center justify-center shadow-md cursor-pointer"
                  title={t('Close', 'বন্ধ করুন')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth bg-[#F5F5F9]" ref={scrollRef}>
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-6 space-y-5 sm:space-y-6 font-sans">
                  
                  {/* Left-Middle-Right Main Grid Block */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs border border-gray-100 p-3.5 sm:p-5 md:p-6 lg:p-8 flex flex-col md:grid md:grid-cols-12 lg:flex lg:flex-row gap-5 md:gap-6 lg:gap-8">
                    
                    {/* Left Column: Image Gallery & Zoom */}
                    <div className="w-full max-w-[380px] mx-auto md:max-w-none md:mx-0 md:col-span-5 lg:w-[400px] shrink-0 space-y-4">
                      <div 
                        className="aspect-square bg-gray-50 rounded-2xl overflow-hidden relative group cursor-crosshair border border-gray-100"
                        onMouseEnter={() => setIsZoomed(true)}
                        onMouseLeave={() => setIsZoomed(false)}
                        onMouseMove={handleMouseMove}
                      >
                        <motion.img 
                          src={product.gallery?.[activeImg] || product.image} 
                          className="w-full h-full object-cover transition-transform duration-500"
                          style={{
                            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                            scale: isZoomed ? 2.5 : 1
                          }}
                          referrerPolicy="no-referrer"
                        />
                        {discountPercent > 0 && (
                          <div className="absolute top-4 left-4 bg-brand-orange text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md font-mono">
                            -{discountPercent}% {t('OFF', 'ছাড়')}
                          </div>
                        )}
                        {product.gallery && product.gallery.length > 1 && (
                          <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] font-black px-2 py-0.5 rounded-md font-mono">
                            {activeImg + 1} / {product.gallery.length}
                          </div>
                        )}
                      </div>
                      
                      {/* Image Thumbnails with slide style */}
                      <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                        {(product.gallery?.length > 0 ? product.gallery : [product.image]).map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImg(i)}
                            aria-label={`${t('View photo', 'ছবি দেখুন')} ${i + 1}`}
                            className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                              activeImg === i 
                                ? 'border-brand-orange shadow-md scale-105 bg-white' 
                                : 'border-gray-50 opacity-70 hover:opacity-100 bg-gray-50'
                            }`}
                          >
                            <img src={img} alt={`${product.name} gallery image ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>

                      {/* Live Social Proof Badge */}
                      <div className="flex items-center gap-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200/50 text-[11px] text-amber-900 font-medium">
                        <Flame size={15} className="text-amber-500 shrink-0" />
                        <span>{t('14 shoppers are viewing this product right now', 'এই মুহূর্তে ১৪ জন ক্রেতা এই পণ্যটি দেখছেন')}</span>
                      </div>

                      <div className="flex items-center gap-6 pt-2 border-t border-gray-100/60 font-mono">
                        <button 
                          onClick={handleShare}
                          className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-orange transition-colors cursor-pointer"
                        >
                          <Share2 size={14} /> {t('Share', 'শেয়ার')}
                        </button>
                        <button 
                          onClick={onWishlistToggle}
                          className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                            isWishlisted ? 'text-brand-orange' : 'text-gray-400 hover:text-brand-orange'
                          }`}
                        >
                          <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} className={isWishlisted ? 'animate-heart-pop text-rose-500' : ''} />
                          {isWishlisted ? t('Saved in List', 'তালিকায় সংরক্ষিত') : t('Add to Wishlist', 'উইশলিস্টে যোগ করুন')}
                        </button>
                      </div>
                    </div>

                    {/* Middle Column: Title, Ratings, Brand, Price, Coupons, EMI, Actions */}
                    <div className="flex-1 min-w-0 md:col-span-7 text-left space-y-5">
                      
                      {/* Brand Logo Banner context if sponsored */}
                      <div className="space-y-2">
                        {product.isSponsored && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/5 border border-amber-500/10 rounded-lg text-[8px] font-black uppercase tracking-widest text-amber-600 font-mono">
                            <Sparkles size={10} className="text-amber-500" /> {t('Sponsored Campaign', 'স্পনসর্ড ক্যাম্পেইন')}
                          </span>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <span className="bg-[#7313a2] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-mono shrink-0">
                            {t('Digital Mall', 'ডিজিটাল মল')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono">
                            {t('Category:', 'ক্যাটাগরি:')} {translateCategory(product.category)}
                          </span>
                        </div>

                        <h1 className="text-lg md:text-2xl font-bold text-gray-900 leading-snug tracking-tight">
                          {product.name}
                        </h1>

                        {/* Ratings & Question counts */}
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <button 
                            type="button" 
                            aria-label={`Jump to customer reviews (${product.reviews || 0} reviews)`}
                            className="flex items-center gap-1.5 text-brand-orange hover:underline cursor-pointer bg-transparent border-0 p-0" 
                            onClick={() => setActiveTab('reviews')}
                          >
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={12} className={i <= Math.floor(product.rating) ? 'fill-brand-orange text-brand-orange' : 'text-gray-200'} />
                              ))}
                            </div>
                            <span className="text-xs font-bold font-mono">{t('Ratings', 'রেটিংস')} ({product.reviews || 0})</span>
                          </button>
                          <div className="h-3 w-[1px] bg-gray-200" />
                          <div className="text-gray-400">
                            {t('Brand:', 'ব্র্যান্ড:')} <span className="text-blue-500 hover:underline cursor-pointer font-bold font-mono">{product.brand || "Digital Shop"}</span>
                          </div>
                          <div className="h-3 w-[1px] bg-gray-200" />
                          <button 
                            onClick={() => setActiveTab('qa')}
                            className="text-blue-500 hover:underline cursor-pointer font-bold text-xs select-none flex items-center gap-1"
                          >
                            <HelpCircle size={12} />
                            <span>{t('Ask Question', 'প্রশ্ন করুন')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Decisive Premium Price Box */}
                      <div className="bg-gradient-to-r from-gray-50/90 to-orange-50/40 p-5 rounded-2xl border border-gray-100 flex flex-col gap-3">
                        <div className="flex items-baseline gap-3.5 flex-wrap">
                          <span className="text-3xl font-black text-brand-orange font-mono">
                            ৳{finalPrice.toLocaleString()}
                          </span>
                          {(product.originalPrice || (isCouponEnabled && appliedCoupon)) && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-400 line-through font-mono">
                                ৳{(product.originalPrice ? product.originalPrice : basePrice).toLocaleString()}
                              </span>
                              {discountPercent > 0 && !(isCouponEnabled && appliedCoupon) && (
                                <span className="text-xs font-black text-white bg-brand-orange px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                  -{discountPercent}%
                                </span>
                              )}
                              {isCouponEnabled && appliedCoupon && (
                                <span className="text-xs font-black text-white bg-emerald-600 px-2 py-0.5 rounded uppercase tracking-wider font-mono flex items-center gap-1">
                                  <Tag size={11} />
                                  {t('Coupon Applied', 'কুপন প্রয়োগ হয়েছে')} (-৳{appliedCoupon.discountAmount.toLocaleString()})
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* EMI / Installment Option */}
                        {finalPrice >= 2000 && (
                          <div className="flex items-center gap-2 text-xs text-gray-700 bg-white/80 px-3 py-2 rounded-xl border border-gray-100 font-sans">
                            <CreditCard size={15} className="text-brand-orange shrink-0" />
                            <span>
                              {t('Or 3 interest-free payments of', 'অথবা ০% সুদে ৩ কিস্তিতে')} <strong className="font-mono text-brand-orange">৳{emiPerMonth.toLocaleString()}/{t('mo', 'মাস')}</strong> {t('with bKash/Cards', 'বিকাশ/কার্ডে')}
                            </span>
                          </div>
                        )}

                        {/* Coupon Code Input Box (Controlled by Admin showCouponCode toggle, OFF by default) */}
                        {isCouponEnabled && (
                          <>
                            <form onSubmit={handleApplyCoupon} className="pt-2 border-t border-gray-100/80 flex flex-col sm:flex-row gap-2 items-stretch">
                              <div className="relative flex-1">
                                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  value={couponCode}
                                  onChange={(e) => setCouponCode(e.target.value)}
                                  placeholder={t('Enter coupon code (e.g. LUXURY10)', 'কুপন কোড লিখুন (যেমন: LUXURY10)')}
                                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs uppercase font-mono font-bold focus:outline-none focus:border-brand-orange"
                                />
                              </div>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-gray-900 hover:bg-brand-orange text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer font-mono shrink-0"
                              >
                                {t('Apply Coupon', 'কুপন ব্যবহার করুন')}
                              </button>
                            </form>
                            {couponError && <p className="text-[11px] text-rose-500 font-bold">{couponError}</p>}
                          </>
                        )}
                      </div>

                      {/* Product Attributes (Color, Size, Stock, Quantity) */}
                      <div className="space-y-4 pt-1">
                        
                        {/* Selected Color Section with Image Variants */}
                        <div className="flex items-start gap-4">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-wider w-16 mt-2">{t('Color', 'রং')}</span>
                          <div className="flex flex-wrap gap-2">
                            {(product.gallery?.length > 0 ? product.gallery : [product.image]).map((img, i) => {
                              const variantName = `Color ${i + 1}`;
                              const isSelected = selectedColor === variantName;
                              return (
                                <button 
                                  key={i} 
                                  onClick={() => {
                                    setSelectedColor(variantName);
                                    setActiveImg(i);
                                  }}
                                  className={`w-12 h-12 rounded-xl border-2 overflow-hidden shadow-xs transition-all relative cursor-pointer ${
                                    isSelected 
                                      ? 'border-brand-orange ring-2 ring-brand-orange/20 scale-105 bg-white' 
                                      : 'border-gray-200 opacity-80 hover:opacity-100 hover:border-gray-300'
                                  }`} 
                                >
                                  <img 
                                    src={img} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                    alt={variantName}
                                  />
                                  {isSelected && (
                                    <div className="absolute inset-x-0 bottom-0 bg-brand-orange text-white text-[7px] font-black uppercase tracking-wider text-center py-0.5">
                                      {t('Active', 'নির্বাচিত')}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Size Section with Size Guide Button */}
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-wider w-16">{t('Size', 'সাইজ')}</span>
                          <div className="flex items-center gap-2 flex-wrap flex-1">
                            {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                              <button
                                key={size}
                                onClick={() => setSelectedSize(size)}
                                className={`px-3.5 py-1.5 text-xs font-black rounded-lg border transition-all cursor-pointer font-mono ${
                                  selectedSize === size 
                                    ? 'border-brand-orange text-brand-orange bg-brand-orange/5 shadow-xs' 
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                {size}
                              </button>
                            ))}

                            {/* Size Guide Link Button */}
                            <button
                              type="button"
                              onClick={() => setIsSizeGuideOpen(true)}
                              className="ml-auto flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                            >
                              <Ruler size={13} />
                              <span>{t('Size Guide', 'সাইজ গাইড')}</span>
                            </button>
                          </div>
                        </div>

                        {/* Low Stock Urgency Indicator */}
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50/80 px-3 py-2 rounded-xl border border-amber-200/50">
                          <Zap size={14} className="text-amber-500 fill-amber-500" />
                          <span>
                            {language === 'bn'
                              ? <>সাইজ <strong>{selectedSize}</strong>-এ মাত্র <strong>৪টি পণ্য বাকি</strong> — দ্রুত অর্ডার করুন!</>
                              : <>Only <strong>4 units left</strong> in size <strong>{selectedSize}</strong> — order soon!</>}
                          </span>
                        </div>

                        {/* Quantity Section with Incrementor & Decrementor */}
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-wider w-16">{t('Quantity', 'পরিমাণ')}</span>
                          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50 focus-within:border-brand-orange transition-colors">
                            <button 
                              onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                              className="px-3.5 py-2 hover:bg-white font-black text-gray-600 transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <input 
                              type="number"
                              value={quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) setQuantity(Math.max(1, val));
                              }}
                              className="w-12 bg-transparent text-center text-xs font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-800"
                            />
                            <button 
                              onClick={() => setQuantity(quantity + 1)} 
                              className="px-3.5 py-2 hover:bg-white font-black text-gray-600 transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Buying Actions Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button 
                          onClick={() => onBuyNow(product, quantity, selectedSize, selectedColor)}
                          className="flex-1 bg-[#26ABD4] hover:bg-[#1fa1cb] text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-98 cursor-pointer font-display"
                        >
                          {t('BUY NOW', 'এখনই কিনুন')}
                        </button>
                        <button 
                          onClick={() => onAddToCart(product, quantity, selectedSize, selectedColor)}
                          className="flex-1 bg-[#F57224] hover:bg-[#e06117] text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer font-display"
                        >
                          <ShoppingCart size={15} /> {t('ADD TO CART', 'কার্টে যোগ করুন')}
                        </button>
                      </div>

                    </div>

                    {/* Right Column Sidebar: Authentic Delivery and Return Panels */}
                    <div className="w-full md:col-span-12 lg:w-[320px] bg-gray-50/60 p-4 sm:p-4.5 rounded-2xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-col justify-between gap-4 sm:gap-5 shrink-0 text-left">
                      
                      {/* Delivery options column context */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between font-mono text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          <span>{t('Delivery Options', 'ডেলিভারি অপশন')}</span>
                          <span className="text-gray-300">ⓘ</span>
                        </div>

                        {/* Map Delivery Pin Location with interactive CHANGE trigger */}
                        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs relative">
                          <div className="flex items-start gap-2.5 text-xs text-gray-700">
                            <MapPin size={16} className="text-brand-orange mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0 pr-12">
                              <span className="font-bold text-gray-800 block truncate">{selectedCity}</span>
                              <span className="text-[10px] text-gray-400 mt-0.5 block truncate">{selectedArea}</span>
                            </div>
                            <button 
                              onClick={() => setIsChangingLocation(!isChangingLocation)}
                              className="absolute right-3 top-3.5 text-[10px] font-black text-blue-500 hover:text-blue-600 tracking-wide uppercase cursor-pointer"
                            >
                              {isChangingLocation ? t('CLOSE', 'বন্ধ') : t('CHANGE', 'পরিবর্তন')}
                            </button>
                          </div>

                          {isChangingLocation && (
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Select Region / Hub:', 'এলাকা / হাব নির্বাচন করুন:')}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {[
                                  { city: 'Dhaka Central (Banani/Gulshan)', area: 'Road 11, Dhaka 1213', fee: 85 },
                                  { city: 'Dhaka North (Uttara/Mirpur)', area: 'Sector 3, Uttara, Dhaka 1230', fee: 95 },
                                  { city: 'Chittagong Metro', area: 'Agrabad C/A, Chattogram 4100', fee: 130 },
                                  { city: 'Sylhet Metro', area: 'Zindabazar Point, Sylhet 3100', fee: 140 },
                                  { city: 'Rajshahi City', area: 'Shaheb Bazar, Rajshahi 6000', fee: 140 },
                                  { city: 'Khulna Metro', area: 'Shib Bari Crossing, Khulna 9100', fee: 140 }
                                ].map((loc) => (
                                  <button
                                    key={loc.city}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCity(loc.city);
                                      setSelectedArea(loc.area);
                                      setExpressFee(loc.fee);
                                      setIsChangingLocation(false);
                                    }}
                                    className={`p-2 rounded-lg text-left border text-[10px] transition-all cursor-pointer ${
                                      selectedCity === loc.city 
                                        ? 'border-brand-orange bg-orange-50/50 font-bold text-brand-orange' 
                                        : 'border-gray-100 hover:bg-gray-50 text-gray-600'
                                    }`}
                                  >
                                    <div className="font-bold truncate">{loc.city}</div>
                                    <div className="text-[9px] text-gray-400 flex justify-between mt-0.5">
                                      <span>৳{loc.fee}</span>
                                      <span>{t('1-3 Days', '১-৩ দিন')}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Methods list with real calculated date estimate */}
                        <div className="space-y-2.5">
                          <div className="flex items-start gap-2.5 text-xs text-gray-700 bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                            <Truck size={16} className="text-brand-orange mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center pr-1">
                                <span className="font-bold text-gray-800">{t('Standard Express Delivery', 'স্ট্যান্ডার্ড এক্সপ্রেস ডেলিভারি')}</span>
                                <span className="font-black text-brand-orange font-mono">৳{expressFee}</span>
                              </div>
                              <p className="text-[10px] font-bold text-emerald-700 mt-1 font-mono">
                                {t('Estimated: Get it by', 'সম্ভাব্য ডেলিভারি:')} {formatDate(deliveryStart)} - {formatDate(deliveryEnd)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 text-xs bg-white p-3 rounded-xl border border-gray-100 shadow-xs">
                            <div className="w-4 h-4 rounded-full bg-orange-100 text-brand-orange flex items-center justify-center font-black font-mono text-[9px] mt-0.5 shrink-0">
                              ৳
                            </div>
                            <div className="flex-1">
                              <span className="font-bold text-gray-800 text-xs">{t('Cash on Delivery Available', 'ক্যাশ অন ডেলিভারি সুবিধা')}</span>
                              <p className="text-[9px] text-gray-400 mt-0.5">{t('Pay in cash or bKash at your doorstep.', 'পণ্য হাতে পেয়ে নগদ বা বিকাশে পেমেন্ট করুন।')}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Returns and Guarantee specifications */}
                      <div className="space-y-3 pt-3 border-t border-gray-100/60">
                        <div className="flex items-center justify-between font-mono text-[10px] font-black uppercase text-gray-400 tracking-wider">
                          <span>{t('Return & Warranty', 'রিটার্ন ও ওয়ারেন্টি')}</span>
                          <span className="text-gray-300">ⓘ</span>
                        </div>

                        <div className="space-y-2.5">
                          <div className="flex items-start gap-2.5 text-xs">
                            <RotateCcw size={15} className="text-gray-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-gray-800">{t('14 Days Easy Returns', '১৪ দিনে সহজ রিটার্ন')}</span>
                              <p className="text-[9px] text-gray-400 mt-0.5">{t('Hassle-free return policy if not satisfied.', 'সন্তুষ্ট না হলে ঝামেলামুক্ত রিটার্ন সুবিধা।')}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 text-xs">
                            <ShieldCheck size={15} className="text-gray-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-gray-800">{t('100% Brand Authentic', '১০০% ব্র্যান্ড অরিজিনাল')}</span>
                              <p className="text-[9px] text-gray-400 mt-0.5">{t('Guaranteed original items with barcode seal.', 'বারকোড সিলসহ অরিজিনাল পণ্যের নিশ্চয়তা।')}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Brand Merchant Sold By section */}
                      <div className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-3.5 shadow-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest font-mono">{t('Merchant Seller', 'বিক্রেতা প্রতিষ্ঠান')}</p>
                            <span className="text-xs font-black text-gray-900 block truncate uppercase tracking-tight mt-0.5">
                              {product.brand || "Digital Shop Official Store"}
                            </span>
                            <span className="inline-block mt-1 bg-purple-700 text-white text-[8px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                              {t('Verified Merchant', 'যাচাইকৃত বিক্রেতা')}
                            </span>
                          </div>
                          
                          <button 
                            onClick={() => onChatWithSeller(product.brand || "Digital Shop Merchant")}
                            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <MessageCircle size={12} /> {t('Chat', 'চ্যাট')}
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-3 border-t border-gray-50 text-center font-mono">
                          <div>
                            <div className="text-[11px] font-black text-gray-800">98%</div>
                            <p className="text-[8px] text-gray-400 uppercase tracking-tight font-sans">{t('Seller Grade', 'বিক্রেতা মান')}</p>
                          </div>
                          <div>
                            <div className="text-[11px] font-black text-gray-800">99%</div>
                            <p className="text-[8px] text-gray-400 uppercase tracking-tight font-sans">{t('Ship On-Time', 'সময়ে ডেলিভারি')}</p>
                          </div>
                          <div>
                            <div className="text-[11px] font-black text-gray-800">95%</div>
                            <p className="text-[8px] text-gray-400 uppercase tracking-tight font-sans">{t('Response', 'রেসপন্স হার')}</p>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Frequently Bought Together Bundle Section */}
                  {bundleItems.length > 0 && (
                    <div className="w-full max-w-full box-border bg-white rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-100 shadow-xs space-y-4 text-left overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
                            <Plus size={16} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider font-mono">
                              {t('Frequently Bought Together', 'একসাথে বেশি কেনা হয়')}
                            </h3>
                            <p className="text-xs text-gray-400 font-medium">{t('Bundle these complementary items and save instantly', 'সহযোগী পণ্যগুলো বান্ডেল করে তাৎক্ষণিক সাশ্রয় করুন')}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:text-right">
                          <span className="text-xs text-gray-400">{t('Bundle:', 'বান্ডেল:')} </span>
                          <span className="text-base font-black text-brand-orange font-mono">৳{(bundleTotal - bundleSavings).toLocaleString()}</span>
                          {bundleSavings > 0 && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold font-mono">{t('Save', 'সাশ্রয়')} ৳{bundleSavings}</span>
                          )}
                        </div>
                      </div>

                      {/* Items Row / Flex layout */}
                      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 pt-2 w-full max-w-full">
                        {/* Main Item */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-2xl border border-gray-100 flex-1 min-w-0">
                          <img src={product.image} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0" alt={product.name} />
                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] bg-brand-orange/10 text-brand-orange font-black px-1.5 py-0.5 rounded uppercase font-mono">{t('Current item', 'বর্তমান পণ্য')}</span>
                            <p className="text-xs font-bold text-gray-800 truncate mt-0.5" title={product.name}>{product.name}</p>
                            <p className="text-xs font-black text-brand-orange font-mono">৳{basePrice.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Plus & Bundle Items */}
                        {bundleItems.map((bItem) => (
                          <React.Fragment key={bItem.id}>
                            <div className="hidden xl:flex items-center justify-center text-gray-300 font-bold text-base px-1">
                              +
                            </div>
                            <div 
                              onClick={() => setBundleSelected((prev) => ({ ...prev, [bItem.id]: !prev[bItem.id] }))}
                              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer flex-1 min-w-0 ${
                                bundleSelected[bItem.id]
                                  ? 'bg-orange-50/30 border-brand-orange/40 shadow-2xs'
                                  : 'bg-gray-50/40 border-gray-100 opacity-60'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${bundleSelected[bItem.id] ? 'bg-brand-orange border-brand-orange text-white' : 'border-gray-300 bg-white'}`}>
                                {bundleSelected[bItem.id] && <Check size={13} />}
                              </div>
                              <img src={bItem.image} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0" alt={bItem.name} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-800 truncate" title={bItem.name}>{bItem.name}</p>
                                <p className="text-xs font-black text-brand-orange font-mono">৳{Math.round(bItem.price).toLocaleString()}</p>
                              </div>
                            </div>
                          </React.Fragment>
                        ))}

                        {/* Bundle Action Button */}
                        <div className="w-full xl:w-auto shrink-0 pt-2 xl:pt-0">
                          <button
                            onClick={handleAddBundleToCart}
                            className="w-full xl:w-auto px-6 py-3.5 bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-display"
                          >
                            <ShoppingCart size={15} />
                            <span>{t('Add Bundle to Cart', 'বান্ডেল কার্টে যোগ করুন')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Specifications and Description */}
                  <div className="bg-white rounded-3xl p-5 md:p-8 border border-gray-100 shadow-xs space-y-6 text-left">
                    <div className="border-b border-gray-100 pb-4">
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest font-mono">
                        {t('Product Details & Specifications', 'পণ্যের বিবরণ ও স্পেসিফিকেশন')}
                      </h3>
                    </div>

                    {/* Specifications block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 border-b border-gray-100/60 pb-6">
                      {(product.specifications || [
                        { label: t('Product Name', 'পণ্যের নাম'), value: product.name },
                        { label: t('Category', 'ক্যাটাগরি'), value: translateCategory(product.category) },
                        { label: t('Authenticity Guarantee', 'অরিজিনাল নিশ্চয়তা'), value: t('100% Genuine Certified', '১০০% আসল ও প্রত্যয়িত') },
                        { label: t('Brand & Manufacturer', 'ব্র্যান্ড ও প্রস্তুতকারক'), value: product.brand || t('Digital Shop Collection', 'ডিজিটাল শপ কালেকশন') },
                        { label: t('Packaging', 'প্যাকেজিং'), value: t('Tamper-Proof Secure Box', 'সুরক্ষিত ও সিল করা বক্স') }
                      ]).map((spec, i) => (
                        <div key={i} className="flex gap-4 text-xs py-2 border-b border-gray-50 font-sans">
                          <span className="w-36 text-gray-400 font-bold uppercase tracking-wider">{spec.label}</span>
                          <span className="text-gray-800 font-black">{spec.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Expandable Paragraph containing descriptions */}
                    <div className="relative">
                      <div 
                        className={`prose prose-sm max-w-none transition-all duration-300 overflow-hidden ${
                          isDescriptionExpanded ? 'max-h-none' : 'max-h-[140px]'
                        }`}
                      >
                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line font-medium">
                          {product.details || product.description || t(
                            `High quality ${product.name} sourced with premium international standards. Built with durable materials and certified safety inspections. Safe, elegant and engineered for longevity.`,
                            `উচ্চমানের আন্তর্জাতিক মানদণ্ডে তৈরি ${product.name}। টেকসই উপাদান ও নিরাপদ মান পরীক্ষিত, যা দীর্ঘস্থায়ী ব্যবহারের জন্য উপযুক্ত।`
                          )}
                        </p>
                        
                        {!isDescriptionExpanded && (
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        )}
                      </div>

                      {/* VIEW MORE / LESS Trigger */}
                      <div className="pt-4 text-center">
                        <button 
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="px-6 py-2.5 border border-blue-500 hover:bg-blue-50 text-blue-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all font-mono cursor-pointer"
                        >
                          {isDescriptionExpanded ? t('VIEW LESS', 'কম দেখুন') : t('VIEW MORE', 'আরও দেখুন')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reviews & Q&A Unified Tabs Section */}
                  <div className="bg-white rounded-3xl p-5 md:p-8 border border-gray-100 shadow-xs text-left">
                    <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-6">
                      <button
                        onClick={() => setActiveTab('reviews')}
                        className={`text-xs sm:text-sm font-black uppercase tracking-wider pb-1 transition-all cursor-pointer font-mono ${
                          activeTab === 'reviews'
                            ? 'text-brand-orange border-b-2 border-brand-orange'
                            : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {t('Ratings & Verified Reviews', 'রেটিং ও যাচাইকৃত রিভিউ')} ({product.reviews || 12})
                      </button>

                      <button
                        onClick={() => setActiveTab('qa')}
                        className={`text-xs sm:text-sm font-black uppercase tracking-wider pb-1 transition-all cursor-pointer font-mono flex items-center gap-1.5 ${
                          activeTab === 'qa'
                            ? 'text-brand-orange border-b-2 border-brand-orange'
                            : 'text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        <HelpCircle size={15} />
                        <span>{t('Questions & Answers', 'প্রশ্ন ও উত্তর')}</span>
                      </button>
                    </div>

                    {activeTab === 'reviews' ? (
                      <ProductReviews product={product} user={user} />
                    ) : (
                      <ProductQA product={product} user={user} />
                    )}
                  </div>

                  {/* People also viewed Related list (3D Glass Carousel) */}
                  <div className="bg-gradient-to-br from-white via-gray-50/50 to-orange-50/20 rounded-3xl p-5 md:p-8 border border-gray-200/80 shadow-xs text-left relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-4 mb-6">
                      <div>
                        <h3 className="text-sm md:text-base font-black text-gray-900 uppercase tracking-wider font-mono flex flex-wrap items-center gap-2">
                          <span>{t('People Also Viewed', 'অন্যরা যা দেখেছেন')}</span>
                          <span className="bg-brand-orange/10 text-brand-orange text-[9px] font-mono px-2 py-0.5 rounded-full border border-brand-orange/20 font-bold">{t('Recommended', 'প্রস্তাবিত')}</span>
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">{t('Explore matching products in rich perspective', 'সম্পর্কিত আরও সেরা পণ্যগুলো দেখুন')}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => scrollCarousel('left')}
                          className="w-9 h-9 rounded-full bg-gradient-to-br from-white to-gray-100 hover:from-orange-500 hover:to-amber-500 text-gray-700 hover:text-white border border-gray-200 flex items-center justify-center transition-all duration-300 shadow-xs active:scale-90 cursor-pointer"
                          aria-label={t('Scroll left', 'বামে স্ক্রল করুন')}
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button 
                          onClick={() => scrollCarousel('right')}
                          className="w-9 h-9 rounded-full bg-gradient-to-br from-white to-gray-100 hover:from-orange-500 hover:to-amber-500 text-gray-700 hover:text-white border border-gray-200 flex items-center justify-center transition-all duration-300 shadow-xs active:scale-90 cursor-pointer"
                          aria-label={t('Scroll right', 'ডানে স্ক্রল করুন')}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>

                    <div 
                      ref={carouselRef}
                      className="flex gap-5 overflow-x-auto pb-4 pt-2 px-1 scroll-smooth snap-x no-scrollbar"
                    >
                      {PRODUCTS.filter(p => p.id !== product.id).slice(0, 10).map(p => {
                        const discount = p.originalPrice 
                          ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) 
                          : 0;

                        return (
                          <div
                            key={p.id}
                            onClick={() => onProductSelect?.(p)}
                            className="w-[180px] sm:w-[200px] md:w-[220px] shrink-0 bg-white/95 rounded-2xl p-3.5 border border-gray-200/80 hover:border-brand-orange shadow-xs hover:shadow-lg transition-all duration-300 text-left snap-start group cursor-pointer flex flex-col justify-between"
                          >
                            <div>
                              <div className="aspect-[4/5] rounded-xl overflow-hidden mb-3 bg-gray-50 relative border border-gray-100">
                                <img 
                                  src={p.image} 
                                  alt={p.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                  referrerPolicy="no-referrer" 
                                />
                                {discount > 0 && (
                                  <div className="absolute top-2 left-2 bg-brand-orange text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs font-mono uppercase">
                                    -{discount}%
                                  </div>
                                )}
                                {p.rating && (
                                  <div className="absolute bottom-2 left-2 bg-white/95 px-2 py-0.5 rounded-md text-[9.5px] font-black text-gray-800 flex items-center gap-1 shadow-xs border border-gray-100">
                                    <Star size={10} className="fill-amber-400 text-amber-400" />
                                    <span>{p.rating}</span>
                                  </div>
                                )}
                              </div>

                              <h4 className="text-[12.5px] font-extrabold text-gray-800 line-clamp-2 min-h-[36px] leading-snug group-hover:text-brand-orange transition-colors mb-2">
                                {p.name}
                              </h4>
                            </div>

                            <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1 mt-auto">
                              <div className="flex items-baseline gap-1.5 font-mono">
                                <span className="text-sm font-black text-brand-orange">
                                  ৳{Math.round(p.price).toLocaleString()}
                                </span>
                                {p.originalPrice && (
                                  <span className="text-[10px] text-gray-400 line-through font-medium">
                                    ৳{Math.round(p.originalPrice).toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <div className="w-6 h-6 rounded-full bg-orange-50 text-brand-orange flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={14} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>

          {/* Mobile Sticky Add-to-Cart Bar */}
          <AnimatePresence>
            {showStickyBar && (
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 flex items-center gap-3 z-[250] shadow-2xl"
              >
                <div className="text-left font-mono">
                  <p className="text-[10px] text-gray-400 uppercase font-black">{t('Total', 'মোট')}</p>
                  <p className="text-base font-black text-brand-orange">৳{finalPrice.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => onAddToCart(product, quantity, selectedSize, selectedColor)}
                  className="flex-1 bg-[#FFB916] hover:bg-[#e0a413] text-white h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ShoppingCart size={15} />
                  <span>{t('Add to Cart', 'কার্টে যোগ')}</span>
                </button>
                <button 
                  onClick={() => onBuyNow(product, quantity, selectedSize, selectedColor)}
                  className="flex-1 bg-[#F57224] hover:bg-[#d95d13] text-white h-11 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
                >
                  {t('Buy Now', 'কিনুন')}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Size Guide Modal */}
          <SizeGuideModal
            isOpen={isSizeGuideOpen}
            onClose={() => setIsSizeGuideOpen(false)}
            category={product.category}
          />

          {/* Review Image Preview Modal */}
          <AnimatePresence>
            {reviewPreview && (
              <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setReviewPreview(null)}
                  className="absolute inset-0 bg-black/90 backdrop-blur-xs"
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative max-w-4xl max-h-full aspect-square md:aspect-video rounded-2xl overflow-hidden shadow-2xl"
                >
                  <img src={reviewPreview} alt="Customer review photo attachment preview" className="w-full h-full object-contain" />
                  <button 
                    type="button"
                    aria-label="Close photo preview"
                    onClick={() => setReviewPreview(null)}
                    className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
        {product && (
          <ErrorBoundary>
            <AiProductAssistant product={product} />
          </ErrorBoundary>
        )}
      </div>
      )}
    </AnimatePresence>
  );
};

