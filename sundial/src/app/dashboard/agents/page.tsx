"use client";

import Link from "next/link";
import { Bot, Play, Clock, Zap, Link2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";
import { formatCost } from "@/lib/costs";
import { formatRelativeTime, cn } from "@/lib/utils";

const TRIGGER_ICON: Record<string, typeof Clock> = {
  cron: Clock,
  event: Zap,
  chain: Link2,
  manual: Play,
};

export default function AgentsPage() {
  const utils = trpc.useUtils();
  const { data: agents } = trpc.agents.list.useQuery();
  const { data: runs } = trpc.agents.runs.useQuery({ limit: 20 });
  const trigger = trpc.agents.trigger.useMutation({
    onSettled: () => utils.agents.runs.invalidate(),
  });
  const toggle = trpc.agents.toggle.useMutation({
    onSettled: () => utils.agents.list.invalidate(),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Agent Fleet</h1>
        <p className="mt-1 text-sm text-muted">
          Autonomous operators with durable runs, human approval gates, and shared memory.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {agents?.map((agent) => {
          const triggers = (agent.triggers ?? []) as { type: string; match?: string; schedule?: string }[];
          return (
            <div
              key={agent.id}
              className={cn(
                "rounded-xl border border-border-subtle bg-surface p-5 transition-opacity",
                !agent.enabled && "opacity-50"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent-soft p-2">
                    <Bot className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-semibold">{agent.name}</h3>
                    <p className="text-[11px] text-muted">{agent.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      toggle.mutate({ id: agent.id, enabled: !agent.enabled })
                    }
                    className="text-[11px] text-muted hover:text-foreground"
                  >
                    {agent.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => trigger.mutate({ agentName: agent.name })}
                    disabled={!agent.enabled || trigger.isPending}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    <Play className="h-3 w-3" />
                    Run
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted">
                {agent.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {triggers.map((t, i) => {
                  const Icon = TRIGGER_ICON[t.type] ?? Play;
                  return (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded bg-surface-raised px-2 py-1 font-mono text-[10px] text-muted"
                    >
                      <Icon className="h-3 w-3" />
                      {t.type === "cron" ? t.schedule : t.type === "event" ? t.match : t.type}
                    </span>
                  );
                })}
                {agent.requires_approval_for.length > 0 && (
                  <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 font-mono text-[10px] text-amber-400">
                    <ShieldCheck className="h-3 w-3" />
                    approval-gated
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface">
        <div className="border-b border-border-subtle px-5 py-3.5">
          <h2 className="text-sm font-semibold">Recent runs</h2>
        </div>
        {!runs?.length ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            No runs yet. Hit <span className="text-accent">Run</span> on any agent or press ⌘K.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {runs.map((run) => (
              <li key={run.id}>
                <Link
                  href={`/dashboard/agents/runs/${run.id}`}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-raised"
                >
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">
                    {(run.agent_definitions as { name: string } | null)?.name ?? run.agent_id}
                  </span>
                  <span className="text-[11px] text-muted">{run.trigger_type}</span>
                  <span className="text-[11px] tabular-nums text-muted">
                    {formatCost(run.cost_microdollars)}
                  </span>
                  <StatusBadge status={run.status} />
                  <span className="w-16 text-right text-[11px] tabular-nums text-muted">
                    {formatRelativeTime(run.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
