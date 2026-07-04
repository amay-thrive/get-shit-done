import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull(),
  signature: text("signature"),
  processed: boolean("processed").notNull().default(false),
  processingError: text("processing_error"),
  idempotencyKey: text("idempotency_key").unique(),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
