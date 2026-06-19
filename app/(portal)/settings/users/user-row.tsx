"use client";

import { changeUserRole, setUserActive, resetUser2fa } from "./actions";
import { ROLE_LABELS, type Role, type User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

export function UserRow({ user, isSelf }: { user: User; isSelf: boolean }) {
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-2">
        <div className="font-medium">{user.full_name}</div>
        <div className="text-xs text-text-muted">{user.email}</div>
      </td>
      <td className="px-4 py-2">
        <Select
          defaultValue={user.role}
          disabled={isSelf}
          onValueChange={(role) => changeUserRole(user.id, role as Role)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-2">
        <Badge variant={user.is_active ? "default" : "outline"}>
          {user.is_active ? "Active" : "Deactivated"}
        </Badge>
      </td>
      <td className="px-4 py-2">
        <Badge variant="outline">{user.two_factor_enabled ? "Enabled" : "Not set up"}</Badge>
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-2">
          {!isSelf && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUserActive(user.id, !user.is_active)}
            >
              {user.is_active ? "Deactivate" : "Reactivate"}
            </Button>
          )}
          {user.two_factor_enabled && (
            <Button type="button" variant="outline" size="sm" onClick={() => resetUser2fa(user.id)}>
              Reset 2FA
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
