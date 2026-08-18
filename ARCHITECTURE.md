# Architecture — Shatadal PujoPay

## Overview

Two connected experiences in one Next.js 16 application:

1. **Public Website** — Cultural Durga Puja site, no login required
2. **PujoPay** — Authenticated payment collection management system

---

## Folder Structure

```
src/
├── app/
│   ├── (public)/           Public website routes (layout: header + footer)
│   │   ├── page.tsx        Home
│   │   ├── about/
│   │   ├── puja/
│   │   ├── events/
│   │   ├── gallery/
│   │   ├── committee/
│   │   └── contact/
│   ├── (app)/              Authenticated app (AuthGuard + sidebar)
│   │   ├── dashboard/      Admin/Executive dashboard (protected)
│   │   ├── collect/        Payment initiation form (all roles)
│   │   ├── my-collections/ Collector's own payments
│   │   ├── payments/       All payments (admin/executive)
│   │   ├── profile/
│   │   ├── admin/
│   │   │   ├── users/      User management (admin only)
│   │   │   └── config/     App configuration (admin only)
│   │   └── forbidden/
│   ├── login/              Public login page
│   ├── not-found.tsx
│   ├── layout.tsx          Root layout (fonts, AuthProvider, Toaster)
│   └── globals.css         Brand palette + Tailwind v4 tokens
├── components/
│   ├── ui/                 shadcn/ui primitives (Radix-based)
│   ├── shared/             StatusBadge, ActiveBadge
│   ├── public/             SiteHeader, SiteFooter, CountdownTimer, SectionHeading
│   ├── dashboard/          AppSidebar, StatCard, PageHeader
│   ├── forms/              (reserved for extracted form components)
│   ├── tables/             (reserved for extracted table components)
│   └── charts/             (reserved for extracted chart components)
├── config/
│   ├── site.ts             Club name, puja dates, contact, social, SEO
│   ├── roles.ts            Role definitions, hasPermission(), can(), hasRole()
│   ├── navigation.ts       Public nav + getDashboardNav(role)
│   └── api.ts              API endpoints config
├── lib/
│   ├── api/
│   │   ├── client.ts       Axios instance with auth interceptor + error normalizer
│   │   ├── auth.ts         login(), logout(), getMe()
│   │   ├── users.ts        getUsers(), createUser(), updateUser(), deactivateUser()
│   │   ├── payments.ts     initiatePayment(), getPaymentReceipt()
│   │   ├── collector.ts    getCollectorSummary(), getCollectorPayments()
│   │   ├── dashboard.ts    getDashboardSummary/Collectors/Payments()
│   │   └── admin.ts        getAdminConfig(), updateAdminConfig()
│   ├── auth/
│   │   ├── auth-provider.tsx  AuthContext, AuthProvider, useAuth()
│   │   ├── auth-guard.tsx     Redirect unauthenticated users to /login
│   │   └── role-guard.tsx     Block by permission or role
│   └── storage/
│       └── index.ts        saveAuth(), clearAuth(), getStoredToken/User()
├── types/index.ts          All TypeScript types (User, Payment, etc.)
├── constants/index.ts      TOKEN_KEY, PAYMENT_METHODS, PAGE_SIZE
└── schemas/                (Zod schemas, currently inline in pages)
```

---

## Auth Flow

1. User visits `/login`, submits email+password
2. `POST /api/auth/login` → returns `{ accessToken, user }`
3. Token + user stored in localStorage via `lib/storage`
4. `AuthProvider` reads token on mount; if a cached user exists, serves them immediately (optimistic); always calls `GET /api/auth/me` to validate server-side
5. `AuthGuard` wraps all `(app)` routes — redirects to `/login?from=<path>` if not authenticated, preserving the intended destination
6. `LoginPage` redirects already-authenticated users away to their default route (or to the `?from=` destination)
7. After successful login, `onSubmit` redirects to `?from=` if present and valid, otherwise to `getDefaultRoute(role)`
8. `RoleGuard` enforces permission checks for specific pages — unauthorized users are redirected to `/forbidden` (not `/login`)
9. 401 responses from the API (except login) trigger `clearAuth()` + `window.location.replace('/login')` in the Axios interceptor

---

## Permission System

Defined in `config/roles.ts`:

| Role | Permissions |
|---|---|
| `admin` | All permissions |
| `executive` | payment.initiate, collector.view_own, dashboard.view |
| `committee` | payment.initiate, collector.view_own |
| `general` | payment.initiate |

API: `hasPermission(role, permission)`, `can(role, permission)`, `hasRole(role, requiredRole)`

---

## Route Access Matrix

> **Legend:** ✅ Allowed · 🔒 Redirect to `/login?from=<path>` · 🚫 Redirect to `/forbidden` · 🌐 Public

| Route | Logged out | admin | executive | committee | general |
|-------|-----------|-------|-----------|-----------|---------|
| `/` | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/about` `/puja` `/events` etc. | 🌐 | 🌐 | 🌐 | 🌐 | 🌐 |
| `/login` | 🌐 | ✅ (redirects to default) | ✅ (redirects to default) | ✅ (redirects to default) | ✅ (redirects to default) |
| `/dashboard` | 🔒 | ✅ | ✅ | 🚫 | 🚫 |
| `/collect` | 🔒 | ✅ | ✅ | ✅ | ✅ |
| `/my-collections` | 🔒 | ✅ | ✅ | ✅ | 🚫 |
| `/payments` | 🔒 | ✅ | ✅ | 🚫 | 🚫 |
| `/profile` | 🔒 | ✅ | ✅ | ✅ | ✅ |
| `/admin/users` | 🔒 | ✅ | 🚫 | 🚫 | 🚫 |
| `/admin/config` | 🔒 | ✅ | 🚫 | 🚫 | 🚫 |
| `/forbidden` | 🔒 | ✅ | ✅ | ✅ | ✅ |

### Default post-login route

| Role | Lands on |
|------|----------|
| admin | `/dashboard` |
| executive | `/dashboard` |
| committee | `/collect` |
| general | `/collect` |

---

## Payment Flow

Frontend responsibility is ONLY steps 1–3:

1. Collector fills payment form (`/collect`)
2. `POST /api/payment/initiate` → gets `{ nextUrl }`
3. Frontend does `window.location.href = backendBaseUrl + nextUrl`
4. Backend serves QR page or Cash confirm page (HTML, not frontend)
5. Donor pays (backend handles confirmation)
6. Receipt PDF auto-generated by backend
7. Frontend can link to `/receipt/<receipt_no>` (backend-served PDF)

---

## API Layer

Single Axios instance (`lib/api/client.ts`) handles:
- Bearer token injection
- 401 detection (session expired)
- Error normalization into `ApiError { status, message }`
- Network error handling

UI components call semantic functions (e.g. `initiatePayment()`) not raw Axios.

---

## Design System

Brand palette (oklch):
- `--brand-orange`: `oklch(0.638 0.211 35.2)` — #F05A22
- `--brand-navy`: `oklch(0.23 0.092 264.5)` — #1B2A6B
- `--brand-pink`: `oklch(0.73 0.17 350)` — lotus pink
- `--brand-green`: `oklch(0.55 0.11 138)` — leaf green

shadcn `--primary` mapped to brand orange.
Sidebar uses deep navy background.
Tailwind v4 `@theme inline` exposes tokens as `bg-brand-orange`, `text-brand-navy` etc.

---

## Storage Strategy

- `localStorage` stores JWT token and cached user for fast startup
- `getMe()` always validates on mount (evicts stale tokens)
- No sensitive data other than the JWT itself in storage
