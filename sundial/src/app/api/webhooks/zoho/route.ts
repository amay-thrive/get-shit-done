import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const body = await req.json();
  const secret = req.headers.get("x-zoho-webhook-secret");

  if (!secret) {
    return NextResponse.json({ error: "Missing secret" }, { status: 400 });
  }

  // TODO: Verify HMAC signature
  // TODO: Process webhook event

  logger.info("Zoho webhook received", { eventType: body?.event_type });

  return NextResponse.json({ received: true });
}
