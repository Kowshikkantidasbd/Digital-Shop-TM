import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Store, ShieldCheck, CheckCheck } from 'lucide-react';
import { chatApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'seller';
  timestamp: string;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  user?: any;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, sellerName, user }) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect to persistent server chat stream
  useEffect(() => {
    if (!isOpen) return;

    const uid = user?.id || 'guest';
    const sanitizedSeller = (sellerName || 'Merchant').trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const chatId = `chat_${sanitizedSeller}_${uid}`;

    const unsubscribe = chatApi.listenMessages(chatId, (loaded) => {
      const mapped: Message[] = (loaded || []).map((data: any) => ({
        id: data.id || String(Date.now()),
        text: data.text || '',
        sender: data.sender === 'seller' || data.sender === 'admin' || data.senderRole === 'seller' || data.senderRole === 'admin' ? 'seller' : 'user',
        timestamp:
          data.timestamp ||
          new Date(data.createdAt || Date.now()).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })
      }));
      setMessages(mapped);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, sellerName, user?.id, dateLocale]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    const uid = user?.id || 'guest';
    const sanitizedSeller = (sellerName || 'Merchant').trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const chatId = `chat_${sanitizedSeller}_${uid}`;
    const nowStr = new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });

    try {
      const sent = await chatApi.sendMessage(chatId, {
        text,
        sender: 'user',
        senderId: uid,
        senderName: user?.name || 'Customer',
        senderRole: 'customer',
        sellerName,
        customerId: uid,
        customerName: user?.name || 'Customer',
        timestamp: nowStr
      });

      setMessages((prev) => [
        ...prev,
        {
          id: sent?.id || Date.now().toString(),
          text,
          sender: 'user',
          timestamp: nowStr
        }
      ]);
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          text,
          sender: 'user',
          timestamp: nowStr
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg h-[600px] bg-white rounded-2xl overflow-hidden flex flex-col daraz-shadow"
        >
          {/* Header */}
          <div className="bg-brand-orange p-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Store size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">{sellerName}</h3>
                <div className="flex items-center gap-1.5 text-[10px] opacity-90 font-medium">
                  <ShieldCheck size={12} />
                  <span>{t('Verified Merchant Direct Channel', 'যাচাইকৃত বিক্রেতার সরাসরি চ্যানেল')}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-gray-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-brand-orange">
                  <Store size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-800">{t('Direct Chat with', 'সরাসরি চ্যাট করুন:')} {sellerName}</h4>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  {t(
                    'Send a message regarding product inquiry, custom orders, or shipping. Your message will be sent directly to the merchant.',
                    'পণ্য সম্পর্কে জানতে, কাস্টম অর্ডার বা ডেলিভারি সংক্রান্ত যেকোনো বার্তা পাঠান। এটি সরাসরি বিক্রেতার কাছে পৌঁছে যাবে।'
                  )}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-brand-orange text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[9px] text-gray-400 font-mono">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'user' && <CheckCheck size={12} className="text-emerald-500" />}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Delivery notice */}
          {messages.length > 0 && (
            <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-500 text-center font-mono">
              {t('Messages are delivered to the merchant. You will see their reply here once answered.', 'বার্তাটি বিক্রেতার কাছে পৌঁছেছে। উত্তর দিলে এখানে দেখতে পাবেন।')}
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 sm:p-4 bg-white border-t border-gray-100 flex items-center gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('Ask seller about size, stock, or delivery...', 'সাইজ, স্টক বা ডেলিভারি সম্পর্কে জিজ্ঞাসা করুন...')}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-brand-orange focus:bg-white transition-all"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="w-10 h-10 bg-brand-orange text-white rounded-xl flex items-center justify-center hover:bg-brand-orange-light active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer shrink-0 shadow-sm shadow-orange-500/20"
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
