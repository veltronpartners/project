"use client";

import { useState } from "react";
import { getFormFieldFileUrl } from "@/app/(partner)/partner/actions";

function fileNameFromPath(path: string) {
  const last = path.split("/").pop() ?? path;
  return last.replace(/^[0-9a-f-]{36}-/, "");
}

export function ViewFormFieldFileLink({ storagePath }: { storagePath: string }) {
  const [loading, setLoading] = useState(false);

  async function open() {
    setLoading(true);
    const url = await getFormFieldFileUrl(storagePath);
    setLoading(false);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else alert("Couldn't open this file.");
  }

  return (
    <button type="button" onClick={open} disabled={loading} className="text-sm text-primary hover:underline disabled:opacity-50">
      {loading ? "Opening…" : fileNameFromPath(storagePath)}
    </button>
  );
}
