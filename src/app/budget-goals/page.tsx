import { Target } from "lucide-react";

// =============================================================================
// Budget Goals Page (Placeholder)
// =============================================================================
// URL: /budget-goals
// Will show: budget goals with progress bars and alert thresholds.
// =============================================================================

export default function BudgetGoalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Budget Goals</h1>
        </div>
      </div>
      <p className="text-muted-foreground">
        Set spending limits by category or overall. Track progress with visual
        indicators and get alerts when approaching your limits.
      </p>
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        No budget goals set yet. Create your first budget goal to start
        tracking!
      </div>
    </div>
  );
}
