import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PartnerContact, User } from "@/types";

/**
 * Centralized session check for the internal portal. Cached per request so
 * every Server Component/Action on a page can call it without duplicate
 * queries. Redirects rather than returning null — callers can assume a
 * staff User comes back.
 */
export const getCurrentStaffUser = cache(async (): Promise<User> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: staffRow } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!staffRow) redirect("/partner/dashboard");
  return staffRow as User;
});

/** Same pattern as getCurrentStaffUser, for the partner portal's auth context. */
export const getCurrentPartner = cache(async (): Promise<PartnerContact> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/partner-login");

  const { data: partnerRow } = await supabase
    .from("partner_contacts")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!partnerRow) redirect("/dashboard");
  return partnerRow as PartnerContact;
});
