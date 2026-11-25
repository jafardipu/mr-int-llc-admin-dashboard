# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Admin dashboard for MR International LLC's e-commerce platform (retail + wholesale storefront, 3PL prep services). This repo is **frontend only**: Next.js 15 App Router + React 19 + Redux Toolkit / RTK Query + Tailwind CSS v4. The REST API is a separate service, not in this repo. The README is unmodified create-next-app boilerplate; ignore its port (the app runs on **3001**).

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml`).

```bash
pnpm dev          # next dev --turbopack on http://localhost:3001
pnpm build        # next build --turbopack
pnpm start        # serve the production build on :3001
pnpm lint         # eslint (flat config: next/core-web-vitals + next/typescript)
npx tsc --noEmit  # type-check (no script for this; `next build` also type-checks)
npx eslint src/components/brand-form.tsx   # lint a single file
```

There is **no test suite**. Verify changes with `npx tsc --noEmit`, lint, and running the app.

**pnpm build approvals:** pnpm 11 checks dependencies before every script and install. It fails with `ERR_PNPM_IGNORED_BUILDS` when a dependency has a build script that isn't listed under `allowBuilds` in `pnpm-workspace.yaml` (currently `unrs-resolver: false`). When a new one appears, add it with `true` or `false`.

Don't run `pnpm build` while `pnpm dev` is running: both write to `.next`.

## Environment and backend wiring

`.env` (gitignored) sets:
- `NEXT_PUBLIC_API_URL`: RTK Query base URL. Defaults to `/api/v1` (same-origin, proxied).
- `API_INTERNAL_URL`: backend origin for the Next.js rewrites in [next.config.ts](next.config.ts). Defaults to `http://127.0.0.1:5000`.
- `NEXT_PUBLIC_USE_MOCKS=true`: optional. Enables the mock fallback described below.

Rewrites in `next.config.ts`:
- `/api/v1/*` → `${API_INTERNAL_URL}/api/v1/*`
- `/api/media/*` → `${API_INTERNAL_URL}/*`

The backend returns upload URLs pointing at `localhost`/`127.0.0.1`. `mediaUrl()` in [src/lib/format.ts](src/lib/format.ts) rewrites those to `/api/media/...` so they load through the proxy. Images are usually rendered with `next/image` and the `unoptimized` prop.

## Architecture

### Rendering model
The app is effectively a **client-side SPA** on the App Router. Pages and stateful components are `"use client"`. Data is fetched only through RTK Query hooks, never in server components. There are no server actions, route handlers or `middleware.ts`. Auth is enforced client-side.

### Routing and shell
- `src/app/(dashboard)/` is a route group. Its layout wraps every page in `AdminShell` (`AuthGuard` + `Sidebar` + `Topbar`).
- `/login` and `/forgot-password` sit outside the group and are not guarded.
- The sidebar navigation is a hard-coded `nav`/`settings` array in [src/components/sidebar.tsx](src/components/sidebar.tsx). A new top-level page needs an entry there.

### Auth flow
- [src/lib/auth.ts](src/lib/auth.ts) stores the access token, refresh token and user JSON in `localStorage` (`mr_admin_*` keys).
- `StoreProvider` dispatches `hydrateAuth()` on mount to copy them into `authSlice`. Until that runs, `auth.hydrated` is `false`. `AuthGuard` and the login page wait for `hydrated` before redirecting.
- Only roles `admin` and `supper_admin` may log in (`isAdminRole`). **`supper_admin` is spelled that way on the backend; do not "fix" it.**
- **Token refresh** happens in [src/store/authProxy.ts](src/store/authProxy.ts), which `baseQuery` runs on every request (GET and mutations alike).
  - When the access token expires within 24 hours, it refreshes before the request, and again on app start.
  - On a 401 "unauthorized" or "you are not authorized!", it calls `POST /auth/refresh-token` (JSON body, `credentials: "omit"`) and retries the request exactly once.
  - Only one refresh runs at a time, also across tabs (Web Locks). Other tabs follow through the `storage` event.
  - Any error from the refresh endpoint, a missing refresh token, or a blocked/deleted/unverified account logs the admin out. `endSession()` stores the reason for the login page, the store resets the API cache on `logout`, and AuthGuard redirects to /login.
  - A network error keeps the tokens.
  - 401 "You are not authorized" (role) shows "You don't have permission for this" and does not log out.
  - Backend messages are compared exactly.
  - It can't be a Next.js middleware/proxy, because the tokens are in localStorage.

