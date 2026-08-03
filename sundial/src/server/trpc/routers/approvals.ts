import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { emitEvent } from "../../events";

export const approvalsRouter = router({
  pending: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.db
      .from("approvals")
      .select("*, agent_definitions(name)")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data;
  }),

  history: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(30) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.db
        .from("approvals")
        .select("*, agent_definitions(name)")
        .neq("status", "pending")
        .order("decided_at", { ascending: false })
        .limit(input.limit);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  decide: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        decision: z.enum(["approved", "rejected"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.db
        .from("approvals")
        .update({
          status: input.decision,
          decided_by: ctx.user.id,
          decided_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .eq("status", "pending") // guard against double-decisions
        .select()
        .single();
      if (error) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Approval already decided or not found",
        });
      }

      await emitEvent({
        type: `approval.${input.decision}`,
        actorType: "user",
        actorId: ctx.user.id,
        subjectType: "approval",
        subjectId: input.id,
        payload: {
          tool: data.tool_name,
          summary: data.action_summary,
        },
      });

      // Execution of approved actions (actually sending the email, etc.)
      // lands here when outbound integrations are activated. Today the
      // approved draft remains available in action_payload.
      return data;
    }),
});
