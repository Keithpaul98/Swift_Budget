# SwiftBudget — System Documentation

**Version:** 1.0  
**Last Updated:** March 7, 2026  
**Author:** Keith Paul  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Features Overview](#3-features-overview)
4. [User Guide](#4-user-guide)
5. [Pages Reference](#5-pages-reference)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Components Reference](#8-components-reference)
9. [Hooks & Utilities](#9-hooks--utilities)
10. [Security Features](#10-security-features)
11. [Configuration](#11-configuration)
12. [Deployment](#12-deployment)
13. [Testing](#13-testing)
14. [Troubleshooting](#14-troubleshooting)
15. [Changelog](#15-changelog)

---

## 1. Introduction

SwiftBudget is a personal finance management application designed for tracking income and expenses in Malawi Kwacha (MK). It provides budgeting tools, spending analytics, project-based expense grouping, and data export capabilities.

### Who Is This For?

- **Individuals** wanting to track personal finances
- **Small business owners** monitoring income and expenses by category
- **Anyone** who wants a simple, visual budgeting tool

### Core Capabilities

- Track income and expense transactions
- Categorize spending with default and custom categories
- Set budget goals with threshold alerts
- Group transactions by project
- Visualize financial data with charts
- Export transaction data to CSV
- Manage user profile and preferences

---

## 2. Getting Started

### Prerequisites

- **Node.js** v20 or later
- **npm** v10 or later
- **Supabase account** (free tier works) — [supabase.com](https://supabase.com)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd swiftbudget

# Install dependencies
npm install
```

### Supabase Setup

1. **Create a Supabase project** at [supabase.com/dashboard](https://supabase.com/dashboard)

2. **Run the database migration:**
   - Go to your Supabase Dashboard → SQL Editor
   - Paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Click "Run"

3. **Set up storage:**
   - Follow the instructions in `supabase/storage-setup.md`
   - Create an `avatars` bucket for profile images

4. **Configure environment variables:**
   Create a `.env.local` file in the project root:
   ```env
   # Supabase (required)
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # EmailJS (required for contact form)
   EMAILJS_SERVICE_ID=your-service-id
   EMAILJS_TEMPLATE_ID=your-template-id
   EMAILJS_PUBLIC_KEY=your-public-key

   # Optional
   NEXT_PUBLIC_CURRENCY_SYMBOL=MK
   NEXT_PUBLIC_CURRENCY_CODE=MWK
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Create production build |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## 3. Features Overview

### Authentication & Account
- Email/password signup and login
- Password reset via email link
- Real-time password requirements feedback during signup
- Session timeout after 30 minutes of inactivity
- Login rate limiting (5 attempts before lockout)
- Profile management with avatar upload

### Transactions
- Add, edit, and delete income/expense transactions
- Assign transactions to categories and projects
- Search transactions by description
- Filter by type (income/expense) and date range
- Paginated list (20 per page)
- Export filtered transactions to CSV
- Soft delete support for data recovery

### Categories
- 17 pre-loaded default categories (6 income, 11 expense)
- Create custom categories
- Edit and delete custom categories
- Duplicate name prevention
- Protected deletion (cannot delete categories with linked transactions)

### Budget Goals
- Set spending limits by category or overall
- Choose period (weekly, monthly, yearly) with auto-calculated date ranges
- Visual progress bar with color coding:
  - **Green** — Under budget
  - **Yellow** — Approaching threshold
  - **Red** — Over budget
- Configurable alert threshold (1–100%)
- Duplicate goal detection for overlapping date ranges

### Projects
- Create projects to group related transactions
- Track total spending and transaction count per project
- Optional budget per project
- Safe deletion (unlinks transactions before removing project)

### Dashboard
- Summary cards: Total Income, Total Expenses, Net Balance, Budget Used %
- Monthly navigation (previous/next month)
- Bar chart: 6-month spending trend
- Pie chart: Expense breakdown by category
- Recent transactions list
- Quick action buttons

### Other
- FAQ and Quick Start guide on Help page
- Contact form with server-side email delivery
- Privacy Policy and Terms of Service pages
- Dark mode support (system theme detection)
- Responsive design (mobile, tablet, desktop)
- Global footer with legal and contact links
- Audit logging for all data changes

---

## 4. User Guide

### Creating an Account

1. Navigate to `/signup`
2. Enter your email, username, and password
3. Password must meet all requirements (shown in real-time as you type):
   - At least 8 characters
   - At least 1 uppercase letter
   - At least 1 lowercase letter
   - At least 1 number
4. Click "Sign Up" — you'll be redirected to the dashboard

### Adding a Transaction

1. Go to **Transactions** page
2. Click **"Add Transaction"**
3. Select **Income** or **Expense**
4. Fill in the amount, description, category, and date
5. Optionally assign it to a project
6. Click **"Add Transaction"** — a toast notification confirms success

### Setting a Budget Goal

1. Go to **Budget Goals** page
2. Click **"Add Budget Goal"**
3. Select a category (or leave as "Overall Budget")
4. Enter the budget amount
5. Choose a period — the date range auto-fills:
   - **Weekly** — Current week (Monday–Sunday)
   - **Monthly** — Current month (1st–last day)
   - **Yearly** — Current year (Jan 1–Dec 31)
6. Set an alert threshold (default 80%)
7. Click **"Add Goal"**

### Exporting Transactions

1. Go to **Transactions** page
2. Apply any desired filters (search, type, date range)
3. Click the **"Export CSV"** button (download icon)
4. The file downloads as `swiftbudget-transactions-YYYY-MM-DD.csv`
5. Open in Excel, Google Sheets, or any spreadsheet application

### Resetting Your Password

1. On the login page, click **"Forgot Password?"**
2. Enter your email address
3. Check your inbox for the reset link
4. Click the link — you'll be taken to the reset form
5. Enter your new password (must meet the same requirements)
6. Click **"Reset Password"** — you'll be redirected to login

### Managing Your Profile

1. Click your avatar in the navigation bar → **"Profile"**
2. You can update:
   - **Username**
   - **Profile picture** (click the avatar to upload, max 2MB)
   - **Email notifications** preference
3. Changes save individually with confirmation toasts

---

## 5. Pages Reference

### Public Pages

#### Landing Page (`/`)
- Hero section with app description
- Feature grid highlighting key capabilities
- Call-to-action buttons for signup and transactions

#### Login (`/login`)
- Email and password form
- "Forgot Password?" link
- Link to signup page
- Rate limiting: locks after 5 failed attempts for 60 seconds

#### Signup (`/signup`)
- Email, username, and password form
- Real-time password requirement checklist (✓/✗ indicators)
- Link to login page

#### Forgot Password (`/forgot-password`)
- Email input form
- Sends password reset link via Supabase Auth
- Success confirmation message

#### Reset Password (`/reset-password`)
- New password input with confirmation
- Same password requirements as signup
- Redirects to login after successful reset

#### Help (`/help`)
- Quick Start Guide section
- FAQ accordion with common questions
- Link to contact page

#### Contact (`/contact`)
- Contact form (name, email, subject, message)
- Sends email via server-side API route
- Shows support email as fallback
- Rate limited to 3 submissions per minute

#### Privacy Policy (`/privacy`)
- Data collection and usage disclosure
- Cookie policy
- Data retention information
- Contact details for privacy inquiries

#### Terms of Service (`/terms`)
- Usage terms and conditions
- Account responsibilities
- Limitation of liability
- Governing terms

### Protected Pages (Require Authentication)

#### Dashboard (`/dashboard`)
- 4 summary stat cards
- Month navigation (← Previous | Current Month | Next →)
- Bar chart: last 6 months income vs expenses
- Pie chart: expense category breakdown
- Recent transactions (last 5)

#### Transactions (`/transactions`)
- Search bar with type filter dropdown
- Date range filter (from/to date inputs)
- Paginated transaction list (20 per page)
- Add/edit transaction dialog
- Export CSV button
- Delete with confirmation dialog

#### Categories (`/categories`)
- Tabs: Expense categories | Income categories
- Default categories (marked with badge, non-editable)
- Add/edit custom category form
- Delete with FK protection and clear error messages

#### Budget Goals (`/budget-goals`)
- Goal cards with progress bars
- Color-coded status (green/yellow/red)
- Spending vs budget amount display
- Period dropdown with auto-date calculation
- Add/edit/delete with confirmation

#### Projects (`/projects`)
- Project cards with color indicator
- Transaction count and total spending per project
- Budget vs actual spending
- Safe deletion (unlinks transactions first)

#### Profile (`/profile`)
- Avatar display and upload
- Username editing
- Email display
- Email notification toggle
- Account creation date

---

## 6. Database Schema

### Tables Overview

#### `profiles`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK → auth.users | User identifier |
| username | VARCHAR(50) | UNIQUE, NOT NULL | Display name |
| profile_image | TEXT | — | Avatar URL (Supabase Storage) |
| is_active | BOOLEAN | DEFAULT TRUE | Account status |
| email_notifications | BOOLEAN | DEFAULT TRUE | Notification preference |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Registration timestamp |
| last_login | TIMESTAMPTZ | — | Last login timestamp |
| failed_login_attempts | INTEGER | DEFAULT 0 | Failed login counter |
| account_locked_until | TIMESTAMPTZ | — | Lockout expiry |

#### `categories`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Category identifier |
| name | VARCHAR(50) | NOT NULL | Category name |
| type | VARCHAR(10) | CHECK (income/expense) | Category type |
| is_default | BOOLEAN | DEFAULT FALSE | System-provided category |
| user_id | UUID | FK → auth.users | Owner (NULL for defaults) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

#### `transactions`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Transaction identifier |
| user_id | UUID | FK → auth.users, NOT NULL | Owner |
| category_id | INTEGER | FK → categories, NOT NULL | Category reference |
| project_id | INTEGER | FK → projects | Optional project reference |
| type | VARCHAR(10) | CHECK (income/expense) | Transaction type |
| amount | NUMERIC(10,2) | CHECK (> 0), NOT NULL | Transaction amount |
| description | TEXT | — | Transaction description |
| date | DATE | DEFAULT CURRENT_DATE | Transaction date |
| quantity | NUMERIC(10,2) | — | Optional quantity |
| unit_price | NUMERIC(10,2) | — | Optional unit price |
| is_deleted | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update (auto-trigger) |

#### `budget_goals`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Goal identifier |
| user_id | UUID | FK → auth.users, NOT NULL | Owner |
| category_id | INTEGER | FK → categories | Category (NULL = overall) |
| amount | NUMERIC(10,2) | CHECK (> 0), NOT NULL | Budget limit |
| period | VARCHAR(10) | CHECK (weekly/monthly/yearly) | Budget period |
| start_date | DATE | NOT NULL | Period start |
| end_date | DATE | NOT NULL | Period end |
| alert_threshold | INTEGER | CHECK (1–100), DEFAULT 80 | Warning percentage |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

#### `projects`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Project identifier |
| user_id | UUID | FK → auth.users, NOT NULL | Owner |
| name | VARCHAR(100) | NOT NULL | Project name |
| description | TEXT | — | Project description |
| color | VARCHAR(7) | DEFAULT '#6366f1' | Display color (hex) |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

#### `recurring_transactions` (Schema Only — Not Yet Implemented)
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Record identifier |
| user_id | UUID | FK → auth.users, NOT NULL | Owner |
| category_id | INTEGER | FK → categories, NOT NULL | Category reference |
| type | VARCHAR(10) | CHECK (income/expense) | Transaction type |
| amount | NUMERIC(10,2) | CHECK (> 0), NOT NULL | Amount |
| description | TEXT | — | Description |
| frequency | VARCHAR(10) | CHECK (daily/weekly/monthly/yearly) | Recurrence |
| start_date | DATE | NOT NULL | Start date |
| end_date | DATE | — | Optional end date |
| next_occurrence | DATE | NOT NULL | Next scheduled date |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

#### `audit_logs`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Log identifier |
| user_id | UUID | FK → auth.users, NOT NULL | Acting user |
| action | VARCHAR(50) | NOT NULL | Action type (create/update/delete) |
| entity_type | VARCHAR(50) | NOT NULL | Entity (transaction/category/etc.) |
| entity_id | INTEGER | NOT NULL | Affected record ID |
| old_values | JSONB | — | Previous state (for updates) |
| new_values | JSONB | — | New state |
| ip_address | VARCHAR(45) | — | Client IP |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Timestamp |

### Database Triggers

| Trigger | Table | Function | Description |
|---------|-------|----------|-------------|
| `on_auth_user_created` | `auth.users` | `handle_new_user()` | Auto-creates profile row on signup |
| `set_updated_at` | `transactions` | `update_updated_at()` | Auto-updates `updated_at` on modification |

### Row Level Security (RLS)

All 7 tables have RLS enabled. Each table has SELECT, INSERT, UPDATE, and DELETE policies scoped to `auth.uid() = user_id`. Categories additionally allow SELECT on `is_default = TRUE` rows for all users.

---

## 7. API Reference

### `POST /api/contact`

Server-side endpoint for sending contact form emails via EmailJS.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "subject": "string (required)",
  "message": "string (required)"
}
```

**Responses:**

| Status | Body | Description |
|--------|------|-------------|
| 200 | `{ "success": true }` | Email sent successfully |
| 400 | `{ "error": "All fields are required." }` | Missing fields |
| 429 | `{ "error": "Too many requests..." }` | Rate limit exceeded (3/min) |
| 500 | `{ "error": "Email service is not configured." }` | Missing env vars |
| 500 | `{ "error": "Failed to send message." }` | EmailJS error |

**Rate Limiting:** 3 requests per minute per IP address (in-memory tracking).

---

## 8. Components Reference

### Custom Components

| Component | File | Description |
|-----------|------|-------------|
| `Navigation` | `src/components/navigation.tsx` | Responsive navbar with mobile sheet drawer, user dropdown, session timeout logic |
| `Footer` | `src/components/footer.tsx` | Global footer with copyright and links to Privacy, Terms, Contact |
| `ErrorBoundary` | `src/components/error-boundary.tsx` | React Error Boundary — catches render crashes, shows recovery UI |
| `ConfirmDialog` | `src/components/confirm-dialog.tsx` | Reusable delete confirmation dialog using AlertDialog |
| `GridPageSkeleton` / `ListPageSkeleton` | `src/components/page-skeleton.tsx` | Loading skeleton placeholders for grid and list layouts |
| `ThemeProvider` | `src/components/theme-provider.tsx` | Dark/light mode theme wrapper |

### shadcn/ui Components

| Component | File | Usage |
|-----------|------|-------|
| `AlertDialog` | `ui/alert-dialog.tsx` | Delete confirmation dialogs |
| `Avatar` | `ui/avatar.tsx` | Profile image display |
| `Button` | `ui/button.tsx` | All interactive buttons |
| `Card` | `ui/card.tsx` | Content containers on every page |
| `Dialog` | `ui/dialog.tsx` | Add/edit forms (transactions, goals, etc.) |
| `DropdownMenu` | `ui/dropdown-menu.tsx` | Navigation user menu |
| `Input` | `ui/input.tsx` | All form text/number/date inputs |
| `Label` | `ui/label.tsx` | Form field labels |
| `Separator` | `ui/separator.tsx` | Visual dividers |
| `Sheet` | `ui/sheet.tsx` | Mobile navigation drawer |
| `Skeleton` | `ui/skeleton.tsx` | Loading placeholder shapes |
| `Sonner` | `ui/sonner.tsx` | Toast notification container |

---

## 9. Hooks & Utilities

### `useAuth` Hook

**File:** `src/hooks/useAuth.ts`

```typescript
const { user, loading, supabase } = useAuth({
  redirectTo: "/login",    // Where to redirect if not authenticated
  requireAuth: true,       // Whether auth is required (default: true)
});
```

**Returns:**
- `user` — The authenticated Supabase `User` object, or `null`
- `loading` — `true` while checking auth state
- `supabase` — Memoized Supabase browser client instance

### `logAudit` Utility

**File:** `src/lib/audit.ts`

```typescript
await logAudit(supabase, userId, "create", "transaction", transactionId, null, newData);
await logAudit(supabase, userId, "update", "category", categoryId, oldData, newData);
await logAudit(supabase, userId, "delete", "project", projectId);
```

Logs CRUD actions to the `audit_logs` table. Silently catches errors to never block the main operation.

### `formatCurrency` Utility

**File:** `src/types/database.ts`

```typescript
formatCurrency(50000)    // "MK 50,000.00"
formatCurrency(0)        // "MK 0.00"
formatCurrency(1234.5)   // "MK 1,234.50"
```

### Constants

**File:** `src/lib/constants.ts`

| Constant | Value | Description |
|----------|-------|-------------|
| `CHART_COLORS` | Array of 6 hex colors | Chart color palette |
| `ITEMS_PER_PAGE` | 20 | Pagination page size |
| `DATE_FORMATS.display` | "MMM d, yyyy" | Date display format |
| `DATE_FORMATS.input` | "yyyy-MM-dd" | HTML date input format |
| `ERROR_MESSAGES` | Object | Centralized error message strings |
| `ADMIN_EMAIL` | "keithpaul.dev@gmail.com" | Support contact email |

---

## 10. Security Features

### Authentication Security
- Passwords hashed by Supabase Auth (bcrypt)
- JWT tokens in HTTP-only cookies
- Session refresh on every request via middleware
- 30-minute inactivity timeout with auto-logout
- Login rate limiting (5 attempts → 60-second lockout)
- Password complexity requirements enforced at signup and reset

### Data Security
- Row Level Security on all database tables
- Soft deletes for transaction recoverability
- Audit logging for all data mutations
- Input validation on all forms (client-side + database constraints)
- Foreign key constraint protection with user-friendly error messages

### Network Security
- 7 security headers configured (X-Frame-Options, CSP, HSTS, etc.)
- EmailJS credentials stored server-side only
- Contact form API rate limited (3/min per IP)
- HTTPS enforced via HSTS header

### Privacy
- No tracking or analytics scripts
- Privacy Policy page (`/privacy`)
- Terms of Service page (`/terms`)
- User ID not exposed in UI

---

## 11. Configuration

### `next.config.ts`

- **React Compiler:** Enabled for automatic optimizations
- **Security Headers:** 7 headers applied to all routes (see Security section)

### `netlify.toml`

- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Plugin:** `@netlify/plugin-nextjs` for SSR support

### `middleware.ts`

- **Protected routes:** `/dashboard`, `/transactions`, `/categories`, `/budget-goals`, `/projects`, `/profile`
- **Auth-only routes:** `/login`, `/signup` (redirect to dashboard if already logged in)
- **Graceful fallback:** Skips auth checks if Supabase is not yet configured

---

## 12. Deployment

### Netlify Deployment

1. **Connect repository** to Netlify (GitHub/GitLab/Bitbucket)

2. **Set environment variables** in Netlify dashboard → Site settings → Environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EMAILJS_SERVICE_ID=your-service-id
   EMAILJS_TEMPLATE_ID=your-template-id
   EMAILJS_PUBLIC_KEY=your-public-key
   ```

3. **Deploy:** Push to main branch — Netlify auto-builds and deploys

4. **Verify:** Check all routes load correctly, test login/signup, verify contact form

### Supabase Configuration

Ensure the following in your Supabase project:
- **Authentication → URL Configuration:** Set Site URL to your Netlify domain
- **Authentication → URL Configuration:** Add redirect URLs for password reset flow
- **Storage:** `avatars` bucket created with public access for profile images
- **Database:** All migrations applied successfully

---

## 13. Testing

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch
```

### Test Files

| File | Tests | What It Tests |
|------|:-----:|---------------|
| `formatCurrency.test.ts` | 8 | Currency formatting: zero, decimals, large numbers, negatives |
| `constants.test.ts` | 12 | Chart colors length, error messages exist, date formats, pagination constant |
| `audit.test.ts` | 3 | Audit log function exports and parameter types |

### Testing Stack

- **Vitest** — Test runner (fast, Vite-native)
- **jsdom** — Browser environment simulation
- **@testing-library/react** — Component testing utilities
- **@testing-library/jest-dom** — DOM assertion matchers

---

## 14. Troubleshooting

### Common Issues

#### "Supabase not configured" / App loads but shows no data
- Ensure `.env.local` exists with correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart the dev server after changing `.env.local`

#### Login works but data doesn't load
- Check that RLS policies are applied (run the migration SQL)
- Verify the `auth.uid()` matches the `user_id` in your data

#### Contact form returns 500
- Ensure `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, and `EMAILJS_PUBLIC_KEY` are set in `.env.local` (no `NEXT_PUBLIC_` prefix)
- Verify your EmailJS account and template are active

#### Password reset email not received
- Check spam/junk folder
- Verify Supabase Auth → URL Configuration → Site URL matches your domain
- Ensure redirect URL includes `/reset-password`

#### Profile image upload fails
- Ensure `avatars` bucket exists in Supabase Storage
- Check file is under 2MB and is an image type
- Verify storage policies allow authenticated user uploads

#### "Cannot delete this category because it has linked transactions"
- Reassign or delete transactions linked to that category before deleting it

#### Build fails with TypeScript errors
- Run `npm run build` locally to see the exact error
- Ensure all imports reference existing files
- Check for any `any` types that should be properly typed

### Middleware Warning

```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```
This is a Next.js 16 deprecation warning. The middleware still works correctly. This is a non-blocking cosmetic warning.

### Node.js Engine Warning

```
npm warn EBADENGINE
```
This occurs when using Node.js versions that some packages haven't officially declared support for. It is non-blocking and does not affect functionality.

---

## 15. Changelog

### v1.0 — March 7, 2026 (Current)

#### Features Implemented
- Full authentication system (signup, login, logout, password reset)
- Transaction CRUD with search, filter, pagination, and CSV export
- Category management with duplicate and FK protection
- Budget goals with period auto-calculation and progress tracking
- Project management with safe deletion
- Dashboard with charts, monthly navigation, and summary stats
- Profile management with avatar upload
- Contact form with server-side email delivery
- Help page with FAQ
- Privacy Policy and Terms of Service pages

#### Security Hardening
- Moved EmailJS credentials to server-side API route
- Added 7 security headers (CSP, HSTS, X-Frame-Options, etc.)
- Implemented session timeout (30-minute inactivity)
- Added login rate limiting (5 attempts before lockout)
- Added contact form rate limiting (3/min per IP)
- Removed User ID from profile display
- Added React Error Boundary for crash recovery
- Implemented audit logging for all data mutations
- Enabled soft deletes for transactions

#### Performance Optimizations
- Eliminated N+1 queries on transactions and budget goals pages
- Consolidated dashboard from 8+ queries to 3
- Implemented pagination (20 items per page)
- Enabled React Compiler for automatic memoization
- Added loading skeletons for perceived performance

#### UX Improvements
- Toast notifications for all CRUD actions
- Custom confirmation dialogs (replaced browser `confirm()`)
- Reorganized navigation (5 core items + dropdown for extras)
- Real-time password requirements feedback on signup
- Date range filtering on transactions page
- Period dropdown auto-sets budget goal dates
- Responsive mobile navigation with sheet drawer

#### Data Integrity
- Comprehensive client-side validation on all forms
- Duplicate category name prevention
- Duplicate budget goal prevention (overlapping dates)
- FK constraint error handling with friendly messages
- Safe project deletion (unlinks transactions before delete)

#### Code Quality
- Centralized constants and error messages
- Custom `useAuth` hook for consistent auth handling
- TypeScript interfaces for all database entities
- 23 unit tests covering utilities and constants

---

*For technical architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).*
