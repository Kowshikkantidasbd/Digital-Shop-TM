import React, { useState, useEffect, Suspense, lazy, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCard } from './components/ProductCard';
import { CartSidebar } from './components/CartSidebar';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrderHistoryModal } from './components/OrderHistoryModal';
import { WishlistSidebar } from './components/WishlistSidebar';
import { Footer } from './components/Footer';
import { BackgroundLayer, ThemeConfig } from './components/BackgroundLayer';
import { PRODUCTS, CATEGORIES } from './constants';
import { Product, CartItem, Order, Notification, Review, User as UserType } from './types';
import { ShoppingCart, Store, MessageCircle, User, Sparkles, Box, Layers, Droplets, Moon, Sun, RotateCcw, Palette, Heart, CloudLightning } from 'lucide-react';
import { authApi, cartApi, orderApi, productApi, adminApi, configApi } from './services/api';
import { useToast } from './components/Toast';
import { RootLayout } from './app/layout';
import { authClient } from './lib/auth-client';
import { useSEO } from './hooks/useSEO';
import { isSuperAdminEmail } from './constants/adminConfig';
import { lazyRetry } from './utils/lazyRetry';
import { useLanguage } from './contexts/LanguageContext';
import { CircularLoader } from './components/CircularLoader';

// Next.js App Router style route modules (code-split with automatic retry recovery)
const SearchPage = lazyRetry(() => import('./app/search/page').then(m => ({ default: m.SearchPage })));
const CheckoutPage = lazyRetry(() => import('./app/checkout/page').then(m => ({ default: m.CheckoutPage })));
const AuthPage = lazyRetry(() => import('./app/auth/page').then(m => ({ default: m.AuthPage })));
const ProfilePage = lazyRetry(() => import('./app/profile/page').then(m => ({ default: m.ProfilePage })));
const InvoicePage = lazyRetry(() => import('./app/invoice/[orderId]/page').then(m => ({ default: m.InvoicePage })));
const AdminDashboard = lazyRetry(() => import('./app/admin/page').then(m => ({ default: m.AdminDashboard })));
const ProductModal = lazyRetry(() => import('./components/ProductModal').then(m => ({ default: m.ProductModal })));
const ChatModal = lazyRetry(() => import('./components/ChatModal').then(m => ({ default: m.ChatModal })));

