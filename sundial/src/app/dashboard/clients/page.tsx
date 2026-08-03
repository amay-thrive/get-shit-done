"use client";

import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";

const VERTICALS = ["performance", "health", "wellness", "education"] as const;

export default function ClientsPage() {
  const utils = trpc.useUtils();
  const { data: clients } = trpc.clients.list.useQuery();
  const create = trpc.clients.create.useMutation({
    onSuccess: () => {
      void utils.clients.list.invalidate();
      setShowForm(false);
      setForm({ name: "", email: "", company: "", vertical: undefined });
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    email: string;
    company: string;
    vertical?: (typeof VERTICALS)[number];
  }>({ name: "", email: "", company: "", vertical: undefined });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-muted">
            Health scores are computed automatically by the client-intel agent.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> Add client
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              name: form.name,
              email: form.email || undefined,
              company: form.company || undefined,
              vertical: form.vertical,
            });
          }}
          className="grid gap-3 rounded-xl border border-border-subtle bg-surface p-5 md:grid-cols-4"
        >
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
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

      {!clients?.length ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-surface py-14 text-center">
          <Users className="h-6 w-6 text-muted" />
          <p className="text-sm text-muted">
            No clients yet. Adding one emits <span className="font-mono text-accent">client.created</span> —
            and wakes the client-intel agent.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Vertical</th>
                <th className="px-5 py-3 font-medium">Health</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-surface-raised">
                  <td className="px-5 py-3.5">
                    <div className="font-medium">{client.name}</div>
                    <div className="text-xs text-muted">{client.email ?? client.company ?? "—"}</div>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{client.vertical ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    {client.health_score !== null ? (
                      <span
                        className={
                          client.health_score >= 70
                            ? "text-emerald-400"
                            : client.health_score >= 40
                              ? "text-amber-400"
                              : "text-red-400"
                        }
                      >
                        {client.health_score}
                      </span>
                    ) : (
                      <span className="text-muted">pending</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={client.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
