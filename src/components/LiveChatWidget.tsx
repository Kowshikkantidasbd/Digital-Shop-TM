import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Sparkles, User, Zap } from 'lucide-react';
import { Product, User as UserType } from '../types';
import { PRODUCTS } from '../constants';
import { DEFAULT_SITE_CONFIG } from '../constants/siteConfig';
import { couponApi, apiUrl } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface LiveChatWidgetProps {
  user: UserType | null;
  products?: Product[];
  onOpenOrders?: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

const chatReplyCache = new Map<string, string>();
let backendWarmedUp = false;

export const LiveChatWidget: React.FC<LiveChatWidgetProps> = ({
  user,
  products,
  onOpenOrders
}) => {
  const { t, isBangla, language } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [liveCoupons, setLiveCoupons] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCatalog = useMemo(
    () => (products && products.length > 0 ? products : PRODUCTS),
    [products]
  );

  const warmUpAi = () => {
    if (backendWarmedUp) return;
    backendWarmedUp = true;
    fetch(apiUrl('/api/gemini/warmup')).catch(() => {});
  };

  useEffect(() => {
    couponApi
      .getPublicCoupons()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setLiveCoupons(res);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      warmUpAi();
    }
  }, [isOpen]);

  const buildGreeting = () =>
    isBangla
      ? `হ্যালো ${user?.name ? user.name.split(' ')[0] : 'বন্ধু'}! Digital Shop T.M-এ স্বাগতম। অর্ডার, কুপন, ডেলিভারি বা যেকোনো পণ্যের দাম জানতে লিখুন — সাথে সাথেই উত্তর পাবেন!`
      : `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! Welcome to Digital Shop T.M. Ask me about any product, price, coupon, or delivery — instant replies 24/7.`;

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem('elora-need-help-chat');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: '1',
        sender: 'bot',
        text: buildGreeting(),
        time: new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('elora-need-help-chat', JSON.stringify(messages.slice(-20)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    const greetingText = buildGreeting();
    setMessages((prev) => prev.map((m) => (m.id === '1' ? { ...m, text: greetingText } : m)));
  }, [isBangla, user?.name]);

  const quickQuestions = [
    t('📦 Track my current order', '📦 আমার বর্তমান অর্ডার ট্র্যাক করুন'),
    t('🎟️ Available promo vouchers', '🎟️ চলমান প্রোমো ভাউচারসমূহ'),
    t('🚚 Delivery times & rates', '🚚 ডেলিভারি সময় ও চার্জ'),
    t('💳 bKash, Nagad & Card pay', '💳 বিকাশ, নগদ ও কার্ড পেমেন্ট')
  ];

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen, messages]);

  const findLocalMatchingProducts = (rawText: string): Product[] => {
    const clean = rawText
      .toLowerCase()
      .replace(/[^\w\s\u0980-\u09FF]/g, ' ')
      .trim();
    const stopWords = new Set([
      'the', 'is', 'a', 'an', 'of', 'for', 'to', 'in', 'with', 'how', 'much', 'what',
      'price', 'cost', 'buy', 'show', 'me', 'find', 'want', 'need', 'have', 'any',
      'dam', 'koto', 'taka', 'tk', 'ache', 'kina', 'ki', 'দাম', 'কত', 'আছে', 'চাই', 'দেখান'
    ]);
    const tokens = clean.split(/\s+/).filter((w) => w.length >= 2 && !stopWords.has(w));
    if (tokens.length === 0) return [];

    const scored: { product: Product; score: number }[] = [];
    for (const p of activeCatalog) {
      if (p.isDeleted) continue;
      const haystack = `${p.name} ${p.brand || ''} ${p.category || ''}`.toLowerCase();
      let score = 0;
      for (const tok of tokens) {
        if (haystack.includes(tok)) {
          score += p.name.toLowerCase().includes(tok) ? 3 : 1;
        }
      }
      if (score > 0) scored.push({ product: p, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map((s) => s.product);
  };

  const getInstantFaqReply = (rawText: string): string | null => {
    const lower = rawText.toLowerCase().trim();
    const useBn =
      isBangla ||
      /[\u0980-\u09FF]/.test(rawText) ||
      /\b(dam|koto|taka|delivery|order|coupon|voucher|return|bkash|nagad|rocket|card|kobe|kothay|help|sahajjo|ache|kinbo)\b/i.test(lower);

    if (lower.includes('track') || lower.includes('order') || lower.includes('অর্ডার') || lower.includes('ট্র্যাক')) {
      return useBn
        ? `আপনার অর্ডার লাইভ ট্র্যাক করতে 'My Orders' মেনু অথবা নিচের Order Tracking সেকশনে অর্ডার আইডি/ফোন নম্বর দিন। ঢাকার ভেতরে ${DEFAULT_SITE_CONFIG.deliveryDaysDhaka} এবং সারা দেশে ${DEFAULT_SITE_CONFIG.deliveryDaysOutside}-এর মধ্যে ডেলিভারি হয়।`
        : `Track orders live in 'My Orders' or Footer Track Order. Dhaka delivery takes ${DEFAULT_SITE_CONFIG.deliveryDaysDhaka} and nationwide takes ${DEFAULT_SITE_CONFIG.deliveryDaysOutside}.`;
    }

    if (
      lower.includes('voucher') ||
      lower.includes('promo') ||
      lower.includes('coupon') ||
      lower.includes('discount') ||
      lower.includes('কুপন') ||
      lower.includes('অফার') ||
      lower.includes('ছাড়')
    ) {
      if (liveCoupons.length > 0) {
        const listStr = liveCoupons
          .slice(0, 4)
          .map((c) => `'${c.code}' (${c.discountType === 'percentage' ? `${c.discount}% off` : `৳${c.discount} off`})`)
          .join(', ');
        return useBn
          ? `🎉 বর্তমানে অ্যাক্টিভ কুপন কোডসমূহ: ${listStr}। চেকআউটে কোড বসিয়ে সাথে সাথেই ডিসকাউন্ট নিন!`
          : `🎉 Active verified coupons: ${listStr}. Apply at checkout for instant savings!`;
      }
      return useBn
        ? "🎉 অ্যাক্টিভ কুপন: 'WELCOME50' (৳৫০ ছাড়), 'LUXURY10' (১০% ছাড়), 'SAVE200' (৳২০০ ছাড়) অথবা 'EID2026' (১৫% ছাড়) ব্যবহার করুন!"
        : "🎉 Active coupons: Use 'WELCOME50' (৳50 off), 'LUXURY10' (10% off), 'SAVE200' (৳200 off above ৳2,000), or 'EID2026' (15% off)!";
    }

    if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange') || lower.includes('রিটার্ন') || lower.includes('ফেরত')) {
      return useBn
        ? `আমাদের ${DEFAULT_SITE_CONFIG.refundGuaranteeDays} দিনের সহজ রিটার্ন ও রিপ্লেসমেন্ট গ্যারান্টি রয়েছে। পণ্যে কোনো সমস্যা থাকলে ফ্রিতে পরিবর্তন বা রিফান্ড পাবেন।`
        : `We offer a ${DEFAULT_SITE_CONFIG.refundGuaranteeDays}-Day Hassle-Free Return & Replacement Policy for all genuine items.`;
    }

    if (lower.includes('delivery') || lower.includes('shipping') || lower.includes('fee') || lower.includes('চার্জ') || lower.includes('ডেলিভারি')) {
      return useBn
        ? `৳${DEFAULT_SITE_CONFIG.freeShippingThreshold.toLocaleString()}+ অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি! স্ট্যান্ডার্ড চার্জ: ঢাকায় ৳${DEFAULT_SITE_CONFIG.deliveryFeeDhaka} (${DEFAULT_SITE_CONFIG.deliveryDaysDhaka}), ঢাকার বাইরে ৳${DEFAULT_SITE_CONFIG.deliveryFeeOutside} (${DEFAULT_SITE_CONFIG.deliveryDaysOutside})।`
        : `Free Delivery on orders above ৳${DEFAULT_SITE_CONFIG.freeShippingThreshold.toLocaleString()}! Standard fee: ৳${DEFAULT_SITE_CONFIG.deliveryFeeDhaka} in Dhaka (${DEFAULT_SITE_CONFIG.deliveryDaysDhaka}) and ৳${DEFAULT_SITE_CONFIG.deliveryFeeOutside} nationwide (${DEFAULT_SITE_CONFIG.deliveryDaysOutside}).`;
    }

    if (lower.includes('bkash') || lower.includes('nagad') || lower.includes('rocket') || lower.includes('card') || lower.includes('cod') || lower.includes('payment') || lower.includes('পেমেন্ট') || lower.includes('বিকাশ') || lower.includes('নগদ') || lower.includes('কার্ড')) {
      return useBn
        ? `আপনি Cash on Delivery (হাতে পেয়ে টাকা), bKash, Nagad, Rocket অথবা Visa/Mastercard (SSLCommerz)-এর মাধ্যমে নিরাপদে পেমেন্ট করতে পারবেন।`
        : `You can pay securely via Cash on Delivery (COD), bKash, Nagad, Rocket, or Visa/Mastercard (SSLCommerz) at checkout.`;
    }

    if (lower.includes('hotline') || lower.includes('contact') || lower.includes('phone') || lower.includes('হটলাইন') || lower.includes('ফোন') || lower.includes('যোগাযোগ')) {
      return useBn
        ? `আমাদের সাপোর্ট হটলাইন: ${DEFAULT_SITE_CONFIG.hotlinePhone} | WhatsApp: ${DEFAULT_SITE_CONFIG.whatsappNumber} (${DEFAULT_SITE_CONFIG.operatingHours})`
        : `Hotline: ${DEFAULT_SITE_CONFIG.hotlinePhone} | WhatsApp: ${DEFAULT_SITE_CONFIG.whatsappNumber} (${DEFAULT_SITE_CONFIG.operatingHours})`;
    }

    if (/^(hi|hello|hey|salam|assalamu|হ্যালো|হাই|সালাম)[!.\s]*$/i.test(lower)) {
      return useBn
        ? `হ্যালো! আসসালামু আলাইকুম। আমি Digital Shop T.M ইনস্ট্যান্ট অ্যাসিস্ট্যান্ট — অর্ডার, কুপন, ডেলিভারি বা যেকোনো পণ্য সম্পর্কে সাথে সাথে জিজ্ঞাসা করুন!`
        : `Hello! I'm your Digital Shop T.M Instant Assistant. Ask me about any product, promo code, delivery rate, or order status!`;
    }

    // 0ms Instant Product Catalog Lookup when the customer mentions a product, brand, price, or stock
    const matches = findLocalMatchingProducts(rawText);
    if (matches.length > 0 && (rawText.split(/\s+/).length <= 7 || /\b(price|dam|koto|stock|buy|show|available|দাম|কত|স্টক|আছে)\b/i.test(lower))) {
      const summary = matches
        .map((p) => `• ${p.name} — ৳${Math.round(Number(p.price) || 0).toLocaleString()} (${(p.stock ?? 10) > 0 ? (useBn ? 'স্টকে আছে' : 'In Stock') : (useBn ? 'স্টক আউট' : 'Out of Stock')})`)
        .join('\n');
      return useBn
        ? `আমাদের স্টোরে এই পণ্যগুলো পাওয়া যাচ্ছে:\n${summary}\n\nযে কোনোটি অর্ডার করতে প্রোডাক্টে ক্লিক করে 'Buy Now' চাপুন!`
        : `Here are the matching items in stock:\n${summary}\n\nClick any item to view details or tap Buy Now for fast delivery!`;
    }

    return null;
  };

  const handleSend = async (textToSend?: string) => {
    const raw = (textToSend || inputValue).trim();
    if (!raw || isTyping) return;

    const nowTime = new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: raw,
      time: nowTime
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');

    // 1. Instant 0ms local FAQ, Catalog & Cache check
    const instantReply = getInstantFaqReply(raw) || chatReplyCache.get(raw.toLowerCase());
    if (instantReply) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: instantReply,
          time: nowTime
        }
      ]);
      if ((raw.toLowerCase().includes('track') || raw.includes('ট্র্যাক')) && onOpenOrders) {
        onOpenOrders();
      }
      return;
    }

    // 2. Ultra-Fast Gemini Flash-Lite Streaming Response with 4.5s timeout safety
    const botId = (Date.now() + 1).toString();
    setIsTyping(true);
    setMessages((prev) => [
      ...prev,
      { id: botId, sender: 'bot', text: '', time: nowTime }
    ]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await fetch(apiUrl('/api/gemini/product-chat/stream'), {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: { id: 'store-concierge', name: 'Digital Shop T.M Storefront' },
          userMessage: raw,
          fastMode: true,
          history: messages.slice(-3).map((m) => ({
            role: m.sender === 'bot' ? 'assistant' : 'user',
            content: m.text
          }))
        })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.chunk) {
                accumulated += payload.chunk;
                setIsTyping(false);
                setMessages((prev) =>
                  prev.map((m) => (m.id === botId ? { ...m, text: accumulated } : m))
                );
              }
            } catch {}
          }
        }

        clearTimeout(timeoutId);
        if (accumulated) {
          chatReplyCache.set(raw.toLowerCase(), accumulated);
          setIsTyping(false);
          return;
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }

    // 3. Fast fallback reply with matched catalog products if network/AI times out
    const matched = findLocalMatchingProducts(raw);
    const catalogLine = matched.length > 0
      ? `\n• ${matched.map((p) => `${p.name}: ৳${Math.round(Number(p.price) || 0).toLocaleString()}`).join('\n• ')}`
      : '';
    const fallback = isBangla
      ? `আপনার বার্তার জন্য ধন্যবাদ! হটলাইন: ${DEFAULT_SITE_CONFIG.hotlinePhone} | ঢাকায় ডেলিভারি: ${DEFAULT_SITE_CONFIG.deliveryDaysDhaka}${catalogLine}`
      : `Thank you for your message! Hotline: ${DEFAULT_SITE_CONFIG.hotlinePhone} | Delivery: ${DEFAULT_SITE_CONFIG.deliveryDaysDhaka} in Dhaka.${catalogLine}`;
    setMessages((prev) =>
      prev.map((m) => (m.id === botId ? { ...m, text: fallback } : m))
    );
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-20 right-4 md:bottom-5 md:right-5 z-[220]">
        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onMouseEnter={warmUpAi}
            onFocus={warmUpAi}
            onClick={() => setIsOpen(true)}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-brand-orange to-amber-500 text-white shadow-xl shadow-orange-500/35 flex items-center justify-center cursor-pointer border-2 border-white"
            aria-label={t('Open Need Help live support chat', 'সাপোর্ট চ্যাট খুলুন')}
            title={t('Need Help? Instant Chat', 'সাহায্য প্রয়োজন? চ্যাট করুন')}
          >
            <MessageCircle size={24} className="sm:w-[26px] sm:h-[26px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xs font-mono">
                {unreadCount}
              </span>
            )}
          </motion.button>
        )}
      </div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="fixed bottom-20 right-3 left-3 md:left-auto md:bottom-5 md:right-5 z-[250] md:w-[380px] h-[min(480px,calc(100dvh-104px))] md:h-[min(520px,calc(100dvh-24px))] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden font-sans"
          >
            {/* Chat Header */}
            <div className="p-4 bg-gradient-to-r from-[#ea580c] via-brand-orange to-[#f59e0b] text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-xs">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight font-display flex items-center gap-1.5">
                    <span>{t('Need Help? Fast AI', 'সাহায্য প্রয়োজন? ফাস্ট AI')}</span>
                  </h4>
                  <p className="text-[10px] text-white/90 font-mono flex items-center gap-1">
                    <Zap size={10} className="text-emerald-300 fill-emerald-300" />
                    <span>{t('Ultra-Fast Support • 24/7 Live', 'সুপার-ফাস্ট সাপোর্ট • ২৪/৭ লাইভ')}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label={t('Close chat', 'চ্যাট বন্ধ করুন')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-3.5 bg-gray-50/60">
              {messages
                .filter((m) => m.text.length > 0)
                .map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="w-7 h-7 rounded-full bg-brand-orange text-white flex items-center justify-center shrink-0 mt-1 shadow-xs text-xs font-black">
                        D
                      </div>
                    )}

                    <div
                      className={`max-w-[78%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                        msg.sender === 'user'
                          ? 'bg-brand-orange text-white rounded-tr-none font-medium'
                          : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                      <div
                        className={`text-[9px] mt-1 text-right font-mono ${
                          msg.sender === 'user' ? 'text-white/70' : 'text-gray-400'
                        }`}
                      >
                        {msg.time}
                      </div>
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-1 shadow-xs text-xs font-bold">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                  <div className="w-7 h-7 rounded-full bg-brand-orange text-white flex items-center justify-center text-xs font-black">
                    D
                  </div>
                  <div className="p-3 bg-white rounded-2xl rounded-tl-none border border-gray-100 flex gap-1 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Inquiry Suggestions */}
            <div className="p-2.5 bg-white border-t border-gray-100 overflow-x-auto whitespace-nowrap no-scrollbar flex gap-1.5 pb-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="text-[10.5px] font-medium bg-gray-50 hover:bg-orange-50 hover:text-brand-orange text-gray-600 px-2.5 py-1.5 rounded-xl border border-gray-200/80 transition-all shrink-0 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-3 bg-white border-t border-gray-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 bg-gray-100/80 rounded-2xl px-3 py-1.5 border border-transparent focus-within:border-brand-orange focus-within:bg-white transition-all"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t('Ask anything (0ms instant)...', 'যেকোনো প্রশ্ন করুন (দ্রুত উত্তর)...')}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-gray-800 placeholder:text-gray-400 py-1.5 font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="w-8 h-8 rounded-xl bg-brand-orange hover:bg-brand-orange-light disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
