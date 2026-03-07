# SwiftBudget

A modern personal finance tracker built with Next.js and Supabase. Track income, expenses, budget goals, and projects — all in Malawi Kwacha (MK).

> **Migration in Progress:** This is a rebuild of the original [SwiftBudget Flask app](https://github.com/Keithpaul98/SwiftBudget) using modern web technologies for better performance and easier deployment.

## Features

- ✅ **User Authentication** — Secure signup/login with Supabase Auth
- ✅ **Transaction Management** — Track income and expenses with categories
- ✅ **Budget Goals** — Set spending limits and get alerts
- ✅ **Projects/Tags** — Group related transactions
- ✅ **Visual Dashboard** — Charts and statistics
- ✅ **Profile Management** — Upload profile images, manage settings
- ✅ **MK Currency** — Designed for Malawi Kwacha

## Tech Stack

- **Framework:** Next.js 16 (React 19, TypeScript)
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Charts:** Recharts
- **Deployment:** Netlify

## Getting Started

### Prerequisites

- Node.js 22+ and npm
- A [Supabase](https://supabase.com) account (free tier works)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/swiftbudget-nextjs.git
   cd swiftbudget-nextjs
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Supabase:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy your Project URL and anon key from Settings → API
   - Create a `.env.local` file:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     NEXT_PUBLIC_CURRENCY_SYMBOL=MK
     NEXT_PUBLIC_CURRENCY_CODE=MWK
     ```

4. **Run database migrations:**
   - Go to your Supabase project → SQL Editor
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and click "Run"

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Project Structure

```
swiftbudget/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities (Supabase clients)
│   ├── types/            # TypeScript type definitions
│   └── middleware.ts     # Auth route protection
├── supabase/
│   └── migrations/       # Database schema
├── netlify.toml          # Netlify deployment config
└── .env.local            # Environment variables (not in git)
```

## Development Status

**Phase 1: Project Setup** ✅ Complete
- Next.js project with TypeScript
- Supabase integration
- Database schema with RLS
- Navigation and layout
- Placeholder pages

**Phase 2: Authentication** 🚧 In Progress
- Signup/login pages
- Session management
- Protected routes

**Phase 3-8:** Coming soon (see `NEXTJS_MIGRATION_GUIDE.md`)

## Deployment

Deploy to Netlify:

```bash
npm run build
```

Or connect your GitHub repo to Netlify for automatic deployments.

## Contributing

This is a personal learning project, but suggestions and feedback are welcome!

## License

MIT

## Original Project

This is a migration of the [SwiftBudget Flask application](https://github.com/Keithpaul98/SwiftBudget) to Next.js for improved performance and deployment options.
