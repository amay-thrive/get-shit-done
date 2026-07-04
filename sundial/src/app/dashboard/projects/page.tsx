"use client";

import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { trpc } from "@/lib/trpc";

export default function ProjectsPage() {
  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
        <Button>New Project</Button>
      </div>

      {!projects?.length ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to start tracking work across verticals."
          action={<Button>New Project</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-neutral-200 bg-white p-6 space-y-3"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-neutral-900">{project.name}</h3>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {project.status}
                </span>
              </div>
              {project.description && (
                <p className="text-sm text-neutral-500 line-clamp-2">
                  {project.description}
                </p>
              )}
              {project.vertical && (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                  {project.vertical}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
