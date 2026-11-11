import type { FetchArgs } from "@reduxjs/toolkit/query";
import {
  mockBanners,
  mockBrands,
  mockCategories,
  mockContents,
  mockCustomers,
  mockFaqs,
  mockSupportMessages,
  mockNotifications,
  mockOrders,
  mockOverview,
  mockPayments,
  mockPrep,
  mockProducts,
  mockPromoCodes,
  mockUser,
} from "@/lib/mocks";
import type { Envelope } from "./baseQuery";

function urlOf(args: string | FetchArgs) {
  return typeof args === "string" ? args : args.url;
}

function methodOf(args: string | FetchArgs) {
  return typeof args === "string" ? "GET" : (args.method ?? "GET");
}

export function mockFallback(args: string | FetchArgs): Envelope<unknown> | null {
  if (methodOf(args) !== "GET") return null;

  const url = urlOf(args);

  if (url.startsWith("/dashboard")) {
    const params =
      typeof args === "object" && args.params && typeof args.params === "object"
        ? (args.params as Record<string, string | number | undefined>)
        : {};
    const year = Number(params.year) || mockOverview.year || new Date().getFullYear();
    return {
      data: {
        ...mockOverview,
        year,
        yearSales: year === mockOverview.year ? mockOverview.yearSales : 0,
        retailSales: year === mockOverview.year ? mockOverview.retailSales : 0,
        wholesaleSales: year === mockOverview.year ? mockOverview.wholesaleSales : 0,
        orderBreakdown:
          year === mockOverview.year
            ? mockOverview.orderBreakdown
            : { retail: 0, wholesale: 0 },
        salesByCategory: year === mockOverview.year ? mockOverview.salesByCategory : [],
        monthlySales:
          year === mockOverview.year
            ? mockOverview.monthlySales
            : mockOverview.monthlySales?.map((item) => ({
                ...item,
                retail: 0,
                wholesale: 0,
                revenue: 0,
              })),
        yearlyRevenue:
          year === mockOverview.year
            ? mockOverview.yearlyRevenue
            : mockOverview.yearlyRevenue.map((item) => ({ ...item, revenue: 0 })),
      },
      message: "Mock overview",
    };
  }
  if (url === "/users/my-profile") {
    return { data: mockUser, message: "Mock profile" };
  }
  if (url.startsWith("/users/") && url !== "/users") {
    const id = url.replace("/users/", "");
    return {
      data: mockCustomers.find((item) => item.id === id) ?? mockCustomers[0],
      message: "Mock customer",
    };
  }
  if (url.startsWith("/users")) {
    const params =
      typeof args === "object" && args.params && typeof args.params === "object"
        ? (args.params as Record<string, string | number | undefined>)
        : {};
    let items = mockCustomers.filter((item) => item.role === "retail" || item.role === "wholesale");
    if (params.role) items = items.filter((item) => item.role === String(params.role));
    if (params.status) items = items.filter((item) => item.status === String(params.status));
    if (params.searchTerm) {
      const term = String(params.searchTerm).toLowerCase();
      items = items.filter(
        (item) =>
          item.name?.toLowerCase().includes(term) ||
          item.email.toLowerCase().includes(term) ||
          item.phoneNumber?.toLowerCase().includes(term),
      );
    }
    return { data: { data: items, meta: { total: items.length, page: 1, limit: 10 } } };
  }
  if (url.startsWith("/products/") && url !== "/products") {
    const id = url.replace("/products/", "");
    return {
      data: mockProducts.find((item) => item.id === id) ?? mockProducts[0],
      message: "Mock product",
    };
  }
  if (url.startsWith("/products")) {
    return { data: { data: mockProducts, meta: { total: mockProducts.length, page: 1, limit: 10 } } };
  }
  if (url.startsWith("/categories/") && url !== "/categories") {
    const id = url.replace("/categories/", "");
    return {
      data: mockCategories.find((item) => item.id === id) ?? mockCategories[0],
      message: "Mock category",
    };
  }
  if (url.startsWith("/categories")) {
    return { data: { data: mockCategories, meta: { total: mockCategories.length, page: 1, limit: 10 } } };
  }
  if (url.startsWith("/brands/") && url !== "/brands") {
    const id = url.replace("/brands/", "");
    return {
      data: mockBrands.find((item) => item.id === id) ?? mockBrands[0],
      message: "Mock brand",
    };
  }
  if (url.startsWith("/brands")) {
    return { data: { data: mockBrands, meta: { total: mockBrands.length, page: 1, limit: 10 } } };
  }
  if (url.startsWith("/orders/") && url !== "/orders") {
    const id = url.replace("/orders/", "");
    return {
      data: mockOrders.find((item) => item.id === id) ?? mockOrders[0],
      message: "Mock order",
    };
  }
  if (url.startsWith("/orders")) {
    return { data: { data: mockOrders, meta: { total: mockOrders.length, page: 1, limit: 10 } } };
  }
  if (url.startsWith("/payments/") && url !== "/payments") {
    const id = url.replace("/payments/", "");
    return {
      data: mockPayments.find((item) => item.id === id) ?? mockPayments[0],
      message: "Mock payment",
    };
  }
  if (url.startsWith("/payments")) {
    return { data: { data: mockPayments, meta: { total: mockPayments.length, page: 1, limit: 10 } } };
  }
  if (url.startsWith("/prep-services/") && url !== "/prep-services") {
    const id = url.replace("/prep-services/", "");
    return {
      data: mockPrep.find((item) => item.id === id) ?? mockPrep[0],
      message: "Mock prep",
    };
  }
  if (url.startsWith("/prep-services")) {
    return { data: { data: mockPrep, meta: { total: mockPrep.length, page: 1, limit: 10 } } };
  }
  if (url.startsWith("/contents")) {
    return { data: mockContents, message: "Mock contents" };
  }
  if (url.startsWith("/contact/") && url !== "/contact") {
    const id = url.replace("/contact/", "").replace(/\/reply$/, "");
    return {
      data: mockSupportMessages.find((item) => item.id === id) ?? mockSupportMessages[0],
      message: "Mock support message",
    };
  }
  if (url.startsWith("/contact")) {
    const params =
      typeof args === "object" && args.params && typeof args.params === "object"
        ? (args.params as Record<string, string | number | undefined>)
        : {};
    let items = [...mockSupportMessages];
    if (params.status) {
      items = items.filter((item) => (item.status ?? "pending") === String(params.status));
    }
    if (params.searchTerm) {
      const term = String(params.searchTerm).toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.email.toLowerCase().includes(term) ||
          item.subject?.toLowerCase().includes(term) ||
          item.message.toLowerCase().includes(term),
      );
    }
    return {
      data: { data: items, meta: { total: items.length, page: 1, limit: 20 } },
      message: "Mock support messages",
    };
  }
  if (url.startsWith("/faq/") && url !== "/faq") {
    const id = url.replace("/faq/", "");
    return {
      data: mockFaqs.find((item) => item.id === id) ?? mockFaqs[0],
      message: "Mock faq",
    };
  }
  if (url.startsWith("/faq")) {
    return {
      data: { data: mockFaqs, meta: { total: mockFaqs.length, page: 1, limit: 100 } },
      message: "Mock faqs",
    };
  }
  if (url.startsWith("/promo-codes/") && url !== "/promo-codes") {
    const id = url.replace("/promo-codes/", "");
    return {
      data: mockPromoCodes.find((item) => item.id === id) ?? mockPromoCodes[0],
      message: "Mock promo code",
    };
  }
  if (url.startsWith("/promo-codes")) {
    return {
      data: {
        data: mockPromoCodes,
        meta: { total: mockPromoCodes.length, page: 1, limit: 100 },
      },
      message: "Mock promo codes",
    };
  }
  if (url.startsWith("/banners/") && url !== "/banners") {
    const id = url.replace("/banners/", "");
    return {
      data: mockBanners.find((item) => item.id === id) ?? mockBanners[0],
      message: "Mock banner",
    };
  }
  if (url.startsWith("/banners")) {
    return {
      data: { data: mockBanners, meta: { total: mockBanners.length, page: 1, limit: 50 } },
      message: "Mock banners",
    };
  }
  if (url.startsWith("/notifications")) {
    return { data: mockNotifications, message: "Mock notifications" };
  }

  return null;
}
