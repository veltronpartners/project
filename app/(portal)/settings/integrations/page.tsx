import { redirect } from "next/navigation";
import { getCurrentStaffUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { isDirector } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlackForm } from "./slack-form";
import { NotionForm } from "./notion-form";
import { disconnectSlack, disconnectNotion } from "./actions";

export default async function IntegrationsPage() {
  const user = await getCurrentStaffUser();
  if (!isDirector(user.role)) redirect("/dashboard");

  const supabase = await createClient();
  const { data: settings } = await supabase.from("integration_settings").select("*");
  const slack = settings?.find((s) => s.integration === "slack");
  const notion = settings?.find((s) => s.integration === "notion");

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-heading text-2xl font-semibold">Integrations</h1>

      <section className="space-y-4 rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">Slack</h2>
          <div className="flex items-center gap-2">
            <Badge variant={slack?.is_connected ? "default" : "outline"}>
              {slack?.is_connected ? "Connected" : "Disconnected"}
            </Badge>
            {slack?.is_connected && (
              <form action={disconnectSlack}>
                <Button type="submit" variant="outline" size="sm">
                  Disconnect
                </Button>
              </form>
            )}
          </div>
        </div>
        <SlackForm channel={slack?.config?.channel ?? ""} events={slack?.config?.events ?? []} />
      </section>

      <section className="space-y-4 rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">Notion</h2>
          <div className="flex items-center gap-2">
            <Badge variant={notion?.is_connected ? "default" : "outline"}>
              {notion?.is_connected ? "Connected" : "Disconnected"}
            </Badge>
            {notion?.is_connected && (
              <form action={disconnectNotion}>
                <Button type="submit" variant="outline" size="sm">
                  Disconnect
                </Button>
              </form>
            )}
          </div>
        </div>
        <NotionForm />
      </section>

      <section className="space-y-2 rounded-md border border-border p-4">
        <h2 className="font-heading text-lg font-medium">Google</h2>
        <p className="text-sm text-text-muted">
          Google Calendar/Drive sync is optional and per-staff — each person connects their own account from
          Settings → Profile, not here. It&apos;s not company-wide and never required to use the portal.
        </p>
      </section>
    </div>
  );
}
