"use client";

import { updateContractStatus } from "@/app/(portal)/compliance/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["draft", "pending_signature", "active", "expired", "terminated"];

export function ContractStatusSelect({ contractId, status }: { contractId: string; status: string }) {
  return (
    <Select defaultValue={status} onValueChange={(next) => updateContractStatus(contractId, next)}>
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s.replace("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
