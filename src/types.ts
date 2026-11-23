export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  images?: string[];
  gallery: string[];
  description: string;
  details: string;
  reviews: number;
  rating: number;
  soldCount?: number;
  stock?: number;
  brand?: string;
  sku?: string;
  condition?: 'new' | 'used' | 'refurbished';
  subcategory?: string;
  minOrderQuantity?: number;
  deliveryTime?: string;
  deliveryFee?: number;
  codAllowed?: boolean;
  tags?: string[];
  freeShipping?: boolean;
  variants?: {
    sizes: string[];
    colors: string[];
  };
  isHidden?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt?: any;
  updatedAt?: any;
  seller?: {
    id?: string;
    name: string;
    rating: number;
    followers: string;
    chatResponse: string;
    logo?: string;
    banner?: string;
    verified?: boolean;
    description?: string;
    category?: string;
  };
  specifications?: { label: string; value: string }[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  isSponsored?: boolean;
  adBudget?: number;
  adStatus?: 'active' | 'paused' | 'ended';
  adClicks?: number;
  adImpressions?: number;
  isFlashSale?: boolean;
  flashSalePrice?: number;
  normalPriceBeforeFlash?: number;
  flashSaleStock?: number;
  flashSaleStartDate?: string;
  flashSaleEndDate?: string;
  badges?: string[];
  searchTags?: string[];
  deliveryFeeOverride?: number;
  sellerDescription?: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selected?: boolean;
}

export interface Address {
  id?: string;
  fullName?: string;
  phone?: string;
  division?: string;
  district?: string;
  upazila?: string;
  fullAddress?: string;
  email?: string;
  isDefault?: boolean;
  label?: 'Home' | 'Office' | 'Other' | string;
  addressLine?: string;
  area?: string;
  city?: string;
  thana?: string;
}

export interface Order {
  id: string;
  userId?: string;
  date?: string;
  items: CartItem[];
  address: Address;
  subtotal: number;
  deliveryCharge: number;
  baseDeliveryFee?: number;
  codFee?: number;
  deliveryZone?: 'dhaka' | 'sub-dhaka' | 'outside';
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: 'paid' | 'unpaid' | 'refunded';
  status: 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'returned';
  createdAt: string;
  estimatedDelivery?: string;
  transactionId?: string;
  senderNumber?: string;
  paymentAmount?: number;
  paymentId?: string;
  cardBrand?: string;
  cardLast4?: string;
  couponCode?: string;
  timeline?: { status: string; date: string; message: string }[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  cancellationRequested?: boolean;
  cancellationReason?: string;
  cancellationRequestedAt?: string;
}

export interface Shop {
  id?: string;
  name: string;
  ownerName?: string;
  description?: string;
  logo?: string;
  banner?: string;
  category?: string;
  followers?: number;
  rating?: number;
  verified?: boolean;
  isVerified?: boolean;
  joinedAt?: string;
  totalSales?: number;
  revenue?: number;
  ordersCount?: number;
  status?: 'pending' | 'active' | 'approved' | 'rejected' | 'suspended';
  contactNumber?: string;
  email?: string;
  division?: string;
  district?: string;
  upazila?: string;
  fullAddress?: string;
  nid?: string;
  tradeLicense?: string;
  commissionRate?: number;
}

export interface UserRestrictions {
  blockDiscountCodes?: boolean;
  blockOrdering?: boolean;
  blockCOD?: boolean;
  blockReviews?: boolean;
  blockChat?: boolean;
}

export interface User {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  banner?: string;
  addresses?: Address[];
  joinedAt?: string;
  role?: 'user' | 'admin' | string;
  adminRoleId?: string;
  adminRoleName?: string;
  permissions?: string[];
  permissionsLevel?: Record<string, 'read' | 'full'>;
  lastActive?: string;
  status?: 'pending' | 'active' | 'rejected' | 'suspended' | string;
  restrictions?: UserRestrictions;
  shop?: Shop;
  loyaltyPoints?: number;
  gender?: 'male' | 'female' | 'other' | string;
  dob?: string;
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  images: string[];
  date: string;
  helpful: number;
  sellerReply?: string;
  sellerReplyDate?: string;
  color?: string;
  size?: string;
  status?: 'published' | 'pending' | 'flagged' | 'hidden';
  flaggedReason?: string;
  isVerified?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Comment {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  text: string;
  date: string;
  aiReply?: string;
  history?: { question: string; answer: string }[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'inventory' | 'customer' | 'review' | 'merchant' | 'system';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  actionView?: string;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem?: boolean;
  color?: string;
}

export interface ActivityLogItem {
  id: string;
  adminId?: string;
  adminName: string;
  adminEmail: string;
  action: 'Approve' | 'Reject' | 'Suspend' | 'Activate' | 'Delete' | 'Restore' | 'Trash' | 'Edit' | 'Create' | 'Role_Change' | 'Status_Change';
  targetType: 'Product' | 'Order' | 'Merchant' | 'Customer' | 'Review' | 'Settings' | 'Coupon' | 'Role';
  targetTitle: string;
  details?: string;
  timestamp: string;
}

export interface Coupon {
  id: string;
  code: string;
  notes?: string;
  discountType: 'percentage' | 'fixed';
  discount: number;
  freeShipping?: boolean;
  minSpend?: number;
  maxDiscount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  usage: number;
  validFrom?: string;
  validUntil?: string;
  status: 'active' | 'disabled' | 'expired' | 'scheduled';
  distributionType?: 'all_users' | 'targeted_users' | 'promo_code_only';
  targetedUserIds?: string[];
  targetedUserEmails?: string[];
  applicableTo?: 'all' | 'category' | 'products';
  applicableCategories?: string[];
  applicableProductIds?: string[];
  totalDiscountGiven?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  productId?: string;
  productName: string;
  productImage?: string;
  orderTotal?: number;
  refundAmount: number;
  reason: string;
  requestedDate: string;
  status: 'requested' | 'approved' | 'item_received' | 'refunded' | 'rejected';
  photos?: string[];
  adminNote?: string;
  updatedAt?: string;
}

export interface AdBoard {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  targetUrl: string;
  placement: 'homepage_billboard' | 'category_banner' | 'sidebar_ad' | 'popup_modal' | 'footer_strip';
  status: 'active' | 'scheduled' | 'expired' | 'paused';
  startDate?: string;
  endDate?: string;
  clicks?: number;
  impressions?: number;
  createdAt?: string;
  updatedAt?: string;
}

export { CATEGORIES, CATEGORY_LABELS_BN } from './constants/categories';
