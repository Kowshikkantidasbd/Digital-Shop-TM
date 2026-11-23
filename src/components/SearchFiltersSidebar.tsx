import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  Filter,
  RotateCcw,
  Search as SearchIcon,
  ShieldCheck,
  Star,
  Tag,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatBDT } from './ProductCard';

export interface FacetItem {
  name: string;
  count: number;
}

export interface SearchFiltersSidebarProps {
  categories: FacetItem[];
  categoryParam: string;
  onSelectCategory: (cat: string) => void;
  refinedQuery: string;
  onRefinedQueryChange: (val: string) => void;
  minPrice: number;
  maxPrice: number;
  maxCatalogPrice: number;
  onPriceChange: (min: number, max: number) => void;
  minDiscount: number;
  onMinDiscountChange: (val: number) => void;
  minRating: number;
  ratingCounts?: Record<number, number>;
  onMinRatingChange: (val: number) => void;
  brands: FacetItem[];
  selectedBrands: string[];
  onToggleBrand: (brand: string) => void;
  activeFlags: string[];
  flagCounts: Record<string, number>;
  onToggleFlag: (flag: string) => void;
  selectedCondition: string;
  onConditionChange: (cond: string) => void;
  activeFilterCount: number;
  onResetAll: () => void;
  hideHeader?: boolean;
}

