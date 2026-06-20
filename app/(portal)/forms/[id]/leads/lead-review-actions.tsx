"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { declineLead, moveLeadToIntake } from "./actions";
import { Button } from "@/components/ui/button";

export function LeadReviewActions({ submissionId, formId }: { submissionId: string; formId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleMoveToIntake() {
    setPending(true);
    setError(null);
    const result = await moveLeadToIntake(submissionId, formId);
    setPending(false);
    if (result.error) setError(result.error);
    else router.push("/intake");
  }

  async function handleDecline() {
    setPending(true);
    await declineLead(submissionId, formId);
    setPending(false);
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={handleMoveToIntake}>
          Move to Intake
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={handleDecline}>
          Decline
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
