"use client";

// =============================================================================
// Projects Page
// =============================================================================
// Group related transactions into projects/tags
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
  FolderKanban,
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";
import { GridPageSkeleton } from "@/components/page-skeleton";

interface Project {
  id: number;
  name: string;
  description: string | null;
  budget: number | null;
  is_active: boolean;
  total_spent?: number;
  transaction_count?: number;
}

export default function ProjectsPage() {
  const { user, loading: authLoading, supabase } = useAuth();
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
  });

  useEffect(() => {
    if (!authLoading && user) loadProjects();
  }, [authLoading, user]);

  const loadProjects = async () => {
    if (!user) return;
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
      } else {
        // Batch-fetch ALL project transactions in one query (fixes N+1)
        const { data: allTransactions } = await supabase
          .from("transactions")
          .select("amount, project_id")
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .not("project_id", "is", null);

        // Group transaction stats by project_id client-side
        const statsMap = new Map<number, { total: number; count: number }>();
        (allTransactions || []).forEach((t) => {
          const existing = statsMap.get(t.project_id) || { total: 0, count: 0 };
          existing.total += Number(t.amount);
          existing.count += 1;
          statsMap.set(t.project_id, existing);
        });

        const projectsWithStats = (projectsData || []).map((project: Project) => ({
          ...project,
          total_spent: statsMap.get(project.id)?.total || 0,
          transaction_count: statsMap.get(project.id)?.count || 0,
        }));

        setProjects(projectsWithStats);
      }

      setDataLoading(false);
    } catch (err) {
      console.error("Error loading projects:", err);
      setDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      if (!user) return;

      // Validate name
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        setError(ERROR_MESSAGES.nameEmpty("Project"));
        setSaving(false);
        return;
      }

      const budgetValue = formData.budget ? parseFloat(formData.budget) : null;
      if (budgetValue !== null && budgetValue <= 0) {
        setError(ERROR_MESSAGES.budgetPositive);
        setSaving(false);
        return;
      }

      const projectData = {
        user_id: user.id,
        name: trimmedName,
        description: formData.description.trim() || null,
        budget: budgetValue,
        is_active: true,
      };

      if (editingId) {
        const { error: updateError } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (updateError) {
          setError(updateError.message);
          setSaving(false);
          return;
        }
        await logAudit(supabase, user.id, "update", "project", editingId, null, projectData as Record<string, unknown>);
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("projects")
          .insert([projectData])
          .select("id")
          .single();

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
        if (inserted) {
          await logAudit(supabase, user.id, "create", "project", inserted.id, null, projectData as Record<string, unknown>);
        }
      }

      setFormData({ name: "", description: "", budget: "" });
      setShowForm(false);
      setEditingId(null);
      setSaving(false);
      loadProjects();
      toast.success(editingId ? "Project updated" : "Project added");
    } catch (err) {
      setError(ERROR_MESSAGES.saveFailed("project"));
      setSaving(false);
    }
  };

  const handleEdit = (project: Project) => {
    setFormData({
      name: project.name,
      description: project.description || "",
      budget: project.budget?.toString() || "",
    });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!user) return;

    try {
      // BUG-005 fix: Unlink transactions before deleting project
      await supabase
        .from("transactions")
        .update({ project_id: null })
        .eq("project_id", id)
        .eq("user_id", user.id);

      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      await logAudit(supabase, user.id, "delete", "project", id);
      loadProjects();
      toast.success("Project deleted");
    } catch (err) {
      setError(ERROR_MESSAGES.deleteFailed("project"));
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "", budget: "" });
    setShowForm(false);
    setEditingId(null);
    setError(null);
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || dataLoading) {
    return <GridPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Search */}
      {projects.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Project" : "Add Project"}</CardTitle>
            <CardDescription>
              Group related transactions together
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
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., Home Renovation, Wedding"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Brief description of the project"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget (Optional)</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? "Saving..." : editingId ? "Update" : "Add Project"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.description && (
                      <CardDescription className="mt-1">
                        {project.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Edit project" onClick={() => handleEdit(project)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete project" onClick={() => setDeleteId(project.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Spent:</span>
                <span className="font-medium">{formatCurrency(project.total_spent || 0)}</span>
              </div>
              {project.budget && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">{formatCurrency(project.budget)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transactions:</span>
                <span className="font-medium">{project.transaction_count}</span>
              </div>
              {project.budget && (
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min((project.total_spent! / project.budget) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {((project.total_spent! / project.budget) * 100).toFixed(1)}% of budget used
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredProjects.length === 0 && !searchTerm && projects.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">No projects yet</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Project"
        description="Are you sure you want to delete this project? Transactions will not be deleted, but will be unlinked from this project."
        onConfirm={() => {
          if (deleteId) handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
