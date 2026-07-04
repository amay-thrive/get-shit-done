import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { invoices } from "./invoices";

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").references(() => invoices.id),
  stripePaymentId: text("stripe_payment_id"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(),
  method: text("method"),
  receivedAt: timestamp("received_at").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
