# API Coverage — PujoPay Frontend

Audit against `README_Apis.md`. Verified that each "Implemented" entry has a real API call → response → state → UI path, not merely an API function that exists.

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Implemented | API called, response consumed, state updated, UI rendered, error handled |
| ⚠️ Partial | API function exists and is called, but coverage has gaps noted below |
| 🚫 Not implemented | No frontend screen or call |
| 🔒 Backend-rendered | Intentionally not re-implemented — backend serves full HTML page |

---

## 1. Auth — `/api/auth`

| Endpoint | Status | Screen / File |
|----------|--------|--------------|
| `POST /api/auth/login` | ✅ Implemented | `src/app/login/page.tsx` — form with error handling, redirects by role via `getDefaultRoute()` |
| `POST /api/auth/logout` | ✅ Implemented | `src/lib/api/auth.ts → logout()`, called in `AppSidebar` via `useAuth().logout()` |
| `GET /api/auth/me` | ✅ Implemented | `src/lib/api/auth.ts → getMe()`, called on app mount in `auth-provider.tsx` to rehydrate session |

---

## 2. Users — `/api/users`

> Requires role: `admin`

| Endpoint | Status | Screen / File |
|----------|--------|--------------|
| `GET /api/users/` | ✅ Implemented | `src/app/(app)/admin/users/page.tsx` — table with name, email, role, status, phone |
| `POST /api/users/` | ✅ Implemented | Same page — "Add User" modal with full validation (react-hook-form + zod), 409 conflict handled |
| `GET /api/users/<id>` | 🚫 Not implemented | Function exists in `users.ts` but no screen consumes it. Not required by any current UI flow. |
| `PATCH /api/users/<id>` | ✅ Implemented | Same page — "Edit" modal with name, phone, whatsApp, UPI ID, role, optional password reset |
| `DELETE /api/users/<id>` | ✅ Implemented | Same page — "Deactivate" button with confirmation dialog; own account protected |

---

## 3. Admin Config — `/api/admin`

> Requires role: `admin`

| Endpoint | Status | Screen / File |
|----------|--------|--------------|
| `GET /api/admin/config` | ✅ Implemented | `src/app/(app)/admin/config/page.tsx` — loads current UPI ID and org name on mount |
| `POST /api/admin/config` | ✅ Implemented | Same page — form saves updated values, shows success toast |

---

## 4. Payment — `/api/payment`

| Endpoint | Status | Screen / File |
|----------|--------|--------------|
| `POST /api/payment/initiate` | ✅ Implemented | `src/app/(app)/collect/page.tsx` — donor form (name, phone, address, notes, amount, method), reads `nextUrl` from response, redirects browser immediately |
| `GET /api/payment/receipt/<id>` | ⚠️ Partial | Function `getPaymentReceipt(id)` exists in `src/lib/api/payments.ts` but no screen calls it. Shareable receipt link (`/receipt/<no>`) is backend-served. Not required for current UX flow. |

---

## 5. Backend-Rendered Pages — `/pay/` and `/receipt/`

These pages are served as full HTML by the Flask backend. The frontend correctly does **not** re-implement them.

| URL | Status | Notes |
|-----|--------|-------|
| `GET /pay/qr/<id>` | 🔒 Backend-rendered | Frontend redirects to `nextUrl` from `POST /api/payment/initiate` |
| `POST /pay/qr/<id>/confirm` | 🔒 Backend-rendered | Submitted by QR page form automatically |
| `GET /pay/cash/<id>` | 🔒 Backend-rendered | Frontend redirects to `nextUrl` from `POST /api/payment/initiate` |
| `POST /pay/cash/<id>/confirm` | 🔒 Backend-rendered | Submitted by cash page form automatically |
| `GET /pay/receipt/<id>` | 🔒 Backend-rendered | Backend redirects here after confirmation |
| `GET /receipt/<receipt_no>` | 🔒 Backend-rendered | PDF streamed by backend; shareable WhatsApp link |

---

## 6. Collector — `/api/collector`

> Requires permission: `collector.view_own`

| Endpoint | Status | Screen / File |
|----------|--------|--------------|
| `GET /api/collector/summary` | ✅ Implemented | `src/app/(app)/my-collections/page.tsx` — cash/UPI/grand totals with confirmed count |
| `GET /api/collector/payments` | ✅ Implemented | Same page — paginated list with method + date filters |

---

## 7. Dashboard — `/api/dashboard`

> Requires permission: `dashboard.view` (admin, executive)

| Endpoint | Status | Screen / File |
|----------|--------|--------------|
| `GET /api/dashboard/summary` | ✅ Implemented | `src/app/(app)/dashboard/page.tsx` — grand totals, confirmed + pending counts, donor count |
| `GET /api/dashboard/collectors` | ✅ Implemented | Same page — per-collector breakdown table |
| `GET /api/dashboard/payments` | ✅ Implemented | Same page (recent payments) + `src/app/(app)/payments/page.tsx` (full paginated list with method/status/date filters) |

---

## Summary

| Category | Total endpoints | ✅ | ⚠️ | 🚫 | 🔒 |
|----------|----------------|---|---|---|---|
| Auth | 3 | 3 | 0 | 0 | 0 |
| Users | 5 | 4 | 0 | 1 | 0 |
| Admin Config | 2 | 2 | 0 | 0 | 0 |
| Payment | 2 | 1 | 1 | 0 | 0 |
| Backend pages | 6 | 0 | 0 | 0 | 6 |
| Collector | 2 | 2 | 0 | 0 | 0 |
| Dashboard | 3 | 3 | 0 | 0 | 0 |
| **Total** | **23** | **15** | **1** | **1** | **6** |

### Notes on gaps

- **`GET /api/users/<id>`** — not required. The users list page shows all fields inline; individual lookup is only needed if a detail modal were added, which is not in scope.
- **`GET /api/payment/receipt/<id>`** — not required. Receipt viewing is handled by the backend's HTML receipt page and shareable PDF URL. The JSON receipt endpoint exists for potential future use (e.g. a receipt drawer) but has no current UI entrypoint.
