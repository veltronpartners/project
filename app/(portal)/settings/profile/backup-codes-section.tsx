"use client";

import { useState } from "react";
import { regenerateBackupCodes } from "./actions";
import { Button } from "@/components/ui/button";

export function BackupCodesSection({ remaining }: { remaining: number }) {
  const [codes, setCodes] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setPending(true);
    setError(null);
    const result = await regenerateBackupCodes();
    setPending(false);
    if (result.error) setError(result.error);
    else setCodes(result.codes ?? null);
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <h3 className="font-heading text-sm font-semibold">Two-factor backup codes</h3>
      <p className="text-sm text-text-muted">{remaining} backup codes remaining.</p>

      {codes ? (
        <>
          <p className="text-xs text-text-muted">
            Save these now — they won&apos;t be shown again. Regenerating invalidates the old codes.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-md bg-muted p-4 font-mono text-sm">
            {codes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </>
      ) : (
        <Button type="button" variant="outline" onClick={handleRegenerate} disabled={pending}>
          {pending ? "Regenerating…" : "Regenerate backup codes"}
        </Button>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
