import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  AdminUser,
  AuthPayload,
  BannerRecord,
  BrandRecord,
  CategoryRecord,
  ContentsRecord,
  StorePrices,
  DealRecord,
  DealType,
  FaqRecord,
  NotificationRecord,
  SupportMessageRecord,
  OrderRecord,
  OverviewData,
  PaymentRecord,
  PrepRecord,
  PrepReviewStatus,
  ProductRecord,
  PromoCodeRecord,
} from "@/lib/types";
import { asList, baseQuery, type Envelope } from "./baseQuery";

type ListParams = {
  page?: number;
  limit?: number;
  searchTerm?: string;
  role?: string;
  status?: string;
  userId?: string;
  categoryId?: string;
  customerType?: string;
  isActive?: boolean | string;
  isFeatured?: boolean | string;
  type?: DealType | string;
  sort?: string;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: [
    "Auth",
    "Overview",
    "Users",
    "Products",
    "Categories",
    "Brands",
    "Orders",
    "Payments",
    "Prep",
    "Contents",
    "Notifications",
    "Banners",
    "Faqs",
    "SupportMessages",
    "PromoCodes",
    "Deals",
  ],
  endpoints: (build) => ({
    login: build.mutation<Envelope<AuthPayload>, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    forgotPassword: build.mutation<Envelope<unknown>, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "PATCH", body }),
    }),
    changePassword: build.mutation<
      Envelope<unknown>,
      { oldPassword: string; newPassword: string; confirmPassword: string }
    >({
      query: (body) => ({ url: "/auth/change-password", method: "PATCH", body }),
    }),
    getOverview: build.query<Envelope<OverviewData>, { year?: number } | void>({
      query: (params) => {
        const year = params?.year ?? new Date().getFullYear();
        return {
          url: "/dashboard/overview",
          params: { year },
        };
      },
      providesTags: (_result, _error, arg) => [
        "Overview",
        { type: "Overview", id: arg?.year ?? new Date().getFullYear() },
      ],
      keepUnusedDataFor: 30,
    }),
    getUsers: build.query<Envelope<{ data: AdminUser[]; meta?: { total?: number } }>, ListParams | void>({
      query: (params) => ({ url: "/users", params: params ?? { page: 1, limit: 10 } }),
      providesTags: ["Users"],
    }),
    getUser: build.query<Envelope<AdminUser>, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Users", id }],
    }),
    getMyProfile: build.query<Envelope<AdminUser>, void>({
      query: () => "/users/my-profile",
      providesTags: ["Auth"],
    }),
    updateMyProfile: build.mutation<Envelope<AdminUser>, Record<string, unknown> | FormData>({
      query: (body) => ({ url: "/users/update-my-profile", method: "PATCH", body }),
      invalidatesTags: ["Auth"],
    }),
    blockUser: build.mutation<Envelope<AdminUser>, { id: string; status: "active" | "blocked" }>({
      query: ({ id, status }) => ({
        url: `/users/${id}/block`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Users"],
    }),
    getProducts: build.query<Envelope<{ data: ProductRecord[]; meta?: { total?: number } }>, ListParams | void>({
      // DELETE /products/:id is a soft delete (isDeleted: true), and the backend returns deleted
      // products to admins unless asked not to, so always filter them out.
      query: (params) => ({
        url: "/products",
        params: { ...(params ?? { page: 1, limit: 10 }), isDeleted: false },
      }),
      providesTags: ["Products"],
    }),
    getProduct: build.query<Envelope<ProductRecord>, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Products", id }],
    }),
    createProduct: build.mutation<Envelope<ProductRecord>, Record<string, unknown> | FormData>({
      query: (body) => ({ url: "/products", method: "POST", body }),
      invalidatesTags: ["Products", "Overview"],
    }),
    updateProduct: build.mutation<
      Envelope<ProductRecord>,
      { id: string; body: Record<string, unknown> | FormData }
    >({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Products", "Overview"],
    }),
    deleteProduct: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Products", "Overview"],
    }),
    getCategories: build.query<Envelope<{ data: CategoryRecord[] }>, ListParams | void>({
      query: (params) => ({ url: "/categories", params: params ?? {} }),
      providesTags: ["Categories"],
    }),
    getCategory: build.query<Envelope<CategoryRecord>, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Categories", id }],
    }),
    createCategory: build.mutation<Envelope<CategoryRecord>, Record<string, unknown> | FormData>({
      query: (body) => ({ url: "/categories", method: "POST", body }),
      invalidatesTags: ["Categories"],
    }),
    updateCategory: build.mutation<
      Envelope<CategoryRecord>,
      { id: string; body: Record<string, unknown> | FormData }
    >({
      query: ({ id, body }) => ({ url: `/categories/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Categories"],
    }),
    deleteCategory: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["Categories"],
    }),
    getBrands: build.query<
      Envelope<{ data: BrandRecord[]; meta?: { total?: number } }>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/brands",
        params: params ?? { page: 1, limit: 100 },
      }),
      providesTags: ["Brands"],
    }),
    getBrand: build.query<Envelope<BrandRecord>, string>({
      query: (id) => `/brands/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Brands", id }],
    }),
    createBrand: build.mutation<Envelope<BrandRecord>, FormData>({
      query: (body) => ({ url: "/brands", method: "POST", body }),
      invalidatesTags: ["Brands"],
    }),
    updateBrand: build.mutation<Envelope<BrandRecord>, { id: string; body: FormData }>({
      query: ({ id, body }) => ({ url: `/brands/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Brands"],
    }),
    deleteBrand: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/brands/${id}`, method: "DELETE" }),
      invalidatesTags: ["Brands"],
    }),
    getOrders: build.query<Envelope<{ data: OrderRecord[] }>, ListParams | void>({
      query: (params) => ({ url: "/orders", params: params ?? { page: 1, limit: 10 } }),
      providesTags: [{ type: "Orders", id: "LIST" }],
    }),
    getOrder: build.query<Envelope<OrderRecord>, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Orders", id }],
    }),
    // The response is the full updated order, so the detail cache is replaced instead of refetched.
    // Lists and counts are refreshed; cancelling also changes payments and stock. On any error the
    // order and list refetch (e.g. another admin or the expiry job already cancelled it).
    updateOrderStatus: build.mutation<
      Envelope<OrderRecord>,
      { id: string; status: OrderRecord["status"] }
    >({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            api.util.updateQueryData("getOrder", id, (draft) => {
              draft.data = data.data;
              draft.message = data.message;
            }),
          );
        } catch {
          // Error is surfaced by the caller via unwrap().
        }
      },
      invalidatesTags: (result, error, { id, status }) => {
        if (error) return [{ type: "Orders", id }, { type: "Orders", id: "LIST" }];
        const userId = result?.data.user?.id;
        return [
          { type: "Orders", id: "LIST" },
          "Overview",
          ...(userId ? [{ type: "Users" as const, id: userId }] : []),
          ...(status === "cancelled" ? (["Payments", "Products"] as const) : []),
        ];
      },
    }),
    getPayments: build.query<Envelope<{ data: PaymentRecord[] }>, ListParams | void>({
      query: (params) => ({ url: "/payments", params: params ?? { page: 1, limit: 10 } }),
      providesTags: ["Payments"],
    }),
    getPayment: build.query<Envelope<PaymentRecord>, string>({
      query: (id) => `/payments/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Payments", id }],
    }),
    getPrepRequests: build.query<
      Envelope<{ data: PrepRecord[]; meta?: { page?: number; limit?: number; total?: number } }>,
      ListParams | void
    >({
      query: (params) => ({ url: "/prep-services", params: params ?? { page: 1, limit: 10 } }),
      providesTags: [{ type: "Prep", id: "LIST" }],
    }),
    getPrepRequest: build.query<Envelope<PrepRecord>, string>({
      query: (id) => `/prep-services/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Prep", id }],
    }),
    // Only valid while the request is `under_review`. On success the response is merged into the
    // detail cache (keeping `user` if the response omits it); on any error (e.g. 409, another admin
    // reviewed it first) the detail refetches.
    updatePrepStatus: build.mutation<
      Envelope<PrepRecord>,
      { id: string; status: PrepReviewStatus; adminNote?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/prep-services/${id}/status`,
        method: "PATCH",
        body,
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            api.util.updateQueryData("getPrepRequest", id, (draft) => {
              draft.data = { ...draft.data, ...data.data, user: data.data.user ?? draft.data.user };
              draft.message = data.message;
            }),
          );
        } catch {
          // Error is surfaced by the caller via unwrap().
        }
      },
      invalidatesTags: (_r, error, { id }) =>
        error
          ? [{ type: "Prep", id }, { type: "Prep", id: "LIST" }]
          : [{ type: "Prep", id: "LIST" }],
    }),
    getContents: build.query<Envelope<ContentsRecord>, string | void>({
      query: (key) => ({ url: "/contents", params: key ? { key } : undefined }),
      providesTags: ["Contents"],
    }),
    // Send only what changed. `prices` must hold numbers (strings are rejected); the text forms
    // never send it, so they can't overwrite prices. The response is the full contents record.
    updateContents: build.mutation<
      Envelope<ContentsRecord>,
      Partial<Omit<ContentsRecord, "prices">> & { prices?: Partial<StorePrices> }
    >({
      query: (body) => ({ url: "/contents", method: "PATCH", body }),
      invalidatesTags: ["Contents"],
    }),
    getNotifications: build.query<Envelope<NotificationRecord[]>, void>({
      query: () => "/notifications",
      providesTags: ["Notifications"],
    }),
    readNotifications: build.mutation<Envelope<unknown>, void>({
      query: () => ({ url: "/notifications", method: "PATCH" }),
      invalidatesTags: ["Notifications"],
    }),
    deleteNotifications: build.mutation<Envelope<unknown>, void>({
      query: () => ({ url: "/notifications", method: "DELETE" }),
      invalidatesTags: ["Notifications"],
    }),
    getBanners: build.query<
      Envelope<{ data: BannerRecord[]; meta?: { page?: number; limit?: number; total?: number } }>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/banners",
        params: params ?? { page: 1, limit: 50, sort: "-createdAt" },
      }),
      providesTags: ["Banners"],
    }),
    getHomepageBanners: build.query<
      Envelope<{ data: BannerRecord[]; meta?: { page?: number; limit?: number; total?: number } }>,
      { page?: number; limit?: number; sort?: string } | void
    >({
      query: (params) => ({
        url: "/banners/homepage",
        params: params ?? { page: 1, limit: 20, sort: "-createdAt" },
      }),
      providesTags: ["Banners"],
    }),
    getBanner: build.query<Envelope<BannerRecord>, string>({
      query: (id) => `/banners/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Banners", id }],
    }),
    createBanner: build.mutation<Envelope<BannerRecord>, FormData>({
      query: (body) => ({ url: "/banners", method: "POST", body }),
      invalidatesTags: ["Banners"],
    }),
    updateBanner: build.mutation<Envelope<BannerRecord>, { id: string; body: FormData }>({
      query: ({ id, body }) => ({ url: `/banners/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Banners"],
    }),
    deleteBanner: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/banners/${id}`, method: "DELETE" }),
      invalidatesTags: ["Banners"],
    }),
    // FAQs are site-wide and already sorted by `order`. Load them all in one request (reordering
    // needs the complete list); the backend's default page size is only 10.
    getFaqs: build.query<
      Envelope<{ data: FaqRecord[]; meta?: { page?: number; limit?: number; total?: number } }>,
      { limit: number } | void
    >({
      query: (params) => ({ url: "/faq", params: { limit: params?.limit ?? 500 } }),
      providesTags: ["Faqs"],
    }),
    createFaq: build.mutation<Envelope<FaqRecord>, { question: string; answer: string }>({
      query: (body) => ({ url: "/faq", method: "POST", body }),
      invalidatesTags: ["Faqs"],
    }),
    // Position can't change here: never send `order`.
    updateFaq: build.mutation<Envelope<FaqRecord>, { id: string; body: { question?: string; answer?: string } }>({
      query: ({ id, body }) => ({ url: `/faq/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Faqs"],
    }),
    deleteFaq: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/faq/${id}`, method: "DELETE" }),
      invalidatesTags: ["Faqs"],
    }),
    /**
     * Sends every FAQ id in the new display order. The list shows the new order at once; on
     * success it's replaced with the server's list, on failure it's put back and refetched.
     */
    reorderFaqs: build.mutation<Envelope<FaqRecord[]>, string[]>({
      query: (ids) => ({ url: "/faq/reorder", method: "PATCH", body: { ids } }),
      async onQueryStarted(ids, { dispatch, getState, queryFulfilled }) {
        const cachedArgs = api.util.selectCachedArgsForQuery(getState(), "getFaqs");
        const patches = cachedArgs.map((arg) =>
          dispatch(
            api.util.updateQueryData("getFaqs", arg, (draft) => {
              const items = draft.data?.data;
              if (!Array.isArray(items)) return;
              const byId = new Map(items.map((faq) => [faq.id, faq]));
              draft.data.data = ids.flatMap((id) => byId.get(id) ?? []);
            }),
          ),
        );
        try {
          const { data } = await queryFulfilled;
          if (!Array.isArray(data.data)) return;
          cachedArgs.forEach((arg) =>
            dispatch(
              api.util.updateQueryData("getFaqs", arg, (draft) => {
                draft.data = { data: data.data, meta: { ...draft.data?.meta, total: data.data.length } };
              }),
            ),
          );
        } catch {
          patches.forEach((patch) => patch.undo());
          dispatch(api.util.invalidateTags(["Faqs"]));
        }
      },
    }),
    getSupportMessages: build.query<
      Envelope<{ data: SupportMessageRecord[]; meta?: { total?: number } }>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/contact",
        params: params ?? { page: 1, limit: 20 },
      }),
      providesTags: ["SupportMessages"],
    }),
    getSupportMessage: build.query<Envelope<SupportMessageRecord>, string>({
      query: (id) => `/contact/${id}`,
      providesTags: (_r, _e, id) => [{ type: "SupportMessages", id }],
    }),
    replySupportMessage: build.mutation<
      Envelope<SupportMessageRecord>,
      { id: string; reply: string }
    >({
      query: ({ id, reply }) => ({
        url: `/contact/${id}/reply`,
        method: "PATCH",
        body: { reply },
      }),
      invalidatesTags: ["SupportMessages"],
    }),
    getPromoCodes: build.query<
      Envelope<{ data: PromoCodeRecord[]; meta?: { total?: number } }>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/promo-codes",
        params: params ?? { page: 1, limit: 100 },
      }),
      providesTags: ["PromoCodes"],
    }),
    getPromoCode: build.query<Envelope<PromoCodeRecord>, string>({
      query: (id) => `/promo-codes/${id}`,
      providesTags: (_r, _e, id) => [{ type: "PromoCodes", id }],
    }),
    createPromoCode: build.mutation<Envelope<PromoCodeRecord>, Record<string, unknown>>({
      query: (body) => ({ url: "/promo-codes", method: "POST", body }),
      invalidatesTags: ["PromoCodes"],
    }),
    updatePromoCode: build.mutation<
      Envelope<PromoCodeRecord>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/promo-codes/${id}`, method: "PATCH", body }),
      invalidatesTags: ["PromoCodes"],
    }),
    deletePromoCode: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/promo-codes/${id}`, method: "DELETE" }),
      invalidatesTags: ["PromoCodes"],
    }),
    getDeals: build.query<
      Envelope<{ data: DealRecord[]; meta?: { page?: number; limit?: number; total?: number } }>,
      ListParams | void
    >({
      query: (params) => ({
        url: "/deals",
        params: params ?? { page: 1, limit: 20 },
      }),
      providesTags: ["Deals"],
    }),
    getDeal: build.query<Envelope<DealRecord>, string>({
      query: (id) => `/deals/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Deals", id }],
    }),
    createDeal: build.mutation<Envelope<DealRecord>, Record<string, unknown>>({
      query: (body) => ({ url: "/deals", method: "POST", body }),
      invalidatesTags: ["Deals", "Products"],
    }),
    updateDeal: build.mutation<
      Envelope<DealRecord>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({ url: `/deals/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Deals", "Products"],
    }),
    deleteDeal: build.mutation<Envelope<unknown>, string>({
      query: (id) => ({ url: `/deals/${id}`, method: "DELETE" }),
      invalidatesTags: ["Deals", "Products"],
    }),
  }),
});

export const {
  useLoginMutation,
  useForgotPasswordMutation,
  useChangePasswordMutation,
  useGetOverviewQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useBlockUserMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetBrandsQuery,
  useGetBrandQuery,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useGetPaymentsQuery,
  useGetPaymentQuery,
  useGetPrepRequestsQuery,
  useGetPrepRequestQuery,
  useUpdatePrepStatusMutation,
  useGetContentsQuery,
  useUpdateContentsMutation,
  useGetNotificationsQuery,
  useReadNotificationsMutation,
  useDeleteNotificationsMutation,
  useGetBannersQuery,
  useGetHomepageBannersQuery,
  useGetBannerQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  useReorderFaqsMutation,
  useGetSupportMessagesQuery,
  useGetSupportMessageQuery,
  useReplySupportMessageMutation,
  useGetPromoCodesQuery,
  useGetPromoCodeQuery,
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
  useDeletePromoCodeMutation,
  useGetDealsQuery,
  useGetDealQuery,
  useCreateDealMutation,
  useUpdateDealMutation,
  useDeleteDealMutation,
} = api;

export { asList };
