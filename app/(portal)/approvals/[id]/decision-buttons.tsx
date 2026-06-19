"use client";

import { useActionState, useState } from "react";
import { decideApproval, type FormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function DecisionButtons({ requestId }: { requestId: string }) {
  const [showDecline, setShowDecline] = useState(false);

  const approveAction = decideApproval.bind(null, requestId, "approved");
  const declineAction = decideApproval.bind(null, requestId, "declined");
  const moreInfoAction = decideApproval.bind(null, requestId, "more_info_requested");

  const [approveState, approveFormAction, approvePending] = useActionState<FormState, FormData>(
    approveAction,
    undefined,
  );
  const [declineState, declineFormAction, declinePending] = useActionState<FormState, FormData>(
    declineAction,
    undefined,
  );
  const [, moreInfoFormAction, moreInfoPending] = useActionState<FormState, FormData>(
    moreInfoAction,
    undefined,
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <form action={approveFormAction}>
          <Button type="submit" disabled={approvePending}>
            {approvePending ? "Approving…" : "Approve"}
          </Button>
        </form>
        <Button type="button" variant="outline" onClick={() => setShowDecline((v) => !v)}>
          Decline
        </Button>
        <form action={moreInfoFormAction}>
          <Button type="submit" variant="ghost" disabled={moreInfoPending}>
            {moreInfoPending ? "Sending…" : "Request More Info"}
          </Button>
        </form>
      </div>
      {approveState?.error && <p className="text-sm text-danger">{approveState.error}</p>}

      {showDecline && (
        <form action={declineFormAction} className="space-y-2 rounded-md border border-border p-3">
          <Label htmlFor="decline_reason">Decline reason (required)</Label>
          <Textarea id="decline_reason" name="decline_reason" rows={2} required />
          {declineState?.error && <p className="text-sm text-danger">{declineState.error}</p>}
          <Button type="submit" variant="destructive" disabled={declinePending}>
            {declinePending ? "Declining…" : "Confirm decline"}
          </Button>
        </form>
      )}
    </div>
  );
}
