import { cn } from "@/lib/utils";

/**
 * Recreated from the brand reference (ascending gold bars merging into a
 * dark checkmark-V) since no source logo asset exists in the repo yet.
 * Swap for the real asset under public/ when available.
 */
export function VeltronMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      className={cn("h-8 w-9", className)}
      aria-hidden="true"
    >
      <path d="M2 14 L24 50 L32 50 L13 14 Z" fill="#34331F" />
      <path d="M62 14 L40 50 L32 50 L51 14 Z" fill="#34331F" />
      <rect x="14" y="30" width="7" height="20" fill="#E3A31D" />
      <rect x="24" y="20" width="7" height="30" fill="#EDB12D" />
      <rect x="34" y="10" width="7" height="40" fill="#E3A31D" />
      <rect x="44" y="0" width="7" height="50" fill="#EDB12D" />
    </svg>
  );
}

export function VeltronLogo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <VeltronMark className={markClassName} />
      <div className="flex flex-col leading-none">
        <span className="font-display text-2xl font-bold text-veltron-charcoal">
          VELTRON
        </span>
        <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] text-veltron-gold">
          <span className="h-px w-3 bg-veltron-gold" />
          PARTNERS
          <span className="h-px w-3 bg-veltron-gold" />
        </span>
      </div>
    </div>
  );
}
