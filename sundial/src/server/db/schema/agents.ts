import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

export const agentDefinitions = pgTable("agent_definitions", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  tools: text("tools").array().notNull(),
  model: text("model").notNull().default("claude-sonnet-4-20250514"),
  maxTokens: integer("max_tokens").notNull().default(4096),
  triggers: jsonb("triggers").default([]),
  enabled: boolean("enabled").notNull().default(true),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AgentDefinition = typeof agentDefinitions.$inferSelect;
export type NewAgentDefinition = typeof agentDefinitions.$inferInsert;
