import React, { useState, useMemo } from 'react';
import { 
  FileText, Search, Clock, ShieldCheck, Download
} from 'lucide-react';
import { ActivityLogItem } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface AdminActivityLogProps {
  logs: ActivityLogItem[];
}

export const AdminActivityLog: React.FC<AdminActivityLogProps> = ({
  logs = []
}) => {
  const { language, t } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [adminUserFilter, setAdminUserFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'Approve': return t('Approve', 'অনুমোদন');
      case 'Reject': return t('Reject', 'প্রত্যাখ্যান');
      case 'Suspend': return t('Suspend', 'স্থগিত');
      case 'Activate': return t('Activate', 'সক্রিয়');
      case 'Trash': return t('Trash', 'ট্র্যাশ');
      case 'Restore': return t('Restore', 'পুনরুদ্ধার');
      case 'Delete': return t('Delete', 'মুছে ফেলা');
      case 'Edit': return t('Edit', 'সম্পাদনা');
      case 'Role_Change': return t('Role Change', 'ভূমিকা পরিবর্তন');
      case 'Status_Change': return t('Status Change', 'অবস্থা পরিবর্তন');
      case 'Create': return t('Create', 'তৈরি');
      default: return action;
    }
  };

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case 'Product': return t('Product', 'পণ্য');
      case 'Order': return t('Order', 'অর্ডার');
      case 'Merchant': return t('Merchant', 'মার্চেন্ট');
      case 'Customer': return t('Customer', 'গ্রাহক');
      case 'Coupon': return t('Coupon', 'কুপন');
      case 'Role': return t('Role', 'ভূমিকা');
      case 'Settings': return t('Settings', 'সেটিংস');
      default: return type;
    }
  };

  // Unique admins list for dropdown
  const uniqueAdmins = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach(l => {
      const email = l.adminEmail || t('Unknown', 'অজানা');
      const name = l.adminName || email.split('@')[0];
      if (!map.has(email)) {
        map.set(email, name);
      }
    });
    return Array.from(map.entries()).map(([email, name]) => ({ email, name }));
  }, [logs, t]);

  const filteredLogs = useMemo(() => {
    const now = Date.now();
    let minTime = 0;
    if (dateRangeFilter === 'today') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      minTime = d.getTime();
    } else if (dateRangeFilter === '7d') {
      minTime = now - 7 * 24 * 60 * 60 * 1000;
    } else if (dateRangeFilter === '30d') {
      minTime = now - 30 * 24 * 60 * 60 * 1000;
    }

    return logs.filter(log => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (adminUserFilter !== 'all' && log.adminEmail !== adminUserFilter) return false;
      if (minTime > 0) {
        const logTime = new Date(log.timestamp).getTime();
        if (logTime < minTime) return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (log.adminName || '').toLowerCase().includes(q) ||
          (log.adminEmail || '').toLowerCase().includes(q) ||
          (log.targetTitle || '').toLowerCase().includes(q) ||
          (log.targetType || '').toLowerCase().includes(q) ||
          (log.details || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, actionFilter, adminUserFilter, dateRangeFilter, searchTerm]);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'Approve':
      case 'Activate':
      case 'Restore':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
      case 'Reject':
      case 'Suspend':
      case 'Delete':
      case 'Trash':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/20';
      case 'Edit':
      case 'Role_Change':
      case 'Status_Change':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/20';
    }
  };

  const handleExportCSV = () => {
    const rows = [
      [
        t('Timestamp', 'সময়'),
        t('Admin Name', 'অ্যাডমিনের নাম'),
        t('Admin Email', 'অ্যাডমিন ইমেইল'),
        t('Action', 'কার্যক্রম'),
        t('Target Type', 'ধরন'),
        t('Target Title', 'শিরোনাম'),
        t('Details', 'বিস্তারিত')
      ],
      ...filteredLogs.map(l => [
        new Date(l.timestamp).toLocaleString(dateLocale),
        l.adminName,
        l.adminEmail,
        getActionLabel(l.action),
        getTargetTypeLabel(l.targetType),
        `"${(l.targetTitle || '').replace(/"/g, '""')}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`
      ])
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lsm_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/40 p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl text-brand-orange">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{t('Audit Trail & Activity Log', 'অডিট ট্রেইল ও কার্যকলাপ লগ')}</h2>
                <span className="px-2 py-0.5 bg-white/10 text-gray-300 text-[10px] font-bold uppercase rounded-md border border-white/10">
                  {t('Read-Only', 'শুধুমাত্র পাঠযোগ্য')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{t('Immutable record of administrative operations, security elevations, and status updates for accountability', 'জবাবদিহিতার জন্য প্রশাসনিক কার্যক্রম, নিরাপত্তা পরিবর্তন এবং স্ট্যাটাস আপডেটের অপরিবর্তনীয় রেকর্ড')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Download size={14} />
            <span>{t('Export Audit Log', 'অডিট লগ এক্সপোর্ট করুন')}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
          {/* Admin User Filter */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-xs text-gray-400">{t('Admin:', 'অ্যাডমিন:')}</span>
            <select
              value={adminUserFilter}
              onChange={e => setAdminUserFilter(e.target.value)}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#14141c]">{t('All Administrators', 'সকল অ্যাডমিন')}</option>
              {uniqueAdmins.map(a => (
                <option key={a.email} value={a.email} className="bg-[#14141c]">
                  {a.name} ({a.email})
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-xs text-gray-400">{t('Action:', 'কার্যক্রম:')}</span>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#14141c]">{t('All Actions', 'সকল কার্যক্রম')}</option>
              <option value="Approve" className="bg-[#14141c]">{t('Approve', 'অনুমোদন')}</option>
              <option value="Reject" className="bg-[#14141c]">{t('Reject', 'প্রত্যাখ্যান')}</option>
              <option value="Suspend" className="bg-[#14141c]">{t('Suspend', 'স্থগিত')}</option>
              <option value="Activate" className="bg-[#14141c]">{t('Activate', 'সক্রিয়')}</option>
              <option value="Trash" className="bg-[#14141c]">{t('Trash', 'ট্র্যাশ')}</option>
              <option value="Restore" className="bg-[#14141c]">{t('Restore', 'পুনরুদ্ধার')}</option>
              <option value="Delete" className="bg-[#14141c]">{t('Delete', 'মুছে ফেলা')}</option>
              <option value="Edit" className="bg-[#14141c]">{t('Edit', 'সম্পাদনা')}</option>
              <option value="Role_Change" className="bg-[#14141c]">{t('Role Change', 'ভূমিকা পরিবর্তন')}</option>
              <option value="Status_Change" className="bg-[#14141c]">{t('Status Change', 'অবস্থা পরিবর্তন')}</option>
              <option value="Create" className="bg-[#14141c]">{t('Create', 'তৈরি')}</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-xs text-gray-400">{t('Timeframe:', 'সময়কাল:')}</span>
            <select
              value={dateRangeFilter}
              onChange={e => setDateRangeFilter(e.target.value as any)}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#14141c]">{t('All Time', 'সব সময়')}</option>
              <option value="today" className="bg-[#14141c]">{t('Today Only', 'শুধু আজ')}</option>
              <option value="7d" className="bg-[#14141c]">{t('Last 7 Days', 'গত ৭ দিন')}</option>
              <option value="30d" className="bg-[#14141c]">{t('Last 30 Days', 'গত ৩০ দিন')}</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t('Search action, target or admin...', 'কার্যক্রম, লক্ষ্য বা অ্যাডমিন খুঁজুন...')}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-brand-orange"
          />
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-zinc-950/40 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {t(`Displaying ${filteredLogs.length} logged events`, `${filteredLogs.length}টি লগ করা ইভেন্ট দেখানো হচ্ছে`)}
          </span>
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t('Audit Sync Active', 'অডিট সিঙ্ক সক্রিয়')}
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-gray-500 flex items-center justify-center mx-auto mb-3">
              <FileText size={20} />
            </div>
            <p className="text-sm font-bold text-white mb-1">{t('No Activity Logs Found', 'কোনো কার্যকলাপ লগ পাওয়া যায়নি')}</p>
            <p className="text-xs text-gray-400">{t('Try adjusting your filters or search query', 'ফিল্টার বা অনুসন্ধান শব্দ পরিবর্তন করে দেখুন')}</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredLogs.map(log => {
              const formattedDate = new Date(log.timestamp).toLocaleDateString(dateLocale, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const formattedTime = new Date(log.timestamp).toLocaleTimeString(dateLocale, {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div 
                  key={log.id} 
                  className="p-4.5 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck size={16} className="text-brand-orange" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md border ${getActionBadgeColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                        <span className="px-1.5 py-0.5 bg-white/5 text-gray-300 text-[10px] font-bold rounded">
                          {getTargetTypeLabel(log.targetType)}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate max-w-sm sm:max-w-md">
                          {log.targetTitle}
                        </h4>
                      </div>

                      {log.details && (
                        <p className="text-xs text-gray-400 leading-relaxed">
                          {log.details}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-gray-500">
                        <span className="text-gray-300 font-medium">{t('By:', 'দ্বারা:')} {log.adminName} ({log.adminEmail})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-center shrink-0 text-right">
                    <div className="flex items-center gap-1.5 text-xs text-gray-300 font-mono font-medium">
                      <Clock size={12} className="text-gray-500" />
                      <span>{formattedTime}</span>
                    </div>
                    <span className="text-[11px] text-gray-500">{formattedDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

