import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Check, ChevronRight } from 'lucide-react';
import { CartItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number, size?: string, color?: string) => void;
  onSetQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  onRemove: (id: string, size?: string, color?: string) => void;
  onToggleSelection: (id: string, size?: string, color?: string) => void;
  onSelectAll: (selected: boolean) => void;
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQuantity, 
  onSetQuantity,
  onRemove,
  onToggleSelection,
  onSelectAll,
  onCheckout
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const selectedItems = (items || []).filter(i => i.selected);
  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isAllSelected = (items?.length || 0) > 0 && items.every(i => i.selected);

  // Close with Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackToShop = () => {
    onClose();
    navigate('/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] bg-[#F5F5F9] w-full h-full flex flex-col font-sans overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            className="w-full h-full bg-[#F5F5F9] overflow-hidden flex flex-col"
          >
            {/* Elegant Top Navigation Bar */}
            <div className="bg-white border-b border-gray-100 px-3 sm:px-5 md:px-8 py-3 sm:py-4 flex items-center justify-between gap-2 sticky top-0 z-50 shadow-sm">
              <button 
                type="button"
                onClick={handleBackToShop} 
                className="flex items-center gap-1.5 sm:gap-2 group text-gray-600 hover:text-brand-orange font-bold text-[11px] sm:text-xs uppercase tracking-wider sm:tracking-widest transition-colors cursor-pointer select-none active:scale-95 shrink-0"
                id="back-to-shop-btn"
              >
                <ChevronRight size={18} className="rotate-180 transition-transform group-hover:-translate-x-1 text-brand-orange" />
                <span className="hidden xs:inline">{t('Back to Shop', 'শপ-এ ফিরে যান')}</span>
                <span className="xs:hidden">{t('Shop', 'শপ')}</span>
              </button>
              
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="hidden sm:flex w-10 h-10 bg-brand-orange/5 text-brand-orange rounded-xl items-center justify-center shrink-0">
                  <ShoppingBag size={20} />
                </div>
                <div className="min-w-0 text-center sm:text-left">
                  <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight truncate">{t('Your Shopping Cart', 'আপনার শপিং কার্ট')}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest font-mono tabular-nums">{(items?.length || 0)} {t('Saved Items', 'টি সংরক্ষিত পণ্য')}</p>
                </div>
              </div>

              <button 
                type="button"
                onClick={onClose} 
                className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-900 hover:bg-rose-500 hover:rotate-90 text-white rounded-full transition-all flex items-center justify-center shadow-lg cursor-pointer active:scale-90 shrink-0"
                title={t('Close Cart', 'কার্ট বন্ধ করুন')}
                aria-label={t('Close Shopping Cart', 'শপিং কার্ট বন্ধ করুন')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {(items?.length || 0) === 0 ? (
                <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                    <ShoppingBag size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">{t('Your Cart is Empty', 'আপনার কার্ট খালি')}</h3>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed mb-8 max-w-md">
                    {t("Looks like you haven't added anything to your cart yet. Discover your spectacular styles!", 'আপনি এখনো কোনো পণ্য কার্টে যোগ করেননি। আপনার পছন্দের পণ্যগুলো ঘুরে দেখুন!')}
                  </p>
                  <button 
                    type="button"
                    onClick={handleBackToShop}
                    className="px-10 py-4 bg-brand-orange hover:bg-brand-orange-light text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-brand-orange/20 active:scale-95 transition-all cursor-pointer select-none"
                  >
                    {t('Start Shopping', 'কেনাকাটা শুরু করুন')}
                  </button>
                </div>
              ) : (
                <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-5 sm:py-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                    {/* Left Column: Cart items */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-gray-100 shadow-sm">
                        {/* Select All */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4 mb-5 sm:mb-6">
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <button 
                              type="button"
                              onClick={() => onSelectAll(!isAllSelected)}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer active:scale-95 ${isAllSelected ? 'bg-brand-orange border-brand-orange text-white' : 'bg-white border-gray-200 hover:border-brand-orange/50'}`}
                            >
                              {isAllSelected && <Check size={14} strokeWidth={4} />}
                            </button>
                            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-gray-700 font-mono">
                              {t('Select All Items', 'সব পণ্য সিলেক্ট করুন')} ({(items?.length || 0)})
                            </span>
                          </div>
                          
                          {selectedItems.length > 0 && (
                            <span className="text-[10px] bg-brand-orange/10 font-black text-[#ff5c00] px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider font-mono tabular-nums">
                              {selectedItems.length} {t('Selected', 'টি নির্বাচিত')}
                            </span>
                          )}
                        </div>

                        {/* List items */}
                        <div className="space-y-3 sm:space-y-4 font-sans">
                          {(items || []).map((item) => (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={`${item.id}-${item.selectedSize}-${item.selectedColor || ''}`} 
                              className={`bg-white rounded-2xl p-3 sm:p-4 flex gap-2.5 sm:gap-4 border transition-all ${item.selected ? 'border-brand-orange/30 ring-1 ring-brand-orange/5 bg-brand-orange/[0.01]' : 'border-gray-100 hover:border-brand-orange/20'}`}
                            >
                              {/* Checkbox */}
                              <div className="flex items-center self-center shrink-0">
                                <button 
                                  type="button"
                                  onClick={() => onToggleSelection(item.id, item.selectedSize, item.selectedColor)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all cursor-pointer active:scale-95 ${item.selected ? 'bg-brand-orange border-brand-orange text-white' : 'bg-white border-gray-200 hover:border-brand-orange/50'}`}
                                >
                                  {item.selected && <Check size={14} strokeWidth={4} />}
                                </button>
                              </div>

                              {/* Image */}
                              <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 relative">
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                {item.originalPrice && (
                                  <div className="absolute top-0 left-0 bg-brand-orange text-white text-[8px] font-black px-1.5 py-0.5 rounded-br uppercase tracking-tighter font-mono">
                                    -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                                  </div>
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div className="space-y-1">
                                  <div className="flex justify-between items-start gap-2 sm:gap-4">
                                    <h3 className="text-xs font-bold text-gray-900 line-clamp-2 leading-relaxed uppercase tracking-tight">{item.name}</h3>
                                    <button 
                                      type="button"
                                      onClick={() => onRemove(item.id, item.selectedSize, item.selectedColor)}
                                      className="text-gray-300 hover:text-rose-500 transition-colors p-1 cursor-pointer active:scale-90 shrink-0"
                                      id={`remove-item-${item.id}-${item.selectedSize}-${item.selectedColor || ''}`}
                                      title={t('Remove item', 'পণ্য সরান')}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-gray-100 font-mono">
                                        {t('Size:', 'সাইজ:')} {item.selectedSize || 'M'}
                                     </span>
                                     {item.selectedColor && (
                                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-gray-100 font-mono">
                                         {t('Color:', 'রঙ:')} {item.selectedColor}
                                       </span>
                                     )}
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap justify-between items-center gap-2 mt-2.5 sm:mt-3">
                                  {/* Quantity Controls */}
                                  <div className="flex items-center gap-1 sm:gap-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <button 
                                      type="button"
                                      onClick={() => onUpdateQuantity(item.id, -1, item.selectedSize, item.selectedColor)}
                                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-400 hover:text-brand-orange hover:bg-white rounded-l-lg transition-all disabled:opacity-20 cursor-pointer active:scale-90"
                                      disabled={item.quantity <= 1}
                                      id={`decrease-qty-${item.id}-${item.selectedSize}-${item.selectedColor || ''}`}
                                      title="Decrease quantity"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <input 
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) onSetQuantity(item.id, Math.max(1, val), item.selectedSize, item.selectedColor);
                                        else if (e.target.value === '') onSetQuantity(item.id, 0, item.selectedSize, item.selectedColor);
                                      }}
                                      onBlur={() => {
                                        if (item.quantity < 1) onSetQuantity(item.id, 1, item.selectedSize, item.selectedColor);
                                      }}
                                      className="w-9 sm:w-12 bg-transparent text-center text-xs font-black text-gray-900 outline-none font-mono tabular-nums"
                                    />
                                    <button 
                                      type="button"
                                      onClick={() => onUpdateQuantity(item.id, 1, item.selectedSize, item.selectedColor)}
                                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-400 hover:text-brand-orange hover:bg-white rounded-r-lg transition-all cursor-pointer active:scale-90"
                                      id={`increase-qty-${item.id}-${item.selectedSize}-${item.selectedColor || ''}`}
                                      title="Increase quantity"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>

                                  {/* Price */}
                                  <div className="text-right ml-auto">
                                    <p className="text-sm font-black text-brand-orange font-mono tabular-nums">
                                      ৳{Math.round(item.price * item.quantity).toLocaleString()}
                                    </p>
                                    {item.originalPrice && (
                                      <p className="text-[10px] text-gray-300 line-through font-bold font-mono tabular-nums">
                                        ৳{Math.round(item.originalPrice * item.quantity).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Checkout details summary */}
                    <div className="lg:col-span-1 lg:sticky lg:top-[90px]">
                      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 pb-4 border-b border-gray-100 font-mono">{t('Order Summary', 'মূল্য তালিকা')}</h3>
                        
                        <div className="space-y-4 font-mono">
                          <div className="flex justify-between items-center text-gray-500">
                            <span className="text-xs">{t('Subtotal', 'সাবটোটাল')} ({(selectedItems?.length || 0)} {t('items', 'টি পণ্য')})</span>
                            <span className="text-xs font-bold text-gray-900">৳{Math.round(total).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-500 pb-4 border-b border-gray-100">
                            <span className="text-xs">{t('Shipping Fee', 'ডেলিভারি ফি')}</span>
                            <span className="text-[9px] font-black uppercase text-green-500 bg-green-50 px-2 py-0.5 rounded">{t('Free Shipping', 'ফ্রি শিপিং')}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-xs font-black uppercase tracking-wider text-gray-900 font-sans">{t('Estimated Total', 'আনুমানিক মোট')}</span>
                            <span className="text-2xl font-black text-brand-orange">৳{Math.round(total).toLocaleString()}</span>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={onCheckout}
                          disabled={selectedItems.length === 0}
                          className="w-full bg-brand-orange hover:bg-[#ff5c00] text-white h-14 rounded-2xl text-[10px] uppercase tracking-[0.2em] font-black hover:translate-y-[-1px] active:translate-y-0 active:scale-98 transition-all shadow-lg shadow-brand-orange/10 flex items-center justify-center group disabled:opacity-50 disabled:grayscale disabled:hover:translate-y-0 cursor-pointer disabled:cursor-not-allowed"
                          id="checkout-btn"
                        >
                          <span className="group-hover:scale-105 transition-transform flex items-center gap-2">
                            {t('Proceed to Checkout', 'চেকআউটে যান')} <ArrowRight size={14} />
                          </span>
                        </button>
                        
                        <p className="text-center text-[8px] uppercase tracking-widest font-bold text-gray-300 font-mono leading-normal">
                          {t('Secure checkout powered by Digital Shop Network', 'নিরাপদ চেকআউট সিস্টেম দ্বারা সুরক্ষিত')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
