import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/Header';
import { MobileHeroBanner } from '../components/MobileHeroBanner';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { Footer } from '../components/Footer';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { FlashSaleCountdown } from '../components/FlashSaleCountdown';
import { CategoryGrid } from '../components/CategoryGrid';
import { useSiteConfig } from '../hooks/useSiteConfig';

import { LiveChatWidget } from '../components/LiveChatWidget';
import { QuickViewModal } from '../components/QuickViewModal';
import { ProductComparisonModal } from '../components/ProductComparisonModal';
import { Product, CartItem, User as UserType } from '../types';
import { ThemeConfig } from '../components/BackgroundLayer';
import { Zap, Sparkles, Scale, X, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { adminApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

interface HomePageProps {
  currentTheme: ThemeConfig;
  user: UserType | null;
  cart: CartItem[];
  wishlist: string[];
  products: Product[];
  filteredProducts: Product[];
  selectedCategory: string;
  searchQuery: string;
  timeLeft?: { hours: number; minutes: number; seconds: number };
  setSelectedCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  addToCart: (p: Product, q?: number, s?: string, c?: string) => void;
  setSelectedProduct: (p: Product | null) => void;
  toggleWishlist: (id: string) => void;
  setIsCartOpen: (open: boolean) => void;
  setIsWishlistOpen: (open: boolean) => void;
  setIsLoginOpen: (open: boolean) => void;
  setIsOrdersOpen: (open: boolean) => void;
  setIsAdminOpen?: (open: boolean) => void;
  setIsThemePanelOpen?: (open: boolean) => void;
  onLogout: () => void;
  onUpdateProduct?: (p: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentTheme,
  user,
  cart,
  wishlist,
  products,
  filteredProducts,
  selectedCategory,
  searchQuery,
  timeLeft,
  setSelectedCategory,
  setSearchQuery,
  addToCart,
  setSelectedProduct,
  toggleWishlist,
  setIsCartOpen,
  setIsWishlistOpen,
  setIsLoginOpen,
  setIsOrdersOpen,
  setIsAdminOpen,
  setIsThemePanelOpen,
  onLogout,
  onUpdateProduct
}) => {
  const navigate = useNavigate();
  const { siteConfig } = useSiteConfig();
  const { t, translateCategory } = useLanguage();
  const [isFlashExpired, setIsFlashExpired] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('elora-recently-viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const INITIAL_VISIBLE_COUNT = 18;
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_VISIBLE_COUNT);

  // Reset pagination when category or search changes
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [selectedCategory, searchQuery]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const handleProductSelectWithHistory = (product: Product) => {
    // Add to recently viewed
    setRecentlyViewedIds((prev) => {
      const updated = [product.id, ...prev.filter((id) => id !== product.id)].slice(0, 10);
      try {
        localStorage.setItem('elora-recently-viewed', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
    setSelectedProduct(product);
  };

  const handleClearHistory = () => {
    setRecentlyViewedIds([]);
    try {
      localStorage.removeItem('elora-recently-viewed');
    } catch (err) {
      console.error(err);
    }
  };

  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [recentlyViewedIds, products]);

  const handleCompareToggle = (product: Product) => {
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        return [...prev.slice(1), product];
      }
      return [...prev, product];
    });
  };

  const sponsoredProducts = useMemo(() => {
    // Only display active sponsored products that have remaining budget
    return products.filter(
      p => !p.isDeleted && 
      p.isSponsored && 
      p.adStatus === 'active' && 
      ((p.adBudget || 500) > ((p.adClicks || 0) * 3))
    );
  }, [products]);

  // Track impressions for sponsored products viewed on storefront
  const trackedImpressionsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (sponsoredProducts.length > 0 && onUpdateProduct) {
      sponsoredProducts.forEach((p) => {
        if (!trackedImpressionsRef.current.has(p.id)) {
          trackedImpressionsRef.current.add(p.id);
          const nextImpressions = (p.adImpressions || 0) + 1;
          onUpdateProduct({
            ...p,
            adImpressions: nextImpressions
          });
          if (user?.role === 'admin') {
            adminApi.updateProduct(p.id, { adImpressions: nextImpressions }).catch(() => {});
          }
        }
      });
    }
  }, [sponsoredProducts, onUpdateProduct, user?.role]);

  const flashSaleProducts = useMemo(() => {
    const activeProducts = products.filter(p => !p.isDeleted && (!p.status || p.status === 'approved'));
    const flashList = activeProducts.filter(p => p.isFlashSale);
    if (flashList.length > 0) return flashList;
    
    const tagged = activeProducts.filter(p => p.tags?.includes('flash'));
    if (tagged.length > 0) return tagged.slice(0, 6);

    return activeProducts.slice(0, 6);
  }, [products]);

  return (
    <>
      <Header 
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)} 
        wishlistCount={wishlist.length}
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => setIsWishlistOpen(true)}
        onLoginClick={() => setIsLoginOpen(true)}
        onOrderHistoryClick={() => setIsOrdersOpen(true)}
        onLogout={onLogout}
        onSearch={setSearchQuery}
        user={user}
        products={products}
        onSelectProduct={handleProductSelectWithHistory}
      />
      
      <main className="min-h-screen font-sans">
        {/* Maintenance Notice Banner */}
        {siteConfig?.maintenanceMode && (
          <div className="bg-amber-500 text-gray-950 font-mono text-xs font-black py-2.5 px-4 text-center flex items-center justify-center gap-2 shadow-inner">
            <span className="text-base">⚠️</span>
            <span>{siteConfig?.maintenanceNotice || t('System Undergoing Scheduled Maintenance', 'সাইট রক্ষণাবেক্ষণ চলছে')}</span>
          </div>
        )}

        {/* Mobile & Tablet Dedicated Standalone Hero Banner & Desktop Hero */}
        {(siteConfig?.showHeroSlider ?? true) && (
          <>
            <MobileHeroBanner />
            <Hero 
              onCategorySelect={setSelectedCategory} 
              selectedCategory={selectedCategory} 
            />
          </>
        )}
        
        <div id="shop" className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6 py-4 sm:py-6 space-y-8 sm:space-y-12">
          {/* Categories grid (flat marketplace style) */}
          {(siteConfig?.showCategoryCircles ?? true) && (
            <CategoryGrid
              products={products}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
              scrollTargetId="just-for-you-section"
            />
          )}

          {/* Sponsored Ad Campaigns section */}
          {(siteConfig?.showSponsoredAds ?? true) && sponsoredProducts.length > 0 && (
            <div className="space-y-4 sm:space-y-6 bg-[#FAF9F6] p-3.5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl md:rounded-[36px] border-2 border-[#16171d]/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange/5 blur-3xl rounded-full" />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 relative z-10 border-b border-[#16171d]/5 pb-3 sm:pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-orange text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-brand-orange/30 shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-black text-gray-900 uppercase tracking-tight">{t('Sponsored Offers', 'স্পনসরড বিজ্ঞাপন')}</h2>
                      <span className="bg-brand-orange text-white text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border border-brand-orange/20">{t('Sponsored', 'বিজ্ঞাপন')}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 font-mono">{t('Premium promoted apparel and accessories', 'বাছাইকৃত প্রিমিয়াম প্রচারিত পণ্য')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-4 relative z-10">
                {sponsoredProducts.map((product) => (
                  <div key={`sp-${product.id}`} className="relative group/ad cursor-pointer">
                    <ProductCard 
                      product={product} 
                      onAddToCart={addToCart}
                      onClick={() => {
                        // Increment clicks and decrement budget in real-time (৳3 BDT CPC)
                        const cost = 3;
                        const currentClicks = (product.adClicks || 0) + 1;
                        const allocatedBudget = product.adBudget !== undefined ? product.adBudget : 500;
                        const totalSpent = currentClicks * cost;
                        const remainingBudget = Math.max(0, allocatedBudget - totalSpent);
                        const isStillActive = remainingBudget > 0;
                        
                        const updatedData = {
                          ...product,
                          isSponsored: isStillActive,
                          adClicks: currentClicks,
                          adStatus: isStillActive ? (product.adStatus || 'active') : 'ended'
                        };

                        if (onUpdateProduct) {
                          onUpdateProduct(updatedData);
                        }
                        if (user?.role === 'admin') {
                          adminApi.updateProduct(product.id, {
                            isSponsored: isStillActive,
                            adClicks: currentClicks,
                            adStatus: updatedData.adStatus
                          }).catch(() => {});
                        }

                        handleProductSelectWithHistory(product);
                      }}
                      isWishlisted={wishlist.includes(product.id)}
                      onWishlistToggle={() => toggleWishlist(product.id)}
                      onQuickView={setQuickViewProduct}
                      isCompared={comparedProducts.some((p) => p.id === product.id)}
                      onCompareToggle={handleCompareToggle}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Flash Sale Section */}
          {(siteConfig?.showFlashSale ?? true) && (
            <div id="flash-sale-section" className="space-y-5 sm:space-y-8 pb-4 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange relative overflow-hidden group shrink-0">
                  <Zap size={20} className="fill-brand-orange text-brand-orange relative z-10" />
                </div>
                <FlashSaleCountdown onExpireChange={setIsFlashExpired} />
              </div>
              
              <button 
                onClick={() => setSelectedCategory('All')}
                className="self-start sm:self-auto px-5 sm:px-6 py-2.5 border border-brand-orange/25 hover:border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm font-display whitespace-nowrap cursor-pointer"
              >
                {t('Shop All Items', 'সব পণ্য দেখুন')}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5 sm:gap-4">
              {flashSaleProducts.slice(0, 6).map((product) => {
                const adjustedProduct = isFlashExpired ? {
                  ...product,
                  price: product.normalPriceBeforeFlash || product.originalPrice || product.price,
                  originalPrice: undefined // Revert to standard price look
                } : product;

                return (
                  <div key={product.id} className="transform-gpu">
                    <ProductCard 
                      product={adjustedProduct} 
                      onAddToCart={addToCart}
                      onClick={handleProductSelectWithHistory}
                      isWishlisted={wishlist.includes(product.id)}
                      onWishlistToggle={() => toggleWishlist(product.id)}
                      onQuickView={setQuickViewProduct}
                      isCompared={comparedProducts.some((p) => p.id === product.id)}
                      onCompareToggle={handleCompareToggle}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          )}


          {/* Just For You Section */}
          {(siteConfig?.showJustForYou ?? true) && (
            <div id="just-for-you-section" className="space-y-6 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/80 pb-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 font-display flex items-center gap-2">
                    <span>
                      {selectedCategory === 'All'
                        ? t('Just for You', 'আপনার জন্য')
                        : translateCategory(selectedCategory)}
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedCategory === 'All'
                      ? t('Authentic products curated for you', 'আপনার জন্য বাছাইকৃত আসল পণ্য')
                      : `${translateCategory(selectedCategory)} ${t('products', 'পণ্যসমূহ')}`}
                  </p>
                </div>

                <div className="flex items-center flex-wrap gap-2 self-start sm:self-center">
                  <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-100 px-2.5 py-1.5 rounded-lg tabular-nums">
                    {filteredProducts.length} {t('items found', 'টি পণ্য পাওয়া গেছে')}
                  </span>
                  {selectedCategory !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('All')}
                      className="text-[11px] font-bold text-gray-700 hover:text-brand-orange bg-white border border-gray-200 hover:border-brand-orange/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {t('All Products', 'সব পণ্য')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/search?category=${encodeURIComponent(selectedCategory)}`)
                    }
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-brand-orange hover:text-white bg-orange-50 hover:bg-brand-orange border border-orange-200/80 hover:border-brand-orange px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                  >
                    <SlidersHorizontal size={12} />
                    <span>{t('Filter & Sort', 'ফিল্টার ও সার্চ')}</span>
                  </button>
                </div>
              </div>

              {/* Product Grid: 2 cols on mobile, 3 on tablet, 4 on lg, 5 on xl, 6 on 2xl with 12px-16px gap */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-8 sm:p-12 text-center shadow-sm my-4">
                  <div className="w-16 h-16 bg-orange-50 text-brand-orange rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="text-base font-bold text-gray-800 mb-1">
                    {t('No products found', 'কোনো পণ্য পাওয়া যায়নি')}
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                    {t('Try selecting a different category or search query to explore other products.', 'অন্য ক্যাটাগরি বেছে নিন অথবা অন্য কীওয়ার্ড দিয়ে খুঁজে দেখুন।')}
                  </p>
                  {selectedCategory !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('All')}
                      className="px-5 py-2 bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      {t('Show All Products', 'সব পণ্য দেখান')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2.5 sm:gap-4 items-stretch">
                  {displayedProducts.map((product, idx) => (
                    <motion.div 
                      key={product.id} 
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.025, 0.35), duration: 0.3 }}
                      className="h-full"
                    >
                      <ProductCard 
                        product={product} 
                        onAddToCart={addToCart}
                        onClick={handleProductSelectWithHistory}
                        isWishlisted={wishlist.includes(product.id)}
                        onWishlistToggle={() => toggleWishlist(product.id)}
                        onQuickView={setQuickViewProduct}
                        isCompared={comparedProducts.some((p) => p.id === product.id)}
                        onCompareToggle={handleCompareToggle}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Load more button if list is long */}
              {filteredProducts.length > visibleCount && (
                <div className="flex flex-col items-center justify-center pt-4 pb-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 12)}
                    className="px-8 py-2.5 bg-white hover:bg-orange-50 border border-brand-orange text-brand-orange hover:text-orange-600 font-bold text-xs uppercase tracking-wider rounded-md transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    {t('Load More', 'আরও দেখুন')} ({filteredProducts.length - visibleCount} {t('more', 'টি বাকি')})
                  </button>
                  <p className="text-[11px] text-gray-400 mt-2">
                    {t('Showing', 'দেখানো হচ্ছে')} {displayedProducts.length} {t('of', 'টির মধ্যে')} {filteredProducts.length} {t('products', 'টি পণ্য')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recently Viewed Products Section */}
          {(siteConfig?.showRecentlyViewed ?? true) && (
            <RecentlyViewed
              products={recentlyViewedProducts}
              onAddToCart={addToCart}
              onProductClick={handleProductSelectWithHistory}
              onClearHistory={handleClearHistory}
              wishlist={wishlist}
              onWishlistToggle={toggleWishlist}
              onQuickView={setQuickViewProduct}
            />
          )}
        </div>
      </main>

      {/* Floating Product Comparison Bar */}
      <AnimatePresence>
        {comparedProducts.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-gray-900/95 backdrop-blur-md text-white px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl border border-gray-700 flex items-center justify-between gap-2.5 sm:gap-4 w-[calc(100%-24px)] sm:w-auto max-w-xl"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Scale size={17} className="text-brand-orange shrink-0" />
              <div className="text-left leading-tight min-w-0">
                <p className="text-xs font-bold font-sans truncate">
                  {comparedProducts.length} {comparedProducts.length === 1 ? t('Product Selected', 'টি পণ্য নির্বাচিত') : t('Products Selected', 'টি পণ্য নির্বাচিত')}
                </p>
                <p className="hidden xs:block text-[10px] text-gray-400 font-mono">{t('Max 4 items', 'সর্বোচ্চ ৪টি পণ্য')}</p>
              </div>
            </div>

            <div className="hidden xs:flex -space-x-2 shrink-0">
              {comparedProducts.map((p) => (
                <div key={p.id} className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-gray-800 bg-white">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleCompareToggle(p)}
                    className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => setIsCompareModalOpen(true)}
                className="bg-brand-orange hover:bg-brand-orange-light text-white text-[11px] sm:text-xs font-black uppercase tracking-wider px-3 sm:px-4 py-2 rounded-xl transition-all shadow-md shadow-orange-500/30 flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <span>{t('Compare Now', 'তুলনা করুন')}</span>
                <ArrowRight size={13} />
              </button>

              <button
                onClick={() => setComparedProducts([])}
                className="text-gray-400 hover:text-white text-xs p-1.5 cursor-pointer"
                title={t('Clear selection', 'নির্বাচন মুছুন')}
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={addToCart}
          onOpenFullDetail={handleProductSelectWithHistory}
          isWishlisted={wishlist.includes(quickViewProduct.id)}
          onWishlistToggle={toggleWishlist}
        />
      )}

      {/* Comparison Modal */}
      {isCompareModalOpen && (
        <ProductComparisonModal
          products={comparedProducts}
          onClose={() => setIsCompareModalOpen(false)}
          onRemoveProduct={(id) => setComparedProducts((prev) => prev.filter((p) => p.id !== id))}
          onClearAll={() => setComparedProducts([])}
          onAddToCart={addToCart}
          onProductClick={handleProductSelectWithHistory}
        />
      )}

      {/* Live Chat Concierge Widget */}
      {(siteConfig?.showLiveChatWidget ?? true) && (
        <LiveChatWidget user={user} products={products} onOpenOrders={() => setIsOrdersOpen(true)} />
      )}

      <Footer onOpenOrders={() => setIsOrdersOpen(true)} />
    </>
  );
};
