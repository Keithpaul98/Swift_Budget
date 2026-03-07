"use client";

// =============================================================================
// Transactions Page
// =============================================================================
// Full CRUD for transactions: Create, Read, Update, Delete
// Includes filters, search, and category management
// =============================================================================

import { useState, useEffect } from "react";
import { formatCurrency } from "@/types/database";
import { useAuth } from "@/hooks/useAuth";
import { logAudit } from "@/lib/audit";
import { ITEMS_PER_PAGE, ERROR_MESSAGES } from "@/lib/constants";
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
import { ListPageSkeleton } from "@/components/page-skeleton";
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
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: number;
  amount: number;
  description: string;
  date: string;
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

interface Project {
  id: number;
  name: string;
}

export default function TransactionsPage() {
  const { user, loading: authLoading, supabase } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    type: "expense" as "income" | "expense",
    category_id: "",
    project_id: "",
  });

  useEffect(() => {
    if (!authLoading && user) loadData();
  }, [authLoading, user]);

  const loadData = async () => {
    if (!user) return;
    try {
      // Fetch transactions with category join (no N+1 queries)
      const { data: transData, error: transError } = await supabase
        .from("transactions")
        .select("*, categories(name)")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .order("date", { ascending: false });

      if (transError) {
        console.error("Error fetching transactions:", transError);
        setTransactions([]);
      } else {
        const formatted = (transData || []).map((t) => ({
          ...t,
          categories: { name: t.categories?.name || "Uncategorized" },
        }));
        setTransactions(formatted);
      }

      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("id, name, type")
        .or(`user_id.eq.${user!.id},is_default.eq.true`)
        .order("name");

      if (catError) {
        console.error("Error fetching categories:", catError);
      } else {
        setCategories(catData || []);
      }

      // Fetch projects for the project dropdown
      const { data: projData } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .order("name");

      setProjects(projData || []);

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
      if (!formData.description.trim()) {
        setError(ERROR_MESSAGES.descriptionEmpty);
        setSaving(false);
        return;
      }

      if (!user) return;

      const transactionData: Record<string, unknown> = {
        user_id: user.id,
        amount,
        description: formData.description.trim(),
        date: formData.date,
        type: formData.type,
        category_id: parseInt(formData.category_id),
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
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
        await logAudit(supabase, user.id, "update", "transaction", editingId, null, transactionData as Record<string, unknown>);
      } else {
        // Create new transaction
        const { data: inserted, error: insertError } = await supabase
          .from("transactions")
          .insert([transactionData])
          .select("id")
          .single();

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
        if (inserted) {
          await logAudit(supabase, user.id, "create", "transaction", inserted.id, null, transactionData as Record<string, unknown>);
        }
      }

      // Reset form and reload data
      setFormData({
        amount: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd"),
        type: "expense",
        category_id: "",
        project_id: "",
      });
      setShowForm(false);
      setEditingId(null);
      setSaving(false);
      loadData();
      toast.success(editingId ? "Transaction updated" : "Transaction added");
    } catch (err) {
      setError(ERROR_MESSAGES.saveFailed("transaction"));
      setSaving(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: transaction.date.split("T")[0],
      type: transaction.type,
      category_id: transaction.category_id.toString(),
      project_id: transaction.project_id?.toString() || "",
    });
    setEditingId(transaction.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;

    try {
      // Soft delete — set is_deleted flag instead of hard delete
      const { error: deleteError } = await supabase
        .from("transactions")
        .update({ is_deleted: true })
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      await logAudit(supabase, user.id, "delete", "transaction", id);
      loadData();
      toast.success("Transaction deleted");
    } catch (err) {
      setError(ERROR_MESSAGES.deleteFailed("transaction"));
    }
  };

  const handleCancel = () => {
    setFormData({
      amount: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      type: "expense",
      category_id: "",
      project_id: "",
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
    const matchesDateFrom = !dateFrom || t.date >= dateFrom;
    const matchesDateTo = !dateTo || t.date <= dateTo;
    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });

  // Get categories for selected type
  const availableCategories = categories.filter((c) => c.type === formData.type);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, dateFrom, dateTo]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const rows = filteredTransactions.map((t) => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.categories.name,
      t.type,
      t.amount.toString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `swiftbudget-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || dataLoading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowLeftRight className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Transactions</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
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
                  min="0.01"
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

              {/* Project (Optional) */}
              {projects.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="project">Project (Optional)</Label>
                  <select
                    id="project"
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    disabled={saving}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">No project</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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

          {/* Date Range Filter */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center mt-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">From:</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm whitespace-nowrap">To:</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-auto"
              />
            </div>
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setDateFrom(""); setDateTo(""); }}
              >
                <X className="mr-1 h-3 w-3" />
                Clear dates
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? "s" : ""}
            {totalPages > 1 && ` — Page ${currentPage} of ${totalPages}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedTransactions.length > 0 ? (
            <div className="space-y-4">
              {paginatedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-2 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 flex-shrink-0 ${
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
                    <div className="min-w-0">
                      <p className="font-medium truncate">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {transaction.categories.name} •{" "}
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:gap-4 pl-11 sm:pl-0">
                    <div
                      className={`text-lg font-semibold ${
                        transaction.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit transaction"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete transaction"
                        onClick={() => setDeleteId(transaction.id)}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
