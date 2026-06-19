import { AuthShell } from "@/components/shared/AuthShell";
import { LoginForm } from "@/components/shared/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Internal portal — Veltron Partners staff only."
      footer="Forgot your password? Contact a Director to reset it."
    >
      <LoginForm />
    </AuthShell>
  );
}
