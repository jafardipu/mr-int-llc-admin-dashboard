export type Role = "supper_admin" | "admin" | "retail" | "wholesale";

export type UserStatus = "active" | "blocked";

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled";

// Payments spell it "canceled"; orders spell it "cancelled".
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "canceled";

export type PrepStatus = "under_review" | "correction_required" | "completed";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPage?: number;
  };
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errorSources?: { path: string | number; message: string }[];
}

export interface AdminUser {
  id: string;
  name?: string | null;
  email: string;
  role: Role;
  status?: UserStatus;
  profile?: string | null;
  phoneNumber?: string | null;
  isVerified?: boolean;
  createdAt?: string;
  orders?: OrderRecord[];
}

export interface AuthPayload {
  user: AdminUser;
  accessToken: string;
  refreshToken?: string;
}

export interface OverviewData {
  totalSales: number;
  yearSales?: number;
  retailSales?: number;
  wholesaleSales?: number;
  totalOrders: number;
  customers: number;
  products: number;
  orderCounts?: { retail: number; wholesale: number };
  orderBreakdown: { retail: number; wholesale: number };
  salesByCategory?: { name: string; revenue: number; percent: number }[];
  year?: number;
  availableYears?: number[];
  monthlySales?: { month: number; retail: number; wholesale: number; revenue: number }[];
  yearlyRevenue: { month: number; revenue: number }[];
  latestOrders: OrderRecord[];
  recentActivity: { id: string; message: string; createdAt: string }[];
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerType?: "retail" | "wholesale";
  status: OrderStatus;
  subtotal?: number;
  shippingFee?: number;
  tax?: number;
  discount?: number;
  total: number;
  promoCodeId?: string | null;
  promoCode?: string | null;
  notes?: string | null;
  createdAt: string;
  user?: AdminUser;
  items?: OrderItemRecord[];
  address?: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    country?: string | null;
  } | null;
  payment?: PaymentRecord | null;
}

export interface PromoCodeRecord {
  id: string;
  code: string;
  description?: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  customerType?: "retail" | "wholesale" | null;
  createdAt?: string;
  updatedAt?: string;
}

export type DealType = "weekly" | "clearance";

export interface DealRecord {
  id: string;
  productId: string;
  dealPrice: number;
  type: DealType;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
  product?: {
    id: string;
    name: string;
    sku?: string;
    retailPrice?: number;
    images?: { id?: string; url: string; isPrimary?: boolean }[];
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItemRecord {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: { images?: { url: string }[] };
}

export interface VolumeTier {
  minQty: number;
  maxQty?: number | null;
  discountPercent: number;
  unitPrice: number;
}

export interface ProductRecord {
  id: string;
  name: string;
  sku: string;
  slug?: string | null;
  description?: string | null;
  retailPrice: number;
  wholesalePrice: number;
  wholesaleMinQty?: number;
  stock: number;
  status?: string;
  brandId?: string;
  categoryId?: string;
  asin?: string | null;
  amazonUrl?: string | null;
  walmartUrl?: string | null;
  volumeTiers?: VolumeTier[] | null;
  isFeatured?: boolean;
  isDeal?: boolean;
  dealPrice?: number | null;
  avgRating?: number;
  totalReview?: number;
  brand?: { id: string; name: string };
  category?: { id: string; name: string };
  images?: { id: string; url: string; isPrimary?: boolean }[];
}

export interface CategoryRecord {
  id: string;
  name: string;
  image?: string | null;
  status?: "active" | "inactive";
  createdAt?: string;
  _count?: { products?: number };
  products?: ProductRecord[];
}

export interface BrandRecord {
  id: string;
  name: string;
  image?: string | null;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  status: PaymentStatus | string;
  transactionId?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
  createdAt: string;
  user?: AdminUser;
  order?: OrderRecord;
}

/** Statuses an admin can set when reviewing a request that is `under_review`. */
export type PrepReviewStatus = Extract<PrepStatus, "completed" | "correction_required">;

export interface PrepRecord {
  id: string;
  userId: string;
  status: PrepStatus;
  /** File URLs. A resubmission replaces the whole set. */
  attachments: string[];
  /** Last note sent to the customer. Non-null on an `under_review` request means it was resubmitted. */
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<AdminUser, "id" | "name" | "email" | "role" | "phoneNumber" | "profile">;
}

export interface ContentsRecord {
  id?: string;
  termsAndCondition?: string;
  privacyPolicy?: string;
  aboutUs?: string;
}

export interface BannerRecord {
  id: string;
  image: string;
  link?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FaqRecord {
  id: string;
  question: string;
  answer: string;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export type SupportMessageStatus = "pending" | "replied";

export interface SupportMessageRecord {
  id: string;
  name: string;
  email: string;
  subject?: string | null;
  message: string;
  status?: SupportMessageStatus | string;
  reply?: string | null;
  repliedAt?: string | null;
  userId?: string | null;
  user?: AdminUser | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationRecord {
  id: string;
  receiverId?: string | null;
  orderId?: string | null;
  message: string;
  description?: string | null;
  isRead?: boolean;
  createdAt: string;
}
