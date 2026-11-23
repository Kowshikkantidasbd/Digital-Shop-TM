import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, ShoppingBag, Trash2, CheckCircle2, ShieldCheck, Truck, Zap, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductComparisonModalProps {
  products: Product[];
  onClose: () => void;
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  products,
  onClose,
  onRemoveProduct,
  onClearAll,
  onAddToCart,
  onProductClick,
}) => {
  const { t, translateCategory } = useLanguage();
  if (products.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[360] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 my-auto border border-gray-100 flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50/50 via-white to-amber-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-gray-900 font-display">
                  {t('Product Comparison', 'পণ্যের তুলনা')}
                </h3>
                <span className="bg-brand-orange text-white text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                  {products.length} {products.length === 1 ? t('Item', 'টি পণ্য') : t('Items', 'টি পণ্য')}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-normal mt-0.5">
                {t('Compare price, specifications, ratings, and features side-by-side', 'পাশাপাশি দাম, বৈশিষ্ট্য, রেটিং ও গুণমান তুলনা করুন')}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {products.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={14} />
                  <span>{t('Clear All', 'সব মুছুন')}</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
                aria-label={t('Close comparison', 'তুলনা বন্ধ করুন')}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto custom-scrollbar p-4 sm:p-6 pb-6">
            <div className="min-w-[650px]">
              <div className="grid gap-4" style={{ gridTemplateColumns: `180px repeat(${products.length}, minmax(180px, 1fr))` }}>
                {/* Column 1: Labels */}
                <div className="space-y-6 pt-32 text-xs font-bold text-gray-400 font-mono uppercase tracking-wider">
                  <div className="h-10 flex items-center border-b border-gray-100">{t('Price', 'মূল্য')}</div>
                  <div className="h-10 flex items-center border-b border-gray-100">{t('Category', 'ক্যাটাগরি')}</div>
                  <div className="h-10 flex items-center border-b border-gray-100">{t('Customer Rating', 'গ্রাহক রেটিং')}</div>
                  <div className="h-10 flex items-center border-b border-gray-100">{t('Shipping', 'শিপিং')}</div>
                  <div className="h-10 flex items-center border-b border-gray-100">{t('Stock Availability', 'স্টক অবস্থা')}</div>
                  <div className="h-10 flex items-center border-b border-gray-100">{t('Brand / Origin', 'ব্র্যান্ড')}</div>
                  <div className="h-12 flex items-center">{t('Action', 'অ্যাকশন')}</div>
                </div>

                {/* Product Columns */}
                {products.map((p) => {
                  const discountPercent = p.originalPrice
                    ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                    : 0;

                  return (
                    <div key={p.id} className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
                      {/* Product Header Card */}
                      <div className="relative group mb-4">
                        <button
                          onClick={() => onRemoveProduct(p.id)}
                          className="absolute -top-2 -right-2 z-10 w-7 h-7 bg-white shadow-md rounded-full text-gray-400 hover:text-rose-500 hover:scale-110 flex items-center justify-center transition-all cursor-pointer border border-gray-100"
                          title="Remove item"
                        >
                          <X size={14} />
                        </button>
                        <div
                          className="aspect-square rounded-xl overflow-hidden bg-white mb-2 cursor-pointer shadow-2xs"
                          onClick={() => {
                            onClose();
                            onProductClick(p);
                          }}
                        >
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                        </div>
                        <h4
                          onClick={() => {
                            onClose();
                            onProductClick(p);
                          }}
                          className="text-xs font-black text-gray-800 line-clamp-2 hover:text-brand-orange transition-colors cursor-pointer"
                        >
                          {p.name}
                        </h4>
                      </div>

                      {/* Specs Rows */}
                      <div className="space-y-6 text-xs text-gray-700">
                        {/* Price */}
                        <div className="h-10 flex flex-col justify-center border-b border-gray-200/60">
                          <span className="font-black text-brand-orange font-mono text-sm">
                            ৳{Math.round(p.price).toLocaleString()}
                          </span>
                          {p.originalPrice && (
                            <span className="text-[10px] text-gray-400 line-through font-mono">
                              ৳{Math.round(p.originalPrice).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Category */}
                        <div className="h-10 flex items-center border-b border-gray-200/60 font-semibold text-gray-600">
                          {translateCategory(p.category)}
                        </div>

                        {/* Rating */}
                        <div className="h-10 flex items-center gap-1 border-b border-gray-200/60 font-bold">
                          <Star size={13} className="fill-amber-400 text-amber-400" />
                          <span>{p.rating || '4.8'}</span>
                          <span className="text-gray-400 text-[10px]">({p.reviews || 30}+)</span>
                        </div>

                        {/* Shipping */}
                        <div className="h-10 flex items-center border-b border-gray-200/60 font-bold text-emerald-600">
                          {p.freeShipping ? t('Free Nationwide', 'ফ্রি ডেলিভারি') : t('৳60 Flat Rate', '৳৬০ ফ্ল্যাট রেট')}
                        </div>

                        {/* Stock */}
                        <div className="h-10 flex items-center border-b border-gray-200/60 font-semibold text-gray-600">
                          {p.stock ? t(`${p.stock} units in Dhaka warehouse`, `ঢাকা ওয়্যারহাউসে ${p.stock} টি`) : t('In Stock', 'স্টকে আছে')}
                        </div>

                        {/* Brand */}
                        <div className="h-10 flex items-center border-b border-gray-200/60 font-semibold text-gray-600">
                          {p.brand || t('Luxury Verified', 'ভেরিফায়েড ব্র্যান্ড')}
                        </div>

                        {/* Action */}
                        <div className="h-12 flex items-center pt-2">
                          <button
                            onClick={() => onAddToCart(p)}
                            className="w-full py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <ShoppingBag size={14} />
                            <span>{t('Add to Cart', 'কার্টে যোগ করুন')}</span>
                          </button>
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
    </AnimatePresence>
  );
};
