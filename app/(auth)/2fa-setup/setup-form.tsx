"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { confirmTotpSetup } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SetupForm({
  secretBase32,
  qrDataUrl,
  isStaff,
}: {
  secretBase32: string;
  qrDataUrl: string;
  isStaff: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    confirmTotpSetup,
    undefined,
  );
  const [copied, setCopied] = useState(false);

  if (state?.backupCodes) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Save these backup codes somewhere safe. Each one can be used once if
          you lose access to your authenticator app — they won&apos;t be shown
          again.
        </p>
        <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-4 font-mono text-sm">
          {state.backupCodes.map((code) => (
            <span key={code}>{code}</span>
          ))}
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={async () => {
            await navigator.clipboard.writeText(state.backupCodes!.join("\n"));
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy codes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => router.push(isStaff ? "/dashboard" : "/partner/dashboard")}
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="Scan this QR code with your authenticator app"
          className="h-48 w-48 rounded-md border border-border"
        />
      </div>
      <p className="text-center text-xs text-text-muted">
        Can&apos;t scan? Enter this key manually:{" "}
        <span className="font-mono">{secretBase32}</span>
      </p>
      <input type="hidden" name="secretBase32" value={secretBase32} />
      <div className="space-y-2">
        <Label htmlFor="token">Confirmation code</Label>
        <Input
          id="token"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          placeholder="6-digit code"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Confirming…" : "Confirm and activate"}
      </Button>
    </form>
  );
}
