"use client";

import { ShieldCheck, Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";
import { formatRelativeTime } from "@/lib/utils";

export default function ApprovalsPage() {
  const utils = trpc.useUtils();
  const { data: pending } = trpc.approvals.pending.useQuery();
  const { data: history } = trpc.approvals.history.useQuery({ limit: 20 });
  const decide = trpc.approvals.decide.useMutation({
    onSettled: () => {
      void utils.approvals.invalidate();
      void utils.dashboard.kpis.invalidate();
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Approvals</h1>
        <p className="mt-1 text-sm text-muted">
          Agents propose; you decide. Every outbound action stops here first.
        </p>
      </div>

      {!pending?.length ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-surface py-14 text-center">
          <ShieldCheck className="h-6 w-6 text-emerald-400" />
          <p className="text-sm text-muted">Queue is clear. Nothing needs your sign-off.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((approval) => {
            const payload = approval.action_payload as Record<string, unknown>;
            return (
              <div
                key={approval.id}
                className="rounded-xl border border-amber-500/30 bg-surface p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-accent">
                        {(approval.agent_definitions as { name: string } | null)?.name}
                      </span>
                      <span className="font-mono text-[10px] text-muted">
                        {approval.tool_name}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{approval.action_summary}</p>
                    <p className="text-[11px] text-muted">
                      {formatRelativeTime(approval.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() =>
                        decide.mutate({ id: approval.id, decision: "rejected" })
                      }
                      disabled={decide.isPending}
                      className="flex items-center gap-1.5 rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-muted transition-colors hover:border-red-500/40 hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      onClick={() =>
                        decide.mutate({ id: approval.id, decision: "approved" })
                      }
                      disabled={decide.isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                  </div>
                </div>
                {typeof payload.body === "string" && (
                  <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-lg bg-background p-4 font-mono text-[11px] leading-relaxed text-muted">
                    {String(payload.subject ? `Subject: ${payload.subject}\n\n` : "")}
                    {payload.body}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}

      {history && history.length > 0 && (
        <div className="rounded-xl border border-border-subtle bg-surface">
          <div className="border-b border-border-subtle px-5 py-3.5">
            <h2 className="text-sm font-semibold">Decision history</h2>
          </div>
          <ul className="divide-y divide-border-subtle">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-4 px-5 py-3">
                <span className="min-w-0 flex-1 truncate text-xs">{h.action_summary}</span>
                <StatusBadge status={h.status} />
                <span className="w-16 text-right text-[11px] text-muted">
                  {h.decided_at ? formatRelativeTime(h.decided_at) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
