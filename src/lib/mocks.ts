import type {
  AdminUser,
  BannerRecord,
  BrandRecord,
  CategoryRecord,
  ContentsRecord,
  DealRecord,
  FaqRecord,
  SupportMessageRecord,
  NotificationRecord,
  OrderRecord,
  OverviewData,
  PaymentRecord,
  PrepRecord,
  ProductRecord,
  PromoCodeRecord,
} from "./types";

const now = new Date().toISOString();

export const mockUser: AdminUser = {
  id: "admin-1",
  name: "Mitchell",
  email: "admin@mrinintl.com",
  role: "admin",
  status: "active",
  profile: "/images/avatar-admin.png",
};

const customers: AdminUser[] = [
  {
    id: "c1",
    name: "Sarah Williams",
    email: "sarah.w@example.com",
    role: "wholesale",
    status: "active",
    profile: "/images/avatar-profile.png",
    createdAt: "2025-01-12T10:00:00.000Z",
    wholesaleFee: { status: "paid", amount: 20, paidAt: "2025-01-12T10:30:00.000Z" },
  },
  {
    id: "c2",
    name: "James Carter",
    email: "james.carter@example.com",
    role: "retail",
    status: "active",
    createdAt: "2025-02-03T10:00:00.000Z",
  },
  {
    id: "c3",
    name: "Amina Rahman",
    email: "amina.r@example.com",
    role: "wholesale",
    status: "active",
    createdAt: "2025-03-18T10:00:00.000Z",
    wholesaleFee: { status: "pending", amount: 20, paidAt: null },
  },
  {
    id: "c4",
    name: "Luis Ortega",
    email: "luis.o@example.com",
    role: "retail",
    status: "blocked",
    createdAt: "2025-04-09T10:00:00.000Z",
  },
  {
    id: "c5",
    name: "Priya Shah",
    email: "priya.shah@example.com",
    role: "wholesale",
    status: "active",
    createdAt: "2025-04-21T10:00:00.000Z",
    wholesaleFee: null,
  },
];

const products: ProductRecord[] = [
  {
    id: "p1",
    name: "Wireless Headphones",
    sku: "MR-HP-001",
    retailPrice: 120,
    wholesalePrice: 84,
    stock: 140,
    status: "active",
    isFeatured: true,
    category: { id: "cat1", name: "Electronics" },
    images: [{ id: "i1", url: "/images/product-headphones.png", isPrimary: true }],
  },
  {
    id: "p2",
    name: "Studio Speaker",
    sku: "MR-SP-014",
    retailPrice: 240,
    wholesalePrice: 168,
    stock: 62,
    status: "active",
    isFeatured: true,
    category: { id: "cat1", name: "Electronics" },
    images: [{ id: "i2", url: "/images/product-2.png", isPrimary: true }],
  },
  {
    id: "p3",
    name: "Smart Watch",
    sku: "MR-SW-008",
    retailPrice: 189,
    wholesalePrice: 132,
    stock: 18,
    status: "active",
    isFeatured: false,
    category: { id: "cat2", name: "Wearables" },
    images: [{ id: "i3", url: "/images/product-3.png", isPrimary: true }],
  },
  {
    id: "p4",
    name: "Travel Backpack",
    sku: "MR-BG-022",
    retailPrice: 78,
    wholesalePrice: 49,
    stock: 0,
    status: "inactive",
    isFeatured: false,
    category: { id: "cat3", name: "Accessories" },
    images: [{ id: "i4", url: "/images/product-4.png", isPrimary: true }],
  },
  {
    id: "p5",
    name: "Desk Lamp",
    sku: "MR-LM-011",
    retailPrice: 46,
    wholesalePrice: 29,
    stock: 210,
    status: "active",
    isFeatured: false,
    category: { id: "cat3", name: "Accessories" },
    images: [{ id: "i5", url: "/images/product-5.png", isPrimary: true }],
  },
];

const orders: OrderRecord[] = [
  {
    id: "o1",
    orderNumber: "38422",
    customerType: "wholesale",
    status: "processing",
    total: 120,
    createdAt: now,
    user: customers[0],
    items: [
      {
        id: "oi1",
        name: "Wireless Headphones",
        sku: "MR-HP-001",
        quantity: 2,
        unitPrice: 60,
        total: 120,
      },
    ],
  },
  {
    id: "o2",
    orderNumber: "38420",
    customerType: "wholesale",
    status: "completed",
    total: 120,
    createdAt: now,
    user: customers[0],
  },
  {
    id: "o3",
    orderNumber: "38419",
    customerType: "retail",
    status: "processing",
    total: 89,
    createdAt: now,
    user: customers[1],
  },
  {
    id: "o4",
    orderNumber: "38418",
    customerType: "wholesale",
    status: "completed",
    total: 240,
    createdAt: now,
    user: customers[2],
  },
  {
    id: "o5",
    orderNumber: "38415",
    customerType: "retail",
    status: "cancelled",
    total: 46,
    createdAt: now,
    user: customers[3],
  },
];

