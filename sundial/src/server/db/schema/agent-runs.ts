import { pgTable, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { agentDefinitions } from "./agents";

export const agentRuns = pgTable("agent_runs", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .references(() => agentDefinitions.id)
    .notNull(),
  triggerType: text("trigger_type").notNull(),
  triggerSource: text("trigger_source"),
  status: text("status").notNull().default("pending"),
  input: jsonb("input"),
  output: jsonb("output"),
  toolCalls: jsonb("tool_calls").default([]),
  error: text("error"),
  tokensUsed: integer("tokens_used"),
  costCents: integer("cost_cents"),
  durationMs: integer("duration_ms"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AgentRun = typeof agentRuns.$inferSelect;
export type NewAgentRun = typeof agentRuns.$inferInsert;
