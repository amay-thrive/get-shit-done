"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, GripVertical, Trash2 } from "lucide-react";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/lib/trpc";
import type { AppRouter } from "@/server/trpc";
import { cn, formatDate } from "@/lib/utils";

const COLUMNS = [
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
] as const;

type TaskRow = inferRouterOutputs<AppRouter>["workspace"]["listTasks"][number];

const PRIORITY_STYLE: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-400",
  high: "bg-amber-500/10 text-amber-400",
  medium: "bg-sky-500/10 text-sky-400",
  low: "bg-zinc-500/10 text-zinc-400",
};

function TaskCard({ task, dragging }: { task: TaskRow; dragging?: boolean }) {
  const utils = trpc.useUtils();
  const remove = trpc.workspace.deleteTask.useMutation({
    onSettled: () => utils.workspace.listTasks.invalidate(),
  });

  return (
    <div
      className={cn(
        "group rounded-lg border border-border-subtle bg-surface-raised p-3",
        dragging && "opacity-90 shadow-2xl ring-1 ring-accent/40"
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-grab text-muted" />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">{task.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                PRIORITY_STYLE[task.priority]
              )}
            >
              {task.priority}
            </span>
            {(task.projects as { name: string } | null)?.name && (
              <span className="rounded bg-background px-1.5 py-0.5 text-[10px] text-muted">
                {(task.projects as { name: string }).name}
              </span>
            )}
            {task.due_date && (
              <span className="text-[10px] text-muted">{formatDate(task.due_date)}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => remove.mutate({ id: task.id })}
          className="text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function DraggableCard({ task }: { task: TaskRow }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(isDragging && "opacity-30")}
    >
      <TaskCard task={task} />
    </div>
  );
}

function Column({
  column,
  tasks,
}: {
  column: (typeof COLUMNS)[number];
  tasks: TaskRow[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[50vh] flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-3 transition-colors",
        isOver && "border-accent/50 bg-accent-soft/20"
      )}
    >
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">
          {column.label}
        </span>
        <span className="text-[11px] tabular-nums text-muted">{tasks.length}</span>
      </div>
      {tasks.map((task) => (
        <DraggableCard key={task.id} task={task} />
      ))}
    </div>
  );
}

export default function TasksPage() {
  const utils = trpc.useUtils();
  const { data: tasks } = trpc.workspace.listTasks.useQuery();
  const update = trpc.workspace.updateTask.useMutation({
    onSettled: () => utils.workspace.listTasks.invalidate(),
  });
  const create = trpc.workspace.createTask.useMutation({
    onSuccess: () => {
      setTitle("");
      void utils.workspace.listTasks.invalidate();
    },
  });

  const [title, setTitle] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const taskId = String(e.active.id);
    const overColumn = e.over?.id ? String(e.over.id) : null;
    if (!overColumn) return;
    const task = tasks?.find((t) => t.id === taskId);
    if (!task || task.status === overColumn) return;

    // Optimistic move
    utils.workspace.listTasks.setData(undefined, (prev) =>
      prev?.map((t) => (t.id === taskId ? { ...t, status: overColumn } : t))
    );
    update.mutate({
      id: taskId,
      status: overColumn as "todo" | "in_progress" | "done" | "blocked",
      position: Date.now(),
    });
  };

  const activeTask = tasks?.find((t) => t.id === activeId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-muted">
          The studio&apos;s board. Agents file action items here too — look for their
          signature.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate({ title: title.trim() });
        }}
        className="flex gap-2"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <button
          type="submit"
          disabled={create.isPending || !title.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <Column
              key={column.key}
              column={column}
              tasks={(tasks ?? []).filter((t) => t.status === column.key)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
