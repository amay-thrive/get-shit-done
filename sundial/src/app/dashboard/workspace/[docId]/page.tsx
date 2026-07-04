"use client";

import { use, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";

const DocEditor = dynamic(
  () => import("@/components/doc-editor").then((m) => m.DocEditor),
  { ssr: false, loading: () => <p className="text-sm text-muted">Loading editor…</p> }
);

export default function DocumentPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = use(params);
  const { data: doc, isLoading } = trpc.workspace.getDocument.useQuery({ id: docId });
  const save = trpc.workspace.saveDocument.useMutation();
  const [title, setTitle] = useState<string | null>(null);

  if (isLoading) return <p className="text-sm text-muted">Loading…</p>;
  if (!doc) return <p className="text-sm text-muted">Document not found.</p>;

  const blocks = (doc.metadata as { blocks?: unknown } | null)?.blocks;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        href="/dashboard/workspace"
        className="flex w-fit items-center gap-1.5 text-xs text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Workspace
      </Link>

      <input
        value={title ?? doc.title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          const t = (title ?? doc.title).trim();
          if (t && t !== doc.title) save.mutate({ id: docId, title: t });
        }}
        className="w-full bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted"
        placeholder="Untitled"
      />

      <DocEditor docId={docId} initialBlocks={blocks} />
    </div>
  );
}
