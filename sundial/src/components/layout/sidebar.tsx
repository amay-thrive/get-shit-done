"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  SquareCheckBig,
  Users,
  FolderKanban,
  Receipt,
  Bot,
  ShieldCheck,
  Brain,
  Activity,
  Flame,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Workspace", href: "/dashboard/workspace", icon: FileText },
  { name: "Tasks", href: "/dashboard/tasks", icon: SquareCheckBig },
  { name: "Clients", href: "/dashboard/clients", icon: Users },
  { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
  { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
  { name: "Agents", href: "/dashboard/agents", icon: Bot },
  { name: "Approvals", href: "/dashboard/approvals", icon: ShieldCheck },
  { name: "Memory", href: "/dashboard/memory", icon: Brain },
  { name: "Activity", href: "/dashboard/activity", icon: Activity },
  { name: "Usage", href: "/dashboard/usage", icon: Flame },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: kpis } = trpc.dashboard.kpis.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border-subtle bg-surface">
      <div className="flex h-14 items-center gap-2.5 border-b border-border-subtle px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft">
          <span className="text-sm font-bold text-accent">◐</span>
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">Sundial OS</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">
            Venture Studio
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const badge =
            item.name === "Approvals" && kpis?.pendingApprovals
              ? kpis.pendingApprovals
              : null;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-surface-raised font-medium text-foreground"
                  : "text-muted hover:bg-surface-raised hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.name}
              </span>
              {badge && (
                <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-black">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-4 text-[11px] leading-relaxed text-muted">
        <span className="text-accent">⌘K</span> to command anything
      </div>
    </aside>
  );
}
