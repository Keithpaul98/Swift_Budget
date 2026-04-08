# SwiftBudget

A modern personal finance application built with Next.js and Supabase. Track income, expenses, set budget goals, organize spending by project, and visualize your finances — all in Malawi Kwacha (MK).

> Migrated from the original [SwiftBudget Flask app](https://github.com/Keithpaul98/SwiftBudget) to a modern React-based architecture for better performance, security, and deployment.

---

## Features

### Core
- **Transaction Management** — Add, edit, delete income/expense records with search, type/date filters, and server-side pagination
- **Category System** — 17 pre-loaded categories + custom categories with duplicate prevention
- **Budget Goals** — Set weekly/monthly/yearly spending limits with progress bars and threshold alerts
- **Project Grouping** — Organize transactions by project with budget tracking
- **Dashboard** — Financial overview with lazy-loaded charts, monthly navigation, and summary stats
- **CSV Export** — Download filtered transactions as a spreadsheet

### Authentication & Security
- **Email/Password Auth** — Signup, login, and password reset via email (PKCE flow)
- **Password Reset** — Forgot password flow with email verification through `/auth/callback`
- **Session Timeout** — Auto-logout after 30 minutes of inactivity (debounced for mobile)
- **Rate Limiting** — Login lockout after 5 failed attempts; contact form limited to 3/min
- **Row Level Security** — Database-level data isolation per user
- **Security Headers** — CSP, HSTS, X-Frame-Options, and more
- **Audit Logging** — All data changes logged for accountability
- **Auth Event Tracking** — Logins, logouts, signups, and password resets recorded

### User Experience
- **Real-Time Password Feedback** — Live checklist showing password requirements as you type
- **Toast Notifications** — Instant feedback for all actions
- **Custom Confirm Dialogs** — Modern styled delete confirmations
- **Dark Mode** — System theme detection
- **Responsive Design** — Mobile, tablet, and desktop layouts
- **Loading Skeletons** — Smooth loading states

### Admin Dashboard
- **System Overview** — Total users, transactions, categories, projects, budget goals, daily activity
- **User Management** — View all users with activity stats; click any user for deep analysis
- **Per-User Detail View** — Tabs for Performance, Activity Logs, and Auth Events per user
- **Performance Monitoring** — Auto-collected client-side metrics (page load, FCP, LCP, API latency, connection info, device info) per user per page
- **Auth Event Timeline** — Track logins, logouts, password resets with device/browser info
- **Audit Logs** — System-wide CRUD activity with expandable details
- **Real-Time Admin Metrics** — Own-session performance benchmarks

### Performance Optimizations
- **Lazy-Loaded Charts** — Recharts loaded via `next/dynamic` (~200KB saved from initial bundle)
- **Server-Side Pagination** — Transactions use Supabase `.range()` instead of fetching all records
- **Parallelized Queries** — Dashboard fetches use `Promise.all` (~700ms saved)
- **DNS Preconnect** — Preconnect hints for Supabase URL (~350ms saved on first API call)
- **Debounced Listeners** — Session timeout events throttled to reduce mobile CPU usage
- **Automatic Performance Reporting** — Silent per-page metrics collection for admin monitoring

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1.6 (React 19, TypeScript) |
| **Database** | Supabase PostgreSQL with Row Level Security |
| **Auth** | Supabase Auth (JWT, email/password) |
| **Storage** | Supabase Storage (profile avatars) |
| **Styling** | Tailwind CSS v4 + shadcn/ui v4 |
| **Charts** | Recharts (lazy-loaded) |
| **Icons** | Lucide React |
| **Email** | EmailJS (server-side API route) |
| **Testing** | Vitest + Testing Library |
| **Deployment** | Netlify |

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) account (free tier works)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd swiftbudget
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   - Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
   - Go to SQL Editor → paste and run `supabase/migrations/001_initial_schema.sql`
   - Create an `avatars` storage bucket (see `supabase/storage-setup.md`)

4. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Then fill in your values:
   ```env
   # Required
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Required for contact form
   EMAILJS_SERVICE_ID=your-service-id
   EMAILJS_TEMPLATE_ID=your-template-id
   EMAILJS_PUBLIC_KEY=your-public-key

   # Optional
   NEXT_PUBLIC_CURRENCY_SYMBOL=MK
   NEXT_PUBLIC_CURRENCY_CODE=MWK
   ```

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
swiftbudget/
├── src/
│   ├── __tests__/              # Unit tests (Vitest)
│   ├── app/                    # Next.js App Router pages (16 routes)
│   │   ├── admin/              # Admin dashboard (stats, users, logs, performance)
│   │   ├── api/contact/        # Server-side email API
│   │   ├── auth/callback/      # Auth code exchange (login, password reset)
│   │   ├── budget-goals/       # Budget goal management
│   │   ├── categories/         # Category management
│   │   ├── contact/            # Contact form
│   │   ├── dashboard/          # Financial dashboard + lazy-loaded charts
│   │   ├── forgot-password/    # Password reset request
│   │   ├── help/               # FAQ and quick start guide
│   │   ├── login/              # Login with rate limiting + auth event logging
│   │   ├── privacy/            # Privacy policy
│   │   ├── profile/            # User profile + avatar
│   │   ├── projects/           # Project management
│   │   ├── reset-password/     # Set new password + auth event logging
│   │   ├── signup/             # Registration + password feedback
│   │   ├── terms/              # Terms of service
│   │   ├── transactions/       # Transaction CRUD + server-side pagination
│   │   └── layout.tsx          # Root layout (nav, footer, error boundary, preconnect)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── admin-user-detail   # Per-user admin detail view (perf, logs, auth)
│   │   ├── confirm-dialog      # Delete confirmation dialog
│   │   ├── dashboard-charts    # Lazy-loaded Recharts wrapper
│   │   ├── error-boundary      # React Error Boundary
│   │   ├── footer              # Global footer
│   │   ├── navigation          # Responsive nav + session timeout + perf reporter
│   │   ├── page-skeleton       # Loading skeletons
│   │   └── theme-provider      # Dark/light theme provider
│   ├── hooks/
│   │   └── useAuth.ts          # Auth hook (user state, session)
│   ├── lib/
│   │   ├── audit.ts            # Audit logging utility
│   │   ├── auth-events.ts      # Auth event logging (login, logout, reset)
│   │   ├── constants.ts        # Centralized constants
│   │   ├── performance-reporter.ts # Client-side perf metrics reporter
│   │   ├── supabase.ts         # Browser Supabase client
│   │   ├── supabase-server.ts  # Server Supabase client
│   │   └── utils.ts            # Utility functions
│   ├── types/
│   │   └── database.ts         # TypeScript interfaces + formatCurrency
│   └── middleware.ts           # Auth middleware (session + route guards)
├── supabase/
│   └── migrations/             # Database schema (5 migration files)
├── ARCHITECTURE.md             # Technical architecture report
├── DOCUMENTATION.md            # Full system documentation
├── netlify.toml                # Netlify deployment config
└── next.config.ts              # Security headers + React compiler

---

## Database

9 tables with Row Level Security, check constraints, and foreign keys:

| Table | Purpose |
|-------|--------|
| `profiles` | User profile data (extends Supabase Auth) |
| `categories` | Income/expense categories (17 defaults + custom) |
| `transactions` | Financial records with soft delete |
| `budget_goals` | Spending limits by category and period |
| `projects` | Transaction grouping by project |
| `recurring_transactions` | Schema ready (UI planned) |
| `audit_logs` | CRUD action logging |
| `user_performance_logs` | Client-side performance snapshots per user/page |
| `user_auth_events` | Login, logout, signup, password reset tracking |

### SQL Migrations

| File | Purpose |
|------|--------|
| `001_initial_schema.sql` | Core tables, RLS policies, defaults, profile trigger |
| `002_fix_profile_rls.sql` | Profile RLS policy fixes |
| `003_add_project_budget.sql` | Projects and budget goal enhancements |
| `003_admin_functions.sql` | Admin RPC functions for system stats and user activity |
| `004_user_monitoring.sql` | Performance logs, auth events, admin query functions |

---

## Security

- **Row Level Security (RLS)** on all tables — users can only access their own data
- **7 security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control
- **Server-side email** — EmailJS credentials never exposed to the client
- **Rate limiting** — Login (5 attempts/60s lockout), contact form (3/min per IP)
- **Session timeout** — Auto-logout after 30 minutes of inactivity
- **Input validation** — Client-side + database-level constraints on all forms
- **Audit trail** — All create/update/delete operations logged
- **Error Boundary** — Catches render crashes with recovery UI

---

## Deployment

### Netlify

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard (Site Settings → Environment Variables)
3. Push to main branch — auto-builds and deploys

**Supabase config:**
- Set Site URL in Authentication → URL Configuration to your Netlify domain
- Add `https://your-domain.netlify.app/auth/callback**` to Redirect URLs (wildcard required for password reset flow)

---

## Testing

```bash
npm test          # Run all 23 tests
npm run test:watch  # Watch mode
```

| Test Suite | Tests | Coverage |
|-----------|:-----:|---------|
| `formatCurrency.test.ts` | 8 | Currency formatting edge cases |
| `constants.test.ts` | 12 | Error messages, chart colors, config |
| `audit.test.ts` | 3 | Audit logging function |

---

## What I Learned

This project was built as a learning exercise migrating from Python/Flask to modern JavaScript/React. Key takeaways:

- **Next.js App Router** — File-based routing, server vs client components, middleware
- **Supabase** — Auth, PostgreSQL, RLS policies, storage, real-time capabilities
- **TypeScript** — Type safety, interfaces, generics
- **React 19** — Hooks, state management, component composition
- **Security** — CSP headers, rate limiting, input validation, audit logging
- **Performance** — Lazy loading, server-side pagination, parallelized queries, DNS preconnect, debounced listeners
- **Monitoring** — Client-side performance collection, per-user analytics, auth event tracking
- **Code Review Process** — Receiving feedback, identifying root causes, implementing fixes iteratively

---

## Known Limitations

- Single currency (Malawi Kwacha)
- Recurring transactions table exists but UI not yet built
- No offline support
- No real-time multi-device sync
- EmailJS free tier limited to 200 emails/month
- No CI/CD pipeline (manual build verification)
- Admin restricted to single email (hardcoded)

---

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Technical architecture, system design, data flows, and future roadmap
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** — Full system docs: user guide, API reference, database schema, troubleshooting

---

## License

MIT

---

## Original Project

Migrated from [SwiftBudget (Flask)](https://github.com/Keithpaul98/SwiftBudget) — a Python/Flask app with Jinja2 templates and local PostgreSQL.
