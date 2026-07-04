"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { Flame, Bot, Coins, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { KpiCard } from "@/components/revenue/kpi-card";
import { formatCost } from "@/lib/costs";

interface AgentUsage {
  name: string;
  runs: number;
  failed: number;
  tokens: number;
  costMicro: number;
}

const col = createColumnHelper<AgentUsage>();
const columns = [
  col.accessor("name", {
    header: "Agent",
    cell: (info) => <span className="font-mono text-xs">{info.getValue()}</span>,
  }),
  col.accessor("runs", { header: "Runs (30d)" }),
  col.accessor("failed", {
    header: "Failed",
    cell: (info) => (
      <span className={info.getValue() > 0 ? "text-red-400" : "text-muted"}>
        {info.getValue()}
      </span>
    ),
  }),
  col.accessor("tokens", {
    header: "Tokens",
    cell: (info) => info.getValue().toLocaleString(),
  }),
  col.accessor("costMicro", {
    header: "Cost",
    cell: (info) => (
      <span className="tabular-nums text-accent">{formatCost(info.getValue())}</span>
    ),
  }),
];

const INFRA = [
  { name: "Vercel (Hobby)", cost: "$0/mo", note: "Upgrade trigger: >1 daily cron, team seats, or 100GB bandwidth" },
  { name: "Supabase (Free)", cost: "$0/mo", note: "Upgrade trigger: 500MB database or 50k monthly active users" },
  { name: "Anthropic API", cost: "usage-based", note: "Tracked per run below — budget alert suggested at $25/mo" },
  { name: "OpenAI embeddings", cost: "usage-based", note: "Pennies — ~$0.02 per 1M tokens embedded" },
];

export default function UsagePage() {
  const { data: usage } = trpc.agents.usageByAgent.useQuery();
  const { data: stats } = trpc.agents.stats.useQuery();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "costMicro", desc: true },
  ]);

  const table = useReactTable({
    data: usage ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Usage &amp; Burn</h1>
        <p className="mt-1 text-sm text-muted">
          Where the tech spend goes — every token, every run, every service.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title="AI Spend (30d)"
          value={stats ? formatCost(stats.costMicro) : "—"}
          icon={Coins}
          accent
        />
        <KpiCard
          title="Agent Runs (30d)"
          value={String(stats?.total ?? "—")}
          description={stats ? `${stats.completed} completed` : undefined}
          icon={Bot}
        />
        <KpiCard
          title="Failure Rate"
          value={
            stats && stats.total > 0
              ? `${Math.round((stats.failed / stats.total) * 100)}%`
              : "0%"
          }
          icon={AlertTriangle}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
        <div className="border-b border-border-subtle px-5 py-3.5">
          <h2 className="text-sm font-semibold">Cost by agent — 30 days</h2>
        </div>
        {!usage?.length ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            No agent runs yet — costs will appear the moment the first agent executes.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wider text-muted"
                >
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer select-none px-5 py-3 font-medium hover:text-foreground"
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-surface-raised">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface">
        <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-3.5">
          <Flame className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold">Infrastructure</h2>
        </div>
        <ul className="divide-y divide-border-subtle">
          {INFRA.map((item) => (
            <li key={item.name} className="flex items-center gap-4 px-5 py-3.5">
              <span className="w-44 shrink-0 text-sm font-medium">{item.name}</span>
              <span className="w-24 shrink-0 text-sm tabular-nums text-accent">
                {item.cost}
              </span>
              <span className="text-xs text-muted">{item.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
