import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { ShoppingBag, Star, Heart, Eye, Scale } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
  onClick: (p: Product) => void;
  isWishlisted?: boolean;
  onWishlistToggle?: (productId: string) => void;
  onQuickView?: (p: Product) => void;
  isCompared?: boolean;
  onCompareToggle?: (p: Product) => void;
}

// Format number in Bangladeshi Taka without decimals and with thousands separators (e.g. 1,330)
export const formatBDT = (amount: number): string => {
  return new Intl.NumberFormat('en-BD', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(amount || 0));
};

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" fill="%23f3f4f6" viewBox="0 0 24 24"><rect width="24" height="24" fill="%23f3f4f6"/><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="%239ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const ProductCardComponent: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onClick,
  isWishlisted,
  onWishlistToggle,
  onQuickView,
  isCompared,
  onCompareToggle,
}) => {
  const { t } = useLanguage();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  let rawSrc = !imgError && (product.image || product.images?.[0] || product.gallery?.[0])
    ? (product.image || product.images?.[0] || product.gallery?.[0])
    : FALLBACK_IMAGE;

  if (rawSrc.includes('images.unsplash.com')) {
    rawSrc = rawSrc.includes('w=')
      ? rawSrc.replace(/w=\d+/, 'w=400')
      : `${rawSrc}${rawSrc.includes('?') ? '&' : '?'}w=400`;
  }
  const imgSrc = rawSrc;

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const hasDiscount =
    typeof product.originalPrice === 'number' && product.originalPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const reviewCount = typeof product.reviews === 'number' && product.reviews > 0
    ? product.reviews
    : (product.rating ? Math.round(Number(product.rating) * 15) : 0);

  const ratingValue = Number(product.rating) || 5;

  // Render 5 small stars supporting half stars (Daraz style: compact gold stars)
  const renderStars = (rating: number) => {
    const stars = [];
    const score = Math.max(0, Math.min(5, rating));
    for (let i = 1; i <= 5; i++) {
      if (score >= i) {
        // Full gold star
        stars.push(
          <Star key={i} size={10} className="fill-[#faca51] text-[#faca51] shrink-0" />
        );
      } else if (score >= i - 0.5) {
        // Half star
        stars.push(
          <span key={i} className="relative inline-block w-2.5 h-2.5 shrink-0">
            <Star size={10} className="text-[#e0e0e0] absolute inset-0" />
            <span className="overflow-hidden w-1/2 absolute inset-0 inline-block">
              <Star size={10} className="fill-[#faca51] text-[#faca51]" />
            </span>
          </span>
        );
      } else {
        // Empty star
        stars.push(
          <Star key={i} size={10} className="fill-[#e0e0e0] text-[#e0e0e0] shrink-0" />
        );
      }
    }
    return stars;
  };

  return (
    <motion.article
      onClick={() => onClick(product)}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-[3px] border border-[#ededed] hover:border-orange-200/90 hover:shadow-lg transition-all duration-300 flex flex-col h-full font-sans group cursor-pointer relative overflow-hidden select-none"
      id={`product-${product.id}`}
    >
      {/* 1. Square Product Image (Daraz Marketplace 1:1 ratio) */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#f5f5f5]">
        {/* Soft grey skeleton loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-[#ebebeb] animate-pulse" />
        )}

        <img
          src={imgSrc}
          alt={product.name || 'Product'}
          width="300"
          height="300"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImgError(true);
            setImageLoaded(true);
          }}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Shimmer light sweep on image hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        {/* Badges: Out of stock (grey overlay), Free delivery */}
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1 z-10 pointer-events-none">
          {product.freeShipping && !isOutOfStock && (
            <span className="bg-emerald-600 text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase tracking-wide shadow-xs">
              {t('Free Delivery', 'ফ্রি ডেলিভারি')}
            </span>
          )}
          {product.isFlashSale && !isOutOfStock && (
            <span className="bg-red-600 text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-[2px] uppercase tracking-wide shadow-xs">
              {t('Flash Deal', 'ফ্ল্যাশ ডিল')}
            </span>
          )}
        </div>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-gray-900/65 backdrop-blur-[1px] flex items-center justify-center z-20">
            <span className="bg-gray-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-[2px] uppercase tracking-wider shadow-sm">
              {t('Out of stock', 'স্টক শেষ')}
            </span>
          </div>
        )}

        {/* Quick action tray: Desktop hover column + crisp touch-friendly Wishlist/Cart accessibility on mobile & tablet */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex flex-col gap-1.5 z-20 transition-all duration-300 ease-out">
          {/* Wishlist button - always visible on touch viewports (< lg), hover reveal on desktop */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onWishlistToggle?.(product.id);
            }}
            aria-label={isWishlisted ? t('Remove from wishlist', 'উইশলিস্ট থেকে সরান') : t('Add to wishlist', 'উইশলিস্টে যোগ করুন')}
            title={isWishlisted ? t('In Wishlist', 'উইশলিস্টে আছে') : t('Add to Wishlist', 'উইশলিস্টে রাখুন')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange lg:opacity-0 lg:group-hover:opacity-100 ${
              isWishlisted ? '!opacity-100 text-rose-500' : 'text-gray-500 hover:text-rose-500'
            }`}
          >
            <Heart
              size={13}
              className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''}
            />
          </button>

          {/* Quick view & Compare buttons - shown on hover for lg+ desktop and md+ tablet */}
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              aria-label={t('Quick view', 'দ্রুত দেখুন')}
              title={t('Quick View', 'দ্রুত দেখুন')}
              className="hidden sm:flex lg:opacity-0 lg:group-hover:opacity-100 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs text-gray-600 hover:text-brand-orange items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange"
            >
              <Eye size={13} />
            </button>
          )}

          {onCompareToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCompareToggle(product);
              }}
              aria-label={t('Compare product', 'পণ্য তুলনা করুন')}
              title={t('Compare', 'তুলনা করুন')}
              className={`hidden sm:flex lg:opacity-0 lg:group-hover:opacity-100 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 backdrop-blur-xs items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                isCompared ? '!opacity-100 text-blue-600 ring-2 ring-blue-500' : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              <Scale size={12} />
            </button>
          )}

          {/* Add to cart button on desktop hover tray */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) {
                onAddToCart(product);
              }
            }}
            aria-label={t('Add to cart', 'কার্টে যোগ করুন')}
            title={isOutOfStock ? t('Out of stock', 'স্টক শেষ') : t('Add to Cart', 'কার্টে যোগ করুন')}
            className={`hidden lg:flex lg:opacity-0 lg:group-hover:opacity-100 w-8 h-8 rounded-full items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
              isOutOfStock
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-brand-orange hover:bg-orange-600 text-white shadow-orange-500/20'
            }`}
          >
            <ShoppingBag size={13} />
          </button>
        </div>

        {/* Dedicated bottom-right Add to Cart tap target on mobile & tablet (< lg) so it never blocks badges or crowds the top edge */}
        {!isOutOfStock && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            aria-label={t('Add to cart', 'কার্টে যোগ করুন')}
            title={t('Add to Cart', 'কার্টে যোগ করুন')}
            className="lg:hidden absolute bottom-2 right-2 z-20 w-8 h-8 rounded-full bg-brand-orange hover:bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/30 active:scale-90 transition-transform"
          >
            <ShoppingBag size={14} />
          </button>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between bg-white">
        {/* Title: 2 lines with ellipsis, dark text, clean typography */}
        <div>
          <h3
            title={product.name}
            className="text-xs sm:text-[13px] font-normal text-[#212121] leading-[18px] line-clamp-2 h-[36px] overflow-hidden group-hover:text-[#f85606] transition-colors"
          >
            {product.name}
          </h3>
        </div>

        {/* Price & Rating */}
        <div className="pt-1.5 space-y-1">
          {/* Price & Discount row */}
          <div className="flex items-baseline gap-1.5 flex-wrap tabular-nums">
            <span className="text-[15px] sm:text-[17px] font-bold text-[#f85606] leading-none tracking-tight">
              ৳{formatBDT(product.price)}
            </span>

            {hasDiscount && (
              <span className="text-[11px] sm:text-xs text-[#9e9e9e] font-normal leading-none">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Rating stars & Review count (e.g. ★★★★★(66)) */}
          <div className="flex items-center gap-1 min-h-[14px]">
            <div className="flex items-center gap-[1px]">
              {renderStars(ratingValue)}
            </div>
            <span className="text-[11px] text-[#9e9e9e] font-sans leading-none">
              ({reviewCount})
            </span>
          </div>

          {/* Optional sold count if present */}
          {typeof product.soldCount === 'number' && product.soldCount > 0 && (
            <p className="text-[10.5px] text-[#9e9e9e] leading-none pt-0.5">
              {product.soldCount} {t('sold', 'টি বিক্রি হয়েছে')}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export const ProductCard = React.memo(ProductCardComponent);
