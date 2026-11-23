import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { ProductCard, formatBDT } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { Product, CartItem, User as UserType } from '../types';
import { ThemeConfig } from '../components/BackgroundLayer';
import { CATEGORIES } from '../constants';
import {
  ArrowLeft,
  Filter,
  Heart,
  LayoutGrid,
  List,
  RotateCcw,
  Search as SearchIcon,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { FilterDropdown } from '../components/FilterControls';
import { FacetItem, SearchFiltersSidebar } from '../components/SearchFiltersSidebar';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchPageProps {
  currentTheme: ThemeConfig;
  user: UserType | null;
  cart: CartItem[];
  wishlist: string[];
  products: Product[];
  addToCart: (p: Product, q?: number, s?: string, c?: string) => void;
  setSelectedProduct: (p: Product | null) => void;
  toggleWishlist: (id: string) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsWishlistOpen: (open: boolean) => void;
  setIsLoginOpen: (open: boolean) => void;
  setIsOrdersOpen: (open: boolean) => void;
  onLogout: () => void;
}

const getEffectivePrice = (p: Product): number => {
  if (p.isFlashSale && typeof p.flashSalePrice === 'number' && p.flashSalePrice > 0) {
    return p.flashSalePrice;
  }
  return Number(p.price) || 0;
};

const getDiscountPercent = (p: Product): number => {
  const effective = getEffectivePrice(p);
  const original = Number(p.originalPrice || p.normalPriceBeforeFlash || 0);
  if (original > effective && effective > 0) {
    return Math.round(((original - effective) / original) * 100);
  }
  return 0;
};

const matchesFlag = (p: Product, flag: string): boolean => {
  switch (flag) {
    case 'In Stock':
      return p.stock === undefined || p.stock > 0;
    case 'Free Delivery':
      return Boolean(p.freeShipping || p.deliveryFee === 0 || p.deliveryFeeOverride === 0);
    case 'Cash on Delivery':
      return p.codAllowed !== false;
    case 'Flash Sale':
      return Boolean(
        p.isFlashSale ||
          getDiscountPercent(p) > 0 ||
          p.tags?.some((tag) => tag.toLowerCase().includes('flash') || tag.toLowerCase().includes('sale'))
      );
    case 'Official Mall':
      return Boolean(
        p.seller?.name?.toLowerCase().includes('official') ||
          p.seller?.name?.toLowerCase().includes('mall') ||
          p.brand?.toLowerCase() === 'elora' ||
          p.tags?.includes('official') ||
          p.badges?.some((b) => b.toLowerCase().includes('mall') || b.toLowerCase().includes('official'))
      );
    case 'Verified Seller':
      return Boolean(
        p.seller?.verified === true ||
          (p.seller?.rating && p.seller.rating >= 4.5) ||
          p.seller?.name?.toLowerCase().includes('official')
      );
    default:
      return true;
  }
};

export const SearchPage: React.FC<SearchPageProps> = ({
  user,
  cart,
  wishlist,
  products,
  addToCart,
  setSelectedProduct,
  toggleWishlist,
  setIsCartOpen,
  setIsWishlistOpen,
  setIsLoginOpen,
  setIsOrdersOpen,
  onLogout,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, translateCategory } = useLanguage();

  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'All';

  const visibleCatalog = useMemo(
    () =>
      (products || []).filter(
        (p) => !p.isHidden && !p.isDeleted && p.status !== 'rejected' && p.status !== 'pending'
      ),
    [products]
  );

  const maxCatalogPrice = useMemo(() => {
    const highest = visibleCatalog.reduce((max, p) => Math.max(max, getEffectivePrice(p)), 0);
    const rounded = Math.ceil(highest / 10000) * 10000;
    return Math.max(100000, rounded || 500000);
  }, [visibleCatalog]);

  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refinedQuery, setRefinedQuery] = useState<string>('');
  const [activeFlags, setActiveFlags] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(maxCatalogPrice);
  const prevMaxCatalogRef = useRef<number>(maxCatalogPrice);

  useEffect(() => {
    setMaxPrice((prev) =>
      prev > maxCatalogPrice || prev === prevMaxCatalogRef.current ? maxCatalogPrice : prev
    );
    prevMaxCatalogRef.current = maxCatalogPrice;
  }, [maxCatalogPrice]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [categoryParam, query]);

  // Base scope matching URL query + category (used for accurate brand/variant/flag facet counts)
  const categoryScopedProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const normalizedCat = categoryParam.trim().toLowerCase();
    return visibleCatalog.filter((p) => {
      const matchesCategory =
        normalizedCat === 'all' || (p.category || '').trim().toLowerCase() === normalizedCat;
      const matchesUrlQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      return matchesCategory && matchesUrlQuery;
    });
  }, [visibleCatalog, categoryParam, query]);

  // Category facets across URL-query matching products
  const categoryFacets = useMemo<FacetItem[]>(() => {
    const q = query.trim().toLowerCase();
    const queryMatched = visibleCatalog.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
    );

    const counts = new Map<string, number>();
    queryMatched.forEach((p) => {
      const cat = (p.category || '').trim();
      if (!cat) return;
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });

    const ordered: string[] = [...CATEGORIES];
    counts.forEach((_, key) => {
      if (!ordered.some((c) => c.toLowerCase() === key.toLowerCase())) {
        ordered.push(key);
      }
    });

    return ordered
      .map((name) => {
        if (name === 'All') return { name, count: queryMatched.length };
        const matchedEntry = Array.from(counts.entries()).find(
          ([k]) => k.toLowerCase() === name.toLowerCase()
        );
        return { name, count: matchedEntry ? matchedEntry[1] : 0 };
      })
      .filter((item) => item.name === 'All' || item.count > 0 || item.name.toLowerCase() === categoryParam.toLowerCase());
  }, [visibleCatalog, query, categoryParam]);

  // Dynamic Brand, Flag, Rating facets from category-scoped products
  const { brandFacets, flagCounts, ratingCounts } = useMemo(() => {
    const brandMap = new Map<string, number>();
    const flags: Record<string, number> = {
      'In Stock': 0,
      'Free Delivery': 0,
      'Cash on Delivery': 0,
      'Flash Sale': 0,
      'Official Mall': 0,
      'Verified Seller': 0,
    };
    const ratings: Record<number, number> = {
      0: categoryScopedProducts.length,
      4.5: 0,
      4: 0,
      3: 0,
    };

    categoryScopedProducts.forEach((p) => {
      const brand = (p.brand || '').trim();
      if (brand) brandMap.set(brand, (brandMap.get(brand) || 0) + 1);

      Object.keys(flags).forEach((key) => {
        if (matchesFlag(p, key)) flags[key] += 1;
      });

      const score = Number(p.rating) || 0;
      if (score >= 4.5) ratings[4.5] += 1;
      if (score >= 4) ratings[4] += 1;
      if (score >= 3) ratings[3] += 1;
    });

    const toSortedList = (map: Map<string, number>): FacetItem[] =>
      Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return {
      brandFacets: toSortedList(brandMap),
      flagCounts: flags,
      ratingCounts: ratings,
    };
  }, [categoryScopedProducts]);

  // Apply all filters
  const filteredProducts = useMemo(() => {
    const rq = refinedQuery.trim().toLowerCase();
    return categoryScopedProducts.filter((p) => {
      if (rq) {
        const haystack = [
          p.name,
          p.description,
          p.brand,
          p.category,
          p.subcategory,
          ...(p.tags || []),
          ...(p.searchTags || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(rq)) return false;
      }

      const effectivePrice = getEffectivePrice(p);
      if (effectivePrice < minPrice || effectivePrice > maxPrice) return false;

      if (minDiscount > 0 && getDiscountPercent(p) < minDiscount) return false;

      const productRating = Number(p.rating) || 0;
      if (minRating > 0 && productRating < minRating) return false;

      if (selectedBrands.length > 0) {
        const b = (p.brand || '').trim();
        if (!selectedBrands.includes(b)) return false;
      }

      if (selectedCondition !== 'all') {
        const cond = p.condition || 'new';
        if (cond !== selectedCondition) return false;
      }

      if (activeFlags.length > 0 && !activeFlags.every((flag) => matchesFlag(p, flag))) {
        return false;
      }

      return true;
    });
  }, [
    categoryScopedProducts,
    refinedQuery,
    minPrice,
    maxPrice,
    minDiscount,
    minRating,
    selectedBrands,
    selectedCondition,
    activeFlags,
  ]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'price-low':
        return list.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
      case 'price-high':
        return list.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
      case 'best-selling':
        return list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
      case 'top-rated':
        return list.sort(
          (a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0) || (b.reviews || 0) - (a.reviews || 0)
        );
      case 'discount-high':
        return list.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));
      default:
        return list;
    }
  }, [filteredProducts, sortBy]);

  const activeFilterCount =
    (categoryParam !== 'All' ? 1 : 0) +
    (query.trim() ? 1 : 0) +
    (refinedQuery.trim() ? 1 : 0) +
    (minPrice > 0 || maxPrice < maxCatalogPrice ? 1 : 0) +
    (minDiscount > 0 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (selectedCondition !== 'all' ? 1 : 0) +
    selectedBrands.length +
    activeFlags.length;

  const toggleItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setList((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handleSelectCategory = (cat: string) => {
    const isAlready = categoryParam.toLowerCase() === cat.toLowerCase();
    const targetCat = cat === 'All' || isAlready ? 'All' : cat;
    navigate(`/search?category=${encodeURIComponent(targetCat)}${query ? `&q=${encodeURIComponent(query)}` : ''}`);
  };

  const resetAllFilters = () => {
    setRefinedQuery('');
    setMinPrice(0);
    setMaxPrice(maxCatalogPrice);
    setMinDiscount(0);
    setMinRating(0);
    setSelectedBrands([]);
    setSelectedCondition('all');
    setActiveFlags([]);
    if (categoryParam !== 'All' || query) {
      navigate('/search?category=All');
    }
  };

  const quickChips = [
    { key: 'In Stock', label: t('In Stock', 'স্টকে আছে'), active: activeFlags.includes('In Stock'), onClick: () => toggleItem(activeFlags, setActiveFlags, 'In Stock') },
    { key: 'Free Delivery', label: t('Free Delivery', 'ফ্রি ডেলিভারি'), active: activeFlags.includes('Free Delivery'), onClick: () => toggleItem(activeFlags, setActiveFlags, 'Free Delivery') },
    { key: 'Flash Sale', label: t('Flash Sale', 'ফ্ল্যাশ সেল'), active: activeFlags.includes('Flash Sale'), onClick: () => toggleItem(activeFlags, setActiveFlags, 'Flash Sale') },
    { key: '4-star', label: t('4★ & Up', '৪★ ও উপরে'), active: minRating >= 4, onClick: () => setMinRating(minRating >= 4 ? 0 : 4) },
    { key: '25-off', label: t('25%+ Off', '২৫%+ ছাড়'), active: minDiscount >= 25, onClick: () => setMinDiscount(minDiscount >= 25 ? 0 : 25) },
  ];

  // Active filter summary tags for quick removal
  const activeFilterTags: { id: string; label: string; onRemove: () => void }[] = [];
  if (categoryParam !== 'All') {
    activeFilterTags.push({
      id: 'cat',
      label: `${t('Category', 'ক্যাটাগরি')}: ${translateCategory(categoryParam)}`,
      onRemove: () => navigate(`/search?category=All${query ? `&q=${encodeURIComponent(query)}` : ''}`),
    });
  }
  if (query.trim()) {
    activeFilterTags.push({
      id: 'urlq',
      label: `${t('Search', 'সার্চ')}: "${query}"`,
      onRemove: () => navigate(`/search?category=${encodeURIComponent(categoryParam)}`),
    });
  }
  if (refinedQuery.trim()) {
    activeFilterTags.push({
      id: 'rq',
      label: `${t('Keyword', 'কীওয়ার্ড')}: "${refinedQuery.trim()}"`,
      onRemove: () => setRefinedQuery(''),
    });
  }
  if (minPrice > 0 || maxPrice < maxCatalogPrice) {
    activeFilterTags.push({
      id: 'price',
      label: `৳${formatBDT(minPrice)} – ৳${formatBDT(maxPrice)}`,
      onRemove: () => {
        setMinPrice(0);
        setMaxPrice(maxCatalogPrice);
      },
    });
  }
  if (minRating > 0) {
    activeFilterTags.push({
      id: 'rating',
      label: `${minRating}★+`,
      onRemove: () => setMinRating(0),
    });
  }
  if (minDiscount > 0) {
    activeFilterTags.push({
      id: 'discount',
      label: `${minDiscount}%+ ${t('Off', 'ছাড়')}`,
      onRemove: () => setMinDiscount(0),
    });
  }
  if (selectedCondition !== 'all') {
    activeFilterTags.push({
      id: 'cond',
      label: `${t('Condition', 'অবস্থা')}: ${selectedCondition}`,
      onRemove: () => setSelectedCondition('all'),
    });
  }
  activeFlags.forEach((f) => {
    activeFilterTags.push({
      id: `flag-${f}`,
      label: f,
      onRemove: () => toggleItem(activeFlags, setActiveFlags, f),
    });
  });
  selectedBrands.forEach((b) => {
    activeFilterTags.push({
      id: `brand-${b}`,
      label: `${t('Brand', 'ব্র্যান্ড')}: ${b}`,
      onRemove: () => toggleItem(selectedBrands, setSelectedBrands, b),
    });
  });

  const sharedSidebarProps = {
    categories: categoryFacets,
    categoryParam,
    onSelectCategory: handleSelectCategory,
    refinedQuery,
    onRefinedQueryChange: setRefinedQuery,
    minPrice,
    maxPrice,
    maxCatalogPrice,
    onPriceChange: (min: number, max: number) => {
      setMinPrice(min);
      setMaxPrice(max);
    },
    minDiscount,
    onMinDiscountChange: setMinDiscount,
    minRating,
    ratingCounts,
    onMinRatingChange: setMinRating,
    brands: brandFacets,
    selectedBrands,
    onToggleBrand: (b: string) => toggleItem(selectedBrands, setSelectedBrands, b),
    activeFlags,
    flagCounts,
    onToggleFlag: (f: string) => toggleItem(activeFlags, setActiveFlags, f),
    selectedCondition,
    onConditionChange: setSelectedCondition,
    activeFilterCount,
    onResetAll: resetAllFilters,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        wishlistCount={wishlist.length}
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => setIsWishlistOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
        onOrderHistoryClick={() => setIsOrdersOpen(true)}
        onLogout={onLogout}
        onSearch={(q) =>
          navigate(
            `/search?q=${encodeURIComponent(q)}${
              categoryParam !== 'All' ? `&category=${encodeURIComponent(categoryParam)}` : ''
            }`
          )
        }
        user={user}
        products={products}
        onSelectProduct={setSelectedProduct}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-5 lg:px-6 py-5 sm:py-8">
        {/* Clean Slider Styling */}
        <style>{`
          .price-range-thumb {
            pointer-events: none;
            position: absolute;
            width: 100%;
            height: 6px;
            top: 0;
            left: 0;
            right: 0;
            background: none;
            appearance: none;
            -webkit-appearance: none;
          }
          .price-range-thumb::-webkit-slider-thumb {
            pointer-events: auto;
            width: 16px;
            height: 16px;
            border-radius: 9999px;
            background: #ffffff;
            border: 2.5px solid #f85606;
            box-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
          }
          .price-range-thumb::-moz-range-thumb {
            pointer-events: auto;
            width: 16px;
            height: 16px;
            border-radius: 9999px;
            background: #ffffff;
            border: 2.5px solid #f85606;
            box-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
            cursor: pointer;
          }
        `}</style>

        {/* Search Results Breadcrumb & Info */}
        <div className="mb-4 sm:mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
          <div className="flex gap-3 sm:gap-4 min-w-0">
            <motion.button
              type="button"
              whileHover={{ x: -3 }}
              onClick={() => {
                try {
                  if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/');
                  }
                } catch {
                  navigate('/');
                }
              }}
              className="mt-0.5 sm:mt-1 w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center text-gray-500 hover:text-brand-orange hover:bg-orange-50 transition-all shadow-xs shrink-0 border border-gray-200/80 hover:border-brand-orange/30 cursor-pointer active:scale-95"
              title={t('Go back', 'ফিরে যান')}
              aria-label={t('Back to shop', 'দোকানে ফিরুন')}
            >
              <ArrowLeft size={18} />
            </motion.button>

            <div className="min-w-0">
              <nav className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 mb-1 truncate">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="hover:text-brand-orange cursor-pointer shrink-0"
                >
                  {t('Home', 'হোম')}
                </button>
                <span aria-hidden="true">/</span>
                <span className="text-brand-orange font-bold truncate">
                  {categoryParam === 'All' ? t('All Products', 'সব পণ্য') : translateCategory(categoryParam)}
                </span>
              </nav>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex flex-wrap items-baseline gap-2.5">
                {query ? (
                  <>
                    <span className="text-gray-500 font-semibold">{t('Results for', 'ফলাফল:')}</span>
                    <span className="text-brand-orange break-words">"{query}"</span>
                  </>
                ) : (
                  <span className="text-gray-900">
                    {categoryParam === 'All' ? t('All Products', 'সব পণ্য') : translateCategory(categoryParam)}
                  </span>
                )}
                <span className="text-xs font-medium text-gray-500 tabular-nums">
                  · {sortedProducts.length} {t('items found', 'টি পণ্য')}
                </span>
              </h1>
            </div>
          </div>

          {/* Desktop Sort + View Switcher */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            <FilterDropdown
              label={t('Sort by:', 'সাজান:')}
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'newest', label: t('Featured & Newest', 'জনপ্রিয় ও নতুন') },
                { value: 'best-selling', label: t('Best Selling', 'সবচেয়ে বেশি বিক্রিত') },
                { value: 'top-rated', label: t('Top Rated', 'সেরা রেটিং') },
                { value: 'discount-high', label: t('Biggest Discount', 'সর্বোচ্চ ছাড়') },
                { value: 'price-low', label: t('Price: Low to High', 'দাম: কম থেকে বেশি') },
                { value: 'price-high', label: t('Price: High to Low', 'দাম: বেশি থেকে কম') },
              ]}
              variant="light"
              ariaLabel={t('Sort products by', 'পণ্য সাজান')}
            />

            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label={t('Grid view', 'গ্রিড ভিউ')}
                aria-pressed={viewMode === 'grid'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-brand-orange text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label={t('List view', 'লিস্ট ভিউ')}
                aria-pressed={viewMode === 'list'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-brand-orange text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Tablet Filter + Sort Bar */}
        <div className="flex lg:hidden items-center justify-between gap-2.5 mb-4 bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-gray-50 hover:bg-orange-50 text-gray-800 hover:text-brand-orange border border-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <SlidersHorizontal size={15} className="text-brand-orange" />
            <span>{t('Filters', 'ফিল্টার')}</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-md bg-brand-orange text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <FilterDropdown
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              size="sm"
              options={[
                { value: 'newest', label: t('Featured', 'জনপ্রিয়') },
                { value: 'best-selling', label: t('Best Selling', 'বেশি বিক্রিত') },
                { value: 'top-rated', label: t('Top Rated', 'সেরা রেটিং') },
                { value: 'discount-high', label: t('Top Discount', 'সর্বোচ্চ ছাড়') },
                { value: 'price-low', label: t('Price: Low', 'কম দাম') },
                { value: 'price-high', label: t('Price: High', 'বেশি দাম') },
              ]}
              variant="light"
              ariaLabel={t('Sort products by', 'পণ্য সাজান')}
            />
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              aria-label={t('Toggle layout view', 'ভিউ পরিবর্তন করুন')}
              className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:text-brand-orange cursor-pointer"
            >
              {viewMode === 'grid' ? <List size={15} /> : <LayoutGrid size={15} />}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-7">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto no-scrollbar">
              <SearchFiltersSidebar {...sharedSidebarProps} />
            </div>
          </aside>

          {/* Mobile & Tablet Slide-over Filter Drawer */}
          <AnimatePresence>
            {isMobileFilterOpen && (
              <div className="fixed inset-0 z-[320] lg:hidden flex">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="fixed inset-0 bg-brand-navy/60 backdrop-blur-xs"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                  className="relative w-[88%] max-w-[360px] h-full bg-white shadow-2xl flex flex-col z-10 overflow-hidden"
                >
                  <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-2">
                      <Filter size={16} className="text-brand-orange" />
                      <h3 className="text-sm font-bold text-gray-900">
                        {t('All Filters', 'সব ফিল্টার')}
                      </h3>
                      {activeFilterCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-md bg-brand-orange text-white text-[10px] font-bold tabular-nums flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {activeFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={resetAllFilters}
                          className="text-xs font-semibold text-brand-orange px-2 py-1 rounded-lg hover:bg-orange-50 cursor-pointer"
                        >
                          {t('Reset', 'রিসেট')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsMobileFilterOpen(false)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
                        aria-label={t('Close filters', 'ফিল্টার বন্ধ করুন')}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <SearchFiltersSidebar {...sharedSidebarProps} hideHeader />
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-white shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="w-full py-3 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      {t('Show Results', 'ফলাফল দেখুন')} ({sortedProducts.length})
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Main Results Column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Quick-Toggle Filter Bar */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-gray-500 shrink-0 mr-1">
                {t('Quick Filters:', 'দ্রুত ফিল্টার:')}
              </span>
              {quickChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onClick}
                  aria-pressed={chip.active}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    chip.active
                      ? 'bg-brand-orange text-white border-brand-orange shadow-2xs'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Active Filter Summary Strip */}
            {activeFilterTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 px-1">
                {activeFilterTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={tag.onRemove}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200/80 text-xs font-medium text-brand-orange hover:bg-orange-100/80 transition-colors cursor-pointer"
                  >
                    <span>{tag.label}</span>
                    <X size={12} />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 hover:text-brand-orange cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>{t('Clear all', 'সব মুছুন')}</span>
                </button>
              </div>
            )}

            {/* Product Grid or List View */}
            <AnimatePresence mode="popLayout">
              {sortedProducts.length > 0 ? (
                viewMode === 'grid' ? (
                  <motion.div
                    key="grid"
                    layout
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 items-stretch"
                  >
                    {sortedProducts.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                        className="h-full"
                      >
                        <ProductCard
                          product={product}
                          onAddToCart={addToCart}
                          onClick={setSelectedProduct}
                          isWishlisted={wishlist.includes(product.id)}
                          onWishlistToggle={() => toggleWishlist(product.id)}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div key="list" layout className="space-y-3">
                    {sortedProducts.map((product) => {
                      const effectivePrice = getEffectivePrice(product);
                      const discount = getDiscountPercent(product);
                      const isWishlisted = wishlist.includes(product.id);
                      const isOutOfStock = product.stock !== undefined && product.stock <= 0;

                      return (
                        <div
                          key={product.id}
                          onClick={() => setSelectedProduct(product)}
                          className="bg-white border border-gray-200/90 hover:border-brand-orange/40 hover:shadow-md rounded-2xl p-3 sm:p-4 flex gap-3.5 sm:gap-5 cursor-pointer transition-all"
                        >
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                            <img
                              src={product.image || product.images?.[0] || product.gallery?.[0]}
                              alt={product.name}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {discount > 0 && (
                              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-brand-orange text-white text-[10px] font-bold tabular-nums">
                                -{discount}%
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-medium text-gray-500 truncate">
                                  {product.brand || translateCategory(product.category)}
                                  {product.freeShipping || product.deliveryFee === 0 ? (
                                    <>
                                      {' · '}
                                      <span className="text-emerald-600 font-semibold inline-flex items-center gap-0.5">
                                        <Truck size={11} /> {t('Free Delivery', 'ফ্রি ডেলিভারি')}
                                      </span>
                                    </>
                                  ) : null}
                                  {product.isFlashSale && (
                                    <>
                                      {' · '}
                                      <span className="text-brand-orange font-semibold inline-flex items-center gap-0.5">
                                        <Zap size={11} /> {t('Flash Sale', 'ফ্ল্যাশ সেল')}
                                      </span>
                                    </>
                                  )}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWishlist(product.id);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-rose-500 cursor-pointer shrink-0"
                                  aria-label={t('Toggle wishlist', 'উইশলিস্ট')}
                                >
                                  <Heart
                                    size={16}
                                    className={isWishlisted ? 'fill-rose-500 text-rose-500' : ''}
                                  />
                                </button>
                              </div>

                              <h3 className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 mt-0.5">
                                {product.name}
                              </h3>

                              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1 font-semibold text-gray-800 tabular-nums">
                                  <Star size={12} className="fill-amber-400 text-amber-400" />
                                  {(Number(product.rating) || 4.8).toFixed(1)}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="tabular-nums">
                                  {product.reviews || 0} {t('reviews', 'রিভিউ')}
                                </span>
                                {product.soldCount ? (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span className="tabular-nums">
                                      {product.soldCount} {t('sold', 'বিক্রি')}
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-gray-100">
                              <div className="flex items-baseline gap-2">
                                <span className="text-base sm:text-lg font-bold text-brand-orange tabular-nums">
                                  ৳{formatBDT(effectivePrice)}
                                </span>
                                {discount > 0 && product.originalPrice && (
                                  <span className="text-xs text-gray-400 line-through tabular-nums">
                                    ৳{formatBDT(product.originalPrice)}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                disabled={isOutOfStock}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product, 1);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-orange hover:bg-brand-orange-light disabled:bg-gray-200 disabled:text-gray-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                              >
                                <ShoppingBag size={14} />
                                <span>
                                  {isOutOfStock
                                    ? t('Out of Stock', 'স্টক শেষ')
                                    : t('Add to Cart', 'কার্টে যোগ')}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-200/80 px-6"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                    <SearchIcon size={28} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                    {t('No matching products found', 'কোনো পণ্য পাওয়া যায়নি')}
                  </h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    {t(
                      'Try removing some filters or expanding your price range to see more items.',
                      'আরও পণ্য দেখতে কিছু ফিল্টার সরিয়ে দিন বা মূল্যের সীমা বাড়িয়ে দেখুন।'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="mt-6 px-6 py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    {t('Reset All Filters', 'সব ফিল্টার রিসেট করুন')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer onOpenOrders={() => setIsOrdersOpen(true)} />
    </div>
  );
};
