import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, CheckCircle2, XCircle, Clock, PackageCheck, 
  DollarSign, Search, Filter, Eye, AlertCircle, FileText, 
  ExternalLink, ChevronRight, MessageSquare, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReturnRequest } from '../../types';
import { adminApi } from '../../services/api';
import { useToast } from '../Toast';
import { FilterTabGroup } from '../FilterControls';
import { useLanguage } from '../../contexts/LanguageContext';

export const AdminReturnsManagement: React.FC = () => {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'requested' | 'approved' | 'item_received' | 'refunded' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Inspection / Action modal
  const [activeReturn, setActiveReturn] = useState<ReturnRequest | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getReturns();
      setReturns(data || []);
    } catch (e) {
      console.error('Failed to load returns:', e);
      showToast(t('Could not fetch return requests', 'রিটার্ন অনুরোধ লোড করা যায়নি'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status: ReturnRequest['status']) => {
    switch (status) {
      case 'requested': return t('Requested', 'অনুরোধকৃত');
      case 'approved': return t('Approved', 'অনুমোদিত');
      case 'item_received': return t('Item Received', 'পণ্য প্রাপ্ত');
      case 'refunded': return t('Refunded', 'রিফান্ড সম্পন্ন');
      case 'rejected': return t('Rejected', 'প্রত্যাখ্যাত');
      default: return status;
    }
  };

  const handleUpdateReturnStatus = async (id: string, newStatus: ReturnRequest['status']) => {
    setIsUpdatingStatus(true);
    try {
      const updated = await adminApi.updateReturn(id, {
        status: newStatus,
        adminNote: adminNoteInput.trim() || activeReturn?.adminNote
      });
      setReturns(prev => prev.map(r => r.id === id ? updated : r));
      if (activeReturn?.id === id) {
        setActiveReturn(updated);
      }
      showToast(`${t('Return request updated to', 'রিটার্ন অনুরোধের স্ট্যাটাস আপডেট হয়েছে:')} ${getStatusLabel(newStatus)}`, 'success');
    } catch (e) {
      showToast(t('Failed to update return request', 'রিটার্ন অনুরোধ আপডেট করতে ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Stats calculation
  const totalCount = returns.length;
  const pendingCount = returns.filter(r => r.status === 'requested').length;
  const approvedCount = returns.filter(r => r.status === 'approved' || r.status === 'item_received').length;
  const totalRefundAmount = returns
    .filter(r => r.status === 'refunded')
    .reduce((sum, r) => sum + (r.refundAmount || 0), 0);

  const filteredReturns = returns.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.orderId.toLowerCase().includes(term) ||
      r.customerName.toLowerCase().includes(term) ||
      (r.customerEmail || '').toLowerCase().includes(term) ||
      r.productName.toLowerCase().includes(term) ||
      r.reason.toLowerCase().includes(term)
    );
  });

  const getStageColor = (status: ReturnRequest['status']) => {
    switch (status) {
      case 'requested': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'approved': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'item_received': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'refunded': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'rejected': return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default: return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <RotateCcw className="text-brand-orange" size={24} /> {t('Returns & Refunds Management', 'রিটার্ন ও রিফান্ড ব্যবস্থাপনা')}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {t('Audit customer return claims, inspect proof attachments, and process reimbursement stages', 'গ্রাহকের রিটার্ন দাবি যাচাই, প্রমাণপত্র পরীক্ষা এবং রিফান্ড প্রক্রিয়া পরিচালনা করুন')}
          </p>
        </div>
        <button
          type="button"
          onClick={loadReturns}
          className="self-start sm:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
        >
          <RotateCcw size={14} /> {t('Refresh Requests', 'তালিকা রিফ্রেশ করুন')}
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:border-white/20 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Total Return Requests', 'মোট রিটার্ন অনুরোধ')}</span>
            <div className="p-2 bg-white/10 rounded-xl text-white"><FileText size={16} /></div>
          </div>
          <p className="text-2xl font-black text-white">{totalCount}</p>
          <span className="text-[10px] text-gray-500 mt-1 block">{t('Lifetime submissions', 'সর্বমোট দাখিলকৃত')}</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:border-amber-500/30 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{t('Pending Review', 'পর্যালোচনা অপেক্ষমাণ')}</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400"><Clock size={16} /></div>
          </div>
          <p className="text-2xl font-black text-amber-400">{pendingCount}</p>
          <span className="text-[10px] text-gray-500 mt-1 block">{t('Requires admin action', 'অ্যাডমিনের পদক্ষেপ প্রয়োজন')}</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:border-blue-500/30 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">{t('Approved & In Transit', 'অনুমোদিত ও পথে')}</span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><PackageCheck size={16} /></div>
          </div>
          <p className="text-2xl font-black text-blue-400">{approvedCount}</p>
          <span className="text-[10px] text-gray-500 mt-1 block">{t('Awaiting item receipt', 'পণ্য প্রাপ্তির অপেক্ষায়')}</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl hover:border-emerald-500/30 transition-all">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{t('Refund Amount Total', 'মোট রিফান্ড পরিমাণ')}</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><DollarSign size={16} /></div>
          </div>
          <p className="text-2xl font-black text-emerald-400">৳{totalRefundAmount.toLocaleString(dateLocale)}</p>
          <span className="text-[10px] text-gray-500 mt-1 block">{t('Successfully disbursed', 'সফলভাবে পরিশোধিত')}</span>
        </div>
      </div>

      {/* Filter Toolbar & Search */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('Search by order #, customer, product...', 'অর্ডার #, গ্রাহক বা পণ্য দিয়ে খুঁজুন...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl h-10 pl-10 pr-4 text-xs font-medium text-white placeholder-gray-400 outline-none focus:border-brand-orange"
          />
        </div>

        <FilterTabGroup
          tabs={[
            { id: 'all', label: t('All', 'সব'), count: returns.length, badgeVariant: 'grey' },
            { id: 'requested', label: t('Requested', 'অনুরোধকৃত'), count: pendingCount, badgeVariant: 'amber' },
            { id: 'approved', label: t('Approved', 'অনুমোদিত'), count: returns.filter(r => r.status === 'approved').length, badgeVariant: 'blue' },
            { id: 'item_received', label: t('Item Received', 'পণ্য প্রাপ্ত'), count: returns.filter(r => r.status === 'item_received').length, badgeVariant: 'purple' },
            { id: 'refunded', label: t('Refunded', 'রিফান্ড সম্পন্ন'), count: returns.filter(r => r.status === 'refunded').length, badgeVariant: 'green' },
            { id: 'rejected', label: t('Rejected', 'প্রত্যাখ্যাত'), count: returns.filter(r => r.status === 'rejected').length, badgeVariant: 'rose' },
          ]}
          activeTab={statusFilter}
          onChange={(id) => setStatusFilter(id as any)}
          ariaLabel={t('Filter return claims by stage', 'ধাপ অনুযায়ী রিটার্ন দাবি ফিল্টার করুন')}
        />
      </div>

      {/* Returns List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white/5 border border-white/10 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredReturns.length === 0 ? (
        <div className="py-20 text-center bg-white/5 rounded-3xl border border-dashed border-white/10 p-6">
          <RotateCcw className="mx-auto text-gray-500 mb-3" size={36} />
          <p className="text-sm font-bold text-white mb-1">{t('No return requests found', 'কোনো রিটার্ন অনুরোধ পাওয়া যায়নি')}</p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchTerm ? `${t('No requests matching', 'কোনো অনুরোধ পাওয়া যায়নি:')} "${searchTerm}"` : t('All customer return requests and claim histories will appear here.', 'সব গ্রাহকের রিটার্ন অনুরোধ এবং দাবির ইতিহাস এখানে দেখা যাবে।')}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredReturns.map((item) => (
            <div
              key={item.id}
              className="bg-white/5 border border-white/10 hover:border-white/20 p-5 rounded-3xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-4 min-w-0">
                {item.productImage && (
                  <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 overflow-hidden shrink-0">
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-brand-orange bg-brand-orange/10 px-2.5 py-0.5 rounded-lg border border-brand-orange/20">
                      #{item.orderId}
                    </span>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStageColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(item.requestedDate).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white mt-1 truncate max-w-md">{item.productName}</h4>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    <strong className="text-gray-300">{t('Customer:', 'গ্রাহক:')}</strong> {item.customerName} {item.customerPhone ? `(${item.customerPhone})` : ''} &bull; <span className="text-gray-300">{t('Reason:', 'কারণ:')}</span> {item.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">{t('Claim Amount', 'দাবিকৃত পরিমাণ')}</span>
                  <span className="text-base font-black text-white font-mono">৳{item.refundAmount.toLocaleString(dateLocale)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveReturn(item);
                    setAdminNoteInput(item.adminNote || '');
                  }}
                  className="px-4 py-2.5 bg-brand-orange hover:bg-orange-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-500/20 active:scale-95"
                >
                  <Eye size={13} /> {t('Manage Claim', 'দাবি পরিচালনা')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Detail & Status Management Modal */}
      <AnimatePresence>
        {activeReturn && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveReturn(null)}
              className="fixed inset-0 bg-[#07070b]/90 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-2xl bg-[#14141c] border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl z-10 text-left my-auto space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-orange/20 border border-brand-orange/30 text-brand-orange flex items-center justify-center">
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">{t('Return Claim', 'রিটার্ন দাবি')} #{activeReturn.id}</h3>
                    <p className="text-xs text-gray-400 font-mono">{t('Associated Order:', 'সংশ্লিষ্ট অর্ডার:')} #{activeReturn.orderId}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveReturn(null)}
                  className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Progression Bar */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">{t('Return Stage Workflow', 'রিটার্ন প্রক্রিয়ার ধাপ')}</span>
                <div className="flex items-center justify-between text-xs font-bold gap-2 overflow-x-auto pb-1">
                  {(['requested', 'approved', 'item_received', 'refunded'] as const).map((step, idx) => {
                    const stepLabels: Record<string, string> = {
                      requested: t('1. Requested', '১. অনুরোধকৃত'),
                      approved: t('2. Approved', '২. অনুমোদিত'),
                      item_received: t('3. Item Received', '৩. পণ্য প্রাপ্ত'),
                      refunded: t('4. Refunded', '৪. রিফান্ড সম্পন্ন')
                    };
                    const isDone = 
                      (activeReturn.status === 'refunded') ||
                      (activeReturn.status === 'item_received' && idx <= 2) ||
                      (activeReturn.status === 'approved' && idx <= 1) ||
                      (activeReturn.status === 'requested' && idx === 0);

                    return (
                      <div key={step} className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold ${
                          isDone ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-gray-500 border border-white/5'
                        }`}>
                          {stepLabels[step]}
                        </span>
                        {idx < 3 && <ChevronRight size={12} className="text-gray-600" />}
                      </div>
                    );
                  })}
                  {activeReturn.status === 'rejected' && (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      {t('Claim Rejected', 'দাবি প্রত্যাখ্যাত')}
                    </span>
                  )}
                </div>
              </div>

              {/* Claim Details */}
              <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/5 text-xs text-gray-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">{t('Product:', 'পণ্য:')}</span>
                  <span className="text-white font-bold">{activeReturn.productName}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">{t('Customer Name:', 'গ্রাহকের নাম:')}</span>
                  <span className="text-white font-medium">{activeReturn.customerName}</span>
                </div>
                {activeReturn.customerEmail && (
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">{t('Customer Email:', 'গ্রাহকের ইমেইল:')}</span>
                    <span className="text-white font-mono">{activeReturn.customerEmail}</span>
                  </div>
                )}
                {activeReturn.customerPhone && (
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">{t('Phone:', 'ফোন:')}</span>
                    <span className="text-white font-mono">{activeReturn.customerPhone}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">{t('Refund Claim Amount:', 'দাবিকৃত রিফান্ড:')}</span>
                  <span className="text-brand-orange font-mono font-black">৳{activeReturn.refundAmount.toLocaleString(dateLocale)}</span>
                </div>
                <div className="pt-1">
                  <span className="text-gray-400 block mb-1 font-bold">{t('Reason for Return:', 'রিটার্নের কারণ:')}</span>
                  <p className="text-gray-200 bg-white/5 p-3 rounded-xl border border-white/5 leading-relaxed">
                    {activeReturn.reason}
                  </p>
                </div>
              </div>

              {/* Customer Photos if attached */}
              {activeReturn.photos && activeReturn.photos.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-gray-300 block mb-2">{t('Customer Proof Photos', 'গ্রাহকের প্রমাণ ছবি')} ({activeReturn.photos.length})</span>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {activeReturn.photos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-2xl overflow-hidden border border-white/10 hover:border-brand-orange transition-all shrink-0">
                        <img src={url} alt={`${t('Proof', 'প্রমাণ')} ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Note Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-brand-orange" />
                  {t('Admin Operational Note (Visible in claim audit log)', 'অ্যাডমিন নোট (অডিট লগে দৃশ্যমান)')}
                </label>
                <textarea
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder={t('e.g. Courier tracking # arranged via Steadfast, inspection passed in Gulshan hub...', 'যেমন: স্টেডফাস্ট কুরিয়ারের মাধ্যমে রিটার্ন সংগ্রহ করা হয়েছে, গুলশান হাবে পরিদর্শন সম্পন্ন...')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-orange min-h-[70px]"
                />
              </div>

              {/* Quick Action Stage Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10 flex-wrap">
                <button
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleUpdateReturnStatus(activeReturn.id, 'rejected')}
                  className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle size={14} /> {t('Reject Claim', 'দাবি প্রত্যাখ্যান করুন')}
                </button>

                <div className="flex items-center gap-2 flex-wrap ml-auto">
                  {activeReturn.status === 'requested' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateReturnStatus(activeReturn.id, 'approved')}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                    >
                      <CheckCircle2 size={14} /> {t('Approve Return', 'রিটার্ন অনুমোদন করুন')}
                    </button>
                  )}

                  {activeReturn.status === 'approved' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateReturnStatus(activeReturn.id, 'item_received')}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
                    >
                      <PackageCheck size={14} /> {t('Mark Item Received', 'পণ্য প্রাপ্ত চিহ্নিত করুন')}
                    </button>
                  )}

                  {activeReturn.status === 'item_received' && (
                    <button
                      type="button"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateReturnStatus(activeReturn.id, 'refunded')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                    >
                      <DollarSign size={14} /> {t('Disburse Refund', 'রিফান্ড প্রদান করুন')} (৳{activeReturn.refundAmount.toLocaleString(dateLocale)})
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
