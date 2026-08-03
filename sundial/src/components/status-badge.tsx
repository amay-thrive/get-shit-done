import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  // shared
  active: "bg-emerald-500/10 text-emerald-400",
  completed: "bg-emerald-500/10 text-emerald-400",
  paid: "bg-emerald-500/10 text-emerald-400",
  succeeded: "bg-emerald-500/10 text-emerald-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  // in-flight
  running: "bg-sky-500/10 text-sky-400",
  planning: "bg-sky-500/10 text-sky-400",
  sent: "bg-sky-500/10 text-sky-400",
  lead: "bg-sky-500/10 text-sky-400",
  pending: "bg-amber-500/10 text-amber-400",
  waiting_approval: "bg-amber-500/10 text-amber-400",
  draft: "bg-zinc-500/10 text-zinc-400",
  paused: "bg-amber-500/10 text-amber-400",
  overdue: "bg-red-500/10 text-red-400",
  failed: "bg-red-500/10 text-red-400",
  rejected: "bg-red-500/10 text-red-400",
  cancelled: "bg-zinc-500/10 text-zinc-400",
  archived: "bg-zinc-500/10 text-zinc-400",
  void: "bg-zinc-500/10 text-zinc-400",
  expired: "bg-zinc-500/10 text-zinc-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        STYLES[status] ?? "bg-zinc-500/10 text-zinc-400"
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
