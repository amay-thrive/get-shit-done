import { router, protectedProcedure } from "../trpc";

export const dashboardRouter = router({
  kpis: protectedProcedure.query(async ({ ctx }) => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [clients, projects, revenue, agents, approvals] = await Promise.all([
      ctx.db
        .from("clients")
        .select("id", { count: "exact", head: true })
        .neq("status", "archived"),
      ctx.db
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      ctx.db
        .from("payments")
        .select("amount_cents")
        .eq("status", "succeeded")
        .gte("received_at", monthStart.toISOString()),
      ctx.db
        .from("agent_runs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", monthStart.toISOString()),
      ctx.db
        .from("approvals")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    return {
      clients: clients.count ?? 0,
      activeProjects: projects.count ?? 0,
      revenueMtdCents: (revenue.data ?? []).reduce((s, p) => s + p.amount_cents, 0),
      agentRunsMtd: agents.count ?? 0,
      pendingApprovals: approvals.count ?? 0,
    };
  }),
});
