"use client";

// =============================================================================
// Categories Page
// =============================================================================
// Manage income and expense categories (default + custom)
// =============================================================================

import { useState, useEffect } from "react";
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
  Tags,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ListPageSkeleton } from "@/components/page-skeleton";

interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  is_default: boolean;
  user_id: string | null;
}

export default function CategoriesPage() {
  const { user, loading: authLoading, supabase } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; isDefault: boolean } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "expense" as "income" | "expense",
  });

  useEffect(() => {
    if (!authLoading && user) loadCategories();
  }, [authLoading, user]);

  const loadCategories = async () => {
    if (!user) return;
    try {
      const { data, error: catError } = await supabase
        .from("categories")
        .select("*")
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .order("name");

      if (catError) {
        console.error("Error fetching categories:", catError);
      } else {
        setCategories(data || []);
      }

      setDataLoading(false);
    } catch (err) {
      console.error("Error loading categories:", err);
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!user) return;

      // Validate name is not whitespace-only
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        setError(ERROR_MESSAGES.nameEmpty("Category"));
        setSaving(false);
        return;
      }

      // BUG-001 fix: Check for duplicate category name
      const duplicate = categories.find(
        (c) =>
          c.name.toLowerCase() === trimmedName.toLowerCase() &&
          c.type === formData.type &&
          c.id !== editingId
      );
      if (duplicate) {
        setError(`A ${formData.type} category named "${trimmedName}" already exists.`);
        setSaving(false);
        return;
      }

      const categoryData = {
        name: trimmedName,
        type: formData.type,
        user_id: user.id,
        is_default: false,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("categories")
          .update({ name: trimmedName, type: formData.type })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }
        await logAudit(supabase, user.id, "update", "category", editingId, null, { name: trimmedName, type: formData.type });
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("categories")
          .insert([categoryData])
          .select("id")
          .single();

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
        if (inserted) {
          await logAudit(supabase, user.id, "create", "category", inserted.id, null, categoryData);
        }
      }

      setFormData({ name: "", type: "expense" });
      setShowForm(false);
      setEditingId(null);
      setSaving(false);
      loadCategories();
      toast.success(editingId ? "Category updated" : "Category added");
    } catch (err) {
      setError(ERROR_MESSAGES.saveFailed("category"));
      setSaving(false);
    }
  };

  const handleEdit = (category: Category) => {
    if (category.is_default) {
      setError("Cannot edit default categories");
      return;
    }
    setFormData({
      name: category.name,
      type: category.type,
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        if (deleteError.message.includes("violates foreign key") || deleteError.code === "23503") {
          setError("Cannot delete this category because it has linked transactions. Please reassign or delete those transactions first.");
        } else {
          setError(deleteError.message);
        }
        return;
      }

      await logAudit(supabase, user.id, "delete", "category", id);
      loadCategories();
      toast.success("Category deleted");
    } catch (err) {
      setError(ERROR_MESSAGES.deleteFailed("category"));
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", type: "expense" });
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  if (authLoading || dataLoading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Tags className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Categories</h1>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Category" : "Add Category"}</CardTitle>
            <CardDescription>
              {editingId ? "Update category details" : "Create a new custom category"}
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
                    onClick={() => setFormData({ ...formData, type: "income" })}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Income
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === "expense" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setFormData({ ...formData, type: "expense" })}
                  >
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Expense
                  </Button>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Entertainment, Investments"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : editingId ? "Update" : "Add Category"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Income Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="h-5 w-5" />
              Income Categories
            </CardTitle>
            <CardDescription>
              {incomeCategories.length} categor{incomeCategories.length !== 1 ? "ies" : "y"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {incomeCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    {category.is_default && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Default
                      </span>
                    )}
                  </div>
                  {!category.is_default && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit category"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete category"
                        onClick={() => setDeleteTarget({ id: category.id, isDefault: category.is_default })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {incomeCategories.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No income categories yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <TrendingDown className="h-5 w-5" />
              Expense Categories
            </CardTitle>
            <CardDescription>
              {expenseCategories.length} categor{expenseCategories.length !== 1 ? "ies" : "y"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenseCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    {category.is_default && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Default
                      </span>
                    )}
                  </div>
                  {!category.is_default && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit category"
                        onClick={() => handleEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete category"
                        onClick={() => setDeleteTarget({ id: category.id, isDefault: category.is_default })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {expenseCategories.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No expense categories yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Category"
        description={deleteTarget?.isDefault
          ? "Default categories cannot be deleted."
          : "Are you sure you want to delete this category? Transactions using it may be affected."}
        onConfirm={() => {
          if (deleteTarget && !deleteTarget.isDefault) {
            handleDelete(deleteTarget.id);
          } else if (deleteTarget?.isDefault) {
            setError("Cannot delete default categories");
          }
          setDeleteTarget(null);
        }}
        confirmLabel={deleteTarget?.isDefault ? "OK" : "Delete"}
      />
    </div>
  );
}
