import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const body = await req.json();
  const secret = req.headers.get("x-zapier-secret");

  if (!secret) {
    return NextResponse.json({ error: "Missing secret" }, { status: 400 });
  }

  // TODO: Verify shared secret
  // TODO: Process webhook event

  logger.info("Zapier webhook received");

  return NextResponse.json({ received: true }, { status: 200 });
}
