import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, ThumbsUp, Image as ImageIcon, 
  Send, Trash2, Filter, ChevronDown, ChevronUp,
  CheckCircle2, MessageCircle
} from 'lucide-react';
import { Review, Product, User as UserType } from '../types';
import { useToast } from './Toast';
import { reviewApi } from '../services/api';
import { FilterTabGroup, FilterDropdown } from './FilterControls';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductReviewsProps {
  product: Product;
  user: UserType | null;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ product, user }) => {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sortBy, setSortBy] = useState<'latest' | 'highest' | 'lowest' | 'images'>('latest');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const INITIAL_VISIBLE_REVIEWS = 3;
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  // Review Form State
  const [rating, setRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [myReviewIds, setMyReviewIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('my_created_reviews');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Reset filter/expand state & load reviews from backend API when switching products
  useEffect(() => {
    let isMounted = true;
    setRatingFilter('all');
    setSortBy('latest');
    setShowAllReviews(false);
    const loadProductReviews = async () => {
      try {
        const apiRevs = await reviewApi.getReviewsByProductId(product.id);
        if (isMounted) {
          if (apiRevs && apiRevs.length > 0) {
            setReviews(apiRevs);
            return;
          }
        }
      } catch (err) {
        console.warn('Error fetching API reviews', err);
      }

      // Check local user-submitted reviews if any
      const storageKey = `reviews_${product.id}`;
      const savedReviews = localStorage.getItem(storageKey);
      if (savedReviews && isMounted) {
        try {
          const parsed = JSON.parse(savedReviews);
          if (Array.isArray(parsed)) {
            setReviews(parsed);
            return;
          }
        } catch (e) {
          console.error('Error parsing reviews', e);
        }
      }

      if (isMounted) {
        setReviews([]);
      }
    };

    loadProductReviews();
    return () => { isMounted = false; };
  }, [product.id]);

  // Save to localStorage when user creates reviews
  useEffect(() => {
    if (reviews.length > 0) {
      localStorage.setItem(`reviews_${product.id}`, JSON.stringify(reviews));
    }
  }, [reviews, product.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReviewImages(prev => [...prev, reader.result as string].slice(0, 5));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    let reviewerName = '';
    let reviewerId = '';
    
    if (user) {
      reviewerName = user.name;
      reviewerId = user.id;
    } else {
      if (!guestName.trim()) {
        showToast(t('Please enter your name to post a review', 'রিভিউ দিতে আপনার নাম লিখুন'), 'error');
        return;
      }
      reviewerName = guestName.trim();
      reviewerId = 'guest_' + Math.random().toString(36).substr(2, 5);
    }

    if (rating === 0) return showToast(t('Please select a star rating', 'অনুগ্রহ করে স্টার রেটিং নির্বাচন করুন'), 'error');
    
    setIsSubmitting(true);
    
    const defaultColor = product.variants?.colors?.[0] || 'Selected Variant';
    const defaultSize = product.variants?.sizes?.[0] || 'Standard';

    const newReview: Review = {
      id: 'rev_' + Date.now(),
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      userId: reviewerId,
      userName: reviewerName,
      userAvatar: user?.avatar || '',
      rating,
      comment: commentText,
      images: reviewImages,
      date: new Date().toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' }),
      helpful: 0,
      status: 'published',
      color: defaultColor,
      size: defaultSize,
      createdAt: new Date().toISOString()
    };

    // Save to backend API asynchronously
    reviewApi.createReview(newReview).catch(err => {
      console.warn('Non-fatal error saving review to server:', err);
    });

    setTimeout(() => {
      setReviews(prev => [newReview, ...prev]);
      setMyReviewIds(prev => {
        const updated = [...prev, newReview.id];
        localStorage.setItem('my_created_reviews', JSON.stringify(updated));
        return updated;
      });
      setRatingFilter('all');
      setSortBy('latest');
      setShowAllReviews(false);
      setRating(0);
      setCommentText('');
      setReviewImages([]);
      setGuestName('');
      setIsSubmitting(false);
      showToast(t('Review submitted successfully! Thank you for your feedback.', 'রিভিউ সফলভাবে জমা হয়েছে! আপনার মতামতের জন্য ধন্যবাদ।'), 'success');
    }, 600);
  };

  const toggleHelpful = (reviewId: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        const newHelpful = (r.helpful || 0) + 1;
        reviewApi.updateReview(reviewId, { helpful: newHelpful }).catch(() => {});
        return { ...r, helpful: newHelpful };
      }
      return r;
    }));
    showToast(t('Marked as helpful!', 'সহায়ক হিসেবে চিহ্নিত হয়েছে!'), 'success');
  };

  const deleteReview = (reviewId: string) => {
    setReviews(prev => {
      const next = prev.filter(r => r.id !== reviewId);
      if (next.length === 0) {
        localStorage.removeItem(`reviews_${product.id}`);
      }
      return next;
    });
    reviewApi.deleteReview(reviewId).catch(err => {
      console.warn('Non-fatal error deleting review from server:', err);
    });
  };

  // Filter out hidden reviews from public storefront view
  const visibleReviews = useMemo(() => {
    return reviews.filter(r => {
      if (r.status === 'hidden') {
        return user?.role === 'admin' || (user && r.userId === user.id);
      }
      return true;
    });
  }, [reviews, user]);

  const starCounts = useMemo(() => ({
    all: visibleReviews.length,
    5: visibleReviews.filter(r => r.rating === 5).length,
    4: visibleReviews.filter(r => r.rating === 4).length,
    3: visibleReviews.filter(r => r.rating === 3).length,
    2: visibleReviews.filter(r => r.rating === 2).length,
    1: visibleReviews.filter(r => r.rating === 1).length,
  }), [visibleReviews]);

  const getReviewTimestamp = (r: Review): number => {
    if (r.createdAt) {
      const parsed = Date.parse(r.createdAt);
      if (!Number.isNaN(parsed)) return parsed;
    }
    if (r.date) {
      const parsedDate = Date.parse(r.date);
      if (!Number.isNaN(parsedDate)) return parsedDate;
    }
    const idMatch = String(r.id || '').match(/(\d{10,})/);
    if (idMatch) return Number(idMatch[1]);
    return 0;
  };

  const sortedReviews = useMemo(() => {
    let list = visibleReviews;
    if (ratingFilter !== 'all') {
      const starNum = Number(ratingFilter);
      list = list.filter(r => r.rating === starNum);
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'latest') return getReviewTimestamp(b) - getReviewTimestamp(a);
      if (sortBy === 'highest') return b.rating - a.rating || getReviewTimestamp(b) - getReviewTimestamp(a);
      if (sortBy === 'lowest') return a.rating - b.rating || getReviewTimestamp(b) - getReviewTimestamp(a);
      if (sortBy === 'images') return (b.images?.length || 0) - (a.images?.length || 0) || getReviewTimestamp(b) - getReviewTimestamp(a);
      return 0;
    });
  }, [visibleReviews, ratingFilter, sortBy]);

  const totalReviewsCount = visibleReviews.length;

  // Real Average Rating calculated directly from authentic reviews
  const averageRatingNum = useMemo(() => {
    if (totalReviewsCount === 0) return 0;
    const sum = visibleReviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    return sum / totalReviewsCount;
  }, [visibleReviews, totalReviewsCount]);

  const displayAverage = totalReviewsCount > 0 ? averageRatingNum.toFixed(1) : '0.0';

  // Compute realistic distribution strictly matching genuine reviews
  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    visibleReviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating as 1|2|3|4|5] += 1;
      }
    });

    return [5, 4, 3, 2, 1].map(star => {
      const count = counts[star as 1|2|3|4|5] || 0;
      const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
      return { star, count, percentage };
    });
  }, [visibleReviews, totalReviewsCount]);

  const maskName = (name: string) => {
    if (!name) return 'Customer';
    const trimmed = name.trim();
    if (trimmed.includes('***')) return trimmed;
    if (trimmed.length <= 2) return trimmed + '***';
    const parts = trimmed.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[1][0]}***`;
    }
    return trimmed[0] + '***' + trimmed[trimmed.length - 1];
  };

  return (
    <div className="space-y-8 font-sans" id="product-reviews-section">
      {/* 1. Header Ratings & Score Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 md:p-8 bg-gradient-to-br from-gray-50/80 via-white to-orange-50/20 rounded-2xl border border-gray-100 shadow-xs">
        {/* Left Big Score Column */}
        <div className="md:col-span-4 text-center md:text-left flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8">
          <div className="flex items-baseline justify-center md:justify-start gap-2 mb-1.5">
            <span className="text-5xl md:text-6xl font-black text-gray-900 font-mono tracking-tight">{displayAverage}</span>
            <span className="text-xl text-gray-400 font-bold font-mono">/5.0</span>
          </div>
          
          <div className="flex justify-center md:justify-start gap-1 mb-2.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star 
                key={i} 
                size={20} 
                className={totalReviewsCount > 0 && i <= Math.round(Number(displayAverage)) ? 'fill-brand-orange text-brand-orange' : 'text-gray-200'} 
              />
            ))}
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-800 font-mono">
              {totalReviewsCount === 0
                ? t('No Reviews Yet', 'এখনো কোনো রিভিউ নেই')
                : t(
                    `${totalReviewsCount} Customer ${totalReviewsCount === 1 ? 'Rating' : 'Ratings'}`,
                    `${totalReviewsCount} জন ক্রেতার রেটিং`
                  )}
            </p>
            <p className="text-[11px] text-gray-400 font-medium">
              {totalReviewsCount === 0
                ? t('Be the first to share your experience with this item', 'প্রথম ক্রেতা হিসেবে আপনার অভিজ্ঞতা শেয়ার করুন')
                : t('Calculated strictly from genuine submitted reviews', 'আসল ক্রেতাদের প্রদত্ত রিভিউ থেকে হিসাবকৃত')}
            </p>
          </div>
        </div>

        {/* Right Star Breakdown Bars */}
        <div className="md:col-span-8 space-y-2.5 flex flex-col justify-center">
          {ratingDistribution.map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-3 group">
              <div className="flex items-center gap-1 w-12 shrink-0 justify-end">
                <span className="text-xs font-bold text-gray-700 font-mono">{star}</span>
                <Star size={11} className="fill-brand-orange text-brand-orange" />
              </div>
              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-400 to-brand-orange rounded-full shadow-xs"
                />
              </div>
              <div className="w-16 text-right flex items-center justify-between gap-1 text-[10px] font-mono">
                <span className="text-gray-400">{count}</span>
                <span className="font-bold text-gray-700">{percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Distinction Subheader & Filters */}
      <div className="space-y-4 border-b border-gray-100 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest font-mono tabular-nums">
                {t('Customer Reviews', 'ক্রেতা রিভিউ')} ({totalReviewsCount})
              </h4>
            </div>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {totalReviewsCount === 0
                ? t('Authentic ratings and feedback from verified purchasers', 'যাচাইকৃত ক্রেতাদের প্রকৃত রেটিং ও মতামত')
                : t(`Showing all ${totalReviewsCount} submitted reviews for this product`, `এই পণ্যের ${totalReviewsCount}টি রিভিউ দেখানো হচ্ছে`)}
            </p>
          </div>

          {/* Sort Dropdown */}
          <FilterDropdown
            label={t('Sort:', 'সাজান:')}
            value={sortBy}
            onChange={(val) => {
              setSortBy(val as any);
              setShowAllReviews(false);
            }}
            options={[
              { value: 'latest', label: t('Latest First', 'সর্বশেষ প্রথম') },
              { value: 'highest', label: t('Highest Rating (5★)', 'সর্বোচ্চ রেটিং (5★)') },
              { value: 'lowest', label: t('Lowest Rating', 'সর্বনিম্ন রেটিং') },
              { value: 'images', label: t('With Customer Photos', 'ছবিসহ রিভিউ') },
            ]}
            variant="light"
            size="sm"
            ariaLabel={t('Sort reviews by', 'রিভিউ সাজান')}
          />
        </div>

        {/* Star Rating Filter Tabs */}
        <FilterTabGroup
          variant="light"
          size="sm"
          wrap
          tabs={[
            { id: 'all', label: t('All Reviews', 'সব রিভিউ'), count: starCounts.all, badgeVariant: 'grey' },
            { id: '5', label: '5 ★', count: starCounts[5], badgeVariant: 'amber' },
            { id: '4', label: '4 ★', count: starCounts[4], badgeVariant: 'amber' },
            { id: '3', label: '3 ★', count: starCounts[3], badgeVariant: 'grey' },
            { id: '2', label: '2 ★', count: starCounts[2], badgeVariant: 'rose' },
            { id: '1', label: '1 ★', count: starCounts[1], badgeVariant: 'rose' },
          ]}
          activeTab={ratingFilter}
          onChange={(id) => {
            setRatingFilter(id as any);
            setShowAllReviews(false);
          }}
          ariaLabel={t('Customer reviews star rating filter', 'স্টার রেটিং ফিল্টার')}
        />
      </div>

      {/* 3. Review Submission Form */}
      <div className="space-y-6">
        <form onSubmit={handleSubmitReview} className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <span className="text-xs font-black text-gray-800 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <MessageCircle size={14} className="text-brand-orange" /> {t('Write a Customer Review', 'একটি রিভিউ লিখুন')}
            </span>
            <span className="text-[10px] text-gray-400 font-bold font-mono">{t('Share your experience', 'আপনার অভিজ্ঞতা শেয়ার করুন')}</span>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-600">{t('Your Rating:', 'আপনার রেটিং:')}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i)}
                      className={`hover:scale-110 transition-transform p-0.5 ${i <= rating ? 'text-brand-orange' : 'text-gray-200 hover:text-orange-200'}`}
                      aria-label={`Rate ${i} stars`}
                    >
                      <Star size={22} fill={i <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <span className="text-xs font-black text-brand-orange font-mono">
                    {rating === 5
                      ? t('5.0 - Excellent', '৫.০ - চমৎকার')
                      : rating === 4
                        ? t('4.0 - Very Good', '৪.০ - খুব ভালো')
                        : rating === 3
                          ? t('3.0 - Average', '৩.০ - মোটামুটি')
                          : `${rating}.0`}
                  </span>
                )}
              </div>

              {!user && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 shrink-0">{t('Your Name:', 'আপনার নাম:')}</span>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={t('e.g. Asif Mahmud', 'যেমন: আসিফ মাহমুদ')}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange/20"
                  />
                </div>
              )}
            </div>

            <textarea 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t(
                'What did you think of the fit, fabric quality, and packaging? Your honest feedback helps other buyers!',
                'পণ্যের মান, ফিট ও প্যাকেজিং কেমন লেগেছে? আপনার সৎ মতামত অন্য ক্রেতাদের সাহায্য করবে!'
              )}
              className="w-full min-h-[90px] p-3.5 bg-gray-50 rounded-xl text-xs md:text-sm border border-gray-200 focus:border-brand-orange focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange/10 transition-all resize-none text-gray-800 placeholder:text-gray-400 font-medium"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  id="img-upload-reviews" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                />
                <label 
                  htmlFor="img-upload-reviews"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all font-mono"
                >
                  <ImageIcon size={13} /> {t('Add Photos', 'ছবি যোগ করুন')} {reviewImages.length > 0 && `(${reviewImages.length}/5)`}
                </label>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !commentText.trim() || rating === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:translate-y-[-1px] disabled:opacity-50 disabled:translate-y-0 transition-all font-mono"
              >
                {isSubmitting ? t('Posting Review...', 'পোস্ট হচ্ছে...') : <><Send size={12} /> {t('Submit Review', 'রিভিউ জমা দিন')}</>}
              </button>
            </div>
            
            {reviewImages.length > 0 && (
              <div className="flex gap-2 pt-2">
                {reviewImages.map((img, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={img} className="w-full h-full object-cover" alt="Review attachment" />
                    <button 
                      type="button"
                      onClick={() => setReviewImages(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* 4. Review List Stream */}
        <div className="space-y-3">
          {sortedReviews.length === 0 ? (
            <div className="py-10 px-4 text-center bg-white rounded-2xl border border-gray-100 space-y-2">
              <Star size={28} className="text-gray-200 mx-auto" />
              <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest font-mono">
                {ratingFilter !== 'all'
                  ? t(`No ${ratingFilter}-star reviews yet`, `${ratingFilter}★ রেটিংয়ের কোনো রিভিউ এখনো নেই`)
                  : t('No written reviews yet', 'এখনো কোনো লিখিত রিভিউ নেই')}
              </h4>
              <p className="text-[11px] text-gray-400">
                {ratingFilter !== 'all'
                  ? t('Try viewing all star ratings or share your own feedback above.', 'সব রেটিং দেখুন অথবা উপরে আপনার নিজস্ব মতামত শেয়ার করুন।')
                  : t('Be the first to share detailed feedback on this item!', 'প্রথম ব্যক্তি হিসেবে এই পণ্য সম্পর্কে বিস্তারিত মতামত দিন!')}
              </p>
              {ratingFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setRatingFilter('all');
                    setShowAllReviews(false);
                  }}
                  className="mt-2 inline-flex items-center px-4 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  {t('Show All Reviews', 'সব রিভিউ দেখুন')}
                </button>
              )}
            </div>
          ) : (
            (() => {
              const visibleReviewList = showAllReviews
                ? sortedReviews
                : sortedReviews.slice(0, INITIAL_VISIBLE_REVIEWS);
              const hasMoreReviews = sortedReviews.length > INITIAL_VISIBLE_REVIEWS;
              const hiddenCount = Math.max(0, sortedReviews.length - INITIAL_VISIBLE_REVIEWS);

              return (
                <div className="space-y-4">
                  <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 shadow-xs px-5 md:px-6">
                    {visibleReviewList.map((review, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i, 4) * 0.04 }}
                        key={review.id} 
                        className="py-5 text-left space-y-2.5"
                      >
                        {/* Rating Row, User & Date */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(j => (
                                  <Star 
                                    key={j} 
                                    size={13} 
                                    className={j <= review.rating ? 'fill-brand-orange text-brand-orange' : 'text-gray-200'} 
                                  />
                                ))}
                              </div>
                              <span className="text-xs font-black text-gray-900 font-mono">
                                {review.rating}.0
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">
                                {maskName(review.userName)}
                              </span>
                              {review.isVerified && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50 font-mono">
                                  <CheckCircle2 size={10} className="text-emerald-600" /> {t('Verified Purchase', 'যাচাইকৃত ক্রেতা')}
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="text-[11px] text-gray-400 font-mono shrink-0">
                            {review.date}
                          </span>
                        </div>

                        {/* Comment Text */}
                        <p className="text-xs text-gray-700 leading-relaxed font-normal whitespace-pre-wrap">
                          {review.comment}
                        </p>

                        {/* Variation attributes */}
                        {(review.color || review.size) && (
                          <div className="text-[10px] text-gray-400 font-mono flex items-center gap-2">
                            {review.color && <span>{t('Variation:', 'ভ্যারিয়েন্ট:')} <strong className="text-gray-600 font-bold">{review.color}</strong></span>}
                            {review.color && review.size && <span>•</span>}
                            {review.size && <span>{t('Size:', 'সাইজ:')} <strong className="text-gray-600 font-bold">{review.size}</strong></span>}
                          </div>
                        )}

                        {/* Images if attached */}
                        {(review.images?.length || 0) > 0 && (
                          <div className="flex gap-2 pt-1 pb-1">
                            {review.images?.map((img, idx) => (
                              <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0 shadow-2xs">
                                <img src={img} className="w-full h-full object-cover" alt="Buyer photo" referrerPolicy="no-referrer" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Official Seller / Merchant Reply */}
                        {review.sellerReply && (
                          <div className="bg-amber-500/5 border-l-2 border-brand-orange p-3 rounded-r-xl space-y-1 mt-2 text-left">
                            <div className="flex items-center justify-between text-[11px] font-bold text-gray-900">
                              <span className="inline-flex items-center gap-1.5 text-brand-orange font-mono">
                                <CheckCircle2 size={13} className="text-brand-orange" /> {t('Official Store Response', 'অফিসিয়াল স্টোর উত্তর')}
                              </span>
                              {review.sellerReplyDate && (
                                <span className="text-[10px] text-gray-400 font-mono font-normal">
                                  {review.sellerReplyDate}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed font-sans">
                              {review.sellerReply}
                            </p>
                          </div>
                        )}

                        {/* Helpful count and options */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <button 
                            onClick={() => toggleHelpful(review.id)}
                            className="inline-flex items-center gap-1.5 text-gray-500 hover:text-brand-orange transition-colors font-mono font-bold"
                          >
                            <ThumbsUp size={12} /> {t('Helpful', 'সহায়ক')} ({review.helpful || 0})
                          </button>

                          {(user?.role === 'admin' || (user && review.userId === user.id) || myReviewIds.includes(review.id)) && (
                            <button
                              onClick={() => {
                                deleteReview(review.id);
                                showToast(t('Review removed', 'রিভিউ মুছে ফেলা হয়েছে'), 'success');
                              }}
                              className="text-[10px] text-rose-500 hover:text-rose-700 font-bold font-mono inline-flex items-center gap-1"
                            >
                              <Trash2 size={11} /> {t('Delete', 'মুছুন')}
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Show All / Show Less Toggle Bar */}
                  {hasMoreReviews && (
                    <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <span className="text-[11px] font-mono tabular-nums text-gray-500">
                        {t(
                          `Showing ${visibleReviewList.length} of ${sortedReviews.length} reviews`,
                          `${sortedReviews.length}টি রিভিউয়ের মধ্যে ${visibleReviewList.length}টি দেখানো হচ্ছে`
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAllReviews(prev => !prev)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-brand-orange/50 text-xs font-black uppercase tracking-wider text-slate-800 hover:text-brand-orange shadow-2xs transition-all duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 font-mono"
                      >
                        {showAllReviews ? (
                          <>
                            <ChevronUp size={15} />
                            <span>{t('Show Less', 'কম দেখুন')}</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown size={15} />
                            <span>{t(`Show All Reviews (${hiddenCount} more)`, `সব রিভিউ দেখুন (আরও ${hiddenCount}টি)`)}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};