### Data layer (RTK Query)
All endpoints live in one `createApi` in [src/store/api.ts](src/store/api.ts). The custom `baseQuery` in [src/store/baseQuery.ts](src/store/baseQuery.ts) works like this:
- The backend wraps every response as `{ success, message, data, meta }`. `baseQuery` reshapes it to `Envelope<T> = { data, meta, message }`. A body with `success: false` becomes `{ error: { status: 400, data: body } }`. Error bodies look like `{ success: false, message, errorSources: [{ path, message }] }`. Use `apiErrorMessage()` from [src/lib/api-error.ts](src/lib/api-error.ts) to get the text: for "Validation Error" it shows `errorSources[0].message`. Older components read `err.data.message` inline.
- List endpoints return a **nested** payload: the hook's `data.data` is itself `{ data: T[], meta }` (sometimes a bare array). Always normalize it with `asList<T>(data?.data)`, which returns `{ items, total }`.
- Cache invalidation uses tag types per resource. Mutations that change dashboard numbers also invalidate `"Overview"`, and deal mutations also invalidate `"Products"`. Follow the same rule for new mutations.
- To add an endpoint:
  1. Add its tag to `tagTypes` if it is a new resource.
  2. Define the endpoint with `providesTags` / `invalidatesTags`.
  3. Add the generated hook to the destructured export list at the bottom of `api.ts`.
  4. If it is a GET, add a branch to `mockFallback`.

### Mock fallback
When `NEXT_PUBLIC_USE_MOCKS=true`, a **failed GET** (network error or `success: false`) falls back to [src/store/mockFallback.ts](src/store/mockFallback.ts), which serves fixtures from [src/lib/mocks.ts](src/lib/mocks.ts). Routing is a chain of `url.startsWith` checks, so **order matters**:
- specific sub-routes (`/deals/weekly`, `/banners/homepage`) must come before `/x/:id`;
- `/x/:id` must come before the `/x` list route.

Mock list responses must use the same nested `{ data: { data, meta } }` shape as the real API.

### Uploads (multipart convention)
Create and update calls for entities with files (products, categories, brands, banners, profile) send `FormData`:
- a `data` field containing `JSON.stringify(payload)`;
- the file parts: `image`, or `images` for product galleries.

When the user keeps an existing image, its URL goes in the JSON payload instead of a file. See [src/components/brand-form.tsx](src/components/brand-form.tsx) for the reference pattern. FAQs, promo codes and deals send plain JSON.

### Page and form patterns
- **List pages** (`(dashboard)/<resource>/page.tsx`) are built from `PageHeader`, `Toolbar`/`FilterTabs` ([src/components/ui.tsx](src/components/ui.tsx)), `TableCard`/`Table`/`THead`/`Pagination` ([src/components/data-table.tsx](src/components/data-table.tsx)) and `TableActions`. Several of them fetch with a large `limit` and do search and pagination client-side.
- **Forms** are `src/components/<entity>-form.tsx`. Each takes an optional `id` (edit mode: it fetches with `{ skip: !id }` and fills state in a `useEffect`) and an `onDone` callback. They are rendered inside the `Modal` from `ui.tsx` or on full pages (products).
- **Form validation (products):** [src/lib/product-schema.ts](src/lib/product-schema.ts) is a Zod schema mirroring the backend's `product.validation.ts`, plus a few stricter checks. Keep the two in sync.
  - Its parsed output is the JSON payload that gets sent.
  - A field's message appears under it once the field is blurred or after the first submit.
  - Backend validation errors, a duplicate SKU (409) and a missing brand or category (404) are mapped onto fields with `apiFieldErrors` from `api-error.ts`.
  - The other forms still rely on native `required` attributes.
