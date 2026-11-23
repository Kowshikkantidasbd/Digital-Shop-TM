import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, Search, Download, Filter, 
  TrendingUp, TrendingDown, Clock, CheckCircle,
  AlertCircle, ArrowUpRight, ArrowDownRight, DollarSign,
  Maximize2, ExternalLink, Loader2
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { Order } from '../../types';
import { useNavigate } from 'react-router-dom';
import { formatMoney, isRevenueEligible } from '../../utils/formatMoney';
import { useLanguage } from '../../contexts/LanguageContext';

interface TransactionItem {
  id: string;
  orderId: string;
  customer: string;
  amount: number;
  method: string;
  date: string;
  status: 'completed' | 'pending' | 'refunded';
}

export const PaymentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadOrders = async () => {
      try {
        const list = await adminApi.getOrders();
        if (active) setOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('PaymentManagement live orders sync warning:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const transactions: TransactionItem[] = useMemo(() => {
    return orders.map((o) => {
      const isDelivered = o.status === 'delivered';
      const isCancelled = o.status === 'cancelled';
      const status: 'completed' | 'pending' | 'refunded' = isDelivered ? 'completed' : isCancelled ? 'refunded' : 'pending';
      return {
        id: o.transactionId || `TX-${o.id.slice(-6)}`,
        orderId: o.id,
        customer: o.address?.fullName || t('Guest Customer', 'অতিথি ক্রেতা'),
        amount: o.total || 0,
        method: o.paymentMethod ? o.paymentMethod.toUpperCase() : 'COD',
        date: o.createdAt || new Date().toISOString(),
        status
      };
    });
  }, [orders, t]);

  const activeBalance = useMemo(() => {
    return orders
      .filter(o => isRevenueEligible(o.status))
      .reduce((sum, o) => sum + Math.round(Number(o.total) || 0), 0);
  }, [orders]);

  const pendingClearances = useMemo(() => {
    return orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + Math.round(Number(o.total) || 0), 0);
  }, [orders]);

  const pendingCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);

  const refundRequests = useMemo(() => {
    return orders.filter(o => o.status === 'cancelled' || (o as any).cancellationRequested).reduce((sum, o) => sum + Math.round(Number(o.total) || 0), 0);
  }, [orders]);

  const refundCount = useMemo(() => orders.filter(o => o.status === 'cancelled' || (o as any).cancellationRequested).length, [orders]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.method.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const getTxStatusLabel = (status: TransactionItem['status']) => {
    switch (status) {
      case 'completed': return t('Completed', 'সম্পন্ন');
      case 'pending': return t('Pending', 'অপেক্ষমাণ');
      case 'refunded': return t('Refunded', 'রিফান্ড');
    }
  };

  const handleExportStatement = () => {
    if (!transactions.length) return;
    const headers = [
      t('Transaction ID', 'লেনদেন আইডি'),
      t('Order ID', 'অর্ডার আইডি'),
      t('Payor', 'পরিশোধকারী'),
      t('Gross Flow (BDT)', 'মোট পরিমাণ (টাকা)'),
      t('Payment Protocol', 'পেমেন্ট মাধ্যম'),
      t('Timestamp', 'তারিখ ও সময়'),
      t('Settlement Status', 'নিষ্পত্তি অবস্থা')
    ];
    const rows = transactions.map(tx => [
      `"${tx.id}"`,
      `"${tx.orderId}"`,
      `"${tx.customer.replace(/"/g, '""')}"`,
      tx.amount,
      `"${tx.method}"`,
      `"${new Date(tx.date).toISOString()}"`,
      `"${getTxStatusLabel(tx.status)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_statement_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenOrder = (orderId: string) => {
    navigate(`/invoice/${orderId}`);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-brand-navy tracking-tight uppercase">{t('Cashflow & Settlements', 'নগদ প্রবাহ ও নিষ্পত্তি')}</h1>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Global Payment Gateways & Refunds', 'পেমেন্ট গেটওয়ে ও রিফান্ড ব্যবস্থাপনা')}</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleExportStatement}
             className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange/90 transition-all shadow-lg shadow-brand-orange/10 cursor-pointer"
           >
             <Download size={16} /> {t('Export Statement', 'স্টেটমেন্ট এক্সপোর্ট')}
           </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-brand-navy p-8 rounded-[2.5rem] text-white daraz-shadow relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{t('Active Gross Flow', 'সক্রিয় মোট আয়')}</p>
               <h3 className="text-4xl font-black tracking-tighter">৳{formatMoney(activeBalance)}</h3>
               <div className="flex items-center gap-3 mt-8">
                  <div className="flex items-center gap-1 px-3 py-1 bg-emerald-500 rounded-full text-[9px] font-black uppercase tracking-widest text-white">
                     <ArrowUpRight size={10} /> {t('Live Synced', 'লাইভ সিঙ্ক')}
                  </div>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    {orders.length} {t('total orders', 'মোট অর্ডার')}
                  </span>
               </div>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-orange rounded-full -translate-y-1/2 translate-x-1/2 opacity-20 blur-3xl" />
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 daraz-shadow">
            <div className="w-12 h-12 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center mb-6">
               <Clock size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{t('Pending Clearances', 'অপেক্ষমাণ নিষ্পত্তি')}</p>
            <h3 className="text-2xl font-black text-brand-navy">৳{formatMoney(pendingClearances)}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
              {pendingCount} {t('transactions queued', 'টি লেনদেন অপেক্ষমাণ')}
            </p>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 daraz-shadow">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
               <AlertCircle size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{t('Refund Requests', 'রিফান্ড অনুরোধ')}</p>
            <h3 className="text-2xl font-black text-brand-navy">৳{formatMoney(refundRequests)}</h3>
            <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-4">
              {refundCount} {t('actions required', 'টি কার্যক্রম প্রয়োজন')}
            </p>
         </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
              <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">{t('Stream Log', 'লেনদেন তালিকা')}</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1">
                {language === 'bn'
                  ? `লাইভ পেমেন্ট ও অর্ডার প্রবাহ (${filteredTransactions.length}টি রেকর্ড)`
                  : `Live payment & order stream (${filteredTransactions.length} records)`}
              </p>
           </div>
           <div className="flex-1 max-w-md flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-xl border border-gray-100">
              <Search size={16} className="text-gray-400" />
              <input 
                type="text" 
                placeholder={t('Search by TxID or Customer...', 'লেনদেন আইডি বা ক্রেতার নাম দিয়ে খুঁজুন...')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-gray-600 font-bold uppercase tracking-wider" 
              />
           </div>
        </div>
        <div className="overflow-x-auto">
           {isLoading ? (
             <div className="p-12 text-center text-gray-400 flex items-center justify-center gap-3">
               <Loader2 className="animate-spin text-brand-orange" size={20} />
               <span className="text-xs font-bold uppercase tracking-widest">{t('Loading ledger...', 'লেজার লোড হচ্ছে...')}</span>
             </div>
           ) : filteredTransactions.length === 0 ? (
             <div className="p-12 text-center text-gray-400">
               <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
               <p className="text-xs font-bold uppercase tracking-widest">{t('No transactions match your search', 'আপনার অনুসন্ধানের সাথে কোনো লেনদেন মেলেনি')}</p>
             </div>
           ) : (
             <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                   <tr>
                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Transaction ID', 'লেনদেন আইডি')}</th>
                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Order', 'অর্ডার')}</th>
                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Payor', 'পরিশোধকারী')}</th>
                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Gross Flow', 'মোট পরিমাণ')}</th>
                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Protocol', 'মাধ্যম')}</th>
                      <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Status', 'অবস্থা')}</th>
                      <th className="px-8 py-5"></th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                         <td className="px-8 py-5">
                            <span className="text-xs font-black text-brand-navy tracking-tight">{tx.id}</span>
                         </td>
                         <td 
                           onClick={() => handleOpenOrder(tx.orderId)}
                           className="px-8 py-5 font-bold text-[10px] text-gray-500 uppercase tracking-widest hover:text-brand-orange cursor-pointer"
                           title={t('Click to view order invoice', 'অর্ডার চালান দেখতে ক্লিক করুন')}
                         >
                            {tx.orderId}
                         </td>
                         <td className="px-8 py-5">
                            <span className="text-xs font-bold text-gray-700">{tx.customer}</span>
                         </td>
                         <td className="px-8 py-5 font-black text-xs text-brand-navy">৳{formatMoney(tx.amount)}</td>
                         <td className="px-8 py-5 text-[10px] font-bold text-brand-orange uppercase tracking-widest">{tx.method}</td>
                         <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                              tx.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {getTxStatusLabel(tx.status)}
                            </span>
                         </td>
                         <td className="px-8 py-5 text-right">
                            <button 
                              onClick={() => handleOpenOrder(tx.orderId)}
                              className="p-2 text-gray-300 hover:text-brand-navy transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                              title={t('Open order invoice', 'অর্ডার চালান খুলুন')}
                            >
                               <ExternalLink size={16} />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
           )}
        </div>
      </div>
    </div>
  );
};

