import Link from "next/link";
import {
  Wallet,
  ArrowLeftRight,
  Target,
  BarChart3,
  Shield,
  Zap,
} from "lucide-react";

// =============================================================================
// Home Page (Landing Page)
// =============================================================================
// This is a Server Component by default (no "use client" needed).
// Server Components render on the server and send HTML to the browser.
// They're great for static content like this landing page.
//
// We use plain Tailwind classes on <Link> elements here instead of the
// Button component, because Button uses @base-ui/react which is client-only.
// =============================================================================

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex items-center gap-3">
          <Wallet className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            SwiftBudget
          </h1>
        </div>
        <p className="max-w-lg text-lg text-muted-foreground">
          Take control of your finances. Track income, manage expenses, and
          reach your budget goals — all in Malawi Kwacha (MK).
        </p>
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Get Started
          </Link>
          <Link
            href="/transactions"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
          >
            View Transactions
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid w-full max-w-4xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            icon: ArrowLeftRight,
            title: "Track Transactions",
            description:
              "Record income and expenses with categories, dates, and descriptions.",
          },
          {
            icon: Target,
            title: "Budget Goals",
            description:
              "Set weekly, monthly, or yearly budgets and get alerts when approaching limits.",
          },
          {
            icon: BarChart3,
            title: "Visual Dashboard",
            description:
              "See your spending trends with interactive charts and quick stats.",
          },
          {
            icon: Shield,
            title: "Secure & Private",
            description:
              "Your financial data is protected with Supabase authentication and RLS.",
          },
          {
            icon: Zap,
            title: "Fast & Modern",
            description:
              "Built with Next.js for instant page loads and a smooth experience.",
          },
          {
            icon: Wallet,
            title: "MK Currency",
            description:
              "Designed for Malawi Kwacha with proper formatting throughout.",
          },
        ].map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-3 rounded-lg border p-6 transition-colors hover:bg-accent/50"
          >
            <feature.icon className="h-8 w-8 text-primary" />
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
