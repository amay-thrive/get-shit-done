import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // TODO: Verify signature with stripe.webhooks.constructEvent()
  // TODO: Process webhook event

  logger.info("Stripe webhook received", { signature: signature.slice(0, 20) });

  return NextResponse.json({ received: true });
}
