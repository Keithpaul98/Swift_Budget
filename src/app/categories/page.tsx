import { Tags } from "lucide-react";

// =============================================================================
// Categories Page (Placeholder)
// =============================================================================
// URL: /categories
// Will show: default + custom categories for income and expenses.
// =============================================================================

export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tags className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Categories</h1>
        </div>
      </div>
      <p className="text-muted-foreground">
        Manage your income and expense categories here. Default categories are
        provided, and you can add custom ones.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold text-green-600">Income Categories</h2>
          <p className="text-sm text-muted-foreground">
            Salary, Freelance, Business, etc.
          </p>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold text-red-600">Expense Categories</h2>
          <p className="text-sm text-muted-foreground">
            Food, Transport, Rent, Utilities, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
