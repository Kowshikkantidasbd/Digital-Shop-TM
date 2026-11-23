import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Image as ImageIcon, Plus, Trash2, Edit2, 
  Upload, ExternalLink, Eye, Layout, 
  Monitor, Smartphone, Sparkles, Save, Loader2,
  CheckCircle, AlertCircle, X, Check
} from 'lucide-react';
import { configApi, uploadApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../Toast';

interface BannerItem {
  id: string;
  title: string;
  type: string;
  size: string;
  status: 'active' | 'inactive';
  image: string;
  link?: string;
}

const DEFAULT_BANNERS: BannerItem[] = [
  { id: 'banner_1', title: 'Main Hero Slider', type: 'Hero', size: '1200x500', status: 'active', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=85&w=1200' },
  { id: 'banner_2', title: 'Winter Collection Promo', type: 'Promotion', size: '600x300', status: 'active', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=85&w=1200' },
];

export const BannerManagement: React.FC = () => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Slider settings state
  const [cycleSeconds, setCycleSeconds] = useState(5.0);
  const [enableOverlay, setEnableOverlay] = useState(true);
  const [pauseOnHover, setPauseOnHover] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerType, setBannerType] = useState('Hero');
  const [bannerSize, setBannerSize] = useState('1200x500');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerStatus, setBannerStatus] = useState<'active' | 'inactive'>('active');

  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getBannerTypeLabel = (type: string) => {
    if (type === 'Hero') return t('Hero Slider', 'হিরো স্লাইডার');
    if (type === 'Promotion') return t('Promotion', 'প্রমোশন');
    if (type === 'Popup') return t('Popup', 'পপআপ');
    return type;
  };

  // Load banners and slider settings from backend API
  useEffect(() => {
    let active = true;
    const loadBannersAndSlider = async () => {
      try {
        const [remoteBanners, slider] = await Promise.all([
          configApi.getBanners(),
          configApi.getSliderSettings()
        ]);
        if (!active) return;

        if (Array.isArray(remoteBanners) && remoteBanners.length > 0) {
          setBanners(remoteBanners as BannerItem[]);
        } else {
          setBanners(DEFAULT_BANNERS);
          DEFAULT_BANNERS.forEach((b) => {
            configApi.saveBanner(b).catch(() => {});
          });
        }

        if (slider) {
          if (slider.cycleSeconds !== undefined) setCycleSeconds(Number(slider.cycleSeconds));
          if (slider.enableOverlay !== undefined) setEnableOverlay(Boolean(slider.enableOverlay));
          if (slider.pauseOnHover !== undefined) setPauseOnHover(Boolean(slider.pauseOnHover));
        }
      } catch (err) {
        console.warn('BannerManagement load warning:', err);
        if (active) setBanners(DEFAULT_BANNERS);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadBannersAndSlider();
    return () => {
      active = false;
    };
  }, []);

  const saveSliderSettings = async (updates: Partial<{ cycleSeconds: number; enableOverlay: boolean; pauseOnHover: boolean }>) => {
    try {
      await configApi.updateSliderSettings({
        cycleSeconds: updates.cycleSeconds !== undefined ? updates.cycleSeconds : cycleSeconds,
        enableOverlay: updates.enableOverlay !== undefined ? updates.enableOverlay : enableOverlay,
        pauseOnHover: updates.pauseOnHover !== undefined ? updates.pauseOnHover : pauseOnHover
      });
    } catch (err: any) {
      console.warn('Slider settings save warning:', err);
    }
  };

  const handleToggleOverlay = () => {
    const next = !enableOverlay;
    setEnableOverlay(next);
    saveSliderSettings({ enableOverlay: next });
    setStatusMessage(next ? t('Slider overlay enabled.', 'স্লাইডার ওভারলে চালু হয়েছে।') : t('Slider overlay disabled.', 'স্লাইডার ওভারলে বন্ধ হয়েছে।'));
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTogglePause = () => {
    const next = !pauseOnHover;
    setPauseOnHover(next);
    saveSliderSettings({ pauseOnHover: next });
    setStatusMessage(next ? t('Pause on hover enabled.', 'হোভারে বিরতি চালু হয়েছে।') : t('Pause on hover disabled.', 'হোভারে বিরতি বন্ধ হয়েছে।'));
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCycleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCycleSeconds(val);
    saveSliderSettings({ cycleSeconds: val });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setBannerTitle('');
    setBannerType('Hero');
    setBannerSize('1200x500');
    setBannerImageUrl('');
    setBannerLink('');
    setBannerStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BannerItem) => {
    setEditingId(b.id);
    setBannerTitle(b.title);
    setBannerType(b.type);
    setBannerSize(b.size);
    setBannerImageUrl(b.image);
    setBannerLink(b.link || '');
    setBannerStatus(b.status);
    setIsModalOpen(true);
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await configApi.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setConfirmDeleteId(null);
      setStatusMessage(t('Banner creative deleted.', 'ব্যানার ক্রিয়েটিভ মুছে ফেলা হয়েছে।'));
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      showToast(t('Delete failed: ', 'মুছতে ব্যর্থ: ') + (err?.message || ''), 'error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let finalUrl = dataUrl;
      try {
        finalUrl = await uploadApi.uploadMedia(file.name, dataUrl);
      } catch (uploadErr) {
        console.warn('Media upload fallback to data URL:', uploadErr);
      }

      setBannerImageUrl(finalUrl);
      if (!bannerTitle) setBannerTitle(file.name.replace(/\.[^/.]+$/, ''));
      setIsModalOpen(true);
    } catch (err: any) {
      showToast(t('Upload failed: ', 'আপলোড ব্যর্থ: ') + (err?.message || ''), 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim() || !bannerImageUrl.trim()) return;

    setIsUploading(true);
    try {
      const docId = editingId || `banner_${Date.now()}`;
      const payload: BannerItem = {
        id: docId,
        title: bannerTitle.trim(),
        type: bannerType,
        size: bannerSize,
        image: bannerImageUrl.trim(),
        link: bannerLink.trim(),
        status: bannerStatus
      };
      const saved = await configApi.saveBanner(payload);
      setBanners((prev) => {
        const idx = prev.findIndex((b) => b.id === docId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...(saved || payload) };
          return next;
        }
        return [...prev, (saved || payload) as BannerItem];
      });

      setStatusMessage(editingId ? t('Banner updated successfully.', 'ব্যানার সফলভাবে আপডেট হয়েছে।') : t('New banner asset deployed.', 'নতুন ব্যানার অ্যাসেট যুক্ত হয়েছে।'));
      setTimeout(() => setStatusMessage(null), 3000);
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(t('Failed to save banner: ', 'ব্যানার সংরক্ষণে ব্যর্থ: ') + (err?.message || ''), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {statusMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm"
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)}><X size={14} /></button>
        </motion.div>
      )}

      {/* Hidden file input for Creative Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-brand-navy tracking-tight uppercase">{t('Visual Content Management', 'ভিজ্যুয়াল কন্টেন্ট ব্যবস্থাপনা')}</h1>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Live Storefront Banners, Sliders & Creatives', 'লাইভ স্টোরফ্রন্ট ব্যানার, স্লাইডার ও ক্রিয়েটিভ')}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-3 bg-brand-orange text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-orange/90 transition-all shadow-lg shadow-brand-orange/20 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {isUploading ? t('Uploading...', 'আপলোড হচ্ছে...') : t('Upload Creative', 'ক্রিয়েটিভ আপলোড')}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow">
          <Loader2 className="animate-spin text-brand-orange" size={28} />
          <p className="text-xs font-bold uppercase tracking-widest">{t('Loading visual creatives...', 'ভিজ্যুয়াল ক্রিয়েটিভ লোড হচ্ছে...')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {banners.map((banner) => (
              <motion.div 
                key={banner.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow overflow-hidden group"
              >
                 <div className="aspect-video relative overflow-hidden bg-gray-50">
                    <img src={banner.image} alt={banner.title || t('Promotional banner', 'প্রমোশনাল ব্যানার')} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-brand-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                       {confirmDeleteId === banner.id ? (
                         <div className="bg-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                           <span className="text-[11px] font-black text-brand-navy">{t('Delete banner?', 'ব্যানার মুছবেন?')}</span>
                           <button
                             type="button"
                             onClick={() => handleDeleteBanner(banner.id)}
                             className="px-3 py-1.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-600 cursor-pointer"
                           >
                             {t('Yes', 'হ্যাঁ')}
                           </button>
                           <button
                             type="button"
                             onClick={() => setConfirmDeleteId(null)}
                             className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 cursor-pointer"
                           >
                             {t('No', 'না')}
                           </button>
                         </div>
                       ) : (
                         <>
                           <button 
                             onClick={() => handleOpenEdit(banner)}
                             className="p-4 bg-white text-brand-navy rounded-2xl shadow-xl hover:scale-110 transition-transform cursor-pointer"
                             title={t('Edit creative', 'ক্রিয়েটিভ সম্পাদনা')}
                           >
                             <Edit2 size={20} />
                           </button>
                           <button 
                             onClick={() => setConfirmDeleteId(banner.id)}
                             className="p-4 bg-white text-rose-500 rounded-2xl shadow-xl hover:scale-110 transition-transform cursor-pointer"
                             title={t('Delete creative', 'ক্রিয়েটিভ মুছুন')}
                           >
                             <Trash2 size={20} />
                           </button>
                         </>
                       )}
                    </div>
                    <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-full text-[9px] font-black uppercase tracking-widest text-brand-navy shadow-sm">
                       {getBannerTypeLabel(banner.type)}
                    </div>
                 </div>
                 <div className="p-8 flex items-center justify-between">
                    <div>
                       <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">{banner.title}</h3>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{banner.size} · {banner.link ? `${t('Link:', 'লিংক:')} ${banner.link}` : t('Static Banner', 'স্ট্যাটিক ব্যানার')}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${banner.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : 'bg-gray-300'}`} />
                 </div>
              </motion.div>
           ))}

           <button 
             onClick={handleOpenCreate}
             className="aspect-video bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand-orange hover:bg-orange-50/30 transition-all group cursor-pointer"
           >
              <Plus size={48} className="mb-4 group-hover:scale-110 transition-transform text-brand-orange" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">{t('Deploy New Asset', 'নতুন অ্যাসেট যুক্ত করুন')}</p>
              <p className="text-[8px] font-medium mt-2">{t('Upload or enter image link directly', 'সরাসরি ছবি আপলোড করুন বা লিংক দিন')}</p>
           </button>
        </div>
      )}

      {/* Website Live Sync Settings */}
      <div className="bg-brand-navy p-10 rounded-[3rem] text-white daraz-shadow relative overflow-hidden">
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <Sparkles className="text-brand-yellow" size={24} />
                  <h3 className="text-xl font-black uppercase tracking-tight">{t('Main Slider Configuration', 'প্রধান স্লাইডার কনফিগারেশন')}</h3>
               </div>
               <p className="text-sm text-white/70 leading-relaxed font-medium">{t('Control the automated behavior of your homepage hero section. Settings persist live in the backend.', 'হোমপেজ হিরো সেকশনের স্বয়ংক্রিয় আচরণ নিয়ন্ত্রণ করুন। সেটিংস ব্যাকএন্ডে লাইভ সংরক্ষিত হয়।')}</p>
               
               <div className="space-y-4">
                  <div className="space-y-2">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                        <span>{t('Auto-rotate Cycle', 'স্বয়ংক্রিয় পরিবর্তন সময়')}</span>
                        <span>{cycleSeconds.toFixed(1)} {t('Seconds', 'সেকেন্ড')}</span>
                     </div>
                     <input 
                       type="range" 
                       min="2.0" 
                       max="10.0" 
                       step="0.5" 
                       value={cycleSeconds}
                       onChange={handleCycleChange}
                       className="w-full accent-brand-orange cursor-pointer" 
                     />
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                     <button 
                       onClick={handleToggleOverlay}
                       className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                         enableOverlay ? 'bg-brand-yellow text-brand-navy shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
                       }`}
                     >
                       {enableOverlay && <Check size={14} />}
                       {enableOverlay ? t('Overlay Enabled', 'ওভারলে চালু') : t('Enable Overlay', 'ওভারলে চালু করুন')}
                     </button>
                     <button 
                       onClick={handleTogglePause}
                       className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                         pauseOnHover ? 'bg-white text-brand-navy border-white shadow-md' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
                       }`}
                     >
                       {pauseOnHover && <Check size={14} />}
                       {pauseOnHover ? t('Hover Pause Active', 'হোভার বিরতি সক্রিয়') : t('Pause on Hover', 'হোভারে থামুন')}
                     </button>
                  </div>
               </div>
            </div>
            <div className="relative hidden md:block">
                <div className="w-full aspect-[16/9] bg-white/5 rounded-3xl border border-white/10 p-4 relative overflow-hidden">
                   <div className="absolute inset-0 flex items-center justify-center">
                      <Layout size={64} className="opacity-10" />
                   </div>
                   {enableOverlay && (
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                   )}
                   <div className="absolute top-1/2 left-4 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20" />
                   <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20" />
                   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-orange" />
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                   </div>
                </div>
            </div>
         </div>
      </div>

      {/* Banner Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-navy/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-brand-navy tracking-tight uppercase">
                    {editingId ? t('Edit Creative Asset', 'ক্রিয়েটিভ অ্যাসেট সম্পাদনা') : t('Deploy Creative Asset', 'নতুন ক্রিয়েটিভ যুক্ত করুন')}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Configure banner display and target route', 'ব্যানার প্রদর্শন ও টার্গেট লিংক নির্ধারণ করুন')}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-brand-orange cursor-pointer"><X size={24} /></button>
              </div>

              <form onSubmit={handleSaveBanner} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Banner Title', 'ব্যানার শিরোনাম')}</label>
                  <input 
                    type="text" 
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder={t('e.g. Summer Mega Sale Hero', 'যেমন: সামার মেগা সেল হিরো')} 
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange text-xs font-bold text-brand-navy"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Banner Type', 'ব্যানারের ধরন')}</label>
                    <select 
                      value={bannerType}
                      onChange={(e) => setBannerType(e.target.value)}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-xs font-bold text-brand-navy"
                    >
                      <option value="Hero">{t('Hero Slider', 'হিরো স্লাইডার')}</option>
                      <option value="Promotion">{t('Promotional Tile', 'প্রমোশনাল টাইল')}</option>
                      <option value="Popup">{t('Popup Modal', 'পপআপ মডাল')}</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Dimensions', 'মাপ')}</label>
                    <input 
                      type="text" 
                      value={bannerSize}
                      onChange={(e) => setBannerSize(e.target.value)}
                      placeholder="1200x500" 
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-xs font-bold text-brand-navy"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Creative Image URL', 'ছবির লিংক (URL)')}</label>
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      value={bannerImageUrl}
                      onChange={(e) => setBannerImageUrl(e.target.value)}
                      placeholder="https://..." 
                      className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange text-xs font-medium text-gray-700"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-3.5 bg-gray-100 text-brand-navy rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 cursor-pointer"
                    >
                      {t('File', 'ফাইল')}
                    </button>
                  </div>
                </div>

                {bannerImageUrl && (
                  <div className="h-28 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                    <img src={bannerImageUrl} alt={t('Preview', 'প্রিভিউ')} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-400">{t('Destination Route / Link', 'গন্তব্য রুট / লিংক')}</label>
                  <input 
                    type="text" 
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    placeholder="e.g. /search?category=Electronics" 
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-xs font-medium text-gray-700"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isUploading}
                  className="w-full py-4 bg-brand-navy text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-brand-navy/20 hover:bg-brand-navy/90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                >
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isUploading ? t('Saving...', 'সংরক্ষণ হচ্ছে...') : editingId ? t('Update Creative', 'ক্রিয়েটিভ আপডেট করুন') : t('Deploy Creative', 'ক্রিয়েটিভ যুক্ত করুন')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
