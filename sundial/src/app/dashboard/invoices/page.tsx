"use client";

import { useState } from "react";
import { Receipt, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function InvoicesPage() {
  const utils = trpc.useUtils();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const create = trpc.invoices.create.useMutation({
    onSuccess: () => {
      void utils.invoices.list.invalidate();
      setShowForm(false);
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientId: "", amount: "", dueDate: "" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Invoices</h1>
          <p className="mt-1 text-sm text-muted">
            The revenue-sentinel agent chases overdue invoices automatically — with your approval.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> New invoice
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              clientId: form.clientId,
              amountCents: Math.round(parseFloat(form.amount) * 100),
              dueDate: form.dueDate || undefined,
            });
          }}
          className="grid gap-3 rounded-xl border border-border-subtle bg-surface p-5 md:grid-cols-4"
        >
          <select
            required
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Client…</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Amount (USD)"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm outline-none focus:border-accent [color-scheme:dark]"
          />
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {create.isPending ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      {!invoices?.length ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-surface py-14 text-center">
          <Receipt className="h-6 w-6 text-muted" />
          <p className="text-sm text-muted">No invoices yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-medium">Number</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Due</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-surface-raised">
                  <td className="px-5 py-3.5 font-mono text-xs">{invoice.number}</td>
                  <td className="px-5 py-3.5 text-muted">
                    {(invoice.clients as { name: string } | null)?.name ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 font-medium tabular-nums">
                    {formatCurrency(invoice.amount_cents, invoice.currency)}
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={invoice.status} />
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