interface FilterAccordionProps {
  title: string;
  activeCount?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const FilterAccordion: React.FC<FilterAccordionProps> = ({
  title,
  activeCount = 0,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="pt-4 border-t border-gray-100 first:pt-0 first:border-t-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-2 py-1 text-left group cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-800 group-hover:text-brand-orange transition-colors truncate">
            {title}
          </span>
          {activeCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1.5 rounded-md bg-orange-50 text-brand-orange text-[10px] font-bold tabular-nums flex items-center justify-center shrink-0">
              {activeCount}
            </span>
          )}
        </div>
        <ChevronDown
          size={15}
          className={`text-gray-400 group-hover:text-gray-700 transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
};

export const SearchFiltersSidebar: React.FC<SearchFiltersSidebarProps> = ({
  categories,
  categoryParam,
  onSelectCategory,
  refinedQuery,
  onRefinedQueryChange,
  minPrice,
  maxPrice,
  maxCatalogPrice,
  onPriceChange,
  minDiscount,
  onMinDiscountChange,
  minRating,
  ratingCounts,
  onMinRatingChange,
  brands,
  selectedBrands,
  onToggleBrand,
  activeFlags,
  flagCounts,
  onToggleFlag,
  selectedCondition,
  onConditionChange,
  activeFilterCount,
  onResetAll,
  hideHeader = false,
}) => {
  const { t, translateCategory } = useLanguage();
  const [brandSearch, setBrandSearch] = useState('');
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max'>('max');

  const safeMaxCap = Math.max(50000, maxCatalogPrice);
  const sliderStep = safeMaxCap > 100000 ? 500 : 100;

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const visibleBrands = showAllBrands ? filteredBrands : filteredBrands.slice(0, 6);
  const selectedCategoryIdx = categories.findIndex(
    (c) => c.name.toLowerCase() === categoryParam.toLowerCase()
  );
  const visibleCategories =
    showAllCategories || selectedCategoryIdx >= 8 ? categories : categories.slice(0, 8);

  const pricePresets = [
    { label: t('Under ৳1,000', '১,০০০ টাকার নিচে'), min: 0, max: 1000 },
    { label: t('৳1,000 – ৳5,000', '১,০০০ – ৫,০০০ টাকা'), min: 1000, max: 5000 },
    { label: t('৳5,000 – ৳20,000', '৫,০০০ – ২০,০০০ টাকা'), min: 5000, max: 20000 },
    { label: t('৳20,000 – ৳50,000', '২০,০০০ – ৫০,০০০ টাকা'), min: 20000, max: 50000 },
    { label: t('৳50,000 & Above', '৫০,০০০ টাকা বা বেশি'), min: 50000, max: safeMaxCap },
  ];

  const flagOptions = [
    {
      key: 'In Stock',
      label: t('In Stock Only', 'স্টকে আছে'),
      icon: <Check size={13} className="text-emerald-600" />,
    },
    {
      key: 'Free Delivery',
      label: t('Free Delivery', 'ফ্রি ডেলিভারি'),
      icon: <Truck size={13} className="text-sky-600" />,
    },
    {
      key: 'Cash on Delivery',
      label: t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি'),
      icon: <Tag size={13} className="text-amber-600" />,
    },
    {
      key: 'Flash Sale',
      label: t('Flash Sale & Deals', 'ফ্ল্যাশ সেল ও অফার'),
      icon: <Zap size={13} className="text-brand-orange" />,
    },
    {
      key: 'Official Mall',
      label: t('Official Mall', 'অফিসিয়াল মল'),
      icon: <ShieldCheck size={13} className="text-indigo-600" />,
    },
    {
      key: 'Verified Seller',
      label: t('Verified Seller', 'ভেরিফায়েড সেলার'),
      icon: <ShieldCheck size={13} className="text-teal-600" />,
    },
  ];

  const discountOptions = [
    { value: 0, label: t('All Discounts', 'সব ডিসকাউন্ট') },
    { value: 10, label: t('10% Off or more', '১০% বা বেশি ছাড়') },
    { value: 25, label: t('25% Off or more', '২৫% বা বেশি ছাড়') },
    { value: 40, label: t('40% Off or more', '৪০% বা বেশি ছাড়') },
    { value: 50, label: t('50% Off or more', '৫০% বা বেশি ছাড়') },
  ];

  const ratingOptions = [
    { value: 4.5, label: t('4.5 & Up', '৪.৫ ও উপরে'), stars: 4.5 },
    { value: 4, label: t('4.0 & Up', '৪.০ ও উপরে'), stars: 4 },
    { value: 3, label: t('3.0 & Up', '৩.০ ও উপরে'), stars: 3 },
    { value: 0, label: t('All Ratings', 'সব রেটিং'), stars: 0 },
  ];

  const renderRatingStars = (score: number) => (
    <div className="flex items-center gap-0.5 shrink-0" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((idx) => {
        if (score >= idx) {
          return <Star key={idx} size={13} className="fill-amber-400 text-amber-400" />;
        }
        if (score >= idx - 0.5) {
          return (
            <span key={idx} className="relative inline-block w-[13px] h-[13px] shrink-0">
              <Star size={13} className="fill-gray-200 text-gray-200 absolute inset-0" />
              <span className="overflow-hidden w-1/2 absolute inset-y-0 left-0 inline-block">
                <Star size={13} className="fill-amber-400 text-amber-400" />
              </span>
            </span>
          );
        }
        return <Star key={idx} size={13} className="fill-gray-200 text-gray-200" />;
      })}
    </div>
  );

  const conditionOptions = [
    { value: 'all', label: t('Any Condition', 'সব ধরন') },
    { value: 'new', label: t('Brand New', 'একদম নতুন') },
    { value: 'refurbished', label: t('Refurbished', 'রিফার্বিশড') },
    { value: 'used', label: t('Pre-Owned', 'ব্যবহৃত') },
  ];

  const minPercent = Math.min(100, Math.max(0, (minPrice / safeMaxCap) * 100));
  const maxPercent = Math.min(100, Math.max(minPercent, (maxPrice / safeMaxCap) * 100));

  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-brand-orange" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              {t('Filters', 'ফিল্টার')}
            </h3>
            {activeFilterCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-md bg-brand-orange text-white text-[10px] font-bold tabular-nums flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetAll}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-orange hover:text-brand-orange-light cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>{t('Reset', 'রিসেট')}</span>
            </button>
          )}
        </div>
      )}

      {/* Keyword Refine Input */}
      <div>
        <label className="sr-only" htmlFor="refine-results-input">
          {t('Filter by keyword', 'কীওয়ার্ড দিয়ে খুঁজুন')}
        </label>
        <div className="relative">
          <SearchIcon
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            id="refine-results-input"
            type="text"
            value={refinedQuery}
            onChange={(e) => onRefinedQueryChange(e.target.value)}
            placeholder={t('Filter inside results...', 'রেজাল্টের ভেতর খুঁজুন...')}
            className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-brand-orange transition-colors"
          />
          {refinedQuery && (
            <button
              type="button"
              onClick={() => onRefinedQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              aria-label={t('Clear keyword filter', 'সার্চ মুছুন')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <FilterAccordion
        title={t('Categories', 'ক্যাটাগরি')}
        activeCount={categoryParam !== 'All' ? 1 : 0}
        defaultOpen
      >
        <div className="space-y-1">
          {visibleCategories.map((cat) => {
            const isSelected = categoryParam.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                type="button"
                key={cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className={`w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg transition-colors cursor-pointer group ${
                  isSelected ? 'bg-orange-50 text-gray-900' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-brand-orange border-brand-orange text-white'
                        : 'border-gray-300 bg-white group-hover:border-brand-orange/60'
                    }`}
                  >
                    {isSelected && <Check size={11} strokeWidth={3.5} />}
                  </span>
                  <span
                    className={`text-xs truncate ${
                      isSelected ? 'font-bold text-brand-orange' : 'font-medium text-gray-700 group-hover:text-gray-950'
                    }`}
                  >
                    {translateCategory(cat.name)}
                  </span>
                </div>
                <span className="text-[11px] font-medium tabular-nums text-gray-400 shrink-0">
                  {cat.count}
                </span>
              </button>
            );
          })}
          {categories.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllCategories((prev) => !prev)}
              className="mt-1 px-2 py-1 text-[11px] font-semibold text-brand-orange hover:underline cursor-pointer"
            >
              {showAllCategories
                ? t('Show fewer', 'কম দেখুন')
                : t(`Show all (${categories.length})`, `সব দেখুন (${categories.length})`)}
            </button>
          )}
        </div>
      </FilterAccordion>

      {/* Price Range */}
      <FilterAccordion
        title={t('Price Range (৳)', 'মূল্য সীমা (৳)')}
        activeCount={minPrice > 0 || maxPrice < safeMaxCap ? 1 : 0}
        defaultOpen
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">
                ৳
              </span>
              <input
                type="number"
                min={0}
                max={maxPrice}
                value={minPrice}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(Number(e.target.value) || 0, maxPrice));
                  onPriceChange(val, maxPrice);
                }}
                aria-label={t('Minimum price', 'সর্বনিম্ন মূল্য')}
                className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold tabular-nums text-gray-800 outline-none focus:bg-white focus:border-brand-orange"
              />
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-400">
                ৳
              </span>
              <input
                type="number"
                min={minPrice}
                max={safeMaxCap}
                value={maxPrice}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const val = Number.isFinite(raw) ? Math.max(minPrice, Math.min(raw, safeMaxCap)) : safeMaxCap;
                  onPriceChange(minPrice, val);
                }}
                aria-label={t('Maximum price', 'সর্বোচ্চ মূল্য')}
                className="w-full pl-6 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold tabular-nums text-gray-800 outline-none focus:bg-white focus:border-brand-orange"
              />
            </div>
          </div>

          {/* Clean Dual Range Slider */}
          <div className="relative w-full h-1.5 bg-gray-200 rounded-full my-4">
            <div
              className="absolute h-full bg-brand-orange rounded-full"
              style={{
                left: `${minPercent}%`,
                right: `${100 - maxPercent}%`,
              }}
            />
            <input
              type="range"
              min={0}
              max={safeMaxCap}
              step={sliderStep}
              value={Math.min(minPrice, safeMaxCap)}
              onChange={(e) => {
                const val = Math.min(Number(e.target.value), maxPrice - sliderStep);
                onPriceChange(Math.max(0, val), maxPrice);
                setActiveThumb('min');
              }}
              aria-label={t('Minimum price slider', 'সর্বনিম্ন মূল্য স্লাইডার')}
              className="price-range-thumb"
              style={{ zIndex: activeThumb === 'min' ? 30 : 20 }}
            />
            <input
              type="range"
              min={0}
              max={safeMaxCap}
              step={sliderStep}
              value={Math.min(maxPrice, safeMaxCap)}
              onChange={(e) => {
                const val = Math.max(Number(e.target.value), minPrice + sliderStep);
                onPriceChange(minPrice, Math.min(safeMaxCap, val));
                setActiveThumb('max');
              }}
              aria-label={t('Maximum price slider', 'সর্বোচ্চ মূল্য স্লাইডার')}
              className="price-range-thumb"
              style={{ zIndex: activeThumb === 'max' ? 30 : 20 }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-medium tabular-nums text-gray-400 -mt-1">
            <span>৳{formatBDT(minPrice)}</span>
            <span>৳{formatBDT(maxPrice)}</span>
          </div>

          <div className="space-y-1 pt-1">
            {pricePresets.map((preset) => {
              const isSelected = minPrice === preset.min && maxPrice === preset.max;
              return (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => onPriceChange(preset.min, preset.max)}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-orange-50 text-brand-orange font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-brand-orange' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-brand-orange" />}
                  </span>
                  <span className="text-xs">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </FilterAccordion>

      {/* Store, Delivery & Availability */}
      <FilterAccordion
        title={t('Delivery & Guarantees', 'ডেলিভারি ও সুবিধা')}
        activeCount={activeFlags.length}
        defaultOpen
      >
        <div className="space-y-1">
          {flagOptions.map((item) => {
            const checked = activeFlags.includes(item.key);
            const count = flagCounts[item.key] ?? 0;
            return (
              <button
                type="button"
                key={item.key}
                onClick={() => onToggleFlag(item.key)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer group ${
                  checked ? 'bg-orange-50 text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? 'bg-brand-orange border-brand-orange text-white'
                        : 'border-gray-300 bg-white group-hover:border-brand-orange/60'
                    }`}
                  >
                    {checked && <Check size={11} strokeWidth={3.5} />}
                  </span>
                  <span className="shrink-0">{item.icon}</span>
                  <span className={`text-xs truncate ${checked ? 'font-bold text-brand-orange' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </div>
                <span className="text-[11px] font-medium tabular-nums text-gray-400 shrink-0">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </FilterAccordion>

      {/* Customer Rating */}
      <FilterAccordion
        title={t('Customer Rating', 'ক্রেতার রেটিং')}
        activeCount={minRating > 0 ? 1 : 0}
        defaultOpen
      >
        <div className="space-y-1.5">
          {ratingOptions.map((opt) => {
            const selected = minRating === opt.value;
            const isDefaultAll = opt.value === 0;
            const tierCount = ratingCounts ? ratingCounts[opt.value] : undefined;

            return (
              <button
                type="button"
                key={opt.value}
                onClick={() =>
                  onMinRatingChange(selected && !isDefaultAll ? 0 : opt.value)
                }
                aria-pressed={selected}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border text-left transition-all cursor-pointer group ${
                  selected
                    ? isDefaultAll
                      ? 'bg-slate-50 border-slate-200/90 text-gray-900 font-semibold'
                      : 'bg-orange-50/75 border-brand-orange/45 text-gray-900 font-semibold shadow-2xs'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/80 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      selected
                        ? isDefaultAll
                          ? 'bg-slate-700 border-slate-700 text-white'
                          : 'bg-brand-orange border-brand-orange text-white'
                        : 'border-gray-300 bg-white group-hover:border-brand-orange/60'
                    }`}
                  >
                    {selected && <Check size={10} strokeWidth={3.5} />}
                  </span>

                  {opt.stars > 0 && renderRatingStars(opt.stars)}

                  <span
                    className={`text-xs truncate ${
                      selected && !isDefaultAll ? 'text-brand-orange font-bold' : ''
                    }`}
                  >
                    {opt.label}
                  </span>
                </div>

                {typeof tierCount === 'number' && (
                  <span
                    className={`text-[11px] font-medium tabular-nums shrink-0 ${
                      selected && !isDefaultAll ? 'text-brand-orange font-semibold' : 'text-gray-400'
                    }`}
                  >
                    {tierCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </FilterAccordion>

      {/* Discount Filter */}
      <FilterAccordion
        title={t('Discount', 'ডিসকাউন্ট ও ছাড়')}
        activeCount={minDiscount > 0 ? 1 : 0}
        defaultOpen={false}
      >
        <div className="space-y-1">
          {discountOptions.map((opt) => {
            const selected = minDiscount === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => onMinDiscountChange(opt.value)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                  selected ? 'bg-orange-50 text-brand-orange font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                    selected ? 'border-brand-orange' : 'border-gray-300'
                  }`}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-brand-orange" />}
                </span>
                <span className="text-xs">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </FilterAccordion>

      {/* Brands */}
      {brands.length > 0 && (
        <FilterAccordion
          title={t('Brands', 'ব্র্যান্ড')}
          activeCount={selectedBrands.length}
          defaultOpen
        >
          <div className="space-y-2">
            {brands.length > 6 && (
              <div className="relative">
                <SearchIcon
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder={t('Search brands...', 'ব্র্যান্ড খুঁজুন...')}
                  className="w-full pl-7 pr-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] text-gray-800 outline-none focus:bg-white focus:border-brand-orange"
                />
              </div>
            )}
            <div className="space-y-1">
              {visibleBrands.map((brand) => {
                const checked = selectedBrands.includes(brand.name);
                return (
                  <button
                    type="button"
                    key={brand.name}
                    onClick={() => onToggleBrand(brand.name)}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer group ${
                      checked ? 'bg-orange-50 text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? 'bg-brand-orange border-brand-orange text-white'
                            : 'border-gray-300 bg-white group-hover:border-brand-orange/60'
                        }`}
                      >
                        {checked && <Check size={11} strokeWidth={3.5} />}
                      </span>
                      <span className={`text-xs truncate ${checked ? 'font-bold text-brand-orange' : 'font-medium'}`}>
                        {brand.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium tabular-nums text-gray-400 shrink-0">
                      {brand.count}
                    </span>
                  </button>
                );
              })}
              {filteredBrands.length === 0 && (
                <p className="text-[11px] text-gray-400 px-2 py-1">
                  {t('No matching brands', 'কোনো ব্র্যান্ড পাওয়া যায়নি')}
                </p>
              )}
              {filteredBrands.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllBrands((prev) => !prev)}
                  className="mt-1 px-2 py-1 text-[11px] font-semibold text-brand-orange hover:underline cursor-pointer"
                >
                  {showAllBrands
                    ? t('Show fewer', 'কম দেখুন')
                    : t(`Show all (${filteredBrands.length})`, `সব দেখুন (${filteredBrands.length})`)}
                </button>
              )}
            </div>
          </div>
        </FilterAccordion>
      )}

      {/* Condition */}
      <FilterAccordion
        title={t('Condition', 'পণ্যের অবস্থা')}
        activeCount={selectedCondition !== 'all' ? 1 : 0}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 gap-1.5">
          {conditionOptions.map((opt) => {
            const active = selectedCondition === opt.value;
            return (
              <button
                type="button"
                key={opt.value}
                onClick={() => onConditionChange(opt.value)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap truncate ${
                  active
                    ? 'bg-orange-50 border-brand-orange text-brand-orange'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </FilterAccordion>
    </div>
  );
};
