"use client";

import { Users, FolderKanban, TrendingUp, Bot, ShieldCheck } from "lucide-react";
import { KpiCard } from "@/components/revenue/kpi-card";
import { ActivityFeed } from "@/components/activity-feed";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { formatCost } from "@/lib/costs";

export default function DashboardPage() {
  const { data: kpis } = trpc.dashboard.kpis.useQuery();
  const { data: stats } = trpc.agents.stats.useQuery();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          The studio at a glance — live from the event stream.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          title="Clients"
          value={String(kpis?.clients ?? "—")}
          icon={Users}
        />
        <KpiCard
          title="Active Projects"
          value={String(kpis?.activeProjects ?? "—")}
          icon={FolderKanban}
        />
        <KpiCard
          title="Revenue MTD"
          value={kpis ? formatCurrency(kpis.revenueMtdCents) : "—"}
          icon={TrendingUp}
          accent
        />
        <KpiCard
          title="Agent Runs MTD"
          value={String(kpis?.agentRunsMtd ?? "—")}
          description={stats ? `${formatCost(stats.costMicro)} spent · 30d` : undefined}
          icon={Bot}
        />
        <KpiCard
          title="Pending Approvals"
          value={String(kpis?.pendingApprovals ?? "—")}
          icon={ShieldCheck}
          accent={(kpis?.pendingApprovals ?? 0) > 0}
        />
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5">
          <h2 className="text-sm font-semibold">Live activity</h2>
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            streaming
          </span>
        </div>
        <div className="p-2">
          <ActivityFeed limit={25} />
        </div>
      </div>
    </div>
  );
}
