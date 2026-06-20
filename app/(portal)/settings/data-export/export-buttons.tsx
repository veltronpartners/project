"use client";

import { useState } from "react";
import { exportModuleCsv, exportFullDatabaseJson } from "./actions";
import { Button } from "@/components/ui/button";

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const MODULES = [
  { key: "portfolio", label: "Portfolio" },
  { key: "decisions", label: "Decisions" },
  { key: "contacts", label: "Contacts" },
  { key: "finance_expenses", label: "Finance — Expenses" },
  { key: "finance_budgets", label: "Finance — Budgets" },
  { key: "hr_staff_profiles", label: "HR — Staff Profiles" },
  { key: "compliance_conflicts", label: "Compliance — Conflicts" },
  { key: "compliance_contracts", label: "Compliance — Contracts" },
  { key: "projects", label: "Projects" },
  { key: "audit_log", label: "Audit Log" },
];

export function ExportButtons() {
  const [pending, setPending] = useState<string | null>(null);

  async function exportOne(key: string, label: string) {
    setPending(key);
    const result = await exportModuleCsv(key);
    setPending(null);
    if (result.csv) download(result.csv, `veltron-${key}.csv`, "text/csv");
    else alert(result.error);
  }

  async function exportAll() {
    setPending("full");
    const result = await exportFullDatabaseJson();
    setPending(null);
    if (result.json) download(result.json, "veltron-full-export.json", "application/json");
    else alert(result.error);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-2">
        {MODULES.map((m) => (
          <Button
            key={m.key}
            variant="outline"
            disabled={pending === m.key}
            onClick={() => exportOne(m.key, m.label)}
          >
            {pending === m.key ? "Exporting…" : `Export ${m.label} (CSV)`}
          </Button>
        ))}
      </div>
      <Button disabled={pending === "full"} onClick={exportAll}>
        {pending === "full" ? "Exporting…" : "Export full database (JSON)"}
      </Button>
    </div>
  );
}
