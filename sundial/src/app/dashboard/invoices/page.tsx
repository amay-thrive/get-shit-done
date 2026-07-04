"use client";

import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";

export default function InvoicesPage() {
  const { data: invoicesList, isLoading } = trpc.invoices.list.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-neutral-900">Invoices</h1>
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
        <h1 className="text-2xl font-bold text-neutral-900">Invoices</h1>
        <Button>Create Invoice</Button>
      </div>

      {!invoicesList?.length ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Create your first invoice to start tracking payments."
          action={<Button>Create Invoice</Button>}
        />
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoicesList.map((invoice) => (
                <tr key={invoice.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">{invoice.number}</td>
                  <td className="px-6 py-4 text-sm text-neutral-900">
                    {formatCurrency(invoice.amountCents, invoice.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-neutral-500">{invoice.dueDate ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
