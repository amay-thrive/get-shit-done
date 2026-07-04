"use client";

import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { trpc } from "@/lib/trpc";

export default function AgentsPage() {
  const { data: agents, isLoading } = trpc.agents.listDefinitions.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900">AI Agents</h1>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">AI Agents</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Automated workflows powered by Claude
          </p>
        </div>
        <Button>Configure Agent</Button>
      </div>

      {!agents?.length ? (
        <EmptyState
          icon={Bot}
          title="No agents configured"
          description="Set up AI agents to automate invoicing, CRM updates, follow-ups, and more."
          action={<Button>Configure Agent</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border border-neutral-200 bg-white p-6 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900">{agent.name}</h3>
                    <p className="text-xs text-neutral-500">{agent.model}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    agent.enabled
                      ? "bg-green-50 text-green-700"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {agent.enabled ? "Active" : "Disabled"}
                </span>
              </div>
              {agent.description && (
                <p className="text-sm text-neutral-500">{agent.description}</p>
              )}
              <div className="flex gap-2">
                {agent.tools.slice(0, 3).map((tool) => (
                  <span
                    key={tool}
                    className="inline-flex items-center rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600"
                  >
                    {tool}
                  </span>
                ))}
                {agent.tools.length > 3 && (
                  <span className="text-xs text-neutral-400">
                    +{agent.tools.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
