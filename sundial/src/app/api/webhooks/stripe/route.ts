import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminClient } from "@/lib/supabase/admin";
import { createId } from "@/lib/id";
import { emitEvent } from "@/server/events";
import { optionalEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const secretKey = optionalEnv("STRIPE_SECRET_KEY");
  const webhookSecret = optionalEnv("STRIPE_WEBHOOK_SECRET");
  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = new Stripe(secretKey);
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    logger.warn("Stripe signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = adminClient();
  const { error: insertError } = await db.from("webhook_events").insert({
    id: createId("whk"),
    source: "stripe",
    event_type: event.type,
    payload: event as never,
    signature: signature.slice(0, 64),
    idempotency_key: `stripe:${event.id}`,
  });

  // Unique violation on idempotency_key means we already processed this event.
  if (insertError) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Map Stripe events onto the business event spine.
  if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    await emitEvent({
      type: "invoice.paid",
      actorType: "webhook",
      actorId: "stripe",
      subjectType: "stripe_invoice",
      subjectId: invoice.id,
      payload: {
        amount_cents: invoice.amount_paid,
        customer: String(invoice.customer ?? ""),
      },
    });
  } else if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    await emitEvent({
      type: "invoice.payment_failed",
      actorType: "webhook",
      actorId: "stripe",
      subjectType: "stripe_invoice",
      subjectId: invoice.id,
      payload: { customer: String(invoice.customer ?? "") },
    });
  }

  await db
    .from("webhook_events")
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq("idempotency_key", `stripe:${event.id}`);

  return NextResponse.json({ received: true });
}
