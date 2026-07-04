import { pgTable, text, timestamp, date, integer, jsonb } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { projects } from "./projects";

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  clientId: text("client_id").references(() => clients.id),
  projectId: text("project_id").references(() => projects.id),
  stripeInvoiceId: text("stripe_invoice_id"),
  number: text("number").notNull().unique(),
  status: text("status").notNull().default("draft"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  dueDate: date("due_date"),
  paidAt: timestamp("paid_at"),
  lineItems: jsonb("line_items").default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
