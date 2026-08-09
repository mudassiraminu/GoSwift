import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  open: "bg-secondary text-secondary-foreground",
  quoted: "bg-primary/15 text-primary",
  assigned: "bg-sky-500/15 text-sky-700",
  in_transit: "bg-sky-500/15 text-sky-700",
  picked_up: "bg-amber-500/15 text-amber-800",
  delivered: "bg-success/15 text-success",
  completed: "bg-success/15 text-success",
  confirmed: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground",
  failed: "bg-destructive/15 text-destructive",
  pending: "bg-warning/20 text-warning-foreground",
  accepted: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
  paid: "bg-success/15 text-success",
  processing: "bg-primary/15 text-primary",
  verified: "bg-success/15 text-success",
  under_review: "bg-warning/20 text-warning-foreground",
  suspended: "bg-destructive/15 text-destructive",
  inactive: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize tracking-wide",
        STYLES[key] ?? "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
