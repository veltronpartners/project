import { generateTotpSetupData } from "@/lib/auth/actions";
import { AuthShell } from "@/components/shared/AuthShell";
import { SetupForm } from "./setup-form";

export default async function TwoFaSetupPage() {
  const { secretBase32, qrDataUrl, isStaff } = await generateTotpSetupData();

  return (
    <AuthShell
      title="Set up two-factor authentication"
      description="Scan the QR code with Google Authenticator, Authy, or 1Password, then enter the 6-digit code to confirm."
    >
      <SetupForm secretBase32={secretBase32} qrDataUrl={qrDataUrl} isStaff={isStaff} />
    </AuthShell>
  );
}
