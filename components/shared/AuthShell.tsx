import type { ReactNode } from "react";
import { VeltronLogo } from "@/components/shared/VeltronLogo";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <VeltronLogo />
        </div>
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <h1 className="font-heading text-xl font-semibold text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
        {footer && (
          <p className="mt-6 text-center text-sm text-text-muted">{footer}</p>
        )}
      </div>
    </div>
  );
}
