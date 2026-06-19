import { AuthShell } from "@/components/shared/AuthShell";
import { LoginForm } from "@/components/shared/LoginForm";

export default function PartnerLoginPage() {
  return (
    <AuthShell
      title="Partner sign in"
      description="Sign in to share updates, documents, and reports with your Veltron Lead."
      footer="Trouble signing in? Contact your Veltron Lead."
    >
      <LoginForm />
    </AuthShell>
  );
}
