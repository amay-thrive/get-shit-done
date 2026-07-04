import { z } from "zod/v4";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "../../db";
import { agentDefinitions, agentRuns } from "../../db/schema";

export const agentsRouter = router({
  listDefinitions: protectedProcedure.query(async () => {
    return db.select().from(agentDefinitions).orderBy(agentDefinitions.name);
  }),

  listRuns: protectedProcedure
    .input(z.object({ agentId: z.string().optional(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      let query = db
        .select()
        .from(agentRuns)
        .orderBy(desc(agentRuns.createdAt))
        .limit(input.limit);

      if (input.agentId) {
        query = query.where(eq(agentRuns.agentId, input.agentId)) as typeof query;
      }

      return query;
    }),

  getRunById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(agentRuns)
        .where(eq(agentRuns.id, input.id));
      return result[0] ?? null;
    }),
});
