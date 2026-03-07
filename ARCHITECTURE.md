# SwiftBudget — Technical Architecture Report

**Version:** 1.0  
**Date:** March 7, 2026  
**Author:** Keith Paul  

---

## 1. Executive Summary

SwiftBudget is a full-stack personal finance application built with Next.js 16 and Supabase. It enables users to track income and expenses, set budget goals, organize spending by project, and visualize financial data through interactive charts. The application was migrated from a Python/Flask monolith to a modern React-based architecture, resulting in improved performance, security, and user experience.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js | 16.1.6 | Full-stack React framework (App Router) |
| **UI Library** | React | 19.2.3 | Component-based UI |
| **Language** | TypeScript | 5.x | Type-safe JavaScript |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **Components** | shadcn/ui | 4.0 | Pre-built accessible UI components |
| **Backend/DB** | Supabase | 2.98.0 | Auth, PostgreSQL database, storage |
| **Charts** | Recharts | 3.8.0 | Data visualization |
| **Icons** | Lucide React | 0.577.0 | SVG icon library |
| **Date Utils** | date-fns | 4.1.0 | Date formatting and manipulation |
| **Email** | EmailJS | 4.4.1 | Contact form email delivery (server-side) |
| **Notifications** | Sonner | 2.0.7 | Toast notifications |
| **Testing** | Vitest | 4.0.18 | Unit testing framework |
| **Deployment** | Netlify | — | Hosting with Next.js plugin |

---

## 3. System Architecture

### 3.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   React UI   │  │  shadcn/ui   │  │   Recharts    │  │
│  │  Components  │  │  Components  │  │    Charts     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
│                    ┌───────▼───────┐                     │
│                    │   useAuth()   │                     │
│                    │  Custom Hook  │                     │
│                    └───────┬───────┘                     │
└────────────────────────────┼─────────────────────────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │   Next.js 16    │
                    │   App Router    │
                    │  ┌───────────┐  │
                    │  │ Middleware │  │  ← Session refresh + route protection
                    │  └─────┬─────┘  │
                    │  ┌─────▼─────┐  │
                    │  │ API Routes│  │  ← /api/contact (server-side)
                    │  └───────────┘  │
                    └────────┬────────┘
                             │
               ┌─────────────┼─────────────┐
               │             │             │
      ┌────────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
      │  Supabase Auth │ │Supabase│ │  Supabase   │
      │  (JWT + RLS)   │ │   DB   │ │   Storage   │
      └────────────────┘ └────────┘ └─────────────┘
                         PostgreSQL    Avatars Bucket
```

### 3.2 Application Layers

**Presentation Layer** — React client components with shadcn/ui  
**State Management** — React `useState` + `useEffect` hooks (no external state library)  
**Authentication Layer** — Supabase Auth with JWT tokens, managed via `useAuth` hook  
**Middleware Layer** — Next.js middleware for session refresh and route protection  
**API Layer** — Server-side API routes (contact form with rate limiting)  
**Data Layer** — Supabase PostgreSQL with Row Level Security (RLS)  
**Storage Layer** — Supabase Storage for profile image uploads  

### 3.3 Client-Server Boundary

| Context | Supabase Client | Use Case |
|---------|----------------|----------|
| **Browser** | `createBrowserClient()` via `src/lib/supabase.ts` | All client components, auth state, CRUD |
| **Server Components** | `createServerClient()` via `src/lib/supabase-server.ts` | Server-side data fetching |
| **Middleware** | `createServerClient()` inline | Session refresh, route guards |

---

## 4. Database Architecture

### 4.1 Entity-Relationship Diagram

```
  auth.users (Supabase)
       │
       │ 1:1
       ▼
  ┌──────────┐
  │ profiles  │
  └──────────┘
       │
       │ 1:N
       ▼
  ┌──────────────┐     ┌────────────┐     ┌──────────┐
  │ transactions │────▶│ categories │     │ projects │
  │              │ N:1 │            │     │          │
  │              │────────────────────────▶│          │
  └──────────────┘ N:1 └────────────┘     └──────────┘
                              │
                              │ 1:N
                              ▼
                       ┌──────────────┐
                       │ budget_goals │
                       └──────────────┘

  ┌─────────────────────────┐     ┌────────────┐
  │ recurring_transactions  │     │ audit_logs │
  │ (schema only — future)  │     │            │
  └─────────────────────────┘     └────────────┘
