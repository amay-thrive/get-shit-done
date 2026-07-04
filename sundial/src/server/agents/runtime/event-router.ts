import { adminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { executeAgent } from "./orchestrator";
import type { EmitEventInput } from "../../events";

interface TriggerSpec {
  type: string;
  match?: string;
  schedule?: string;
}

/**
 * Fan out an emitted event to every enabled agent with a matching
 * event trigger. Guard: agent-emitted events never trigger agents,
 * which prevents runaway feedback loops.
 */
export async function routeEventToAgents(
  eventId: string,
  event: EmitEventInput
): Promise<void> {
  if (event.actorType === "agent") return;

  const db = adminClient();
  const { data: agents, error } = await db
    .from("agent_definitions")
    .select("name, triggers, enabled")
    .eq("enabled", true);

  if (error || !agents) {
    if (error) logger.error("Event router: failed to load agents", error);
    return;
  }

  const matches = agents.filter((agent) => {
    const triggers = (agent.triggers ?? []) as unknown as TriggerSpec[];
    return triggers.some((t) => t.type === "event" && t.match === event.type);
  });

  await Promise.allSettled(
    matches.map((agent) =>
      executeAgent({
        agentName: agent.name,
        triggerType: "event",
        triggerSource: eventId,
        input: {
          event_type: event.type,
          subject_type: event.subjectType,
          subject_id: event.subjectId,
          payload: event.payload,
        },
        correlationId: event.correlationId,
      })
    )
  );
}
