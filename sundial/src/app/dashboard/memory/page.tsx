"use client";

import { useState } from "react";
import { Brain, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatRelativeTime } from "@/lib/utils";

export default function MemoryPage() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data: search, isFetching } = trpc.activity.searchMemory.useQuery(
    { query: submitted },
    { enabled: submitted.length > 0 }
  );
  const { data: recent } = trpc.activity.memories.useQuery(
    { limit: 30 },
    { enabled: submitted.length === 0 }
  );

  const results = submitted ? search?.results : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Memory</h1>
        <p className="mt-1 text-sm text-muted">
          The studio&apos;s institutional brain — everything the agents have learned,
          searchable by meaning.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query.trim());
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ask the memory bank — "what do we know about churn risk?"'
            className="w-full rounded-lg border border-border-subtle bg-surface py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={isFetching}
          className="rounded-lg bg-accent px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isFetching ? "…" : "Recall"}
        </button>
      </form>

      {submitted && search && (
        <p className="text-[11px] uppercase tracking-widest text-muted">
          {search.mode === "semantic" ? "semantic search" : "keyword search"} ·{" "}
          {search.results.length} results
        </p>
      )}

      <div className="space-y-2">
        {(results ?? recent ?? []).map((memory) => (
          <div
            key={memory.id}
            className="rounded-xl border border-border-subtle bg-surface p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-accent" />
              <span className="font-mono text-[11px] text-accent">{memory.scope}</span>
              <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-muted">
                {memory.kind}
              </span>
              {"similarity" in memory && memory.similarity > 0 && (
                <span className="text-[10px] tabular-nums text-muted">
                  {(memory.similarity * 100).toFixed(0)}% match
                </span>
              )}
              {"created_at" in memory && (
                <span className="ml-auto text-[10px] text-muted">
                  {formatRelativeTime(memory.created_at as string)}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed">{memory.content}</p>
          </div>
        ))}
        {(results ?? recent ?? []).length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border-subtle bg-surface py-14 text-center">
            <Brain className="h-6 w-6 text-muted" />
            <p className="max-w-sm text-sm text-muted">
              No memories yet. As agents run, they&apos;ll store what they learn here —
              and every future run gets smarter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
