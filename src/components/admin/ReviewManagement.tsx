import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Star, Search, Trash2, CheckCircle, 
  MessageSquare, ShieldCheck, Flag, Clock, Loader2, AlertCircle
} from 'lucide-react';
import { adminApi, reviewApi } from '../../services/api';
import { Product } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../Toast';

interface ReviewItem {
  id: string;
  productId?: string;
  productName: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  image?: string;
  status: 'approved' | 'pending' | 'flagged' | 'published';
}

const DEFAULT_SEED_REVIEWS: ReviewItem[] = [
  { id: 'rev_1', productName: 'Premium Cotton T-Shirt', userName: 'Tanvir Ahmed', rating: 5, comment: 'Exceptional quality t-shirt. The comfort is unmatched!', date: new Date().toISOString().slice(0, 10), image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80', status: 'approved' },
  { id: 'rev_2', productName: 'Oversized Streetwear Hoodie', userName: 'Sarah Jenkins', rating: 4, comment: 'Love the hoodie but it runs a bit larger than expected.', date: new Date().toISOString().slice(0, 10), status: 'pending' },
  { id: 'rev_3', productName: 'Classic Slim Fit Denim', userName: 'Rafiqul Islam', rating: 1, comment: 'Product received with delayed courier delivery. Fabric is good though.', date: new Date().toISOString().slice(0, 10), status: 'flagged' },
];

export const ReviewManagement: React.FC<{ products?: Product[] }> = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadReviews = async () => {
      try {
        const remote = await reviewApi.getReviews();
        if (!active) return;

        if (Array.isArray(remote) && remote.length > 0) {
          const list: ReviewItem[] = remote.map((data: any) => ({
            id: data.id,
            productId: data.productId,
            productName: data.productName || 'Catalog Product',
            userName: data.userName || data.author || 'Customer',
            rating: Number(data.rating) || 5,
            comment: data.comment || data.content || '',
            date: data.date || (data.createdAt ? String(data.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10)),
            image: data.image || data.photoUrl,
            status: data.status || 'published'
          }));
          setReviews(list);
        } else {
          setReviews(DEFAULT_SEED_REVIEWS);
        }
        setError(null);
      } catch (err: any) {
        console.warn('Reviews API sync error:', err);
        if (active) {
          setError(t('Failed to sync live reviews from server.', 'সার্ভার থেকে লাইভ রিভিউ সিঙ্ক করতে ব্যর্থ হয়েছে।'));
          setReviews(DEFAULT_SEED_REVIEWS);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadReviews();
    return () => {
      active = false;
    };
  }, [t]);

  const filteredReviews = reviews.filter(r => {
    const matchesSearch = r.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || 
                          r.status.toLowerCase() === selectedStatus.toLowerCase() ||
                          (selectedStatus === 'Approved' && r.status === 'published');
    return matchesSearch && matchesStatus;
  });

  const getReviewStatusLabel = (status: ReviewItem['status']) => {
    switch (status) {
      case 'approved':
      case 'published':
        return t('Approved', 'অনুমোদিত');
      case 'pending':
        return t('Pending', 'অপেক্ষমাণ');
      case 'flagged':
        return t('Flagged', 'চিহ্নিত');
    }
  };

  const updateStatus = async (id: string, newStatus: ReviewItem['status']) => {
    try {
      await adminApi.updateReviewStatus(id, newStatus);
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      const statusLabel = getReviewStatusLabel(newStatus);
      setActionMessage(t(`Review marked as ${statusLabel}.`, `রিভিউ '${statusLabel}' হিসেবে চিহ্নিত হয়েছে।`));
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update review status:', err);
      showToast(t('Failed to update review: ', 'রিভিউ আপডেট করতে ব্যর্থ: ') + err.message, 'error');
    }
  };

  const deleteReview = async (id: string) => {
    try {
      await adminApi.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setConfirmDeleteId(null);
      setActionMessage(t('Review removed permanently.', 'রিভিউ সফলভাবে মুছে ফেলা হয়েছে।'));
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to delete review:', err);
      showToast(t('Failed to delete review: ', 'রিভিউ মুছতে ব্যর্থ: ') + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-brand-navy tracking-tight uppercase">{t('Social Proof Control', 'রিভিউ ও রেটিং নিয়ন্ত্রণ')}</h1>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
             {language === 'bn'
               ? `লাইভ রিভিউ মডারেশন (${reviews.length}টি রিভিউ)`
               : `Live Review Moderation (${reviews.length} reviews)`}
           </p>
        </div>
      </div>

      {actionMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold"
        >
          <CheckCircle size={16} className="text-emerald-500 shrink-0" />
          <span>{actionMessage}</span>
        </motion.div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle size={16} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 daraz-shadow flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-xl border border-gray-100 w-full md:w-auto">
            <Search size={16} className="text-gray-400" />
            <input 
              type="text" 
              placeholder={t('Search by Reviewer or Product...', 'রিভিউদাতা বা পণ্যের নাম দিয়ে খুঁজুন...')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-gray-600 font-bold uppercase tracking-wider" 
            />
         </div>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-gray-50 border border-gray-100 rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none text-gray-500 min-w-[150px] cursor-pointer"
            >
               <option value="All">{t('All', 'সকল')}</option>
               <option value="Pending">{t('Pending', 'অপেক্ষমাণ')}</option>
               <option value="Approved">{t('Approved', 'অনুমোদিত')}</option>
               <option value="Flagged">{t('Flagged', 'চিহ্নিত')}</option>
            </select>
         </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="p-16 text-center text-gray-400 flex flex-col items-center justify-center gap-3 bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow">
          <Loader2 size={32} className="animate-spin text-brand-orange" />
          <p className="text-xs font-black uppercase tracking-widest">{t('Connecting to reviews stream...', 'রিভিউ তালিকা লোড হচ্ছে...')}</p>
        </div>
      ) : (
        /* Reviews List */
        <div className="space-y-4">
          {filteredReviews.map((review) => (
             <motion.div 
               layout
               key={review.id} 
               className="bg-white p-6 rounded-[2.5rem] border border-gray-100 daraz-shadow grid grid-cols-1 md:grid-cols-12 gap-8 items-start group relative overflow-hidden"
             >
                {review.status === 'flagged' && <div className="absolute top-0 left-0 w-2 h-full bg-rose-500" />}
                
                <div className="md:col-span-3 space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-brand-navy rounded-xl flex items-center justify-center text-white text-xs font-black">
                         {review.userName.charAt(0)}
                      </div>
                      <div>
                         <p className="text-xs font-black text-brand-navy">{review.userName}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">{review.date}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(i => (
                         <Star key={i} size={12} className={i <= review.rating ? 'fill-brand-orange text-brand-orange' : 'text-gray-200'} />
                      ))}
                   </div>
                   <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      review.status === 'approved' || review.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 
                      review.status === 'pending' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'
                   }`}>
                      {review.status === 'approved' || review.status === 'published' ? <ShieldCheck size={12} /> : review.status === 'flagged' ? <Flag size={12} /> : <Clock size={12} />}
                      {getReviewStatusLabel(review.status)}
                   </div>
                </div>

                <div className="md:col-span-6 space-y-4">
                   <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('Reviewing', 'পণ্য')}</span>
                      <h4 className="text-xs font-black text-brand-navy uppercase tracking-tight mt-1">{review.productName}</h4>
                   </div>
                   <p className="text-sm text-gray-600 leading-relaxed font-medium">"{review.comment}"</p>
                   {review.image && (
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                         <img src={review.image} alt={review.productName || t('Review photo', 'রিভিউ ছবি')} className="w-full h-full object-cover" />
                      </div>
                   )}
                </div>

                <div className="md:col-span-3 flex md:flex-col gap-2 justify-end h-full">
                   <button 
                    onClick={() => updateStatus(review.id, 'approved')}
                    className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                   >
                      <CheckCircle size={14} /> {t('Approve', 'অনুমোদন')}
                   </button>
                   <button 
                    onClick={() => updateStatus(review.id, 'flagged')}
                    className="flex-1 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                   >
                      <Flag size={14} /> {t('Flag', 'চিহ্নিত করুন')}
                   </button>
                   {confirmDeleteId === review.id ? (
                     <div className="flex-1 flex gap-1.5">
                       <button
                         onClick={() => deleteReview(review.id)}
                         className="flex-1 py-3 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all cursor-pointer"
                       >
                         {t('Confirm', 'নিশ্চিত')}
                       </button>
                       <button
                         onClick={() => setConfirmDeleteId(null)}
                         className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all cursor-pointer"
                       >
                         {t('Cancel', 'বাতিল')}
                       </button>
                     </div>
                   ) : (
                     <button 
                      onClick={() => setConfirmDeleteId(review.id)}
                      className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 hover:text-rose-500 transition-all flex items-center justify-center gap-2 border border-gray-100 cursor-pointer"
                     >
                        <Trash2 size={14} /> {t('Remove', 'মুছুন')}
                     </button>
                   )}
                </div>
             </motion.div>
          ))}

          {filteredReviews.length === 0 && (
             <div className="text-center py-24 bg-white rounded-[2.5rem] daraz-shadow border border-gray-100">
                <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{t('No reviews found matching filters', 'ফিল্টারের সাথে মিল থাকা কোনো রিভিউ পাওয়া যায়নি')}</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

