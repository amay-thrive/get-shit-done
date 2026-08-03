import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { createId } from "@/lib/id";
import { emitEvent } from "@/server/events";
import { optionalEnv } from "@/lib/env";

export async function POST(req: Request) {
  const secret = optionalEnv("ZOHO_WEBHOOK_SECRET");
  if (!secret) {
    return NextResponse.json({ error: "Zoho not configured" }, { status: 503 });
  }

  const raw = await req.text();
  const provided = req.headers.get("x-zoho-signature") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(raw) as {
    event_type?: string;
    module?: string;
    record_id?: string;
    data?: Record<string, unknown>;
  };

  const db = adminClient();
  await db.from("webhook_events").insert({
    id: createId("whk"),
    source: "zoho",
    event_type: body.event_type ?? "unknown",
    payload: body as never,
    processed: true,
    processed_at: new Date().toISOString(),
  });

  await emitEvent({
    type: `zoho.${body.event_type ?? "unknown"}`,
    actorType: "webhook",
    actorId: "zoho",
    subjectType: body.module,
    subjectId: body.record_id,
    payload: body.data,
  });

  return NextResponse.json({ received: true });
}
