"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Receipt,
  Bot,
  ShieldCheck,
  Brain,
  Activity,
  Play,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const PaletteContext = createContext<{ setOpen: (v: boolean) => void }>({
  setOpen: () => {},
});

export const useCommandPalette = () => useContext(PaletteContext);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: agents } = trpc.agents.list.useQuery();
  const triggerAgent = trpc.agents.trigger.useMutation({
    onSettled: () => utils.agents.runs.invalidate(),
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const pages = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Clients", href: "/dashboard/clients", icon: Users },
    { name: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { name: "Invoices", href: "/dashboard/invoices", icon: Receipt },
    { name: "Agents", href: "/dashboard/agents", icon: Bot },
    { name: "Approvals", href: "/dashboard/approvals", icon: ShieldCheck },
    { name: "Memory", href: "/dashboard/memory", icon: Brain },
    { name: "Activity", href: "/dashboard/activity", icon: Activity },
  ];

  return (
    <PaletteContext.Provider value={{ setOpen }}>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[18vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
            <Command className="overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-2xl">
              <Command.Input
                autoFocus
                placeholder="Jump to a page or run an agent…"
                className="w-full border-b border-border-subtle bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-muted"
              />
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
                  Nothing found.
                </Command.Empty>

                <Command.Group
                  heading="Navigate"
                  className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted"
                >
                  {pages.map((p) => (
                    <Command.Item
                      key={p.href}
                      onSelect={() => go(p.href)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-surface-raised"
                    >
                      <p.icon className="h-4 w-4 text-muted" />
                      {p.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                {agents && agents.length > 0 && (
                  <Command.Group
                    heading="Run agent"
                    className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted"
                  >
                    {agents
                      .filter((a) => a.enabled)
                      .map((a) => (
                        <Command.Item
                          key={a.id}
                          onSelect={() => {
                            triggerAgent.mutate({ agentName: a.name });
                            setOpen(false);
                            router.push("/dashboard/agents");
                          }}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-surface-raised"
                        >
                          <Play className="h-4 w-4 text-accent" />
                          {a.name}
                        </Command.Item>
                      ))}
                  </Command.Group>
                )}
              </Command.List>
            </Command>
          </div>
        </div>
      )}
    </PaletteContext.Provider>
  );
}
