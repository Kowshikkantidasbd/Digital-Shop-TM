import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Search, Send, User, 
  Bot, Clock, MoreVertical, Shield, 
  CheckCircle, Paperclip, Smile, Maximize2, Minimize2,
  Trash2, Ban, Filter, Loader2, AlertCircle, Image as ImageIcon, X
} from 'lucide-react';
import { adminApi, chatApi, uploadApi } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../Toast';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'seller' | 'admin' | 'bot';
  senderId?: string;
  sellerName?: string;
  image?: string;
  createdAt?: any;
  timestamp: string;
}

interface ChatThread {
  id: string;
  customerId?: string;
  userId?: string;
  customerName?: string;
  user?: string;
  sellerName?: string;
  lastMsg?: string;
  lastMessage?: string;
  lastSender?: string;
  status?: string;
  type?: 'ai-assisted' | 'manual' | 'direct';
  time?: string;
  updatedAt?: any;
}

const SEED_CHATS: ChatThread[] = [
  { 
    id: 'chat_merchant_customer1', 
    customerId: 'cust_tanvir_01',
    customerName: 'Tanvir Ahmed',
    sellerName: 'Merchant Support',
    lastMsg: 'Hello! I need help with my order tracking.',
    lastSender: 'user',
    status: 'active',
    type: 'manual',
    time: '2 mins ago'
  },
  { 
    id: 'chat_merchant_customer2', 
    customerId: 'cust_sarah_02',
    customerName: 'Sarah Jenkins',
    sellerName: 'Merchant Support',
    lastMsg: 'When will the Oversized Hoodie be restocked in Large?',
    lastSender: 'user',
    status: 'pending',
    type: 'ai-assisted',
    time: '15 mins ago'
  }
];

const EMOJI_PALETTE = ['👍', '❤️', '😊', '🙏', '🔥', '📦', '⭐', '🛍️', '💯', '👋', '🎉', '✅'];

