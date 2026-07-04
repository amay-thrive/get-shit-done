"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatRelativeTime } from "@/lib/utils";

const KINDS = ["note", "brief", "sop", "meeting", "contract", "other"] as const;

export default function WorkspacePage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: docs } = trpc.workspace.listDocuments.useQuery();
  const create = trpc.workspace.createDocument.useMutation({
    onSuccess: (doc) => {
      void utils.workspace.listDocuments.invalidate();
      router.push(`/dashboard/workspace/${doc.id}`);
    },
  });
  const remove = trpc.workspace.deleteDocument.useMutation({
    onSuccess: () => utils.workspace.listDocuments.invalidate(),
  });

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("note");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Workspace</h1>
        <p className="mt-1 text-sm text-muted">
          Docs, briefs, and SOPs — block-based editing, and everything you write becomes
          searchable memory for the agents.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) create.mutate({ title: title.trim(), kind });
        }}
        className="flex gap-2"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New document title…"
          className="flex-1 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="rounded-lg border border-border-subtle bg-surface px-3 text-sm outline-none focus:border-accent"
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={create.isPending || !title.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Create
        </button>
      </form>

      {!docs?.length ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-surface py-14 text-center">
          <FileText className="h-6 w-6 text-muted" />
          <p className="max-w-md text-sm text-muted">
            No documents yet. Drop your project brief here first — the agents will read it
            before every run.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-surface">
          {docs.map((doc) => (
            <li key={doc.id} className="group flex items-center">
              <Link
                href={`/dashboard/workspace/${doc.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-raised"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted" />
                <span className="truncate text-sm font-medium">{doc.title}</span>
                <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-muted">
                  {doc.kind}
                </span>
                <span className="ml-auto shrink-0 text-[11px] text-muted">
                  {formatRelativeTime(doc.updated_at)}
                </span>
              </Link>
              <button
                onClick={() => {
                  if (confirm(`Delete "${doc.title}"?`)) remove.mutate({ id: doc.id });
                }}
                className="px-4 text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                aria-label="Delete document"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
