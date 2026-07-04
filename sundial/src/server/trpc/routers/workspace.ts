import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { createId } from "@/lib/id";
import { emitEvent } from "../../events";
import { embed, toVectorLiteral } from "../../agents/runtime/embeddings";

const TASK_STATUSES = ["todo", "in_progress", "done", "blocked"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
const DOC_KINDS = ["note", "brief", "sop", "meeting", "contract", "other"] as const;

export const workspaceRouter = router({
  // ── Documents (the "free Notion") ─────────────────────────
  listDocuments: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.db
      .from("documents")
      .select("id,title,kind,subject_type,subject_id,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data;
  }),

  getDocument: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { data } = await ctx.db
        .from("documents")
        .select("*")
        .eq("id", input.id)
        .single();
      return data;
    }),

  createDocument: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        kind: z.enum(DOC_KINDS).default("note"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = createId("doc");
      const { data, error } = await ctx.db
        .from("documents")
        .insert({ id, title: input.title, kind: input.kind, content: "" })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      await emitEvent({
        type: "document.created",
        actorType: "user",
        actorId: ctx.user.id,
        subjectType: "document",
        subjectId: id,
        payload: { title: input.title, kind: input.kind },
      });
      return data;
    }),

  saveDocument: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        /** BlockNote block tree, stored verbatim. */
        blocks: z.unknown().optional(),
        /** Plain-text extraction of the blocks — indexed for semantic search. */
        plainText: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (input.title !== undefined) update.title = input.title;
      if (input.blocks !== undefined) update.metadata = { blocks: input.blocks };
      if (input.plainText !== undefined) {
        update.content = input.plainText;
        const vector = await embed(
          `${input.title ?? ""}\n${input.plainText}`.slice(0, 8000)
        );
        if (vector) update.embedding = toVectorLiteral(vector);
      }

      const { error } = await ctx.db
        .from("documents")
        .update(update as never)
        .eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { saved: true };
    }),

  deleteDocument: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.db.from("documents").delete().eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { deleted: true };
    }),

  // ── Tasks (kanban) ────────────────────────────────────────
  listTasks: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.db
      .from("tasks")
      .select("*, projects(name), profiles!tasks_assignee_fkey(full_name,email)")
      .order("position");
    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
    return data;
  }),

  createTask: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        projectId: z.string().optional(),
        priority: z.enum(PRIORITIES).default("medium"),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = createId("tsk");
      const { data, error } = await ctx.db
        .from("tasks")
        .insert({
          id,
          title: input.title,
          project_id: input.projectId ?? null,
          priority: input.priority,
          due_date: input.dueDate ?? null,
          created_by: ctx.user.id,
          position: Date.now(), // append to end; fractional moves re-slot
        })
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      await emitEvent({
        type: "task.created",
        actorType: "user",
        actorId: ctx.user.id,
        subjectType: "task",
        subjectId: id,
        payload: { title: input.title },
      });
      return data;
    }),

  updateTask: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        status: z.enum(TASK_STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        position: z.number().optional(),
        dueDate: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, dueDate, ...fields } = input;
      const update: Record<string, unknown> = {
        ...fields,
        updated_at: new Date().toISOString(),
      };
      if (dueDate !== undefined) update.due_date = dueDate;

      const { data, error } = await ctx.db
        .from("tasks")
        .update(update as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });

      if (input.status === "done") {
        await emitEvent({
          type: "task.completed",
          actorType: "user",
          actorId: ctx.user.id,
          subjectType: "task",
          subjectId: id,
          payload: { title: data.title },
        });
      }
      return data;
    }),

  deleteTask: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.db.from("tasks").delete().eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
      return { deleted: true };
    }),
});
