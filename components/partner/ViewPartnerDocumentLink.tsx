"use client";

import { useState } from "react";
import { getPartnerDocumentUrl } from "@/app/(portal)/portfolio/[id]/partner/actions";
import { Button } from "@/components/ui/button";

export function ViewPartnerDocumentLink({ storagePath }: { storagePath: string }) {
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    const url = await getPartnerDocumentUrl(storagePath);
    setLoading(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else alert("Couldn't open this file.");
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={open} disabled={loading}>
      {loading ? "Opening…" : "View"}
    </Button>
  );
}
