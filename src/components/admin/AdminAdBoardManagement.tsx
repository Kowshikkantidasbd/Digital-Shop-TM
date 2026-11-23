import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Plus, Image, ExternalLink, Calendar, Trash2, Edit2, 
  Eye, CheckCircle2, Clock, Ban, Search, Check, X, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdBoard } from '../../types';
import { adBoardApi } from '../../services/api';
import { useToast } from '../Toast';
import { useLanguage } from '../../contexts/LanguageContext';

const PLACEMENT_OPTIONS: { id: AdBoard['placement']; label: string; description: string }[] = [
  { id: 'homepage_billboard', label: 'Homepage Billboard', description: 'Top hero spotlight carousel slot' },
  { id: 'category_banner', label: 'Category Banner', description: 'Header strip on collection and category pages' },
  { id: 'sidebar_ad', label: 'Sidebar Ad Box', description: 'Vertical column promo on desktop layouts' },
  { id: 'popup_modal', label: 'Popup Promotional Modal', description: 'Lightweight welcome / flash offer overlay' },
  { id: 'footer_strip', label: 'Footer Strip Banner', description: 'Full-width banner directly above storefront footer' },
];

export const AdminAdBoardManagement: React.FC = () => {
  const { showToast } = useToast();
  const { t } = useLanguage();

  const getPlacementInfo = (id: AdBoard['placement']) => {
    switch (id) {
      case 'homepage_billboard': return { short: t('Homepage', 'হোমপেজ'), label: t('Homepage Billboard', 'হোমপেজ বিলবোর্ড') };
      case 'category_banner': return { short: t('Category', 'ক্যাটাগরি'), label: t('Category Banner', 'ক্যাটাগরি ব্যানার') };
      case 'sidebar_ad': return { short: t('Sidebar', 'সাইডবার'), label: t('Sidebar Ad Box', 'সাইডবার বিজ্ঞাপন বক্স') };
      case 'popup_modal': return { short: t('Popup', 'পপআপ'), label: t('Popup Promotional Modal', 'পপআপ প্রোমোশনাল মোডাল') };
      case 'footer_strip': return { short: t('Footer', 'ফুটার'), label: t('Footer Strip Banner', 'ফুটার স্ট্রিপ ব্যানার') };
      default: return { short: id, label: id };
    }
  };

  const getStatusText = (status: AdBoard['status']) => {
    switch (status) {
      case 'active': return t('Active', 'সক্রিয়');
      case 'scheduled': return t('Scheduled', 'নির্ধারিত');
      case 'paused': return t('Paused', 'বিরতি');
      case 'expired': return t('Expired', 'মেয়াদোত্তীর্ণ');
      default: return status;
    }
  };
  const [adBoards, setAdBoards] = useState<AdBoard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePlacementFilter, setActivePlacementFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAdBoard, setEditingAdBoard] = useState<AdBoard | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formTargetUrl, setFormTargetUrl] = useState('/');
  const [formPlacement, setFormPlacement] = useState<AdBoard['placement']>('homepage_billboard');
  const [formStatus, setFormStatus] = useState<AdBoard['status']>('active');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

  // Delete confirmation
  const [deletingBoard, setDeletingBoard] = useState<AdBoard | null>(null);

  useEffect(() => {
    loadAdBoards();
  }, []);

  const loadAdBoards = async () => {
    setIsLoading(true);
    try {
      const data = await adBoardApi.getAdBoards();
      setAdBoards(data || []);
    } catch (e) {
      console.error('Failed to load ad boards:', e);
      showToast(t('Could not load ad boards', 'বিজ্ঞাপন বোর্ড লোড করা যায়নি'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAdBoard(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormImage('');
    setFormTargetUrl('/');
    setFormPlacement('homepage_billboard');
    setFormStatus('active');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (board: AdBoard) => {
    setEditingAdBoard(board);
    setFormTitle(board.title);
    setFormSubtitle(board.subtitle || '');
    setFormImage(board.image);
    setFormTargetUrl(board.targetUrl || '/');
    setFormPlacement(board.placement);
    setFormStatus(board.status);
    setFormStartDate(board.startDate || '');
    setFormEndDate(board.endDate || '');
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formImage.trim()) {
      showToast(t('Title and Image URL are required', 'শিরোনাম এবং ছবির লিংক আবশ্যক'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<AdBoard, 'id'> = {
        title: formTitle.trim(),
        subtitle: formSubtitle.trim() || undefined,
        image: formImage.trim(),
        targetUrl: formTargetUrl.trim() || '/',
        placement: formPlacement,
        status: formStatus,
        startDate: formStartDate || undefined,
        endDate: formEndDate || undefined,
      };

      if (editingAdBoard) {
        const updated = await adBoardApi.updateAdBoard(editingAdBoard.id, payload);
        setAdBoards(prev => prev.map(b => b.id === editingAdBoard.id ? updated : b));
        showToast(`${t('Ad Board', 'বিজ্ঞাপন বোর্ড')} "${formTitle}" ${t('updated', 'আপডেট হয়েছে')}`, 'success');
      } else {
        const created = await adBoardApi.createAdBoard(payload);
        setAdBoards(prev => [created, ...prev]);
        showToast(`${t('New Ad Board', 'নতুন বিজ্ঞাপন বোর্ড')} "${formTitle}" ${t('published', 'প্রকাশিত হয়েছে')}`, 'success');
      }
      setIsModalOpen(false);
    } catch (e) {
      showToast(t('Failed to save ad board', 'বিজ্ঞাপন বোর্ড সংরক্ষণ করতে ব্যর্থ হয়েছে'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBoard) return;
    try {
      await adBoardApi.deleteAdBoard(deletingBoard.id);
      setAdBoards(prev => prev.filter(b => b.id !== deletingBoard.id));
      showToast(`${t('Ad Board', 'বিজ্ঞাপন বোর্ড')} "${deletingBoard.title}" ${t('deleted', 'মুছে ফেলা হয়েছে')}`, 'success');
      setDeletingBoard(null);
    } catch (e) {
      showToast(t('Failed to delete ad board', 'বিজ্ঞাপন বোর্ড মুছে ফেলতে ব্যর্থ হয়েছে'), 'error');
    }
  };

  const handleToggleStatus = async (board: AdBoard) => {
    const nextStatus: AdBoard['status'] = board.status === 'active' ? 'paused' : 'active';
    try {
      const updated = await adBoardApi.updateAdBoard(board.id, { status: nextStatus });
      setAdBoards(prev => prev.map(b => b.id === board.id ? updated : b));
      showToast(`${t('Status changed to', 'স্ট্যাটাস পরিবর্তিত হয়েছে:')} ${getStatusText(nextStatus)}`, 'success');
    } catch (e) {
      showToast(t('Failed to change status', 'স্ট্যাটাস পরিবর্তন করতে ব্যর্থ হয়েছে'), 'error');
    }
  };

  const filteredBoards = adBoards.filter(b => {
    if (activePlacementFilter !== 'all' && b.placement !== activePlacementFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.title.toLowerCase().includes(q) || (b.subtitle && b.subtitle.toLowerCase().includes(q));
    }
    return true;
  });

  const activeCount = adBoards.filter(b => b.status === 'active').length;
  const scheduledCount = adBoards.filter(b => b.status === 'scheduled').length;
  const expiredCount = adBoards.filter(b => b.status === 'expired' || b.status === 'paused').length;

  return (
    <div className="space-y-6 text-left">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Layout className="text-brand-orange" size={22} /> {t('Ad Boards & Storefront Banners', 'বিজ্ঞাপন বোর্ড ও স্টোরফ্রন্ট ব্যানার')}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {t('Configure promotional banners placed across dedicated storefront slots (homepage, categories, sidebar, modals).', 'হোমপেজ, ক্যাটাগরি, সাইডবার এবং মোডাল স্লটের জন্য প্রোমোশনাল ব্যানার কনফিগার করুন।')}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-brand-orange/20 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> {t('New Ad Board', 'নতুন বিজ্ঞাপন বোর্ড')}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('Total Boards', 'মোট বোর্ড')}</p>
          <p className="text-2xl font-black text-white">{adBoards.length}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">{t('Active Slots', 'সক্রিয় স্লট')}</p>
          <p className="text-2xl font-black text-emerald-300">{activeCount}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">{t('Scheduled', 'নির্ধারিত')}</p>
          <p className="text-2xl font-black text-blue-300">{scheduledCount}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">{t('Paused / Expired', 'বিরতি / মেয়াদোত্তীর্ণ')}</p>
          <p className="text-2xl font-black text-amber-300">{expiredCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('Search ad boards by title...', 'শিরোনাম দিয়ে বিজ্ঞাপন বোর্ড খুঁজুন...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setActivePlacementFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activePlacementFilter === 'all' ? 'bg-brand-orange text-white' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            {t('All Slots', 'সব স্লট')} ({adBoards.length})
          </button>
          {PLACEMENT_OPTIONS.map(opt => {
            const count = adBoards.filter(b => b.placement === opt.id).length;
            return (
              <button
                key={opt.id}
                onClick={() => setActivePlacementFilter(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activePlacementFilter === opt.id ? 'bg-brand-orange text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                {getPlacementInfo(opt.id).short} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">{t('Loading ad boards...', 'বিজ্ঞাপন বোর্ড লোড হচ্ছে...')}</p>
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
          <Sparkles size={36} className="mx-auto text-gray-500 mb-3" />
          <h4 className="text-base font-bold text-white mb-1">{t('No Ad Boards Found', 'কোনো বিজ্ঞাপন বোর্ড পাওয়া যায়নি')}</h4>
          <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
            {t('Create promotional billboard and banner boards to market special promotions across storefront landing pages.', 'স্টোরফ্রন্ট ল্যান্ডিং পেজে বিশেষ অফার প্রচার করতে প্রোমোশনাল বিলবোর্ড এবং ব্যানার বোর্ড তৈরি করুন।')}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-brand-orange text-white font-bold text-xs uppercase cursor-pointer"
          >
            {t('Create First Ad Board', 'প্রথম বিজ্ঞাপন বোর্ড তৈরি করুন')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBoards.map((board) => {
            const placementInfo = getPlacementInfo(board.placement);
            return (
              <div 
                key={board.id} 
                className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-brand-orange/40 transition-all flex flex-col justify-between group"
              >
                {/* Banner Thumbnail */}
                <div className="relative h-44 bg-black/40 overflow-hidden">
                  <img
                    src={board.image}
                    alt={board.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e14] via-transparent to-black/30" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-md ${
                      board.status === 'active' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : board.status === 'scheduled'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {getStatusText(board.status)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-gray-300 border border-white/10">
                      {placementInfo.label}
                    </span>
                  </div>

                  {/* Quick Action Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleStatus(board)}
                      title={board.status === 'active' ? t('Pause Campaign', 'ক্যাম্পেইন বিরতি দিন') : t('Activate Campaign', 'ক্যাম্পেইন চালু করুন')}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/10 cursor-pointer backdrop-blur-sm"
                    >
                      {board.status === 'active' ? <Clock size={13} /> : <Check size={13} />}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(board)}
                      title={t('Edit Ad Board', 'বিজ্ঞাপন বোর্ড সম্পাদনা করুন')}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white border border-white/10 cursor-pointer backdrop-blur-sm"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeletingBoard(board)}
                      title={t('Delete Ad Board', 'বিজ্ঞাপন বোর্ড মুছে ফেলুন')}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-500 text-rose-400 hover:text-white border border-white/10 cursor-pointer backdrop-blur-sm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">{board.title}</h4>
                    {board.subtitle && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{board.subtitle}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                      <ExternalLink size={12} className="text-brand-orange shrink-0" />
                      <span className="truncate">{board.targetUrl || '/'}</span>
                    </div>
                  </div>

                  {/* Telemetry / Dates */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                    <div className="flex items-center gap-3">
                      <span>👁️ {board.impressions || 0}</span>
                      <span>🖱️ {board.clicks || 0} {t('clicks', 'ক্লিক')}</span>
                    </div>
                    {board.endDate ? (
                      <span className="text-[10px] text-gray-500">{t('Exp:', 'মেয়াদ:')} {board.endDate}</span>
                    ) : (
                      <span className="text-[10px] text-emerald-400/80">{t('Continuous', 'চলমান')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-[#14141c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto text-left"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Sparkles className="text-brand-orange" size={20} />
                  {editingAdBoard ? t('Edit Ad Board', 'বিজ্ঞাপন বোর্ড সম্পাদনা') : t('Create New Ad Board', 'নতুন বিজ্ঞাপন বোর্ড তৈরি করুন')}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4 mt-5">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">{t('Campaign Headline *', 'ক্যাম্পেইন শিরোনাম *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('e.g. Mega Summer Super Sale — Up to 60% OFF', 'যেমন: মেগা সামার সুপার সেল — ৬০% পর্যন্ত ছাড়')}
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">{t('Subtitle / Promotion Hook', 'সাবটাইটেল / প্রোমোশন বিবরণ')}</label>
                  <input
                    type="text"
                    placeholder={t('e.g. Authentic premium gadgets with 24-hour fast dispatch', 'যেমন: ২৪ ঘণ্টার মধ্যে দ্রুত ডেলিভারিসহ আসল প্রিমিয়াম গ্যাজেট')}
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>

                {/* Image URL with live preview */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">{t('Banner Image URL *', 'ব্যানার ছবির লিংক *')}</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                  {formImage && (
                    <div className="mt-2.5 h-32 rounded-xl overflow-hidden border border-white/10 bg-black/30 relative">
                      <img
                        src={formImage}
                        alt={t('Preview', 'প্রিভিউ')}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Target Link & Placement */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">{t('Destination Link', 'টার্গেট লিংক')}</label>
                    <input
                      type="text"
                      placeholder="/category/fashions or /search?q=sale"
                      value={formTargetUrl}
                      onChange={(e) => setFormTargetUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs text-white focus:outline-none focus:border-brand-orange font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">{t('Placement Slot *', 'প্রদর্শনের স্থান *')}</label>
                    <select
                      value={formPlacement}
                      onChange={(e) => setFormPlacement(e.target.value as AdBoard['placement'])}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs text-white focus:outline-none focus:border-brand-orange"
                    >
                      {PLACEMENT_OPTIONS.map(opt => (
                        <option key={opt.id} value={opt.id} className="bg-[#181824] text-white">
                          {getPlacementInfo(opt.id).label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Status & Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">{t('Status', 'অবস্থা')}</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as AdBoard['status'])}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                    >
                      <option value="active" className="bg-[#181824] text-white">{t('Active', 'সক্রিয়')}</option>
                      <option value="scheduled" className="bg-[#181824] text-white">{t('Scheduled', 'নির্ধারিত')}</option>
                      <option value="paused" className="bg-[#181824] text-white">{t('Paused', 'বিরতি')}</option>
                      <option value="expired" className="bg-[#181824] text-white">{t('Expired', 'মেয়াদোত্তীর্ণ')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">{t('Start Date', 'শুরুর তারিখ')}</label>
                    <input
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase mb-1.5">{t('End Date', 'শেষ তারিখ')}</label>
                    <input
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    {t('Cancel', 'বাতিল')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-orange/20"
                  >
                    {isSubmitting ? t('Saving...', 'সংরক্ষণ হচ্ছে...') : editingAdBoard ? t('Save Changes', 'পরিবর্তন সংরক্ষণ করুন') : t('Publish Ad Board', 'বিজ্ঞাপন বোর্ড প্রকাশ করুন')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingBoard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingBoard(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#161622] border border-rose-500/30 rounded-3xl p-6 shadow-2xl z-10 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="text-base font-black text-white">{t('Delete Ad Board?', 'বিজ্ঞাপন বোর্ড মুছে ফেলবেন?')}</h4>
                <p className="text-xs text-gray-400 mt-1">
                  {t('Are you sure you want to remove', 'আপনি কি নিশ্চিত যে আপনি সরাতে চান')} <span className="text-white font-bold">"{deletingBoard.title}"</span>? {t('This banner slot will immediately unpublish from the storefront.', 'এই ব্যানার স্লটটি তাৎক্ষণিকভাবে স্টোরফ্রন্ট থেকে অদৃশ্য হয়ে যাবে।')}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDeletingBoard(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold cursor-pointer"
                >
                  {t('Cancel', 'বাতিল')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  {t('Delete', 'মুছে ফেলুন')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
