import { authClient, authHeaders, buildAuthUrl, dispatchAuthChanged } from '../lib/auth-client';
import { Coupon, User, Product, Order, ReturnRequest, AdBoard } from '../types';

const RAW_API_BASE = String(
  (import.meta as any).env?.VITE_API_URL ||
    (import.meta as any).env?.VITE_API_BASE_URL ||
    ''
)
  .trim()
  .replace(/\/+$/, '');
export const API_BASE_URL = RAW_API_BASE.includes('YOUR-RENDER-SERVICE') ? '' : RAW_API_BASE;
export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanPath}` : cleanPath;
}

/**
 * Authoritative response parser for server API endpoints.
 */
export async function safeParseJson<T = any>(response: Response, endpointDesc: string = 'API'): Promise<T> {
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const rawText = await response.text();

  if (contentType.includes('text/html') || rawText.includes('<!DOCTYPE html>') || rawText.includes('<html')) {
    throw new Error(
      `${endpointDesc} returned an HTML document (${response.status} ${response.statusText}) instead of JSON.`
    );
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(
      `${endpointDesc} returned an invalid response (${response.status} ${response.statusText}): ${rawText.slice(0, 100)}`
    );
  }
}

export const authApi = {
  register: async (data: any) => {
    const result = await authClient.signUpEmail({
      name: data.name,
      username: data.username || '',
      email: data.email,
      phone: data.phone || '',
      password: data.password
    });
    return { user: result.user, token: result.token || '' };
  },
  verifyAdminStatus: async (): Promise<boolean> => {
    try {
      const response = await fetch(apiUrl('/api/admin/verify'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({})
      });
      if (response.ok) {
        const data = await safeParseJson(response, 'Admin Verification API');
        return Boolean(data?.isAdmin);
      }
      return false;
    } catch {
      return false;
    }
  },
  login: async (data: any) => {
    const email = String(data.identifier || data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const res = await authClient.signInEmail({ email, password });
    return { user: res.user, token: res.token || '' };
  },
  resetPassword: async (email: string) => {
    return authClient.requestPasswordReset(email);
  },
  getProfile: async (): Promise<any> => {
    const res = await fetch(apiUrl('/api/auth/profile'), {
      method: 'GET',
      credentials: 'include',
      headers: authHeaders()
    });
    if (!res.ok) {
      const baSession = await authClient.getSession();
      if (baSession?.user) return baSession.user;
      throw new Error('Not authenticated');
    }
    const data = await safeParseJson(res, 'Auth Profile API');
    return data.user;
  },
  updateProfile: async (data: any): Promise<any> => {
    const res = await fetch(apiUrl('/api/auth/profile'), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data || {})
    });
    const parsed = await safeParseJson(res, 'Update Profile API');
    if (!res.ok || !parsed?.user) {
      throw new Error(parsed?.error || 'Could not update profile.');
    }
    if (parsed.user.phone) {
      try {
        localStorage.setItem(`phone_${parsed.user.id}`, parsed.user.phone);
        if (parsed.user.email) localStorage.setItem(`phone_${parsed.user.email}`, parsed.user.phone);
      } catch {}
    }
    dispatchAuthChanged(parsed.user);
    return parsed.user;
  }
};

export const cartApi = {
  getCart: async () => {
    try {
      const res = await fetch(apiUrl('/api/cart'), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) return [];
      const data = await safeParseJson(res, 'Cart API');
      return Array.isArray(data?.items) ? data.items : [];
    } catch {
      return [];
    }
  },
  syncCart: async (items: any[]) => {
    try {
      const res = await fetch(apiUrl('/api/cart'), {
        method: 'PUT',
        credentials: 'include',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ items })
      });
      if (!res.ok) return;
    } catch {}
  }
};

export const paymentApi = {
  getMethods: async () => {
    try {
      const res = await fetch(apiUrl('/api/payments/methods'), {
        credentials: 'include'
      });
      if (!res.ok) return null;
      return await safeParseJson(res, 'Payment Methods API');
    } catch {
      return null;
    }
  },
  verifyPayment: async (payload: {
    paymentMethod: string;
    amountBDT: number;
    senderNumber?: string;
    transactionId?: string;
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    cardHolder?: string;
  }) => {
    const response = await fetch(apiUrl('/api/payments/verify'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const data = await safeParseJson(response, 'Payment Verification Service');
    if (!response.ok || !data?.verified) {
      throw new Error(data?.error || 'Payment verification failed. Please check your payment details.');
    }
    return data;
  }
};

export const orderApi = {
  getOrders: async (): Promise<Order[]> => {
    try {
      const res = await fetch(apiUrl('/api/orders'), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) return [];
      const data = await safeParseJson(res, 'Orders API');
      return Array.isArray(data?.orders) ? data.orders : [];
    } catch {
      return [];
    }
  },
  getOrderById: async (orderId: string): Promise<Order | null> => {
    if (!orderId) return null;
    const cleanId = orderId.trim();
    try {
      const res = await fetch(apiUrl(`/api/orders/invoice/${encodeURIComponent(cleanId)}`), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await safeParseJson(res, 'Order Invoice API');
        if (data.found && data.order) return data.order as Order;
      }
    } catch (e) {
      console.warn('Server invoice lookup error:', e);
    }
    return null;
  },
  createOrder: async (data: any) => {
    let response: Response;
    try {
      response = await fetch(apiUrl('/api/orders/calculate-and-create'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          items: data.items,
          couponCode: data.couponCode || data.appliedCoupon?.code || data.appliedCoupon?.couponId,
          address: data.address,
          paymentMethod: data.paymentMethod,
          paymentId: data.paymentId,
          paymentStatus: data.paymentStatus,
          transactionId: data.transactionId,
          senderNumber: data.senderNumber,
          cardBrand: data.cardBrand,
          cardLast4: data.cardLast4,
          deliveryZone: data.deliveryZone,
          baseDeliveryFee: data.baseDeliveryFee,
          codFee: data.codFee,
          deliveryRegion: data.deliveryZone || data.address?.district || data.address?.division || ''
        })
      });
    } catch (networkErr: any) {
      throw new Error(`Failed to connect to checkout service (${networkErr?.message || 'Network error'}). Please check your connection and try again.`);
    }

    const resJson = await safeParseJson(response, 'Order Creation Service');
    if (response.ok && resJson.order) {
      return resJson.order;
    }

    throw new Error(resJson.error || 'The store server could not process this order. Please verify item stock or details.');
  },
  requestOrderCancellation: async (orderId: string, reason?: string) => {
    const payload = {
      cancellationRequested: true,
      cancellationReason: reason || 'Customer requested order cancellation',
      cancellationRequestedAt: new Date().toISOString()
    };
    const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(orderId)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const parsed = await safeParseJson(res, 'Cancel Order API');
    if (!res.ok) {
      throw new Error(parsed?.error || 'Failed to request order cancellation. Please try again.');
    }
    return parsed.order || { id: orderId, ...payload };
  }
};

export const addressApi = {
  getAddresses: async (): Promise<any[]> => {
    const res = await fetch(apiUrl('/api/auth/addresses'), {
      credentials: 'include',
      headers: authHeaders()
    });
    if (!res.ok) return [];
    const data = await safeParseJson(res, 'Addresses API');
    return Array.isArray(data?.addresses) ? data.addresses : [];
  },
  saveAddresses: async (addresses: any[]): Promise<any[]> => {
    const res = await fetch(apiUrl('/api/auth/addresses'), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ addresses })
    });
    const data = await safeParseJson(res, 'Save Addresses API');
    if (!res.ok) throw new Error(data?.error || 'Failed to save addresses');
    return Array.isArray(data?.addresses) ? data.addresses : addresses;
  },
  createAddress: async (data: any) => {
    const current = await addressApi.getAddresses();
    const newAddr = { id: `addr_${Date.now()}`, ...data };
    await addressApi.saveAddresses([...current, newAddr]);
    return newAddr;
  },
  updateAddress: async (id: string, data: any) => {
    const current = await addressApi.getAddresses();
    let updatedItem = { id, ...data };
    const next = current.map((a: any) => {
      if (a.id === id) {
        updatedItem = { ...a, ...data, id };
        return updatedItem;
      }
      return a;
    });
    await addressApi.saveAddresses(next);
    return updatedItem;
  },
  deleteAddress: async (id: string) => {
    const current = await addressApi.getAddresses();
    await addressApi.saveAddresses(current.filter((a: any) => a.id !== id));
  }
};

export const adminApi = {
  getStats: async () => {
    const [users, orders, products] = await Promise.all([
      adminApi.getUsers().catch(() => []),
      adminApi.getOrders().catch(() => []),
      adminApi.getProducts().catch(() => [])
    ]);
    const EXCLUDED_STATUSES = ['cancelled', 'returned', 'refunded'];
    const eligibleOrders = orders.filter((o: any) => {
      const status = (o.status || '').toLowerCase().trim();
      return !EXCLUDED_STATUSES.includes(status);
    });
    const revenue = Math.round(
      eligibleOrders.reduce((sum: number, order: any) => sum + Math.round(Number(order.total) || 0), 0)
    );
    return {
      users: users.length,
      orders: orders.length,
      products: products.length,
      revenue,
      pendingProducts: products.filter((p: any) => !p.status || p.status === 'pending').length,
      pendingShops: users.filter((u: any) => u.shop && u.shop.status === 'pending').length
    };
  },
  getUsers: async (): Promise<User[]> => {
    const res = await fetch(apiUrl('/api/users'), {
      credentials: 'include',
      headers: authHeaders()
    });
    if (!res.ok) return [];
    const data = await safeParseJson(res, 'Admin Users API');
    return Array.isArray(data?.users) ? data.users : [];
  },
  getOrders: async (): Promise<Order[]> => {
    const res = await fetch(apiUrl('/api/orders?all=true'), {
      credentials: 'include',
      headers: authHeaders()
    });
    if (!res.ok) return [];
    const data = await safeParseJson(res, 'Admin Orders API');
    return Array.isArray(data?.orders) ? data.orders : [];
  },
  updateOrderStatus: async (id: string, status: string) => {
    if (!id) throw new Error('Order ID missing');
    const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}/status`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status })
    });
    const parsed = await safeParseJson(res, 'Update Order Status API');
    if (!res.ok) throw new Error(parsed?.error || 'Failed to update order status');
    return { id, status };
  },
  updateOrderPaymentStatus: async (id: string, paymentStatus: 'paid' | 'unpaid' | 'refunded') => {
    if (!id) throw new Error('Order ID missing');
    const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ paymentStatus })
    });
    const parsed = await safeParseJson(res, 'Update Order Payment API');
    if (!res.ok) throw new Error(parsed?.error || 'Failed to update payment status');
    return { id, paymentStatus };
  },
  deleteOrder: async (id: string, permanent: boolean = false, deletedBy: string = 'Super Admin') => {
    if (!id) throw new Error('Order ID missing');
    if (permanent) {
      const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Failed to delete order');
    } else {
      const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}`), {
        method: 'PUT',
        credentials: 'include',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          isDeleted: true,
          deletedAt: new Date().toISOString(),
          deletedBy
        })
      });
      if (!res.ok) throw new Error('Failed to archive order');
    }
    return { id };
  },
  restoreOrder: async (id: string) => {
    if (!id) throw new Error('Order ID missing');
    const res = await fetch(apiUrl(`/api/orders/${encodeURIComponent(id)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        isDeleted: false,
        deletedAt: null,
        deletedBy: null
      })
    });
    if (!res.ok) throw new Error('Failed to restore order');
    return { id };
  },
  getProducts: async (): Promise<Product[]> => {
    const res = await fetch(apiUrl('/api/products?includeAll=true'), {
      credentials: 'include',
      headers: authHeaders()
    });
    if (!res.ok) return [];
    const data = await safeParseJson(res, 'Admin Products API');
    return Array.isArray(data?.data) ? data.data : [];
  },
  createProduct: async (data: any) => {
    const priceNum = Number(data.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      throw new Error('Product price must be a valid amount greater than 0 BDT.');
    }
    const res = await fetch(apiUrl('/api/products'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const parsed = await safeParseJson(res, 'Create Product API');
    if (!res.ok) throw new Error(parsed?.error || 'Failed to create product');
    return parsed.data;
  },
  updateProduct: async (id: string, data: any) => {
    if (data.price !== undefined) {
      const priceNum = Number(data.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Product price must be a valid amount greater than 0 BDT.');
      }
      data.price = Math.round(priceNum);
    }
    if (data.originalPrice !== undefined) {
      data.originalPrice = Math.round(Number(data.originalPrice));
    }
    return productApi.updateProduct(id, data);
  },
  deleteProduct: async (id: string, permanent: boolean = false, deletedBy: string = 'Super Admin') => {
    return productApi.deleteProduct(id, permanent, deletedBy);
  },
  restoreProduct: async (id: string) => {
    return productApi.restoreProduct(id);
  },
  updateUser: async (id: string, data: any) => {
    const res = await fetch(apiUrl(`/api/users/${encodeURIComponent(id)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const parsed = await safeParseJson(res, 'Update User API');
    if (!res.ok) throw new Error(parsed?.error || 'Failed to update user');
    return parsed.user;
  },
  createSiteAdmin: async (adminData: {
    name: string;
    email: string;
    permissions: string[];
    permissionsLevel: Record<string, 'read' | 'full'>;
  }) => {
    const res = await fetch(apiUrl('/api/users/site-admin'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(adminData)
    });
    const parsed = await safeParseJson(res, 'Create Site Admin API');
    if (!res.ok) throw new Error(parsed?.error || 'Failed to assign site admin');
    return parsed.user;
  },
  getReviews: async () => reviewApi.getReviews(),
  updateReviewStatus: async (id: string, status: string, flaggedReason?: string) => {
    return reviewApi.updateReview(id, {
      status,
      ...(flaggedReason !== undefined ? { flaggedReason } : {})
    });
  },
  replyReview: async (id: string, sellerReply: string) => {
    const isBn = typeof window !== 'undefined' && localStorage.getItem('elora-lang') === 'bn';
    return reviewApi.updateReview(id, {
      sellerReply,
      sellerReplyDate: new Date().toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    });
  },
  deleteReview: async (id: string) => reviewApi.deleteReview(id),
  getCoupons: async () => couponApi.getCoupons(),
  createCoupon: async (coupon: Partial<Coupon>) => couponApi.createCoupon(coupon),
  updateCoupon: async (id: string, data: Partial<Coupon>) => couponApi.updateCoupon(id, data),
  deleteCoupon: async (id: string) => couponApi.deleteCoupon(id),
  getReturns: async () => returnApi.getReturns(),
  createReturn: async (data: Omit<ReturnRequest, 'id'>) => returnApi.createReturn(data),
  updateReturn: async (id: string, updates: Partial<ReturnRequest>) => returnApi.updateReturn(id, updates),
  deleteReturn: async (id: string) => returnApi.deleteReturn(id),
  getAdBoards: async () => adBoardApi.getAdBoards(),
  createAdBoard: async (data: Omit<AdBoard, 'id'>) => adBoardApi.createAdBoard(data),
  updateAdBoard: async (id: string, updates: Partial<AdBoard>) => adBoardApi.updateAdBoard(id, updates),
  deleteAdBoard: async (id: string) => adBoardApi.deleteAdBoard(id)
};

export const shopApi = {
  getShop: async (shopId: string) => {
    try {
      const all = await shopApi.getAllShops();
      return all.find((s: any) => s.id === shopId || s.ownerId === shopId) || null;
    } catch {
      return null;
    }
  },
  getAllShops: async () => {
    try {
      const res = await fetch(apiUrl('/api/shops'), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) return [];
      const parsed = await safeParseJson(res, 'Shops API');
      return Array.isArray(parsed?.data) ? parsed.data : [];
    } catch {
      return [];
    }
  },
  submitShopApplication: async (shopData: any) => {
    const res = await fetch(apiUrl('/api/shops'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        ...shopData,
        status: 'pending',
        isVerified: false,
        rating: 5.0
      })
    });
    const parsed = await safeParseJson(res, 'Submit Shop API');
    if (!res.ok) throw new Error(parsed?.error || 'Failed to submit shop');
    return parsed.data;
  },
  updateShopDetails: async (shopData: any) => {
    const id = shopData.id || `shop_${Date.now()}`;
    const res = await fetch(apiUrl(`/api/shops/${encodeURIComponent(id)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(shopData)
    });
    const parsed = await safeParseJson(res, 'Update Shop API');
    return parsed?.data || shopData;
  },
  adminUpdateShopStatus: async (
    shopId: string,
    status: 'active' | 'suspended' | 'rejected',
    isVerified?: boolean
  ) => {
    const res = await fetch(apiUrl(`/api/shops/${encodeURIComponent(shopId)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        status,
        ...(isVerified !== undefined ? { isVerified } : {})
      })
    });
    const parsed = await safeParseJson(res, 'Admin Shop Status API');
    return parsed?.data || { shopId, status, isVerified };
  }
};

export const reviewApi = {
  getReviews: async (): Promise<any[]> => {
    try {
      const res = await fetch(apiUrl('/api/reviews'), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) return [];
      const parsed = await safeParseJson(res, 'Reviews API');
      return Array.isArray(parsed?.data) ? parsed.data : [];
    } catch {
      return [];
    }
  },
  getReviewsByProductId: async (productId: string): Promise<any[]> => {
    try {
      const res = await fetch(apiUrl(`/api/reviews?productId=${encodeURIComponent(productId)}`), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) return [];
      const parsed = await safeParseJson(res, 'Product Reviews API');
      return Array.isArray(parsed?.data) ? parsed.data : [];
    } catch {
      return [];
    }
  },
  createReview: async (data: any) => {
    const res = await fetch(apiUrl('/api/reviews'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const parsed = await safeParseJson(res, 'Create Review API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not submit review');
    return parsed.data;
  },
  updateReview: async (id: string, data: any) => {
    const res = await fetch(apiUrl(`/api/reviews/${encodeURIComponent(id)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const parsed = await safeParseJson(res, 'Update Review API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not update review');
    return parsed.data;
  },
  deleteReview: async (id: string) => {
    const res = await fetch(apiUrl(`/api/reviews/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Could not delete review');
    return { id };
  }
};

export const questionApi = {
  getQuestions: async (productId?: string): Promise<any[]> => {
    try {
      const qs = productId ? `?productId=${encodeURIComponent(productId)}` : '';
      const res = await fetch(apiUrl(`/api/questions${qs}`), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) return [];
      const parsed = await safeParseJson(res, 'Questions API');
      return Array.isArray(parsed?.data) ? parsed.data : [];
    } catch {
      return [];
    }
  },
  askQuestion: async (payload: { productId: string; productName?: string; question: string; authorName?: string }) => {
    const res = await fetch(apiUrl('/api/questions'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    const parsed = await safeParseJson(res, 'Ask Question API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not submit question');
    return parsed.data;
  },
  upvoteQuestion: async (id: string) => {
    const res = await fetch(apiUrl(`/api/questions/${encodeURIComponent(id)}/upvote`), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({})
    });
    const parsed = await safeParseJson(res, 'Upvote Question API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not upvote');
    return parsed.data;
  }
};

export const merchantApplicationApi = {
  submitApplication: async (appData: {
    shopName: string;
    ownerName: string;
    phone: string;
    district?: string;
    category?: string;
    email?: string;
  }) => {
    return shopApi.submitShopApplication({
      ...appData,
      name: appData.shopName,
      contactNumber: appData.phone
    });
  },
  getApplications: async (): Promise<any[]> => shopApi.getAllShops()
};

export const chatApi = {
  getChats: async (): Promise<any[]> => {
    try {
      const res = await fetch(apiUrl('/api/chats'), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) return [];
      const parsed = await safeParseJson(res, 'Chats API');
      return Array.isArray(parsed?.data) ? parsed.data : [];
    } catch {
      return [];
    }
  },
  getMessages: async (chatId: string): Promise<any[]> => {
    try {
      const res = await fetch(apiUrl(`/api/chats/${encodeURIComponent(chatId)}/messages`), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) return [];
      const parsed = await safeParseJson(res, 'Chat Messages API');
      return Array.isArray(parsed?.data) ? parsed.data : [];
    } catch {
      return [];
    }
  },
  listenMessages: (chatId: string, callback: (messages: any[]) => void) => {
    let active = true;
    const poll = async () => {
      if (!active) return;
      const msgs = await chatApi.getMessages(chatId);
      if (active) callback(msgs);
    };
    poll();
    const interval = setInterval(poll, 3500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  },
  sendMessage: async (
    chatId: string,
    messageData: {
      text: string;
      senderId?: string;
      senderName?: string;
      sender?: string;
      senderRole?: 'customer' | 'seller' | 'admin';
      sellerName?: string;
      customerId?: string;
      customerName?: string;
      imageUrl?: string | null;
      audioUrl?: string | null;
      timestamp?: string;
    }
  ) => {
    const res = await fetch(apiUrl(`/api/chats/${encodeURIComponent(chatId)}/messages`), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(messageData)
    });
    const parsed = await safeParseJson(res, 'Send Chat Message API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not send message');
    return parsed.data;
  },
  updateChatSession: async (chatId: string, updates: Record<string, any>) => {
    const res = await fetch(apiUrl(`/api/chats/${encodeURIComponent(chatId)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates)
    });
    const parsed = await safeParseJson(res, 'Update Chat API');
    return parsed?.data || updates;
  },
  deleteChatSession: async (chatId: string) => {
    const res = await fetch(apiUrl(`/api/chats/${encodeURIComponent(chatId)}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete chat session');
  }
};

export const uploadApi = {
  uploadMedia: async (filename: string, dataUrl: string): Promise<string> => {
    const res = await fetch(apiUrl('/api/uploads'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ filename, dataUrl })
    });
    const parsed = await safeParseJson(res, 'Media Upload API');
    if (!res.ok || !parsed?.url) {
      throw new Error(parsed?.error || 'Media upload failed');
    }
    return apiUrl(parsed.url);
  }
};

export const notificationApi = {
  getNotifications: async (): Promise<any[]> => {
    try {
      const res = await fetch(apiUrl('/api/notifications'), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) return [];
      const parsed = await safeParseJson(res, 'Notifications API');
      return Array.isArray(parsed?.data) ? parsed.data : [];
    } catch {
      return [];
    }
  },
  createNotification: async (payload: Record<string, any>) => {
    try {
      const res = await fetch(apiUrl('/api/notifications'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });
      if (!res.ok) return null;
      const parsed = await safeParseJson(res, 'Create Notification API');
      return parsed.data;
    } catch {
      return null;
    }
  },
  markRead: async (id: string) => {
    try {
      await fetch(apiUrl(`/api/notifications/${encodeURIComponent(id)}/read`), {
        method: 'PUT',
        credentials: 'include',
        headers: authHeaders()
      });
    } catch {}
  }
};

// High-speed In-Memory SWR Cache
interface ProductCachePayload {
  products: Product[];
  lastVisible: any;
  hasMore: boolean;
  timestamp: number;
}
let initialProductsMemoryCache: ProductCachePayload | null = null;
let inFlightApprovedProductsPromise: Promise<{ products: Product[]; lastVisible: any; hasMore: boolean }> | null = null;

let configMemoryCache: { data: any; timestamp: number } | null = null;
let inFlightConfigPromise: Promise<any> | null = null;

export const productApi = {
  getProducts: async (): Promise<Product[]> => {
    try {
      const res = await fetch(apiUrl('/api/products?includeAll=true'), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) return [];
      const data = await safeParseJson(res, 'Products API');
      return Array.isArray(data?.data) ? data.data : [];
    } catch {
      return [];
    }
  },
  getApprovedProducts: async (
    limitCount = 24,
    offset = 0
  ): Promise<{ products: Product[]; lastVisible: any; hasMore: boolean }> => {
    if (!offset && initialProductsMemoryCache && Date.now() - initialProductsMemoryCache.timestamp < 60000) {
      return {
        products: initialProductsMemoryCache.products,
        lastVisible: initialProductsMemoryCache.lastVisible,
        hasMore: initialProductsMemoryCache.hasMore
      };
    }

    if (!offset && inFlightApprovedProductsPromise) {
      return inFlightApprovedProductsPromise;
    }

    const fetchPromise = (async () => {
      try {
        const res = await fetch(
          apiUrl(`/api/products?limit=${limitCount}&offset=${typeof offset === 'number' ? offset : 0}`),
          { credentials: 'include' }
        );
        if (!res.ok) return { products: [], lastVisible: null, hasMore: false };
        const data = await safeParseJson(res, 'Approved Products API');
        const list = Array.isArray(data?.data) ? data.data : [];
        const total = Number(data?.total || list.length);
        const startOffset = typeof offset === 'number' ? offset : 0;
        const result = {
          products: list as Product[],
          lastVisible: startOffset + list.length,
          hasMore: startOffset + list.length < total
        };
        if (!offset) {
          initialProductsMemoryCache = { ...result, timestamp: Date.now() };
        }
        return result;
      } catch {
        return { products: [], lastVisible: null, hasMore: false };
      } finally {
        if (!offset) inFlightApprovedProductsPromise = null;
      }
    })();

    if (!offset) inFlightApprovedProductsPromise = fetchPromise;
    return fetchPromise;
  },
  subscribeProduct: (id: string, callback: (p: Product | null) => void) => {
    let active = true;
    fetch(apiUrl(`/api/products/${encodeURIComponent(id)}`), { credentials: 'include' })
      .then((res) => (res.ok ? safeParseJson(res, 'Product Detail API') : null))
      .then((parsed) => {
        if (active && parsed?.data) callback(parsed.data as Product);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  },
  createProduct: async (data: any) => {
    initialProductsMemoryCache = null;
    const res = await fetch(apiUrl('/api/products'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const parsed = await safeParseJson(res, 'Create Product API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not create product');
    return parsed.data;
  },
  updateProduct: async (id: string, data: any) => {
    initialProductsMemoryCache = null;
    const res = await fetch(apiUrl(`/api/products/${encodeURIComponent(id)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const parsed = await safeParseJson(res, 'Update Product API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not update product');
    return parsed.data || { id, ...data };
  },
  deleteProduct: async (id: string, permanent: boolean = false, deletedBy: string = 'Super Admin') => {
    initialProductsMemoryCache = null;
    if (permanent) {
      const res = await fetch(apiUrl(`/api/products/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders()
      });
      if (!res.ok) throw new Error('Could not delete product');
    } else {
      await productApi.updateProduct(id, {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy
      });
    }
  },
  restoreProduct: async (id: string) => {
    initialProductsMemoryCache = null;
    return productApi.updateProduct(id, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null
    });
  }
};

export const configApi = {
  getConfig: async () => {
    if (configMemoryCache && Date.now() - configMemoryCache.timestamp < 120000) {
      return configMemoryCache.data;
    }
    if (inFlightConfigPromise) return inFlightConfigPromise;

    let localBackup: any = null;
    try {
      const saved = localStorage.getItem('elora-general-config');
      if (saved) localBackup = JSON.parse(saved);
    } catch {}

    inFlightConfigPromise = (async () => {
      try {
        const res = await fetch(apiUrl('/api/site-config'), { credentials: 'include' });
        if (res.ok) {
          const parsed = await safeParseJson(res, 'Site Config API');
          const data = parsed?.config || parsed;
          if (data) {
            configMemoryCache = { data, timestamp: Date.now() };
            try {
              localStorage.setItem('elora-general-config', JSON.stringify(data));
            } catch {}
            return data;
          }
        }
        return localBackup;
      } catch {
        return localBackup;
      } finally {
        inFlightConfigPromise = null;
      }
    })();

    return inFlightConfigPromise;
  },
  updateConfig: async (data: any) => {
    configMemoryCache = { data, timestamp: Date.now() };
    try {
      localStorage.setItem('elora-general-config', JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('elora-config-updated', { detail: data }));
    } catch {}
    const res = await fetch(apiUrl('/api/site-config'), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const parsed = await safeParseJson(res, 'Update Site Config API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not update site configuration');
    return parsed?.config || data;
  },
  getBanners: async (): Promise<any[]> => {
    try {
      const res = await fetch(apiUrl('/api/site-config/banners'), { credentials: 'include' });
      if (!res.ok) return [];
      const parsed = await safeParseJson(res, 'Banners API');
      return Array.isArray(parsed?.banners) ? parsed.banners : [];
    } catch {
      return [];
    }
  },
  saveBanner: async (banner: any) => {
    const res = await fetch(apiUrl('/api/site-config/banners'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(banner)
    });
    const parsed = await safeParseJson(res, 'Save Banner API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not save banner');
    return parsed.banner;
  },
  deleteBanner: async (id: string) => {
    const res = await fetch(apiUrl(`/api/site-config/banners/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Could not delete banner');
  },
  getSliderSettings: async () => {
    try {
      const res = await fetch(apiUrl('/api/site-config/slider-settings'), { credentials: 'include' });
      if (!res.ok) return { cycleSeconds: 5.0, enableOverlay: true, pauseOnHover: true };
      const parsed = await safeParseJson(res, 'Slider Settings API');
      return parsed?.settings || { cycleSeconds: 5.0, enableOverlay: true, pauseOnHover: true };
    } catch {
      return { cycleSeconds: 5.0, enableOverlay: true, pauseOnHover: true };
    }
  },
  updateSliderSettings: async (settings: any) => {
    const res = await fetch(apiUrl('/api/site-config/slider-settings'), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(settings)
    });
    const parsed = await safeParseJson(res, 'Update Slider Settings API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not update slider settings');
    return parsed.settings;
  },
  getSiteSettings: async () => {
    try {
      const res = await fetch(apiUrl('/api/site-config/site-settings'), { credentials: 'include' });
      if (!res.ok) return {};
      const parsed = await safeParseJson(res, 'Site Settings API');
      return parsed?.settings || {};
    } catch {
      return {};
    }
  },
  updateSiteSettings: async (settings: any) => {
    const res = await fetch(apiUrl('/api/site-config/site-settings'), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(settings)
    });
    const parsed = await safeParseJson(res, 'Update Site Settings API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not update site settings');
    return parsed.settings;
  }
};

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'WELCOME50',
    code: 'WELCOME50',
    discountType: 'fixed',
    discount: 50,
    minSpend: 500,
    usageLimit: 500,
    perCustomerLimit: 1,
    usage: 142,
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    status: 'active',
    applicableTo: 'all',
    totalDiscountGiven: 7100,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-02-15T12:00:00Z'
  },
  {
    id: 'LUXURY10',
    code: 'LUXURY10',
    discountType: 'percentage',
    discount: 10,
    minSpend: 1000,
    maxDiscount: 500,
    usageLimit: 300,
    perCustomerLimit: 1,
    usage: 89,
    validFrom: '2026-01-15',
    validUntil: '2026-06-30',
    status: 'active',
    applicableTo: 'all',
    totalDiscountGiven: 22450,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z'
  },
  {
    id: 'SAVE200',
    code: 'SAVE200',
    discountType: 'fixed',
    discount: 200,
    minSpend: 2000,
    usageLimit: 100,
    perCustomerLimit: 1,
    usage: 47,
    validFrom: '2026-02-01',
    validUntil: '2026-04-30',
    status: 'active',
    applicableTo: 'all',
    totalDiscountGiven: 9400,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-28T18:00:00Z'
  },
  {
    id: 'EID2026',
    code: 'EID2026',
    discountType: 'percentage',
    discount: 15,
    minSpend: 1500,
    maxDiscount: 800,
    usageLimit: 250,
    perCustomerLimit: 1,
    usage: 12,
    validFrom: '2026-03-10',
    validUntil: '2026-04-15',
    status: 'active',
    applicableTo: 'all',
    totalDiscountGiven: 3600,
    createdAt: '2026-03-05T00:00:00Z',
    updatedAt: '2026-03-10T08:00:00Z'
  }
];

let publicCouponsMemoryCache: { data: Partial<Coupon>[]; timestamp: number } | null = null;
let inFlightCouponsPromise: Promise<Partial<Coupon>[]> | null = null;

export const couponApi = {
  getCoupons: async (): Promise<Coupon[]> => {
    try {
      const res = await fetch(apiUrl('/api/coupons'), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await safeParseJson(res, 'Coupons API');
        if (Array.isArray(data?.coupons)) {
          localStorage.setItem('elora-coupons', JSON.stringify(data.coupons));
          return data.coupons;
        }
      }
    } catch {}
    try {
      const saved = localStorage.getItem('elora-coupons');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_COUPONS;
  },
  createCoupon: async (coupon: Partial<Coupon>): Promise<Coupon> => {
    const res = await fetch(apiUrl('/api/coupons'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(coupon)
    });
    const parsed = await safeParseJson(res, 'Create Coupon API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not create coupon');
    return parsed.coupon;
  },
  updateCoupon: async (id: string, data: Partial<Coupon>): Promise<Coupon> => {
    const cleanId = id.trim().toUpperCase();
    const res = await fetch(apiUrl(`/api/coupons/${encodeURIComponent(cleanId)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const parsed = await safeParseJson(res, 'Update Coupon API');
    if (!res.ok) throw new Error(parsed?.error || 'Could not update coupon');
    return parsed.coupon;
  },
  deleteCoupon: async (id: string): Promise<void> => {
    const cleanId = id.trim().toUpperCase();
    const res = await fetch(apiUrl(`/api/coupons/${encodeURIComponent(cleanId)}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Could not delete coupon');
  },
  getPublicCoupons: async (): Promise<Partial<Coupon>[]> => {
    if (publicCouponsMemoryCache && Date.now() - publicCouponsMemoryCache.timestamp < 120000) {
      return publicCouponsMemoryCache.data;
    }
    if (inFlightCouponsPromise) return inFlightCouponsPromise;

    let localCoupons: Partial<Coupon>[] | null = null;
    try {
      const saved = localStorage.getItem('elora-cached-public-coupons');
      if (saved) localCoupons = JSON.parse(saved);
    } catch {}

    inFlightCouponsPromise = (async () => {
      try {
        const res = await fetch(apiUrl('/api/coupons/public'));
        if (res.ok) {
          const data = await safeParseJson(res, 'Public Coupons API');
          if (Array.isArray(data.coupons)) {
            publicCouponsMemoryCache = { data: data.coupons, timestamp: Date.now() };
            try {
              localStorage.setItem('elora-cached-public-coupons', JSON.stringify(data.coupons));
            } catch {}
            return data.coupons;
          }
        }
      } catch {}
      finally {
        inFlightCouponsPromise = null;
      }
      return localCoupons || DEFAULT_COUPONS.filter((c) => c.status === 'active');
    })();

    return localCoupons || inFlightCouponsPromise;
  },
  validateCoupon: async (
    code: string,
    subtotalBDT: number,
    userEmail?: string
  ): Promise<{ valid: boolean; coupon?: Coupon; discountBDT?: number; error?: string }> => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { valid: false, error: 'Please enter a coupon code' };
    try {
      const res = await fetch(apiUrl('/api/coupons/validate'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ code: clean, subtotalBDT, email: userEmail })
      });
      return await safeParseJson(res, 'Coupon Validation API');
    } catch (e: any) {
      return { valid: false, error: e?.message || 'Failed to validate coupon' };
    }
  },
  incrementUsage: async (couponId: string, discountBDT: number = 0): Promise<{ success: boolean }> => {
    const cleanId = couponId.trim().toUpperCase();
    const res = await fetch(apiUrl(`/api/coupons/${encodeURIComponent(cleanId)}/usage`), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ discountAmount: discountBDT })
    });
    if (!res.ok) throw new Error(`Failed to record usage for coupon "${cleanId}".`);
    return { success: true };
  }
};

export const DEFAULT_RETURNS: ReturnRequest[] = [
  {
    id: 'ret-101',
    orderId: 'ORD-7721',
    customerName: 'Tanvir Hossain',
    customerEmail: 'tanvir@gmail.com',
    customerPhone: '01712345678',
    productName: 'Traditional Hand-Stitched Silk Panjabi',
    productImage: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=400',
    refundAmount: 3200,
    reason: 'Size mismatch — requested size L is significantly larger than measurement chart.',
    requestedDate: '2026-10-02T14:30:00.000Z',
    status: 'requested',
    photos: ['https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=400']
  }
];

export const DEFAULT_AD_BOARDS: AdBoard[] = [
  {
    id: 'adb-1',
    title: 'Festive Season Megasale — Up to 40% Off',
    subtitle: 'Exclusive discounts on traditional wear and premium lifestyle',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200',
    targetUrl: '/category/fashions',
    placement: 'homepage_billboard',
    status: 'active',
    startDate: '2026-09-15',
    endDate: '2026-10-31',
    clicks: 428,
    impressions: 5920,
    createdAt: '2026-09-15T00:00:00.000Z'
  }
];

export const returnApi = {
  getReturns: async (): Promise<ReturnRequest[]> => {
    try {
      const res = await fetch(apiUrl('/api/returns'), {
        credentials: 'include',
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await safeParseJson(res, 'Returns API');
        if (Array.isArray(data?.data) && data.data.length > 0) return data.data;
      }
    } catch {}
    try {
      const saved = localStorage.getItem('elora-admin-returns');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_RETURNS;
  },
  createReturn: async (data: Omit<ReturnRequest, 'id'>): Promise<ReturnRequest> => {
    const res = await fetch(apiUrl('/api/returns'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const parsed = await safeParseJson(res, 'Create Return API');
    const created = parsed?.data || { id: `ret-${Date.now()}`, ...data, requestedDate: new Date().toISOString() };
    return created;
  },
  updateReturn: async (id: string, updates: Partial<ReturnRequest>): Promise<ReturnRequest> => {
    const res = await fetch(apiUrl(`/api/returns/${encodeURIComponent(id)}`), {
      method: 'PUT',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates)
    });
    const parsed = await safeParseJson(res, 'Update Return API');
    return parsed?.data || ({ id, ...updates } as ReturnRequest);
  },
  deleteReturn: async (id: string): Promise<void> => {
    try {
      const current = await returnApi.getReturns();
      localStorage.setItem('elora-admin-returns', JSON.stringify(current.filter((r) => r.id !== id)));
    } catch {}
  }
};

export const adBoardApi = {
  getAdBoards: async (): Promise<AdBoard[]> => {
    try {
      const res = await fetch(apiUrl('/api/ad-boards'), { credentials: 'include' });
      if (res.ok) {
        const data = await safeParseJson(res, 'Ad Boards API');
        if (Array.isArray(data?.data) && data.data.length > 0) return data.data;
      }
    } catch {}
    return DEFAULT_AD_BOARDS;
  },
  createAdBoard: async (data: Omit<AdBoard, 'id'>): Promise<AdBoard> => {
    const res = await fetch(apiUrl('/api/ad-boards'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    });
    const parsed = await safeParseJson(res, 'Create Ad Board API');
    return parsed?.data || ({ id: `adb-${Date.now()}`, ...data } as AdBoard);
  },
  updateAdBoard: async (id: string, updates: Partial<AdBoard>): Promise<AdBoard> => {
    const res = await fetch(apiUrl('/api/ad-boards'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id, ...updates })
    });
    const parsed = await safeParseJson(res, 'Update Ad Board API');
    return parsed?.data || ({ id, ...updates } as AdBoard);
  },
  deleteAdBoard: async (id: string): Promise<void> => {
    await fetch(apiUrl(`/api/ad-boards/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeaders()
    });
  }
};
