import { Users, FolderKanban, TrendingUp, Bot } from "lucide-react";
import { KpiCard } from "@/components/revenue/kpi-card";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Welcome back. Here&apos;s what&apos;s happening at Sundial Studio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Clients"
          value="0"
          description="Across all verticals"
          icon={Users}
        />
        <KpiCard
          title="Active Projects"
          value="0"
          description="Currently in progress"
          icon={FolderKanban}
        />
        <KpiCard
          title="Revenue MTD"
          value="$0"
          description="Month to date"
          icon={TrendingUp}
        />
        <KpiCard
          title="Active Agents"
          value="0"
          description="Running automations"
          icon={Bot}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="font-semibold text-neutral-900">Recent Activity</h2>
          <p className="mt-4 text-sm text-neutral-500">
            No activity yet. Create your first client to get started.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="font-semibold text-neutral-900">Agent Runs</h2>
          <p className="mt-4 text-sm text-neutral-500">
            No agent runs yet. Configure your first AI agent to begin automation.
          </p>
        </div>
      </div>
    </div>
  );
}
