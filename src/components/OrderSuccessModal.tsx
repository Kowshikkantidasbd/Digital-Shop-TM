import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, Package, ArrowRight, Home, ShoppingBag, CreditCard, 
  Truck, ShieldCheck, Download, ExternalLink, MapPin, Phone, 
  Clock, Sparkles, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import { Order } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface OrderSuccessModalProps {
  order: Order | null;
  onClose: () => void;
  onViewOrderDetails: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({ 
  order, 
  onClose, 
  onViewOrderDetails 
}) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  useEffect(() => {
    if (order) {
      // Play celebratory sound if permitted
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        audio.volume = 0.25;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }, [order]);

  if (!order) return null;

  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const parseSafeDate = (d: any) => {
    if (!d) return new Date();
    if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000);
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };
  const orderDate = parseSafeDate(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });

  // Calculate estimated milestone dates
  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });
  };

  const steps = [
    { label: t('Placed', 'অর্ডার সম্পন্ন'), date: formattedDate, completed: true, active: false },
    { label: t('Processing', 'প্রক্রিয়াধীন'), date: t('Est. Today', 'সম্ভাব্য আজ'), completed: false, active: true },
    { label: t('Shipping', 'পাঠানো হচ্ছে'), date: `${t('Est.', 'সম্ভাব্য')} ${addDays(orderDate, 1)}–${addDays(orderDate, 2)}`, completed: false, active: false },
    { label: t('Delivered', 'ডেলিভারি'), date: `${t('Est.', 'সম্ভাব্য')} ${addDays(orderDate, 3)}–${addDays(orderDate, 5)}`, completed: false, active: false },
  ];

  const paymentMethodLabel = (() => {
    switch (order.paymentMethod?.toLowerCase()) {
      case 'cod': return t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি');
      case 'bkash': return t('bKash Mobile Wallet', 'বিকাশ মোবাইল ওয়ালেট');
      case 'nagad': return t('Nagad Digital Wallet', 'নগদ ডিজিটাল ওয়ালেট');
      case 'rocket': return t('Rocket Mobile Banking', 'রকেট মোবাইল ব্যাংকিং');
      case 'card': return t('Credit / Debit Card', 'ক্রেডিট / ডেবিট কার্ড');
      default: return order.paymentMethod || t('Online Payment', 'অনলাইন পেমেন্ট');
    }
  })();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-gray-900/75 backdrop-blur-md"
          onClick={onClose}
        />
        
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 30 }}
          transition={{ type: 'spring', damping: 24, stiffness: 220 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl md:rounded-[36px] overflow-hidden shadow-2xl flex flex-col my-auto z-10 border border-gray-100 max-h-[92vh]"
        >
          {/* Subtle Confetti Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden h-64 z-0">
            {[...Array(28)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -20, 
                  x: Math.random() * 650, 
                  rotate: 0,
                  opacity: 1
                }}
                animate={{ 
                  y: [0, 400], 
                  x: (Math.random() * 650) + (Math.random() * 160 - 80),
                  rotate: [0, 360, 720],
                  opacity: [1, 1, 0]
                }}
                transition={{ 
                  duration: 2.8 + Math.random() * 2.5, 
                  repeat: Infinity, 
                  ease: "circOut",
                  delay: Math.random() * 1.5 
                }}
                className={`absolute w-2 h-3.5 rounded-xs ${
                  ['bg-brand-orange', 'bg-emerald-400', 'bg-amber-400', 'bg-blue-400', 'bg-rose-400'][Math.floor(Math.random() * 5)]
                }`}
              />
            ))}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-gray-100/80 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>

          <div className="p-6 sm:p-8 md:p-10 text-center flex-1 relative z-10 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* Success Icon */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mt-2">
              <div className="absolute inset-0 bg-emerald-100/60 rounded-3xl animate-ping opacity-30" />
              <div className="relative w-full h-full bg-emerald-50 text-emerald-600 rounded-3xl border-2 border-emerald-200/60 flex items-center justify-center shadow-lg shadow-emerald-100">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 14, delay: 0.15 }}
                  className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20"
                >
                  <Check size={28} strokeWidth={3.5} />
                </motion.div>
              </div>
            </div>

            {/* Heading & Reassurance */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} className="text-emerald-500" />
                <span>{t('Order Confirmed', 'অর্ডার নিশ্চিত হয়েছে')}</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight">
                {t('Thank You For Your Order!', 'আপনার অর্ডারের জন্য ধন্যবাদ!')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
                {t('Your order', 'আপনার অর্ডার')} <span className="font-bold text-gray-900">#{order.id}</span> {t('has been placed successfully. A confirmation message has been recorded.', 'সফলভাবে সম্পন্ন হয়েছে এবং নিশ্চিতকরণ বার্তা সংরক্ষণ করা হয়েছে।')}
              </p>
            </div>

            {/* Connected Delivery Stepper with Milestone Dates */}
            <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-200/80 text-left">
              <div className="flex items-center justify-between mb-3 border-b border-gray-200/60 pb-2.5">
                <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck size={14} className="text-brand-orange" />
                  <span>{t('Delivery Status', 'ডেলিভারি অবস্থা')}</span>
                </span>
                <span className="text-[10px] font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-md">
                  {t('In Progress', 'চলমান')}
                </span>
              </div>

              <div className="relative pt-2 pb-1">
                {/* Connecting Track */}
                <div className="absolute top-5 left-4 right-4 h-1 bg-gray-200 rounded-full z-0 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "35%" }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>

                {/* Steps Nodes */}
                <div className="relative z-10 grid grid-cols-4 gap-1 text-center">
                  {steps.map((st, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all mb-1.5 shadow-xs ${
                        st.completed 
                          ? 'bg-emerald-500 text-white' 
                          : st.active 
                          ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-500 ring-2 ring-emerald-100' 
                          : 'bg-white text-gray-400 border border-gray-200'
                      }`}>
                        {st.completed ? <Check size={13} strokeWidth={3} /> : idx + 1}
                      </div>
                      <span className={`text-[10px] sm:text-[11px] font-bold block truncate max-w-full ${
                        st.completed || st.active ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {st.label}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium hidden sm:block truncate mt-0.5">
                        {st.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Order Details Summary Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200/90 shadow-xs text-left space-y-4">
              
              {/* Order Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pb-4 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('Order ID', 'অর্ডার আইডি')}</span>
                  <span className="text-xs sm:text-sm font-extrabold text-gray-900 font-mono mt-0.5 block truncate">
                    #{order.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('Payment Method', 'পেমেন্ট মাধ্যম')}</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-800 mt-0.5 block truncate">
                    {paymentMethodLabel}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('Items Ordered', 'অর্ডারকৃত পণ্য')}</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-800 mt-0.5 block">
                    {totalItems} {totalItems === 1 ? t('Item', 'টি পণ্য') : t('Items', 'টি পণ্য')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{t('Estimated Delivery', 'সম্ভাব্য ডেলিভারি')}</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-600 mt-0.5 block">
                    {addDays(orderDate, 3)} – {addDays(orderDate, 5)}
                  </span>
                </div>
              </div>

              {/* Delivery Address Card */}
              {order.address && (
                <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-brand-orange flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">{t('Delivery Address:', 'ডেলিভারি ঠিকানা:')}</span>
                      <span className="text-xs font-black text-gray-900 truncate">{order.address.fullName}</span>
                      {order.address.phone && (
                        <span className="text-[11px] text-gray-500 font-mono">({order.address.phone})</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 font-medium mt-0.5 leading-relaxed">
                      {order.address.fullAddress}
                    </p>
                  </div>
                </div>
              )}

              {/* Ordered Items Preview */}
              {order.items && order.items.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                    {t('Products in this Order', 'এই অর্ডারের পণ্যসমূহ')} ({order.items.length})
                  </span>
                  <div className="divide-y divide-gray-100 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0 bg-white" 
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                            <p className="text-[10px] text-gray-400 font-semibold">
                              {t('Qty:', 'পরিমাণ:')} {item.quantity} {item.selectedSize ? `· ${t('Size:', 'সাইজ:')} ${item.selectedSize}` : ''} {item.selectedColor ? `· ${t('Color:', 'রং:')} ${item.selectedColor}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-brand-orange font-mono shrink-0">
                          ৳{Math.round(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total Paid Row */}
              <div className="pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">{t('Total Paid', 'মোট পরিশোধ')}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">{t('All taxes & shipping included', 'সকল ভ্যাট ও ডেলিভারি চার্জসহ')}</p>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-brand-orange font-mono">
                  ৳{Math.round(order.paymentAmount || order.total).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Action Buttons Hierarchy */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Secondary: Download Invoice */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/invoice/${order.id}`);
                  }}
                  className="w-full h-12 sm:h-13 bg-gray-900 hover:bg-black text-white rounded-xl sm:rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Download size={15} />
                  <span>{t('Download Invoice', 'ইনভয়েস ডাউনলোড')}</span>
                </button>

                {/* Primary: Continue Shopping */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-12 sm:h-13 bg-brand-orange hover:bg-orange-600 text-white rounded-xl sm:rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  <span>{t('Continue Shopping', 'শপিং চালিয়ে যান')}</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Track Order link/button */}
              <button
                type="button"
                onClick={() => {
                  onViewOrderDetails();
                }}
                className="w-full py-2.5 text-xs font-bold text-gray-600 hover:text-brand-orange transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t('Track Your Order in Order History', 'অর্ডার হিস্টোরিতে অর্ডার ট্র্যাক করুন')}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Reassuring Footer Note */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-[11px] font-bold">
                <ShieldCheck size={14} />
                <span>{t('100% Secure Transaction', '১০০% নিরাপদ লেনদেন')}</span>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">
                {t('This confirmation will remain available in your Order History.', 'এই নিশ্চিতকরণটি আপনার অর্ডার হিস্টোরিতে সংরক্ষিত থাকবে।')}
              </span>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
