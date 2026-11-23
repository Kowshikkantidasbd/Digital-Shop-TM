import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Heart, ShoppingBag, Eye, ShieldCheck, Truck, Check, ArrowRight, Zap } from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  onOpenFullDetail: (product: Product) => void;
  isWishlisted?: boolean;
  onWishlistToggle?: (productId: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onOpenFullDetail,
  isWishlisted,
  onWishlistToggle,
}) => {
  const { t, translateCategory } = useLanguage();
  const [selectedImg, setSelectedImg] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [selectedColor, setSelectedColor] = useState<string>('Default');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  if (!product) return null;

  const currentImage = selectedImg || product.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600';
  const gallery = [product.image, ...(product.gallery || [])].filter(Boolean);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const formattedPrice = Math.round(product.price).toLocaleString();
  const formattedOriginalPrice = product.originalPrice ? Math.round(product.originalPrice).toLocaleString() : null;

  const sizes = product.variants?.sizes?.length ? product.variants.sizes : ['S', 'M', 'L', 'XL'];
  const colors = product.variants?.colors?.length ? product.variants.colors : ['Midnight Black', 'Slate Grey', 'Pearl White'];

  const handleAddToCart = () => {
    onAddToCart(product, quantity, selectedSize, selectedColor);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl z-10 my-auto border border-gray-100 custom-scrollbar"
          id={`quickview-modal-${product.id}`}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center shadow-md transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Image Preview & Gallery */}
            <div className="p-4 sm:p-6 bg-gray-50 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
              <div className="relative aspect-square w-full max-w-[300px] sm:max-w-[340px] md:max-w-none mx-auto md:mx-0 rounded-2xl overflow-hidden bg-white shadow-xs mb-3 sm:mb-4">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {discountPercent > 0 && (
                  <span className="absolute top-3 left-3 bg-amber-400 text-gray-900 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono shadow-sm">
                    -{discountPercent}% {t('OFF', 'ছাড়')}
                  </span>
                )}
                {product.isFlashSale && (
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono shadow-sm flex items-center gap-1">
                    <Zap size={10} className="fill-white" /> {t('Flash Deal', 'ফ্ল্যাশ ডিল')}
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {gallery.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar justify-center md:justify-start">
                  {gallery.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      aria-label={`View photo ${idx + 1} of ${product.name}`}
                      onClick={() => setSelectedImg(img)}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        currentImage === img ? 'border-brand-orange shadow-sm scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`${product.name} gallery preview ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Summary & Selection */}
            <div className="p-4 sm:p-6 md:p-8 flex flex-col justify-between space-y-4 sm:space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange bg-orange-50 px-2 py-0.5 rounded-md font-mono">
                    {translateCategory(product.category)}
                  </span>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold font-mono">{product.rating || '4.8'}</span>
                    <span className="text-gray-400 text-[10px]">({product.reviews || 42} {t('reviews', 'টি রিভিউ')})</span>
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-gray-900 font-display leading-snug">
                  {product.name}
                </h3>

                {/* Price Display */}
                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="text-2xl font-black text-brand-orange font-mono">
                    ৳{formattedPrice}
                  </span>
                  {formattedOriginalPrice && (
                    <span className="text-xs text-gray-400 line-through font-semibold font-mono">
                      ৳{formattedOriginalPrice}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-[11px] font-black text-emerald-600 font-mono">
                      {t('Save', 'সাশ্রয়')} ৳{Math.round(product.originalPrice! - product.price).toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {product.description || t('Premium quality guaranteed with luxury finishing and fast nationwide delivery.', 'প্রিমিয়াম মানের নিশ্চয়তা এবং সারাদেশে দ্রুত ডেলিভারি।')}
                </p>
              </div>

              {/* Variant Selectors */}
              <div className="space-y-3.5 pt-2 border-t border-gray-100">
                {/* Size Selector */}
                <div>
                  <div className="flex justify-between items-center text-xs font-bold text-gray-700 mb-1.5">
                    <span>{t('Size:', 'সাইজ:')} <span className="text-brand-orange font-mono">{selectedSize}</span></span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`min-w-[36px] h-8 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          selectedSize === s
                            ? 'border-brand-orange bg-brand-orange text-white shadow-xs'
                            : 'border-gray-200 text-gray-700 hover:border-brand-orange hover:text-brand-orange'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity & Stock */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">{t('Quantity:', 'পরিমাণ:')}</span>
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 text-sm font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-mono">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:bg-gray-200 text-sm font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold font-mono flex items-center gap-1">
                    <ShieldCheck size={13} /> {t(`In Stock (${product.stock || 24} units left)`, `স্টকে আছে (${product.stock || 24} টি বাকি)`)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <div className="flex gap-2.5">
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      addedAnimation
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                        : 'bg-brand-orange hover:bg-brand-orange-light text-white shadow-orange-500/25 active:scale-95'
                    }`}
                  >
                    {addedAnimation ? (
                      <>
                        <Check size={16} />
                        <span>{t('Added to Cart!', 'কার্টে যোগ হয়েছে!')}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>{t('Add to Cart', 'কার্টে যোগ করুন')} (৳{(product.price * quantity).toLocaleString()})</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onWishlistToggle?.(product.id)}
                    className={`w-12 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
                      isWishlisted
                        ? 'border-rose-300 bg-rose-50 text-rose-500'
                        : 'border-gray-200 hover:border-rose-300 hover:text-rose-500 text-gray-400'
                    }`}
                    title={t('Save to Wishlist', 'উইশলিস্টে রাখুন')}
                  >
                    <Heart size={18} className={isWishlisted ? 'fill-rose-500' : ''} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    onOpenFullDetail(product);
                  }}
                  className="w-full py-2.5 text-center text-xs font-bold text-gray-500 hover:text-brand-orange transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>{t('View Complete Specifications & Reviews', 'সম্পূর্ণ বিবরণ ও রিভিউ দেখুন')}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
