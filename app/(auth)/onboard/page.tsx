import { AuthShell } from "@/components/shared/AuthShell";

export default function OnboardPage() {
  return (
    <AuthShell
      title="Set up your account"
      description="This page completes the invite flow — set your password, then set up two-factor authentication. It activates once Director invites (Settings → Users) are wired up to a live Supabase project."
    >
      <p className="text-sm text-text-muted">
        Already have a password? <a href="/login" className="text-veltron-gold underline">Sign in</a>.
      </p>
    </AuthShell>
  );
}
