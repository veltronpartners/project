import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function IntakeRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: engagement } = await supabase
    .from("engagements")
    .select("current_stage")
    .eq("id", id)
    .maybeSingle();

  if (!engagement) notFound();
  redirect(`/intake/${id}/stage/${engagement.current_stage}`);
}