export const mockOverview: OverviewData = {
  totalSales: 24580,
  retailSales: 16320,
  wholesaleSales: 8260,
  totalOrders: 248,
  customers: 1248,
  products: 3420,
  orderCounts: { retail: 62, wholesale: 38 },
  orderBreakdown: { retail: 62, wholesale: 38 },
  salesByCategory: [
    { name: "Electronics", revenue: 9200, percent: 38 },
    { name: "Fashion", revenue: 6300, percent: 26 },
    { name: "Footwear", revenue: 4600, percent: 19 },
    { name: "Home & Living", revenue: 2700, percent: 11 },
    { name: "Cosmetics", revenue: 1780, percent: 7 },
  ],
  year: new Date().getFullYear(),
  yearSales: 24580,
  availableYears: Array.from(
    { length: new Date().getFullYear() - 1999 },
    (_, index) => new Date().getFullYear() - index,
  ),
  monthlySales: [
    { month: 1, retail: 28000, wholesale: 14000, revenue: 42000 },
    { month: 2, retail: 18000, wholesale: 10000, revenue: 28000 },
    { month: 3, retail: 32000, wholesale: 19000, revenue: 51000 },
    { month: 4, retail: 22000, wholesale: 14000, revenue: 36000 },
    { month: 5, retail: 30000, wholesale: 17000, revenue: 47000 },
    { month: 6, retail: 25000, wholesale: 14000, revenue: 39000 },
    { month: 7, retail: 28000, wholesale: 16000, revenue: 44000 },
    { month: 8, retail: 52000, wholesale: 32849.93, revenue: 84849.93 },
    { month: 9, retail: 34000, wholesale: 18000, revenue: 52000 },
    { month: 10, retail: 26000, wholesale: 15000, revenue: 41000 },
    { month: 11, retail: 37000, wholesale: 21000, revenue: 58000 },
    { month: 12, retail: 21000, wholesale: 12000, revenue: 33000 },
  ],
  yearlyRevenue: [
    { month: 1, revenue: 42000 },
    { month: 2, revenue: 28000 },
    { month: 3, revenue: 51000 },
    { month: 4, revenue: 36000 },
    { month: 5, revenue: 47000 },
    { month: 6, revenue: 39000 },
    { month: 7, revenue: 44000 },
    { month: 8, revenue: 84849.93 },
    { month: 9, revenue: 52000 },
    { month: 10, revenue: 41000 },
    { month: 11, revenue: 58000 },
    { month: 12, revenue: 33000 },
  ],
  latestOrders: orders,
  recentActivity: [
    { id: "a1", message: "New user registered John Smith", createdAt: now },
    { id: "a2", message: "New order John Smith", createdAt: now },
    { id: "a3", message: "3PL service request John Smith", createdAt: now },
    { id: "a4", message: "New user registered John Smith", createdAt: now },
  ],
};

export const mockCustomers = customers;
export const mockProducts = products;
export const mockOrders = orders;

export const mockCategories: CategoryRecord[] = [
  { id: "cat1", name: "Electronics", image: "/images/product-2.png", status: "active", _count: { products: 80 } },
  { id: "cat2", name: "Wearables", image: "/images/product-3.png", status: "active", _count: { products: 54 } },
  { id: "cat3", name: "Accessories", image: "/images/product-5.png", status: "active", _count: { products: 32 } },
  { id: "cat4", name: "Home", image: "/images/product-4.png", status: "inactive", _count: { products: 17 } },
];

export const mockBrands: BrandRecord[] = [
  { id: "b1", name: "MR Audio", image: "/images/product-2.png", createdAt: now },
  { id: "b2", name: "Northline", image: "/images/product-3.png", createdAt: now },
  { id: "b3", name: "Atlas Goods", image: "/images/product-5.png", createdAt: now },
];

export const mockPayments: PaymentRecord[] = orders.map((order, index) => ({
  id: `pay${index + 1}`,
  amount: order.total,
  status: order.status === "cancelled" ? "failed" : "paid",
  transactionId: `txn_84${order.orderNumber}`,
  paymentMethod: "card",
  createdAt: order.createdAt,
  user: order.user,
  order,
}));

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export const mockPrep: PrepRecord[] = [
  {
    id: "pr1",
    userId: customers[0].id,
    status: "under_review",
    attachments: [
      "/images/product-2.png",
      "/images/product-3.png",
      "/uploads/prep/packing-list.pdf",
    ],
    adminNote: null,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
    user: customers[0],
  },
  {
    // Resubmitted: back under review with last round's note.
    id: "pr2",
    userId: customers[2].id,
    status: "under_review",
    attachments: ["/images/product-4.png", "/uploads/prep/sku-list.xlsx"],
    adminNote: "SKU photos are blurry. Please upload clearer ones.",
    createdAt: daysAgo(6),
    updatedAt: daysAgo(1),
    user: customers[2],
  },
  {
    id: "pr3",
    userId: customers[1].id,
    status: "correction_required",
    attachments: ["/uploads/prep/shipment.csv"],
    adminNote: "The CSV is missing quantities for each SKU.",
    createdAt: daysAgo(4),
    updatedAt: daysAgo(3),
    user: customers[1],
  },
  {
    id: "pr4",
    userId: customers[3].id,
    status: "completed",
    attachments: ["/images/product-5.png"],
    adminNote: null,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(8),
    user: customers[3],
  },
];

