import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Package, ChevronRight, Clock, MapPin, Truck, Check, Download, ExternalLink } from 'lucide-react';
import { Order } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose, orders }) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [viewingOrder, setViewingOrder] = React.useState<Order | null>(null);
  const [showTrackingDetail, setShowTrackingDetail] = React.useState<boolean>(false);

  if (!isOpen) return null;

  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';

  const parseSafeDate = (d: any) => {
    if (!d) return new Date();
    if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000);
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatSafeDate = (d: any) => {
    if (!d) return t('Recent', 'সম্প্রতি');
    if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? t('Recent', 'সম্প্রতি') : parsed.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const orderDate = viewingOrder ? parseSafeDate(viewingOrder.createdAt) : new Date();
  const formattedDate = orderDate.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });

  const addDays = (d: Date, days: number) => {
    const res = new Date(d);
    res.setDate(res.getDate() + days);
    return res.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' });
  };

  const translateStatus = (s?: string) => {
    switch ((s || '').toLowerCase()) {
      case 'pending': return t('Pending', 'পেন্ডিং');
      case 'confirmed': return t('Confirmed', 'নিশ্চিত');
      case 'processing': return t('Processing', 'প্রক্রিয়াধীন');
      case 'shipped': return t('Shipped', 'পাঠানো হয়েছে');
      case 'delivered': return t('Delivered', 'ডেলিভারি সম্পন্ন');
      case 'cancelled': return t('Cancelled', 'বাতিল');
      default: return s || t('Processing', 'প্রক্রিয়াধীন');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-0 md:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-brand-navy/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl h-full md:h-[85vh] bg-[#F4F4F6] md:rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
        >
          <div className="p-4 sm:p-6 md:p-8 bg-white border-b border-gray-100 flex items-center justify-between gap-3 shadow-sm relative z-10">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              {viewingOrder ? (
                <button 
                  onClick={() => setViewingOrder(null)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-brand-orange transition-all shrink-0 cursor-pointer"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-orange shrink-0">
                  <ShoppingBag size={20} className="sm:w-6 sm:h-6" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-lg sm:text-2xl font-black text-gray-900 uppercase tracking-tight truncate">
                  {viewingOrder ? `${t('Order', 'অর্ডার')} #${viewingOrder.id}` : t('My Orders', 'আমার অর্ডারসমূহ')}
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mt-0.5 sm:mt-1 truncate">
                  {viewingOrder ? t('Detailed Order View', 'অর্ডারের বিস্তারিত তথ্য') : `${orders?.length || 0} ${t('Total Purchased', 'টি মোট অর্ডার')}`}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-50 text-gray-400 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all group shrink-0 cursor-pointer"
            >
              <X size={20} className="sm:w-6 sm:h-6 transition-transform group-hover:rotate-90" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 md:p-8 custom-scrollbar">
            {viewingOrder ? (
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-3xl daraz-shadow border border-gray-50 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                       <MapPin size={14} className="text-brand-orange" /> {t('Delivery Information', 'ডেলিভারি তথ্য')}
                    </h3>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-gray-900 uppercase">{viewingOrder.address.fullName}</p>
                      <p className="text-xs text-gray-500">{viewingOrder.address.phone}</p>
                      <p className="text-[11px] text-gray-400 leading-relaxed mt-2">{viewingOrder.address.fullAddress}</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl daraz-shadow border border-gray-50 space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                       <Clock size={14} className="text-brand-orange" /> {t('Order Summary', 'অর্ডার সারাংশ')}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-400 uppercase">{t('Status', 'অবস্থা')}</span>
                        <span className="text-brand-orange uppercase">{translateStatus(viewingOrder.status)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-400 uppercase">{t('Payment', 'পেমেন্ট')}</span>
                        <span className="text-gray-900 uppercase">{viewingOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-400 uppercase">{t('Date', 'তারিখ')}</span>
                        <span className="text-gray-900">{formatSafeDate(viewingOrder.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl overflow-hidden daraz-shadow border border-gray-50">
                  <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('Purchased Items', 'ক্রয়কৃত পণ্য')} ({(viewingOrder.items?.length || 0)})</h4>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {(viewingOrder.items || []).map((item, idx) => (
                      <div key={item.id ? `${item.id}-${idx}` : `order-item-${idx}`} className="p-4 sm:p-6 flex gap-3 sm:gap-4 items-center group">
                        <div className="w-14 h-16 sm:w-16 sm:h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0">
                          <img src={item.image} alt={item.name || 'Purchased item thumbnail'} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t('Qty:', 'পরিমাণ:')} {item.quantity} · {item.selectedSize || 'M'}</p>
                        </div>
                        <p className="text-xs sm:text-sm font-black text-brand-orange tabular-nums shrink-0">৳{Math.round(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 sm:p-6 md:p-8 bg-orange-50/30 border-t border-gray-50 space-y-5 sm:space-y-6">
                    {/* Live Tracking Progress Bar */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
                          <Truck size={14} className="text-brand-orange" />
                          <span>{t('Delivery Timeline', 'ডেলিভারি টাইমলাইন')}</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
                          {translateStatus(viewingOrder.status)}
                        </span>
                      </div>

                      <div className="relative pt-2 pb-1">
                        <div className="absolute top-4 left-3 right-3 h-1 bg-gray-200 rounded-full z-0 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full w-[35%]" />
                        </div>
                        <div className="relative z-10 grid grid-cols-4 gap-1 text-center">
                          {[
                            { label: t('Placed', 'অর্ডার সম্পন্ন'), date: formattedDate, done: true },
                            { label: t('Processing', 'প্রক্রিয়াধীন'), date: t('In Hub', 'হাবে আছে'), done: true },
                            { label: t('Shipping', 'পাঠানো হচ্ছে'), date: `${t('Est.', 'সম্ভাব্য')} ${addDays(orderDate, 1)}`, done: false },
                            { label: t('Delivery', 'ডেলিভারি'), date: `${t('Est.', 'সম্ভাব্য')} ${addDays(orderDate, 3)}`, done: false }
                          ].map((step, idx) => (
                            <div key={idx} className="flex flex-col items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mb-1 shadow-xs ${
                                step.done ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400 border border-gray-200'
                              }`}>
                                {step.done ? <Check size={12} strokeWidth={3} /> : idx + 1}
                              </div>
                              <span className={`text-[9px] sm:text-[10px] font-bold leading-tight ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
                              <span className="text-[8px] sm:text-[9px] text-gray-400 font-medium">{step.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('Final Payable Total', 'মোট পরিশোধযোগ্য')}</p>
                        <p className="text-xl sm:text-2xl font-black text-brand-orange tabular-nums">৳{Math.round(viewingOrder.paymentAmount || viewingOrder.total).toLocaleString()}</p>
                      </div>
                      <div className="text-left sm:text-right">
                         <div className="flex items-center gap-2 sm:justify-end mb-1">
                            <Truck size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black uppercase text-emerald-600">{t('Tracking Verified', 'ট্র্যাকিং যাচাইকৃত')}</span>
                         </div>
                         <p className="text-xs font-bold text-gray-900 uppercase">{t('Estimated 3–5 Days', 'সম্ভাব্য ৩-৫ দিন')}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                       <button 
                         onClick={() => {
                           onClose();
                           navigate(`/invoice/${viewingOrder.id}`);
                         }}
                         className="flex-1 bg-brand-navy hover:bg-black text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                       >
                          <Download size={15} /> {t('Download Invoice', 'ইনভয়েস ডাউনলোড')}
                       </button>
                       <button 
                         onClick={() => {
                           setViewingOrder(null);
                           onClose();
                         }}
                         className="flex-1 bg-brand-orange hover:bg-orange-600 text-white py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                       >
                          {t('Continue Shopping', 'শপিং চালিয়ে যান')} <ChevronRight size={15} />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {(orders?.length || 0) === 0 ? (
                  <div className="col-span-full py-24 sm:py-32 text-center">
                    <Package size={56} className="text-gray-200 mx-auto mb-5" />
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-tight">{t('No Orders Yet', 'এখনো কোনো অর্ডার নেই')}</h3>
                    <p className="text-sm text-gray-400 font-medium">{t("You haven't made any purchases yet.", 'আপনি এখনো কোনো পণ্য অর্ডার করেননি।')}</p>
                  </div>
                ) : (
                  (orders || []).map((order) => (
                    <motion.div 
                      key={order.id}
                      whileHover={{ y: -4 }}
                      onClick={() => setViewingOrder(order)}
                      className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl daraz-shadow border border-gray-50 flex items-center justify-between gap-3 cursor-pointer group transition-all hover:border-brand-orange/20"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gray-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-brand-orange/10 group-hover:text-brand-orange transition-all shrink-0">
                          <Package size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-gray-900 uppercase tracking-tight group-hover:text-brand-orange transition-colors truncate">#{order.id}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
                            {formatSafeDate(order.createdAt)} · {(order.items?.length || 0)} {t('items', 'টি পণ্য')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-brand-orange tabular-nums">৳{Math.round(order.paymentAmount || order.total).toLocaleString()}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-green-500 mt-1">{translateStatus(order.status)}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
