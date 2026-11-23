import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Package,
  User,
  CheckCircle2,
  Download,
  AlertCircle,
  Printer,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  CreditCard,
  Clock,
  Receipt,
  MapPin,
  Phone,
  Mail,
  Search,
  ShoppingBag
} from 'lucide-react';
import { Order } from '../types';
import { useToast } from '../components/Toast';
import { orderApi } from '../services/api';
import { formatMoney } from '../utils/formatMoney';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { CircularLoader } from '../components/CircularLoader';
import { DIVISIONS, DISTRICTS, getUpazilasForDistrict } from '../constants/locations';

interface InvoicePageProps {
  orders: Order[];
}

const FALLBACK_ITEM_SVG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="12" fill="#f3f4f6"/><path d="M24 30l16-8 16 8v20l-16 8-16-8V30z" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linejoin="round"/><path d="M24 30l16 8 16-8M40 38v20" fill="none" stroke="#9ca3af" stroke-width="2.5" stroke-linejoin="round"/></svg>'
  );

// Convert modern CSS colors (oklch, oklab, color-mix, etc.) to standard rgb/hex so html2canvas never fails
function createColorNormalizer() {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  const cache = new Map<string, string>();

  return (cssColor: string, fallback = '#111827'): string => {
    if (!cssColor) return cssColor;
    if (
      !cssColor.includes('oklch') &&
      !cssColor.includes('oklab') &&
      !cssColor.includes('color-mix') &&
      !cssColor.includes('lch(') &&
      !cssColor.includes('lab(')
    ) {
      return cssColor;
    }
    const cached = cache.get(cssColor);
    if (cached) return cached;
    if (!ctx) return fallback;

    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = fallback;
      ctx.fillStyle = cssColor;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      const alpha = +(data[3] / 255).toFixed(3);
      const normalized =
        alpha >= 0.999
          ? `rgb(${data[0]}, ${data[1]}, ${data[2]})`
          : `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${alpha})`;
      cache.set(cssColor, normalized);
      return normalized;
    } catch {
      return fallback;
    }
  };
}

