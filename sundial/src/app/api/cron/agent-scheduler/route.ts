import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { executeAgent } from "@/server/agents/runtime/orchestrator";
import { logger } from "@/lib/logger";

export const maxDuration = 300;

interface TriggerSpec {
  type: string;
  schedule?: string;
}

/**
 * Vercel Hobby allows one cron tick per day, so the default window is 24h:
 * every agent whose schedule fired in the last day runs on the daily tick.
 * On Pro, set the vercel.json cron schedule to every 15 minutes and
 * SCHEDULER_WINDOW_MINUTES=15 for true time-of-day precision.
 */
const WINDOW_MINUTES = Number(process.env.SCHEDULER_WINDOW_MINUTES ?? 1440);

/** Does a 5-field cron expression fire within the window (now-15m, now]? */
function firesInWindow(schedule: string, now: Date, windowMinutes = 15): boolean {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [min, hour, , , dow] = parts as [string, string, string, string, string];

  const fieldMatches = (field: string, value: number, max: number): boolean => {
    if (field === "*") return true;
    return field.split(",").some((part) => {
      const step = part.match(/^\*\/(\d+)$/);
      if (step) return value % Number(step[1]) === 0;
      const range = part.match(/^(\d+)-(\d+)$/);
      if (range) return value >= Number(range[1]) && value <= Number(range[2]);
      const n = Number(part);
      return Number.isInteger(n) && n <= max && n === value;
    });
  };

  for (let back = 0; back < windowMinutes; back++) {
    const t = new Date(now.getTime() - back * 60_000);
    if (
      fieldMatches(min, t.getUTCMinutes(), 59) &&
      fieldMatches(hour, t.getUTCHours(), 23) &&
      fieldMatches(dow, t.getUTCDay(), 6)
    ) {
      return true;
    }
  }
  return false;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = adminClient();
  const { data: agents, error } = await db
    .from("agent_definitions")
    .select("name, triggers")
    .eq("enabled", true);

  if (error) {
    logger.error("Scheduler: failed to load agents", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const due = (agents ?? []).filter((agent) => {
    const triggers = (agent.triggers ?? []) as unknown as TriggerSpec[];
    return triggers.some(
      (t) =>
        t.type === "cron" && t.schedule && firesInWindow(t.schedule, now, WINDOW_MINUTES)
    );
  });

  // Deduplicate: skip agents that already ran via cron in the window.
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60_000).toISOString();
  const results = [];
  for (const agent of due) {
    const { data: recent } = await db
      .from("agent_runs")
      .select("id, agent_definitions!inner(name)")
      .eq("agent_definitions.name", agent.name)
      .eq("trigger_type", "cron")
      .gte("created_at", windowStart)
      .limit(1);
    if (recent && recent.length > 0) continue;

    const result = await executeAgent({
      agentName: agent.name,
      triggerType: "cron",
      triggerSource: "vercel-cron",
    });
    results.push({ agent: agent.name, ...result });
  }

  return NextResponse.json({ checked: agents?.length ?? 0, executed: results });
}
