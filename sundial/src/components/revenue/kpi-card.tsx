import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  accent?: boolean;
}

export function KpiCard({ title, value, description, icon: Icon, accent }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            {title}
          </p>
          <p className={cn("text-2xl font-semibold tabular-nums", accent && "text-accent")}>
            {value}
          </p>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
        <div className="rounded-lg bg-surface-raised p-2.5">
          <Icon className="h-4 w-4 text-muted" />
        </div>
      </div>
    </div>
  );
}
