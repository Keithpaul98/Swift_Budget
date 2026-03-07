import { LayoutDashboard } from "lucide-react";

// =============================================================================
// Dashboard Page (Placeholder)
// =============================================================================
// In Next.js, the file path determines the URL:
//   src/app/dashboard/page.tsx  →  http://localhost:3000/dashboard
//
// This is called "file-based routing" — no need to define routes manually
// like Flask's @app.route('/dashboard'). Just create folders and page.tsx files!
// =============================================================================

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      <p className="text-muted-foreground">
        Your financial overview will appear here — balance, income vs expenses
        charts, spending by category, and recent transactions.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {["Total Balance", "Income", "Expenses", "Budget Used"].map((stat) => (
          <div
            key={stat}
            className="rounded-lg border p-6 text-center"
          >
            <p className="text-sm text-muted-foreground">{stat}</p>
            <p className="mt-2 text-2xl font-bold">MK 0.00</p>
          </div>
        ))}
      </div>
    </div>
  );
}
