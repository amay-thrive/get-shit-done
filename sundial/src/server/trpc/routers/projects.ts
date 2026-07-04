import { z } from "zod/v4";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { projects } from "../../db/schema";
import { createId } from "@/lib/id";

export const projectsRouter = router({
  list: protectedProcedure.query(async () => {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.id));
      return result[0] ?? null;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        vertical: z.enum(["performance", "health", "wellness", "education"]).optional(),
        startDate: z.string().optional(),
        targetEndDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const id = createId();
      const result = await db
        .insert(projects)
        .values({ id, ...input })
        .returning();
      return result[0]!;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z
          .enum(["planning", "active", "paused", "completed", "cancelled"])
          .optional(),
        vertical: z.enum(["performance", "health", "wellness", "education"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const result = await db
        .update(projects)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();
      return result[0]!;
    }),
});
