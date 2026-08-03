import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { embed, toVectorLiteral } from "../../agents/runtime/embeddings";

export const activityRouter = router({
  feed: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.db
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(input.limit);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),

  searchMemory: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const vector = await embed(input.query);
      if (vector) {
        const { data, error } = await ctx.db.rpc("match_memories", {
          query_embedding: toVectorLiteral(vector),
          match_count: 20,
        });
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return { mode: "semantic" as const, results: data };
      }
      const { data, error } = await ctx.db
        .from("memories")
        .select("id,scope,kind,content,importance,created_at")
        .ilike("content", `%${input.query}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return {
        mode: "keyword" as const,
        results: (data ?? []).map((m) => ({ ...m, similarity: 0 })),
      };
    }),

  memories: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.db
        .from("memories")
        .select("id,scope,kind,content,importance,created_at,source_run_id")
        .order("created_at", { ascending: false })
        .limit(input.limit);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return data;
    }),
});
