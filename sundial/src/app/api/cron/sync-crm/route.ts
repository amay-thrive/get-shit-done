import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Sync Zoho contacts <-> clients table
  // TODO: Sync Zoho deals <-> projects table

  logger.info("CRM sync cron executed");

  return NextResponse.json({ ok: true });
}
