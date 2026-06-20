"use client";

import { revokeFormLink } from "./actions";
import { Button } from "@/components/ui/button";

export function RevokeLinkButton({ linkId, formId }: { linkId: string; formId: string }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={() => revokeFormLink(linkId, formId)}>
      Revoke
    </Button>
  );
}
