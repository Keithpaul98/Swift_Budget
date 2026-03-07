"use client";

// =============================================================================
// Projects Page
// =============================================================================
// Group related transactions into projects/tags
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
  FolderKanban,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (projectsError) {
        console.error("Error fetching projects:", projectsError);
      } else {
        // Fetch transaction stats for each project
        const projectsWithStats = await Promise.all(
          (projectsData || []).map(async (project: any) => {
            const { data: transactions } = await supabase
              .from("transactions")
              .select("amount")
              .eq("user_id", user.id)
              .eq("project_id", project.id);

            const totalSpent = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
            const transactionCount = transactions?.length || 0;

            return {
              ...project,
              total_spent: totalSpent,
              transaction_count: transactionCount,
            };
          })
        );

        setProjects(projectsWithStats);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading projects:", err);
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

      const projectData = {
        user_id: user.id,
        name: formData.name,
        description: formData.description || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
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
      } else {
        const { error: insertError } = await supabase
          .from("projects")
          .insert([projectData]);

        if (insertError) {
          setError(insertError.message);
          setSaving(false);
          return;
        }
      }

      setFormData({ name: "", description: "", budget: "" });
      setShowForm(false);
      setEditingId(null);
      setSaving(false);
      loadProjects();
    } catch (err) {
      setError("Failed to save project");
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
    if (!confirm("Are you sure you want to delete this project? Transactions will not be deleted, but will be unlinked from this project.")) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error: deleteError } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      loadProjects();
    } catch (err) {
      setError("Failed to delete project");
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "", budget: "" });
    setShowForm(false);
    setEditingId(null);
    setError(null);
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
          <FolderKanban className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

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
        {projects.map((project) => (
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
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(project)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
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

        {projects.length === 0 && (
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
    </div>
  );
}
