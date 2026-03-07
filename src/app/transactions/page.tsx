"use client";

// =============================================================================
// Transactions Page
// =============================================================================
// Full CRUD for transactions: Create, Read, Update, Delete
// Includes filters, search, and category management
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
  ArrowLeftRight,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  X,
} from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: number;
  amount: number;
  description: string;
  transaction_date: string;
  type: "income" | "expense";
  category_id: number;
  project_id: number | null;
  categories: {
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
}

export default function TransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    transaction_date: format(new Date(), "yyyy-MM-dd"),
    type: "expense" as "income" | "expense",
    category_id: "",
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

      // Fetch transactions with categories
      const { data: transData, error: transError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false });

      if (transError) {
        console.error("Error fetching transactions:", transError);
        console.error("Error details:", JSON.stringify(transError, null, 2));
        setTransactions([]);
      } else {
        // Handle empty data
        if (!transData || transData.length === 0) {
          setTransactions([]);
        } else {
          // Fetch category names separately
          const transWithCategories = await Promise.all(
            transData.map(async (t: any) => {
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
          setTransactions(transWithCategories);
        }
      }

      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id, name, type")
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order("name");

      if (catError) {
        console.error("Error fetching categories:", catError);
      } else {
        setCategories(catData || []);
      }

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

      const transactionData = {
        user_id: user.id,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transaction_date: formData.transaction_date,
        type: formData.type,
        category_id: parseInt(formData.category_id),
      };

      if (editingId) {
        // Update existing transaction
        const { error: updateError } = await supabase
          .from("transactions")
          .update(transactionData)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }
      } else {
        // Create new transaction
        const { error: insertError } = await supabase
          .from("transactions")
          .insert([transactionData]);

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      }

      // Reset form and reload data
      setFormData({
        amount: "",
        description: "",
        transaction_date: format(new Date(), "yyyy-MM-dd"),
        type: "expense",
        category_id: "",
      });
      setShowForm(false);
      setEditingId(null);
      setSaving(false);
      loadData();
    } catch (err) {
      setError("Failed to save transaction");
      setSaving(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      transaction_date: transaction.transaction_date.split("T")[0],
      type: transaction.type,
      category_id: transaction.category_id.toString(),
    });
    setEditingId(transaction.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      loadData();
    } catch (err) {
      setError("Failed to delete transaction");
    }
  };

  const handleCancel = () => {
    setFormData({
      amount: "",
      description: "",
      transaction_date: format(new Date(), "yyyy-MM-dd"),
      type: "expense",
      category_id: "",
    });
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categories.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesType;
  });

  // Get categories for selected type
  const availableCategories = categories.filter((c) => c.type === formData.type);

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
          <ArrowLeftRight className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Transactions</h1>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Transaction" : "Add Transaction"}</CardTitle>
            <CardDescription>
              {editingId ? "Update transaction details" : "Record a new income or expense"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Type Toggle */}
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.type === "income" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setFormData({ ...formData, type: "income", category_id: "" })}
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Income
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === "expense" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setFormData({ ...formData, type: "expense", category_id: "" })}
                  >
                    <ArrowDownRight className="mr-2 h-4 w-4" />
                    Expense
                  </Button>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (MK)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="e.g., Grocery shopping"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required
                  disabled={saving}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : editingId ? "Update" : "Add Transaction"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                All
              </Button>
              <Button
                variant={filterType === "income" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("income")}
              >
                Income
              </Button>
              <Button
                variant={filterType === "expense" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("expense")}
              >
                Expenses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
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
                        {transaction.categories.name} •{" "}
                        {format(new Date(transaction.transaction_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-lg font-semibold ${
                        transaction.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowLeftRight className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm || filterType !== "all"
                  ? "No transactions match your filters"
                  : "No transactions yet"}
              </p>
              {!showForm && !searchTerm && filterType === "all" && (
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Transaction
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
