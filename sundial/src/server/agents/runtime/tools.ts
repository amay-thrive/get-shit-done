import { tool, type Tool } from "ai";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/admin";
import { createId } from "@/lib/id";
import { embed, toVectorLiteral } from "./embeddings";

export interface ToolContext {
  runId: string;
  agentId: string;
  agentName: string;
  /** Tool names that must be routed to the human approval queue. */
  approvalGated: Set<string>;
}

/**
 * The tool registry. Each agent declares tool names in its definition;
 * the orchestrator resolves them here at run time. Gated tools never
 * execute directly — they enqueue an approval and return a receipt.
 */
export function buildTools(ctx: ToolContext): Record<string, Tool> {
  const db = adminClient();

  const gate = async (
    toolName: string,
    summary: string,
    payload: Record<string, unknown>
  ) => {
    const id = createId("apr");
    await db.from("approvals").insert({
      id,
      run_id: ctx.runId,
      agent_id: ctx.agentId,
      tool_name: toolName,
      action_summary: summary,
      action_payload: payload as never,
      expires_at: new Date(Date.now() + 72 * 3600_000).toISOString(),
    });
    return {
      queued_for_approval: true,
      approval_id: id,
      note: "Action requires human approval. It is now in the founder's approval queue.",
    };
  };

  const all: Record<string, Tool> = {
    "db.query_clients": tool({
      description:
        "Query clients. Filter by status, vertical, or fuzzy name match. Returns up to 50 rows.",
      inputSchema: z.object({
        status: z.enum(["lead", "active", "archived"]).optional(),
        vertical: z
          .enum(["performance", "health", "wellness", "education"])
          .optional(),
        name_contains: z.string().optional(),
      }),
      execute: async (input) => {
        let q = db.from("clients").select("*").limit(50);
        if (input.status) q = q.eq("status", input.status);
        if (input.vertical) q = q.eq("vertical", input.vertical);
        if (input.name_contains) q = q.ilike("name", `%${input.name_contains}%`);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    "db.query_projects": tool({
      description: "Query projects, optionally by status, vertical, or client_id.",
      inputSchema: z.object({
        status: z
          .enum(["planning", "active", "paused", "completed", "cancelled"])
          .optional(),
        vertical: z
          .enum(["performance", "health", "wellness", "education"])
          .optional(),
        client_id: z.string().optional(),
      }),
      execute: async (input) => {
        let q = db.from("projects").select("*").limit(50);
        if (input.status) q = q.eq("status", input.status);
        if (input.vertical) q = q.eq("vertical", input.vertical);
        if (input.client_id) q = q.eq("client_id", input.client_id);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    "db.query_invoices": tool({
      description:
        "Query invoices. Use overdue=true for invoices past due date and not paid.",
      inputSchema: z.object({
        status: z.string().optional(),
        client_id: z.string().optional(),
        overdue: z.boolean().optional(),
      }),
      execute: async (input) => {
        let q = db.from("invoices").select("*").limit(100);
        if (input.status) q = q.eq("status", input.status);
        if (input.client_id) q = q.eq("client_id", input.client_id);
        if (input.overdue) {
          q = q
            .lt("due_date", new Date().toISOString().slice(0, 10))
            .not("status", "in", '("paid","cancelled","void")');
        }
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    "db.query_payments": tool({
      description: "Query payments, optionally by invoice_id.",
      inputSchema: z.object({
        invoice_id: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(25),
      }),
      execute: async (input) => {
        let q = db
          .from("payments")
          .select("*")
          .order("received_at", { ascending: false })
          .limit(input.limit);
        if (input.invoice_id) q = q.eq("invoice_id", input.invoice_id);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    "db.query_events": tool({
      description:
        "Query the business event stream (append-only log of everything that happened). Most recent first.",
      inputSchema: z.object({
        type_prefix: z
          .string()
          .optional()
          .describe("e.g. 'invoice.' matches invoice.paid, invoice.overdue"),
        subject_id: z.string().optional(),
        since_hours: z.number().int().min(1).max(720).default(48),
        limit: z.number().int().min(1).max(200).default(50),
      }),
      execute: async (input) => {
        let q = db
          .from("events")
          .select("event_id,type,actor_type,subject_type,subject_id,payload,created_at")
          .gte(
            "created_at",
            new Date(Date.now() - input.since_hours * 3600_000).toISOString()
          )
          .order("created_at", { ascending: false })
          .limit(input.limit);
        if (input.type_prefix) q = q.like("type", `${input.type_prefix}%`);
        if (input.subject_id) q = q.eq("subject_id", input.subject_id);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    "db.update_client_health": tool({
      description:
        "Write a computed health score (0-100) back to a client record, with reasoning.",
      inputSchema: z.object({
        client_id: z.string(),
        health_score: z.number().int().min(0).max(100),
        reasoning: z.string(),
      }),
      execute: async (input) => {
        const { error } = await db
          .from("clients")
          .update({
            health_score: input.health_score,
            updated_at: new Date().toISOString(),
          })
          .eq("id", input.client_id);
        if (error) throw new Error(error.message);
        return { updated: true, client_id: input.client_id };
      },
    }),

    "memory.recall": tool({
      description:
        "Semantic recall from the studio's memory bank. Searches by meaning when embeddings are enabled, otherwise returns the most recent memories in scope.",
      inputSchema: z.object({
        query: z.string(),
        scope: z
          .string()
          .optional()
          .describe("e.g. 'agent:revenue-sentinel', 'client:cli_x', 'global'"),
        limit: z.number().int().min(1).max(20).default(8),
      }),
      execute: async (input) => {
        const vector = await embed(input.query);
        if (vector) {
          const { data, error } = await db.rpc("match_memories", {
            query_embedding: toVectorLiteral(vector),
            match_scope: input.scope,
            match_count: input.limit,
          });
          if (error) throw new Error(error.message);
          return data;
        }
        let q = db
          .from("memories")
          .select("id,scope,kind,content,importance,created_at")
          .order("created_at", { ascending: false })
          .limit(input.limit);
        if (input.scope) q = q.eq("scope", input.scope);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        return data;
      },
    }),

    "memory.store": tool({
      description:
        "Persist a memory so future runs (of any agent) can recall it. Use scopes to organize: 'agent:<name>' for private notes, 'client:<id>' for client facts, 'global' for studio-wide knowledge.",
      inputSchema: z.object({
        content: z.string(),
        scope: z.string(),
        kind: z
          .enum(["observation", "decision", "preference", "fact", "summary"])
          .default("observation"),
        importance: z.number().min(0).max(1).default(0.5),
      }),
      execute: async (input) => {
        const id = createId("mem");
        const vector = await embed(input.content);
        const { error } = await db.from("memories").insert({
          id,
          scope: input.scope,
          kind: input.kind,
          content: input.content,
          importance: input.importance,
          embedding: vector ? toVectorLiteral(vector) : null,
          source_run_id: ctx.runId,
        });
        if (error) throw new Error(error.message);
        return { stored: true, memory_id: id };
      },
    }),

    "email.draft": tool({
      description:
        "Draft an outbound email. Drafts are never sent directly — they enter the founder's approval queue.",
      inputSchema: z.object({
        to: z.string(),
        subject: z.string(),
        body: z.string(),
        client_id: z.string().optional(),
      }),
      execute: async (input) =>
        gate("email.draft", `Email to ${input.to}: "${input.subject}"`, input),
    }),

    "notify.founder": tool({
      description:
        "Push a notification to the founder's attention feed. Use for anomalies, briefs, and things requiring awareness (not approval).",
      inputSchema: z.object({
        title: z.string(),
        body: z.string(),
        severity: z.enum(["info", "warning", "critical"]).default("info"),
      }),
      execute: async (input) => {
        const eventId = createId("evt");
        const { error } = await db.from("events").insert({
          event_id: eventId,
          type: `notification.${input.severity}`,
          actor_type: "agent",
          actor_id: ctx.agentName,
          payload: { title: input.title, body: input.body } as never,
        });
        if (error) throw new Error(error.message);
        return { notified: true };
      },
    }),
  };

  // Gating convention: tools with real-world side effects (outbound email,
  // payments, CRM writes to external systems) call gate() in their execute
  // instead of acting — the action lands in the human approval queue.
  // ctx.approvalGated (from agent_definitions.requires_approval_for) is
  // surfaced in the UI so the founder can see each agent's blast radius.
  return all;
}

export function selectTools(
  ctx: ToolContext,
  names: string[]
): Record<string, Tool> {
  const registry = buildTools(ctx);
  const selected: Record<string, Tool> = {};
  for (const name of names) {
    const t = registry[name];
    if (t) selected[name] = t;
  }
  return selected;
}
