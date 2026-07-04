export const APP_NAME = "Sundial Studio";

export const VERTICALS = ["performance", "health", "wellness", "education"] as const;
export type Vertical = (typeof VERTICALS)[number];

export const CLIENT_STATUSES = ["active", "archived"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const PROJECT_STATUSES = [
  "planning",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
  "void",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "succeeded",
  "failed",
  "refunded",
  "pending",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const AGENT_RUN_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;
export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

export const TRIGGER_TYPES = ["manual", "cron", "webhook", "chain"] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];
