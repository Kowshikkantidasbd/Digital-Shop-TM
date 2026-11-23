import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, X, Send, Bot, 
  Package, Smile, Paperclip, 
  CheckCheck, Mic, ChevronLeft, 
  Trash2, Globe, Download, 
  ImageIcon, FileText, Reply,
  Copy, Forward, Star, Pin,
  Languages, Save, MoreHorizontal,
  SmilePlus, Trash, Check, Square,
  CheckSquare
} from 'lucide-react';
import { Product } from '../types';
import { authClient } from '../lib/auth-client';
import { safeParseJson, apiUrl } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'voice' | 'image' | 'file';
  duration?: string; // for voice
  reactions?: string[];
  isStarred?: boolean;
  isPinned?: boolean;
  isFallback?: boolean;
  translatedContent?: string;
  replyTo?: string; // ID of the message being replied to
}

interface AiProductAssistantProps {
  product: Product;
}

const aiClientCache = new Map<string, string>();

export const AiProductAssistant: React.FC<AiProductAssistantProps> = ({ product }) => {
  const { t, isBangla, language } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [recognition, setRecognition] = useState<any>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    preview: string;
    type: 'image' | 'video' | 'audio' | 'document';
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = 'en-US';

      recog.onstart = () => {
        setIsRecording(true);
        setRecordTime(0);
      };

      recog.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: t('Microphone permission denied. Please allow microphone access in your browser to use voice input.', 'মাইক্রোফোনের অনুমতি পাওয়া যায়নি। ভয়েস ইনপুট ব্যবহার করতে ব্রাউজারে মাইক্রোফোন চালু করুন।'),
            timestamp: new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
            type: 'text'
          }]);
        }
      };

      recog.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput(transcript);
      };

      recog.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recog);
    }
  }, []);

  // Explicitly check for microphone permissions
  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: t('Microphone access is required for voice features. Please enable it in your browser settings.', 'ভয়েস ফিচারের জন্য মাইক্রোফোনের অনুমতি প্রয়োজন। অনুগ্রহ করে ব্রাউজার সেটিংস থেকে চালু করুন।'),
        timestamp: new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
        type: 'text'
      }]);
      return false;
    }
  };

  const startVoiceInput = async () => {
    if (recognition) {
      if (isRecording) {
        try {
          recognition.stop();
        } catch (e) {
          console.error(e);
        }
        setIsRecording(false);
      } else {
        const hasPermission = await requestMicPermission();
        if (!hasPermission) return;

        // Advanced Language Detection: check last user message or default
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content || '';
        
        // Detection for Bangla or Hindi
        if (/[\u0980-\u09FF]/.test(lastUserMessage) || /[\u0900-\u097F]/.test(lastUserMessage)) {
          recognition.lang = 'bn-BD';
        } else {
          recognition.lang = 'en-US';
        }
        
        try {
          recognition.start();
        } catch (e) {
          console.error("Recognition already started", e);
        }
      }
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: t('Voice input requires Chrome or Edge browser support.', 'ভয়েস ইনপুটের জন্য Chrome বা Edge ব্রাউজার প্রয়োজন।'),
        timestamp: new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
        type: 'text'
      }]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: 'image' | 'video' | 'audio' | 'document' = 'document';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    else if (file.type.startsWith('audio/')) type = 'audio';

    const preview = URL.createObjectURL(file);
    setSelectedFile({ file, preview, type });
  };

  // Load messages from localStorage or use default
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(`ai_chat_history_${product.id}`);
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: isBangla
          ? `হ্যালো! আমি আপনার শপিং অ্যাসিস্ট্যান্ট। "${product.name}" সম্পর্কে যেকোনো তথ্যে সাহায্য করতে পারি। কীভাবে সাহায্য করতে পারি?`
          : `Hi! I'm your Shopping Assistant. I can help you with anything related to "${product.name}". How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
        type: 'text'
      }
    ];
  });

  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // New States for Advanced Features
  const [contextMenu, setContextMenu] = useState<{ 
    x: number, 
    y: number, 
    messageId: string,
    top: number,
    left: number,
    containerHeight: number,
    containerWidth: number,
    transformOrigin: string
  } | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // persistence
  useEffect(() => {
    localStorage.setItem(`ai_chat_history_${product.id}`, JSON.stringify(messages));
  }, [messages, product.id]);

  const prevMessagesLength = useRef(messages.length);
  const prevIsTyping = useRef(isTyping);

  // Intelligent Scroll logic
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || isSearching || isMinimized) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    const hasNewMessage = messages.length > prevMessagesLength.current;
    const startedTyping = isTyping && !prevIsTyping.current;

    if (hasNewMessage) {
      const lastMessage = messages[messages.length - 1];
      // Always scroll for new user messages or if already at bottom for AI
      if (lastMessage.role === 'user' || isNearBottom) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto'
        });
      }
    } else if (startedTyping && isNearBottom) {
      // Scroll to show typing indicator if user is at bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'auto'
      });
    }

    prevMessagesLength.current = messages.length;
    prevIsTyping.current = isTyping;
  }, [messages, isTyping, isSearching, isMinimized]);

  // Initial scroll when opening or maximizing
  useEffect(() => {
    if (isOpen && !isMinimized && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, isMinimized]);

  // Recording Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLocalProductResponse = (userMessage: string, p: Product): string => {
    const query = userMessage.toLowerCase().trim();
    const isBangla = /[\u0980-\u09FF]/.test(userMessage) || 
      /\b(dam|koto|taka|tk|khoroch|ferot|ache|kina|asol|bhalo|valo|ki|kivabe|kemne|chole|order)\b/i.test(query);

    const priceNum = Math.round(Number(p.price) || 0);
    const origPriceNum = p.originalPrice ? Math.round(Number(p.originalPrice)) : null;

    // Price query
    if (query.includes('dam') || query.includes('দাম') || query.includes('price') || query.includes('cost') || query.includes('how much') || query.includes('koto') || query.includes('কত') || query.includes('মূল্য')) {
      if (isBangla) {
        return `এই ${p.name}-এর বর্তমান অফার মূল্য ৳${priceNum.toLocaleString()}। ${origPriceNum && origPriceNum > priceNum ? `(নিয়মিত মূল্য ৳${origPriceNum.toLocaleString()}, আপনি পাচ্ছেন ৳${(origPriceNum - priceNum).toLocaleString()} ছাড়!)` : ''} ক্যাশ অন ডেলিভারিতে অর্ডার করতে সরাসরি 'Buy Now' অথবা 'Add to Cart' বাটনে ক্লিক করুন।`;
      }
      return `The current selling price of "${p.name}" is ৳${priceNum.toLocaleString()}.${origPriceNum && origPriceNum > priceNum ? ` (Regular price: ৳${origPriceNum.toLocaleString()} - You save ৳${(origPriceNum - priceNum).toLocaleString()}!)` : ''} You can place your order now with Cash on Delivery!`;
    }

    // Delivery / Shipping
    if (query.includes('delivery') || query.includes('ডেলিভারি') || query.includes('shipping') || query.includes('পৌঁছাবে') || query.includes('চার্জ') || query.includes('charge') || query.includes('kobe') || query.includes('কবে') || query.includes('সময়')) {
      if (isBangla) {
        return `আমাদের স্ট্যান্ডার্ড ডেলিভারি সময় ৩-৫ কার্যদিবস (ঢাকার ভেতর ২৪-৪৮ ঘণ্টার ফাস্ট ডেলিভারি)। ডেলিভারি চার্জ ঢাকার ভেতরে ৳৬০ এবং ঢাকার বাইরে ৳১২০। পণ্যটি হাতে পেয়ে চেক করে Cash on Delivery-তে পেমেন্ট করতে পারবেন।`;
      }
      return `Standard delivery takes 3-5 business days across Bangladesh (Express 24-48 hours within Dhaka). Shipping fee is ৳60 in Dhaka and ৳120 outside Dhaka. Cash on Delivery is available!`;
    }

    // Warranty / Original authenticity
    if (query.includes('warranty') || query.includes('ওয়ারেন্টি') || query.includes('guarantee') || query.includes('গ্যারান্টি') || query.includes('asol') || query.includes('original') || query.includes('আসল') || query.includes('authentic')) {
      if (isBangla) {
        return `হ্যাঁ, এটি ১০০% অরিজিনাল ও অথেনটিক পণ্য। এর সাথে পাচ্ছেন ১২ মাসের অফিসিয়াল ম্যানুফ্যাকচারার ওয়ারেন্টি এবং ৭ দিনের রিটার্ন গ্যারান্টি।`;
      }
      return `Yes, this product is 100% genuine and verified from ${p.brand || 'Digital Shop Official'}. It includes 12 months official warranty and 7 days easy replacement.`;
    }

    // Return policy
    if (query.includes('return') || query.includes('ফেরত') || query.includes('refund') || query.includes('change') || query.includes('রিটার্ন') || query.includes('পাল্টানো')) {
      if (isBangla) {
        return `পণ্যটিতে কোনো ত্রুটি থাকলে অথবা সাইজ/কালার সমস্যা হলে ডেলিভারি পাওয়ার ৭ দিনের মধ্যে সম্পূর্ণ ফ্রিতে রিটার্ন বা এক্সচেঞ্জ করতে পারবেন।`;
      }
      return `We have a 7-day hassle-free return policy. If the item is defective or does not match specifications, you can return or exchange it free of charge within 7 days.`;
    }

    // Stock availability
    if (query.includes('stock') || query.includes('স্টক') || query.includes('available') || query.includes('ache') || query.includes('আছে') || query.includes('পাওয়া')) {
      const stock = p.stock ?? 20;
      if (isBangla) {
        return stock > 0 ? `হ্যাঁ, পণ্যটি স্টকে আছে (মজুদ আছে প্রায় ${stock} টি)। দ্রুত অর্ডার নিশ্চিত করার অনুরোধ করা হচ্ছে!` : `দুঃখিত, এই পণ্যটি সাময়িকভাবে শেষ হয়ে গেছে।`;
      }
      return stock > 0 ? `Yes, this item is currently in stock (${stock} units left). Order soon while supplies last!` : `Sorry, this item is currently out of stock.`;
    }

    // Discount / Offer
    if (query.includes('discount') || query.includes('অফার') || query.includes('offer') || query.includes('ছাড়') || query.includes('কুপন') || query.includes('coupon')) {
      if (origPriceNum && origPriceNum > priceNum) {
        const pct = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
        if (isBangla) return `এই পণ্যে বর্তমানে ${pct}% ছাড় রয়েছে! বর্তমান স্পেশাল মূল্য মাত্র ৳${priceNum.toLocaleString()}।`;
        return `This product has an active ${pct}% discount! Promotional price: ৳${priceNum.toLocaleString()}.`;
      }
      if (isBangla) return `পণ্যটি আকর্ষণীয় অফার মূল্যে ৳${priceNum.toLocaleString()} টাকায় পাওয়া যাচ্ছে। চেকআউটে অতিরিক্ত প্রোমো ডিসকাউন্ট ব্যবহার করতে পারেন।`;
      return `This product is priced at our best offer rate of ৳${priceNum.toLocaleString()}. Apply promo coupons at checkout for extra savings.`;
    }

    // Details / Description
    if (query.includes('detail') || query.includes('spec') || query.includes('বিবরণ') || query.includes('বৈশিষ্ট্য') || query.includes('size') || query.includes('সাইজ') || query.includes('color') || query.includes('রং')) {
      const info = p.details || p.description;
      if (isBangla) return `পণ্যের বিবরণ:\n${info}\nক্যাটাগরি: ${p.category} | রেটিং: ⭐ ${p.rating} (${p.reviews} টি রিভিউ)।`;
      return `Product Specifications:\n${info}\nCategory: ${p.category} | Rating: ⭐ ${p.rating} (${p.reviews} reviews).`;
    }

    // Greetings
    if (query.includes('hi') || query.includes('hello') || query.includes('হাই') || query.includes('হ্যালো') || query.includes('salam') || query.includes('সালাম')) {
      if (isBangla) return `হ্যালো! আসসালামু আলাইকুম। আমি Digital Shop AI শপিং অ্যাসিস্ট্যান্ট। ${p.name} সম্পর্কে দাম, ডেলিভারি, ওয়ারেন্টি বা অর্ডার সংক্রান্ত যেকোনো তথ্য জানতে পারেন।`;
      return `Hello! I am your Digital Shop AI Shopping Specialist for "${p.name}". How can I assist you today?`;
    }

    // Default
    if (isBangla) {
      return `${p.name} সম্পর্কে জানতে চাওয়ার জন্য ধন্যবাদ! এর মূল্য ৳${priceNum.toLocaleString()}। ডেলিভারি ৩-৫ দিন, ৭ দিনের রিটার্ন এবং ১২ মাসের ওয়ারেন্টি পাবেন। আর কোনো প্রশ্ন থাকলে নির্দ্বিধায় জিজ্ঞাসা করুন।`;
    }
    return `Thank you for inquiring about "${p.name}". It is available at ৳${priceNum.toLocaleString()} with 3-5 days delivery, 7 days return guarantee, and 12 months warranty. Let me know if you need any other details!`;
  };

  const tryInstantProductReply = (userMessage: string, p: Product): string | null => {
    const query = userMessage.toLowerCase().trim();
    const isBangla =
      /[\u0980-\u09FF]/.test(userMessage) ||
      /\b(dam|koto|taka|tk|khoroch|ferot|ache|kina|asol|bhalo|valo|ki|kivabe|kemne|chole|order)\b/i.test(query);

    const priceNum = Math.round(Number(p.price) || 0);
    const origPriceNum = p.originalPrice ? Math.round(Number(p.originalPrice)) : null;

    if (
      query.includes('dam') ||
      query.includes('দাম') ||
      query.includes('price') ||
      query.includes('cost') ||
      query.includes('how much') ||
      query.includes('koto') ||
      query.includes('কত') ||
      query.includes('মূল্য')
    ) {
      if (isBangla) {
        return `${p.name}-এর বর্তমান মূল্য ৳${priceNum.toLocaleString()}।${
          origPriceNum && origPriceNum > priceNum
            ? ` (নিয়মিত মূল্য ৳${origPriceNum.toLocaleString()} — সাশ্রয় ৳${(origPriceNum - priceNum).toLocaleString()}!)`
            : ''
        } ক্যাশ অন ডেলিভারি বা বিকাশ/নগদে অর্ডার করতে 'Buy Now' বাটনে ক্লিক করুন।`;
      }
      return `The current price of "${p.name}" is ৳${priceNum.toLocaleString()}.${
        origPriceNum && origPriceNum > priceNum
          ? ` (Regular: ৳${origPriceNum.toLocaleString()} — Save ৳${(origPriceNum - priceNum).toLocaleString()}!)`
          : ''
      } Order now with Cash on Delivery or bKash/Nagad.`;
    }

    if (
      query.includes('delivery') ||
      query.includes('ডেলিভারি') ||
      query.includes('shipping') ||
      query.includes('চার্জ') ||
      query.includes('charge') ||
      query.includes('kobe') ||
      query.includes('কবে')
    ) {
      if (isBangla) {
        return `ঢাকার ভেতরে ডেলিভারি ১-২ দিন (চার্জ ৳৬০) এবং সারা দেশে ২-৪ দিন (চার্জ ৳১২০)। ৳১,৫০০+ অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি ও Cash on Delivery সুবিধা পাবেন!`;
      }
      return `Delivery takes 1-2 days in Dhaka (৳60) and 2-4 days nationwide (৳120). Free delivery on orders above ৳1,500, with Cash on Delivery available!`;
    }

    if (
      query.includes('warranty') ||
      query.includes('ওয়ারেন্টি') ||
      query.includes('guarantee') ||
      query.includes('গ্যারান্টি') ||
      query.includes('asol') ||
      query.includes('original') ||
      query.includes('আসল') ||
      query.includes('authentic')
    ) {
      if (isBangla) {
        return `হ্যাঁ, ${p.name} শতভাগ জেনুইন ও অথেনটিক পণ্য। এর সাথে ১২ মাসের অফিসিয়াল ওয়ারেন্টি এবং ৭ দিনের সহজ রিটার্ন গ্যারান্টি থাকছে।`;
      }
      return `Yes, "${p.name}" is 100% genuine from ${p.brand || 'Digital Shop Official'} with 12 months warranty and 7-day easy replacement.`;
    }

    if (query.includes('return') || query.includes('ফেরত') || query.includes('refund') || query.includes('রিটার্ন')) {
      if (isBangla) {
        return `ডেলিভারি পাওয়ার ৭ দিনের মধ্যে কোনো সমস্যা থাকলে সম্পূর্ণ ফ্রিতে রিটার্ন বা এক্সচেঞ্জ করতে পারবেন।`;
      }
      return `You get a 7-day hassle-free return & exchange guarantee on this product.`;
    }

    if (
      query.includes('stock') ||
      query.includes('স্টক') ||
      query.includes('available') ||
      query.includes('ache') ||
      query.includes('আছে') ||
      query.includes('পাওয়া')
    ) {
      const stock = p.stock ?? 20;
      if (isBangla) {
        return stock > 0
          ? `হ্যাঁ, ${p.name} বর্তমানে স্টকে পাওয়া যাচ্ছে (মজুদ আছে ${stock} টি)! দ্রুত অর্ডার করতে 'Buy Now' চাপুন।`
          : `দুঃখিত, এই পণ্যটি সাময়িকভাবে স্টক আউট রয়েছে।`;
      }
      return stock > 0
        ? `Yes! "${p.name}" is in stock (${stock} units available). Tap Buy Now to order immediately.`
        : `Sorry, this item is currently out of stock.`;
    }

    if (query.includes('color') || query.includes('size') || query.includes('রং') || query.includes('সাইজ')) {
      const colors = p.variants?.colors?.length ? p.variants.colors.join(', ') : '';
      const sizes = p.variants?.sizes?.length ? p.variants.sizes.join(', ') : '';
      if (colors || sizes) {
        return isBangla
          ? `উপলব্ধ ভ্যারিয়েন্ট:${colors ? ` কালার: ${colors}` : ''}${sizes ? ` | সাইজ: ${sizes}` : ''}। পণ্যের পেজ থেকে আপনার পছন্দের অপশন সিলেক্ট করুন।`
          : `Available options:${colors ? ` Colors: ${colors}` : ''}${sizes ? ` | Sizes: ${sizes}` : ''}. Select your preference right above Buy Now!`;
      }
    }

    if (query.includes('discount') || query.includes('অফার') || query.includes('offer') || query.includes('ছাড়') || query.includes('coupon')) {
      if (origPriceNum && origPriceNum > priceNum) {
        const pct = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
        return isBangla
          ? `এই পণ্যে এখন ${pct}% ডিসকাউন্ট চলছে (মূল্য ৳${priceNum.toLocaleString()})! পাশাপাশি চেকআউটে 'WELCOME50' বা 'LUXURY10' কুপনও ব্যবহার করতে পারবেন।`
          : `Enjoy ${pct}% OFF right now (৳${priceNum.toLocaleString()})! Plus apply code 'WELCOME50' or 'LUXURY10' at checkout.`;
      }
    }

    if (/^(hi|hello|hey|salam|assalamu|হ্যালো|হাই|সালাম)[!.\s]*$/i.test(query)) {
      return isBangla
        ? `হ্যালো! আমি ${p.name}-এর AI শপিং অ্যাসিস্ট্যান্ট। দাম, ওয়ারেন্টি, ডেলিভারি বা যেকোনো তথ্য জানতে সাথে সাথে লিখুন!`
        : `Hi! I'm your Shopping Assistant for "${p.name}". Ask anything about price, stock, warranty, or delivery!`;
    }

    return null;
  };

  const getFastIdToken = async (): Promise<string | null> => {
    return authClient.getStoredToken();
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if ((!textToSend.trim() && !selectedFile) || isTyping) return;

    const msgType = selectedFile ? (selectedFile.type === 'image' ? 'image' : 'file') : 'text';
    let messageContent = textToSend;
    if (selectedFile && !textToSend.trim()) {
      messageContent = `Sent a ${selectedFile.type}: ${selectedFile.file.name}`;
    }

    const nowTime = new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: nowTime,
      status: 'read',
      type: msgType,
      replyTo: replyingTo?.id
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setSelectedFile(null);
    setReplyingTo(null);

    const queryText = textToSend || messageContent;
    const cacheKey = `${product.id}:${queryText.trim().toLowerCase()}`;

    // 1. 0ms Instant Local Factual Answer or Client Cache
    const instantAnswer = tryInstantProductReply(queryText, product) || aiClientCache.get(cacheKey);
    if (instantAnswer) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: instantAnswer,
          timestamp: nowTime,
          status: 'read',
          type: 'text',
          isFallback: false
        }
      ]);
      return;
    }

    // 2. Live SSE Streaming AI Response (tokens appear immediately as generated)
    setIsTyping(true);
    const botMsgId = (Date.now() + 1).toString();
    let assistantMessageCreated = false;

    try {
      const idToken = await getFastIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const payloadBody = JSON.stringify({
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.originalPrice,
          category: product.category,
          brand: product.brand,
          stock: product.stock,
          description: product.description,
          details: product.details
        },
        userMessage: queryText,
        history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content }))
      });

      const streamRes = await fetch(apiUrl('/api/gemini/product-chat/stream'), {
        method: 'POST',
        headers,
        body: payloadBody
      });

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const evt of events) {
            if (!evt.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(evt.slice(6));
              if (parsed.chunk) {
                accumulated += parsed.chunk;
                if (!assistantMessageCreated) {
                  assistantMessageCreated = true;
                  setIsTyping(false);
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: botMsgId,
                      role: 'assistant',
                      content: accumulated,
                      timestamp: nowTime,
                      status: 'read',
                      type: 'text',
                      isFallback: false
                    }
                  ]);
                } else {
                  setMessages((prev) =>
                    prev.map((m) => (m.id === botMsgId ? { ...m, content: accumulated } : m))
                  );
                }
              }
            } catch {}
          }
        }

        if (accumulated) {
          aiClientCache.set(cacheKey, accumulated);
          setIsTyping(false);
          return;
        }
      }

      // Non-stream JSON fallback
      const jsonRes = await fetch(apiUrl('/api/gemini/product-chat'), {
        method: 'POST',
        headers,
        body: payloadBody
      });
      if (jsonRes.ok) {
        const data = await safeParseJson(jsonRes, 'AI Chat Service');
        if (data?.reply) {
          aiClientCache.set(cacheKey, data.reply);
          setMessages((prev) => [
            ...prev,
            {
              id: botMsgId,
              role: 'assistant',
              content: data.reply,
              timestamp: nowTime,
              status: 'read',
              type: 'text',
              isFallback: false
            }
          ]);
          setIsTyping(false);
          return;
        }
      }
    } catch {}

    // 3. Final instant local smart fallback if offline
    const localAnswer = getLocalProductResponse(queryText, product);
    setMessages((prev) => [
      ...prev,
      {
        id: botMsgId,
        role: 'assistant',
        content: localAnswer,
        timestamp: nowTime,
        status: 'read',
        type: 'text',
        isFallback: true
      }
    ]);
    setIsTyping(false);
  };

  const getAIResponse = async (userMessage: string): Promise<{ text: string; isFallback: boolean }> => {
    const instant = tryInstantProductReply(userMessage, product);
    if (instant) return { text: instant, isFallback: false };
    try {
      const idToken = await getFastIdToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      const res = await fetch(apiUrl('/api/gemini/product-chat'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          product: { id: product.id, name: product.name, price: product.price, brand: product.brand },
          userMessage,
          history: []
        })
      });
      if (res.ok) {
        const data = await safeParseJson(res, 'AI Chat Service');
        if (data?.reply) return { text: data.reply, isFallback: false };
      }
    } catch {}
    return { text: getLocalProductResponse(userMessage, product), isFallback: true };
  };

  const handleMessageAction = async (action: string, messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    switch (action) {
      case 'copy':
        navigator.clipboard.writeText(message.content);
        break;
      case 'delete':
        setMessages(prev => prev.filter(m => m.id !== messageId));
        break;
      case 'reply':
        setReplyingTo(message);
        break;
      case 'star':
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isStarred: !m.isStarred } : m));
        break;
      case 'pin':
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isPinned: !m.isPinned } : m));
        break;
      case 'translate':
        if (message.translatedContent) {
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, translatedContent: undefined } : m));
        } else {
          setIsTyping(true);
          const translationResult = await getAIResponse(`Translate this to English (or Bangla if it's already English style): "${message.content}". Only output the translated text without quotes.`);
          setMessages(prev => prev.map(m => m.id === messageId ? { ...m, translatedContent: translationResult.text } : m));
          setIsTyping(false);
        }
        break;
      case 'select':
        setIsSelectMode(true);
        setSelectedMessages([messageId]);
        break;
      case 'forward':
        navigator.clipboard?.writeText(message.content);
        break;
      case 'save':
        const blob = new Blob([message.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `message-${messageId}.txt`;
        a.click();
        break;
    }
    setContextMenu(null);
  };

  const handleReaction = (emoji: string, messageId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions || [];
        if (reactions.includes(emoji)) {
          return { ...m, reactions: reactions.filter(r => r !== emoji) };
        }
        return { ...m, reactions: [...reactions, emoji] };
      }
      return m;
    }));
    setContextMenu(null);
  };

  const onMessageContextMenu = (e: React.MouseEvent, messageId: string) => {
    e.preventDefault();
    if (chatContainerRef.current) {
      const rect = chatContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const menuWidth = 220;
      const containerWidth = rect.width;
      const containerHeight = rect.height;
      const menuHeight = Math.min(420, containerHeight * 0.7);

      let top = y;
      let left = x;
      let originX = 'left';
      let originY = 'top';

      if (y + menuHeight > containerHeight) {
        top = Math.max(10, containerHeight - menuHeight - 10);
        originY = 'bottom';
      }

      if (x + menuWidth > containerWidth) {
        left = Math.max(10, containerWidth - menuWidth - 10);
        originX = 'right';
      }

      setContextMenu({ 
        x, 
        y, 
        messageId,
        top,
        left,
        containerHeight,
        containerWidth,
        transformOrigin: `${originX} ${originY}`
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent, messageId: string) => {
    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;
    
    longPressTimer.current = setTimeout(() => {
      if (chatContainerRef.current) {
        const rect = chatContainerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const menuWidth = 220;
        const containerWidth = rect.width;
        const containerHeight = rect.height;
        const menuHeight = Math.min(420, containerHeight * 0.7);

        let top = y;
        let left = x;
        let originX = 'left';
        let originY = 'top';

        if (y + menuHeight > containerHeight) {
          top = Math.max(10, containerHeight - menuHeight - 10);
          originY = 'bottom';
        }

        if (x + menuWidth > containerWidth) {
          left = Math.max(10, containerWidth - menuWidth - 10);
          originX = 'right';
        }

        setContextMenu({ 
          x, 
          y, 
          messageId,
          top,
          left,
          containerHeight,
          containerWidth,
          transformOrigin: `${originX} ${originY}`
        });
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const toggleMessageSelect = (id: string) => {
    setSelectedMessages(prev => 
      prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
    );
  };

  const deleteSelected = () => {
    setMessages(prev => prev.filter(m => !selectedMessages.includes(m.id)));
    setSelectedMessages([]);
    setIsSelectMode(false);
  };

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const suggestedQuestions = isBangla
    ? [
        { text: 'দাম কত?' },
        { text: 'অরিজিনাল ওয়ারেন্টি?' },
        { text: 'এটি কি স্টকে আছে?' },
        { text: 'ডেলিভারি বিস্তারিত?' },
        { text: 'কোন কোন কালার আছে?' }
      ]
    : [
        { text: 'What is the price?' },
        { text: 'Original warranty?' },
        { text: 'Is it in stock?' },
        { text: 'Delivery details?' },
        { text: 'Colors available?' }
      ];

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatContainerRef}
            initial={{ opacity: 0, scale: 0.96, y: 14 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              height: isMinimized ? '64px' : '620px',
              width: '400px'
            }}
            exit={{ opacity: 0, scale: 0.96, y: 14 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="bg-[#f0f2f5] border border-gray-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col shadow-black/20 max-w-[92vw]"
          >
            {/* WhatsApp Header */}
            <div className={`bg-[#075e54] p-3 flex items-center justify-between text-white shrink-0 shadow-md relative z-10 transition-transform duration-300 ${isSearching ? 'translate-y-[-100%]' : ''}`}>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white/20 relative">
                    <img 
                      src={`https://api.dicebear.com/7.x/bottts/svg?seed=${product.id}&backgroundColor=b6e3f4`} 
                      alt="AI" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25d366] rounded-full border-2 border-[#075e54]" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold leading-tight">{t('AI Support Expert', 'এআই শপিং এক্সপার্ট')}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] font-medium opacity-90">{t('Online', 'অনলাইন')}</p>
                    </div>
                  </div>
               </div>
               <div className="flex items-center gap-3 pr-1">
                  <button onClick={() => setIsOpen(false)} className="ml-1 p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X size={18} />
                  </button>
               </div>

               {/* Search Bar Animation Layer */}
               <AnimatePresence>
                 {isSearching && (
                   <motion.div 
                     initial={{ x: '100%' }}
                     animate={{ x: 0 }}
                     exit={{ x: '100%' }}
                     className="absolute inset-0 bg-[#075e54] z-20 flex items-center px-4 gap-3"
                   >
                     <ChevronLeft 
                      onClick={() => {
                        setIsSearching(false);
                        setSearchQuery('');
                      }} 
                      size={24} 
                      className="cursor-pointer" 
                    />
                    <input 
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('Search messages...', 'মেসেজ খুঁজুন...')}
                      className="flex-1 bg-transparent border-none text-white placeholder:text-white/60 outline-none focus:outline-none focus:ring-0 font-medium text-sm"
                    />
                    {searchQuery && (
                      <X 
                        onClick={() => setSearchQuery('')}
                        size={18} 
                        className="cursor-pointer opacity-70" 
                      />
                    )}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {!isMinimized && (
              <>
                {/* Chat Area */}
                <div 
                  ref={scrollRef}
                  onClick={() => {
                    setContextMenu(null);
                    if (isSelectMode && selectedMessages.length === 0) setIsSelectMode(false);
                  }}
                  className="flex-1 overflow-y-auto p-4 space-y-3 relative bg-[#efeae2] custom-scrollbar"
                >
                  {/* Pinned Messages Bar */}
                  {messages.some(m => m.isPinned) && (
                    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100 p-2 rounded-lg mb-2 flex items-center gap-3 shadow-sm">
                      <div className="w-8 h-8 bg-[#075e54]/10 rounded-full flex items-center justify-center">
                        <Pin size={14} className="text-[#075e54] fill-[#075e54]" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('Pinned Message', 'পিন করা মেসেজ')}</p>
                        <p className="text-xs text-gray-700 truncate">
                          {messages.find(m => m.isPinned)?.content}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          const pinnedId = messages.find(m => m.isPinned)?.id;
                          if (pinnedId) {
                            const el = document.getElementById(`msg-${pinnedId}`);
                            el?.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="text-[10px] font-bold text-[#075e54] hover:underline"
                      >
                        {t('VIEW', 'দেখুন')}
                      </button>
                    </div>
                  )}

                  {isSelectMode && (
                    <div className="sticky top-0 z-20 bg-[#075e54]/90 backdrop-blur-md p-2 rounded-lg flex items-center justify-between text-white shadow-lg mb-4">
                      <div className="flex items-center gap-3">
                        <X 
                          size={20} 
                          className="cursor-pointer" 
                          onClick={(e) => { e.stopPropagation(); setIsSelectMode(false); setSelectedMessages([]); }} 
                        />
                        <span className="text-sm font-bold">{selectedMessages.length} {t('Selected', 'নির্বাচিত')}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Star size={18} className="cursor-pointer opacity-80 hover:opacity-100" />
                        <Reply size={18} className="cursor-pointer opacity-80 hover:opacity-100" />
                        <Trash 
                          size={18} 
                          className="cursor-pointer text-red-300 hover:text-red-100" 
                          onClick={(e) => { e.stopPropagation(); deleteSelected(); }} 
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center mb-4">
                    <span className="bg-[#d1e4fc] text-[#54656f] text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-widest">{t('Today', 'আজ')}</span>
                  </div>
                  
                  <div className="bg-[#fff9c4] text-[#54656f] text-[11px] p-2 rounded-lg shadow-sm mb-4 text-center border-b border-yellow-200">
                    <Globe size={12} className="inline-block mr-1 mb-0.5" />
                    {t('Messages are encrypted and AI powered.', 'বার্তাগুলো এনক্রিপ্টেড এবং এআই চালিত।')}
                  </div>

                  {(isSearching ? filteredMessages : messages).map((msg) => {
                    const replyToMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null;
                    const isSelected = selectedMessages.includes(msg.id);

                    return (
                      <div 
                        key={msg.id}
                        id={`msg-${msg.id}`}
                        onContextMenu={(e) => onMessageContextMenu(e, msg.id)}
                        onTouchStart={(e) => handleTouchStart(e, msg.id)}
                        onTouchEnd={handleTouchEnd}
                        onClick={() => isSelectMode && toggleMessageSelect(msg.id)}
                        className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {isSelectMode && (
                          <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#00a884] border-[#00a884]' : 'border-gray-400'
                          }`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                        )}

                        <div className={`relative max-w-[85%] px-3 py-2 text-[13px] shadow-sm group transition-all ${
                          msg.role === 'user' 
                            ? 'bg-[#dcf8c6] text-[#303030] rounded-lg rounded-tr-none' 
                            : 'bg-white text-[#303030] rounded-lg rounded-tl-none'
                        } ${isSelected ? 'ring-2 ring-[#00a884] scale-[0.98]' : ''}`}>
                          <div className={`absolute top-0 w-3 h-3 ${
                            msg.role === 'user' 
                              ? 'right-[-8px] bg-[#dcf8c6] clip-path-right' 
                              : 'left-[-8px] bg-white clip-path-left'
                          }`} />

                          {msg.isPinned && (
                            <div className="absolute -top-2 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100">
                              <Pin size={10} className="text-[#075e54] fill-[#075e54]" />
                            </div>
                          )}

                          {replyToMsg && (
                            <div className={`mb-2 p-2 rounded-md border-l-4 text-[11px] bg-black/5 opacity-80 ${
                              replyToMsg.role === 'user' ? 'border-brand-orange' : 'border-[#075e54]'
                            }`}>
                              <p className="font-bold mb-0.5">{replyToMsg.role === 'user' ? t('You', 'আপনি') : t('Assistant', 'অ্যাসিস্ট্যান্ট')}</p>
                              <p className="truncate line-clamp-1">{replyToMsg.content}</p>
                            </div>
                          )}

                          {msg.type === 'image' && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-black/5 cursor-pointer hover:opacity-90">
                              <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400" alt="Attachment" className="max-w-full h-auto" />
                            </div>
                          )}

                          {msg.type === 'file' && (
                            <div className="mb-2 p-2 bg-black/5 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-black/10 transition-colors">
                              <div className="w-10 h-10 bg-[#075e54] text-white rounded flex items-center justify-center">
                                <Download size={20} />
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <p className="text-[11px] font-bold truncate">document.pdf</p>
                                <p className="text-[9px] opacity-60">1.2 MB • PDF</p>
                              </div>
                            </div>
                          )}
                          
                          {msg.isFallback && (
                            <div className="mb-2 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>{t('Automated Store FAQ (Live AI Offline)', 'স্বয়ংক্রিয় স্টোর উত্তর (লাইভ এআই অফলাইন)')}</span>
                            </div>
                          )}

                          <p className="leading-[1.5] break-words whitespace-pre-wrap">{msg.content}</p>

                          {msg.translatedContent && (
                            <div className="mt-2 pt-2 border-t border-black/5 text-gray-500 italic animate-in fade-in slide-in-from-top-1">
                              <Languages size={10} className="inline mr-1" />
                              {msg.translatedContent}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-end gap-1 mt-1">
                            {msg.isStarred && <Star size={10} className="text-[#eab308] fill-[#eab308]" />}
                            <span className="text-[9px] text-gray-500 font-medium">
                              {msg.timestamp}
                            </span>
                            {msg.role === 'user' && (
                              <CheckCheck 
                                size={12} 
                                className={msg.status === 'read' ? 'text-[#34b7f1]' : 'text-gray-400'} 
                              />
                            )}
                            {msg.role === 'assistant' && (
                              <Bot 
                                size={12} 
                                className="text-gray-400 opacity-40 ml-1" 
                              />
                            )}
                          </div>

                          {/* Reactions */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="absolute -bottom-3 left-2 flex gap-0.5">
                              {msg.reactions.map((r, i) => (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  key={i} 
                                  className="bg-white rounded-full px-1 py-0.5 border border-gray-200 shadow-sm text-[10px] hover:scale-110 cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); handleReaction(r, msg.id); }}
                                >
                                  {r}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 bg-[#075e54]/40 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-[#075e54]/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 bg-[#075e54]/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                  {isSearching && filteredMessages.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-sm text-gray-500 italic">{t('No messages found matching your search.', 'আপনার খোঁজা কোনো মেসেজ পাওয়া যায়নি।')}</p>
                    </div>
                  )}
                </div>

                {/* WhatsApp Input */}
                <div className="bg-[#f0f2f5] p-2 flex flex-col gap-2 border-t border-gray-200">
                  {/* Reply Preview */}
                  <AnimatePresence>
                    {replyingTo && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-white border-l-4 border-[#075e54] p-2 rounded-r-lg shadow-sm mb-1 relative"
                      >
                         <X 
                          size={14} 
                          className="absolute top-2 right-2 text-gray-400 cursor-pointer hover:text-gray-600" 
                          onClick={() => setReplyingTo(null)} 
                        />
                        <p className="text-[10px] font-bold text-[#075e54] uppercase tracking-wider mb-0.5">
                          {t('Replying to', 'উত্তর দেওয়া হচ্ছে:')} {replyingTo.role === 'user' ? t('yourself', 'নিজেকে') : t('Assistant', 'অ্যাসিস্ট্যান্ট')}
                        </p>
                        <p className="text-xs text-gray-500 truncate pr-6">{replyingTo.content}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* File Preview */}
                  <AnimatePresence>
                    {selectedFile && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-white p-3 rounded-xl shadow-lg border border-gray-100 mb-1 flex items-center gap-3"
                      >
                        {selectedFile.type === 'image' ? (
                          <img src={selectedFile.preview} alt="Preview" className="w-12 h-12 rounded object-cover" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                             <Package size={24} />
                          </div>
                        )}
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-bold truncate">{selectedFile.file.name}</p>
                          <p className="text-[10px] text-gray-400">{(selectedFile.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <Trash2 
                          onClick={() => setSelectedFile(null)} 
                          size={18} 
                          className="text-gray-400 hover:text-red-500 cursor-pointer" 
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Suggestions Overlay */}
                  {!input.trim() && !isTyping && !isRecording && !selectedFile && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                      {suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q.text)}
                          className="px-3 py-1.5 bg-white text-[#54656f] border border-gray-200 rounded-full text-[10px] font-black uppercase whitespace-nowrap hover:bg-gray-100 transition-all shadow-sm flex-shrink-0"
                        >
                          {q.text}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                      {isRecording ? (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="flex-1 bg-white rounded-full px-4 py-2.5 flex items-center gap-3 text-red-500"
                        >
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          <div className="flex items-end gap-0.5 h-4 mb-1">
                             {[0.2, 0.5, 0.8, 0.4, 0.9, 0.3, 0.6].map((h, i) => (
                               <motion.div 
                                 key={i}
                                 animate={{ height: [`${h*100}%`, `${(1-h)*100}%`, `${h*100}%`] }}
                                 transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                 className="w-1 bg-[#00a884] rounded-full"
                               />
                             ))}
                          </div>
                          <span className="text-sm font-bold flex-1">{formatTime(recordTime)}</span>
                          <span className="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">{t('Recording...', 'রেকর্ডিং...')}</span>
                          <Trash2 
                            onClick={() => {
                              setIsRecording(false);
                              setRecordTime(0);
                            }} 
                            size={18} 
                            className="text-gray-400 hover:text-red-500 cursor-pointer" 
                          />
                        </motion.div>
                      ) : (
                        <div className="flex-1 flex flex-col relative">
                          <AnimatePresence>
                            {/* Simple Emoji Row */}
                            {input === ' ' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="absolute bottom-full left-0 mb-2 bg-white rounded-full p-2 shadow-xl border border-gray-100 flex gap-2"
                              >
                                {['😀', '😍', '🔥', '👍', '🙏', '❤️'].map(e => (
                                  <button onClick={() => setInput(prev => prev + e)} key={e} className="hover:scale-125 transition-transform text-xl">{e}</button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <div className="flex-1 flex items-center gap-2.5 bg-white rounded-full px-3.5 py-1.5 shadow-sm border border-gray-200 focus-within:border-[#00a884] focus-within:ring-2 focus-within:ring-[#00a884]/20 transition-all">
                            <button
                              type="button"
                              onClick={() => setInput(input === ' ' ? '' : ' ')}
                              aria-label={t('Toggle emoji picker', 'ইমোজি খুলুন')}
                              className={`p-1 rounded-full hover:bg-gray-100 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a884]/40 cursor-pointer transition-colors shrink-0 ${input === ' ' ? 'text-brand-orange' : 'text-[#919191] hover:text-gray-700'}`}
                            >
                              <Smile size={22} />
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              aria-label={t('Attach file', 'ফাইল সংযুক্ত করুন')}
                              className="p-1 rounded-full hover:bg-gray-100 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a884]/40 cursor-pointer text-[#919191] hover:text-gray-700 transition-colors shrink-0"
                            >
                              <Paperclip size={20} className="rotate-45" />
                            </button>
                            <input 
                              type="text"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSend();
                                }
                              }}
                              placeholder={t('Type a message', 'একটি মেসেজ লিখুন')}
                              className="flex-1 min-w-0 border-none px-1 py-2 text-[14px] font-medium text-[#4a4a4a] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 bg-transparent placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                      )}
                    </AnimatePresence>

                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (isRecording) {
                           if (recognition) recognition.stop();
                        } else if (input.trim() || selectedFile) {
                          handleSend();
                        } else {
                          startVoiceInput();
                        }
                      }}
                      className={`w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 flex-shrink-0 relative ${
                        input.trim() || selectedFile 
                          ? 'bg-[#00a884] shadow-[#00a884]/30' 
                          : isRecording 
                            ? 'bg-red-500 shadow-red-500/40 animate-pulse' 
                            : 'bg-[#00a884]'
                      }`}
                    >
                      {input.trim() || selectedFile ? (
                        <Send size={20} className="ml-1" />
                      ) : (
                        <>
                          {isRecording ? <div className="z-10 bg-white w-3 h-3 rounded-sm" /> : <Mic size={20} className="z-10" />}
                          {isRecording && (
                            <motion.div 
                              initial={{ scale: 1, opacity: 0.5 }}
                              animate={{ scale: 1.8, opacity: 0 }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                              className="absolute inset-0 bg-red-500 rounded-full"
                            />
                          )}
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,application/pdf,.doc,.docx"
                />

                {/* Context Menu / Action Selection Overlay */}
                <AnimatePresence>
                  {contextMenu && (
                    <motion.div 
                      key="context-menu"
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      className="absolute z-[200] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col w-[220px] max-h-[70%] sm:max-h-[420px] custom-scrollbar overflow-y-auto"
                      style={{ 
                        left: contextMenu.left,
                        top: contextMenu.top,
                        transformOrigin: contextMenu.transformOrigin
                      }}
                    >
                      {/* Emoji Reactions Row */}
                      <div className="flex justify-between items-center px-4 py-3 bg-gray-50/50 border-b border-gray-100 sticky top-0 bg-white z-10">
                        {['❤️', '👍', '😂', '😮', '😢', '🙏'].map(emoji => (
                          <button 
                            key={emoji} 
                            onClick={() => handleReaction(emoji, contextMenu.messageId)}
                            className="text-xl hover:scale-125 transition-transform"
                          >
                            {emoji}
                          </button>
                        ))}
                        <button 
                          onClick={() => setContextMenu(null)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full transition-colors ml-1"
                        >
                          <SmilePlus size={18} className="text-gray-400" />
                        </button>
                      </div>

                      {/* Menu List */}
                      <div className="py-2">
                        {[
                          { id: 'reply', label: t('Reply', 'উত্তর দিন'), icon: Reply },
                          { id: 'copy', label: t('Copy Content', 'কপি করুন'), icon: Copy },
                          { id: 'star', label: t('Star Message', 'স্টার দিন'), icon: Star },
                          { id: 'forward', label: t('Forward Message', 'ফরওয়ার্ড'), icon: Forward },
                          { id: 'translate', label: t('Translate', 'অনুবাদ'), icon: Languages },
                          { id: 'pin', label: t('Pin Message', 'পিন করুন'), icon: Pin },
                          { id: 'save', label: t('Save Message', 'সংরক্ষণ'), icon: Save },
                          { id: 'select', label: t('Select Message', 'নির্বাচন'), icon: CheckSquare },
                          { id: 'delete', label: t('Delete Message', 'মুছে ফেলুন'), icon: Trash, color: 'text-red-500' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleMessageAction(item.id, contextMenu.messageId)}
                            className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-sm font-medium ${item.color || 'text-gray-700'}`}
                          >
                            <item.icon size={18} className={item.color || 'text-gray-400'} />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp FAB */}
      {!isOpen && (
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-[#25d366] text-white rounded-full flex items-center justify-center shadow-2xl relative z-10 border-2 border-white/20 active:bg-[#128c7e]"
          >
            <MessageCircle size={32} fill="white" />
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-[#25d366] rounded-full z-[-1]"
            />
          </motion.button>
          
          <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-white z-20 flex items-center justify-center text-[10px] font-black text-white shadow-lg animate-bounce">
            1
          </div>

          <div className="absolute bottom-20 right-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-white px-3 py-2 rounded-xl shadow-xl border border-gray-100 whitespace-nowrap">
            <p className="text-[10px] font-black text-brand-navy uppercase tracking-widest leading-none">{t('Need Help?', 'সাহায্য লাগবে?')}</p>
            <p className="text-[9px] text-gray-400 font-bold mt-1">{t('Chat with our AI Expert', 'আমাদের এআই এক্সপার্টের সাথে চ্যাট করুন')}</p>
          </div>
        </div>
      )}

      <style>{`
        .clip-path-right {
          clip-path: polygon(0 0, 0% 100%, 100% 0);
          transform: rotate(90deg);
        }
        .clip-path-left {
          clip-path: polygon(100% 0, 100% 100%, 0 0);
          transform: rotate(-90deg);
        }
      `}</style>
    </div>
  );
};
