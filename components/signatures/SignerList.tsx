"use client";

import { sendReminder } from "@/app/(portal)/signatures/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SignatureSigner } from "@/types";

export function SignerList({ signers }: { signers: SignatureSigner[] }) {
  return (
    <div className="space-y-2">
      {signers.map((s) => (
        <div key={s.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div>
            <p className="text-sm font-medium">{s.signer_name}</p>
            <p className="text-xs text-text-muted">
              {s.signer_email} {s.signing_sequence ? `· #${s.signing_sequence}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={s.status === "signed" ? "default" : "outline"} className="capitalize">
              {s.status}
            </Badge>
            {s.status === "pending" && (
              <Button type="button" variant="ghost" size="sm" onClick={() => sendReminder(s.id)}>
                Remind
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
