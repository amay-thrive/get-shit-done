import { TrendingUp, DollarSign, CreditCard, ArrowUpRight } from "lucide-react";
import { KpiCard } from "@/components/revenue/kpi-card";

export default function RevenuePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Revenue</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Financial overview from Stripe
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="MRR" value="$0" icon={TrendingUp} />
        <KpiCard title="Revenue MTD" value="$0" icon={DollarSign} />
        <KpiCard title="Outstanding" value="$0" icon={CreditCard} />
        <KpiCard title="Collected" value="$0" icon={ArrowUpRight} />
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="font-semibold text-neutral-900">Revenue Chart</h2>
        <p className="mt-4 text-sm text-neutral-500">
          Connect Stripe to see your revenue data visualized here.
        </p>
        <div className="mt-6 h-64 rounded-lg bg-neutral-50 flex items-center justify-center">
          <p className="text-neutral-400 text-sm">Chart placeholder — Stripe integration required</p>
        </div>
      </div>
    </div>
  );
}
