"use client";

// =============================================================================
// Budget Goals Page
// =============================================================================
// Set and track monthly spending limits by category
// =============================================================================

import { useState, useEffect } from "react";
import { formatCurrency } from "@/types/database";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { ERROR_MESSAGES } from "@/lib/constants";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { GridPageSkeleton } from "@/components/page-skeleton";
import { format, startOfMonth, endOfMonth, addWeeks, addYears, startOfWeek, endOfWeek } from "date-fns";

interface BudgetGoal {
  id: number;
  category_id: number | null;
  amount: number;
  period: string;
  start_date: string;
  end_date: string;
  alert_threshold: number;
  is_active: boolean;
  category_name?: string;
  spent?: number;
}

interface Category {
  id: number;
  name: string;
  type: string;
}

export default function BudgetGoalsPage() {
  const { user, loading: authLoading, supabase } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    period: "monthly",
    start_date: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end_date: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    alert_threshold: "80",
  });

  // BUG-004 fix: Auto-set date ranges when period changes
  const handlePeriodChange = (period: string) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case "weekly":
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case "yearly":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case "monthly":
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
    }

    setFormData((prev) => ({
      ...prev,
      period,
      start_date: format(start, "yyyy-MM-dd"),
      end_date: format(end, "yyyy-MM-dd"),
    }));
  };

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user]);

  const loadData = async () => {
    if (!user) return;
    try {

      // Fetch budget goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("budget_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (goalsError) {
        console.error("Error fetching budget goals:", goalsError);
      } else {
        // Batch fetch all categories and expenses (no N+1)
        const allGoals = goalsData || [];
        const categoryIds = [...new Set(allGoals.map((g: BudgetGoal) => g.category_id).filter(Boolean))];

        // Fetch all needed categories in one query
        let categoryMap = new Map<number, string>();
        if (categoryIds.length > 0) {
          const { data: cats } = await supabase
            .from("categories")
            .select("id, name")
            .in("id", categoryIds);
          (cats || []).forEach((c) => categoryMap.set(c.id, c.name));
        }

        // Fetch all user expenses in one query
        const { data: allExpenses } = await supabase
          .from("transactions")
          .select("amount, category_id, date")
          .eq("user_id", user.id)
          .eq("type", "expense")
          .eq("is_deleted", false);

        const goalsWithSpending = allGoals.map((goal: BudgetGoal) => {
          const categoryName = goal.category_id
            ? categoryMap.get(goal.category_id) || "Unknown"
            : "Overall Budget";

          const relevantExpenses = (allExpenses || []).filter((t) => {
            const inDateRange = t.date >= goal.start_date && t.date <= goal.end_date;
            if (goal.category_id) {
              return inDateRange && t.category_id === goal.category_id;
            }
            return inDateRange;
          });

          const spent = relevantExpenses.reduce((sum, t) => sum + Number(t.amount), 0);

          return { ...goal, category_name: categoryName, spent };
        });

        setBudgetGoals(goalsWithSpending);
      }

      // Fetch categories
      const { data: catData } = await supabase
        .from("categories")
        .select("id, name, type")
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .eq("type", "expense")
        .order("name");

      setCategories(catData || []);
      setDataLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Client-side validation
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        setError(ERROR_MESSAGES.amountPositive);
        setSaving(false);
        return;
      }
      if (formData.end_date <= formData.start_date) {
        setError(ERROR_MESSAGES.endDateAfterStart);
        setSaving(false);
        return;
      }
      const threshold = parseInt(formData.alert_threshold);
      if (isNaN(threshold) || threshold < 1 || threshold > 100) {
        setError(ERROR_MESSAGES.thresholdRange);
        setSaving(false);
        return;
      }

      if (!user) return;

      // BUG-003 fix: Check for duplicate budget goal (same category + overlapping dates)
      const categoryIdNum = formData.category_id ? parseInt(formData.category_id) : null;
      const duplicate = budgetGoals.find(
        (g) =>
          g.id !== editingId &&
          g.category_id === categoryIdNum &&
          g.start_date <= formData.end_date &&
          g.end_date >= formData.start_date
      );
      if (duplicate) {
        setError("A budget goal for this category already exists in the selected date range.");
        setSaving(false);
        return;
      }

      const goalData = {
        user_id: user.id,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        amount,
        period: formData.period,
        start_date: formData.start_date,
        end_date: formData.end_date,
        alert_threshold: threshold,
        is_active: true,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("budget_goals")
          .update(goalData)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }
        await logAudit(supabase, user.id, "update", "budget_goal", editingId, null, goalData as Record<string, unknown>);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("budget_goals")
          .insert([goalData])
          .select("id")
          .single();

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
        if (inserted) {
          await logAudit(supabase, user.id, "create", "budget_goal", inserted.id, null, goalData as Record<string, unknown>);
        }
      }

      setFormData({
        category_id: "",
        amount: "",
        period: "monthly",
        start_date: format(startOfMonth(new Date()), "yyyy-MM-dd"),
        end_date: format(endOfMonth(new Date()), "yyyy-MM-dd"),
        alert_threshold: "80",
      });
      setShowForm(false);
      setEditingId(null);
      setSaving(false);
      loadData();
      toast.success(editingId ? "Budget goal updated" : "Budget goal added");
    } catch (err) {
      setError(ERROR_MESSAGES.saveFailed("budget goal"));
      setSaving(false);
    }
  };

  const handleEdit = (goal: BudgetGoal) => {
    setFormData({
      category_id: goal.category_id?.toString() || "",
      amount: goal.amount.toString(),
      period: goal.period,
      start_date: goal.start_date,
      end_date: goal.end_date,
      alert_threshold: goal.alert_threshold.toString(),
    });
    setEditingId(goal.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from("budget_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      await logAudit(supabase, user.id, "delete", "budget_goal", id);
      loadData();
      toast.success("Budget goal deleted");
    } catch (err) {
      setError(ERROR_MESSAGES.deleteFailed("budget goal"));
    }
  };

  const handleCancel = () => {
    setFormData({
      category_id: "",
      amount: "",
      period: "monthly",
      start_date: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      end_date: format(endOfMonth(new Date()), "yyyy-MM-dd"),
      alert_threshold: "80",
    });
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const getProgressColor = (percentage: number, threshold: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= threshold) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusIcon = (percentage: number, threshold: number) => {
    if (percentage >= 100) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (percentage >= threshold) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  };

  if (authLoading || dataLoading) {
    return <GridPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Budget Goals</h1>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Budget Goal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Budget Goal" : "Add Budget Goal"}</CardTitle>
            <CardDescription>
              Set spending limits to track your budget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="category">Category (Optional)</Label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  disabled={saving}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Overall Budget (All Categories)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Budget Amount (MK)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Period</Label>
                <select
                  id="period"
                  value={formData.period}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  disabled={saving}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Changing the period will auto-set the date range below
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert_threshold">Alert Threshold (%)</Label>
                <Input
                  id="alert_threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.alert_threshold}
                  onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
                  required
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Get alerted when you reach this percentage of your budget
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : editingId ? "Update" : "Add Goal"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {budgetGoals.map((goal) => {
          const percentage = goal.amount > 0 ? (goal.spent! / goal.amount) * 100 : 0;
          const remaining = goal.amount - goal.spent!;

          return (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(percentage, goal.alert_threshold)}
                    <div>
                      <CardTitle>{goal.category_name}</CardTitle>
                      <CardDescription>
                        {format(new Date(goal.start_date), "MMM d")} -{" "}
                        {format(new Date(goal.end_date), "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Edit budget goal" onClick={() => handleEdit(goal)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete budget goal" onClick={() => setDeleteId(goal.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Spent: {formatCurrency(goal.spent!)}
                  </span>
                  <span className="font-medium">
                    Budget: {formatCurrency(goal.amount)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {percentage.toFixed(1)}% used
                    </span>
                    <span className={remaining >= 0 ? "text-green-600" : "text-red-600"}>
                      {remaining >= 0 ? formatCurrency(remaining) : formatCurrency(Math.abs(remaining))} {remaining >= 0 ? "remaining" : "over budget"}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all ${getProgressColor(percentage, goal.alert_threshold)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {percentage >= goal.alert_threshold && (
                  <div className={`rounded-lg p-3 text-sm ${percentage >= 100 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {percentage >= 100
                      ? "⚠️ You've exceeded your budget!"
                      : `⚠️ You've reached ${goal.alert_threshold}% of your budget`}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {budgetGoals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No budget goals yet</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Budget Goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Budget Goal"
        description="Are you sure you want to delete this budget goal? This action cannot be undone."
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
