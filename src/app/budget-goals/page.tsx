"use client";

// =============================================================================
// Budget Goals Page
// =============================================================================
// Set and track monthly spending limits by category
// =============================================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { formatCurrency } from "@/types/database";
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
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    period: "monthly",
    start_date: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    end_date: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    alert_threshold: "80",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Fetch budget goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("budget_goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (goalsError) {
        console.error("Error fetching budget goals:", goalsError);
      } else {
        // Fetch spending for each goal
        const goalsWithSpending = await Promise.all(
          (goalsData || []).map(async (goal: any) => {
            let categoryName = "Overall Budget";
            let spent = 0;

            if (goal.category_id) {
              const { data: category } = await supabase
                .from("categories")
                .select("name")
                .eq("id", goal.category_id)
                .single();
              categoryName = category?.name || "Unknown";

              const { data: transactions } = await supabase
                .from("transactions")
                .select("amount")
                .eq("user_id", user.id)
                .eq("category_id", goal.category_id)
                .eq("type", "expense")
                .gte("date", goal.start_date)
                .lte("date", goal.end_date);

              spent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            } else {
              const { data: transactions } = await supabase
                .from("transactions")
                .select("amount")
                .eq("user_id", user.id)
                .eq("type", "expense")
                .gte("date", goal.start_date)
                .lte("date", goal.end_date);

              spent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            }

            return {
              ...goal,
              category_name: categoryName,
              spent,
            };
          })
        );

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
      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const goalData = {
        user_id: user.id,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        amount: parseFloat(formData.amount),
        period: formData.period,
        start_date: formData.start_date,
        end_date: formData.end_date,
        alert_threshold: parseInt(formData.alert_threshold),
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
      } else {
        const { error: insertError } = await supabase
          .from("budget_goals")
          .insert([goalData]);

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
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
    } catch (err) {
      setError("Failed to save budget goal");
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
    if (!confirm("Are you sure you want to delete this budget goal?")) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error: deleteError } = await supabase
        .from("budget_goals")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      loadData();
    } catch (err) {
      setError("Failed to delete budget goal");
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

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
                  placeholder="50000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  disabled={saving}
                />
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
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(goal)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)}>
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
    </div>
  );
}
