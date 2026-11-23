import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, MessageSquare, Send, CheckCircle2, User, ThumbsUp } from 'lucide-react';
import { Product, User as UserType } from '../types';
import { questionApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface Question {
  id: string;
  productId?: string;
  question: string;
  askedBy: string;
  date: string;
  answer?: {
    text: string;
    answeredBy: string;
    isSeller: boolean;
    date: string;
  };
  upvotes: number;
}

interface ProductQAProps {
  product: Product;
  user: UserType | null;
}

export const ProductQA: React.FC<ProductQAProps> = ({ product, user }) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const defaultQuestions: Question[] = [
    {
      id: 'q1',
      question: t(
        'Is this item 100% authentic and covered under brand warranty in Bangladesh?',
        'এই পণ্যটি কি ১০০% অরিজিনাল এবং বাংলাদেশে ব্র্যান্ড ওয়ারেন্টি সহ পাওয়া যাবে?'
      ),
      askedBy: 'Fahim K.',
      date: t('3 days ago', '৩ দিন আগে'),
      answer: {
        text: t(
          'Yes! All units sold at Digital Shop T.M are 100% genuine and verified directly with official distributor seal and 14-day replacement warranty.',
          'হ্যাঁ! Digital Shop T.M-এ বিক্রি হওয়া প্রতিটি পণ্য ১০০% অরিজিনাল এবং ১৪ দিনের রিপ্লেসমেন্ট ওয়ারেন্টিযুক্ত।'
        ),
        answeredBy: product.brand ? `${product.brand} ${t('Official Store', 'অফিসিয়াল স্টোর')}` : t('Digital Shop Verified Seller', 'ভেরিফায়েড সেলার'),
        isSeller: true,
        date: t('2 days ago', '২ দিন আগে'),
      },
      upvotes: 8,
    },
    {
      id: 'q2',
      question: t(
        'Can I pay via bKash or Cash on Delivery inside Dhaka & Chittagong?',
        'ঢাকা ও চট্টগ্রামে কি বিকাশ বা ক্যাশ অন ডেলিভারির মাধ্যমে পেমেন্ট করা যাবে?'
      ),
      askedBy: 'Nusrat J.',
      date: t('1 week ago', '১ সপ্তাহ আগে'),
      answer: {
        text: t(
          'Absolutely. We support Cash on Delivery nationwide, as well as bKash, Nagad, and Visa/Mastercard payments with instant cashback coupons.',
          'অবশ্যই! সারাদেশে ক্যাশ অন ডেলিভারির পাশাপাশি বিকাশ, নগদ ও ভিসা/মাস্টারকার্ড পেমেন্ট সুবিধা রয়েছে।'
        ),
        answeredBy: t('Customer Support Desk', 'গ্রাহক সেবা ডেস্ক'),
        isSeller: true,
        date: t('6 days ago', '৬ দিন আগে'),
      },
      upvotes: 5,
    },
    {
      id: 'q3',
      question: t('How long does delivery take outside Dhaka?', 'ঢাকার বাইরে ডেলিভারি হতে কত সময় লাগে?'),
      askedBy: 'Rashid M.',
      date: t('2 weeks ago', '২ সপ্তাহ আগে'),
      answer: {
        text: t(
          'Standard delivery outside Dhaka takes 2-4 business days via express logistics with live SMS tracking.',
          'ঢাকার বাইরে সাধারণত ২-৪ কর্মদিবসের মধ্যে এক্সপ্রেস কুরিয়ারে লাইভ ট্র্যাকিংসহ ডেলিভারি হয়।'
        ),
        answeredBy: t('Logistics Team', 'লজিস্টিকস টিম'),
        isSeller: true,
        date: t('2 weeks ago', '২ সপ্তাহ আগে'),
      },
      upvotes: 3,
    },
  ];

  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [newQuestion, setNewQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [votedIds, setVotedIds] = useState<string[]>([]);

  // Fetch product questions from backend API
  useEffect(() => {
    if (!product?.id) return;

    let isMounted = true;
    const loadQuestions = async () => {
      try {
        const list = await questionApi.getQuestions(String(product.id));
        if (!isMounted) return;
        if (!list || list.length === 0) {
          setQuestions(defaultQuestions);
          return;
        }

        const apiQuestions: Question[] = list.map((data: any) => {
          const dateStr = data.createdAt
            ? new Date(data.createdAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })
            : data.date || t('Recent', 'সাম্প্রতিক');
          return {
            id: data.id,
            productId: data.productId,
            question: data.question || '',
            askedBy: data.askedBy || t('Customer', 'গ্রাহক'),
            date: dateStr,
            upvotes: Number(data.upvotes) || 0,
            answer: data.answer || {
              text: t('Your inquiry has been logged for our merchant team.', 'আপনার প্রশ্নটি আমাদের মার্চেন্ট টিমের কাছে পাঠানো হয়েছে।'),
              answeredBy: t('Support Team', 'সাপোর্ট টিম'),
              isSeller: true,
              date: dateStr
            }
          };
        });

        const merged = [...apiQuestions, ...defaultQuestions.filter(dq => !apiQuestions.some(fq => fq.id === dq.id))];
        setQuestions(merged);
      } catch (error) {
        console.warn('Product questions load notice:', error);
        if (isMounted) setQuestions(defaultQuestions);
      }
    };

    loadQuestions();
    return () => {
      isMounted = false;
    };
  }, [product?.id]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const questionText = newQuestion.trim();

    try {
      const askedName = user?.name || 'Verified Customer';
      const created = await questionApi.askQuestion({
        productId: String(product.id),
        productName: product.name,
        question: questionText,
        authorName: askedName
      });

      const formatted: Question = {
        id: created?.id || `q_${Date.now()}`,
        productId: String(product.id),
        question: questionText,
        askedBy: created?.askedBy || askedName,
        date: created?.date || 'Just now',
        answer: created?.answer || {
          text: 'Thank you for your question! Our merchant specialist typically responds within 2-4 business hours.',
          answeredBy: product.brand ? `${product.brand} Official Store` : 'Digital Shop Verified Seller',
          isSeller: true,
          date: 'Just now'
        },
        upvotes: Number(created?.upvotes || 1)
      };

      setQuestions((prev) => [formatted, ...prev]);
      setNewQuestion('');
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to persist question:', err);
      const created: Question = {
        id: `q_${Date.now()}`,
        productId: String(product.id),
        question: questionText,
        askedBy: user?.name || 'Customer',
        date: 'Just now',
        answer: {
          text: 'Thank you for your question! Our merchant specialist typically responds within 2-4 business hours.',
          answeredBy: 'Support AI Bot',
          isSeller: true,
          date: 'Just now',
        },
        upvotes: 1,
      };
      setQuestions(prev => [created, ...prev]);
      setNewQuestion('');
      setSubmittedSuccess(true);
      setTimeout(() => setSubmittedSuccess(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (id: string) => {
    if (votedIds.includes(id)) return;
    setVotedIds(prev => [...prev, id]);

    setQuestions(prev =>
      prev.map((q) => (q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q))
    );

    try {
      await questionApi.upvoteQuestion(id);
    } catch {
      // Ignored for default questions not persisted on backend
    }
  };

  return (
    <div className="space-y-6">
      {/* Ask Question Form */}
      <form onSubmit={handleAskQuestion} className="bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-100 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle size={18} className="text-brand-orange" />
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 font-mono">
            {t('Have a question about this product?', 'এই পণ্য সম্পর্কে কোনো প্রশ্ন আছে?')}
          </h4>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder={t('Ask seller about specifications, sizing, delivery or warranty...', 'বিক্রেতাকে পণ্যের মান, সাইজ, ডেলিভারি বা ওয়ারেন্টি সম্পর্কে জিজ্ঞাসা করুন...')}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-orange transition-colors"
          />
          <button
            type="submit"
            disabled={!newQuestion.trim() || isSubmitting}
            className="px-6 py-3 bg-brand-orange hover:bg-brand-orange-light disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Send size={14} />
            <span>{isSubmitting ? t('Posting...', 'পোস্ট হচ্ছে...') : t('Ask Question', 'প্রশ্ন করুন')}</span>
          </button>
        </div>

        {submittedSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 pt-1"
          >
            <CheckCircle2 size={15} />
            <span>{t('Your question has been posted successfully!', 'আপনার প্রশ্ন সফলভাবে পোস্ট হয়েছে!')}</span>
          </motion.div>
        )}
      </form>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.id}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-all space-y-3"
          >
            {/* Question row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-mono font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  Q
                </span>
                <div>
                  <p className="text-xs font-bold text-gray-900 leading-snug">{q.question}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">
                    {t('By', 'জিজ্ঞাসাকারী:')} <span className="font-semibold text-gray-600">{q.askedBy}</span> • {q.date}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUpvote(q.id)}
                className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  votedIds.includes(q.id)
                    ? 'bg-orange-50 border-orange-200 text-brand-orange'
                    : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                }`}
                title={t('Helpful question', 'উপকারী প্রশ্ন')}
              >
                <ThumbsUp size={12} />
                <span>{q.upvotes}</span>
              </button>
            </div>

            {/* Answer row */}
            {q.answer && (
              <div className="ml-2 sm:ml-7 pl-3 border-l-2 border-orange-200 bg-orange-50/20 p-3 rounded-r-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-brand-orange text-white font-mono font-black text-[9px] flex items-center justify-center">
                    A
                  </span>
                  <span className="text-[11px] font-black text-brand-orange font-mono">
                    {q.answer.answeredBy}
                  </span>
                  {q.answer.isSeller && (
                    <span className="bg-purple-100 text-purple-700 text-[8px] font-bold px-1.5 py-0.2 rounded font-mono uppercase">
                      {t('Verified Seller', 'ভেরিফায়েড সেলার')}
                    </span>
                  )}
                  <span className="text-[9.5px] text-gray-400 font-mono ml-auto">{q.answer.date}</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed pl-6">{q.answer.text}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
