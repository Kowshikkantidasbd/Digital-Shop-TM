import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Search, Filter, Eye, Truck, 
  CheckCircle, Clock, XCircle, ChevronRight,
  User, MapPin, CreditCard, Calendar, Printer,
  FileText, Download, MessageSquare, ArrowUpRight, ArrowDownRight, ChevronLeft,
  CheckSquare, Square, Calculator, AlertCircle, Loader2, X
} from 'lucide-react';
import { Order } from '../../types';
import { apiUrl } from '../../services/api';
import { authHeaders } from '../../lib/auth-client';
import { formatMoney } from '../../utils/formatMoney';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../Toast';

interface OrderManagementProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order['status']) => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({ orders = [], onUpdateStatus }) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [printPreviewOrders, setPrintPreviewOrders] = useState<Order[] | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Order; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  
  // Decimal totals audit state
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isFixingTotals, setIsFixingTotals] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  const itemsPerPage = 8;

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return t('Pending', 'অপেক্ষমাণ');
      case 'processing': return t('Processing', 'প্রক্রিয়াধীন');
      case 'shipped': return t('Shipped', 'পাঠানো হয়েছে');
      case 'delivered': return t('Delivered', 'ডেলিভারি সম্পন্ন');
      case 'cancelled': return t('Cancelled', 'বাতিল');
      default: return status;
    }
  };

  const handleSort = (key: keyof Order) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            order.address.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (order.address.email && order.address.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = selectedStatus === 'All Status' || order.status === selectedStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [orders, searchTerm, selectedStatus, sortConfig]);

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const printOrderInvoices = (targetOrders: Order[]) => {
    if (!targetOrders.length) {
      showToast(t('No orders available to print.', 'প্রিন্ট করার জন্য কোনো অর্ডার পাওয়া যায়নি।'), 'warning');
      return;
    }
    setPrintPreviewOrders(targetOrders);
  };

  const handleBatchPrint = () => {
    const target = selectedOrderIds.length > 0 
      ? orders.filter(o => selectedOrderIds.includes(o.id))
      : filteredOrders;
    printOrderInvoices(target);
  };

  const handleExportCsv = (specificOrders?: Order[]) => {
    const list = specificOrders || filteredOrders;
    if (!list.length) {
      showToast(t('No orders available to export.', 'এক্সপোর্ট করার জন্য কোনো অর্ডার নেই।'), 'warning');
      return;
    }

    const headers = [
      t('Order ID', 'অর্ডার আইডি'),
      t('Date', 'তারিখ'),
      t('Customer Name', 'ক্রেতার নাম'),
      t('Phone', 'ফোন'),
      t('Email', 'ইমেইল'),
      t('District', 'জেলা'),
      t('Full Address', 'সম্পূর্ণ ঠিকানা'),
      t('Payment Method', 'পেমেন্ট পদ্ধতি'),
      t('Transaction ID', 'লেনদেন আইডি'),
      t('Status', 'অবস্থা'),
      t('Total (BDT)', 'মোট (টাকা)'),
      t('Item Count', 'আইটেম সংখ্যা'),
      t('Items Detail', 'পণ্যের বিবরণ')
    ];
    const rows = list.map(o => [
      `"${o.id}"`,
      `"${new Date(o.createdAt).toISOString()}"`,
      `"${(o.address.fullName || '').replace(/"/g, '""')}"`,
      `"${(o.address.phone || '').replace(/"/g, '""')}"`,
      `"${(o.address.email || '').replace(/"/g, '""')}"`,
      `"${(o.address.district || o.address.division || '').replace(/"/g, '""')}"`,
      `"${(o.address.addressLine || o.address.fullAddress || (o.address as any).street || '').replace(/"/g, '""')}"`,
      `"${o.paymentMethod}"`,
      `"${o.transactionId || ''}"`,
      `"${getOrderStatusLabel(o.status)}"`,
      o.total,
      o.items.length,
      `"${o.items.map(i => `${i.name} (x${i.quantity})`).join('; ').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t('Orders exported as CSV.', 'অর্ডার সিএসভি হিসেবে এক্সপোর্ট হয়েছে।'), 'success');
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Orders with non-integer totals
  const decimalOrders = useMemo(() => {
    return orders.filter(o => typeof o.total === 'number' && !Number.isInteger(o.total));
  }, [orders]);

  const handleFixDecimalOrders = async () => {
    if (decimalOrders.length === 0) return;
    setIsFixingTotals(true);
    try {
      let updatedCount = 0;
      for (const order of decimalOrders) {
        const roundedTotal = Math.round(Number(order.total) || 0);
        const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(order.id)}`), {
          method: 'PUT',
          credentials: 'include',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            total: roundedTotal,
            paymentAmount: Math.round(Number(order.paymentAmount || roundedTotal))
          })
        });
        if (!res.ok) {
          throw new Error(`Failed to update order #${order.id}`);
        }
        updatedCount++;
      }
      setAuditMessage(
        t(
          `Successfully fixed ${updatedCount} orders to whole BDT integers.`,
          `${updatedCount}টি অর্ডারের মূল্য সফলভাবে পূর্ণসংখ্যায় রূপান্তর করা হয়েছে।`
        )
      );
      showToast(t('Decimal totals rounded successfully.', 'দশমিক মোট সফলভাবে ঠিক করা হয়েছে।'), 'success');
      setTimeout(() => {
        setAuditMessage(null);
        setIsAuditModalOpen(false);
      }, 3000);
    } catch (err: any) {
      showToast(t('Failed to fix orders: ', 'অর্ডার ঠিক করতে ব্যর্থ: ') + err.message, 'error');
    } finally {
      setIsFixingTotals(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-600';
      case 'pending': return 'bg-orange-100 text-orange-600';
      case 'processing': return 'bg-blue-100 text-blue-600';
      case 'shipped': return 'bg-purple-100 text-purple-600';
      case 'cancelled': return 'bg-rose-100 text-rose-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'processing': return <Clock size={14} />;
      case 'shipped': return <Truck size={14} />;
      case 'cancelled': return <XCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-brand-navy tracking-tight uppercase">{t('Order Fulfillment', 'অর্ডার ব্যবস্থাপনা')}</h1>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Manage Logistics & Shipments', 'লজিস্টিক্স ও শিপমেন্ট পরিচালনা করুন')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
           <button 
             onClick={() => setIsAuditModalOpen(true)}
             className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm cursor-pointer ${
               decimalOrders.length > 0 
                 ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20 animate-pulse' 
                 : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
             }`}
             title={t('Audit and round decimal order totals into whole BDT integers', 'দশমিক অর্ডারের মোট পূর্ণসংখ্যায় অডিট ও ঠিক করুন')}
           >
             <Calculator size={16} /> {t('Audit Decimals', 'দশমিক অডিট')} {decimalOrders.length > 0 && `(${decimalOrders.length})`}
           </button>
           <button 
             onClick={handleBatchPrint}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
             title={selectedOrderIds.length > 0 ? t(`Print ${selectedOrderIds.length} selected invoices`, `নির্বাচিত ${selectedOrderIds.length}টি চালান প্রিন্ট করুন`) : t('Print all filtered invoices', 'ফিল্টার করা সব চালান প্রিন্ট করুন')}
           >
             <Printer size={16} /> {t('Batch Print', 'ব্যাচ প্রিন্ট')} {selectedOrderIds.length > 0 && `(${selectedOrderIds.length})`}
           </button>
           <button 
             onClick={() => handleExportCsv(selectedOrderIds.length > 0 ? orders.filter(o => selectedOrderIds.includes(o.id)) : filteredOrders)}
             className="flex items-center gap-2 px-6 py-3 bg-brand-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-navy/90 transition-all shadow-lg shadow-brand-navy/10 cursor-pointer"
           >
             <Download size={16} /> {t('Export CSV', 'সিএসভি এক্সপোর্ট')} {selectedOrderIds.length > 0 && `(${selectedOrderIds.length})`}
           </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 daraz-shadow flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-xl border border-gray-100 w-full md:w-auto">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder={t('Search by Order ID, Customer Name...', 'অর্ডার আইডি বা ক্রেতার নাম দিয়ে খুঁজুন...')} 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="bg-transparent border-none outline-none text-xs w-full text-gray-600 font-bold uppercase tracking-wider" 
            />
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="bg-gray-50 border border-gray-100 rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none text-gray-500 min-w-[150px]"
            >
               <option value="All Status">{t('All Status', 'সকল অবস্থা')}</option>
               <option value="Pending">{t('Pending', 'অপেক্ষমাণ')}</option>
               <option value="Processing">{t('Processing', 'প্রক্রিয়াধীন')}</option>
               <option value="Shipped">{t('Shipped', 'পাঠানো হয়েছে')}</option>
               <option value="Delivered">{t('Delivered', 'ডেলিভারি সম্পন্ন')}</option>
               <option value="Cancelled">{t('Cancelled', 'বাতিল')}</option>
            </select>
         </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50/50">
                  <tr>
                     <th className="px-6 py-5 w-12 text-center">
                        <button 
                          onClick={toggleSelectAll} 
                          className="text-gray-400 hover:text-brand-orange transition-colors cursor-pointer"
                          title={t('Select all', 'সব নির্বাচন করুন')}
                        >
                          {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                            <CheckSquare size={16} className="text-brand-orange" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                     </th>
                     <th 
                       onClick={() => handleSort('id')}
                       className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                     >
                        <div className="flex items-center gap-1">
                           {t('Order ID', 'অর্ডার আইডি')}
                           {sortConfig?.key === 'id' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                        </div>
                     </th>
                     <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Customer', 'ক্রেতা')}</th>
                     <th 
                       onClick={() => handleSort('total')}
                       className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                     >
                        <div className="flex items-center gap-1">
                           {t('Total', 'মোট')}
                           {sortConfig?.key === 'total' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                        </div>
                     </th>
                     <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Payment', 'পেমেন্ট')}</th>
                     <th 
                       onClick={() => handleSort('status')}
                       className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                     >
                        <div className="flex items-center gap-1">
                           {t('Logistics', 'অবস্থা')}
                           {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                        </div>
                     </th>
                     <th 
                       onClick={() => handleSort('createdAt')}
                       className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-orange transition-colors"
                     >
                        <div className="flex items-center gap-1">
                           {t('Date', 'তারিখ')}
                           {sortConfig?.key === 'createdAt' && (sortConfig.direction === 'asc' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />)}
                        </div>
                     </th>
                     <th className="px-6 py-5 text-right text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Actions', 'অ্যাকশন')}</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {paginatedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                        <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-xs font-bold uppercase tracking-widest">{t('No matching orders found', 'কোনো মিল থাকা অর্ডার পাওয়া যায়নি')}</p>
                      </td>
                    </tr>
                  ) : paginatedOrders.map((order) => {
                     const isSelected = selectedOrderIds.includes(order.id);
                     return (
                      <tr key={order.id} className={`hover:bg-gray-50/30 transition-colors group ${isSelected ? 'bg-orange-50/20' : ''}`}>
                         <td className="px-6 py-5 text-center">
                            <button 
                              onClick={() => toggleSelectOrder(order.id)}
                              className="text-gray-400 hover:text-brand-orange transition-colors cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare size={16} className="text-brand-orange" />
                              ) : (
                                <Square size={16} />
                              )}
                            </button>
                         </td>
                         <td className="px-6 py-5">
                            <span className="text-xs font-black text-brand-navy tracking-tight">#{order.id}</span>
                         </td>
                         <td className="px-6 py-5">
                            <div className="flex flex-col">
                               <span className="text-xs font-bold text-brand-navy">{order.address.fullName}</span>
                               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                 {order.items.length} {t('items', 'টি পণ্য')}
                               </span>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <span className="text-xs font-black text-brand-navy">৳{formatMoney(order.total)}</span>
                         </td>
                         <td className="px-6 py-5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.paymentMethod}</span>
                         </td>
                         <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {getOrderStatusLabel(order.status)}
                            </span>
                         </td>
                         <td className="px-6 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {new Date(order.createdAt).toLocaleDateString(dateLocale)}
                         </td>
                         <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                               <button 
                                onClick={() => setViewingOrder(order)}
                                className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-orange hover:bg-orange-50 transition-all cursor-pointer"
                                title={t('View details', 'বিস্তারিত দেখুন')}
                               >
                                  <Eye size={15} />
                               </button>
                               <button 
                                onClick={() => printOrderInvoices([order])}
                                className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-navy hover:bg-blue-50 transition-all cursor-pointer"
                                title={t('Print invoice', 'চালান প্রিন্ট করুন')}
                               >
                                  <Printer size={15} />
                               </button>
                               <button 
                                onClick={() => handleExportCsv([order])}
                                className="p-2.5 bg-gray-50 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                                title={t('Download CSV', 'সিএসভি ডাউনলোড')}
                               >
                                  <Download size={15} />
                               </button>
                            </div>
                         </td>
                      </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 bg-white rounded-[2rem] border border-gray-100 daraz-shadow mt-6">
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {language === 'bn' ? (
                <>মোট <span className="text-brand-navy">{filteredOrders.length}</span>টি অর্ডারের মধ্যে <span className="text-brand-navy">{(currentPage - 1) * itemsPerPage + 1}</span> থেকে <span className="text-brand-navy">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> দেখানো হচ্ছে</>
              ) : (
                <>Showing <span className="text-brand-navy">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-brand-navy">{Math.min(currentPage * itemsPerPage, filteredOrders.length)}</span> of <span className="text-brand-navy">{filteredOrders.length}</span> Orders</>
              )}
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

      {/* Order Detail Modal */}
      <AnimatePresence>
        {viewingOrder && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setViewingOrder(null)}
               className="absolute inset-0 bg-brand-navy/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-5xl bg-gray-50 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
             >
                {/* Left Side: Order Info */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar bg-white">
                   <div className="flex items-center justify-between">
                      <div>
                         <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em]">{t('Order Document', 'অর্ডার ডকুমেন্ট')}</span>
                         <h2 className="text-2xl md:text-3xl font-black text-brand-navy tracking-tighter uppercase mt-1">{t('Details', 'বিস্তারিত')} #{viewingOrder.id}</h2>
                      </div>
                      <div className="flex gap-3">
                         <button 
                           onClick={() => printOrderInvoices([viewingOrder])}
                           className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-brand-orange transition-all cursor-pointer"
                           title={t('Print invoice', 'চালান প্রিন্ট করুন')}
                         >
                           <Printer size={18} />
                         </button>
                         <button 
                           onClick={() => handleExportCsv([viewingOrder])}
                           className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-brand-orange transition-all cursor-pointer"
                           title={t('Download CSV', 'সিএসভি ডাউনলোড')}
                         >
                           <Download size={18} />
                         </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                         <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                           <User size={14} /> {t('Recipient Information', 'প্রাপকের তথ্য')}
                         </h4>
                         <div className="space-y-2">
                            <p className="text-sm font-black text-brand-navy">{viewingOrder.address.fullName}</p>
                            <p className="text-xs font-bold text-gray-500">{viewingOrder.address.email}</p>
                            <p className="text-xs font-bold text-gray-500">{viewingOrder.address.phone}</p>
                         </div>
                         <div className="pt-6 border-t border-gray-100 flex items-start gap-3">
                            <MapPin size={16} className="text-gray-400 shrink-0 mt-1" />
                            <div className="space-y-1">
                               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('Shipping To', 'ডেলিভারি ঠিকানা')}</p>
                               <p className="text-xs font-medium text-gray-700 leading-relaxed">
                                  {viewingOrder.address.fullAddress || viewingOrder.address.addressLine}
                               </p>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="space-y-6">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                              <CreditCard size={14} /> {t('Fiscal Summary', 'আর্থিক সারসংক্ষেপ')}
                            </h4>
                            <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                               <div className="flex justify-between text-xs">
                                  <span className="font-bold text-gray-500 uppercase tracking-widest">{t('Subtotal', 'সাবটোটাল')}</span>
                                  <span className="font-black text-brand-navy">৳{viewingOrder.subtotal.toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between text-xs">
                                  <span className="font-bold text-gray-500 uppercase tracking-widest">{t('Delivery Fee', 'ডেলিভারি চার্জ')}</span>
                                  <span className="font-black text-brand-navy">৳{viewingOrder.deliveryCharge.toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between text-xs">
                                  <span className="font-bold text-emerald-500 uppercase tracking-widest">{t('Discount', 'ডিসকাউন্ট')}</span>
                                  <span className="font-black text-emerald-500">-৳{viewingOrder.discount.toLocaleString()}</span>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-between items-baseline">
                                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('Total Receivable', 'সর্বমোট মূল্য')}</span>
                                   <span className="text-3xl font-black text-brand-orange">৳{viewingOrder.total.toLocaleString()}</span>
                                </div>
                            </div>
                         </div>

                         <div className="flex items-center gap-3 p-4 bg-brand-navy/5 border border-brand-navy/10 rounded-2xl">
                            <div className="w-10 h-10 bg-brand-navy rounded-xl flex items-center justify-center text-white">
                               <CreditCard size={18} />
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Payment Method', 'পেমেন্ট পদ্ধতি')}</p>
                               <p className="text-xs font-black text-brand-navy uppercase mt-0.5">{viewingOrder.paymentMethod}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Order Items', 'অর্ডারের পণ্যসমূহ')} ({viewingOrder.items.length})</h4>
                      <div className="space-y-4">
                         {viewingOrder.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-[2rem] daraz-shadow">
                               <div className="flex items-center gap-6">
                                  <div className="w-16 h-20 bg-gray-50 rounded-2xl overflow-hidden border border-gray-50">
                                     <img src={item.image} alt={item.name || t('Order item', 'অর্ডার পণ্য')} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                     <p className="text-xs font-black text-brand-navy line-clamp-1">{item.name}</p>
                                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mt-1">
                                        {t('Qty', 'পরিমাণ')}: {item.quantity} · {t('Size', 'সাইজ')}: {item.selectedSize || t('Standard', 'স্ট্যান্ডার্ড')} · ৳{item.price.toLocaleString()}
                                     </p>
                                  </div>
                               </div>
                               <span className="text-sm font-black text-brand-navy">৳{(item.quantity * item.price).toLocaleString()}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* Right Side: Status Control */}
                <div className="w-full md:w-80 bg-gray-50 p-8 md:p-12 space-y-10 border-l border-gray-100">
                   <div className="space-y-6 text-center md:text-left">
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Workflow Control', 'অবস্থা নিয়ন্ত্রণ')}</h4>
                      <div className="flex flex-col gap-3">
                         {(['pending', 'processing', 'shipped', 'delivered'] as Order['status'][]).map((status) => (
                            <button
                              key={status}
                              onClick={() => {
                                onUpdateStatus(viewingOrder.id, status);
                                setViewingOrder({...viewingOrder, status});
                              }}
                              className={`w-full p-4 rounded-2xl flex items-center justify-between group transition-all cursor-pointer ${
                                viewingOrder.status === status 
                                ? 'bg-brand-navy text-white shadow-xl shadow-brand-navy/20' 
                                : 'bg-white text-gray-400 hover:bg-gray-100 border border-white'
                              }`}
                            >
                               <div className="flex items-center gap-3">
                                  {getStatusIcon(status)}
                                  <span className="text-[10px] font-black uppercase tracking-widest">{getOrderStatusLabel(status)}</span>
                               </div>
                               {viewingOrder.status === status && <CheckCircle size={14} className="text-brand-orange" />}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="p-6 bg-white rounded-3xl border border-white shadow-sm space-y-6">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-navy">{t('Merchant Notes', 'মার্চেন্ট নোট')}</h4>
                      <div className="space-y-3">
                         <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-orange cursor-pointer transition-colors">
                            <MessageSquare size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{t('Internal Discussion', 'অভ্যন্তরীণ আলোচনা')}</span>
                         </div>
                         <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-brand-orange cursor-pointer transition-colors">
                            <FileText size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{t('Attach Manifest', 'ম্যানিফেস্ট সংযুক্তি')}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-2">
                      <button
                        onClick={() => printOrderInvoices([viewingOrder])}
                        className="flex-1 py-3.5 bg-white border border-gray-200 text-brand-navy rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Printer size={14} /> {t('Print Invoice', 'প্রিন্ট')}
                      </button>
                      <button
                        onClick={() => handleExportCsv([viewingOrder])}
                        className="flex-1 py-3.5 bg-white border border-gray-200 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Download size={14} /> {t('Download CSV', 'সিএসভি')}
                      </button>
                   </div>

                   <button 
                    onClick={() => setViewingOrder(null)}
                    className="w-full py-4 bg-brand-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-100 cursor-pointer"
                   >
                      {t('Confirm Workflow', 'নিশ্চিত করুন')}
                   </button>
                </div>

                <button onClick={() => setViewingOrder(null)} className="absolute top-8 right-8 text-gray-400 md:text-white/50 hover:text-brand-navy md:hover:text-white transition-colors cursor-pointer"><XCircle size={32} /></button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-App Invoice Print Preview Modal */}
      <AnimatePresence>
        {printPreviewOrders && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div>
                  <h3 className="text-lg font-black text-brand-navy uppercase tracking-tight">
                    {t('Invoice Print Preview', 'চালান প্রিন্ট প্রিভিউ')} ({printPreviewOrders.length})
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                    {t('Ready for printing or saving as PDF', 'প্রিন্ট বা পিডিএফ সংরক্ষণের জন্য প্রস্তুত')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-orange/20 cursor-pointer"
                  >
                    <Printer size={14} /> {t('Print Now', 'প্রিন্ট করুন')}
                  </button>
                  <button
                    onClick={() => setPrintPreviewOrders(null)}
                    className="p-2.5 bg-white border border-gray-200 text-gray-500 hover:text-brand-navy rounded-xl cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gray-100/50">
                {printPreviewOrders.map((o) => (
                  <div key={o.id} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                    <div className="flex flex-wrap justify-between gap-4 border-b border-gray-100 pb-5">
                      <div>
                        <div className="text-xl font-black text-brand-navy">DIGITAL SHOP T.M</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                          {t('OFFICIAL TAX INVOICE', 'অফিশিয়াল ট্যাক্স চালান')}
                        </div>
                      </div>
                      <div className="text-right text-xs text-gray-500 space-y-1">
                        <div className="font-black text-brand-navy">{t('Order', 'অর্ডার')} #{o.id}</div>
                        <div>{t('Date', 'তারিখ')}: {new Date(o.createdAt).toLocaleDateString(dateLocale)}</div>
                        <div className="font-bold uppercase text-brand-orange">{t('Status', 'অবস্থা')}: {getOrderStatusLabel(o.status)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                      <div className="space-y-1">
                        <p><strong className="text-brand-navy">{t('Customer', 'ক্রেতা')}:</strong> {o.address.fullName}</p>
                        <p><strong className="text-brand-navy">{t('Phone', 'ফোন')}:</strong> {o.address.phone}</p>
                        <p><strong className="text-brand-navy">{t('Email', 'ইমেইল')}:</strong> {o.address.email || t('N/A', 'প্রযোজ্য নয়')}</p>
                        <p><strong className="text-brand-navy">{t('Address', 'ঠিকানা')}:</strong> {o.address.addressLine || o.address.fullAddress || (o.address as any).street || ''}, {o.address.city || o.address.district || ''}</p>
                      </div>
                      <div className="sm:text-right space-y-1">
                        <p><strong className="text-brand-navy">{t('Payment Method', 'পেমেন্ট পদ্ধতি')}:</strong> {o.paymentMethod.toUpperCase()}</p>
                        {o.transactionId && <p><strong className="text-brand-navy">{t('Trx ID', 'লেনদেন আইডি')}:</strong> {o.transactionId}</p>}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <th className="p-3">{t('Item', 'পণ্য')}</th>
                            <th className="p-3">{t('Qty', 'পরিমাণ')}</th>
                            <th className="p-3">{t('Unit Price', 'একক মূল্য')}</th>
                            <th className="p-3 text-right">{t('Total', 'মোট')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                          {o.items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="p-3 font-bold text-brand-navy">{item.name || t('Product', 'পণ্য')}</td>
                              <td className="p-3">{item.quantity}</td>
                              <td className="p-3">৳{item.price.toLocaleString()}</td>
                              <td className="p-3 text-right font-bold">৳{(item.quantity * item.price).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end items-baseline gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('Total Amount', 'সর্বমোট পরিমাণ')}:</span>
                      <span className="text-xl font-black text-brand-orange">৳{o.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Decimal Totals Audit & Fix Modal */}
      <AnimatePresence>
        {isAuditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 border border-gray-100 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setIsAuditModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <Calculator size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-brand-navy uppercase tracking-tight">{t('Order Totals Decimal Audit', 'অর্ডার মোট দশমিক অডিট')}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">{t('Enforce Whole BDT Integers & Prevent Decimal Leakage', 'পূর্ণসংখ্যায় টাকা নির্ধারণ ও দশমিক ত্রুটি প্রতিরোধ করুন')}</p>
                </div>
              </div>

              {auditMessage && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-sm">
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  <span>{auditMessage}</span>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('Audit Status', 'অডিট অবস্থা')}</p>
                  <p className="text-sm font-black text-brand-navy mt-0.5">
                    {decimalOrders.length > 0 
                      ? t(`${decimalOrders.length} order(s) contain fractional decimals`, `${decimalOrders.length}টি অর্ডারে ভগ্নাংশ দশমিক রয়েছে`)
                      : t('All orders have valid integer totals (0 decimals found)', 'সব অর্ডারের মোট সঠিক পূর্ণসংখ্যায় রয়েছে (০টি দশমিক পাওয়া গেছে)')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  decimalOrders.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {decimalOrders.length > 0 ? t('Fix Required', 'সংশোধন প্রয়োজন') : t('Clean & Verified', 'পরিচ্ছন্ন ও যাচাইকৃত')}
                </span>
              </div>

              {decimalOrders.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{t('Preview of Proposed Integer Fixes:', 'প্রস্তাবিত পূর্ণসংখ্যা সংশোধনের প্রিভিউ:')}</p>
                  <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-2xl divide-y divide-gray-100">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-[9px] font-black uppercase tracking-widest text-gray-400">
                        <tr>
                          <th className="p-3">{t('Order ID', 'অর্ডার আইডি')}</th>
                          <th className="p-3">{t('Customer', 'ক্রেতা')}</th>
                          <th className="p-3">{t('Current Total', 'বর্তমান মোট')}</th>
                          <th className="p-3">{t('Fixed Whole Total', 'সংশোধিত মোট')}</th>
                          <th className="p-3">{t('Delta', 'পার্থক্য')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 font-mono text-[11px]">
                        {decimalOrders.map(o => {
                          const current = Number(o.total) || 0;
                          const fixed = Math.round(current);
                          const delta = fixed - current;
                          return (
                            <tr key={o.id} className="hover:bg-gray-50/50">
                              <td className="p-3 font-bold text-brand-navy">#{o.id}</td>
                              <td className="p-3 font-sans text-gray-700">{o.address?.fullName || t('Customer', 'ক্রেতা')}</td>
                              <td className="p-3 text-rose-500 font-bold">৳{current}</td>
                              <td className="p-3 text-emerald-600 font-black">৳{formatMoney(fixed)}</td>
                              <td className="p-3 text-gray-400">{delta > 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleFixDecimalOrders}
                    disabled={isFixingTotals}
                    className="w-full py-4 bg-brand-orange text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-orange/90 transition-all shadow-lg shadow-brand-orange/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                  >
                    {isFixingTotals ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    {isFixingTotals ? t('Applying Rounding Fix to Database...', 'ডাটাবেসে সংশোধন প্রয়োগ হচ্ছে...') : t(`Apply Integer Fix to ${decimalOrders.length} Order(s)`, `${decimalOrders.length}টি অর্ডারে পূর্ণসংখ্যা প্রয়োগ করুন`)}
                  </button>
                </div>
              ) : (
                <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-center space-y-2">
                  <CheckCircle size={32} className="text-emerald-500 mx-auto" />
                  <h4 className="text-sm font-black text-emerald-900 uppercase">{t('Database Totals are Pristine', 'ডাটাবেস হিসাব সম্পূর্ণ সঠিক')}</h4>
                  <p className="text-xs text-emerald-700 font-medium">{t('All existing order records adhere to the whole BDT integer standard with zero decimals.', 'সব বিদ্যমান অর্ডার রেকর্ডে দশমিকহীন পূর্ণসংখ্যার মানদণ্ড বজায় রয়েছে।')}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

