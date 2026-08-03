"use client";

import { useRouter } from "next/navigation";
import { LogOut, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { useCommandPalette } from "@/components/command-palette";

export function Header() {
  const router = useRouter();
  const { setOpen } = useCommandPalette();

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border-subtle bg-surface px-5">
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border-subtle bg-background px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        Search or command…
        <kbd className="ml-4 rounded bg-surface-raised px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <button
        onClick={signOut}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </header>
  );
}
