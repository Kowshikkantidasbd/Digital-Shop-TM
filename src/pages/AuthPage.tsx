import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Mail, User, Eye, EyeOff, ShieldCheck, ChevronRight, 
  Phone, Lock, Hash, KeyRound, CheckCircle2, 
  AlertCircle, Sparkles, Award 
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User as UserType } from '../types';
import { useToast } from '../components/Toast';
import { authApi } from '../services/api';
import { authClient } from '../lib/auth-client';
import { isFirebaseConfigured } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export const AuthPage: React.FC<{ onLogin: (user: UserType) => void; initialMode?: 'login' | 'signup' }> = ({ onLogin, initialMode }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { t } = useLanguage();
  
  const modeParam = searchParams.get('mode');
  const [isLogin, setIsLoginState] = useState(() => {
    if (initialMode === 'signup') return false;
    if (modeParam === 'signup' || modeParam === 'register') return false;
    if (modeParam === 'login') return true;
    return true;
  });

  const setIsLogin = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isLogin) : val;
    setIsLoginState(nextVal);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (!nextVal) {
        next.set('mode', 'signup');
      } else {
        next.delete('mode');
      }
      return next;
    });
  };

  useEffect(() => {
    if (modeParam === 'signup' || modeParam === 'register') {
      setIsLoginState(false);
    } else if (modeParam === 'login') {
      setIsLoginState(true);
    }
  }, [modeParam]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [googleEnabled, setGoogleEnabled] = useState(isFirebaseConfigured);

  useEffect(() => {
    authClient.getProviders().then((p) => {
      setGoogleEnabled(Boolean(p?.google) || isFirebaseConfigured);
    }).catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateName = (name: string) => /^[a-zA-Z\s\u0980-\u09FF]+$/.test(name) && name.trim().length >= 2;
  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/\s/g, '');
    return /^(?:\+88|88)?(01[3-9]\d{8})$/.test(cleaned);
  };
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const lastErrorRef = React.useRef<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    let newValue = value;
    let errorMsg = '';

    if (field === 'fullName') {
      if (value && !validateName(value)) {
        errorMsg = t('Please enter a valid name (letters only)', 'অনুগ্রহ করে সঠিক নাম লিখুন (শুধুমাত্র অক্ষর)');
      }
    } else if (field === 'phone') {
      newValue = value.replace(/[^\d+]/g, '').replace(/\s/g, '');
      if (newValue.startsWith('+')) newValue = newValue.slice(0, 14);
      else if (newValue.startsWith('88')) newValue = newValue.slice(0, 13);
      else newValue = newValue.slice(0, 11);

      if (newValue && !validatePhone(newValue)) {
        errorMsg = t('Please provide a valid Bangladeshi mobile number', 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন');
      }
    } else if (field === 'email') {
      if (!isLogin && value && !validateEmail(value)) {
        errorMsg = t('Please enter a valid email address', 'সঠিক ইমেইল ঠিকানা লিখুন');
      }
    } else if (field === 'password' || field === 'confirmPassword') {
      if (value.length > 0 && value.length < 8) {
        errorMsg = t('Password must be at least 8 characters', 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে');
      }
    }

    if (errorMsg && errorMsg !== lastErrorRef.current) {
      showToast(errorMsg, 'error');
      lastErrorRef.current = errorMsg;
    } else if (!errorMsg) {
      lastErrorRef.current = null;
    }

    setFormData(prev => ({ ...prev, [field]: newValue }));
    setErrors(prev => ({ ...prev, [field]: errorMsg }));
    if (errorMsg === '') setError('');
  };

  const isIdentifierValid = isLogin 
    ? formData.email.trim().length >= 3 
    : (formData.email.trim().length > 0 && validateEmail(formData.email));
  
  const isPasswordValid = formData.password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const hasErrors = Object.values(errors).some(err => err !== '');
    if (hasErrors) {
      const msg = t('Please correct the highlighted errors', 'চিহ্নিত ত্রুটিগুলো ঠিক করুন');
      showToast(msg, 'error');
      setError(msg);
      return;
    }

    if (isLogin) {
      const identifier = formData.email.trim();
      if (!identifier) {
        const msg = t('Please enter your email', 'আপনার ইমেইল লিখুন');
        showToast(msg, 'error');
        setError(msg);
        return;
      }
      if (!formData.password) {
        const msg = t('Please enter your password', 'আপনার পাসওয়ার্ড লিখুন');
        showToast(msg, 'error');
        setError(msg);
        return;
      }
      if (formData.password.length < 8) {
        const msg = t('Password must be at least 8 characters', 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে');
        showToast(msg, 'error');
        setError(msg);
        return;
      }
    } else {
      if (!validateName(formData.fullName)) { 
        const msg = t('Please enter your full name', 'আপনার সম্পূর্ণ নাম লিখুন');
        showToast(msg, 'error');
        setError(msg); 
        return; 
      }
      if (!formData.username.trim()) {
        const msg = t('Please choose a username', 'একটি ইউজারনেম লিখুন');
        showToast(msg, 'error');
        setError(msg);
        return;
      }
      if (!validateEmail(formData.email)) { 
        const msg = t('Please enter a valid email address', 'সঠিক ইমেইল ঠিকানা লিখুন');
        showToast(msg, 'error');
        setError(msg); 
        return; 
      }
      if (!validatePhone(formData.phone)) { 
        const msg = t('Please provide a valid Bangladeshi mobile number', 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন');
        showToast(msg, 'error');
        setError(msg); 
        return; 
      }
      if (formData.password.length < 8) { 
        const msg = t('Password must be at least 8 characters', 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে');
        showToast(msg, 'error');
        setError(msg); 
        return; 
      }
      if (formData.password !== formData.confirmPassword) { 
        const msg = t('Passwords do not match', 'পাসওয়ার্ড দুটি মিলছে না');
        showToast(msg, 'error');
        setError(msg); 
        return; 
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const identifier = formData.email.toLowerCase();
        const response = await authApi.login({ identifier, password: formData.password });
        onLogin(response.user);
      } else {
        const response = await authApi.register({
          name: formData.fullName,
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });

        onLogin(response.user);
      }
    } catch (err: any) {
      let message = t('Authentication failed', 'লগইন ব্যর্থ হয়েছে');
      try {
        const parsed = JSON.parse(err.message);
        message = parsed.error || message;
      } catch {
        message = err.message || message;
      }
      
      const lowerMsg = String(message).toLowerCase();
      if (lowerMsg.includes('already exists') || lowerMsg.includes('already registered')) {
        message = t('This email is already registered.', 'এই ইমেইলটি ইতিমধ্যে নিবন্ধিত।');
      } else if (lowerMsg.includes('password') && lowerMsg.includes('short')) {
        message = t('Password must be at least 8 characters.', 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।');
      } else if (lowerMsg.includes('invalid email or password') || lowerMsg.includes('invalid credential')) {
        message = t('Invalid email or password. Please try again.', 'ভুল ইমেইল বা পাসওয়ার্ড। আবার চেষ্টা করুন।');
      }
      
      showToast(message, 'error');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast(t('Please enter your registered email address.', 'আপনার নিবন্ধিত ইমেইল ঠিকানা লিখুন।'), 'error');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(forgotEmail.trim());
      showToast(
        t(
          `A password reset link has been dispatched to ${forgotEmail.trim()}. Check your inbox!`,
          `${forgotEmail.trim()} ঠিকানায় পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইনবক্স চেক করুন!`
        ),
        'success'
      );
      setShowForgotPassword(false);
    } catch (err: any) {
      showToast(err?.message || t('Failed to dispatch password recovery link.', 'পাসওয়ার্ড রিকভারি লিংক পাঠানো যায়নি।'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Firebase Google Sign-In (Popup)
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authClient.signInSocialGoogle('/');
      if (response?.user) {
        showToast(
          t(
            `Welcome back, ${response.user.name || response.user.email}!`,
            `স্বাগতম, ${response.user.name || response.user.email}!`
          ),
          'success'
        );
        onLogin(response.user);
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      const code = String(err?.code || '');
      let msg = err?.message || t('Google sign-in could not be completed.', 'গুগল সাইন-ইন সম্পন্ন করা যায়নি।');
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        msg = t('Google sign-in popup was closed before completing.', 'সম্পন্ন হওয়ার আগেই গুগল সাইন-ইন উইন্ডো বন্ধ করা হয়েছে।');
      } else if (code === 'auth/popup-blocked') {
        msg = t('Popup was blocked by your browser. Please allow popups and try again.', 'ব্রাউজারে পপআপ ব্লক করা আছে। অনুগ্রহ করে পপআপ চালু করে আবার চেষ্টা করুন।');
      } else if (code === 'auth/unauthorized-domain') {
        msg = t('This domain is not authorized for Google Sign-In in Firebase Console.', 'এই ডোমেইনটি Firebase Console-এ গুগল সাইন-ইনের জন্য অনুমোদিত নয়।');
      } else if (code === 'auth/operation-not-allowed') {
        msg = t('Google Sign-In provider is currently disabled in Firebase Authentication.', 'Firebase Authentication-এ গুগল সাইন-ইন প্রোভাইডারটি বর্তমানে বন্ধ আছে।');
      } else if (code === 'auth/network-request-failed') {
        msg = t('Network error while connecting to Google. Please check your internet connection.', 'গুগলের সাথে সংযোগে নেটওয়ার্ক ত্রুটি হয়েছে। ইন্টারনেট সংযোগ পরীক্ষা করুন।');
      } else if (code === 'auth/account-exists-with-different-credential') {
        msg = t('An account already exists with this email using a different sign-in method.', 'এই ইমেইলে অন্য সাইন-ইন পদ্ধতিতে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।');
      }
      showToast(msg, 'error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-3 sm:p-6 font-sans relative overflow-hidden">
      {/* Background Luxury Ambient Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Bar */}
      <div className="w-full max-w-[960px] flex items-center justify-between gap-2 mb-3 sm:mb-5 z-20 relative">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-black text-gray-600 uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:text-brand-orange transition-all group bg-white/90 backdrop-blur-md px-3 sm:px-3.5 py-2 rounded-full border border-gray-200/70 shadow-xs cursor-pointer"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" /> 
          <span>{t('Back to Store', 'স্টোরে ফিরুন')}</span>
        </button>

        <LanguageSwitcher variant="pill" className="shadow-xs shrink-0" />
      </div>

      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-[960px] bg-white rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-gray-100/90 z-10 my-1 sm:my-4"
      >
        {/* Left Panel: Luxury Branding & Visual Upgrade */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-[#0F172A] text-white p-6 sm:p-9 md:p-12 md:w-[42%] lg:w-[44%] shrink-0">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200" 
              alt="Digital Shop T.M Experience"
              loading="lazy"
              decoding="async"
              width="1200"
              height="800"
              className="w-full h-full object-cover opacity-25 mix-blend-overlay scale-105 filter blur-[0.5px]"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5500]/95 via-[#C2410C]/90 to-[#0A0E17]/95" />
            <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-black/40 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 sm:gap-3.5 mb-6 md:mb-10">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#EA580C] via-brand-orange to-[#FBBF24] flex items-center justify-center text-white shadow-xl shadow-orange-500/40 border border-white/25 shrink-0">
                <span className="font-luxury font-black text-2xl tracking-tighter">D</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black tracking-tight text-white font-luxury text-xl sm:text-2xl leading-none">
                    Digital Shop T.M
                  </span>
                  <span className="text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.5 rounded font-mono border border-white/20">
                    OFFICIAL
                  </span>
                </div>
                <span className="font-extrabold uppercase tracking-[0.2em] text-white/75 font-mono text-[8px] sm:text-[8.5px] mt-0.5">
                  Digital Shop T.M
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-[10px] font-bold tracking-wide text-white/95 mb-6">
              <ShieldCheck size={14} className="text-amber-300 shrink-0" />
              <span>{t('256-Bit SSL Encrypted Portal', '২৫৬-বিট SSL সুরক্ষিত পোর্টাল')}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4 leading-[1.15] text-white">
              {t('Welcome to', 'স্বাগতম')} <br />
              <span className="text-amber-200">Digital Shop T.M</span>
            </h2>
            <p className="text-xs sm:text-sm font-normal text-white/90 leading-relaxed max-w-[320px]">
              {t(
                'Sign in to access exclusive deals, track your orders, and shop authentic products across Bangladesh.',
                'বিশেষ অফার উপভোগ করতে, অর্ডার ট্র্যাক করতে এবং সারাদেশে আসল পণ্য কিনতে সাইন ইন করুন।'
              )}
            </p>
          </div>

          <div className="relative z-10 pt-6 mt-6 md:mt-10 border-t border-white/20 hidden md:flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-white/90 text-xs font-semibold">
              <Award size={15} className="text-amber-300 shrink-0" />
              <span>{t('100% Genuine Certified Products', '১০০% আসল ও অনুমোদিত পণ্য')}</span>
            </div>
            <div className="flex items-center gap-2.5 text-white/90 text-xs font-semibold">
              <Sparkles size={15} className="text-amber-300 shrink-0" />
              <span>{t('Live Support & Express Nationwide Delivery', 'লাইভ সাপোর্ট ও সারাদেশে দ্রুত ডেলিভারি')}</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Authentication Form */}
        <div className="flex-1 min-w-0 p-5 sm:p-9 md:p-12 lg:p-14 relative bg-white flex flex-col justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-6 sm:mb-8 pb-4 border-b border-gray-100">
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight font-luxury">
                {isLogin ? t('Member Login', 'সদস্য লগইন') : t('Create Account', 'অ্যাকাউন্ট তৈরি করুন')}
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {isLogin ? t('Enter your credentials to continue shopping', 'শপিং চালিয়ে যেতে আপনার তথ্য দিন') : t('Join our shopping community today', 'আজই আমাদের শপিং কমিউনিটিতে যোগ দিন')}
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs text-gray-400 mr-1.5">
                {isLogin ? t('New member?', 'নতুন সদস্য?') : t('Already member?', 'ইতিমধ্যে অ্যাকাউন্ট আছে?')}
              </span>
              <button 
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-xs text-brand-orange hover:text-orange-600 font-black uppercase tracking-wider hover:underline cursor-pointer"
              >
                {isLogin ? t('Register Here', 'নিবন্ধন করুন') : t('Sign In Here', 'সাইন ইন করুন')}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showForgotPassword ? (
              <motion.div
                key={isLogin ? 'login' : 'signup'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4">
                  {googleEnabled && (
                    <>
                      {/* Continue with Google Button (Better Auth Social OAuth) */}
                      <div className="w-full">
                        <button 
                          type="button" 
                          onClick={handleGoogleLogin}
                          disabled={loading}
                          className="w-full py-3.5 px-4 bg-white border-2 border-gray-200 hover:border-brand-orange/60 rounded-xl text-xs font-black text-gray-800 flex items-center justify-center gap-3 hover:bg-orange-50/20 transition-all shadow-sm active:scale-[0.99] group cursor-pointer disabled:opacity-50"
                        >
                          <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                          </svg>
                          <span>{t('Continue with Google', 'গুগল দিয়ে চালিয়ে যান')}</span>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="relative py-1 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
                          {t('Or with email', 'অথবা ইমেইল দিয়ে')}
                        </span>
                        <div className="flex-1 h-px bg-gray-200" />
                      </div>
                    </>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4.5">
                    {/* Signup Extended Fields */}
                    {!isLogin && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('Full Name', 'সম্পূর্ণ নাম')}</label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                            <User size={16} />
                          </div>
                          <input 
                            type="text"
                            placeholder={t('e.g. Abhimanyu Dey', 'যেমন: তানভীর আহমেদ')}
                            required
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className={`w-full bg-gray-50/70 border ${
                              errors.fullName 
                                ? 'border-rose-500 bg-rose-50/20 focus:ring-rose-500/20' 
                                : formData.fullName && !errors.fullName 
                                  ? 'border-emerald-500/60 focus:ring-emerald-500/15' 
                                  : 'border-gray-200 focus:border-brand-orange focus:ring-brand-orange/15'
                            } rounded-xl pl-10.5 pr-10 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                          />
                          <div className="absolute right-3.5 flex items-center">
                            {formData.fullName && !errors.fullName && <CheckCircle2 size={16} className="text-emerald-500" />}
                            {errors.fullName && <AlertCircle size={16} className="text-rose-500" />}
                          </div>
                        </div>
                        {errors.fullName && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{errors.fullName}</p>}
                      </div>

                      <div>
                        <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('Username', 'ইউজারনেম')}</label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                            <Hash size={16} />
                          </div>
                          <input 
                            type="text"
                            placeholder={t('Unique identifier', 'ইউজারনেম লিখুন')}
                            required
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value.toLowerCase())}
                            className={`w-full bg-gray-50/70 border ${
                              errors.username 
                                ? 'border-rose-500 bg-rose-50/20 focus:ring-rose-500/20' 
                                : formData.username && !errors.username 
                                  ? 'border-emerald-500/60 focus:ring-emerald-500/15' 
                                  : 'border-gray-200 focus:border-brand-orange focus:ring-brand-orange/15'
                            } rounded-xl pl-10.5 pr-10 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                          />
                          <div className="absolute right-3.5 flex items-center">
                            {formData.username && !errors.username && <CheckCircle2 size={16} className="text-emerald-500" />}
                            {errors.username && <AlertCircle size={16} className="text-rose-500" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Identifier / Email Field */}
                  <div>
                    <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                      {t('Email Address', 'ইমেইল ঠিকানা')}
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                        <Mail size={16} />
                      </div>
                      <input 
                        type="email"
                        placeholder={isLogin ? t('Enter your registered email address', 'আপনার নিবন্ধিত ইমেইল লিখুন') : 'name@example.com'}
                        required
                        inputMode="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full bg-gray-50/70 border ${
                          errors.email 
                            ? 'border-rose-500 bg-rose-50/20 focus:ring-rose-500/20' 
                            : isIdentifierValid && !errors.email 
                              ? 'border-emerald-500/60 focus:ring-emerald-500/15' 
                              : 'border-gray-200 focus:border-brand-orange focus:ring-brand-orange/15'
                        } rounded-xl pl-10.5 pr-10 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                      />
                      <div className="absolute right-3.5 flex items-center">
                        {isIdentifierValid && !errors.email && <CheckCircle2 size={16} className="text-emerald-500" />}
                        {errors.email && <AlertCircle size={16} className="text-rose-500" />}
                      </div>
                    </div>
                    {errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{errors.email}</p>}
                  </div>

                  {/* Signup Phone Number */}
                  {!isLogin && (
                    <div>
                      <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('Mobile Number', 'মোবাইল নম্বর')}</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                          <Phone size={16} />
                        </div>
                        <input 
                          type="tel"
                          placeholder="01XXXXXXXXX"
                          required
                          inputMode="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`w-full bg-gray-50/70 border ${
                            errors.phone 
                              ? 'border-rose-500 bg-rose-50/20 focus:ring-rose-500/20' 
                              : formData.phone && !errors.phone 
                                ? 'border-emerald-500/60 focus:ring-emerald-500/15' 
                                : 'border-gray-200 focus:border-brand-orange focus:ring-brand-orange/15'
                          } rounded-xl pl-10.5 pr-10 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                        />
                        <div className="absolute right-3.5 flex items-center">
                          {formData.phone && !errors.phone && <CheckCircle2 size={16} className="text-emerald-500" />}
                          {errors.phone && <AlertCircle size={16} className="text-rose-500" />}
                        </div>
                      </div>
                      {errors.phone && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{errors.phone}</p>}
                    </div>
                  )}

                  {/* Password Field */}
                  <div className={!isLogin ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : ""}>
                    <div>
                      <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('Password', 'পাসওয়ার্ড')}</label>
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                          <Lock size={16} />
                        </div>
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('Minimum 8 characters', 'সর্বনিম্ন ৮ অক্ষর')}
                          required
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className={`w-full bg-gray-50/70 border ${
                            errors.password 
                              ? 'border-rose-500 bg-rose-50/20 focus:ring-rose-500/20' 
                              : isPasswordValid && !errors.password 
                                ? 'border-emerald-500/60 focus:ring-emerald-500/15' 
                                : 'border-gray-200 focus:border-brand-orange focus:ring-brand-orange/15'
                          } rounded-xl pl-10.5 pr-18 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                        />
                        <div className="absolute right-3 flex items-center gap-1.5">
                          {isPasswordValid && !errors.password && (
                            <CheckCircle2 size={15} className="text-emerald-500" />
                          )}
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1 text-gray-400 hover:text-brand-orange transition-colors cursor-pointer"
                            title={showPassword ? t('Hide password', 'পাসওয়ার্ড লুকান') : t('Show password', 'পাসওয়ার্ড দেখুন')}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      {errors.password && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{errors.password}</p>}
                    </div>

                    {!isLogin && (
                      <div>
                        <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('Confirm Password', 'পাসওয়ার্ড নিশ্চিত করুন')}</label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                            <Lock size={16} />
                          </div>
                          <input 
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder={t('Repeat password', 'পুনরায় পাসওয়ার্ড দিন')}
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className={`w-full bg-gray-50/70 border ${
                              formData.confirmPassword && formData.password !== formData.confirmPassword 
                                ? 'border-rose-500 bg-rose-50/20 focus:ring-rose-500/20' 
                                : formData.confirmPassword && formData.password === formData.confirmPassword 
                                  ? 'border-emerald-500/60 focus:ring-emerald-500/15' 
                                  : 'border-gray-200 focus:border-brand-orange focus:ring-brand-orange/15'
                            } rounded-xl pl-10.5 pr-18 py-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                          />
                          <div className="absolute right-3 flex items-center gap-1.5">
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                              <CheckCircle2 size={15} className="text-emerald-500" />
                            )}
                            <button 
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="p-1 text-gray-400 hover:text-brand-orange transition-colors cursor-pointer"
                              title={showConfirmPassword ? t('Hide password', 'পাসওয়ার্ড লুকান') : t('Show password', 'পাসওয়ার্ড দেখুন')}
                            >
                              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Forgot Password Link */}
                  {isLogin && (
                    <div className="flex justify-end pt-0.5">
                      <button 
                        type="button"
                        onClick={() => {
                          setForgotEmail('');
                          setShowForgotPassword(true);
                        }}
                        className="text-xs font-bold text-gray-500 hover:text-brand-orange transition-colors cursor-pointer"
                      >
                        {t('Forgot Password?', 'পাসওয়ার্ড ভুলে গেছেন?')}
                      </button>
                    </div>
                  )}

                  {/* Error Notification */}
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-rose-600 text-xs font-bold p-3 bg-rose-50/80 rounded-xl border border-rose-200 flex items-center gap-2"
                    >
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* Active Primary Brand-Orange Button */}
                  <button 
                    type="submit"
                    disabled={loading}
                    id="auth-submit-btn"
                    className={`w-full py-3.5 sm:py-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all mt-6 cursor-pointer flex items-center justify-center gap-2 ${
                      loading 
                        ? 'bg-orange-500/80 text-white cursor-wait' 
                        : 'bg-gradient-to-r from-brand-orange via-orange-500 to-[#EA580C] hover:from-orange-500 hover:to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-[0.99] border border-orange-400/40'
                    }`}
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>{isLogin ? t('Login to Digital Shop T.M', 'Digital Shop T.M-এ লগইন করুন') : t('Create Account', 'অ্যাকাউন্ট তৈরি করুন')}</span>
                        <ChevronRight size={16} className="shrink-0" />
                      </>
                    )}
                  </button>

                  </form>
                </div>
              </motion.div>
            ) : (
              /* Password Reset Flow */
              <motion.div
                key="forgot"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col"
              >
                <button 
                  type="button" 
                  onClick={() => setShowForgotPassword(false)}
                  className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-brand-orange transition-colors mb-6 cursor-pointer"
                >
                  <ArrowLeft size={15} /> 
                  <span>{t('Back to Login', 'লগইনে ফিরুন')}</span>
                </button>

                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3.5 border border-orange-100 text-brand-orange">
                    <KeyRound size={28} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1.5 font-luxury">{t('Reset Password', 'পাসওয়ার্ড রিসেট করুন')}</h2>
                  <p className="text-xs text-gray-500 font-medium max-w-[280px] mx-auto leading-relaxed">
                    {t(
                      'Enter your registered email address and we will dispatch password recovery instructions.',
                      'আপনার নিবন্ধিত ইমেইল ঠিকানা লিখুন, আমরা পাসওয়ার্ড রিকভারি নির্দেশনা পাঠিয়ে দেব।'
                    )}
                  </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{t('Email Address', 'ইমেইল ঠিকানা')}</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                        <Mail size={16} />
                      </div>
                      <input 
                        type="email"
                        placeholder="user@example.com"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-gray-50/70 border border-gray-200 rounded-xl pl-10.5 pr-4 py-3 text-sm outline-none focus:border-brand-orange focus:bg-white focus:ring-4 focus:ring-brand-orange/15 transition-all font-mono"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-brand-orange to-[#EA580C] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:brightness-105 shadow-md shadow-orange-500/30 transition-all mt-4 cursor-pointer"
                  >
                    {t('Send Recovery Instructions', 'রিকভারি লিংক পাঠান')}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Footer Branding Copyright */}
      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 text-center">
        <span>© {new Date().getFullYear()} Digital Shop T.M</span>
        <span>•</span>
        <span>{t('100% Authentic Products Guaranteed', '১০০% আসল পণ্যের নিশ্চয়তা')}</span>
      </div>
    </div>
  );
};
