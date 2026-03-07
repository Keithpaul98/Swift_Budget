"use client";

// =============================================================================
// Dashboard Page
// =============================================================================
// Financial overview with statistics, charts, and recent transactions.
// Uses Recharts for data visualization and Supabase for real-time data.
// =============================================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Plus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
  transaction_date: string;
  type: "income" | "expense";
  category_name: string;
}

interface CategorySpending {
  name: string;
  amount: number;
}

const CHART_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    budgetUsed: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const supabase = createClient();

      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        router.push("/login");
        return;
      }

      // Get current month date range
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());

      // Fetch transactions for current month
      const { data: transactions, error: transError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("transaction_date", startDate.toISOString())
        .lte("transaction_date", endDate.toISOString())
        .order("transaction_date", { ascending: false });

      if (transError) {
        console.error("Error fetching transactions:", transError);
        setLoading(false);
        return;
      }

      // Fetch category names for transactions
      const transactionsWithCategories = await Promise.all(
        (transactions || []).map(async (t: any) => {
          const { data: category } = await supabase
            .from("categories")
            .select("name")
            .eq("id", t.category_id)
            .single();
          
          return {
            ...t,
            categories: { name: category?.name || "Uncategorized" },
          };
        })
      );

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
        .select("target_amount")
        .eq("user_id", user.id)
        .gte("start_date", startDate.toISOString())
        .lte("end_date", endDate.toISOString());

      const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.target_amount), 0) || 0;
      const budgetUsedPercent = totalBudget > 0 ? (expenses / totalBudget) * 100 : 0;

      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        balance: income - expenses,
        budgetUsed: budgetUsedPercent,
      });

      // Format recent transactions
      const formattedTransactions = transactionsWithCategories.slice(0, 5).map((t: any) => ({
        id: t.id,
        amount: Number(t.amount),
        description: t.description,
        transaction_date: t.transaction_date,
        type: t.type,
        category_name: t.categories.name,
      }));

      setRecentTransactions(formattedTransactions);

      // Calculate category spending (expenses only)
      const categoryMap = new Map<string, number>();
      transactionsWithCategories
        .filter((t) => t.type === "expense")
        .forEach((t: any) => {
          const category = t.categories.name;
          categoryMap.set(category, (categoryMap.get(category) || 0) + Number(t.amount));
        });

      const categoryData = Array.from(categoryMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);

      setCategorySpending(categoryData);

      // Get last 6 months data for trend chart
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));

        const { data: monthTrans } = await supabase
          .from("transactions")
          .select("amount, type")
          .eq("user_id", user.id)
          .gte("transaction_date", monthStart.toISOString())
          .lte("transaction_date", monthEnd.toISOString());

        const monthIncome = monthTrans
          ?.filter((t) => t.type === "income")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        const monthExpenses = monthTrans
          ?.filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

        monthlyStats.push({
          month: format(monthStart, "MMM"),
          income: monthIncome,
          expenses: monthExpenses,
        });
      }

      setMonthlyData(monthlyStats);
      setLoading(false);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setLoading(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "MMMM yyyy")}
            </p>
          </div>
        </div>
        <Link href="/transactions">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </Link>
      </div>

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

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Income vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Last 6 months trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Income" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Spending Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Top categories this month</CardDescription>
          </CardHeader>
          <CardContent>
            {categorySpending.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySpending}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No expense data for this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                        {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
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