function PageFallback() {
  return <CircularLoader />;
}

  function CategoryRedirect() {
    const { categorySlug } = useParams<{ categorySlug: string }>();
    const slug = (categorySlug || '').toLowerCase();
    
    let categoryName = 'All';
    if (slug === 'all' || slug === 'all-products') categoryName = 'All';
    else if (slug === 'mobiles' || slug === 'smartphones' || slug === 'smartphones-mobiles' || slug === 'mobiles-phones') categoryName = 'Smartphones & Mobiles';
    else if (slug === 'laptops' || slug === 'laptops-pc' || slug === 'laptops-computers' || slug === 'computers') categoryName = 'Laptops & Computers';
    else if (slug === 'audio' || slug === 'headphones' || slug === 'headphones-audio' || slug === 'audio-sound') categoryName = 'Headphones & Audio';
    else if (slug === 'fashions' || slug === 'fashion') categoryName = 'Fashions';
    else if (slug === 'health-beauty' || slug === 'health_beauty' || slug === 'health-and-beauty' || slug === 'beauty') categoryName = 'Health & Beauty';
    else if (slug === 'home-lifestyle' || slug === 'home_lifestyle' || slug === 'home-and-lifestyle' || slug === 'home-living') categoryName = 'Home & Lifestyle';
    else if (slug === 'home-appliances' || slug === 'home_appliances' || slug === 'home-and-appliances' || slug === 'appliances') categoryName = 'Home Appliances';
    else if (slug === 'sports-outdoors' || slug === 'sports_outdoors' || slug === 'sports-and-outdoors' || slug === 'sports') categoryName = 'Sports & Outdoors';
    else if (slug === 'groceries' || slug === 'grocery') categoryName = 'Groceries';
    else if (slug === 'automotive' || slug === 'auto') categoryName = 'Automotive';
    else if (slug === 'watches' || slug === 'watches-wearables' || slug === 'wearables') categoryName = 'Watches & Wearables';
    else if (slug === 'cameras' || slug === 'cameras-photography' || slug === 'photography') categoryName = 'Cameras & Photography';
    else if (slug === 'gaming' || slug === 'gaming-consoles' || slug === 'consoles') categoryName = 'Gaming & Consoles';
    else if (slug === 'accessories' || slug === 'electronics' || slug === 'electronic-accessories' || slug === 'tech-accessories') categoryName = 'Electronic Accessories';
    else if (slug === 'bags' || slug === 'bags-travel' || slug === 'bags-luggage' || slug === 'luggage') categoryName = 'Bags & Luggage';
    else if (slug === 'footwear' || slug === 'shoes' || slug === 'footwear-shoes' || slug === 'shoes-footwear') categoryName = 'Footwear & Shoes';
    else if (slug === 'books' || slug === 'books-stationery' || slug === 'stationery') categoryName = 'Books & Stationery';
    else if (slug === 'kids' || slug === 'toys' || slug === 'kids-toys' || slug === 'toys-kids') categoryName = 'Toys & Kids';
    else if (slug === 'pet-care' || slug === 'pets' || slug === 'pet-supplies') categoryName = 'Pet Supplies';
    else {
      const matched = CATEGORIES.find(c => 
        c.toLowerCase().replace(/[^a-z0-9]/g, '') === slug.replace(/[^a-z0-9]/g, '')
      );
      if (matched) categoryName = matched;
    }

    return <Navigate to={`/search?category=${encodeURIComponent(categoryName)}`} replace />;
  }

  function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
      // Smoothly scroll to top on page route changes, but avoid jumping if navigating within a modal
      if (!pathname.startsWith('/product/')) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    }, [pathname]);

    return null;
  }

  export default function App() {
    return (
      <RootLayout>
        <AppContent />
      </RootLayout>
    );
  }

  function AppContent() {
    const navigate = useNavigate();
    const location = useLocation();
    useSEO();
    const { showToast } = useToast();
    const { t } = useLanguage();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isRouteLoading, setIsRouteLoading] = useState(false);
    const prevRouteRef = useRef<string | null>(null);

    useEffect(() => {
      const routeKey = location.pathname.startsWith('/product/')
        ? 'product-route'
        : `${location.pathname}${location.search}`;
      if (prevRouteRef.current === null) {
        prevRouteRef.current = routeKey;
        return;
      }
      if (prevRouteRef.current === routeKey) return;
      prevRouteRef.current = routeKey;

      setIsRouteLoading(true);
      const timer = setTimeout(() => setIsRouteLoading(false), 320);
      return () => clearTimeout(timer);
    }, [location.pathname, location.search]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [products, setProducts] = useState<Product[]>(() => {
      try {
        const cached = localStorage.getItem('elora-cached-products');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map((p: Product) => String(p.id)));
            const missingCatalogItems = PRODUCTS.filter(
              (p) => !existingIds.has(String(p.id)) && (!p.status || p.status === 'approved')
            );
            return [...parsed, ...missingCatalogItems];
          }
        }
      } catch {}
      return PRODUCTS;
    });
    
    // Better Auth session & server-backed state for personal user profile
    // Never persist personal customer data (name, phone, address) to browser localStorage
    const [user, setUser] = useState<UserType | null>(null);

    // In-memory orders state backed authoritatively by server API — never store in localStorage
    const [orders, setOrders] = useState<Order[]>([]);

    // Purge any legacy personal customer data from localStorage on startup (#Phase 5)
    useEffect(() => {
      try {
        localStorage.removeItem('elora-user');
        localStorage.removeItem('elora-orders');
      } catch {}
    }, []);

    const [cart, setCart] = useState<CartItem[]>(() => {
      try {
        const savedCart = localStorage.getItem('elora-cart');
        return savedCart ? JSON.parse(savedCart) : [];
      } catch (e) {
        return [];
      }
    });

    useEffect(() => {
      localStorage.setItem('elora-cart', JSON.stringify(cart));
    }, [cart]);

    const [wishlist, setWishlist] = useState<string[]>(() => {
      try {
        const saved = localStorage.getItem('elora-wishlist');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    });

    useEffect(() => {
      localStorage.setItem('elora-wishlist', JSON.stringify(wishlist));
    }, [wishlist]);
    const [notifications, setNotifications] = useState<Notification[]>(() => {
      try {
        const saved = localStorage.getItem('elora-notifications');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    });

    useEffect(() => {
      localStorage.setItem('elora-notifications', JSON.stringify(notifications));
    }, [notifications]);
    const [isAppLoading, setIsAppLoading] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState<boolean>(() => {
      try {
        const cached = localStorage.getItem('elora-general-config');
        if (cached) {
          const parsed = JSON.parse(cached);
          return !!parsed.maintenanceMode;
        }
      } catch {}
      return false;
    });

    useEffect(() => {
      const applyConfig = (config: any) => {
        if (!config) return;
        try {
          localStorage.setItem('elora-general-config', JSON.stringify(config));
        } catch {}
        if ('maintenanceMode' in config) {
          setMaintenanceMode(!!config.maintenanceMode);
        }
      };

      const fetchConfig = async () => {
        try {
          const config = await configApi.getConfig();
          applyConfig(config);
        } catch (e) {
          console.error('Error fetching global config in App:', e);
        }
      };
      fetchConfig();

      const handleConfigUpdated = (e: Event) => {
        const custom = e as CustomEvent;
        if (custom.detail) {
          applyConfig(custom.detail);
        } else {
          fetchConfig();
        }
      };

      window.addEventListener('elora-config-updated', handleConfigUpdated);
      return () => window.removeEventListener('elora-config-updated', handleConfigUpdated);
    }, []);

    const handleUpdateUser = (updatedUser: UserType | null) => {
      setUser(updatedUser);
    };

    // Better Auth Session Bootstrap & Event Listener
    useEffect(() => {
      let isMounted = true;

      const hydrateAuthenticatedUser = async (sessionUser: UserType) => {
        if (!isMounted || !sessionUser) return;
        try {
          setIsSyncing(true);
          const isSuperAdmin = isSuperAdminEmail(sessionUser.email);

          const [rawProfile, cartData, ordersData] = await Promise.all([
            authApi.getProfile().catch(() => null) as Promise<any>,
            cartApi.getCart().catch(() => []),
            orderApi.getOrders().catch(() => [])
          ]);

          if (!isMounted) return;

          const effectiveRole = isSuperAdmin ? 'admin' : (rawProfile?.role || sessionUser.role || 'user');
          const cachedPhone =
            rawProfile?.phone ||
            sessionUser.phone ||
            localStorage.getItem(`phone_${sessionUser.id}`) ||
            (sessionUser.email ? localStorage.getItem(`phone_${sessionUser.email}`) : '') ||
            '';

          const currentUserObj: UserType = {
            ...sessionUser,
            ...rawProfile,
            id: rawProfile?.id || sessionUser.id,
            name: rawProfile?.name || sessionUser.name || (sessionUser.email ? sessionUser.email.split('@')[0] : 'Member'),
            email: sessionUser.email || rawProfile?.email || '',
            avatar:
              rawProfile?.avatar ||
              sessionUser.avatar ||
              `https://api.dicebear.com/7.x/identicon/svg?seed=${sessionUser.id}`,
            phone: cachedPhone,
            role: effectiveRole,
            addresses: rawProfile?.addresses || sessionUser.addresses || []
          };

          setUser(currentUserObj);
          if (Array.isArray(cartData) && cartData.length > 0) {
            setCart(cartData);
          }
          setOrders(Array.isArray(ordersData) ? ordersData : []);

          if (effectiveRole === 'admin') {
            adminApi.getUsers().then((allUsers) => {
              if (isMounted && allUsers) setUsers(allUsers);
            }).catch(() => {});
          }
        } catch (error) {
          console.error('Failed to sync authenticated data:', error);
        } finally {
          if (isMounted) setIsSyncing(false);
        }
      };

      const initSession = async () => {
        try {
          const baSession = await authClient.getSession();
          if (baSession?.user) {
            await hydrateAuthenticatedUser(baSession.user);
          } else if (isMounted) {
            setUser(null);
          }
        } catch {
          if (isMounted) setUser(null);
        }
      };

      initSession();

      const handleAuthChanged = (e: Event) => {
        const custom = e as CustomEvent<UserType | null>;
        if (custom.detail) {
          hydrateAuthenticatedUser(custom.detail);
        } else {
          setUser(null);
        }
      };

      window.addEventListener('elora-auth-changed', handleAuthChanged);
      return () => {
        isMounted = false;
        window.removeEventListener('elora-auth-changed', handleAuthChanged);
      };
    }, []);

    // Initial Products Fetch (Instant render from cached copy, background query for approved products)
    useEffect(() => {
      let isMounted = true;
      const loadInitialProducts = async () => {
        try {
          const { products: fetched } = await productApi.getApprovedProducts(200);
          if (isMounted && fetched && fetched.length > 0) {
            const fetchedIds = new Set(fetched.map((p) => String(p.id)));
            const fallbackNewCatItems = PRODUCTS.filter(
              (p) =>
                (!p.status || p.status === 'approved') &&
                !fetchedIds.has(String(p.id))
            );
            const merged = [...fetched, ...fallbackNewCatItems];
            setProducts(merged);
            try {
              localStorage.setItem('elora-cached-products', JSON.stringify(merged));
            } catch {}
          }
        } catch (err) {
          console.warn('Background products load notice:', err);
        }
      };

      loadInitialProducts();
      return () => { isMounted = false; };
    }, []);

    // Cart Sync Effect
    useEffect(() => {
      if (!user || isAppLoading) return;

      const syncTimeout = setTimeout(async () => {
        try {
          setIsSyncing(true);
          await cartApi.syncCart(cart);
        } catch (error) {
          console.error('Cart sync failed:', error);
        } finally {
          setIsSyncing(false);
        }
      }, 2000); // Debounced sync

      return () => clearTimeout(syncTimeout);
    }, [cart, user?.id, isAppLoading]);

    // Live Cart Re-validation against latest products catalog (#58)
    useEffect(() => {
      if (products.length === 0) return;
      setCart(prev => {
        let changed = false;
        const updated = prev.map(item => {
          const live = products.find(p => String(p.id) === String(item.id));
          if (live) {
            const livePrice = Math.round(Number(live.price) || item.price);
            const liveStock = live.stock !== undefined ? Number(live.stock) : (item.stock ?? 50);
            const maxAllowed = Math.max(1, Math.min(liveStock, 99));
            const clampedQty = Math.min(item.quantity, maxAllowed);
            if (item.price !== livePrice || item.stock !== liveStock || item.quantity !== clampedQty) {
              changed = true;
              return {
                ...item,
                price: livePrice,
                stock: liveStock,
                quantity: clampedQty
              };
            }
          }
          return item;
        });
        return changed ? updated : prev;
      });
    }, [products]);

    // SPA Link and Form Navigation Interceptor to enforce ZERO full-page reloads across the entire session
    useEffect(() => {
      const handleGlobalClick = (event: MouseEvent) => {
        // Ignore modified clicks (cmd, ctrl, shift, right-click, middle-click)
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }

        // Never intercept buttons or interactive controls
        const target = event.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
          return;
        }

        const anchor = target.closest('a');
        if (!anchor) return;

        // Ignore external targets or downloads
        if (anchor.target && anchor.target !== '_self') return;
        if (anchor.hasAttribute('download')) return;

        const href = anchor.getAttribute('href');
        if (!href) return;

        // Skip non-http/internal protocols and hash anchors
        if (href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
        if (href.startsWith('#')) return;

        try {
          const url = new URL(href, window.location.origin);
          if (url.origin === window.location.origin) {
            // Internal application route: intercept and navigate client-side with router pushState
            event.preventDefault();
            const destination = url.pathname + url.search + url.hash;
            if (destination !== location.pathname + location.search + location.hash) {
              navigate(destination);
            }
          }
        } catch {
          // Ignore parse failures
        }
      };

      const handleGlobalSubmit = (event: SubmitEvent) => {
        const form = event.target as HTMLFormElement;
        // Intercept any unhandled HTML standard form submission that would trigger a browser POST/GET refresh
        if (form && !event.defaultPrevented) {
          event.preventDefault();
        }
      };

      document.addEventListener('click', handleGlobalClick, false);
      document.addEventListener('submit', handleGlobalSubmit, false);
      return () => {
        document.removeEventListener('click', handleGlobalClick, false);
        document.removeEventListener('submit', handleGlobalSubmit, false);
      };
    }, [navigate, location]);

  const themes: ThemeConfig[] = [
    { id: 'white', name: 'White Minimal', type: 'color', value: '#FFFFFF', text: 'text-gray-900', darkMode: false },
    { id: 'default', name: 'Digital Classic', type: 'color', value: '#F5F5F5', text: 'text-gray-900', darkMode: false },
    { id: 'emerald-custom', name: 'Emerald Glow', type: 'color', value: '#0FD689', text: 'text-white', darkMode: true, particles: true },
    { id: 'cyan-custom', name: 'Ocean Cyan', type: 'color', value: '#0FCFD6', text: 'text-white', darkMode: true, particles: true },
    { id: 'purple-custom', name: 'Royal Purple', type: 'color', value: '#A80FD6', text: 'text-white', darkMode: true, particles: true },
    { id: 'pink-custom', name: 'Deep Magenta', type: 'color', value: '#D60FB2', text: 'text-white', darkMode: true, particles: true },
    { id: 'rose-custom', name: 'Soft Rose', type: 'color', value: '#FFE6EA', text: 'text-gray-900', darkMode: false },
    { id: 'orange-grad', name: 'Digital Orange Gradient', type: 'gradient', value: 'linear-gradient(135deg, #f85606 0%, #ff8c00 100%)', text: 'text-white', movingGradient: true, darkMode: true },
    { id: 'dark-eco', name: 'Dark Ecommerce Theme', type: 'color', value: '#1A1A1A', text: 'text-white', darkMode: true, particles: true },
    { id: 'glass-blue', name: 'Blue Glass Theme', type: 'gradient', value: 'linear-gradient(to bottom, #E0F2FE, #DBEAFE)', text: 'text-gray-900', glassmorphism: true, blur: 15 },
  ];

  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem('elora-theme');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed && parsed.id ? parsed : themes[0];
      }
    } catch (e) {
      console.error('Error parsing theme:', e);
    }
    return themes[0];
  });
  const queryParams = new URLSearchParams(location.search);
  const [searchQuery, setSearchQuery] = useState(queryParams.get('q') || '');

  useEffect(() => {
    const q = new URLSearchParams(location.search).get('q');
    if (q !== searchQuery) setSearchQuery(q || '');
  }, [location.search]);
  
  const [users, setUsers] = useState<UserType[]>([]);

  const handleUpdateUsers = (updatedUsers: UserType[]) => {
    setUsers(updatedUsers);
  };

    const handleAuth = (newUser: UserType) => {
      setUser(newUser);
      
      // Check for pending action after login
      setTimeout(() => {
        try {
          const pendingRaw = localStorage.getItem('elora-pending-action');
          if (pendingRaw) {
            const pending = JSON.parse(pendingRaw);
            // Execute pending action if within 30 minutes
            if (Date.now() - pending.timestamp < 30 * 60 * 1000) {
              if (pending.type === 'addToCart' || pending.type === 'buyNow') {
                executePendingAction(pending, newUser);
                localStorage.removeItem('elora-pending-action');
                return; 
              }
            }
            localStorage.removeItem('elora-pending-action');
          }
        } catch (e) {
          console.error('Error executing pending action:', e);
        }
        
        navigate('/profile');
        showToast(t(`Welcome back, ${newUser.name}!`, `স্বাগতম, ${newUser.name}!`), 'success');
      }, 100);
    };

  const executePendingAction = (pending: any, currentUser: UserType) => {
    if (pending.type === 'addToCart') {
      setCart(prev => {
        const { product, quantity, size, color } = pending;
        const existing = prev.find(item => item.id === product.id && item.selectedSize === size && item.selectedColor === color);
        if (existing) {
          return prev.map(item => 
            (item.id === product.id && item.selectedSize === size && item.selectedColor === color) 
              ? { ...item, quantity: item.quantity + quantity, selected: true } 
              : item
          );
        }
        return [...prev, { ...product, quantity, selectedSize: size, selectedColor: color, selected: true }];
      });
      setIsCartOpen(true);
      showToast(t('Pending action completed: Item added to cart', 'অপেক্ষমাণ কাজ সম্পন্ন: পণ্যটি কার্টে যোগ করা হয়েছে'), 'success');
    } else if (pending.type === 'buyNow') {
      setCart(prev => {
        const { product, quantity, size, color } = pending;
        const existing = prev.find(item => item.id === product.id && item.selectedSize === size && item.selectedColor === color);
        if (existing) {
          return prev.map(item => 
            (item.id === product.id && item.selectedSize === size && item.selectedColor === color) 
              ? { ...item, selected: true } 
              : item
          );
        }
        return [...prev, { ...product, quantity, selectedSize: size, selectedColor: color, selected: true }];
      });
      navigate('/checkout');
      showToast(t('Pending action completed: Proceeding to checkout', 'অপেক্ষমাণ কাজ সম্পন্ন: চেকআউটে যাওয়া হচ্ছে'), 'success');
    }
  };

    const handleLogout = async () => {
      try {
        await authClient.signOut();
      } catch (error) {
        console.warn('Logout signOut error:', error);
      } finally {
        setUser(null);
        setCart([]);
        setOrders([]);
        setWishlist([]);
        setNotifications([]);
        try {
          localStorage.removeItem('elora-user');
          localStorage.removeItem('elora-admin-token');
          sessionStorage.clear();
        } catch {}
        navigate('/');
        showToast(t('Logged out successfully.', 'সফলভাবে লগআউট সম্পন্ন হয়েছে।'), 'info');
      }
    };

  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem('elora-reviews');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      console.error('Error parsing reviews:', e);
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleProductSelect = (product: Product | null) => {
    if (product) {
      setSelectedProduct(product);
      navigate(`/product/${product.id}`);
    } else {
      handleProductModalClose();
    }
  };

  const handleProductModalClose = () => {
    setSelectedProduct(null);
    if (location.pathname.startsWith('/product/')) {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }
  };

  useEffect(() => {
    if (location.pathname.startsWith('/product/')) {
      const pId = location.pathname.replace('/product/', '').split('/')[0]?.split('?')[0];
      if (pId) {
        const found = products.find(p => p.id === pId) || PRODUCTS.find(p => p.id === pId);
        if (found) {
          setSelectedProduct(found);
        }
      }
    } else {
      if (selectedProduct) {
        setSelectedProduct(null);
      }
    }
  }, [location.pathname, products]);
  const [recentOrder, setRecentOrder] = useState<Order | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSeller, setChatSeller] = useState('Grand Store');

  useEffect(() => {
    const handleProductsUpdated = (e: any) => {
      if (Array.isArray(e.detail) && e.detail.length > 0) {
        setProducts(e.detail);
      }
    };

    window.addEventListener('elora-products-updated', handleProductsUpdated);
    return () => {
      window.removeEventListener('elora-products-updated', handleProductsUpdated);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('elora-reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    if (user) {
      // Also sync back to all users if any relevant properties changed globally (like status or shop status)
      const globalVer = users.find(u => u.id === user.id);
      if (globalVer) {
        const statusChanged = globalVer.status !== user.status;
        const shopStatusChanged = globalVer.shop?.status !== user.shop?.status;
        const shopVerifiedChanged = globalVer.shop?.isVerified !== user.shop?.isVerified;
        
        if (statusChanged || shopStatusChanged || shopVerifiedChanged) {
          setUser(globalVer);
        }
      }
    }
  }, [user, users]);

  useEffect(() => {
    localStorage.setItem('elora-theme', JSON.stringify(currentTheme));
  }, [currentTheme]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const cat = selectedCategory.toLowerCase();
    return products.filter(p => {
      // Only show approved products that are not soft-deleted or hidden
      if (p.isDeleted === true || p.isHidden === true) return false;
      if (p.status && p.status !== 'approved') return false;
      
      const prodCat = (p.category || '').toLowerCase();
      let matchesCategory = selectedCategory === 'All' || prodCat === cat;
      if (!matchesCategory) {
        if (cat.includes('mobile') || cat.includes('smartphone')) {
          matchesCategory = prodCat.includes('mobile') || prodCat.includes('smartphone') || (p.tags && p.tags.includes('mobile')) || (Boolean(p.brand) && ['apple', 'samsung', 'xiaomi', 'oneplus', 'google pixel', 'realme', 'vivo', 'oppo', 'infinix', 'motorola', 'nothing'].some(b => p.brand?.toLowerCase().includes(b)));
        } else if (cat.includes('laptop') || cat.includes('computer')) {
          matchesCategory = prodCat.includes('laptop') || prodCat.includes('computer') || (p.tags && p.tags.includes('laptop')) || (Boolean(p.brand) && ['dell', 'hp', 'lenovo', 'asus', 'acer', 'msi', 'razer', 'microsoft'].some(b => p.brand?.toLowerCase().includes(b)));
        } else if (cat.includes('audio') || cat.includes('headphone')) {
          matchesCategory = prodCat.includes('audio') || prodCat.includes('headphone') || (p.tags && p.tags.includes('audio')) || (Boolean(p.brand) && ['sony', 'bose', 'jbl', 'sennheiser', 'marshall', 'beats', 'anker'].some(b => p.brand?.toLowerCase().includes(b)));
        }
      }
      const matchesSearch = !q || p.name.toLowerCase().includes(q) || 
                           p.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: Product, quantity: number = 1, size?: string, color?: string) => {
    if (!user) {
      const pendingAction = {
        type: 'addToCart',
        product,
        quantity,
        size,
        color,
        timestamp: Date.now()
      };
      localStorage.setItem('elora-pending-action', JSON.stringify(pendingAction));
      localStorage.setItem('elora-auth-mode', 'signup');
      showToast(t('Please sign up to continue shopping.', 'শপিং চালিয়ে যেতে অনুগ্রহ করে সাইন আপ করুন।'), 'info');
      setSelectedProduct(null); // Close modal completely
      setTimeout(() => {
        navigate('/login');
      }, 600);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size && item.selectedColor === color);
      const availableStock = product?.stock !== undefined ? product.stock : 50;
      const maxLimit = Math.max(1, Math.min(availableStock, 99));

      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedSize === size && item.selectedColor === color) 
            ? { ...item, quantity: Math.min(maxLimit, item.quantity + quantity), selected: true } 
            : item
        );
      }
      return [...prev, { ...product, quantity: Math.min(maxLimit, quantity), selectedSize: size, selectedColor: color, selected: true }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string, size?: string, color?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedSize === size && item.selectedColor === color)));
  };

  const updateQuantity = (id: string, delta: number, size?: string, color?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedSize === size && item.selectedColor === color) {
        const prod = products.find(p => p.id === id);
        const liveStock = prod?.stock !== undefined ? prod.stock : (item.stock ?? 50);
        const maxLimit = Math.max(1, Math.min(liveStock, 99));
        const newQty = Math.min(maxLimit, Math.max(1, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const setQuantityForCartItem = (id: string, quantity: number, size?: string, color?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedSize === size && item.selectedColor === color) {
        const prod = products.find(p => p.id === id);
        const liveStock = prod?.stock !== undefined ? prod.stock : (item.stock ?? 50);
        const maxLimit = Math.max(1, Math.min(liveStock, 99));
        return { ...item, quantity: Math.min(maxLimit, Math.max(1, quantity)) };
      }
      return item;
    }));
  };

  const toggleCartItemSelection = (id: string, size?: string, color?: string) => {
    setCart(prev => prev.map(item => 
      (item.id === id && item.selectedSize === size && item.selectedColor === color) 
        ? { ...item, selected: !item.selected } 
        : item
    ));
  };

  const selectAllItems = (selected: boolean) => {
    setCart(prev => prev.map(item => ({ ...item, selected })));
  };

  const buyNow = (product: Product, quantity: number = 1, size?: string, color?: string) => {
    if (!user) {
      const pendingAction = {
        type: 'buyNow',
        product,
        quantity,
        size,
        color,
        timestamp: Date.now()
      };
      localStorage.setItem('elora-pending-action', JSON.stringify(pendingAction));
      localStorage.setItem('elora-auth-mode', 'signup');
      showToast(t('Please sign up to continue shopping.', 'শপিং চালিয়ে যেতে অনুগ্রহ করে সাইন আপ করুন।'), 'info');
      setSelectedProduct(null); // Close modal completely
      setTimeout(() => {
        navigate('/login');
      }, 600);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedSize === size && item.selectedColor === color);
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedSize === size && item.selectedColor === color) 
            ? { ...item, selected: true } 
            : item
        );
      }
      return [...prev, { ...product, quantity, selectedSize: size, selectedColor: color, selected: true }];
    });
    navigate('/checkout');
    setSelectedProduct(null);
  };

  const handleOpenChat = (sellerName: string) => {
    setChatSeller(sellerName);
    setIsChatOpen(true);
  };

  const handlePlaceOrder = async (order: Order, options?: { skipSuccessModal?: boolean }): Promise<Order> => {
    try {
      setIsSyncing(true);
      
      // orderApi.createOrder works with active Better Auth sessions and guest checkouts alike
      const finalOrder = await orderApi.createOrder(order);
      if (!finalOrder) {
        throw new Error(t('Could not save order to database. Please try again.', 'অর্ডার ডাটাবেসে সেভ হতে পারেনি। অনুগ্রহ করে আবার চেষ্টা করুন।'));
      }
      
      setOrders(prev => [finalOrder, ...prev]);
      setCart(prev => prev.filter(item => !item.selected));
      if (!options?.skipSuccessModal) {
        setRecentOrder(finalOrder);
      }
      showToast(t('Your order has been placed successfully!', 'আপনার অর্ডারটি সফলভাবে গৃহীত হয়েছে!'), 'success');
      return finalOrder;
    } catch (e: any) {
      console.error('Order placement failed:', e);
      throw e; // Rethrow to let CheckoutPage handle customer error display
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => {
      const next = prev.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      try {
        localStorage.setItem('elora-products', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save updated products to localStorage', e);
      }
      return next;
    });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
    
    // Trigger notification for admin
    setNotifications(prev => [
      { 
        id: `prod-${Date.now()}`, 
        title: t('Product Added', 'পণ্য যোগ করা হয়েছে'), 
        message: t(`${newProduct.name} has been added to inventory.`, `${newProduct.name} ইনভেন্টরিতে যোগ করা হয়েছে।`), 
        type: 'inventory', 
        read: false, 
        createdAt: new Date().toISOString() 
      },
      ...prev
    ]);
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    
    // Trigger notification for admin
    setNotifications(prev => [
      { 
        id: `status-${Date.now()}`, 
        title: t('Order Status Updated', 'অর্ডার স্ট্যাটাস আপডেট হয়েছে'), 
        message: t(`Order #${orderId} marked as ${status}.`, `অর্ডার #${orderId} স্ট্যাটাস ${status} করা হয়েছে।`), 
        type: 'order', 
        read: false, 
        createdAt: new Date().toISOString() 
      },
      ...prev
    ]);
  };

  const toggleWishlist = (productId: string) => {
    if (!user) {
      showToast(t('Login required to manage wishlist', 'উইশলিস্ট পরিচালনা করতে লগইন করুন'), 'info');
      setSelectedProduct(null); // Hide product background
      navigate('/login');
      return;
    }
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const subtotal = useMemo(() => {
    return cart.filter(i => i.selected).reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  if (isAppLoading) {
    return (
      <CircularLoader
        fullScreen
        label={t('Syncing cloud data...', 'ক্লাউড ডেটা সিঙ্ক হচ্ছে...')}
      />
    );
  }

  if (maintenanceMode && user?.role !== 'admin' && location.pathname !== '/admin' && location.pathname !== '/dashboard/admin' && location.pathname !== '/login') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#07070a] text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="absolute inset-0 bg-radial-gradient from-zinc-900/40 via-transparent to-transparent pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md space-y-8 relative z-10"
        >
          {/* Animated icon */}
          <div className="flex justify-center relative">
            <div className="h-28 w-28 bg-brand-orange/10 rounded-full flex items-center justify-center border border-brand-orange/15 relative animate-pulse">
              <CloudLightning className="text-brand-orange" size={48} />
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full animate-bounce border border-zinc-900 font-mono">{t('SAFE PROTOCOL', 'নিরাপদ প্রোটোকল')}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-black uppercase tracking-tight italic [text-shadow:_0_4px_12px_rgba(0,0,0,0.5)]">
              {t('Database Offline', 'ডাটাবেস অফলাইন')}
            </h1>
            <span className="text-[10px] tracking-widest font-mono font-black uppercase text-brand-orange block">{t('System Upgrade In Progress', 'সিস্টেম সংস্করণ চলছে')}</span>
            <p className="text-xs text-white/50 leading-relaxed font-mono font-bold pt-2">
              {t('We are currently deploying safe security structures and database configurations to improve performance. We apologize for the short disruption.', 'পারফরম্যান্স ও নিরাপত্তা উন্নত করার জন্য বর্তমানে সিস্টেম আপডেট চলছে। সাময়িক অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত।')}
            </p>
          </div>

          <div className="bg-white/5 border border-white/5 p-5 rounded-2xl">
            <span className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest block mb-1">{t('Live Feed', 'লাইভ স্ট্যাটাস')}</span>
            <span className="text-xs text-emerald-400 font-bold uppercase font-mono animate-pulse">● {t('System synchronization in progress...', 'সিস্টেম সিঙ্ক্রোনাইজেশন চলছে...')}</span>
          </div>

          <div className="pt-4 flex gap-4 justify-center">
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl text-[10px] font-black uppercase tracking-widest font-mono transition-all shadow-xl shadow-brand-orange/20"
            >
              {t('Staff Login Bypasser', 'স্টাফ লগইন')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-brand-navy selection:text-white transition-colors duration-500 ${currentTheme.text}`}>
      <BackgroundLayer theme={currentTheme} />
      
      {/* Cloud Sync Indicator */}
      {isSyncing && (
        <div className="fixed top-4 right-4 z-[1000] bg-brand-navy/90 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold border border-white/20 backdrop-blur-md shadow-lg animate-pulse">
          <CloudLightning size={12} className="text-brand-orange shadow-[0_0_8px_rgba(248,86,6,0.5)]" />
          <span>{t('CLOUD SYNC ACTIVE', 'ক্লাউড সিঙ্ক সক্রিয়')}</span>
        </div>
      )}
      
      <ScrollToTop />

      <AnimatePresence>
        {isRouteLoading && <CircularLoader overlay />}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname.startsWith('/product/') ? 'product-route' : location.pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="min-h-screen"
        >
          <Suspense fallback={<PageFallback />}>
            <Routes location={location}>
              <Route path="/" element={
                <HomePage 
                  currentTheme={currentTheme}
                  user={user}
                  cart={cart}
                  wishlist={wishlist}
                  products={products}
                  filteredProducts={filteredProducts}
                  selectedCategory={selectedCategory}
                  searchQuery={searchQuery}
                  setSelectedCategory={setSelectedCategory}
                  setSearchQuery={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
                  addToCart={addToCart}
                  setSelectedProduct={handleProductSelect}
                  toggleWishlist={toggleWishlist}
                  setIsCartOpen={setIsCartOpen}
                  setIsWishlistOpen={setIsWishlistOpen}
                  setIsLoginOpen={() => navigate('/login')}
                  setIsOrdersOpen={setIsOrdersOpen}
                  setIsAdminOpen={() => navigate('/admin')}
                  setIsThemePanelOpen={() => {}}
                  onLogout={handleLogout}
                  onUpdateProduct={handleUpdateProduct}
                />
              } />
              <Route path="/product/:productId" element={
                <HomePage 
                  currentTheme={currentTheme}
                  user={user}
                  cart={cart}
                  wishlist={wishlist}
                  products={products}
                  filteredProducts={filteredProducts}
                  selectedCategory={selectedCategory}
                  searchQuery={searchQuery}
                  setSelectedCategory={(cat) => {
                    setSelectedCategory(cat);
                    navigate('/');
                  }}
                  setSearchQuery={(q) => navigate(`/search?q=${encodeURIComponent(q)}`)}
                  addToCart={addToCart}
                  setSelectedProduct={handleProductSelect}
                  toggleWishlist={toggleWishlist}
                  setIsCartOpen={setIsCartOpen}
                  setIsWishlistOpen={setIsWishlistOpen}
                  setIsLoginOpen={() => navigate('/login')}
                  setIsOrdersOpen={setIsOrdersOpen}
                  setIsAdminOpen={() => navigate('/admin')}
                  setIsThemePanelOpen={() => {}}
                  onLogout={handleLogout}
                  onUpdateProduct={handleUpdateProduct}
                />
              } />
              <Route path="/search" element={
                <SearchPage 
                  currentTheme={currentTheme}
                  user={user}
                  cart={cart}
                  wishlist={wishlist}
                  products={products}
                  addToCart={addToCart}
                  setSelectedProduct={handleProductSelect}
                  toggleWishlist={toggleWishlist}
                  setIsCartOpen={setIsCartOpen}
                  setIsWishlistOpen={setIsWishlistOpen}
                  setIsLoginOpen={() => navigate('/login')}
                  setIsOrdersOpen={setIsOrdersOpen}
                  onLogout={handleLogout}
                />
              } />
              <Route path="/checkout" element={
                <CheckoutPage 
                  cart={cart}
                  subtotal={subtotal}
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  onPlaceOrder={handlePlaceOrder}
                  onUpdateQuantity={updateQuantity}
                  onSetQuantity={setQuantityForCartItem}
                  onToggleSelection={toggleCartItemSelection}
                  onSelectAll={selectAllItems}
                  onRemove={removeFromCart}
                />
              } />
              <Route path="/cart" element={<Navigate to="/checkout" replace />} />
              <Route path="/login" element={<AuthPage onLogin={handleAuth} />} />
              <Route path="/register" element={<AuthPage onLogin={handleAuth} initialMode="signup" />} />
              <Route path="/profile" element={
                <ProfilePage 
                  user={user} 
                  users={users}
                  orders={orders} 
                  wishlist={wishlist}
                  cart={cart}
                  products={products}
                  onLogout={handleLogout}
                  onUpdateUser={handleUpdateUser}
                  onUpdateAllUsers={handleUpdateUsers}
                  onUpdateOrders={setOrders}
                  onRemoveFromWishlist={toggleWishlist}
                  onAddToCart={(p, q, s, c) => addToCart(p, q, s, c)}
                  onUpdateQuantity={updateQuantity}
                  onToggleCartSelection={toggleCartItemSelection}
                  onSelectAll={selectAllItems}
                  onRemoveFromCart={removeFromCart}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              } />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/admin" element={<AdminDashboard />} />
              <Route path="/invoice/:orderId" element={<InvoicePage orders={orders} />} />
              <Route path="/category/:categorySlug" element={<CategoryRedirect />} />
              <Route path="/category" element={<Navigate to="/search?category=All" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
      
      <Suspense fallback={null}>
        <ChatModal 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          sellerName={chatSeller}
          user={user}
        />
      </Suspense>

      {/* Mobile Bottom Navigation - available on all customer pages */}
      {!location.pathname.startsWith('/checkout') && !location.pathname.startsWith('/admin') && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/90 px-4 py-2.5 flex items-center justify-around z-[100] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <button 
            type="button"
            onClick={() => {
              if (location.pathname !== '/') {
                navigate('/');
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }} 
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
              location.pathname === '/' ? 'text-brand-orange font-bold' : 'text-gray-500 hover:text-brand-orange'
            }`}
          >
            <Store size={20} />
            <span className="text-[10px]">{t('Home', 'হোম')}</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              setChatSeller(t('Merchant Support', 'মার্চেন্ট সাপোর্ট'));
              setIsChatOpen(true);
            }} 
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-brand-orange transition-colors cursor-pointer"
          >
            <MessageCircle size={20} />
            <span className="text-[10px]">{t('Messages', 'মেসেজ')}</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsCartOpen(true)} 
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-brand-orange relative cursor-pointer"
          >
            <ShoppingCart size={20} />
            {(cart?.length || 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
            <span className="text-[10px]">{t('Cart', 'কার্ট')}</span>
          </button>

          <button 
            type="button"
            onClick={() => setIsWishlistOpen(true)} 
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-brand-orange relative cursor-pointer"
          >
            <Heart size={20} className={(wishlist?.length || 0) > 0 ? 'fill-brand-orange text-brand-orange' : ''} />
            {(wishlist?.length || 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
            <span className="text-[10px]">{t('Wishlist', 'উইশলিস্ট')}</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              if (user) {
                navigate('/profile');
              } else {
                navigate('/login');
              }
            }} 
            className={`flex flex-col items-center gap-1 transition-colors cursor-pointer ${
              location.pathname === '/profile' ? 'text-brand-orange font-bold' : 'text-gray-500 hover:text-brand-orange'
            }`}
          >
            <User size={20} />
            <span className="text-[10px]">{user ? t('My Profile', 'প্রোফাইল') : t('Login', 'লগইন')}</span>
          </button>
        </div>
      )}

      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart}
        onRemove={removeFromCart}
        onUpdateQuantity={updateQuantity}
        onSetQuantity={setQuantityForCartItem}
        onToggleSelection={toggleCartItemSelection}
        onSelectAll={selectAllItems}
        onCheckout={() => {
          if (cart.some(item => item.selected)) {
            setIsCartOpen(false);
            navigate('/checkout');
          }
        }}
      />

      <WishlistSidebar 
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistIds={wishlist}
        onRemove={toggleWishlist}
        onMoveToCart={(product) => {
          addToCart(product);
          toggleWishlist(product.id);
        }}
      />

      <Suspense fallback={null}>
        <ProductModal 
          product={selectedProduct}
          onClose={handleProductModalClose}
          onAddToCart={addToCart}
          onBuyNow={buyNow}
          onProductSelect={handleProductSelect}
          isWishlisted={selectedProduct ? wishlist.includes(selectedProduct.id) : false}
          onWishlistToggle={() => selectedProduct && toggleWishlist(selectedProduct.id)}
          onChatWithSeller={handleOpenChat}
          user={user}
        />
      </Suspense>


      <OrderSuccessModal 
        order={recentOrder}
        onClose={() => setRecentOrder(null)}
        onViewOrderDetails={() => {
          const ordId = recentOrder?.id;
          setRecentOrder(null);
          if (ordId) {
            navigate(`/invoice/${ordId}`);
          } else {
            setIsOrdersOpen(true);
          }
        }}
      />

      <OrderHistoryModal 
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
      />
    </div>
  );
}
