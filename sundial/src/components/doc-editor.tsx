"use client";

import { useEffect, useMemo, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { Block } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { trpc } from "@/lib/trpc";

interface DocEditorProps {
  docId: string;
  initialBlocks?: unknown;
}

export function DocEditor({ docId, initialBlocks }: DocEditorProps) {
  const save = trpc.workspace.saveDocument.useMutation();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialContent = useMemo(() => {
    const blocks = initialBlocks as Block[] | undefined;
    return Array.isArray(blocks) && blocks.length > 0 ? blocks : undefined;
  }, [initialBlocks]);

  const editor = useCreateBlockNote({ initialContent });

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onChange = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const blocks = editor.document;
      const plainText = await editor.blocksToMarkdownLossy(blocks);
      save.mutate({ id: docId, blocks, plainText });
    }, 1200);
  };

  return (
    <div className="min-h-[60vh] rounded-xl border border-border-subtle bg-surface py-4">
      <BlockNoteView editor={editor} theme="dark" onChange={onChange} />
      <div className="px-6 pt-2 text-right text-[10px] text-muted">
        {save.isPending ? "saving…" : "saved"}
      </div>
    </div>
  );
}
