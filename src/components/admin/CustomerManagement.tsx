import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Search, Filter, Mail, Phone, 
  ShoppingBag, Ban, User, MoreVertical,
  CheckCircle, ChevronLeft, ChevronRight,
  ShieldAlert, History, MessageSquare, Trash2,
  ArrowUpRight, ArrowDownRight, X, Send, Eye, ShieldCheck,
  AlertTriangle, Loader2
} from 'lucide-react';
import { adminApi, chatApi, notificationApi } from '../../services/api';
import { Order } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../Toast';
import { useNavigate } from 'react-router-dom';

interface CustomerManagementProps {
  orders: Order[];
}

interface CustomerRecord {
  id: string;
  userId: string;
  email: string;
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  status: 'active' | 'restricted';
  orders: Order[];
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ orders = [] }) => {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [dbUsers, setDbUsers] = useState<Record<string, any>>({});
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('Pending', 'অপেক্ষমাণ');
      case 'confirmed': return t('Confirmed', 'নিশ্চিত');
      case 'processing': return t('Processing', 'প্রক্রিয়াধীন');
      case 'shipped': return t('Shipped', 'শিপড');
      case 'delivered': return t('Delivered', 'ডেলিভারি সম্পন্ন');
      case 'cancelled': return t('Cancelled', 'বাতিল');
      default: return status;
    }
  };

  // Broadcast Mail modal state
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Customer Order History modal state
  const [historyCustomer, setHistoryCustomer] = useState<CustomerRecord | null>(null);

  // Restricting state
  const [restrictingId, setRestrictingId] = useState<string | null>(null);

  const itemsPerPage = 8;

  // Fetch users from backend API to reflect real restriction flags
  useEffect(() => {
    let active = true;
    const loadUsers = async () => {
      try {
        const list = await adminApi.getUsers();
        if (!active) return;
        const map: Record<string, any> = {};
        (list || []).forEach((u: any) => {
          if (u?.id) map[u.id] = u;
        });
        setDbUsers(map);
      } catch (err) {
        console.warn('CustomerManagement users sync warning:', err);
      }
    };
    loadUsers();
    const interval = setInterval(loadUsers, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Extract unique customers from orders and enrich with DB user status
  const customers: CustomerRecord[] = useMemo(() => {
    const customerMap = new Map<string, Order[]>();
    
    orders.forEach(order => {
      const key = order.address?.email || order.address?.phone || order.userId || 'unknown';
      if (!customerMap.has(key)) {
        customerMap.set(key, []);
      }
      customerMap.get(key)!.push(order);
    });

    return Array.from(customerMap.entries()).map(([key, customerOrders]) => {
      const lastOrder = customerOrders[0];
      const name = lastOrder.address?.fullName || t('Anonymous Customer', 'অজ্ঞাত গ্রাহক');
      const email = lastOrder.address?.email || '';
      const phone = lastOrder.address?.phone || '';
      const userId = lastOrder.userId || '';

      // Check if user is restricted in database
      let isRestricted = false;
      if (userId && dbUsers[userId]?.restricted === true) {
        isRestricted = true;
      } else {
        // Also check by email
        const matchedByEmail = Object.values(dbUsers).find(u => u.email && email && u.email.toLowerCase() === email.toLowerCase());
        if (matchedByEmail?.restricted === true) {
          isRestricted = true;
        }
      }

      return {
        id: key,
        userId: userId || key,
        email,
        name,
        phone,
        orderCount: customerOrders.length,
        totalSpent: customerOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        lastOrderDate: lastOrder.createdAt,
        status: isRestricted ? 'restricted' : 'active',
        orders: customerOrders
      };
    });
  }, [orders, dbUsers]);

  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      filtered.sort((a: any, b: any) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [customers, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Action: Broadcast Mail
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject.trim() || !broadcastMessage.trim()) return;

    setIsSendingBroadcast(true);
    try {
      await notificationApi.createNotification({
        userId: 'all',
        title: broadcastSubject.trim(),
        message: broadcastMessage.trim(),
        targetAudience,
        type: 'broadcast',
        sender: 'Merchant Admin',
        timestamp: new Date().toISOString(),
        read: false
      });
      setActionSuccessMessage(t(`Broadcast "${broadcastSubject}" successfully sent and saved to notifications.`, `"${broadcastSubject}" ব্রডকাস্ট সফলভাবে পাঠানো হয়েছে এবং বিজ্ঞপ্তিতে সংরক্ষিত হয়েছে।`));
      setIsBroadcastOpen(false);
      setBroadcastSubject('');
      setBroadcastMessage('');
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to send broadcast:', err);
      showToast(t('Failed to send broadcast: ', 'ব্রডকাস্ট পাঠাতে ব্যর্থ: ') + (err?.message || t('Error', 'ত্রুটি')), 'error');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Action: Message User (Initiates chat thread via backend chat API)
  const handleMessageUser = async (customer: CustomerRecord) => {
    try {
      const chatId = `chat_${customer.userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      await chatApi.sendMessage(chatId, {
        text: t(`Hello ${customer.name}, how can we help you with your orders today?`, `হ্যালো ${customer.name}, আপনার অর্ডার সম্পর্কে আমরা কীভাবে সাহায্য করতে পারি?`),
        sender: 'admin',
        senderId: 'admin',
        sellerName: 'Merchant Support',
        customerId: customer.userId,
        customerName: customer.name,
        timestamp: new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })
      });

      setActionSuccessMessage(t(`Support chat thread created for ${customer.name}.`, `${customer.name}-এর জন্য সাপোর্ট চ্যাট শুরু করা হয়েছে।`));
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error starting chat with customer:', err);
      showToast(t('Unable to initiate chat: ', 'চ্যাট শুরু করতে ব্যর্থ: ') + (err?.message || ''), 'error');
    }
  };

  // Action: Restrict Access
  const handleToggleRestrict = async (customer: CustomerRecord) => {
    const isCurrentlyRestricted = customer.status === 'restricted';
    const targetUid = customer.userId;
    setRestrictingId(customer.id);

    try {
      let docIdToUpdate = targetUid;
      if (!dbUsers[docIdToUpdate] && customer.email) {
        const found = Object.values(dbUsers).find(u => u.email && u.email.toLowerCase() === customer.email.toLowerCase());
        if (found) docIdToUpdate = found.id;
      }

      const nextRestricted = !isCurrentlyRestricted;
      await adminApi.updateUser(docIdToUpdate, {
        restricted: nextRestricted,
        restrictedAt: new Date().toISOString(),
        email: customer.email || dbUsers[docIdToUpdate]?.email || '',
        name: customer.name || dbUsers[docIdToUpdate]?.name || ''
      });

      setDbUsers((prev) => ({
        ...prev,
        [docIdToUpdate]: {
          ...(prev[docIdToUpdate] || { id: docIdToUpdate }),
          restricted: nextRestricted
        }
      }));

      setActionSuccessMessage(
        nextRestricted
          ? t(`Access restricted for ${customer.name}. Checkout blocked.`, `${customer.name}-এর অ্যাক্সেস সীমাবদ্ধ করা হয়েছে। চেকআউট ব্লক হয়েছে।`)
          : t(`Restriction lifted for ${customer.name}. Access restored.`, `${customer.name}-এর সীমাবদ্ধতা তুলে নেওয়া হয়েছে। অ্যাক্সেস পুনরুদ্ধার হয়েছে।`)
      );
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Error updating customer restriction:', err);
      showToast(t('Failed to update restriction: ', 'সীমাবদ্ধতা আপডেট করতে ব্যর্থ: ') + (err?.message || ''), 'error');
    } finally {
      setRestrictingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {actionSuccessMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold"
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)}><X size={14} /></button>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-brand-navy tracking-tight uppercase">{t('User Directory', 'ব্যবহারকারী তালিকা')}</h1>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t(`CRM & Customer Relations (${customers.length} Accounts)`, `সিআরএম ও গ্রাহক সম্পর্ক (${customers.length} টি অ্যাকাউন্ট)`)}</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => setIsBroadcastOpen(true)}
             className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-navy/90 transition-all shadow-lg shadow-brand-navy/10 cursor-pointer"
           >
             <Mail size={16} /> {t('Broadcast Mail', 'ব্রডকাস্ট বার্তা')}
           </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 daraz-shadow flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-xl border border-gray-100 w-full md:w-auto">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder={t('Search by ID, Profile, Email or Phone...', 'আইডি, নাম, ইমেইল বা ফোন দিয়ে খুঁজুন...')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-gray-600 font-bold uppercase tracking-wider" 
            />
         </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50/50">
                  <tr>
                     <th 
                       onClick={() => handleSort('name')}
                       className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                     >
                        <div className="flex items-center gap-1">
                           {t('Customer Profile', 'গ্রাহকের প্রোফাইল')}
                           {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                        </div>
                     </th>
                     <th 
                       onClick={() => handleSort('orderCount')}
                       className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                     >
                        <div className="flex items-center gap-1">
                           {t('Activity Level', 'অর্ডার সংখ্যা')}
                           {sortConfig?.key === 'orderCount' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                        </div>
                     </th>
                     <th 
                        onClick={() => handleSort('totalSpent')}
                        className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                     >
                        <div className="flex items-center gap-1">
                           {t('LTV (Net Flow)', 'মোট ব্যয়')}
                           {sortConfig?.key === 'totalSpent' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                        </div>
                     </th>
                     <th 
                       onClick={() => handleSort('lastOrderDate')}
                       className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                     >
                        <div className="flex items-center gap-1">
                           {t('Last Encounter', 'সর্বশেষ অর্ডার')}
                           {sortConfig?.key === 'lastOrderDate' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                        </div>
                     </th>
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Auth Status', 'অ্যাকাউন্ট অবস্থা')}</th>
                     <th className="px-8 py-5 text-right text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Actions', 'কার্যক্রম')}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {paginatedCustomers.map((customer) => (
                     <tr key={customer.id} className="hover:bg-gray-50/30 transition-colors group">
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-brand-orange/10 text-brand-orange rounded-xl flex items-center justify-center font-black text-xs">
                                 {customer.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-xs font-black text-brand-navy">{customer.name}</span>
                                 <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tight">{customer.email || customer.phone || t('No direct contact', 'সরাসরি যোগাযোগ নেই')}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-xs font-black text-brand-navy">
                           <div className="flex items-center gap-2">
                             <ShoppingBag size={14} className="text-gray-300" />
                             {customer.orderCount} {t('Orders', 'অর্ডার')}
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-xs font-black text-emerald-500">৳{customer.totalSpent.toLocaleString()}</span>
                        </td>
                        <td className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                           {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString(dateLocale) : t('N/A', 'প্রযোজ্য নয়')}
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             customer.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                           }`}>
                             {customer.status === 'active' ? t('Active', 'সক্রিয়') : t('Restricted', 'সীমাবদ্ধ')}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleMessageUser(customer)}
                                className="p-2 text-gray-400 hover:text-brand-orange hover:bg-orange-50 rounded-lg transition-all cursor-pointer" 
                                title={t('Message User', 'গ্রাহককে বার্তা দিন')}
                              >
                                 <MessageSquare size={16} />
                              </button>
                              <button 
                                onClick={() => setHistoryCustomer(customer)}
                                className="p-2 text-gray-400 hover:text-brand-navy hover:bg-gray-100 rounded-lg transition-all cursor-pointer" 
                                title={t('Order History', 'অর্ডারের ইতিহাস')}
                              >
                                 <History size={16} />
                              </button>
                              <button 
                                disabled={restrictingId === customer.id}
                                onClick={() => handleToggleRestrict(customer)}
                                className={`p-2 rounded-lg transition-all cursor-pointer ${
                                  customer.status === 'restricted'
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-gray-400 hover:text-rose-500 hover:bg-rose-50'
                                }`} 
                                title={customer.status === 'restricted' ? t('Lift Restriction', 'সীমাবদ্ধতা তুলুন') : t('Restrict Access', 'অ্যাক্সেস সীমাবদ্ধ করুন')}
                              >
                                 {restrictingId === customer.id ? (
                                   <Loader2 size={16} className="animate-spin text-gray-400" />
                                 ) : (
                                   <Ban size={16} />
                                 )}
                              </button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-6 bg-white rounded-[2rem] border border-gray-100 daraz-shadow mt-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {t('Showing', 'দেখানো হচ্ছে')} <span className="text-brand-navy">{(currentPage - 1) * itemsPerPage + 1}</span> {t('to', 'থেকে')} <span className="text-brand-navy">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> {t('of', 'মোট')} <span className="text-brand-navy">{filteredCustomers.length}</span> {t('Customers', 'গ্রাহক')}
           </p>
           <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                 <ChevronLeft size={18} className="text-brand-navy" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                    currentPage === i + 1 
                    ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' 
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                   {i + 1}
                </button>
              ))}
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="p-2 border border-gray-100 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                 <ChevronRight size={18} className="text-brand-navy" />
              </button>
           </div>
        </div>
      )}

      {/* Broadcast Mail Modal */}
      <AnimatePresence>
        {isBroadcastOpen && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsBroadcastOpen(false)}
              className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }} 
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-navy/10 text-brand-navy rounded-xl flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">{t('Broadcast Announcement', 'ব্রডকাস্ট ঘোষণা')}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('Save notification to all registered customers', 'সব নিবন্ধিত গ্রাহকের কাছে বিজ্ঞপ্তি পাঠান')}</p>
                  </div>
                </div>
                <button onClick={() => setIsBroadcastOpen(false)} className="text-gray-400 hover:text-brand-navy"><X size={20} /></button>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Target Audience', 'টার্গেট গ্রাহক')}</label>
                  <select 
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-brand-navy outline-none"
                  >
                    <option value="all">{t('All Shoppers', 'সব ক্রেতা')} ({customers.length})</option>
                    <option value="active">{t('Active Buyers (1+ Orders)', 'সক্রিয় ক্রেতা (১+ অর্ডার)')}</option>
                    <option value="vip">{t('VIP High-LTV Customers (>৳10,000)', 'ভিআইপি গ্রাহক (>৳১০,০০০)')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Broadcast Subject', 'বার্তার বিষয়')}</label>
                  <input 
                    type="text" 
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    placeholder={t('e.g. Flash Weekend Promo / Delivery Notice', 'যেমন: উইকেন্ড ফ্ল্যাশ অফার / ডেলিভারি নোটিশ')} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-brand-navy outline-none focus:border-brand-orange" 
                    required 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Message Content', 'বার্তার বিবরণ')}</label>
                  <textarea 
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder={t('Write announcement message for customers...', 'গ্রাহকদের জন্য ঘোষণার বার্তা লিখুন...')} 
                    rows={4}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium text-gray-700 outline-none focus:border-brand-orange resize-none" 
                    required 
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSendingBroadcast}
                  className="w-full py-4 bg-brand-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSendingBroadcast ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {t('Deploy Broadcast Notification', 'ব্রডকাস্ট বিজ্ঞপ্তি পাঠান')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Customer Order History Modal */}
      <AnimatePresence>
        {historyCustomer && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setHistoryCustomer(null)}
              className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }} 
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-6 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-orange/10 text-brand-orange rounded-xl flex items-center justify-center">
                    <History size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">{t('Order History', 'অর্ডারের ইতিহাস')} · {historyCustomer.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{historyCustomer.email || historyCustomer.phone} · {historyCustomer.orders.length} {t('Orders', 'টি অর্ডার')}</p>
                  </div>
                </div>
                <button onClick={() => setHistoryCustomer(null)} className="text-gray-400 hover:text-brand-navy"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
                {historyCustomer.orders.map((ord) => (
                  <div key={ord.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-brand-navy">#{ord.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                          ord.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {getOrderStatusLabel(ord.status)}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold">{new Date(ord.createdAt).toLocaleDateString(dateLocale)} · {ord.paymentMethod?.toUpperCase()}</p>
                      <p className="text-xs font-medium text-gray-600 mt-1">{ord.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-brand-navy">৳{ord.total.toLocaleString()}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryCustomer(null);
                          navigate(`/invoice/${ord.id}`);
                        }}
                        className="text-[9px] font-bold text-brand-orange uppercase tracking-wider hover:underline mt-1 inline-block cursor-pointer"
                      >
                        {t('View Invoice →', 'ইনভয়েস দেখুন →')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
