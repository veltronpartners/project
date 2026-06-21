import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const STAFF_2FA_COOKIE = "veltron-2fa";
const PARTNER_2FA_COOKIE = "veltron-partner-2fa";

const STAFF_PUBLIC_PATHS = ["/login", "/forgot-password"];
const TFA_PATHS = ["/2fa-setup", "/2fa-verify"];

function isPublicAsset(pathname: string) {
  return pathname.startsWith("/sign/") || pathname.startsWith("/respond/") || pathname === "/partner-login";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAsset(pathname)) {
    return NextResponse.next();
  }

  const { response, user, supabase } = await updateSession(request);

  const isPartnerRoute = pathname.startsWith("/partner/");
  const isTfaRoute = TFA_PATHS.some((p) => pathname.startsWith(p));
  const isStaffPublicRoute = STAFF_PUBLIC_PATHS.some((p) =>
    pathname.startsWith(p),
  );

  // No Supabase session at all.
  if (!user) {
    if (isStaffPublicRoute) return response;
    const loginUrl = isPartnerRoute ? "/partner-login" : "/login";
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // Authenticated but on a "logged out only" page — figure out where they belong.
  const { data: staffRow } = await supabase
    .from("users")
    .select("id, two_factor_exempt")
    .eq("id", user.id)
    .maybeSingle();
  const isStaff = Boolean(staffRow);

  if (isStaffPublicRoute) {
    return NextResponse.redirect(
      new URL(isStaff ? "/dashboard" : "/partner/dashboard", request.url),
    );
  }

  if (isTfaRoute) {
    // 2FA setup/verify pages do their own DB check of two_factor_enabled
    // to decide which of the two to show — proxy only confirms a session exists.
    return response;
  }

  if (isPartnerRoute) {
    if (isStaff) {
      // Staff accounts never get routed into the partner portal (Section 10.2).
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    const { data: partnerRow } = await supabase
      .from("partner_contacts")
      .select("two_factor_exempt")
      .eq("id", user.id)
      .maybeSingle();
    const verified = request.cookies.get(PARTNER_2FA_COOKIE);
    if (!verified && !partnerRow?.two_factor_exempt) {
      return NextResponse.redirect(new URL("/2fa-verify", request.url));
    }
    return response;
  }

  // Everything else is internal-portal-only.
  if (!isStaff) {
    return NextResponse.redirect(new URL("/partner/dashboard", request.url));
  }
  const verified = request.cookies.get(STAFF_2FA_COOKIE);
  if (!verified && !staffRow?.two_factor_exempt) {
    return NextResponse.redirect(new URL("/2fa-verify", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
