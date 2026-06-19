import { AuthShell } from "@/components/shared/AuthShell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="Password resets are sent by a Director from Settings → Users. This self-service flow goes live once the Resend email integration is connected."
    >
      <p className="text-sm text-text-muted">
        In the meantime, ask a Director to trigger a reset email for your account.
      </p>
    </AuthShell>
  );
}
