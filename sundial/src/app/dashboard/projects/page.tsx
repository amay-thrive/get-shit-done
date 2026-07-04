"use client";

import { useState } from "react";
import { FolderKanban, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";

const VERTICALS = ["performance", "health", "wellness", "education"] as const;

export default function ProjectsPage() {
  const utils = trpc.useUtils();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const create = trpc.projects.create.useMutation({
    onSuccess: () => {
      void utils.projects.list.invalidate();
      setShowForm(false);
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    clientId?: string;
    vertical?: (typeof VERTICALS)[number];
  }>({ name: "" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted">
            The studio&apos;s ventures across all four verticals.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> New project
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(form);
          }}
          className="grid gap-3 rounded-xl border border-border-subtle bg-surface p-5 md:grid-cols-4"
        >
          <input
            required
            placeholder="Project name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
          <select
            value={form.clientId ?? ""}
            onChange={(e) => setForm({ ...form, clientId: e.target.value || undefined })}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Client…</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={form.vertical ?? ""}
            onChange={(e) =>
              setForm({
                ...form,
                vertical: (e.target.value || undefined) as typeof form.vertical,
              })
            }
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Vertical…</option>
            {VERTICALS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {create.isPending ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      {!projects?.length ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-surface py-14 text-center">
          <FolderKanban className="h-6 w-6 text-muted" />
          <p className="text-sm text-muted">No projects yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="space-y-3 rounded-xl border border-border-subtle bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{project.name}</h3>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-xs text-muted">
                {(project.clients as { name: string } | null)?.name ?? "No client"}
                {project.vertical && ` · ${project.vertical}`}
              </p>
              {project.description && (
                <p className="line-clamp-2 text-sm text-muted">{project.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
