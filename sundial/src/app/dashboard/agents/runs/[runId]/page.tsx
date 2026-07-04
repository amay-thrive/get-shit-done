"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Wrench, MessageSquare, CornerDownRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { StatusBadge } from "@/components/status-badge";
import { formatCost } from "@/lib/costs";

export default function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = use(params);
  const { data, isLoading } = trpc.agents.runDetail.useQuery(
    { runId },
    { refetchInterval: (q) => (q.state.data?.run?.status === "running" ? 2000 : false) }
  );

  if (isLoading) {
    return <p className="text-sm text-muted">Loading run…</p>;
  }
  if (!data?.run) {
    return <p className="text-sm text-muted">Run not found.</p>;
  }

  const { run, steps } = data;
  const agent = run.agent_definitions as { name: string; description: string | null } | null;
  const output = (run.output as { text?: string } | null)?.text;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/agents"
        className="flex w-fit items-center gap-1.5 text-xs text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Agent fleet
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-mono text-lg font-semibold">{agent?.name}</h1>
          <p className="mt-1 text-xs text-muted">
            {run.trigger_type} trigger · {run.input_tokens + run.output_tokens} tokens ·{" "}
            {formatCost(run.cost_microdollars)}
          </p>
        </div>
        <StatusBadge status={run.status} />
      </div>

      {run.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 font-mono text-xs text-red-400">
          {run.error}
        </div>
      )}

      <div className="rounded-xl border border-border-subtle bg-surface">
        <div className="border-b border-border-subtle px-5 py-3.5">
          <h2 className="text-sm font-semibold">Execution timeline</h2>
        </div>
        {!steps.length ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {run.status === "running" ? "Working…" : "No steps recorded."}
          </p>
        ) : (
          <ol className="divide-y divide-border-subtle">
            {steps.map((step) => {
              const content = step.content as Record<string, unknown>;
              return (
                <li key={step.id} className="flex gap-4 px-5 py-4">
                  <div className="mt-0.5 shrink-0">
                    {step.kind === "tool_call" ? (
                      <Wrench className="h-4 w-4 text-accent" />
                    ) : step.kind === "tool_result" ? (
                      <CornerDownRight className="h-4 w-4 text-muted" />
                    ) : (
                      <MessageSquare className="h-4 w-4 text-sky-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{step.kind.replace("_", " ")}</span>
                      {step.tool_name && (
                        <span className="font-mono text-accent">{step.tool_name}</span>
                      )}
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 font-mono text-[11px] leading-relaxed text-muted">
                      {step.kind === "message"
                        ? String(content.text ?? "")
                        : JSON.stringify(content, null, 2).slice(0, 2000)}
                    </pre>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {output && (
        <div className="rounded-xl border border-accent/30 bg-accent-soft/30 p-5">
          <h2 className="mb-2 text-sm font-semibold text-accent">Final output</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{output}</p>
        </div>
      )}
    </div>
  );
}
