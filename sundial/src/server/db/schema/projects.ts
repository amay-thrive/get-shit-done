import { pgTable, text, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { clients } from "./clients";

export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  clientId: text("client_id").references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planning"),
  vertical: text("vertical"),
  startDate: date("start_date"),
  targetEndDate: date("target_end_date"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
