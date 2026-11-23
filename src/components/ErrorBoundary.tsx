import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: true
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, copied: false, showDetails: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    if (this.isChunkLoadError(error)) {
      try {
        const key = 'elora_eb_chunk_reload_ts';
        const last = Number(sessionStorage.getItem(key) || '0');
        const now = Date.now();
        if (!last || now - last > 10000) {
          sessionStorage.setItem(key, String(now));
          window.location.reload();
          return;
        }
      } catch {}
    }
    this.setState({ error, errorInfo });
  }

  private handleCopyError = () => {
    try {
      const details = [
        `Error: ${this.state.error?.name || 'Error'}: ${this.state.error?.message || 'Unknown error'}`,
        `Location: ${window.location.href}`,
        `Time: ${new Date().toISOString()}`,
        `Stack:`,
        this.state.error?.stack || 'No stack trace available',
        `Component Stack:`,
        this.state.errorInfo?.componentStack || 'No component stack available'
      ].join('\n\n');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(details);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 3000);
      }
    } catch (e) {
      console.warn('Failed to copy error to clipboard:', e);
    }
  };

  private isChunkLoadError = (err: Error | null) => {
    const msg = (err?.message || '').toLowerCase();
    const stack = (err?.stack || '').toLowerCase();
    return (
      msg.includes('dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('failed to fetch') ||
      ((msg.includes("reading 'useref'") ||
        msg.includes("reading 'usestate'") ||
        msg.includes("reading 'usecontext'") ||
        msg.includes("reading 'useeffect'") ||
        msg.includes("reading 'usememo'")) &&
        stack.includes('.vite/deps'))
    );
  };

  private handleResetCacheAndReload = () => {
    try {
      localStorage.removeItem('admin_sidebar_collapsed');
      localStorage.removeItem('admin_sidebar_width');
      sessionStorage.clear();
    } catch {}
    window.location.reload();
  };

  private handleRecover = () => {
    if (this.isChunkLoadError(this.state.error)) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    if (this.isChunkLoadError(this.state.error)) {
      window.location.href = '/';
      return;
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  public render() {
    if (this.state.hasError) {
      let isBn = false;
      try {
        isBn = localStorage.getItem('elora-lang') === 'bn';
      } catch {}
      const tr = (en: string, bn: string) => (isBn ? bn : en);
      const errorMsg = this.state.error?.message || tr('An unexpected application exception occurred', 'একটি অপ্রত্যাশিত অ্যাপ্লিকেশন ত্রুটি ঘটেছে');
      const errorName = this.state.error?.name || tr('Application Error', 'অ্যাপ্লিকেশন ত্রুটি');

      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans flex items-center justify-center p-6 select-none">
          <div className="max-w-2xl w-full bg-[#12121a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-brand-orange to-amber-500" />
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10">
                <AlertTriangle size={28} />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                  {tr('Runtime Exception Notice', 'রানটাইম ত্রুটি বিজ্ঞপ্তি')}
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mt-1">
                  {tr('Something went wrong', 'দুঃখিত, কিছু একটা সমস্যা হয়েছে')}
                </h2>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              {tr(
                'The application encountered an unexpected runtime issue while rendering this section. You can copy technical diagnostics for reporting, recover the view, or navigate back.',
                'এই অংশটি লোড করার সময় একটি অপ্রত্যাশিত সমস্যা দেখা দিয়েছে। আপনি ত্রুটির বিবরণ কপি করতে, পুনরায় চেষ্টা করতে অথবা হোমপেজে ফিরে যেতে পারেন।'
              )}
            </p>

            {/* Always display technical error summary for transparency and debugging */}
            <div className="p-4 bg-black/50 border border-rose-500/20 rounded-2xl mb-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400">
                  {errorName}
                </span>
                <button
                  type="button"
                  onClick={this.handleCopyError}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
                >
                  {this.state.copied ? tr('✓ Copied to clipboard', '✓ ক্লিপবোর্ডে কপি হয়েছে') : tr('📋 Copy error details', '📋 ত্রুটির বিবরণ কপি করুন')}
                </button>
              </div>

              <p className="text-xs font-mono font-medium text-rose-200 break-words leading-relaxed">
                {errorMsg}
              </p>

              {this.state.error?.stack && (
                <div className="pt-2 border-t border-white/5">
                  <pre className="text-[10px] font-mono text-zinc-500 max-h-36 overflow-y-auto whitespace-pre-wrap leading-tight select-text">
                    {this.state.error.stack.split('\n').slice(0, 8).join('\n')}
                  </pre>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={this.handleRecover}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95"
              >
                <RefreshCw size={14} />
                {tr('Recover View', 'পুনরায় চেষ্টা করুন')}
              </button>

              <button
                type="button"
                onClick={this.handleResetCacheAndReload}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
              >
                <Trash2 size={14} />
                {tr('Reset Cache', 'ক্যাশ রিসেট করুন')}
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
              >
                <Home size={14} />
                {tr('Storefront', 'হোমপেজ')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
