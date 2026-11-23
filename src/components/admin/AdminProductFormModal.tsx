import React, { useState } from 'react';
import { 
  Package, X, Plus, Trash2, ArrowLeft, ArrowRight, Star, 
  Tag, Search, Truck, Layers, Image as ImageIcon, FileText,
  CheckCircle2, Sparkles, AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { CATEGORIES } from '../../constants';
import { useLanguage } from '../../contexts/LanguageContext';

interface AdminProductFormModalProps {
  product?: Product | null; // If provided, we are editing; else, creating
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: Partial<Product>) => Promise<void>;
  isSubmitting?: boolean;
}

const PRESET_BADGES = [
  'Fast Delivery',
  'Flash Sale',
  'Verified',
  'Best Seller',
  'New Arrival',
  'Popular',
  'Hot Deal',
  'Authentic'
];

const PRESET_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

export const AdminProductFormModal: React.FC<AdminProductFormModalProps> = ({
  product,
  isOpen,
  onClose,
  onSave,
  isSubmitting = false
}) => {
  const { t, translateCategory } = useLanguage();
  const isEditing = !!product;

  const getBadgeLabel = (badge: string) => {
    const map: Record<string, string> = {
      'Fast Delivery': t('Fast Delivery', 'দ্রুত ডেলিভারি'),
      'Flash Sale': t('Flash Sale', 'ফ্ল্যাশ সেল'),
      'Verified': t('Verified', 'ভেরিফায়েড'),
      'Best Seller': t('Best Seller', 'বেস্ট সেলার'),
      'New Arrival': t('New Arrival', 'নতুন কালেকশন'),
      'Popular': t('Popular', 'জনপ্রিয়'),
      'Hot Deal': t('Hot Deal', 'হট ডিল'),
      'Authentic': t('Authentic', '১০০% আসল')
    };
    return map[badge] || badge;
  };

  // Basic Info
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || 'Fashions');
  const [brand, setBrand] = useState(product?.brand || 'Digital Shop Originals');
  const [price, setPrice] = useState(product?.price ? String(product?.price) : '');
  const [originalPrice, setOriginalPrice] = useState(product?.originalPrice ? String(product?.originalPrice) : '');
  const [stock, setStock] = useState(product?.stock !== undefined ? String(product?.stock) : '50');
  const [status, setStatus] = useState<Product['status']>(product?.status || 'approved');

  // 1. Multiple Images & Reorderable Gallery
  const initialImages = (product?.gallery && product.gallery.length > 0)
    ? product.gallery
    : (product?.image ? [product.image] : []);
  const [images, setImages] = useState<string[]>(initialImages);
  const [newImageUrl, setNewImageUrl] = useState('');

  // 2. Specifications key-value list
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>(
    product?.specifications || [
      { label: t('Origin', 'উৎস'), value: t('Bangladesh', 'বাংলাদেশ') },
      { label: t('Condition', 'অবস্থা'), value: t('100% Brand New Authentic', '১০০% ব্র্যান্ড নিউ ও আসল') }
    ]
  );

  // 3. Rich Description & Inline Images
  const [description, setDescription] = useState(product?.description || '');
  const [descriptionImageInput, setDescriptionImageInput] = useState('');

  // 4. Badges Selector + Custom Badges
  const [selectedBadges, setSelectedBadges] = useState<string[]>(product?.badges || []);
  const [customBadgeInput, setCustomBadgeInput] = useState('');

  // 5. Hidden Search-Only Tags
  const [searchTags, setSearchTags] = useState<string[]>(product?.searchTags || []);
  const [newSearchTagInput, setNewSearchTagInput] = useState('');

  // 6. Optional Sizes
  const [hasSizes, setHasSizes] = useState<boolean>(
    Boolean(product?.variants?.sizes && product.variants.sizes.length > 0)
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    product?.variants?.sizes || ['M', 'L', 'XL']
  );
  const [customSizeInput, setCustomSizeInput] = useState('');

  // 7. Optional Manual Delivery Charge Override
  const [hasDeliveryOverride, setHasDeliveryOverride] = useState<boolean>(
    product?.deliveryFeeOverride !== undefined || product?.deliveryFee !== undefined
  );
  const [deliveryFeeOverride, setDeliveryFeeOverride] = useState<string>(
    product?.deliveryFeeOverride !== undefined 
      ? String(product.deliveryFeeOverride) 
      : (product?.deliveryFee !== undefined ? String(product.deliveryFee) : '60')
  );

  // 8. Detailed Seller / Brand Description
  const [sellerDescription, setSellerDescription] = useState<string>(
    product?.sellerDescription || product?.seller?.description || ''
  );

  if (!isOpen) return null;

  // Image actions
  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages(prev => [...prev, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages(prev => {
      const copy = [...prev];
      const item = copy.splice(from, 1)[0];
      copy.splice(to, 0, item);
      return copy;
    });
  };

  // Spec actions
  const handleAddSpecRow = () => {
    setSpecs(prev => [...prev, { label: '', value: '' }]);
  };

  const handleRemoveSpec = (index: number) => {
    setSpecs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSpecChange = (index: number, field: 'label' | 'value', text: string) => {
    setSpecs(prev => prev.map((s, i) => i === index ? { ...s, [field]: text } : s));
  };

  // Badges
  const handleToggleBadge = (badge: string) => {
    setSelectedBadges(prev => 
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    );
  };

  const handleAddCustomBadge = () => {
    if (!customBadgeInput.trim()) return;
    const badge = customBadgeInput.trim();
    if (!selectedBadges.includes(badge)) {
      setSelectedBadges(prev => [...prev, badge]);
    }
    setCustomBadgeInput('');
  };

  // Search tags
  const handleAddSearchTag = () => {
    if (!newSearchTagInput.trim()) return;
    let tag = newSearchTagInput.trim();
    if (!tag.startsWith('#')) tag = `#${tag}`;
    if (!searchTags.includes(tag)) {
      setSearchTags(prev => [...prev, tag]);
    }
    setNewSearchTagInput('');
  };

  const handleRemoveSearchTag = (tag: string) => {
    setSearchTags(prev => prev.filter(tagItem => tagItem !== tag));
  };

  // Sizes
  const handleToggleSize = (s: string) => {
    setSelectedSizes(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    const s = customSizeInput.trim().toUpperCase();
    if (!selectedSizes.includes(s)) {
      setSelectedSizes(prev => [...prev, s]);
    }
    setCustomSizeInput('');
  };

  // Insert image markdown/HTML into description
  const handleInsertInlineImage = () => {
    if (!descriptionImageInput.trim()) return;
    const imgSnippet = `\n<img src="${descriptionImageInput.trim()}" alt="Detail Shot" class="w-full rounded-2xl my-3 border border-white/10" />\n`;
    setDescription(prev => prev + imgSnippet);
    setDescriptionImageInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryImage = images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

    const payload: Partial<Product> = {
      name: name.trim(),
      category,
      brand: brand.trim(),
      price: Number(price) || 0,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      stock: Number(stock) || 0,
      status,
      image: primaryImage,
      gallery: images.length > 0 ? images : [primaryImage],
      images: images.length > 0 ? images : [primaryImage],
      specifications: specs.filter(s => s.label.trim() && s.value.trim()),
      description: description.trim(),
      badges: selectedBadges,
      searchTags: searchTags,
      variants: hasSizes ? { sizes: selectedSizes, colors: product?.variants?.colors || [] } : undefined,
      deliveryFeeOverride: hasDeliveryOverride ? Number(deliveryFeeOverride) || 0 : undefined,
      deliveryFee: hasDeliveryOverride ? Number(deliveryFeeOverride) || 0 : undefined,
      sellerDescription: sellerDescription.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    await onSave(payload);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md" 
        onClick={() => !isSubmitting && onClose()} 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-[#12121a] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto text-left space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-orange/15 border border-brand-orange/30 text-brand-orange flex items-center justify-center">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                {isEditing ? `${t('Edit Product:', 'পণ্য এডিট:')} ${name || product.id}` : t('Create & Publish New Product', 'নতুন পণ্য তৈরি ও প্রকাশ করুন')}
              </h3>
              <p className="text-xs text-gray-400">
                {t('Full catalog specifications, multiple photo gallery, promotional badges, and SEO indexing.', 'সম্পূর্ণ ক্যাটালগ তথ্য, একাধিক ছবির গ্যালারি, প্রোমোশনাল ব্যাজ এবং এসইও ইনডেক্সিং।')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: Basic Identifiers */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} className="text-brand-orange" /> {t('Essential Details & Classification', 'প্রাথমিক তথ্য ও শ্রেণিবিন্যাস')}
            </h4>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Product Title *', 'পণ্যের শিরোনাম *')}</label>
              <input
                type="text"
                required
                placeholder={t('e.g. Premium Linen Panjabi with Embroidered Neck', 'যেমন: প্রিমিয়াম লিনেন পাঞ্জাবি')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Category *', 'ক্যাটাগরি *')}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#181822] border border-white/10 rounded-xl h-11 px-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c} className="bg-[#181822] text-white">{translateCategory(c)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Brand Name', 'ব্র্যান্ডের নাম')}</label>
                <input
                  type="text"
                  placeholder={t('e.g. Digital Shop Originals', 'যেমন: Digital Shop Originals')}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Listing Status', 'লিস্টিং স্ট্যাটাস')}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Product['status'])}
                  className="w-full bg-[#181822] border border-white/10 rounded-xl h-11 px-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                >
                  <option value="approved" className="bg-[#181822] text-emerald-400">{t('Approved (Live)', 'অনুমোদিত (লাইভ)')}</option>
                  <option value="pending" className="bg-[#181822] text-amber-400">{t('Pending Review', 'পর্যালোচনার অপেক্ষায়')}</option>
                  <option value="rejected" className="bg-[#181822] text-rose-400">{t('Rejected', 'বাতিল')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Selling Price (৳) *', 'বিক্রয় মূল্য (৳) *')}</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="2450"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs text-white font-mono font-bold focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Original Price (৳) (Strikethrough)', 'আসল মূল্য (৳) (কাটা দাম)')}</label>
                <input
                  type="number"
                  min="0"
                  placeholder="2990"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs text-white font-mono focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">{t('Initial Stock Units', 'প্রাথমিক স্টক সংখ্যা')}</label>
                <input
                  type="number"
                  min="0"
                  placeholder="50"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-11 px-4 text-xs text-white font-mono focus:outline-none focus:border-brand-orange"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Multiple Image Upload & Reorderable Gallery */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={14} className="text-brand-orange" /> {t('1. Multiple Product Images & Thumbnail Gallery', '১. একাধিক পণ্যের ছবি ও থাম্বনেইল গ্যালারি')}
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t('The first image is the primary storefront thumbnail. Reorder images using the arrow buttons or remove any bad photos.', 'প্রথম ছবিটি স্টোরের প্রধান থাম্বনেইল হিসেবে দেখায়। তীর চিহ্ন দিয়ে ছবি সাজান বা অপ্রয়োজনীয় ছবি মুছে দিন।')}
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                placeholder={t('Paste image URL (https://images.unsplash.com/...)', 'ছবির লিংক পেস্ট করুন (https://images.unsplash.com/...)')}
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl h-10 px-4 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase transition-all shrink-0 cursor-pointer"
              >
                {t('Add Image', 'ছবি যোগ করুন')}
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/15 bg-black/40 aspect-square flex flex-col justify-between p-2">
                    <img src={img} alt={`Gallery ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover -z-0" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10 flex items-center justify-between">
                      {idx === 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-brand-orange text-white text-[9px] font-black uppercase">
                          {t('Primary', 'প্রধান')}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-black/60 text-gray-300 text-[9px] font-bold">
                          #{idx + 1}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-500 cursor-pointer"
                        title={t('Remove Image', 'ছবি সরান')}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* Reorder Buttons */}
                    <div className="relative z-10 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, idx - 1)}
                          className="p-1 rounded bg-black/70 hover:bg-black text-white cursor-pointer"
                          title={t('Move Left', 'বামে সরান')}
                        >
                          <ArrowLeft size={11} />
                        </button>
                      )}
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, idx + 1)}
                          className="p-1 rounded bg-black/70 hover:bg-black text-white cursor-pointer"
                          title={t('Move Right', 'ডানে সরান')}
                        >
                          <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">{t('No gallery images added yet. At least one image is recommended.', 'এখনও কোনো গ্যালারি ছবি যোগ করা হয়নি। অন্তত একটি ছবি দেওয়ার পরামর্শ দেওয়া হচ্ছে।')}</p>
            )}
          </div>

          {/* SECTION 3: Specifications Key-Value List */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers size={14} className="text-brand-orange" /> {t('2. Structured Specifications Table', '২. পণ্যের স্পেসিফিকেশন টেবিল')}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {t('Key-value attributes (e.g. Material: Cotton, Origin: Bangladesh) rendered in the product detail spec table.', 'পণ্যের বিস্তারিত পেজে প্রদর্শিত মূল বৈশিষ্ট্যসমূহ (যেমন: উপাদান: সুতি, উৎস: বাংলাদেশ)।')}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-brand-orange text-xs font-bold flex items-center gap-1 cursor-pointer border border-brand-orange/30"
              >
                <Plus size={13} /> {t('Add Row', 'সারি যোগ করুন')}
              </button>
            </div>

            <div className="space-y-2">
              {specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={t('Attribute (e.g. Material)', 'বৈশিষ্ট্য (যেমন: উপাদান)')}
                    value={spec.label}
                    onChange={(e) => handleSpecChange(i, 'label', e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl h-9 px-3 text-xs text-white focus:outline-none focus:border-brand-orange font-medium"
                  />
                  <span className="text-gray-500">:</span>
                  <input
                    type="text"
                    placeholder={t('Value (e.g. 100% Organic Silk)', 'মান (যেমন: ১০০% অর্গানিক সিল্ক)')}
                    value={spec.value}
                    onChange={(e) => handleSpecChange(i, 'value', e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl h-9 px-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpec(i)}
                    className="p-2 text-gray-500 hover:text-rose-400 cursor-pointer"
                    title={t('Remove Row', 'সারি মুছুন')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Rich Description with Inline Images */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} className="text-brand-orange" /> {t('3. Rich Description & Inline Images', '৩. বিস্তারিত বিবরণ ও ইনলাইন ছবি')}
            </h4>

            {/* Quick insert image helper */}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder={t('Insert inline photo URL into description...', 'বিবরণের ভেতরে ছবির লিংক যোগ করুন...')}
                value={descriptionImageInput}
                onChange={(e) => setDescriptionImageInput(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl h-9 px-3 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
              <button
                type="button"
                onClick={handleInsertInlineImage}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <ImageIcon size={13} /> {t('Insert Inline Image', 'ইনলাইন ছবি যোগ করুন')}
              </button>
            </div>

            <textarea
              rows={4}
              placeholder={t('Full product story, fabric breakdown, washing guidelines, and craftsmanship...', 'পণ্যের সম্পূর্ণ বিবরণ, কাপড়ের মান, ব্যবহারের নিয়মাবলী ও বৈশিষ্ট্য...')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-white focus:outline-none focus:border-brand-orange leading-relaxed"
            />
          </div>

          {/* SECTION 5: Promotional Badges & Tags */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" /> {t('4. Promotional Badges & Highlights', '৪. প্রোমোশনাল ব্যাজ ও হাইলাইটস')}
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t('Renders stylish promotional pill tags directly on the product card across catalog listings.', 'ক্যাটালগের প্রোডাক্ট কার্ডে আকর্ষণীয় প্রোমোশনাল ব্যাজ হিসেবে দেখায়।')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_BADGES.map(badge => {
                const isSelected = selectedBadges.includes(badge);
                return (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => handleToggleBadge(badge)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                        : 'bg-white/5 text-gray-400 border-white/5 hover:text-white'
                    }`}
                  >
                    {getBadgeLabel(badge)}
                  </button>
                );
              })}
            </div>

            {/* Custom Badge Input */}
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder={t('Custom Badge (e.g. Ramadan Special)', 'কাস্টম ব্যাজ (যেমন: রমজান স্পেশাল)')}
                value={customBadgeInput}
                onChange={(e) => setCustomBadgeInput(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl h-9 px-3 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
              <button
                type="button"
                onClick={handleAddCustomBadge}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
              >
                + {t('Add', 'যোগ করুন')}
              </button>
            </div>
          </div>

          {/* SECTION 6: Hidden Search-Only Tags */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Search size={14} className="text-blue-400" /> {t('5. Hidden Search-Only Indexing Tags', '৫. গোপন সার্চ ইনডেক্সিং ট্যাগ')}
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {t('These tags (e.g. #summer, #giftidea, #eidcollection) are NEVER displayed to customers on product cards, but are indexed by search.', 'এই ট্যাগগুলো (যেমন: #summer, #eidcollection) গ্রাহকদের কাছে প্রদর্শিত হয় না, কিন্তু সার্চে পণ্যটি দ্রুত খুঁজে পেতে সাহায্য করে।')}
              </p>
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder={t('Type tag (e.g. #wedding, #cotton, #panjabi)...', 'ট্যাগ লিখুন (যেমন: #wedding, #cotton, #panjabi)...')}
                value={newSearchTagInput}
                onChange={(e) => setNewSearchTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSearchTag();
                  }
                }}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl h-9 px-3 text-xs text-white font-mono focus:outline-none focus:border-brand-orange"
              />
              <button
                type="button"
                onClick={handleAddSearchTag}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase"
              >
                {t('Add Tag', 'ট্যাগ যোগ করুন')}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {searchTags.map(tag => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono flex items-center gap-1.5"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveSearchTag(tag)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
              {searchTags.length === 0 && (
                <span className="text-xs text-gray-500">{t('No hidden search tags assigned yet.', 'এখনও কোনো গোপন সার্চ ট্যাগ যোগ করা হয়নি।')}</span>
              )}
            </div>
          </div>

          {/* SECTION 7: Optional Size Selector */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Tag size={14} className="text-brand-orange" /> {t('6. Optional Sizes Configuration', '৬. ঐচ্ছিক সাইজ কনফিগারেশন')}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {t('Leave disabled for one-size accessories, cosmetics, or electronics.', 'ইলেকট্রনিক্স, কসমেটিক্স বা এক সাইজের পণ্যের জন্য এটি বন্ধ রাখুন।')}
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSizes}
                  onChange={(e) => setHasSizes(e.target.checked)}
                  className="w-4 h-4 accent-brand-orange"
                />
                <span className="text-xs font-bold text-white">{t('Enable Sizes', 'সাইজ চালু করুন')}</span>
              </label>
            </div>

            {hasSizes && (
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap gap-2">
                  {PRESET_SIZES.map(s => {
                    const isSelected = selectedSizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleToggleSize(s)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-brand-orange text-white border-brand-orange'
                            : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
                        }`}
                      >
                        {s === 'Free Size' ? t('Free Size', 'ফ্রি সাইজ') : s}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 max-w-xs">
                  <input
                    type="text"
                    placeholder={t('Custom size (e.g. 42 / 44)', 'কাস্টম সাইজ (যেমন: 42 / 44)')}
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl h-9 px-3 text-xs text-white focus:outline-none focus:border-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                  >
                    {t('Add Size', 'সাইজ যোগ করুন')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 8: Manual Delivery Fee Override & Seller Story */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Truck size={14} className="text-emerald-400" /> {t('7. Optional Manual Delivery Fee Override', '৭. ঐচ্ছিক কাস্টম ডেলিভারি চার্জ')}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {t('Overrides default site delivery fee (for heavy or bulky items).', 'ভারী বা বড় পণ্যের জন্য সাইটের সাধারণ ডেলিভারি চার্জ পরিবর্তন করে।')}
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDeliveryOverride}
                  onChange={(e) => setHasDeliveryOverride(e.target.checked)}
                  className="w-4 h-4 accent-brand-orange"
                />
                <span className="text-xs font-bold text-white">{t('Override Fee', 'চার্জ কাস্টমাইজ করুন')}</span>
              </label>
            </div>

            {hasDeliveryOverride && (
              <div className="max-w-xs pt-2">
                <label className="block text-[10px] font-bold text-gray-300 uppercase mb-1">{t('Custom Delivery Charge (৳)', 'কাস্টম ডেলিভারি চার্জ (৳)')}</label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 150"
                  value={deliveryFeeOverride}
                  onChange={(e) => setDeliveryFeeOverride(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3 text-xs text-white font-mono focus:outline-none focus:border-brand-orange"
                />
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                {t('8. Detailed Seller / Brand Description', '৮. বিস্তারিত বিক্রেতা / ব্র্যান্ডের বিবরণ')}
              </label>
              <p className="text-[11px] text-gray-400 mb-2">
                {t('Brand story shown on product page under "More from Seller".', 'পণ্যের পেজে "বিক্রেতার আরও পণ্য" অংশে এই ব্র্যান্ড পরিচিতি প্রদর্শিত হয়।')}
              </p>
              <textarea
                rows={2}
                placeholder={t('Story about this specific seller, authentic origin, or workshop...', 'এই বিক্রেতা, পণ্যের আসল উৎস বা কারখানার বিবরণ...')}
                value={sellerDescription}
                onChange={(e) => setSellerDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer"
            >
              {t('Cancel', 'বাতিল')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-orange/20"
            >
              {isSubmitting ? t('Saving...', 'সংরক্ষণ হচ্ছে...') : isEditing ? t('Save Product Changes', 'পরিবর্তন সংরক্ষণ করুন') : t('Publish Product', 'পণ্য প্রকাশ করুন')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
