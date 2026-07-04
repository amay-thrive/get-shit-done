import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { createId } from "@/lib/id";
import { emitEvent } from "../../events";

const vertical = z.enum(["performance", "health", "wellness", "education"]);
const status = z.enum(["planning", "active", "paused", "completed", "cancelled"]);

export const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.db
      .from("projects")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        clientId: z.string().optional(),
        description: z.string().optional(),
        vertical: vertical.optional(),
        startDate: z.string().optional(),
        targetEndDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = createId("prj");
      const { data, error } = await ctx.db
        .from("projects")
        .insert({
          id,
          name: input.name,
          client_id: input.clientId ?? null,
          description: input.description ?? null,
          vertical: input.vertical ?? null,
          start_date: input.startDate ?? null,
          target_end_date: input.targetEndDate ?? null,
        })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      await emitEvent({
        type: "project.created",
        actorType: "user",
        actorId: ctx.user.id,
        subjectType: "project",
        subjectId: id,
        payload: { name: input.name, vertical: input.vertical },
      });
      return data;
    }),

  updateStatus: protectedProcedure
    .input(z.object({ id: z.string(), status }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.db
        .from("projects")
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      await emitEvent({
        type: input.status === "completed" ? "project.completed" : "project.status_changed",
        actorType: "user",
        actorId: ctx.user.id,
        subjectType: "project",
        subjectId: input.id,
        payload: { status: input.status },
      });
      return data;
    }),
});
