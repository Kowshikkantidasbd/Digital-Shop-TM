import React, { useState } from 'react';
import { 
  ShieldCheck, Shield, Plus, Edit2, Trash2, 
  Check, X, Eye, AlertTriangle, Sparkles,
  Search, Lock, CheckCircle2,
  Package, ShoppingCart, Users, Store, MessageSquare, CreditCard,
  Zap, Sliders, History, Bell, BarChart2, LayoutDashboard
} from 'lucide-react';
import { User } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

export interface DelegatableSection {
  id: string;
  label: string;
  category: 'Overview' | 'Catalog' | 'Commerce' | 'Marketing' | 'Audience' | 'System';
  desc: string;
  iconName: string;
}

export const DELEGATABLE_SECTIONS: DelegatableSection[] = [
  { id: 'overview', label: 'Dashboard', category: 'Overview', desc: 'KPI metrics, revenue telemetry, store health', iconName: 'LayoutDashboard' },
  { id: 'analytics', label: 'Analytics & Reports', category: 'Overview', desc: 'Revenue breakdowns, order analytics, CSV exports', iconName: 'BarChart2' },
  { id: 'sellers', label: 'Merchants', category: 'Commerce', desc: 'Merchant stores, approval requests, verification', iconName: 'Store' },
  { id: 'products', label: 'Products', category: 'Catalog', desc: 'Product listings, approvals, stock & pricing', iconName: 'Package' },
  { id: 'orders', label: 'Orders', category: 'Commerce', desc: 'Order tracking, fulfillment stages, status management', iconName: 'ShoppingCart' },
  { id: 'users', label: 'Customers', category: 'Audience', desc: 'Registered user profiles, status, address books', iconName: 'Users' },
  { id: 'reviews', label: 'Reviews & Feedback', category: 'Audience', desc: 'Customer ratings, review moderation, replies', iconName: 'MessageSquare' },
  { id: 'coupons', label: 'Promotions', category: 'Marketing', desc: 'Discount vouchers, promo codes, rules', iconName: 'CreditCard' },
  { id: 'ads', label: 'Ads & Campaigns', category: 'Marketing', desc: 'Featured advertisements, campaign budgets', iconName: 'Sparkles' },
  { id: 'flash_sales', label: 'Flash Sales', category: 'Marketing', desc: 'Flash deal schedules, discounts, stock quotas', iconName: 'Zap' },
  { id: 'activity_log', label: 'Activity Log', category: 'System', desc: 'Chronological timeline of admin operations', iconName: 'History' },
  { id: 'notifications', label: 'Notifications', category: 'System', desc: 'System alerts and inventory reminders', iconName: 'Bell' },
  { id: 'settings', label: 'Store Settings', category: 'System', desc: 'Logistics rules, delivery fees, site identity', iconName: 'Sliders' },
  { id: 'trash', label: 'Trash', category: 'System', desc: 'Soft-deleted items and recovery', iconName: 'Trash2' },
];

const renderSectionIcon = (id: string, size = 14) => {
  switch (id) {
    case 'overview': return <LayoutDashboard size={size} />;
    case 'analytics': return <BarChart2 size={size} />;
    case 'sellers': return <Store size={size} />;
    case 'products': return <Package size={size} />;
    case 'orders': return <ShoppingCart size={size} />;
    case 'users': return <Users size={size} />;
    case 'reviews': return <MessageSquare size={size} />;
    case 'coupons': return <CreditCard size={size} />;
    case 'ads': return <Sparkles size={size} />;
    case 'flash_sales': return <Zap size={size} />;
    case 'activity_log': return <History size={size} />;
    case 'notifications': return <Bell size={size} />;
    case 'settings': return <Sliders size={size} />;
    case 'trash': return <Trash2 size={size} />;
    default: return <Package size={size} />;
  }
};

