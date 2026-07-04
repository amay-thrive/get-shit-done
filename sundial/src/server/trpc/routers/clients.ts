import { z } from "zod/v4";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { clients } from "../../db/schema";
import { createId } from "@/lib/id";

export const clientsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(clients).orderBy(desc(clients.createdAt));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(clients)
        .where(eq(clients.id, input.id));
      return result[0] ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = createId();
      const result = await db
        .insert(clients)
        .values({ id, ...input })
        .returning();
      return result[0]!;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        email: z.email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        status: z.enum(["active", "archived"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await db
        .update(clients)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(clients.id, id))
        .returning();
      return result[0]!;
    }),
});
