import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, ShoppingBag, Trash2, ArrowRight, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { PRODUCTS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

interface WishlistSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistIds: string[];
  onRemove: (id: string) => void;
  onMoveToCart: (product: Product) => void;
}

export const WishlistSidebar: React.FC<WishlistSidebarProps> = ({
  isOpen,
  onClose,
  wishlistIds = [],
  onRemove,
  onMoveToCart
}) => {
  const navigate = useNavigate();
  const { t, translateCategory } = useLanguage();
  const wishlistItems = PRODUCTS.filter(p => (wishlistIds || []).includes(p.id));

  // Close with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleStartBrowsing = () => {
    onClose();
    navigate('/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex justify-end font-sans">
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/45 backdrop-blur-[4px] cursor-pointer"
          />

          {/* Right Sliding Side Drawer Sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="relative w-full max-w-[440px] h-full bg-[#F5F5F9] shadow-2xl flex flex-col z-10 border-l border-white/10"
          >
            {/* Elegant Header Area */}
            <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center shadow-inner">
                  <Heart size={20} fill="currentColor" className="animate-pulse" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">{t('Wishlist', 'পছন্দের তালিকা')}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono">{(wishlistItems?.length || 0)} {t('Saved Items', 'টি সংরক্ষিত পণ্য')}</p>
                </div>
              </div>

              <button 
                type="button"
                onClick={onClose} 
                className="w-8 h-8 bg-gray-50 hover:bg-rose-500 hover:text-white rounded-full transition-all flex items-center justify-center border border-gray-100 cursor-pointer active:scale-90"
                title={t('Close Wishlist', 'উইশলিস্ট বন্ধ করুন')}
                aria-label={t('Close Wishlist', 'উইশলিস্ট বন্ধ করুন')}
              >
                <X size={14} />
              </button>
            </div>

            {/* Sidebar Content List Container */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {(wishlistItems?.length || 0) === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                    <Heart size={32} className="text-rose-300" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 uppercase tracking-tight mb-2">{t('No Favorites Yet', 'এখনো কোনো পছন্দের পণ্য নেই')}</h3>
                  <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6 max-w-xs">
                    {t("You haven't saved any items yet. Start adding items to your favorites to get live price & stock updates!", 'আপনি এখনো কোনো পণ্য সংরক্ষণ করেননি। পছন্দের পণ্য যোগ করে লাইভ দাম ও স্টক আপডেট পান!')}
                  </p>
                  <button 
                    type="button"
                    onClick={handleStartBrowsing}
                    className="px-6 py-3 bg-brand-orange hover:bg-brand-orange-light text-white text-[9px] font-black uppercase tracking-[0.15em] rounded-xl shadow-lg shadow-brand-orange/15 active:scale-95 transition-all cursor-pointer select-none"
                  >
                    {t('Start Browsing', 'ব্রাউজ শুরু করুন')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {wishlistItems.map((item) => (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all group flex gap-4 p-3 relative h-36"
                      >
                        {/* Image sector */}
                        <div className="relative w-24 h-full bg-gray-50 overflow-hidden shrink-0 rounded-xl border border-gray-50">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                          />
                          {item.originalPrice && (
                            <div className="absolute top-2 left-2 bg-brand-orange text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider font-mono z-10">
                              -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                            </div>
                          )}
                        </div>

                        {/* Content area context */}
                        <div className="flex-1 flex flex-col justify-between py-0.5 text-left min-w-0 pr-1">
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider font-mono block truncate">
                                {translateCategory(item.category)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemove(item.id)}
                                className="text-gray-300 hover:text-rose-500 transition-colors p-0.5 cursor-pointer active:scale-90"
                                title={t('Remove from wishlist', 'উইশলিস্ট থেকে সরান')}
                                aria-label={t('Remove from wishlist', 'উইশলিস্ট থেকে সরান')}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <h4 className="text-[11px] font-black text-gray-800 line-clamp-2 leading-relaxed uppercase tracking-tight group-hover:text-brand-orange transition-colors">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-1.5 font-mono pt-0.5">
                              <span className="text-xs font-black text-gray-900">৳{item.price.toLocaleString()}</span>
                              {item.originalPrice && (
                                <span className="text-[10px] text-gray-300 line-through font-bold">
                                  ৳{item.originalPrice.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onMoveToCart(item)}
                            className="w-full py-2 bg-gray-900 hover:bg-brand-orange text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <ShoppingBag size={11} /> {t('Move to Cart', 'কার্টে নিন')}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer containing action drawer trigger close */}
            {(wishlistItems?.length || 0) > 0 && (
              <div className="bg-white border-t border-gray-100 p-6 space-y-4">
                <button 
                  type="button"
                  onClick={handleStartBrowsing}
                  className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg text-center cursor-pointer active:scale-95"
                >
                  {t('Continue Shopping', 'কেনাকাটা চালিয়ে যান')}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
