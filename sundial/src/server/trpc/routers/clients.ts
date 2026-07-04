import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { createId } from "@/lib/id";
import { emitEvent } from "../../events";

const vertical = z.enum(["performance", "health", "wellness", "education"]);

export const clientsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.db
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.db
        .from("clients")
        .select("*")
        .eq("id", input.id)
        .single();
      return data;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        vertical: vertical.optional(),
        status: z.enum(["lead", "active"]).default("lead"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = createId("cli");
      const { data, error } = await ctx.db
        .from("clients")
        .insert({ id, ...input })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      await emitEvent({
        type: "client.created",
        actorType: "user",
        actorId: ctx.user.id,
        subjectType: "client",
        subjectId: id,
        payload: { name: input.name, vertical: input.vertical },
      });
      return data;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        vertical: vertical.optional(),
        status: z.enum(["lead", "active", "archived"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const { data, error } = await ctx.db
        .from("clients")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      await emitEvent({
        type: "client.updated",
        actorType: "user",
        actorId: ctx.user.id,
        subjectType: "client",
        subjectId: id,
        payload: fields,
      });
      return data;
    }),
});
