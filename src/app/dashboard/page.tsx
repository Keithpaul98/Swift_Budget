"use client";

// =============================================================================
// Dashboard Page
// =============================================================================
// Financial overview with statistics, charts, and recent transactions.
// Uses Recharts for data visualization and Supabase for real-time data.
// =============================================================================

import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import Link from "next/link";
import { formatCurrency } from "@/types/database";
import { useAuth } from "@/hooks/useAuth";
// CHART_COLORS moved to dashboard-charts component
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardSkeleton } from "@/components/page-skeleton";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronLeft,
  ChevronRight,
  Rocket,
} from "lucide-react";
// Lazy-load Recharts — it's ~200KB and slow on mobile CPUs
const LazyCharts = lazy(() => import("@/components/dashboard-charts"));
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  budgetUsed: number;
}

interface Transaction {
  id: number;
  amount: number;
  description: string;
  date: string;
  type: "income" | "expense";
  category_name: string;
}

interface CategorySpending {
  name: string;
  amount: number;
}


export default function DashboardPage() {
  const { user, loading: authLoading, supabase } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    budgetUsed: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; income: number; expenses: number }[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);

  const loadDashboardData = useCallback(async (dateForMonth: Date) => {
    if (!user) return;
    setDataLoading(true);
    try {

      // Get selected month date range
      const startDate = startOfMonth(dateForMonth);
      const endDate = endOfMonth(dateForMonth);
      setIsCurrentMonth(
        startDate.getMonth() === new Date().getMonth() &&
        startDate.getFullYear() === new Date().getFullYear()
      );

      // Fetch transactions for current month (with category join — no N+1)
      const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("*, categories(name)")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: false });

      if (transError) {
        console.error("Error fetching transactions:", transError);
        setDataLoading(false);
        return;
      }

      const transactionsWithCategories = (transactions || []).map((t) => ({
        ...t,
        categories: { name: t.categories?.name || "Uncategorized" },
      }));

      // Calculate stats
      const income = transactions
        ?.filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      const expenses = transactions
        ?.filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Fetch budget goals for current month
      const { data: budgets } = await supabase
        .from("budget_goals")
        .select("amount")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .lte("start_date", endDate.toISOString())
        .gte("end_date", startDate.toISOString());

      const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;
      const budgetUsedPercent = totalBudget > 0 ? (expenses / totalBudget) * 100 : 0;

      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        balance: income - expenses,
        budgetUsed: budgetUsedPercent,
      });

      // Format recent transactions
      const formattedTransactions = transactionsWithCategories.slice(0, 5).map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        description: t.description,
        date: t.date,
        type: t.type,
        category_name: t.categories.name,
      }));

      setRecentTransactions(formattedTransactions);

      // Calculate category spending (expenses only)
      const categoryMap = new Map<string, number>();
      transactionsWithCategories
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const category = t.categories.name;
          categoryMap.set(category, (categoryMap.get(category) || 0) + Number(t.amount));
        });

      const categoryData = Array.from(categoryMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);

      setCategorySpending(categoryData);

      // Get last 6 months data for trend chart (single query instead of 6)
      const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
      const { data: allMonthTrans } = await supabase
        .from("transactions")
        .select("amount, type, date")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .gte("date", sixMonthsAgo.toISOString())
        .lte("date", endDate.toISOString());

      // Group by month client-side
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));

        const monthTrans = (allMonthTrans || []).filter((t) => {
          const d = new Date(t.date);
          return d >= monthStart && d <= monthEnd;
        });

        const monthIncome = monthTrans
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const monthExpenses = monthTrans
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        monthlyStats.push({
          month: format(monthStart, "MMM"),
          income: monthIncome,
          expenses: monthExpenses,
        });
      }

      setMonthlyData(monthlyStats);
      setDataLoading(false);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setDataLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading && user) loadDashboardData(selectedDate);
  }, [authLoading, user, selectedDate, loadDashboardData]);

  if (authLoading || dataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-2 mt-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label="Previous month"
                onClick={() => setSelectedDate((prev) => subMonths(prev, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm font-medium text-muted-foreground min-w-[120px] text-center">
                {format(selectedDate, "MMMM yyyy")}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label="Next month"
                disabled={isCurrentMonth}
                onClick={() => setSelectedDate((prev) => {
                  const next = new Date(prev);
                  next.setMonth(next.getMonth() + 1);
                  return next;
                })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isCurrentMonth && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
              )}
            </div>
          </div>
        </div>
        <Link href="/transactions">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Onboarding Card for New Users */}
      {recentTransactions.length === 0 && isCurrentMonth && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 py-4">
            <Rocket className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium">Welcome to SwiftBudget!</p>
              <p className="text-sm text-muted-foreground">
                Start by adding your first transaction, setting up categories, or creating a budget goal.
              </p>
            </div>
            <Link href="/transactions" className="ml-auto flex-shrink-0">
              <Button size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.balance)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.balance >= 0 ? "Positive" : "Negative"} balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.budgetUsed.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Of total budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row — lazy-loaded to reduce initial bundle on mobile */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardContent className="flex h-[350px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></CardContent></Card>
          <Card><CardContent className="flex h-[350px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></CardContent></Card>
        </div>
      }>
        <LazyCharts monthlyData={monthlyData} categorySpending={categorySpending} />
      </Suspense>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        transaction.type === "income"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.category_name} •{" "}
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      transaction.type === "income" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No transactions yet</p>
              <Link href="/transactions">
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Transaction
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
