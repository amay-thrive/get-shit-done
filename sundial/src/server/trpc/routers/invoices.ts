import { z } from "zod/v4";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { invoices } from "../../db/schema";
import { createId } from "@/lib/id";

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9999)
    .toString()
    .padStart(4, "0");
  return `INV-${year}-${seq}`;
}

export const invoicesRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, input.id));
      return result[0] ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        projectId: z.string().optional(),
        amountCents: z.number().int().positive(),
        currency: z.string().default("usd"),
        dueDate: z.string().optional(),
        lineItems: z.array(z.object({ description: z.string(), amountCents: z.number() })).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = createId();
      const number = generateInvoiceNumber();
      const result = await db
        .insert(invoices)
        .values({ id, number, ...input })
        .returning();
      return result[0]!;
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled", "void"]),
      })
    )
    .mutation(async ({ input }) => {
      const result = await db
        .update(invoices)
        .set({
          status: input.status,
          paidAt: input.status === "paid" ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.id))
        .returning();
      return result[0]!;
    }),
});
