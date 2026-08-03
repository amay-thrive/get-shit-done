import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { executeAgent } from "../../agents/runtime/orchestrator";

export const agentsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.db
      .from("agent_definitions")
      .select("*")
      .order("name");
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data;
  }),

  runs: protectedProcedure
    .input(
      z.object({
        agentId: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      let q = ctx.db
        .from("agent_runs")
        .select("*, agent_definitions(name)")
        .order("created_at", { ascending: false })
        .limit(input.limit);
      if (input.agentId) q = q.eq("agent_id", input.agentId);
      const { data, error } = await q;
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  runDetail: protectedProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [{ data: run }, { data: steps }] = await Promise.all([
        ctx.db
          .from("agent_runs")
          .select("*, agent_definitions(name, description)")
          .eq("id", input.runId)
          .single(),
        ctx.db
          .from("agent_steps")
          .select("*")
          .eq("run_id", input.runId)
          .order("step_index"),
      ]);
      return { run, steps: steps ?? [] };
    }),

  trigger: protectedProcedure
    .input(
      z.object({
        agentName: z.string(),
        input: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return executeAgent({
        agentName: input.agentName,
        triggerType: "manual",
        triggerSource: ctx.user.email ?? ctx.user.id,
        input: input.input,
      });
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.db
        .from("agent_definitions")
        .update({ enabled: input.enabled, updated_at: new Date().toISOString() })
        .eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { ok: true };
    }),

  usageByAgent: protectedProcedure.query(async ({ ctx }) => {
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data, error } = await ctx.db
      .from("agent_runs")
      .select(
        "agent_id, status, input_tokens, output_tokens, cost_microdollars, agent_definitions(name)"
      )
      .gte("created_at", since);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

    const byAgent = new Map<
      string,
      { name: string; runs: number; failed: number; tokens: number; costMicro: number }
    >();
    for (const run of data) {
      const name =
        (run.agent_definitions as { name: string } | null)?.name ?? run.agent_id;
      const entry = byAgent.get(name) ?? {
        name,
        runs: 0,
        failed: 0,
        tokens: 0,
        costMicro: 0,
      };
      entry.runs += 1;
      if (run.status === "failed") entry.failed += 1;
      entry.tokens += run.input_tokens + run.output_tokens;
      entry.costMicro += run.cost_microdollars;
      byAgent.set(name, entry);
    }
    return [...byAgent.values()].sort((a, b) => b.costMicro - a.costMicro);
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data, error } = await ctx.db
      .from("agent_runs")
      .select("status, cost_microdollars, input_tokens, output_tokens")
      .gte("created_at", since);
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

    const total = data.length;
    const completed = data.filter((r) => r.status === "completed").length;
    const failed = data.filter((r) => r.status === "failed").length;
    const costMicro = data.reduce((s, r) => s + r.cost_microdollars, 0);
    const tokens = data.reduce((s, r) => s + r.input_tokens + r.output_tokens, 0);
    return { total, completed, failed, costMicro, tokens };
  }),
});