```

### 4.2 Tables

| Table | Rows (Approx) | RLS | Purpose |
|-------|--------------|-----|---------|
| `profiles` | 1 per user | ✅ | User profile data (username, avatar, preferences) |
| `categories` | 17 defaults + custom | ✅ | Income/expense categorization |
| `transactions` | Unlimited | ✅ | Financial records with soft delete support |
| `budget_goals` | Per user | ✅ | Spending limits by category and period |
| `projects` | Per user | ✅ | Transaction grouping by project/purpose |
| `recurring_transactions` | — | ✅ | Schema exists, UI not yet implemented |
| `audit_logs` | Per user | ✅ | CRUD action logging for auditability |

### 4.3 Key Database Features

- **Row Level Security (RLS):** All 7 tables have per-user isolation policies using `auth.uid()`.
- **Check Constraints:** Amounts must be > 0, types constrained to 'income'/'expense', thresholds 1–100.
- **Foreign Keys:** Cascade delete from `auth.users`, FK relationships between transactions → categories/projects.
- **Triggers:** Auto-create profile on signup (`handle_new_user`), auto-update `updated_at` on transactions.
- **Default Data:** 17 pre-seeded categories (6 income + 11 expense) accessible to all users.

---

## 5. Security Architecture

### 5.1 Authentication

- **Provider:** Supabase Auth (email/password)
- **Session Management:** JWT tokens stored in HTTP-only cookies, refreshed on every request by middleware
- **Password Policy:** Minimum 8 characters, 1 uppercase, 1 lowercase, 1 number
- **Password Reset:** Full flow via Supabase `resetPasswordForEmail` → email link → `/reset-password` page
- **Session Timeout:** Auto-logout after 30 minutes of inactivity (mouse, keyboard, scroll, click events)

### 5.2 Authorization

- **Route Protection:** Next.js middleware redirects unauthenticated users from protected routes
- **Data Isolation:** RLS policies on every table ensure users can only access their own data
- **Default Categories:** Shared via `is_default = TRUE` policy, cannot be edited/deleted by users

### 5.3 Security Headers

Configured in `next.config.ts` for all routes:

| Header | Value | Purpose |
|--------|-------|---------|
| X-Frame-Options | DENY | Prevents clickjacking |
| X-Content-Type-Options | nosniff | Prevents MIME sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer leakage |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Blocks device access |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | Enforces HTTPS |
| Content-Security-Policy | (detailed policy) | Controls resource loading |
| X-DNS-Prefetch-Control | on | Performance optimization |

### 5.4 Rate Limiting

- **Server-side (API):** Contact form limited to 3 requests/minute per IP
- **Client-side (Login):** Locked after 5 failed attempts for 60 seconds

### 5.5 Data Protection

- **Soft Deletes:** Transactions use `is_deleted` flag for recoverability
- **Audit Logging:** All create/update/delete operations logged to `audit_logs` table
- **Input Validation:** Client-side validation on all forms (amounts, dates, names, thresholds)
- **File Upload:** Profile images validated for type (`image/*`) and size (max 2MB)

---

## 6. Application Structure

### 6.1 Directory Layout

```
swiftbudget/
├── public/                     # Static assets
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Full database schema
│   └── storage-setup.md        # Storage bucket setup guide
├── src/
│   ├── __tests__/              # Unit tests (Vitest)
│   │   ├── audit.test.ts
│   │   ├── constants.test.ts
│   │   ├── formatCurrency.test.ts
│   │   └── setup.ts
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/contact/        # Server-side API route
│   │   ├── budget-goals/       # Budget goal management
│   │   ├── categories/         # Category management
│   │   ├── contact/            # Contact form
│   │   ├── dashboard/          # Financial dashboard
│   │   ├── forgot-password/    # Password reset request
│   │   ├── help/               # FAQ and quick start guide
│   │   ├── login/              # Login with rate limiting
│   │   ├── privacy/            # Privacy policy
│   │   ├── profile/            # User profile management
│   │   ├── projects/           # Project management
│   │   ├── reset-password/     # Password reset form
│   │   ├── signup/             # Registration with password feedback
│   │   ├── terms/              # Terms of service
│   │   ├── transactions/       # Transaction CRUD + CSV export
│   │   ├── layout.tsx          # Root layout (nav, footer, error boundary)
│   │   ├── page.tsx            # Landing page
│   │   └── error.tsx           # Global error page
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (12 components)
│   │   ├── confirm-dialog.tsx  # Custom delete confirmation dialog
│   │   ├── error-boundary.tsx  # React Error Boundary
│   │   ├── footer.tsx          # Global footer with legal links
│   │   ├── navigation.tsx      # Responsive nav with session timeout
│   │   ├── page-skeleton.tsx   # Loading skeleton components
│   │   └── theme-provider.tsx  # Dark/light mode provider
│   ├── hooks/
│   │   └── useAuth.ts          # Auth hook (user state, supabase client)
│   ├── lib/
│   │   ├── audit.ts            # Audit logging utility
│   │   ├── constants.ts        # Centralized constants and error messages
│   │   ├── supabase.ts         # Browser Supabase client
│   │   ├── supabase-server.ts  # Server Supabase client
│   │   └── utils.ts            # Tailwind merge utility
│   ├── types/
│   │   └── database.ts         # TypeScript interfaces + currency formatter
│   └── middleware.ts           # Auth middleware (session + route guards)
├── next.config.ts              # Security headers + React compiler
├── netlify.toml                # Deployment configuration
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript configuration
```

### 6.2 Page Routes

| Route | Auth Required | Description |
|-------|:------------:|-------------|
| `/` | No | Landing page with feature overview |
| `/login` | No (redirects if authed) | Login with rate limiting |
| `/signup` | No (redirects if authed) | Registration with real-time password validation |
| `/forgot-password` | No | Request password reset email |
| `/reset-password` | No | Set new password from reset link |
| `/dashboard` | Yes | Financial overview with charts |
| `/transactions` | Yes | Transaction CRUD, search, filter, CSV export |
| `/categories` | Yes | Category management |
| `/budget-goals` | Yes | Budget goal tracking with progress bars |
| `/projects` | Yes | Project management with spending stats |
| `/profile` | Yes | User profile, avatar upload, settings |
| `/help` | No | FAQ and quick start guide |
| `/contact` | No | Contact form (server-side email) |
| `/privacy` | No | Privacy policy |
| `/terms` | No | Terms of service |
| `/api/contact` | No (rate limited) | Server-side email API endpoint |

---

## 7. Key Design Patterns

### 7.1 Authentication Hook (`useAuth`)

All protected pages use the `useAuth` hook, which:
- Creates a memoized Supabase client (single instance per component tree)
- Checks auth state on mount
- Redirects to `/login` if unauthenticated
- Subscribes to auth state changes
- Returns `{ user, loading, supabase }`

### 7.2 Data Fetching Pattern

Each page follows a consistent pattern:
```
Page Mount → useAuth() → loadData() → setState() → Render
                                         ↑
User Action → handleSubmit/handleDelete → logAudit() → loadData()
```

### 7.3 Query Optimization

- **Join queries:** Transactions fetched with `select("*, categories(name)")` — eliminates N+1
- **Batch fetching:** Budget goals fetch all categories and expenses in 2 queries, group client-side
- **Dashboard consolidation:** Monthly trend data fetched as single 6-month range query instead of 6 separate calls

### 7.4 Validation Strategy

**Client-side (all forms):**
- Amount > 0 (JS check + HTML `min="0.01"`)
- Names/descriptions trimmed, whitespace-only rejected
- Date range validation (end > start)
- Threshold range validation (1–100)
- Duplicate detection (categories, budget goals)

**Database-level:**
- CHECK constraints on amounts, types, thresholds
- Foreign key constraints
- RLS policies

### 7.5 Error Handling

- **Error Boundary:** Wraps main content in `layout.tsx` — catches render crashes, shows recovery UI
- **Form Errors:** Displayed inline with red styling
- **Toast Notifications:** Success/failure feedback for all CRUD operations via Sonner
- **Confirm Dialogs:** Custom `AlertDialog` component replaces native `confirm()` for delete actions

---

## 8. Data Flow Diagrams

### 8.1 Transaction Lifecycle

```
User fills form
       │
       ▼
Client-side validation
  ├── Amount > 0?
  ├── Description not empty?
  ├── Category selected?
  └── Project optional
       │ Pass
       ▼
Supabase Insert/Update
  ├── RLS policy check (user_id match)
  ├── CHECK constraints (amount > 0, valid type)
  └── FK constraints (category, project)
       │ Success
       ▼
Audit log entry created
       │
       ▼
Toast notification shown
       │
       ▼
Full data reload (loadData)
       │
       ▼
UI re-renders with updated list
```

### 8.2 Authentication Flow

```
Signup:  Form → Password validation (8+ chars, upper, lower, number)
              → Supabase Auth signUp → DB trigger creates profile → Redirect to /dashboard

Login:   Form → Rate limit check (5 attempts max)
              → Supabase Auth signIn → Middleware refreshes session → Redirect to /dashboard

Reset:   /forgot-password → Supabase resetPasswordForEmail → Email with link
              → /reset-password → Supabase updateUser → Redirect to /login

Logout:  Nav dropdown → Supabase signOut → Redirect to /login

Timeout: 30min inactivity → Auto signOut → Redirect to /login
```

---

## 9. Deployment Architecture

```
┌────────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Developer    │────▶│   Netlify    │     │    Supabase      │
│   (git push)   │     │   CDN/SSR    │────▶│   (Cloud DB)     │
└────────────────┘     │              │     │   - PostgreSQL   │
                       │  - Build     │     │   - Auth         │
                       │  - Deploy    │     │   - Storage      │
                       │  - SSL/TLS   │     │   - RLS          │
                       └──────────────┘     └──────────────────┘
```

**Environment Variables Required:**

| Variable | Location | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anonymous key |
| `EMAILJS_SERVICE_ID` | Server only | EmailJS service identifier |
| `EMAILJS_TEMPLATE_ID` | Server only | EmailJS template identifier |
| `EMAILJS_PUBLIC_KEY` | Server only | EmailJS API key |

---

## 10. Performance Considerations

### Current Optimizations
- **React Compiler** enabled in `next.config.ts` for automatic memoization
- **Join queries** eliminate N+1 on transactions and budget goals pages
- **Batch fetching** on dashboard reduces queries from 8+ to 3
- **Pagination** with `ITEMS_PER_PAGE = 20` on transactions page
- **Loading skeletons** provide perceived performance during data fetches

### Current Limitations
- No server-side caching layer (data refetched on every page visit)
- No real-time subscriptions (manual refresh required for multi-device usage)
- Projects page still fetches transaction stats per-project (minor — few projects expected)
- No optimistic updates (UI waits for full server round-trip before reflecting changes)

---

## 11. Testing

### Current Coverage

| Test File | Tests | Scope |
|-----------|:-----:|-------|
| `formatCurrency.test.ts` | 8 | Currency formatting (edge cases, large numbers, zero) |
| `constants.test.ts` | 12 | Error messages, chart colors, date formats, items per page |
| `audit.test.ts` | 3 | Audit log function signature and behavior |
| **Total** | **23** | All passing ✅ |

### Testing Stack
- **Runner:** Vitest 4.0.18
- **Environment:** jsdom
- **Libraries:** @testing-library/react, @testing-library/jest-dom

---

## 12. Potential Future Improvements

### Short-Term (1–2 Months)

| Improvement | Priority | Effort | Impact |
|-------------|----------|--------|--------|
| Recurring transactions UI | High | Medium | Complete existing schema feature |
| More unit + E2E tests | High | Medium | Regression safety |
| Server-side caching | Medium | Low | Faster page loads |
| Account deletion (GDPR) | Medium | Low | Compliance |
| Email verification enforcement | Medium | Low | Prevent fake signups |

### Medium-Term (3–6 Months)

| Improvement | Priority | Effort | Impact |
|-------------|----------|--------|--------|
| Real-time subscriptions | Medium | Medium | Multi-device sync |
| Multi-currency support | Medium | Medium | Broader user base |
| Optimistic updates | Low | Medium | Better UX responsiveness |
| Offline support (PWA) | Low | High | Mobile usage |
| CI/CD pipeline | Medium | Low | Automated testing + deploy |

### Long-Term (6+ Months)

| Improvement | Priority | Effort | Impact |
|-------------|----------|--------|--------|
| Native mobile app | Low | High | On-the-go expense tracking |
| Receipt photo attachments | Low | Medium | Transaction documentation |
| Bill reminders / notifications | Low | Medium | Proactive financial management |
| Monthly PDF reports | Low | Medium | Printable summaries |
| Multiple accounts (cash, bank, mobile money) | Low | High | Advanced finance tracking |

---

## 13. Migration History

SwiftBudget was originally built as a Python/Flask application with server-rendered Jinja2 templates and a local PostgreSQL database. The migration to Next.js/Supabase was undertaken to:

1. **Modernize the frontend** — Move from server-rendered HTML to a React SPA with client-side interactivity
2. **Eliminate backend maintenance** — Replace custom Flask backend with Supabase BaaS
3. **Improve security** — Leverage Supabase RLS instead of manual query filtering
4. **Enable deployment** — Move from local development to cloud hosting (Netlify + Supabase)
5. **Learn modern web development** — Gain experience with TypeScript, React, and modern tooling

### Key Architectural Changes from Flask

| Aspect | Flask (Before) | Next.js (After) |
|--------|---------------|-----------------|
| Rendering | Server-side Jinja2 templates | Client-side React components |
| Database | Local PostgreSQL + SQLAlchemy ORM | Supabase PostgreSQL + JS client |
| Auth | Flask-Login + bcrypt | Supabase Auth (managed JWT) |
| Data Isolation | Manual `current_user.id` checks | Row Level Security (RLS) policies |
| File Uploads | Local filesystem | Supabase Storage (cloud) |
| Deployment | Manual (local server) | Netlify (automated) |
| Styling | Custom CSS | Tailwind CSS + shadcn/ui |
| API | Flask routes returning HTML | Supabase client-side queries + API routes |

---

## 14. Known Limitations

1. **No recurring transactions UI** — Database table exists but no frontend implementation
2. **Single currency** — Hard-coded to Malawi Kwacha (MK/MWK)
3. **No offline support** — Requires internet connection
4. **No real-time sync** — Changes on one device don't auto-appear on another
5. **Client-side heavy** — Most logic runs in the browser; limited server-side rendering
6. **No CI/CD** — Manual build verification; no automated test pipeline
7. **EmailJS free tier** — Limited to 200 emails/month for contact form

---

*This document should be updated as the architecture evolves.*
