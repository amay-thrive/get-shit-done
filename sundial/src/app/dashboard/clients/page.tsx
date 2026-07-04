"use client";

import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { trpc } from "@/lib/trpc";

export default function ClientsPage() {
  const { data: clients, isLoading } = trpc.clients.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900">Clients</h1>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Clients</h1>
        <Button>Add Client</Button>
      </div>

      {!clients?.length ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start managing your pipeline."
          action={<Button>Add Client</Button>}
        />
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">{client.name}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{client.email ?? "-"}</td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{client.company ?? "-"}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      {client.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
