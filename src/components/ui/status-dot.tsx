import { cn } from "@/lib/utils";

interface StatusDotProps {
  status: "connected" | "syncing" | "synced" | "error" | "disconnected";
  className?: string;
}

const statusStyles: Record<StatusDotProps["status"], string> = {
  connected: "bg-success",
  syncing: "bg-warning animate-pulse",
  synced: "bg-success",
  error: "bg-destructive",
  disconnected: "bg-muted-foreground",
};

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 rounded-full",
        statusStyles[status],
        className
      )}
    />
  );
}