export const mockNotifications: NotificationRecord[] = [
  {
    id: "n1",
    message: "New order placed",
    description: "Sarah Williams placed order MRI-84021.",
    isRead: false,
    orderId: "o1",
    createdAt: now,
  },
  {
    id: "n2",
    message: "New prep request",
    description: "Sarah Williams submitted files for review.",
    isRead: false,
    createdAt: now,
  },
  {
    id: "n3",
    message: "Payment received",
    description: "James Carter paid $248.00 for order MRI-84018.",
    isRead: true,
    orderId: "o2",
    createdAt: now,
  },
];

export const mockSupportMessages: SupportMessageRecord[] = [
  {
    id: "sup1",
    name: "John Smith",
    email: "john@example.com",
    subject: "Order delivery question",
    message: "Hi, when will my wholesale order ship?",
    status: "pending",
    createdAt: now,
  },
  {
    id: "sup2",
    name: "Amina Rahman",
    email: "amina@example.com",
    subject: "Account access",
    message: "I cannot reset my password from the retail portal.",
    status: "replied",
    reply: "Please use Forgot Password and check spam for the OTP email.",
    repliedAt: now,
    createdAt: now,
  },
];

export const mockDeals: DealRecord[] = [
  {
    id: "deal1",
    productId: "p1",
    dealPrice: 89,
    type: "weekly",
    startDate: now,
    endDate: now,
    isActive: true,
    product: {
      id: "p1",
      name: "Wireless Headphones",
      sku: "MR-HP-001",
      retailPrice: 120,
      images: [{ id: "i1", url: "/images/product-headphones.png", isPrimary: true }],
    },
    createdAt: now,
  },
  {
    id: "deal2",
    productId: "p5",
    dealPrice: 24,
    type: "clearance",
    startDate: now,
    endDate: null,
    isActive: true,
    product: {
      id: "p5",
      name: "Desk Lamp",
      sku: "MR-LM-011",
      retailPrice: 46,
      images: [{ id: "i5", url: "/images/product-5.png", isPrimary: true }],
    },
    createdAt: now,
  },
];

export const mockPromoCodes: PromoCodeRecord[] = [
  {
    id: "promo1",
    code: "WELCOME10",
    description: "10% off your first eligible order",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 50,
    maxDiscount: 100,
    usageLimit: 1000,
    usedCount: 12,
    perUserLimit: 1,
    isActive: true,
    customerType: null,
    expiresAt: null,
    createdAt: now,
  },
  {
    id: "promo2",
    code: "WHOLESALE25",
    description: "Flat $25 off wholesale carts",
    discountType: "fixed",
    discountValue: 25,
    minOrderAmount: 200,
    usageLimit: 200,
    usedCount: 4,
    perUserLimit: 3,
    isActive: true,
    customerType: "wholesale",
    expiresAt: now,
    createdAt: now,
  },
];

export const mockFaqs: FaqRecord[] = [
  {
    id: "faq1",
    question: "How does wholesale pricing work?",
    answer: "Wholesale prices unlock automatically when your account has the wholesale role and minimum quantities are met.",
    order: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "faq2",
    question: "Can I track my order status?",
    answer: "Yes. Open your orders page to see payment confirmation, processing, shipping, and delivery updates.\nYou also get an email at each step.",
    order: 2,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockBanners: BannerRecord[] = [
  {
    id: "banner1",
    image: "https://placehold.co/1400x500?text=MR+International",
    targetType: "product",
    productId: "p1",
    product: { id: "p1", name: "Wireless Headphones", sku: "MR-HP-001", retailPrice: 120, status: "active", images: [] },
    discountPercent: 20,
    startDate: new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10) + "T00:00:00.000Z",
    endDate: new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10) + "T23:59:59.999Z",
    isActive: true,
    createdAt: now,
  },
  {
    id: "banner2",
    image: "https://placehold.co/1400x500?text=Seasonal+Deals",
    targetType: "category",
    categoryId: "cat1",
    category: { id: "cat1", name: "Electronics", status: "active", _count: { products: 80 } },
    isActive: true,
    createdAt: now,
  },
  {
    id: "banner3",
    image: "https://placehold.co/1400x500?text=Old+banner",
    link: "/products?deal=true",
    isActive: false,
    createdAt: now,
  },
];

export const mockContents: ContentsRecord = {
  id: "content-1",
  termsAndCondition:
    "These Terms & Conditions govern use of the MR International LLC wholesale and retail platform.",
  privacyPolicy:
    "MR International LLC collects account, order, and payment information only to fulfill purchases and support.",
  prices: { shippingFee: 10, taxRate: 0, wholesaleAccountFee: 20 },
};
