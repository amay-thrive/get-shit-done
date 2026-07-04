import { CheckCircle2, Circle } from "lucide-react";
import { optionalEnv } from "@/lib/env";

const INTEGRATIONS = [
  {
    name: "Supabase",
    detail: "Database, auth, realtime, vector memory",
    envKeys: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY"],
  },
  {
    name: "Anthropic (Claude)",
    detail: "Agent reasoning engine",
    envKeys: ["ANTHROPIC_API_KEY"],
  },
  {
    name: "OpenAI Embeddings",
    detail: "Semantic memory search (optional — falls back to keyword)",
    envKeys: ["OPENAI_API_KEY"],
  },
  {
    name: "Stripe",
    detail: "Payments and invoicing webhooks",
    envKeys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  },
  {
    name: "Zoho CRM",
    detail: "Contact and deal sync",
    envKeys: ["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN"],
  },
  {
    name: "Zapier",
    detail: "Inbound automation events",
    envKeys: ["ZAPIER_WEBHOOK_SECRET"],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Integration status is derived from environment configuration — set keys in
          Vercel, redeploy, and the light turns green.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const connected = integration.envKeys.every((k) => optionalEnv(k));
          return (
            <div
              key={integration.name}
              className="flex items-start justify-between rounded-xl border border-border-subtle bg-surface p-5"
            >
              <div>
                <h3 className="text-sm font-semibold">{integration.name}</h3>
                <p className="mt-1 text-xs text-muted">{integration.detail}</p>
                <p className="mt-2 font-mono text-[10px] text-muted">
                  {integration.envKeys.join(" · ")}
                </p>
              </div>
              {connected ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Circle className="h-4 w-4" /> Not configured
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
