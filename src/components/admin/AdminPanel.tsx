import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, Package, Users, ShoppingBag, 
  Settings, LogOut, ChevronRight, Menu, X,
  Tag, Image as ImageIcon, MessageSquare, CreditCard,
  Bell, Search, User, Shield, Info
} from 'lucide-react';
import { DashboardHome } from './DashboardHome';
import { ProductManagement } from './ProductManagement';
import { OrderManagement } from './OrderManagement';
import { CustomerManagement } from './CustomerManagement';
import { ReviewManagement } from './ReviewManagement';
import { ChatManagement } from './ChatManagement';
import { PaymentManagement } from './PaymentManagement';
import { CouponManagement } from './CouponManagement';
import { BannerManagement } from './BannerManagement';
import { SettingsManagement } from './SettingsManagement';
import { Product, Order, Review, Notification } from '../../types';
import { authClient } from '../../lib/auth-client';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../LanguageSwitcher';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  reviews: Review[];
  notifications: Notification[];
  onClose: () => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: (product: Product) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onMarkNotificationRead: (id: string) => void;
}

type AdminView = 'dashboard' | 'products' | 'orders' | 'customers' | 'reviews' | 'chat' | 'payments' | 'coupons' | 'banners' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, 
  orders, 
  reviews,
  notifications,
  onClose,
  onUpdateProduct,
  onDeleteProduct,
  onAddProduct,
  onUpdateOrderStatus,
  onMarkNotificationRead
}) => {
  const { language, t } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [adminDisplayName, setAdminDisplayName] = useState<string>('');

  React.useEffect(() => {
    authClient.getSession().then((s) => {
      if (s?.user?.name) setAdminDisplayName(s.user.name);
    }).catch(() => {});
  }, []);

  const menuItems = [
    { id: 'dashboard', label: t('Dashboard', 'ড্যাশবোর্ড'), icon: BarChart3 },
    { id: 'products', label: t('Products', 'পণ্য'), icon: Package },
    { id: 'orders', label: t('Orders', 'অর্ডার'), icon: ShoppingBag },
    { id: 'customers', label: t('Customers', 'গ্রাহক'), icon: Users },
    { id: 'reviews', label: t('Reviews', 'রিভিউ'), icon: MessageSquare },
    { id: 'chat', label: t('Support Chat', 'সাপোর্ট চ্যাট'), icon: MessageSquare },
    { id: 'payments', label: t('Payments', 'পেমেন্ট'), icon: CreditCard },
    { id: 'coupons', label: t('Coupons', 'কুপন'), icon: Tag },
    { id: 'banners', label: t('CMS / Banners', 'সিএমএস / ব্যানার'), icon: ImageIcon },
    { id: 'settings', label: t('Site Settings', 'সাইট সেটিংস'), icon: Settings },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardHome products={products} orders={orders} reviews={reviews} onNavigate={setActiveView} />;
      case 'products': return <ProductManagement products={products} onUpdate={onUpdateProduct} onDelete={onDeleteProduct} onAdd={onAddProduct} />;
      case 'orders': return <OrderManagement orders={orders} onUpdateStatus={onUpdateOrderStatus} />;
      case 'customers': return <CustomerManagement orders={orders} />;
      case 'reviews': return <ReviewManagement products={products} />;
      case 'chat': return <ChatManagement />;
      case 'payments': return <PaymentManagement />;
      case 'coupons': return <CouponManagement />;
      case 'banners': return <BannerManagement />;
      case 'settings': return <SettingsManagement />;
      default: return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Info size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">{t('This module is under development.', 'এই মডিউলটি উন্নয়নাধীন রয়েছে।')}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-gray-50 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-brand-navy text-white flex flex-col h-full daraz-shadow relative z-50"
      >
        <div className="p-6 flex items-center justify-between">
          <div className={`flex items-center gap-3 overflow-hidden ${!isSidebarOpen && 'hidden'}`}>
            <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-black tracking-tighter text-lg">DIGITAL SHOP T.M</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto admin-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as AdminView)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group relative ${
                activeView === item.id 
                ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} strokeWidth={activeView === item.id ? 2.5 : 2} />
              {isSidebarOpen && (
                <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-brand-navy text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[100]">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={onClose}
            className="w-full flex items-center gap-4 p-4 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-xs uppercase tracking-widest cursor-pointer"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>{t('Exit Panel', 'প্যানেল থেকে প্রস্থান')}</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-8">
             <div className="hidden md:flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 w-80">
                <Search size={16} className="text-gray-400" />
                <input type="text" placeholder={t('Search anything...', 'যেকোনো কিছু খুঁজুন...')} className="bg-transparent border-none outline-none text-xs w-full text-gray-600 font-medium" />
             </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
             <LanguageSwitcher variant="compact" />
             <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2 text-gray-400 hover:text-brand-orange transition-colors"
                >
                   <Bell size={20} />
                   {notifications.filter(n => !n.read).length > 0 && (
                     <span className="absolute top-1 right-1 w-2 h-2 bg-brand-orange rounded-full border-2 border-white" />
                   )}
                </button>

                <AnimatePresence>
                   {isNotificationsOpen && (
                      <>
                         <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                         <motion.div 
                           initial={{ opacity: 0, y: 10, scale: 0.95 }}
                           animate={{ opacity: 1, y: 0, scale: 1 }}
                           exit={{ opacity: 0, y: 10, scale: 0.95 }}
                           className="absolute right-0 mt-4 w-80 bg-white rounded-2xl border border-gray-100 daraz-shadow z-50 overflow-hidden"
                         >
                            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                               <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-navy">{t('Notifications', 'বিজ্ঞপ্তি')}</h4>
                               <span className="text-[9px] font-bold text-gray-400 uppercase">{notifications.filter(n => !n.read).length} {t('Unread', 'অপঠিত')}</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                               {notifications.length > 0 ? (
                                 notifications.map(n => (
                                   <div 
                                     key={n.id} 
                                     onClick={() => onMarkNotificationRead(n.id)}
                                     className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-orange-50/30' : ''}`}
                                   >
                                      <div className="flex gap-3">
                                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                           n.type === 'order' ? 'bg-emerald-50 text-emerald-500' :
                                           n.type === 'inventory' ? 'bg-rose-50 text-rose-500' :
                                           'bg-blue-50 text-blue-500'
                                         }`}>
                                            <Info size={14} />
                                         </div>
                                         <div>
                                            <p className="text-[11px] font-black text-brand-navy">{n.title}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                                            <p className="text-[9px] text-gray-300 font-bold uppercase mt-1">
                                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) : t('Just now', 'এইমাত্র')}
                                            </p>
                                         </div>
                                      </div>
                                   </div>
                                 ))
                               ) : (
                                 <div className="p-8 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                                    {t('No notifications', 'কোনো বিজ্ঞপ্তি নেই')}
                                 </div>
                               )}
                            </div>
                         </motion.div>
                      </>
                   )}
                </AnimatePresence>
             </div>
             <div className="h-8 w-[1px] bg-gray-100 mx-2" />
             <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                   <p className="text-xs font-bold text-brand-navy">{adminDisplayName || t('Administrator', 'অ্যাডমিনিস্ট্রেটর')}</p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('Super Admin', 'সুপার অ্যাডমিন')}</p>
                </div>
                <div className="w-10 h-10 bg-brand-orange/10 rounded-xl flex items-center justify-center text-brand-orange">
                   <User size={20} />
                </div>
             </div>
             <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <X size={24} />
             </button>
          </div>
        </header>

        {/* Dynamic View Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-8">
           <AnimatePresence mode="wait">
             <motion.div
               key={activeView}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
               className="h-full"
             >
               {renderView()}
             </motion.div>
           </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
