"use client";

import { reviewPartnerDocument } from "@/app/(portal)/portfolio/[id]/partner/actions";
import { Button } from "@/components/ui/button";

export function PartnerDocumentReview({ documentId, portfolioId }: { documentId: string; portfolioId: string }) {
  return (
    <div className="flex gap-2">
      <Button type="button" size="sm" onClick={() => reviewPartnerDocument(documentId, portfolioId, "accepted")}>
        Accept
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => reviewPartnerDocument(documentId, portfolioId, "rejected")}>
        Reject
      </Button>
    </div>
  );
}
