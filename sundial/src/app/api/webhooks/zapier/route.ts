import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createId } from "@/lib/id";
import { emitEvent } from "@/server/events";
import { optionalEnv } from "@/lib/env";

/**
 * Generic Zapier inbound hook. A Zap POSTs { event_type, subject_type?,
 * subject_id?, payload? } with the shared secret header, and the event
 * enters the spine — where it can trigger agents like any native event.
 */
export async function POST(req: Request) {
  const secret = optionalEnv("ZAPIER_WEBHOOK_SECRET");
  if (!secret) {
    return NextResponse.json({ error: "Zapier not configured" }, { status: 503 });
  }
  if (req.headers.get("x-zapier-secret") !== secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const body = (await req.json()) as {
    event_type?: string;
    subject_type?: string;
    subject_id?: string;
    payload?: Record<string, unknown>;
    idempotency_key?: string;
  };

  if (!body.event_type) {
    return NextResponse.json({ error: "event_type required" }, { status: 400 });
  }

  const db = adminClient();
  const { error } = await db.from("webhook_events").insert({
    id: createId("whk"),
    source: "zapier",
    event_type: body.event_type,
    payload: (body.payload ?? {}) as never,
    idempotency_key: body.idempotency_key
      ? `zapier:${body.idempotency_key}`
      : null,
    processed: true,
    processed_at: new Date().toISOString(),
  });
  if (error) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await emitEvent({
    type: `zapier.${body.event_type}`,
    actorType: "webhook",
    actorId: "zapier",
    subjectType: body.subject_type,
    subjectId: body.subject_id,
    payload: body.payload,
  });

  return NextResponse.json({ received: true });
}
