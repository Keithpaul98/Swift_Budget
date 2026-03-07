import { ArrowLeftRight } from "lucide-react";

// =============================================================================
// Transactions Page (Placeholder)
// =============================================================================
// URL: /transactions
// Will show: list of income/expense transactions with filters and search.
// =============================================================================

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Transactions</h1>
        </div>
      </div>
      <p className="text-muted-foreground">
        Your transactions will appear here. You&apos;ll be able to add, edit,
        delete, filter, and search transactions.
      </p>
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        No transactions yet. Add your first transaction to get started!
      </div>
    </div>
  );
}
