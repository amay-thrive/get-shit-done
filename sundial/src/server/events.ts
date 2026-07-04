import { adminClient } from "@/lib/supabase/admin";
import { createId } from "@/lib/id";
import { logger } from "@/lib/logger";

export interface EmitEventInput {
  type: string; // 'client.created', 'invoice.paid', 'agent.run.completed', ...
  actorType: "user" | "agent" | "system" | "webhook";
  actorId?: string;
  subjectType?: string;
  subjectId?: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
}

/**
 * The event spine. Every meaningful business action flows through here —
 * immutable, append-only, and the trigger source for event-driven agents.
 */
export async function emitEvent(input: EmitEventInput): Promise<string> {
  const eventId = createId("evt");
  const { error } = await adminClient().from("events").insert({
    event_id: eventId,
    type: input.type,
    actor_type: input.actorType,
    actor_id: input.actorId ?? null,
    subject_type: input.subjectType ?? null,
    subject_id: input.subjectId ?? null,
    payload: (input.payload ?? {}) as never,
    correlation_id: input.correlationId ?? null,
  });

  if (error) {
    logger.error("Failed to emit event", error, { type: input.type });
    throw error;
  }

  // Fan out to event-triggered agents without blocking the caller.
  // Dynamic import avoids a circular dependency with the agent runtime.
  void import("./agents/runtime/event-router")
    .then((m) => m.routeEventToAgents(eventId, input))
    .catch((err) => logger.error("Event fan-out failed", err, { type: input.type }));

  return eventId;
}