interface AdminRolesProps {
  users: User[];
  currentUserEmail?: string;
  onUpdateUserRole: (
    userId: string,
    data: {
      role: 'admin' | 'user';
      adminRoleId?: string;
      adminRoleName?: string;
      permissions?: string[];
      permissionsLevel?: Record<string, 'read' | 'full'>;
    }
  ) => Promise<void>;
  onCreateSiteAdmin?: (data: {
    name: string;
    email: string;
    permissions: string[];
    permissionsLevel: Record<string, 'read' | 'full'>;
  }) => Promise<void>;
  onRevokeAdmin?: (userId: string) => Promise<void>;
  onSimulateAdminView?: (email: string | null) => void;
  simulatedAdminEmail?: string | null;
}

export const AdminRoles: React.FC<AdminRolesProps> = ({
  users = [],
  currentUserEmail = '',
  onUpdateUserRole,
  onCreateSiteAdmin,
  onRevokeAdmin,
  onSimulateAdminView,
  simulatedAdminEmail
}) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super' | 'site'>('all');

  const getSectionText = (id: string, fallbackLabel: string, fallbackDesc: string) => {
    const map: Record<string, { label: string; desc: string }> = {
      overview: { label: t('Dashboard', 'ড্যাশবোর্ড'), desc: t('KPI metrics, revenue telemetry, store health', 'কেপিআই মেট্রিক্স, আয় টেলিমেট্রি, স্টোরের স্বাস্থ্য') },
      analytics: { label: t('Analytics & Reports', 'অ্যানালিটিক্স ও রিপোর্ট'), desc: t('Revenue breakdowns, order analytics, CSV exports', 'আয়ের বিবরণ, অর্ডার অ্যানালিটিক্স, CSV এক্সপোর্ট') },
      sellers: { label: t('Merchants', 'মার্চেন্ট'), desc: t('Merchant stores, approval requests, verification', 'মার্চেন্ট স্টোর, অনুমোদনের অনুরোধ, যাচাইকরণ') },
      products: { label: t('Products', 'পণ্য'), desc: t('Product listings, approvals, stock & pricing', 'পণ্য তালিকা, অনুমোদন, স্টক ও মূল্য') },
      orders: { label: t('Orders', 'অর্ডার'), desc: t('Order tracking, fulfillment stages, status management', 'অর্ডার ট্র্যাকিং, ডেলিভারি ধাপ, স্ট্যাটাস পরিচালনা') },
      users: { label: t('Customers', 'গ্রাহক'), desc: t('Registered user profiles, status, address books', 'নিবন্ধিত গ্রাহক প্রোফাইল, স্ট্যাটাস, ঠিকানা') },
      reviews: { label: t('Reviews & Feedback', 'রিভিউ ও মতামত'), desc: t('Customer ratings, review moderation, replies', 'গ্রাহক রেটিং, রিভিউ মডারেশন, উত্তর') },
      coupons: { label: t('Promotions', 'প্রোমোশন'), desc: t('Discount vouchers, promo codes, rules', 'ডিসকাউন্ট ভাউচার, প্রোমো কোড, নিয়মাবলি') },
      ads: { label: t('Ads & Campaigns', 'বিজ্ঞাপন ও ক্যাম্পেইন'), desc: t('Featured advertisements, campaign budgets', 'ফিচার্ড বিজ্ঞাপন, ক্যাম্পেইন বাজেট') },
      flash_sales: { label: t('Flash Sales', 'ফ্ল্যাশ সেল'), desc: t('Flash deal schedules, discounts, stock quotas', 'ফ্ল্যাশ ডিলের সময়সূচী, ছাড়, স্টক কোটা') },
      activity_log: { label: t('Activity Log', 'কার্যক্রম লগ'), desc: t('Chronological timeline of admin operations', 'অ্যাডমিন কার্যক্রমের কালানুক্রমিক তালিকা') },
      notifications: { label: t('Notifications', 'নোটিফিকেশন'), desc: t('System alerts and inventory reminders', 'সিস্টেম সতর্কতা ও ইনভেন্টরি রিমাইন্ডার') },
      settings: { label: t('Store Settings', 'স্টোর সেটিংস'), desc: t('Logistics rules, delivery fees, site identity', 'লজিস্টিকস নিয়ম, ডেলিভারি ফি, সাইটের পরিচয়') },
      trash: { label: t('Trash', 'ট্র্যাশ'), desc: t('Soft-deleted items and recovery', 'মুছে ফেলা আইটেম ও পুনরুদ্ধার') },
    };
    return map[id] || { label: fallbackLabel, desc: fallbackDesc };
  };
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [revokingAdmin, setRevokingAdmin] = useState<User | null>(null);

  // Form states for creating / editing
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['products', 'orders']);
  const [permissionsLevel, setPermissionsLevel] = useState<Record<string, 'read' | 'full'>>({
    products: 'full',
    orders: 'read'
  });
  const [selectedExistingUserId, setSelectedExistingUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter admin users
  const adminUsers = users.filter(u => u.role === 'admin' || u.adminRoleName === 'Super Administrator' || u.adminRoleName === 'Super Admin');
  
  // Non-admin users for promotion
  const customerUsers = users.filter(u => u.role !== 'admin');

  const filteredAdmins = adminUsers.filter(u => {
    const isSuper = u.adminRoleName === 'Super Admin' || u.adminRoleName === 'Super Administrator' || (u.permissions && u.permissions.includes('*'));
    if (roleFilter === 'super' && !isSuper) return false;
    if (roleFilter === 'site' && isSuper) return false;
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    setFormName('');
    setFormEmail('');
    setSelectedExistingUserId('');
    setSelectedPermissions(['products', 'orders']);
    setPermissionsLevel({ products: 'full', orders: 'read' });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (admin: User) => {
    setEditingAdmin(admin);
    setFormName(admin.name || '');
    setFormEmail(admin.email || '');
    const perms = admin.permissions || [];
    setSelectedPermissions(perms.filter(p => p !== '*' && p !== 'roles'));
    setPermissionsLevel(admin.permissionsLevel || {});
  };

  const handleTogglePermission = (sectionId: string) => {
    if (selectedPermissions.includes(sectionId)) {
      setSelectedPermissions(prev => prev.filter(id => id !== sectionId));
      setPermissionsLevel(prev => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });
    } else {
      setSelectedPermissions(prev => [...prev, sectionId]);
      setPermissionsLevel(prev => ({
        ...prev,
        [sectionId]: 'full'
      }));
    }
  };

  const handleSetLevel = (sectionId: string, level: 'read' | 'full', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedPermissions.includes(sectionId)) {
      setSelectedPermissions(prev => [...prev, sectionId]);
    }
    setPermissionsLevel(prev => ({
      ...prev,
      [sectionId]: level
    }));
  };

  // Preset handlers
  const applyPreset = (preset: 'all' | 'catalog' | 'support' | 'clear') => {
    if (preset === 'all') {
      const allIds = DELEGATABLE_SECTIONS.map(s => s.id);
      setSelectedPermissions(allIds);
      const levels: Record<string, 'read' | 'full'> = {};
      allIds.forEach(id => { levels[id] = 'full'; });
      setPermissionsLevel(levels);
    } else if (preset === 'catalog') {
      const catIds = ['products', 'flash_sales', 'trash'];
      setSelectedPermissions(catIds);
      setPermissionsLevel({ products: 'full', flash_sales: 'full', trash: 'full' });
    } else if (preset === 'support') {
      const supIds = ['orders', 'users', 'reviews'];
      setSelectedPermissions(supIds);
      setPermissionsLevel({ orders: 'read', users: 'read', reviews: 'full' });
    } else if (preset === 'clear') {
      setSelectedPermissions([]);
      setPermissionsLevel({});
    }
  };

  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) return;
    setIsSubmitting(true);

    try {
      if (editingAdmin) {
        // Edit existing Site Admin
        await onUpdateUserRole(editingAdmin.id, {
          role: 'admin',
          adminRoleId: 'site_admin',
          adminRoleName: 'Site Admin',
          permissions: selectedPermissions,
          permissionsLevel
        });
        setEditingAdmin(null);
      } else {
        // Create new Site Admin or promote customer
        if (onCreateSiteAdmin) {
          await onCreateSiteAdmin({
            name: formName.trim() || formEmail.split('@')[0],
            email: formEmail.trim().toLowerCase(),
            permissions: selectedPermissions,
            permissionsLevel
          });
        } else {
          // Fallback to onUpdateUserRole if customer exists
          const existing = users.find(u => u.email.toLowerCase() === formEmail.trim().toLowerCase());
          if (existing) {
            await onUpdateUserRole(existing.id, {
              role: 'admin',
              adminRoleId: 'site_admin',
              adminRoleName: 'Site Admin',
              permissions: selectedPermissions,
              permissionsLevel
            });
          }
        }
        setIsCreateModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokingAdmin) return;
    setIsSubmitting(true);
    try {
      if (onRevokeAdmin) {
        await onRevokeAdmin(revokingAdmin.id);
      } else {
        await onUpdateUserRole(revokingAdmin.id, {
          role: 'user',
          adminRoleId: undefined,
          adminRoleName: undefined,
          permissions: [],
          permissionsLevel: {}
        });
      }
      setRevokingAdmin(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 text-left pb-16">
      {/* Top Banner: Two-Tier Governance Header */}
      <div className="bg-gradient-to-r from-zinc-950/80 via-[#13111c] to-zinc-950/80 p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-brand-orange/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-orange/15 border border-brand-orange/30 text-brand-orange text-[10px] font-black uppercase tracking-widest rounded-full">
              <ShieldCheck size={13} />
              <span>{t('Two-Tier Admin Governance', 'দুই-স্তরের অ্যাডমিন গভর্ন্যান্স')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {t('Roles & Access Permissions', 'ভূমিকা ও অ্যাক্সেস অনুমতি')}
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-2xl leading-relaxed">
              {t('Define administrative hierarchy with absolute security separation.', 'সর্বোচ্চ নিরাপত্তা পৃথকীকরণসহ প্রশাসনিক স্তরবিন্যাস নির্ধারণ করুন।')}
              <strong className="text-white ml-1">{t('Super Admin', 'সুপার অ্যাডমিন')}</strong> {t('has unconstrained root access.', 'সম্পূর্ণ সীমাহীন রুট অ্যাক্সেস পান।')}
              <strong className="text-blue-400 ml-1">{t('Site Admins', 'সাইট অ্যাডমিনরা')}</strong> {t('can only view granted sections with zero visual clue of restricted modules.', 'শুধুমাত্র অনুমোদিত সেকশন দেখতে পারবেন; নিষিদ্ধ মডিউলগুলো সম্পূর্ণ গোপন থাকবে।')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {simulatedAdminEmail && onSimulateAdminView && (
              <button
                onClick={() => onSimulateAdminView(null)}
                className="px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
              >
                <Eye size={15} />
                <span>{t('Exit Simulation View', 'সিমুলেশন ভিউ বন্ধ করুন')}</span>
              </button>
            )}

            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-orange-500/25 active:scale-95"
            >
              <Plus size={16} />
              <span>{t('Invite / Create Site Admin', 'নতুন সাইট অ্যাডমিন তৈরি করুন')}</span>
            </button>
          </div>
        </div>

        {/* Roles Architecture Overview Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3.5">
            <div className="p-2.5 bg-brand-orange/20 border border-brand-orange/30 text-brand-orange rounded-xl shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">{t('Tier 1: Super Administrator', 'স্তর ১: সুপার অ্যাডমিনিস্ট্রেটর')}</h4>
                <span className="px-2 py-0.5 bg-brand-orange/15 text-brand-orange text-[9px] font-black uppercase rounded-md">{t('Root Level', 'রুট লেভেল')}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                {t('Exclusive authority over Roles & Permissions, financial settings, and master system controls. Never restricted.', 'ভূমিকা ও অনুমতি, আর্থিক সেটিংস এবং মাস্টার সিস্টেম কন্ট্রোলের পূর্ণ ক্ষমতা। কখনোই সীমাবদ্ধ নয়।')}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">{t('Tier 2: Site Administrator', 'স্তর ২: সাইট অ্যাডমিনিস্ট্রেটর')}</h4>
                <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 text-[9px] font-black uppercase rounded-md">{t('Permission-Based', 'অনুমতি-ভিত্তিক')}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1 leading-normal">
                {t('Restricted access governed strictly by Super Admin. Unauthorized sections are completely hidden. Supports Read-Only or Full Access per module.', 'সুপার অ্যাডমিনের অনুমতি দ্বারা নিয়ন্ত্রিত। অননুমোদিত সেকশন সম্পূর্ণ লুকানো থাকে। প্রতিটি মডিউলের জন্য শুধুমাত্র পাঠযোগ্য বা পূর্ণ অ্যাক্সেস সমর্থন করে।')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Roster List */}
      <div className="bg-zinc-950/50 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
        {/* Table Controls */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder={t('Search administrators by name or email...', 'নাম বা ইমেইল দিয়ে অ্যাডমিন খুঁজুন...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-brand-orange transition-colors"
              />
            </div>

            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('All', 'সব')} ({adminUsers.length})
              </button>
              <button
                onClick={() => setRoleFilter('super')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === 'super' ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('Super Admins', 'সুপার অ্যাডমিন')}
              </button>
              <button
                onClick={() => setRoleFilter('site')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  roleFilter === 'site' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t('Site Admins', 'সাইট অ্যাডমিন')}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-400 font-medium">
            {t('Showing', 'দেখানো হচ্ছে')} <strong className="text-white">{filteredAdmins.length}</strong> {t('active admin accounts', 'টি সক্রিয় অ্যাডমিন অ্যাকাউন্ট')}
          </div>
        </div>

        {/* List of Admin Accounts */}
        <div className="divide-y divide-white/5">
          {filteredAdmins.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs">
              {t('No administrator accounts matched your search criteria.', 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি।')}
            </div>
          ) : (
            filteredAdmins.map(admin => {
              const isSuper = admin.adminRoleName === 'Super Admin' || 
                              admin.adminRoleName === 'Super Administrator' || 
                              (admin.permissions && admin.permissions.includes('*'));
              
              const isCurrentUser = admin.email.toLowerCase() === (currentUserEmail || '').toLowerCase();
              const isSimulating = simulatedAdminEmail?.toLowerCase() === admin.email.toLowerCase();
              
              const grantedPerms = isSuper 
                ? DELEGATABLE_SECTIONS.map(s => s.id) 
                : (admin.permissions || []).filter(p => p !== 'roles');

              const levels = admin.permissionsLevel || {};

              return (
                <div 
                  key={admin.id || admin.email} 
                  className={`p-6 transition-all hover:bg-white/[0.02] flex flex-col xl:flex-row xl:items-center justify-between gap-6 ${
                    isSimulating ? 'bg-blue-950/20 border-l-4 border-blue-500' : ''
                  }`}
                >
                  {/* User Profile & Role Info */}
                  <div className="flex items-start gap-4 min-w-0 sm:min-w-[280px]">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border ${
                      isSuper 
                        ? 'bg-brand-orange/15 border-brand-orange/30 text-brand-orange shadow-lg shadow-orange-500/10' 
                        : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                    }`}>
                      {isSuper ? (
                        <ShieldCheck size={22} />
                      ) : (
                        <Shield size={22} />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-white">{admin.name || t('Admin', 'অ্যাডমিন')}</h3>
                        
                        {isSuper ? (
                          <span className="px-2 py-0.5 bg-brand-orange/20 border border-brand-orange/30 text-brand-orange text-[9px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                            <ShieldCheck size={11} />
                            {t('Super Admin', 'সুপার অ্যাডমিন')}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[9px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                            <Shield size={11} />
                            {t('Site Admin', 'সাইট অ্যাডমিন')}
                          </span>
                        )}

                        {isCurrentUser && (
                          <span className="px-2 py-0.5 bg-white/10 text-gray-300 text-[9px] font-bold uppercase rounded-md">
                            {t('Current Session', 'বর্তমান সেশন')}
                          </span>
                        )}

                        {isSimulating && (
                          <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black uppercase rounded-md animate-pulse">
                            {t('Active Simulation', 'সিমুলেশন চালু')}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-mono text-gray-300 mt-1">{admin.email}</p>
                      
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-2 font-mono">
                        <span>{t('Role Assigned:', 'নির্ধারিত ভূমিকা:')} {isSuper ? t('Super Administrator', 'সুপার অ্যাডমিনিস্ট্রেটর') : (admin.adminRoleName === 'Site Admin' ? t('Site Admin', 'সাইট অ্যাডমিন') : (admin.adminRoleName || t('Site Administrator', 'সাইট অ্যাডমিনিস্ট্রেটর')))}</span>
                        <span>•</span>
                        <span>{t('Active:', 'সক্রিয়:')} {admin.lastActive ? new Date(admin.lastActive).toLocaleDateString(dateLocale) : t('Recent', 'সাম্প্রতিক')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Granted Sections Visual Summary */}
                  <div className="flex-1 min-w-0 max-w-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Lock size={11} className="text-gray-500" />
                        {t('Granted Workspace Sections', 'অনুমোদিত ওয়ার্কস্পেস সেকশন')} ({isSuper ? t('All 15', 'সবগুলো ১৫টি') : `${grantedPerms.length} / ${DELEGATABLE_SECTIONS.length}`}):
                      </span>
                    </div>

                    {isSuper ? (
                      <div className="p-2.5 rounded-xl bg-brand-orange/5 border border-brand-orange/20 flex items-center gap-2 text-xs text-brand-orange font-bold">
                        <Sparkles size={14} />
                        <span>{t('Full Unrestricted Root Access (All Admin Sections & Settings)', 'সম্পূর্ণ সীমাহীন রুট অ্যাক্সেস (সব অ্যাডমিন সেকশন ও সেটিংস)')}</span>
                      </div>
                    ) : grantedPerms.length === 0 ? (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 font-bold flex items-center gap-2">
                        <AlertTriangle size={14} />
                        <span>{t('No sections granted. This Site Admin cannot access the dashboard until permissions are configured.', 'কোনো সেকশনের অনুমতি দেওয়া হয়নি। অনুমতি কনফিগার না করা পর্যন্ত এই সাইট অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করতে পারবেন না।')}</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {grantedPerms.map(secId => {
                          const secInfo = DELEGATABLE_SECTIONS.find(s => s.id === secId);
                          const secMeta = getSectionText(secId, secInfo?.label || secId, secInfo?.desc || '');
                          const level = levels[secId] || 'full';
                          const isReadOnly = level === 'read';

                          return (
                            <span
                              key={secId}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                                isReadOnly
                                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                              }`}
                            >
                              {renderSectionIcon(secId, 12)}
                              <span>{secMeta.label}</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-black uppercase tracking-tighter ${
                                isReadOnly ? 'bg-amber-500/20 text-amber-200' : 'bg-emerald-500/20 text-emerald-200'
                              }`}>
                                {isReadOnly ? t('Read', 'পাঠযোগ্য') : t('Full', 'পূর্ণ')}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center gap-2 shrink-0 justify-end pt-2 xl:pt-0 border-t xl:border-t-0 border-white/5">
                    {isSuper ? (
                      <span className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 text-xs font-mono">
                        {t('Protected Root Account', 'সুরক্ষিত রুট অ্যাকাউন্ট')}
                      </span>
                    ) : (
                      <>
                        {onSimulateAdminView && (
                          <button
                            onClick={() => onSimulateAdminView(isSimulating ? null : admin.email)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSimulating
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                                : 'bg-white/5 hover:bg-white/10 text-blue-400 border-white/10'
                            }`}
                            title={t("Preview admin panel through this Site Admin's exact permissions", 'এই সাইট অ্যাডমিনের অনুমতি অনুযায়ী অ্যাডমিন প্যানেল প্রিভিউ করুন')}
                          >
                            <Eye size={13} />
                            <span>{isSimulating ? t('Active', 'সক্রিয়') : t('Test View', 'টেস্ট ভিউ')}</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEditModal(admin)}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit2 size={13} className="text-gray-400" />
                          <span>{t('Edit Access', 'অ্যাক্সেস সম্পাদনা')}</span>
                        </button>

                        <button
                          onClick={() => setRevokingAdmin(admin)}
                          className="p-2 bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded-xl text-xs transition-all cursor-pointer"
                          title={t('Revoke admin access (demote to regular user)', 'অ্যাডমিন অ্যাক্সেস বাতিল করুন (সাধারণ ব্যবহারকারী করুন)')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: Create / Edit Site Admin */}
      {(isCreateModalOpen || editingAdmin) && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#12121a] border border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    {editingAdmin ? `${t('Edit Permissions:', 'অনুমতি সম্পাদনা:')} ${editingAdmin.name || editingAdmin.email}` : t('Invite / Create Site Admin', 'নতুন সাইট অ্যাডমিন তৈরি করুন')}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t('Configure restricted view boundaries and Read-Only vs Full Access privileges', 'সীমিত ভিউ সীমানা এবং শুধুমাত্র পাঠযোগ্য বনাম পূর্ণ অ্যাক্সেস সুবিধা কনফিগার করুন')}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingAdmin(null);
                }}
                className="p-2 text-gray-400 hover:text-white rounded-xl bg-white/5 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="space-y-6">
              {/* If creating new, optionally pick an existing registered customer */}
              {!editingAdmin && customerUsers.length > 0 && (
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                    {t('Quick Select Existing Registered Customer', 'বিদ্যমান নিবন্ধিত গ্রাহক থেকে নির্বাচন করুন')}
                  </label>
                  <select
                    value={selectedExistingUserId}
                    onChange={e => {
                      const uId = e.target.value;
                      setSelectedExistingUserId(uId);
                      const target = customerUsers.find(u => u.id === uId);
                      if (target) {
                        setFormName(target.name || '');
                        setFormEmail(target.email || '');
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-brand-orange"
                  >
                    <option value="">{t('-- Or enter new admin details below --', '-- অথবা নিচে নতুন অ্যাডমিনের তথ্য দিন --')}</option>
                    {customerUsers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name || t('User', 'ব্যবহারকারী')} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Admin Identity Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                    {t('Administrator Full Name', 'অ্যাডমিনের পূর্ণ নাম')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('e.g. Sarah Rahman', 'যেমন: সারা রহমান')}
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-brand-orange transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                    {t('Admin Email Address (Login ID)', 'অ্যাডমিন ইমেইল ঠিকানা (লগইন আইডি)')}
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingAdmin}
                    placeholder="e.g. admin@digitalshop.com"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-brand-orange transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Role Type Indicator */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-xs text-blue-300 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Shield size={16} />
                  <span>{t('Assigning Role:', 'নির্ধারিত ভূমিকা:')} <strong>{t('Site Administrator (Second-Tier)', 'সাইট অ্যাডমিনিস্ট্রেটর (দ্বিতীয় স্তর)')}</strong></span>
                </div>
                <span className="text-[10px] text-blue-300/80 font-mono">
                  {t('Roles & Permissions is permanently locked', 'ভূমিকা ও অনুমতি স্থায়ীভাবে লক থাকবে')}
                </span>
              </div>

              {/* Section Access Checklist */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <span>{t('Module Access & Permissions Checklist', 'মডিউল অ্যাক্সেস ও অনুমতি তালিকা')}</span>
                      <span className="px-2 py-0.5 bg-brand-orange/20 text-brand-orange text-[10px] font-bold rounded-md">
                        {selectedPermissions.length} / {DELEGATABLE_SECTIONS.length} {t('Granted', 'অনুমোদিত')}
                      </span>
                    </label>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {t("Unchecked sections will be completely hidden from this admin's sidebar and blocked from direct navigation.", 'অনির্বাচিত সেকশনগুলো এই অ্যাডমিনের সাইডবার থেকে সম্পূর্ণ লুকানো ও ব্লক থাকবে।')}
                    </p>
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <span className="text-[10px] text-gray-500 font-bold uppercase mr-1">{t('Presets:', 'প্রিসেট:')}</span>
                    <button
                      type="button"
                      onClick={() => applyPreset('all')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {t('All Full', 'সব পূর্ণ')}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('catalog')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {t('Catalog', 'ক্যাটালগ')}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('support')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {t('Fulfillment', 'ডেলিভারি ও সাপোর্ট')}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('clear')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {t('Clear', 'মুছুন')}
                    </button>
                  </div>
                </div>

                {/* Modules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {DELEGATABLE_SECTIONS.map(sec => {
                    const isGranted = selectedPermissions.includes(sec.id);
                    const currentLevel = permissionsLevel[sec.id] || 'full';
                    const secMeta = getSectionText(sec.id, sec.label, sec.desc);

                    return (
                      <div
                        key={sec.id}
                        onClick={() => handleTogglePermission(sec.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          isGranted
                            ? 'bg-blue-950/30 border-blue-500/40 text-white shadow-md'
                            : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <div className={`p-2 rounded-xl border mt-0.5 ${
                              isGranted 
                                ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                                : 'bg-white/5 border-white/10 text-gray-500'
                            }`}>
                              {renderSectionIcon(sec.id, 14)}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-black">{secMeta.label}</p>
                              </div>
                              <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{secMeta.desc}</p>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                            isGranted 
                              ? 'bg-blue-500 border-blue-500 text-white' 
                              : 'border-white/20 bg-black/20'
                          }`}>
                            {isGranted && <Check size={13} />}
                          </div>
                        </div>

                        {/* Granular Level Toggle (Read-Only vs Full Access) */}
                        {isGranted && (
                          <div 
                            onClick={e => e.stopPropagation()} 
                            className="pt-2 border-t border-white/10 flex items-center justify-between gap-2"
                          >
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{t('Access Privilege:', 'অ্যাক্সেস মাত্রা:')}</span>
                            <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10">
                              <button
                                type="button"
                                onClick={(e) => handleSetLevel(sec.id, 'read', e)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                                  currentLevel === 'read'
                                    ? 'bg-amber-500 text-white shadow'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                <Eye size={10} />
                                <span>{t('Read-Only', 'পাঠযোগ্য')}</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleSetLevel(sec.id, 'full', e)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${
                                  currentLevel === 'full'
                                    ? 'bg-emerald-500 text-white shadow'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                <CheckCircle2 size={10} />
                                <span>{t('Full Access', 'পূর্ণ অ্যাক্সেস')}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingAdmin(null);
                  }}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  {t('Cancel', 'বাতিল')}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-500/25 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? t('Saving...', 'সংরক্ষণ হচ্ছে...') : editingAdmin ? t('Apply Updated Permissions', 'আপডেট করা অনুমতি সংরক্ষণ করুন') : t('Create Site Admin', 'সাইট অ্যাডমিন তৈরি করুন')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Revoke Admin Confirmation */}
      {revokingAdmin && (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#14141c] border border-rose-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-left">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">{t('Revoke Admin Access?', 'অ্যাডমিন অ্যাক্সেস বাতিল করবেন?')}</h3>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                {t('You are removing administrative authority from', 'আপনি প্রশাসনিক ক্ষমতা সরিয়ে নিচ্ছেন:')} <strong className="text-white">{revokingAdmin.name || revokingAdmin.email}</strong>
              </p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                {t('This account will be immediately demoted to a regular customer account and will no longer have access to any section of this admin panel.', 'এই অ্যাকাউন্টটি তাৎক্ষণিকভাবে সাধারণ গ্রাহক অ্যাকাউন্টে পরিণত হবে এবং অ্যাডমিন প্যানেলের কোনো সেকশনে আর প্রবেশ করতে পারবে না।')}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setRevokingAdmin(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {t('Cancel', 'বাতিল')}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmRevoke}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-rose-600/20"
              >
                {isSubmitting ? t('Revoking...', 'বাতিল হচ্ছে...') : t('Yes, Revoke Access', 'হ্যাঁ, অ্যাক্সেস বাতিল করুন')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