async function toSafeDataUrl(src: string): Promise<string | null> {
  if (!src || src.startsWith('data:')) return src || null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(src, { mode: 'cors', signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function InvoicePage({ orders }: InvoicePageProps) {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const isNewOrderBanner = searchParams.get('new') === '1';
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { language, t } = useLanguage();
  const { siteConfig } = useSiteConfig();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [lookupInput, setLookupInput] = useState('');
  const [qrFailed, setQrFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setQrFailed(false);

    const loadOrder = async () => {
      if (!orderId) {
        if (isMounted) {
          setOrder(null);
          setIsLoading(false);
        }
        return;
      }

      const targetUpper = orderId.trim().toUpperCase();

      // 1. Check local order prop first
      if (orders && orders.length > 0) {
        const found = orders.find(
          (o) =>
            String(o.id).toUpperCase() === targetUpper ||
            `BNK-${String(o.id).slice(0, 8).toUpperCase()}` === targetUpper ||
            `INV-${String(o.id).replace(/[^A-Z0-9]/gi, '').slice(0, 8).toUpperCase()}` === targetUpper
        );
        if (found) {
          if (isMounted) {
            setOrder(found);
            setIsLoading(false);
          }
          return;
        }
      }

      // 2. Fetch from server-side invoice endpoint
      try {
        setIsLoading(true);
        const fetched = await orderApi.getOrderById(orderId);
        if (isMounted) {
          setOrder(fetched || null);
        }
      } catch (err) {
        console.error('Failed to fetch invoice order:', err);
        if (isMounted) setOrder(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId, orders]);

  if (isLoading) {
    return (
      <CircularLoader
        fullScreen
        label={t('Loading Digital Bill...', 'ডিজিটাল বিল লোড হচ্ছে...')}
      />
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-100">
        <div className="fixed top-4 right-4 z-50">
          <LanguageSwitcher variant="pill" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-200/80 max-w-md w-full"
        >
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-5 border border-rose-100">
            <Receipt size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-2">
            {t('Bill / Invoice Not Found', 'বিল বা ইনভয়েস পাওয়া যায়নি')}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mb-6 leading-relaxed">
            {t(
              'We could not find an invoice matching this order ID. You can search another Order ID below or return to the store.',
              'এই অর্ডার আইডির বিপরীতে কোনো বিল খুঁজে পাওয়া যায়নি। নিচে সঠিক অর্ডার আইডি দিয়ে খুঁজুন অথবা স্টোরে ফিরে যান।'
            )}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const clean = lookupInput.trim().replace(/^#/, '');
              if (clean) navigate(`/invoice/${encodeURIComponent(clean)}`);
            }}
            className="flex gap-2 mb-5"
          >
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
                placeholder={t('Enter Order ID (e.g. LSM-...)', 'অর্ডার আইডি লিখুন...')}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-mono font-bold text-gray-800 outline-none focus:border-brand-orange"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              {t('Find', 'খুঁজুন')}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-black transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} /> {t('Back to Store', 'স্টোরে ফিরে যান')}
          </button>
        </motion.div>
      </div>
    );
  }

  const storeName = siteConfig?.siteName || 'Digital Shop T.M';
  const storeAddress =
    siteConfig?.officeAddress ||
    t(
      'Suite 6B, Navana Tower, 45 Gulshan Avenue, Dhaka-1212, Bangladesh',
      'স্যুইট ৬বি, নাভানা টাওয়ার, ৪৫ গুলশান এভিনিউ, ঢাকা-১২১২, বাংলাদেশ'
    );
  const storePhone = siteConfig?.hotlinePhone || '+880 9612-880000';
  const storeEmail = siteConfig?.supportEmail || 'support@digitalshop.com.bd';
  const currency = siteConfig?.currencySymbol || '৳';

  const cleanOrderCode = String(order.id || 'ORDER')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  const memoNumber = `INV-${cleanOrderCode.slice(0, 8)}`;

  const getPublicInvoiceUrl = () => {
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return `${origin}/invoice/${order.id}`;
  };

  const parseSafeDate = (d: any) => {
    if (!d) return new Date();
    if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000);
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  // Safe normalized address (resolves numeric division/district/upazila IDs if not already in fullAddress)
  const rawAddr: any = order.address || (order as any).customer || {};
  const customerName =
    rawAddr.fullName || rawAddr.name || (order as any).customerName || t('Valued Customer', 'সম্মানিত গ্রাহক');
  const customerPhone = rawAddr.phone || (order as any).customerPhone || '';
  const customerEmail = rawAddr.email || (order as any).customerEmail || '';
  const streetLine = String(rawAddr.fullAddress || rawAddr.address || '').trim();
  const resolvedDivision = rawAddr.division
    ? DIVISIONS.find((d) => String(d.id) === String(rawAddr.division))?.name ||
      (!/^\d+$/.test(String(rawAddr.division)) ? String(rawAddr.division) : '')
    : '';
  const resolvedDistrict =
    rawAddr.division && rawAddr.district
      ? (DISTRICTS[String(rawAddr.division)] || []).find((d) => String(d.id) === String(rawAddr.district))?.name ||
        (!/^\d+$/.test(String(rawAddr.district)) ? String(rawAddr.district) : '')
      : rawAddr.district && !/^\d+$/.test(String(rawAddr.district))
      ? String(rawAddr.district)
      : '';
  const resolvedUpazila =
    rawAddr.district && rawAddr.upazila
      ? getUpazilasForDistrict(String(rawAddr.district)).find((u) => String(u.id) === String(rawAddr.upazila))?.name ||
        (!/^\d+$/.test(String(rawAddr.upazila)) ? String(rawAddr.upazila) : '')
      : '';
  const streetLower = streetLine.toLowerCase();
  const customerAddress = [
    streetLine,
    resolvedUpazila && !streetLower.includes(resolvedUpazila.toLowerCase()) ? resolvedUpazila : '',
    resolvedDistrict && !streetLower.includes(resolvedDistrict.toLowerCase()) ? resolvedDistrict : '',
    resolvedDivision && !streetLower.includes(resolvedDivision.toLowerCase()) ? resolvedDivision : ''
  ]
    .filter(Boolean)
    .join(', ');

  // Safe normalized items
  const rawItems: any[] = Array.isArray(order.items) ? order.items : [];
  const safeItems = rawItems.map((item) => {
    const qty = Math.max(1, Math.floor(Number(item?.quantity) || 1));
    const unitPrice = Math.max(0, Number(item?.price ?? item?.product?.price ?? 0));
    const name = item?.name || item?.product?.name || t('Marketplace Item', 'পণ্য');
    const image = item?.image || item?.product?.image || FALLBACK_ITEM_SVG;
    const variantParts = [item?.selectedSize, item?.selectedColor].filter(Boolean);
    return {
      name,
      image,
      quantity: qty,
      price: unitPrice,
      lineTotal: unitPrice * qty,
      variant: variantParts.join(' · ')
    };
  });

  // Accurate financial totals
  const computedItemsSubtotal = safeItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotalAmount =
    order.subtotal !== undefined && order.subtotal !== null ? Number(order.subtotal) : computedItemsSubtotal;
  const deliveryAmount =
    order.deliveryCharge !== undefined && order.deliveryCharge !== null ? Number(order.deliveryCharge) : 0;
  const codFeeAmount = Number((order as any).codFee || 0);
  const baseDeliveryAmount =
    (order as any).baseDeliveryFee !== undefined && (order as any).baseDeliveryFee !== null
      ? Number((order as any).baseDeliveryFee)
      : Math.max(0, deliveryAmount - codFeeAmount);
  const discountAmount = Number(order.discount || 0);
  const netPayable =
    order.total !== undefined && order.total !== null
      ? Number(order.total)
      : Math.max(0, subtotalAmount + deliveryAmount - discountAmount);

  // Status & payment labels
  const paymentMethodKey = String(order.paymentMethod || 'cod').toLowerCase();
  const paymentMethodLabel = (() => {
    switch (paymentMethodKey) {
      case 'cod':
        return t('Cash on Delivery (COD)', 'ক্যাশ অন ডেলিভারি');
      case 'bkash':
        return t('bKash Mobile Wallet', 'বিকাশ মোবাইল ওয়ালেট');
      case 'nagad':
        return t('Nagad Digital Wallet', 'নগদ ডিজিটাল ওয়ালেট');
      case 'rocket':
        return t('Rocket Mobile Banking', 'রকেট মোবাইল ব্যাংকিং');
      case 'card':
        return `${order.cardBrand ? `${order.cardBrand} ` : ''}${t('Card', 'কার্ড')}${
          order.cardLast4 ? ` •••• ${order.cardLast4}` : ''
        }`;
      default:
        return order.paymentMethod || t('Digital Payment', 'ডিজিটাল পেমেন্ট');
    }
  })();

  const orderStatusKey = String(order.status || 'pending').toLowerCase();
  const orderStatusLabel = (() => {
    switch (orderStatusKey) {
      case 'pending':
        return t('Pending', 'অপেক্ষমান');
      case 'confirmed':
        return t('Confirmed', 'নিশ্চিত');
      case 'processing':
      case 'packed':
        return t('Processing', 'প্রক্রিয়াধীন');
      case 'shipped':
      case 'out-for-delivery':
        return t('Shipped', 'পথে আছে');
      case 'delivered':
      case 'completed':
        return t('Delivered', 'ডেলিভারি সম্পন্ন');
      case 'cancelled':
        return t('Cancelled', 'বাতিল');
      default:
        return order.status || t('Pending', 'অপেক্ষমান');
    }
  })();

  const paymentStatusKey = String(order.paymentStatus || (paymentMethodKey === 'cod' ? 'unpaid' : 'paid')).toLowerCase();
  const isPaid = paymentStatusKey === 'paid' || orderStatusKey === 'delivered' || orderStatusKey === 'completed';
  const isCancelled = orderStatusKey === 'cancelled';

  const paidAmount = isPaid && !isCancelled ? netPayable : 0;
  const dueAmount = isCancelled ? 0 : Math.max(0, netPayable - paidAmount);

  const publicUrl = getPublicInvoiceUrl();
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
    publicUrl
  )}&color=111827&margin=2&bgcolor=FFFFFF`;
  const dateLocale = language === 'bn' ? 'bn-BD' : 'en-US';
  const formattedOrderDate = parseSafeDate(order.createdAt).toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const handleCopy = async (text: string, which: 'id' | 'link') => {
    try {
      await navigator.clipboard?.writeText(text);
      if (which === 'id') {
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 1800);
        showToast(t('Memo ID copied!', 'মেমো আইডি কপি হয়েছে!'), 'success');
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1800);
        showToast(t('Bill link copied!', 'বিলের লিংক কপি হয়েছে!'), 'success');
      }
    } catch {
      showToast(t('Unable to copy to clipboard', 'কপি করা সম্ভব হয়নি'), 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const element = document.getElementById('invoice-container');
    if (!element || !order) {
      showToast(t('Bill data not available.', 'বিলের তথ্য পাওয়া যায়নি।'), 'error');
      return;
    }

    setIsDownloading(true);
    showToast(t('Generating PDF bill...', 'পিডিএফ বিল তৈরি হচ্ছে...'), 'info');

    try {
      // Preload external images (QR + product thumbnails) as safe data URLs to avoid CORS canvas taint
      const imgElements = Array.from(element.querySelectorAll('img'));
      const dataUrlMap = new Map<string, string>();

      await Promise.all(
        imgElements.map(async (img) => {
          const src = img.getAttribute('src') || '';
          if (!src || src.startsWith('data:') || dataUrlMap.has(src)) return;
          const dataUrl = await toSafeDataUrl(src);
          dataUrlMap.set(src, dataUrl || FALLBACK_ITEM_SVG);
        })
      );

      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);

      const normalizeColor = createColorNormalizer();

      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
        onclone: (clonedDoc) => {
          // 1. Hide interactive/non-print toolbars
          clonedDoc.querySelectorAll('.download-hidden-actions, .download-hidden-topbar').forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });

          // 2. Force desktop table layout in PDF even when downloaded from a 375px mobile screen
          clonedDoc.querySelectorAll('.pdf-mobile-only').forEach((el) => {
            (el as HTMLElement).style.display = 'none';
          });
          clonedDoc.querySelectorAll('.pdf-desktop-only').forEach((el) => {
            (el as HTMLElement).style.display = 'block';
          });

          // 3. Sanitize Tailwind v4 oklch() / oklab() rules inside <style> tags
          clonedDoc.querySelectorAll('style').forEach((styleTag) => {
            if (styleTag.textContent && /oklch|oklab|color-mix/.test(styleTag.textContent)) {
              styleTag.textContent = styleTag.textContent
                .replace(/oklch\([^)]*\)/g, '#f97316')
                .replace(/oklab\([^)]*\)/g, '#111827')
                .replace(/color-mix\([^)]*\)/g, '#f3f4f6');
            }
          });

          // 4. Replace external images with safe base64 data URLs inside the clone
          clonedDoc.querySelectorAll('#invoice-container img').forEach((imgEl) => {
            const origSrc = imgEl.getAttribute('src') || '';
            if (origSrc && dataUrlMap.has(origSrc)) {
              imgEl.setAttribute('src', dataUrlMap.get(origSrc) || FALLBACK_ITEM_SVG);
            }
          });

          // 5. Set consistent A4 capture width and normalize every computed oklch/oklab color inline
          const container = clonedDoc.getElementById('invoice-container');
          if (container) {
            container.style.width = '794px';
            container.style.maxWidth = '794px';
            container.style.boxShadow = 'none';
            container.style.borderRadius = '0';
            container.style.border = 'none';
            container.style.height = 'auto';
            container.style.minHeight = 'auto';

            const allNodes = [container, ...Array.from(container.querySelectorAll('*'))] as HTMLElement[];
            for (const node of allNodes) {
              const cs = clonedDoc.defaultView?.getComputedStyle(node);
              if (!cs) continue;

              const color = normalizeColor(cs.color, '#111827');
              const bg = normalizeColor(cs.backgroundColor, 'transparent');
              const borderTop = normalizeColor(cs.borderTopColor, '#e5e7eb');
              const borderRight = normalizeColor(cs.borderRightColor, '#e5e7eb');
              const borderBottom = normalizeColor(cs.borderBottomColor, '#e5e7eb');
              const borderLeft = normalizeColor(cs.borderLeftColor, '#e5e7eb');

              if (color) node.style.color = color;
              if (bg && bg !== 'rgba(0, 0, 0, 0)') node.style.backgroundColor = bg;
              if (borderTop) node.style.borderTopColor = borderTop;
              if (borderRight) node.style.borderRightColor = borderRight;
              if (borderBottom) node.style.borderBottomColor = borderBottom;
              if (borderLeft) node.style.borderLeftColor = borderLeft;

              if (cs.boxShadow && cs.boxShadow !== 'none') {
                node.style.boxShadow = 'none';
              }
              if (cs.backgroundImage && /oklch|oklab|color-mix/.test(cs.backgroundImage)) {
                node.style.backgroundImage = 'none';
              }
            }

            // Preserve crisp safe linear gradients on specific brand marks
            const ribbon = clonedDoc.getElementById('invoice-top-ribbon');
            if (ribbon) {
              ribbon.style.backgroundImage = 'linear-gradient(90deg, #f97316, #f59e0b, #10b981)';
            }
            const brandMark = clonedDoc.getElementById('invoice-brand-mark');
            if (brandMark) {
              brandMark.style.backgroundImage = 'linear-gradient(135deg, #f97316, #ea580c)';
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Multi-page safe pagination without stretching
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 2) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      const fileName = `Bill-${memoNumber}.pdf`;
      pdf.save(fileName);
      showToast(t('PDF bill downloaded successfully!', 'পিডিএফ বিল সফলভাবে ডাউনলোড হয়েছে!'), 'success');
    } catch (error) {
      console.error('PDF Export Error:', error);
      showToast(
        t('Could not generate PDF file. Using browser print option instead.', 'পিডিএফ তৈরি হয়নি, প্রিন্ট অপশন ব্যবহার করুন।'),
        'error'
      );
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-5 sm:py-8 px-3 sm:px-4 selection:bg-brand-orange selection:text-white print:bg-white print:p-0 overflow-x-hidden flex flex-col items-center">
      {/* Top Action Bar (Hidden in Print & PDF) */}
      <div className="w-full max-w-[210mm] mb-4 flex flex-wrap items-center justify-between gap-2.5 print:hidden download-hidden-topbar">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold border border-gray-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>{t('Back', 'ফিরে যান')}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleCopy(publicUrl, 'link')}
            className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold border border-gray-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span className="hidden xs:inline">{t('Copy Link', 'লিংক কপি')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer size={14} />
            <span>{t('Print', 'প্রিন্ট')}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-3.5 py-2 bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>{isDownloading ? t('Saving...', 'তৈরি হচ্ছে...') : t('Download PDF', 'পিডিএফ বিল')}</span>
          </button>

          <LanguageSwitcher variant="compact" />
        </div>
      </div>

      {/* Instant Order Confirmed & Bill Ready Strip (Shown right after checkout completion) */}
      {isNewOrderBanner && (
        <div className="w-full max-w-[210mm] mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs print:hidden download-hidden-topbar">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-emerald-950">
                {t('Order Confirmed & Official Bill Ready!', 'অর্ডার সম্পন্ন হয়েছে এবং অফিসিয়াল বিল প্রস্তুত!')}
              </h2>
              <p className="text-xs text-emerald-800/80 mt-0.5">
                {t(
                  `Order #${order.id} has been recorded. You can print or download your official PDF bill below.`,
                  `অর্ডার #${order.id} সফলভাবে সংরক্ষিত হয়েছে। নিচে থেকে আপনার বিল প্রিন্ট বা পিডিএফ ডাউনলোড করতে পারেন।`
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-3 py-2 bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {t('My Orders', 'আমার অর্ডার')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingBag size={13} />
              <span>{t('Shop More', 'আরও কিনুন')}</span>
            </button>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page {
          size: A4;
          margin: 8mm;
        }
        @media print {
          body {
            background: #ffffff !important;
            margin: 0;
            padding: 0;
          }
          #invoice-container {
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          .pdf-mobile-only {
            display: none !important;
          }
          .pdf-desktop-only {
            display: block !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `
        }}
      />

      {/* Digital Bill Card Container */}
      <div
        id="invoice-container"
        className="w-full max-w-[210mm] bg-white rounded-2xl sm:rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden flex flex-col print:rounded-none"
      >
        {/* Clean Brand Accent Bar */}
        <div
          id="invoice-top-ribbon"
          className="h-2 w-full bg-gradient-to-r from-brand-orange via-amber-500 to-emerald-500"
        />

        <div className="p-4 sm:p-8 md:p-10 space-y-6 sm:space-y-7">
          {/* 1. STORE HEADER & BILL STATUS */}
          <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 pb-6 border-b border-gray-200/80">
            <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
              {siteConfig?.siteLogo ? (
                <img
                  src={siteConfig.siteLogo}
                  alt={storeName}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-contain bg-gray-50 border border-gray-200 p-1.5 shrink-0"
                />
              ) : (
                <div
                  id="invoice-brand-mark"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-brand-orange to-orange-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0"
                >
                  {storeName.charAt(0)}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{storeName}</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-brand-orange border border-orange-200">
                    {t('Official Bill', 'অফিসিয়াল বিল')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-start gap-1.5 leading-snug">
                  <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                  <span>{storeAddress}</span>
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] font-semibold text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <Phone size={12} className="text-brand-orange" />
                    {storePhone}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail size={12} className="text-brand-orange" />
                    {storeEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Status & Invoice Stamp */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-gray-200 shrink-0">
              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {t('Invoice / Memo', 'ইনভয়েস নম্বর')}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(memoNumber, 'id')}
                  className="inline-flex items-center gap-1.5 text-base sm:text-lg font-black text-gray-900 font-mono hover:text-brand-orange transition-colors cursor-pointer"
                  title={t('Copy Memo ID', 'মেমো আইডি কপি করুন')}
                >
                  <span>{memoNumber}</span>
                  {copiedId ? (
                    <Check size={13} className="text-emerald-600 download-hidden-actions print:hidden" />
                  ) : (
                    <Copy size={13} className="text-gray-400 download-hidden-actions print:hidden" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                    isCancelled
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : isPaid
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {isPaid ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                  <span>
                    {isCancelled
                      ? t('Cancelled', 'বাতিল')
                      : isPaid
                      ? t('Paid', 'পরিশোধিত')
                      : t('Due on Delivery', 'ডেলিভারিতে প্রদেয়')}
                  </span>
                </span>
              </div>
            </div>
          </header>

          {/* 2. BILLING METADATA & CUSTOMER CARD */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer / Billed To Card */}
            <div className="rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-orange">
                <User size={13} />
                <span>{t('Billed & Shipped To', 'গ্রাহক ও ডেলিভারি ঠিকানা')}</span>
              </div>
              <p className="text-sm sm:text-base font-black text-gray-900">{customerName}</p>
              {customerPhone && (
                <p className="text-xs font-bold text-gray-700 font-mono flex items-center gap-1.5">
                  <Phone size={12} className="text-gray-400" />
                  <span>{customerPhone}</span>
                </p>
              )}
              {customerEmail && (
                <p className="text-xs text-gray-500 flex items-center gap-1.5 break-all">
                  <Mail size={12} className="text-gray-400 shrink-0" />
                  <span>{customerEmail}</span>
                </p>
              )}
              <p className="text-xs text-gray-600 leading-relaxed pt-0.5">
                {customerAddress || t('Standard Marketplace Delivery Address', 'স্ট্যান্ডার্ড ডেলিভারি ঠিকানা')}
              </p>
            </div>

            {/* Order & Payment Info Card */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                <CreditCard size={13} className="text-brand-orange" />
                <span>{t('Bill Details', 'বিলের বিবরণ')}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 font-medium">{t('Order ID', 'অর্ডার আইডি')}</span>
                  <span className="font-mono font-bold text-gray-900 truncate max-w-[170px]">#{order.id}</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 font-medium">{t('Bill Date', 'বিলের তারিখ')}</span>
                  <span className="font-semibold text-gray-900">{formattedOrderDate}</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 font-medium">{t('Order Status', 'অর্ডারের অবস্থা')}</span>
                  <span className="font-bold text-gray-900">{orderStatusLabel}</span>
                </div>
                <div className="flex justify-between items-center gap-3">
                  <span className="text-gray-500 font-medium">{t('Payment Method', 'পেমেন্ট মাধ্যম')}</span>
                  <span className="font-bold text-gray-900 text-right">{paymentMethodLabel}</span>
                </div>
                {order.transactionId && (
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-gray-500 font-medium">{t('TrxID', 'ট্রানজেকশন আইডি')}</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {order.transactionId}
                    </span>
                  </div>
                )}
                {order.senderNumber && (
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-gray-500 font-medium">{t('Sender Wallet', 'প্রেরক নম্বর')}</span>
                    <span className="font-mono font-bold text-gray-800">{order.senderNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 3. LINE ITEMS (Responsive Cards on Mobile + Full Table on Tablet/Desktop/PDF) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-700">
                {t('Itemized Bill Breakdown', 'পণ্যের বিস্তারিত হিসাব')} ({safeItems.length})
              </h2>
            </div>

            {/* Mobile Card List (<640px) — zero horizontal overflow */}
            <div className="sm:hidden pdf-mobile-only divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white overflow-hidden">
              {safeItems.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  {t('No itemized products found on this order.', 'এই অর্ডারে কোনো পণ্যের তালিকা নেই।')}
                </div>
              ) : (
                safeItems.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_ITEM_SVG;
                      }}
                      className="w-12 h-12 rounded-xl object-cover border border-gray-200 bg-gray-50 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{item.name}</p>
                      {item.variant && <p className="text-[10px] text-gray-500 mt-0.5">{item.variant}</p>}
                      <p className="text-[11px] font-mono text-gray-500 mt-1">
                        {currency}
                        {formatMoney(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-gray-900 font-mono tabular-nums">
                        {currency}
                        {formatMoney(item.lineTotal)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop & A4 PDF Table */}
            <div className="hidden sm:block pdf-desktop-only rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="py-3.5 pl-5 pr-3 text-left text-[10px] font-black uppercase tracking-widest">
                      {t('Product Description', 'পণ্যের বিবরণ')}
                    </th>
                    <th className="py-3.5 px-3 text-center text-[10px] font-black uppercase tracking-widest">
                      {t('Qty', 'পরিমাণ')}
                    </th>
                    <th className="py-3.5 px-3 text-right text-[10px] font-black uppercase tracking-widest">
                      {t('Unit Price', 'একক মূল্য')}
                    </th>
                    <th className="py-3.5 pl-3 pr-5 text-right text-[10px] font-black uppercase tracking-widest">
                      {t('Amount', 'মোট')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80">
                  {safeItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-gray-400">
                        {t('No itemized products recorded.', 'কোনো পণ্যের তথ্য পাওয়া যায়নি।')}
                      </td>
                    </tr>
                  ) : (
                    safeItems.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="py-3.5 pl-5 pr-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              crossOrigin="anonymous"
                              onError={(e) => {
                                e.currentTarget.src = FALLBACK_ITEM_SVG;
                              }}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-white shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 leading-snug">{item.name}</p>
                              {item.variant && (
                                <p className="text-[10px] text-gray-500 font-medium mt-0.5">{item.variant}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-xs text-gray-800 tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-semibold text-xs text-gray-600 tabular-nums">
                          {currency}
                          {formatMoney(item.price)}
                        </td>
                        <td className="py-3.5 pl-3 pr-5 text-right font-mono font-black text-xs text-gray-900 tabular-nums">
                          {currency}
                          {formatMoney(item.lineTotal)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. FINANCIAL TOTALS CARD & VERIFICATION QR */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Verification & QR Box */}
            <div className="md:col-span-6 rounded-2xl border border-gray-200/80 bg-gray-50/70 p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>{t('Verified Digital Receipt', 'যাচাইকৃত ডিজিটাল রসিদ')}</span>
                </div>
                <p className="text-xs font-bold text-gray-900 leading-snug">
                  {isPaid
                    ? t('Payment received and confirmed.', 'পেমেন্ট সফলভাবে সম্পন্ন হয়েছে।')
                    : isCancelled
                    ? t('This order was cancelled.', 'এই অর্ডারটি বাতিল করা হয়েছে।')
                    : t('Payable in cash when parcel arrives.', 'পণ্য বুঝে পাওয়ার পর ডেলিভারি ম্যানকে পরিশোধ করুন।')}
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {t(
                    'Scan the QR code anytime to verify order authenticity online.',
                    'অনলাইনে আসল বিল যাচাই করতে কিউআর কোড স্ক্যান করুন।'
                  )}
                </p>
              </div>

              <div className="w-20 h-20 rounded-xl bg-white border border-gray-200 p-1.5 shadow-2xs shrink-0 flex items-center justify-center">
                {!qrFailed ? (
                  <img
                    src={qrUrl}
                    crossOrigin="anonymous"
                    onError={() => setQrFailed(true)}
                    className="w-full h-full object-contain"
                    alt={t('Invoice QR', 'ইনভয়েস কিউআর')}
                  />
                ) : (
                  <div className="text-center">
                    <Receipt size={22} className="text-brand-orange mx-auto" />
                    <span className="text-[8px] font-mono font-bold text-gray-500 block mt-1">{memoNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Grand Totals Breakdown Card */}
            <div className="md:col-span-6 rounded-2xl border-2 border-gray-900/10 bg-white p-4 sm:p-5 space-y-2.5">
              <div className="flex justify-between text-xs text-gray-600">
                <span className="font-medium">{t('Items Subtotal', 'পণ্যের মোট মূল্য')}</span>
                <span className="font-mono font-bold text-gray-900 tabular-nums">
                  {currency}
                  {formatMoney(subtotalAmount)}
                </span>
              </div>

              <div className="flex justify-between text-xs text-gray-600">
                <span className="font-medium">{t('Delivery Charge', 'ডেলিভারি চার্জ')}</span>
                <span className="font-mono font-bold text-gray-900 tabular-nums">
                  {baseDeliveryAmount === 0 ? (
                    <span className="text-emerald-600 font-bold">{t('FREE', 'ফ্রি')}</span>
                  ) : (
                    `${currency}${formatMoney(baseDeliveryAmount)}`
                  )}
                </span>
              </div>

              {codFeeAmount > 0 && (
                <div className="flex justify-between text-xs text-gray-600">
                  <span className="font-medium">{t('COD Handling Fee', 'সিওডি হ্যান্ডলিং চার্জ')}</span>
                  <span className="font-mono font-bold text-gray-900 tabular-nums">
                    {currency}
                    {formatMoney(codFeeAmount)}
                  </span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span className="font-semibold">
                    {t('Coupon Discount', 'কুপন ছাড়')}
                    {order.couponCode ? ` (${order.couponCode})` : ''}
                  </span>
                  <span className="font-mono font-bold tabular-nums">
                    -{currency}
                    {formatMoney(discountAmount)}
                  </span>
                </div>
              )}

              <div className="pt-2.5 border-t border-gray-200 flex justify-between items-baseline">
                <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                  {t('Grand Total', 'সর্বমোট বিল')}
                </span>
                <span className="text-xl sm:text-2xl font-black text-brand-orange font-mono tabular-nums">
                  {currency}
                  {formatMoney(netPayable)}
                </span>
              </div>

              <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center text-[11px]">
                <span className="text-gray-500 font-semibold">
                  {isPaid ? t('Amount Paid', 'পরিশোধিত') : t('Balance Due', 'বকেয়া প্রদেয়')}
                </span>
                <span
                  className={`font-mono font-black tabular-nums ${
                    isPaid ? 'text-emerald-600' : isCancelled ? 'text-gray-400' : 'text-amber-600'
                  }`}
                >
                  {currency}
                  {formatMoney(isPaid ? paidAmount : dueAmount)}
                </span>
              </div>
            </div>
          </section>

          {/* 5. TERMS & SIGNATURES */}
          <section className="rounded-2xl bg-slate-900 text-slate-200 p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400">
              <AlertCircle size={13} />
              <span>{t('Warranty & Return Policy', 'রিটার্ন ও ওয়ারেন্টি নীতিমালা')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-slate-300 leading-relaxed">
              <p>
                {t(
                  '• 7-day easy return/replacement for unopened or defective items with original bill.',
                  '• মূল বিলসহ ৭ দিনের মধ্যে ত্রুটিপূর্ণ পণ্যের সহজ পরিবর্তন বা রিটার্ন সুবিধা।'
                )}
              </p>
              <p>
                {t(
                  '• Please inspect your parcel upon delivery before completing Cash on Delivery payment.',
                  '• ক্যাশ অন ডেলিভারির ক্ষেত্রে পণ্য যাচাই করে মূল্য পরিশোধ করার অনুরোধ রইল।'
                )}
              </p>
            </div>
          </section>

          <section className="pt-4 sm:pt-6 grid grid-cols-2 gap-6 sm:gap-12">
            <div className="text-center space-y-1.5">
              <div className="h-[1px] bg-gray-300" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {t('Customer Signature', 'গ্রাহকের স্বাক্ষর')}
              </p>
            </div>
            <div className="text-center space-y-1.5">
              <div className="h-[1px] bg-gray-900" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-900">
                {t('Authorized Signature', 'কর্তৃপক্ষের স্বাক্ষর')}
              </p>
            </div>
          </section>

          {/* 6. FOOTER */}
          <footer className="text-center pt-5 border-t border-gray-200/80">
            <p className="text-xs sm:text-sm font-black text-gray-900">
              {t(`Thank you for shopping with ${storeName}`, `${storeName}-এর সাথে কেনাকাটার জন্য ধন্যবাদ`)}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {t('This is a computer-generated digital bill. No physical stamp required.', 'এটি কম্পিউটার-জেনারেটেড ডিজিটাল বিল।')}
            </p>
          </footer>

          {/* Bottom Print / Download Bar (Hidden in Print & PDF) */}
          <div className="pt-4 border-t border-gray-200/80 flex flex-col xs:flex-row gap-3 print:hidden download-hidden-actions">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all text-xs font-extrabold uppercase tracking-wider shadow-sm cursor-pointer"
            >
              <Printer size={16} />
              <span>{t('Print Bill', 'বিল প্রিন্ট করুন')}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-extrabold uppercase tracking-wider shadow-sm cursor-pointer ${
                isDownloading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-brand-orange text-white hover:bg-orange-600'
              }`}
            >
              {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span>{isDownloading ? t('Generating PDF...', 'পিডিএফ তৈরি হচ্ছে...') : t('Download PDF Bill', 'পিডিএফ বিল ডাউনলোড')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
