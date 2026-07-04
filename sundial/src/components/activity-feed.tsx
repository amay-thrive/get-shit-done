"use client";

import { useEffect } from "react";
import { Zap, User, Bot, Webhook, Cog } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { createClient } from "@/lib/supabase/browser";
import { formatRelativeTime } from "@/lib/utils";

const ACTOR_ICON = {
  user: User,
  agent: Bot,
  webhook: Webhook,
  system: Cog,
} as const;

export function ActivityFeed({ limit = 30 }: { limit?: number }) {
  const utils = trpc.useUtils();
  const { data: events } = trpc.activity.feed.useQuery({ limit });

  // Live updates: refresh the feed whenever a new event lands.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("events-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        () => {
          void utils.activity.feed.invalidate();
          void utils.dashboard.kpis.invalidate();
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [utils]);

  if (!events?.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Zap className="h-6 w-6 text-muted" />
        <p className="text-sm text-muted">
          The event stream is empty. Every action in the studio will appear here, live.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1">
      {events.map((event) => {
        const Icon =
          ACTOR_ICON[event.actor_type as keyof typeof ACTOR_ICON] ?? Cog;
        return (
          <li
            key={event.event_id}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-surface-raised"
          >
            <div className="rounded-md bg-surface-raised p-1.5">
              <Icon className="h-3.5 w-3.5 text-muted" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-mono text-xs text-accent">{event.type}</span>
              {event.actor_id && (
                <span className="ml-2 text-xs text-muted">by {event.actor_id}</span>
              )}
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-muted">
              {formatRelativeTime(event.created_at)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
