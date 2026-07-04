import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Pull revenue data from Stripe
  // TODO: Calculate MRR, ARR, revenue MTD
  // TODO: Store snapshot in database

  logger.info("Revenue snapshot cron executed");

  return NextResponse.json({ ok: true });
}
