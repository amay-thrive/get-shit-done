import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage integrations and system configuration
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stripe</CardTitle>
            <CardDescription>Payment processing and invoicing</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-500">Not connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zoho CRM</CardTitle>
            <CardDescription>Contact and deal management</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-500">Not connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zapier</CardTitle>
            <CardDescription>Workflow automation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-500">Not connected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Agents (Claude)</CardTitle>
            <CardDescription>Anthropic API for agent execution</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-500">Not connected</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
