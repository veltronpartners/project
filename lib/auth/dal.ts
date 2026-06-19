import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

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
