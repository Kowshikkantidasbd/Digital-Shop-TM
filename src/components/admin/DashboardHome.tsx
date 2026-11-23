import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, Users, DollarSign, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Package, Clock,
  MessageSquare, Star
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, Order, Review } from '../../types';
import { formatMoney, isRevenueEligible } from '../../utils/formatMoney';
import { useLanguage } from '../../contexts/LanguageContext';

interface DashboardHomeProps {
  products: Product[];
  orders: Order[];
  reviews: Review[];
  onNavigate: (view: 'dashboard' | 'products' | 'orders' | 'customers' | 'reviews' | 'chat' | 'payments' | 'coupons' | 'banners' | 'settings') => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ products = [], orders = [], reviews = [], onNavigate }) => {
  const { language, t } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';

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

  // Calculate revenue strictly from non-cancelled, non-returned, and non-refunded orders (STEP 7)
  const totalRevenue = useMemo(() => 
    orders
      .filter(o => isRevenueEligible(o.status))
      .reduce((sum, o) => sum + Math.round(Number(o.total) || 0), 0),
    [orders]
  );
  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);
  const lowStockCount = useMemo(() => products.filter(p => (p.stock || 0) < 10).length, [products]);
  
  // Aggregate chart data by month
  const chartData = useMemo(() => {
    const months = language === 'bn'
      ? ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last7Months = [];
    
    for (let i = 6; i >= 0; i--) {
      const mIndex = (currentMonth - i + 12) % 12;
      last7Months.push({
        name: months[mIndex],
        revenue: 0,
        sales: 0,
        index: mIndex
      });
    }

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const monthIndex = orderDate.getMonth();
      const chartItem = last7Months.find(item => item.index === monthIndex);
      if (chartItem) {
        chartItem.revenue += order.total;
        chartItem.sales += order.items.reduce((s, i) => s + i.quantity, 0);
      }
    });

    return last7Months;
  }, [orders, language]);

  // Calculate real trends by comparing the last 30 days against the prior 30 days
  const { revTrend, orderTrend, fulfillmentRate } = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const currentOrders = orders.filter(o => (now - new Date(o.createdAt).getTime()) <= thirtyDays);
    const priorOrders = orders.filter(o => {
      const diff = now - new Date(o.createdAt).getTime();
      return diff > thirtyDays && diff <= thirtyDays * 2;
    });

    const currentRevenue = currentOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
    const priorRevenue = priorOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);

    const calcTrend = (cur: number, prev: number) => {
      if (prev > 0) {
        const pct = Math.round(((cur - prev) / prev) * 100);
        return `${pct >= 0 ? '+' : ''}${pct}%`;
      }
      return cur > 0 ? '+100%' : '0%';
    };

    const delivered = orders.filter(o => o.status === 'delivered').length;
    const rate = orders.length > 0 ? Math.round((delivered / orders.length) * 100) : 100;

    return {
      revTrend: calcTrend(currentRevenue, priorRevenue),
      orderTrend: calcTrend(currentOrders.length, priorOrders.length),
      fulfillmentRate: rate
    };
  }, [orders]);

  const handleDownloadReport = () => {
    const lines = [
      t('DIGITAL SHOP - EXECUTIVE PERFORMANCE REPORT', 'ডিজিটাল শপ - এক্সিকিউটিভ পারফরম্যান্স রিপোর্ট'),
      `${t('Generated At:', 'তৈরির সময়:')} ${new Date().toLocaleString(dateLocale)}`,
      '',
      t('--- FINANCIAL & KPI OVERVIEW ---', '--- আর্থিক ও কেপিআই সারসংক্ষেপ ---'),
      `${t('Total Revenue:', 'মোট আয়:')} BDT ${formatMoney(totalRevenue)}`,
      `${t('Revenue 30-Day Trend:', '৩০ দিনের আয়ের প্রবণতা:')} ${revTrend}`,
      `${t('Total Orders:', 'মোট অর্ডার:')} ${orders.length}`,
      `${t('Orders 30-Day Trend:', '৩০ দিনের অর্ডার প্রবণতা:')} ${orderTrend}`,
      `${t('Fulfillment Rate:', 'ডেলিভারি সফলতার হার:')} ${fulfillmentRate}%`,
      `${t('Pending Orders:', 'অপেক্ষমাণ অর্ডার:')} ${pendingOrders}`,
      `${t('Total Catalog Products:', 'মোট ক্যাটালগ পণ্য:')} ${products.length}`,
      `${t('Low Stock Alerts:', 'কম স্টক সতর্কতা:')} ${lowStockCount}`,
      `${t('Total Customer Reviews:', 'মোট গ্রাহক রিভিউ:')} ${reviews.length}`,
      '',
      t('--- PRODUCT CATALOG SNAPSHOT ---', '--- পণ্য ক্যাটালগ স্ন্যাপশট ---'),
      t('Product ID,Name,Price,Stock,Category,Rating', 'পণ্য আইডি,নাম,মূল্য,স্টক,ক্যাটাগরি,রেটিং'),
      ...products.map(p => `"${p.id}","${p.name.replace(/"/g, '""')}",${p.price},${p.stock || 0},"${p.category}",${p.rating || 0}`),
      '',
      t('--- RECENT ORDERS SUMMARY ---', '--- সাম্প্রতিক অর্ডার সারসংক্ষেপ ---'),
      t('Order ID,Customer,Status,Total (BDT),Date', 'অর্ডার আইডি,গ্রাহক,অবস্থা,মোট (টাকা),তারিখ'),
      ...orders.slice(0, 50).map(o => `"${o.id}","${(o.address.fullName || '').replace(/"/g, '""')}","${getOrderStatusLabel(o.status)}",${o.total},"${new Date(o.createdAt).toLocaleDateString(dateLocale)}"`)
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `store_performance_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    { label: t('Total Revenue', 'মোট আয়'), value: `৳${formatMoney(totalRevenue)}`, trend: revTrend, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50', view: 'payments' as const },
    { label: t('Total Orders', 'মোট অর্ডার'), value: orders.length, trend: orderTrend, icon: ShoppingBag, color: 'text-brand-orange', bg: 'bg-brand-orange/5', view: 'orders' as const },
    { label: t('Total Products', 'মোট পণ্য'), value: products.length, trend: `${products.length} ${t('live', 'সক্রিয়')}`, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50', view: 'products' as const },
    { label: t('Total Reviews', 'মোট রিভিউ'), value: reviews.length, trend: `${reviews.length} ${t('total', 'টি')}`, icon: Star, color: 'text-purple-500', bg: 'bg-purple-50', view: 'reviews' as const },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-brand-navy tracking-tight uppercase">{t('Admin Overview', 'অ্যাডমিন ওভারভিউ')}</h1>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Real-time statistics & activity', 'রিয়েল-টাইম পরিসংখ্যান ও কার্যকলাপ')}</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleDownloadReport}
             className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 transition-all cursor-pointer shadow-sm"
           >
             {t('Download Report', 'রিপোর্ট ডাউনলোড')}
           </button>
           <button 
             onClick={() => onNavigate('products')}
             className="px-4 py-2 bg-brand-navy text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-navy/90 transition-all shadow-lg shadow-brand-navy/10 cursor-pointer"
           >
             {t('Manage Store', 'স্টোর পরিচালনা')}
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            onClick={() => onNavigate(stat.view)}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 daraz-shadow group hover:border-brand-orange transition-all cursor-pointer"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <stat.icon size={22} />
            </div>
            <div className="flex items-center justify-between mb-1">
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
               <div className={`flex items-center gap-0.5 text-[9px] font-black ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stat.trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {stat.trend}
               </div>
            </div>
            <p className="text-2xl font-black text-brand-navy">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white pt-8 pb-4 px-8 rounded-[2.5rem] border border-gray-100 daraz-shadow">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">{t('Revenue Analytics', 'আয় বিশ্লেষণ')}</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-1">{t('Comparative performance over last 7 months', 'গত ৭ মাসের তুলনামূলক পারফরম্যান্স')}</p>
             </div>
             <div className="flex gap-2">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-brand-orange rounded-full" />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('Revenue', 'আয়')}</span>
                </div>
                <div className="flex items-center gap-2 ml-4">
                   <div className="w-2 h-2 bg-brand-navy rounded-full" />
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('Sales', 'বিক্রি')}</span>
                </div>
             </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F57224" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#F57224" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1A1' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1A1' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                    fontWeight: 800
                  }} 
                />
                <Area type="monotone" dataKey="revenue" stroke="#F57224" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="sales" stroke="#2D3142" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 daraz-shadow flex flex-col">
           <div className="mb-6">
              <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">{t('Store Health', 'স্টোরের অবস্থা')}</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1">{t('Current system status', 'বর্তমান সিস্টেমের অবস্থা')}</p>
           </div>
           <div className="space-y-4 flex-1">
              {[
                { label: t('Pending Deliveries', 'অপেক্ষমাণ ডেলিভারি'), value: pendingOrders, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50', view: 'orders' as const },
                { label: t('Stock Alerts', 'স্টক সতর্কতা'), value: lowStockCount, icon: Package, color: 'text-rose-500', bg: 'bg-rose-50', view: 'products' as const },
                { label: t('Unread Reviews', 'অপঠিত রিভিউ'), value: reviews.length, icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50', view: 'reviews' as const },
                { label: t('Support Tickets', 'সাপোর্ট টিকেট'), value: 8, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50', view: 'chat' as const },
              ].map((item) => (
                <div 
                  key={item.label} 
                  onClick={() => onNavigate(item.view)}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center`}>
                      <item.icon size={18} />
                    </div>
                    <span className="text-xs font-bold text-gray-700">{item.label}</span>
                  </div>
                  <span className="text-xs font-black text-brand-navy">{item.value}</span>
                </div>
              ))}
           </div>
           <div className="mt-8 pt-8 border-t border-gray-100">
              <div className="bg-brand-navy rounded-2xl p-4 text-white">
                 <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">{t('Merchant Level', 'মার্চেন্ট স্তর')}</p>
                 <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-tight">{t('Platinum Seller', 'প্ল্যাটিনাম বিক্রেতা')}</p>
                    <Star size={14} className="fill-brand-yellow text-brand-yellow" />
                 </div>
                 <div className="w-full h-1.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                    <div className="w-3/4 h-full bg-brand-orange" />
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
           <div>
              <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">{t('Recent Sales', 'সাম্প্রতিক বিক্রি')}</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1">{t('Global transaction stream', 'সর্বশেষ লেনদেন প্রবাহ')}</p>
           </div>
           <button 
             onClick={() => onNavigate('orders')}
             className="text-[10px] font-black text-brand-orange uppercase tracking-widest hover:underline cursor-pointer"
           >
             {t('View All Orders', 'সব অর্ডার দেখুন')}
           </button>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                 <tr>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Order ID', 'অর্ডার আইডি')}</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Customer', 'গ্রাহক')}</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Status', 'অবস্থা')}</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Method', 'মাধ্যম')}</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{t('Total', 'মোট')}</th>
                    <th className="px-8 py-4"></th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {orders.slice(0, 5).map((order) => (
                    <tr 
                      key={order.id} 
                      onClick={() => onNavigate('orders')}
                      className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    >
                       <td className="px-8 py-5 text-xs font-black text-brand-navy">#{order.id}</td>
                       <td className="px-8 py-5">
                          <div className="flex flex-col">
                             <span className="text-xs font-bold text-brand-navy">{order.address.fullName}</span>
                             <span className="text-[10px] text-gray-400">{order.address.email || t('No Email', 'ইমেইল নেই')}</span>
                          </div>
                       </td>
                       <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                            order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {getOrderStatusLabel(order.status)}
                          </span>
                       </td>
                       <td className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.paymentMethod}</td>
                       <td className="px-8 py-5 text-xs font-black text-brand-navy">৳{order.total.toLocaleString()}</td>
                       <td className="px-8 py-5 text-right font-black">
                          <div className="p-2 text-gray-300 hover:text-brand-orange transition-colors">
                             <TrendingUp size={16} />
                          </div>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};
