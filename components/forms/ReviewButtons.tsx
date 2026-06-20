"use client";

import { useState } from "react";
import { reviewSubmission } from "@/app/(portal)/forms/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewButtons({ submissionId, assignmentId }: { submissionId: string; assignmentId: string }) {
  const [showFlag, setShowFlag] = useState(false);
  const [note, setNote] = useState("");

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button type="button" onClick={() => reviewSubmission(submissionId, assignmentId, "accepted")}>
          Accept submission
        </Button>
        <Button type="button" variant="outline" onClick={() => setShowFlag((v) => !v)}>
          Flag &amp; reopen
        </Button>
      </div>
      {showFlag && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <Textarea
            placeholder="What needs to change?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => reviewSubmission(submissionId, assignmentId, "reopened", note)}
          >
            Send back to partner
          </Button>
        </div>
      )}
    </div>
  );
}
