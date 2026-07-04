import { ActivityFeed } from "@/components/activity-feed";

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Activity</h1>
        <p className="mt-1 text-sm text-muted">
          The immutable event spine — every action by every human, agent, and webhook.
        </p>
      </div>
      <div className="rounded-xl border border-border-subtle bg-surface p-2">
        <ActivityFeed limit={100} />
      </div>
    </div>
  );
}
