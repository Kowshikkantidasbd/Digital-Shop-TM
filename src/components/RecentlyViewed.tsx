import React from 'react';
import { motion } from 'motion/react';
import { History, Trash2, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useLanguage } from '../contexts/LanguageContext';

interface RecentlyViewedProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onClearHistory: () => void;
  wishlist: string[];
  onWishlistToggle: (productId: string) => void;
  onQuickView?: (product: Product) => void;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
  products,
  onAddToCart,
  onProductClick,
  onClearHistory,
  wishlist,
  onWishlistToggle,
  onQuickView,
}) => {
  const { t } = useLanguage();
  if (!products || products.length === 0) return null;

  return (
    <section className="space-y-4 sm:space-y-6 pt-4 border-t border-gray-100/80">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-50 text-brand-orange rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs shrink-0">
            <History size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-black text-gray-900 font-display truncate">{t('Recently Viewed', 'সম্প্রতি দেখা পণ্য')}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 font-mono truncate">
              {t('Pick up where you left off', 'যেখান থেকে শেষ করেছিলেন সেখান থেকে দেখুন')}
            </p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="text-xs font-semibold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1.5 cursor-pointer p-2 rounded-xl hover:bg-gray-50 shrink-0"
        >
          <Trash2 size={13} />
          <span className="hidden xs:inline">{t('Clear History', 'হিস্ট্রি মুছুন')}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-4">
        {products.slice(0, 6).map((product) => (
          <ProductCard
            key={`recent-${product.id}`}
            product={product}
            onAddToCart={onAddToCart}
            onClick={onProductClick}
            isWishlisted={wishlist.includes(product.id)}
            onWishlistToggle={onWishlistToggle}
            onQuickView={onQuickView}
          />
        ))}
      </div>
    </section>
  );
};