- **Banners (carousel):** each banner targets one product or one category (`targetType` + `productId`/`categoryId`), and can have an optional `discountPercent` with whole-day UTC offer dates. The rules and date helpers are in [src/lib/banner-schema.ts](src/lib/banner-schema.ts).
  - The backend applies the discount to prices: higher banner % wins, the lower of the deal and banner price wins, and the % is taken off the retail or wholesale price.
  - The admin only stores and previews it.
  - The old free-text `link` exists only on legacy banners.
- **FAQs** are site-wide (no category) and ordered by `order`. The backend rejects `categoryId`/`include` with a 400.
  - The page loads all FAQs in one request (`limit` 500) and never re-sorts them.
  - Positions are shown as index + 1, because `order` can have gaps.
  - Reordering uses dnd-kit (`@dnd-kit/core` + `sortable`) plus Move up/down buttons. It sends every id to `PATCH /faq/reorder`.
  - `reorderFaqs` updates the cache before the response arrives, replaces the list with the response, and undoes the change and refetches on failure.
- **Store pricing** (`/settings/pricing`) edits `contents.prices` (`shippingFee`, `taxRate`, `wholesaleAccountFee`).
  - It sends `PATCH /contents { prices }` with numbers only, and only the changed fields.
  - The rules and backend error messages are in [src/lib/pricing.ts](src/lib/pricing.ts).
  - Saving a wholesale fee of 0 unlocks unpaid wholesale accounts for good, so the page asks for confirmation first.
  - The text-content pages send only their own field, never `prices`.
- **Terms and privacy** pages share `ContentSettings`, keyed by the `field` prop (`termsAndCondition` / `privacyPolicy`).
- **Toasts:** `toast.success()` / `toast.error()` from [src/components/toast.tsx](src/components/toast.tsx). The `<Toaster />` is mounted in `AdminShell`.
- **Delete confirmation:** `ConfirmDeleteAction` ([src/components/confirm-delete-action.tsx](src/components/confirm-delete-action.tsx)) wraps a delete button in an antd Popconfirm. Keep antd imports out of `table-actions.tsx`: every list page imports that file, so antd would be added to all of them.
- **Row menus:** `RowMenu` ([src/components/row-menu.tsx](src/components/row-menu.tsx)) gives a "⋯" menu of row actions. It is portalled so the table's overflow doesn't clip it.
- **Order status changes are forward-only.** The allowed actions are defined in [src/lib/orders.ts](src/lib/orders.ts) and `OrderStatusDialog` is shared by the order list and details pages. Never offer `pending` → `processing`: only a Stripe payment does that.
- **Order invoices** are PDFs built in the browser with `@react-pdf/renderer` (version pinned) in [src/components/invoice/](src/components/invoice/).
  - `invoice-pdf.tsx` is a copy of the storefront's (`mr-int-llc-frontend`) `InvoicePdf.tsx`. Keep the two in sync.
  - It is imported only on click by `download-invoice-button.tsx`, so the renderer stays out of the page bundle.
  - `invoice-order.ts` maps `OrderRecord` to the shape the PDF expects.
- **Domain types** mirroring the backend are in [src/lib/types.ts](src/lib/types.ts). **Display formatters** (`money`, `prettyDate`, `titleCase`, `timeAgo`, `mediaUrl`, ...) are in [src/lib/format.ts](src/lib/format.ts).

### Styling
- Tailwind v4 with no `tailwind.config`. Design tokens are defined in `@theme inline` in [src/app/globals.css](src/app/globals.css): `brand`, `brand-dark`, `ink`, `muted`, `label`, `slate`, `line`, `line-soft`, `input`, `page`, `sidebar`, and `success`/`warning`/`danger` each with a `-bg` variant. Use these token classes (`text-ink`, `bg-brand`, `border-line-soft`) rather than raw hex values where a token exists.
- Icons are hand-written SVG components in [src/components/icons.tsx](src/components/icons.tsx). There is no icon library.
- Charts use Recharts, in [src/components/charts.tsx](src/components/charts.tsx).
- **antd is used only for `YearPicker`** (`DatePicker`), styled with `!important` overrides in `globals.css`. Everything else is custom Tailwind markup.
- Font is Plus Jakarta Sans, loaded through `next/font` as `--font-jakarta`.
- Path alias: `@/*` → `src/*`.
