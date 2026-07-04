import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { createId } from "@/lib/id";
import { emitEvent } from "../../events";

export const invoicesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.db
      .from("invoices")
      .select("*, clients(name)")
      .order("created_at", { ascending: false });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data;
  }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        projectId: z.string().optional(),
        amountCents: z.number().int().positive(),
        currency: z.string().default("usd"),
        dueDate: z.string().optional(),
        notes: z.string().optional(),
        lineItems: z
          .array(z.object({ description: z.string(), amountCents: z.number().int() }))
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = createId("inv");

      // Sequential invoice numbers: INV-YYYY-NNNN from a count of this year's invoices.
      const year = new Date().getFullYear();
      const { count } = await ctx.db
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .like("number", `INV-${year}-%`);
      const number = `INV-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;

      const { data, error } = await ctx.db
        .from("invoices")
        .insert({
          id,
          number,
          client_id: input.clientId,
          project_id: input.projectId ?? null,
          amount_cents: input.amountCents,
          currency: input.currency,
          due_date: input.dueDate ?? null,
          notes: input.notes ?? null,
          line_items: input.lineItems as never,
        })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      await emitEvent({
        type: "invoice.created",
        actorType: "user",
        actorId: ctx.user.id,
        subjectType: "invoice",
        subjectId: id,
        payload: { number, amount_cents: input.amountCents },
      });
      return data;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled", "void"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.db
        .from("invoices")
        .update({
          status: input.status,
          paid_at: input.status === "paid" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", input.id)
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      await emitEvent({
        type: `invoice.${input.status}`,
        actorType: "user",
        actorId: ctx.user.id,
        subjectType: "invoice",
        subjectId: input.id,
        payload: { number: data.number, amount_cents: data.amount_cents },
      });
      return data;
    }),
});
