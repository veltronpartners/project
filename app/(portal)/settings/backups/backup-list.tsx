"use client";

import { useState } from "react";
import { getBackupDownloadUrl, runBackupNow } from "./actions";
import { Button } from "@/components/ui/button";

interface BackupFile {
  name: string;
  createdAt: string | null;
  sizeBytes: number | null;
}

export function BackupList({ files }: { files: BackupFile[] }) {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  async function handleRunNow() {
    setRunning(true);
    setError(null);
    const result = await runBackupNow();
    setRunning(false);
    if (result.error) setError(result.error);
  }

  async function handleDownload(name: string) {
    setOpening(name);
    const url = await getBackupDownloadUrl(name);
    setOpening(null);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else setError("Couldn't generate a download link for that backup.");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          A snapshot of every table runs automatically every night at 3am UTC and is kept for 30 days.
        </p>
        <Button onClick={handleRunNow} disabled={running} variant="outline">
          {running ? "Running…" : "Run backup now"}
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {files.length === 0 ? (
        <p className="text-sm text-text-muted">No backups yet — run one now, or wait for tonight's scheduled run.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">File</th>
                <th className="px-4 py-2 font-medium">Created</th>
                <th className="px-4 py-2 font-medium">Size</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.name} className="border-t border-border">
                  <td className="px-4 py-2 font-mono text-xs">{f.name}</td>
                  <td className="px-4 py-2 text-text-muted">
                    {f.createdAt ? new Date(f.createdAt).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-text-muted">
                    {f.sizeBytes ? `${Math.round(f.sizeBytes / 1024)} KB` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <Button variant="ghost" size="sm" disabled={opening === f.name} onClick={() => handleDownload(f.name)}>
                      {opening === f.name ? "Opening…" : "Download"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
