import { FolderKanban } from "lucide-react";

// =============================================================================
// Projects Page (Placeholder)
// =============================================================================
// URL: /projects
// Will show: projects/tags to group related transactions together.
// =============================================================================

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Projects</h1>
        </div>
      </div>
      <p className="text-muted-foreground">
        Group related transactions into projects. Great for tracking spending on
        specific goals like &quot;Home Renovation&quot; or &quot;Wedding
        Budget&quot;.
      </p>
      <div className="rounded-lg border p-12 text-center text-muted-foreground">
        No projects yet. Create your first project to organize transactions!
      </div>
    </div>
  );
}