export const ChatManagement: React.FC = () => {
  const { language, t } = useLanguage();
  const { showToast } = useToast();
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [isMaximized, setIsMaximized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmHeaderAction, setConfirmHeaderAction] = useState<'ban' | 'delete' | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Live sync chats list from backend API
  useEffect(() => {
    let active = true;

    const mapThreads = (rawList: any[]): ChatThread[] =>
      rawList.map((data) => ({
        id: data.id,
        customerId: data.customerId || data.userId || 'customer',
        customerName: data.customerName || data.userName || data.user || t('Customer', 'গ্রাহক'),
        user: data.customerName || data.userName || data.user || t('Customer', 'গ্রাহক'),
        sellerName: data.sellerName || t('Merchant Support', 'মার্চেন্ট সাপোর্ট'),
        lastMsg: data.lastMsg || data.lastMessage || t('Conversation opened', 'কথোপকথন শুরু হয়েছে'),
        lastSender: data.lastSender || 'user',
        status: data.status || 'active',
        type: data.type || 'direct',
        time: data.updatedAt
          ? new Date(data.updatedAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })
          : t('Recent', 'সাম্প্রতিক'),
        updatedAt: data.updatedAt
      }));

    const loadChats = async () => {
      try {
        const remote = await chatApi.getChats();
        if (!active) return;

        if (Array.isArray(remote) && remote.length > 0) {
          const list = mapThreads(remote);
          setChats(list);
          setActiveChatId((prev) => prev || list[0].id);
        } else {
          setChats(SEED_CHATS);
          setActiveChatId((prev) => prev || SEED_CHATS[0].id);
          for (const c of SEED_CHATS) {
            chatApi.sendMessage(c.id, {
              text: c.lastMsg || 'Hello!',
              sender: 'user',
              senderId: c.customerId,
              customerId: c.customerId,
              customerName: c.customerName,
              sellerName: c.sellerName,
              timestamp: '10:45 AM'
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Chats sync warning:', err);
        if (active) {
          setChats(SEED_CHATS);
          setActiveChatId((prev) => prev || SEED_CHATS[0].id);
        }
      } finally {
        if (active) setIsLoadingChats(false);
      }
    };

    loadChats();
    const interval = setInterval(loadChats, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [language]);

  // 2. Live sync messages for active chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    const unsub = chatApi.listenMessages(activeChatId, (rawMsgs) => {
      const msgs: ChatMessage[] = (rawMsgs || []).map((data: any) => ({
        id: data.id,
        text: data.text || '',
        sender: data.sender || 'user',
        senderId: data.senderId,
        sellerName: data.sellerName,
        image: data.imageUrl || data.image,
        createdAt: data.createdAt,
        timestamp:
          data.timestamp ||
          (data.createdAt
            ? new Date(data.createdAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }))
      }));
      setMessages(msgs);
      setIsLoadingMessages(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => unsub();
  }, [activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId) || null;

  const filteredChats = chats.filter(c => {
    const name = (c.customerName || c.user || '').toLowerCase();
    const last = (c.lastMsg || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || last.includes(query);
  });

  // Action: Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = messageText.trim();
    if (!text || !activeChatId || isSending) return;

    setIsSending(true);
    setMessageText('');
    setShowEmojiPicker(false);

    try {
      const nowStr = new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
      const sent = await chatApi.sendMessage(activeChatId, {
        text,
        sender: 'seller',
        senderId: 'admin',
        sellerName: 'Admin Support',
        customerId: activeChat?.customerId,
        customerName: activeChat?.customerName,
        timestamp: nowStr
      });
      if (sent) {
        setMessages((prev) => [...prev, {
          id: sent.id || `msg_${Date.now()}`,
          text,
          sender: 'seller',
          senderId: 'admin',
          sellerName: 'Admin Support',
          timestamp: sent.timestamp || nowStr
        }]);
      }
      setChats((prev) => prev.map((c) => c.id === activeChatId ? { ...c, lastMsg: text, lastSender: 'seller', time: nowStr } : c));
    } catch (err: any) {
      console.error('Failed to send admin message:', err);
      showToast(t('Failed to send message: ', 'বার্তা পাঠাতে ব্যর্থ: ') + (err?.message || ''), 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Action: Ban User
  const handleBanUser = async () => {
    if (!activeChat) return;
    const targetUserId = activeChat.customerId || activeChat.userId;
    const customerName = activeChat.customerName || t('User', 'ব্যবহারকারী');

    try {
      if (targetUserId) {
        await adminApi.updateUser(targetUserId, {
          restricted: true,
          restrictedAt: new Date().toISOString(),
          restrictedBy: 'Admin (Chat Management)'
        }).catch(() => {});
      }

      await chatApi.updateChatSession(activeChat.id, { status: 'restricted' });
      setChats((prev) => prev.map((c) => c.id === activeChat.id ? { ...c, status: 'restricted' } : c));

      setConfirmHeaderAction(null);
      setToastMessage(t(`User ${customerName} has been restricted.`, `${customerName}-কে সীমাবদ্ধ করা হয়েছে।`));
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to restrict user:', err);
      showToast(t('Ban operation failed: ', 'সীমাবদ্ধ করতে ব্যর্থ: ') + (err?.message || ''), 'error');
    }
  };

  // Action: Delete Chat
  const handleDeleteChat = async () => {
    if (!activeChat) return;

    try {
      await chatApi.deleteChatSession(activeChat.id);
      setChats((prev) => prev.filter((c) => c.id !== activeChat.id));
      setConfirmHeaderAction(null);
      setActiveChatId(null);
      setToastMessage(t('Chat thread deleted.', 'চ্যাট থ্রেড মুছে ফেলা হয়েছে।'));
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to delete chat:', err);
      showToast(t('Delete failed: ', 'মুছতে ব্যর্থ: ') + (err?.message || ''), 'error');
    }
  };

  // Action: Attach Image/File
  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChatId) return;

    setIsSending(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let fileUrl = dataUrl;
      try {
        fileUrl = await uploadApi.uploadMedia(file.name, dataUrl);
      } catch {}

      const nowStr = new Date().toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' });
      const label = `[${t('Attachment', 'সংযুক্তি')}: ${file.name}]`;
      const sent = await chatApi.sendMessage(activeChatId, {
        text: label,
        imageUrl: fileUrl,
        sender: 'seller',
        senderId: 'admin',
        sellerName: 'Admin Support',
        customerId: activeChat?.customerId,
        customerName: activeChat?.customerName,
        timestamp: nowStr
      });
      if (sent) {
        setMessages((prev) => [...prev, {
          id: sent.id || `msg_${Date.now()}`,
          text: label,
          image: fileUrl,
          sender: 'seller',
          senderId: 'admin',
          sellerName: 'Admin Support',
          timestamp: sent.timestamp || nowStr
        }]);
      }
      setChats((prev) => prev.map((c) => c.id === activeChatId ? { ...c, lastMsg: label, lastSender: 'seller', time: nowStr } : c));
    } catch (err: any) {
      showToast(t('Attachment failed: ', 'ফাইল যুক্ত করতে ব্যর্থ: ') + (err?.message || ''), 'error');
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setMessageText(prev => prev + emoji);
  };

  return (
    <div className={`flex flex-col transition-all ${
      isMaximized 
        ? 'fixed inset-4 z-50 bg-white rounded-[2.5rem] shadow-2xl p-4' 
        : 'h-[calc(100vh-12rem)]'
    }`}>
      {toastMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)}><X size={14} /></button>
        </div>
      )}

      {/* Hidden file input for Attach button */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileAttach}
        accept="image/*,.pdf,.doc,.docx"
        className="hidden"
      />

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar: Chat List */}
        <div className="w-80 flex flex-col bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow overflow-hidden shrink-0">
          <div className="p-6 border-b border-gray-50 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">{t('Conversations', 'কথোপকথন')}</h3>
                <span className="text-[10px] font-bold text-gray-400 font-mono bg-gray-50 px-2.5 py-1 rounded-full">{chats.length}</span>
             </div>
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-orange transition-colors" size={14} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('Search chats...', 'চ্যাট খুঁজুন...')} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 outline-none text-[10px] font-bold uppercase tracking-widest focus:border-brand-orange transition-all" 
                />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
             {isLoadingChats ? (
               <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                 <Loader2 size={20} className="animate-spin text-brand-orange" />
                 <span className="text-[10px] font-bold uppercase tracking-widest">{t('Loading threads...', 'কথোপকথন লোড হচ্ছে...')}</span>
               </div>
             ) : filteredChats.length === 0 ? (
               <div className="p-8 text-center text-gray-400">
                 <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
                 <p className="text-[10px] font-bold uppercase tracking-widest">{t('No conversations', 'কোনো কথোপকথন নেই')}</p>
               </div>
             ) : (
               filteredChats.map((chat) => {
                 const displayTime = chat.time === '2 mins ago'
                   ? t('2 mins ago', '২ মিনিট আগে')
                   : chat.time === '15 mins ago'
                     ? t('15 mins ago', '১৫ মিনিট আগে')
                     : chat.time;
                 const displayMsg = chat.id === 'chat_merchant_customer1' && chat.lastMsg === 'Hello! I need help with my order tracking.'
                   ? t('Hello! I need help with my order tracking.', 'হ্যালো! আমার অর্ডার ট্র্যাকিং নিয়ে সাহায্য প্রয়োজন।')
                   : chat.id === 'chat_merchant_customer2' && chat.lastMsg === 'When will the Oversized Hoodie be restocked in Large?'
                     ? t('When will the Oversized Hoodie be restocked in Large?', 'ওভারসাইজড হুডির Large সাইজ কবে আবার স্টকে আসবে?')
                     : chat.lastMsg;
                 return (
                 <button
                   key={chat.id}
                   onClick={() => { setActiveChatId(chat.id); setConfirmHeaderAction(null); }}
                   className={`w-full p-5 flex flex-col gap-2 text-left transition-all cursor-pointer ${
                     activeChatId === chat.id ? 'bg-orange-50/50 border-l-4 border-l-brand-orange' : 'hover:bg-gray-50'
                   }`}
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-brand-navy text-white rounded-xl flex items-center justify-center font-black text-[10px] shrink-0">
                             {(chat.customerName || 'U').charAt(0)}
                          </div>
                          <span className="text-xs font-black text-brand-navy truncate max-w-[120px]">{chat.customerName || t('Customer', 'গ্রাহক')}</span>
                       </div>
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{displayTime}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium line-clamp-1 truncate">{displayMsg}</p>
                    <div className="flex items-center justify-between mt-1">
                       <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          chat.status === 'restricted' ? 'bg-rose-100 text-rose-600' :
                          chat.lastSender === 'user' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-brand-navy/10 text-brand-navy'
                       }`}>
                          {chat.status === 'restricted' ? t('Restricted', 'সীমাবদ্ধ') : chat.lastSender === 'user' ? t('Customer', 'গ্রাহক') : t('Admin', 'অ্যাডমিন')}
                       </div>
                       {chat.lastSender === 'user' && <div className="w-2 h-2 bg-brand-orange rounded-full animate-pulse" />}
                    </div>
                 </button>
                 );
               })
             )}
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-gray-100 daraz-shadow overflow-hidden">
          {activeChat ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-navy shadow-sm border border-gray-100 font-black text-xs">
                       {(activeChat.customerName || 'U').charAt(0)}
                    </div>
                    <div>
                       <h3 className="text-sm font-black text-brand-navy uppercase tracking-widest">{activeChat.customerName || t('Customer Support', 'গ্রাহক সেবা')}</h3>
                       <div className="flex items-center gap-2 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${activeChat.status === 'restricted' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {activeChat.status === 'restricted' ? t('User Restricted', 'ব্যবহারকারী সীমাবদ্ধ') : t('Active Channel', 'সক্রিয় চ্যানেল')} · {t('ID:', 'আইডি:')} {activeChat.id}
                          </span>
                       </div>
                    </div>
                 </div>
                 
                 {/* Action Buttons: Maximize, Ban, Delete */}
                 <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsMaximized(!isMaximized)}
                      className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-brand-orange transition-all cursor-pointer shadow-xs"
                      title={isMaximized ? t('Exit Fullscreen', 'পূর্ণ স্ক্রিন বন্ধ') : t('Maximize Chat', 'চ্যাট বড় করুন')}
                    >
                      {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button 
                      onClick={() => setConfirmHeaderAction(confirmHeaderAction === 'ban' ? null : 'ban')}
                      className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-rose-600 transition-all cursor-pointer shadow-xs"
                      title={t('Restrict / Ban User from Placing Orders', 'অর্ডার করা থেকে ব্যবহারকারীকে সীমাবদ্ধ করুন')}
                    >
                      <Ban size={16} />
                    </button>
                    <button 
                      onClick={() => setConfirmHeaderAction(confirmHeaderAction === 'delete' ? null : 'delete')}
                      className="p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-rose-500 transition-all cursor-pointer shadow-xs"
                      title={t('Delete Conversation Thread', 'কথোপকথন মুছুন')}
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
              </div>

              {confirmHeaderAction && (
                <div className="px-6 py-3 bg-rose-50 border-b border-rose-100 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>
                      {confirmHeaderAction === 'ban'
                        ? t(`Restrict user access for ${activeChat.customerName || 'User'}? They will be blocked from checkout.`, `${activeChat.customerName || 'ব্যবহারকারী'}-কে সীমাবদ্ধ করবেন? তারা চেকআউট করতে পারবেন না।`)
                        : t('Delete this chat thread and its conversation history?', 'এই চ্যাট থ্রেড এবং কথোপকথনের ইতিহাস মুছে ফেলবেন?')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => confirmHeaderAction === 'ban' ? handleBanUser() : handleDeleteChat()}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      {t('Confirm', 'নিশ্চিত করুন')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmHeaderAction(null)}
                      className="px-3.5 py-1.5 bg-white text-gray-600 border border-gray-200 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      {t('Cancel', 'বাতিল')}
                    </button>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gray-50/20">
                 {isLoadingMessages ? (
                   <div className="h-full flex items-center justify-center">
                     <Loader2 size={24} className="animate-spin text-brand-orange" />
                   </div>
                 ) : messages.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-gray-400">
                     <MessageSquare size={32} className="opacity-30 mb-2" />
                     <p className="text-xs font-bold uppercase tracking-widest">{t('No messages in this thread yet.', 'এই থ্রেডে এখনো কোনো বার্তা নেই।')}</p>
                   </div>
                 ) : (
                   messages.map((m) => {
                     const isSeller = m.sender === 'seller' || m.sender === 'admin';
                     return (
                       <div 
                         key={m.id}
                         className={`flex flex-col gap-1.5 max-w-[75%] ${isSeller ? 'items-end ml-auto' : 'items-start mr-auto'}`}
                       >
                         <div className={`p-4 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${
                           isSeller 
                             ? 'bg-brand-navy text-white rounded-tr-none' 
                             : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                         }`}>
                           {m.image && (
                             <div className="mb-2 rounded-xl overflow-hidden max-h-48">
                               <img src={m.image} alt={t('Chat attachment', 'চ্যাট সংযুক্তি')} className="w-full h-full object-cover" />
                             </div>
                           )}
                           <p>{m.text}</p>
                         </div>
                         <span className="text-[9px] font-bold text-gray-400 uppercase px-1">
                           {isSeller ? t('Support Agent', 'সাপোর্ট এজেন্ট') : activeChat.customerName} · {m.timestamp}
                         </span>
                       </div>
                     );
                   })
                 )}
                 <div ref={messagesEndRef} />
              </div>

              {/* Emoji Picker Popup */}
              {showEmojiPicker && (
                <div className="p-3 bg-white border-t border-gray-100 flex flex-wrap gap-2">
                  {EMOJI_PALETTE.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddEmoji(emoji)}
                      className="text-lg p-2 hover:bg-gray-100 rounded-xl transition-transform active:scale-90 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-6 border-t border-gray-50 bg-white">
                 <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        showEmojiPicker ? 'bg-orange-50 border-brand-orange text-brand-orange' : 'border-gray-100 text-gray-400 hover:text-brand-orange'
                      }`}
                      title={t('Insert Emoji', 'ইমোজি যোগ করুন')}
                    >
                      <Smile size={18} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl border border-gray-100 text-gray-400 hover:text-brand-orange transition-colors cursor-pointer"
                      title={t('Attach Image or Document', 'ছবি বা ফাইল যুক্ত করুন')}
                    >
                      <Paperclip size={18} />
                    </button>
                    <div className="flex-1 relative group">
                       <input 
                         type="text" 
                         value={messageText}
                         onChange={(e) => setMessageText(e.target.value)}
                         placeholder={t('Reply to customer...', 'গ্রাহককে উত্তর দিন...')} 
                         className="w-full pl-6 pr-12 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-orange transition-all text-xs font-bold text-brand-navy"
                       />
                       <button 
                         type="submit"
                         disabled={!messageText.trim() || isSending}
                         className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-orange text-white p-2 rounded-xl hover:bg-brand-orange/90 transition-all disabled:opacity-30 cursor-pointer"
                       >
                          {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                       </button>
                    </div>
                 </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
               <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-4">
                  <MessageSquare size={32} />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('Select a conversation thread to start chatting', 'চ্যাট শুরু করতে একটি কথোপকথন নির্বাচন করুন')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
