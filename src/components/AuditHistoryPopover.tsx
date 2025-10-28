// src/components/AuditHistoryPopover.tsx
import { format } from "date-fns";
import { History } from "lucide-react";

interface AuditEntry {
  old_value: string;
  new_value: string;
  audited_at: string;
  audited_by: string;
}

interface AuditHistoryPopoverProps {
  history: AuditEntry[];
}

export const AuditHistoryPopover = ({ history }: AuditHistoryPopoverProps) => {
  if (!history || history.length === 0) return null;

  const latest = history[0]; // Latest first

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center gap-1 text-muted-foreground">
        <History className="h-3 w-3" />
        <span className="font-medium">Audit History</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <span className="text-muted-foreground">Old:</span>
        <span className="text-right font-medium">{latest.old_value || "—"}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <span className="text-muted-foreground">New:</span>
        <span className="text-right font-medium">{latest.new_value || "—"}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <span className="text-muted-foreground">Audited:</span>
        <span className="text-right">
          {latest.audited_at
            ? format(new Date(latest.audited_at), "MMM d, yyyy h:mm a")
            : "—"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <span className="text-muted-foreground">By:</span>
        <span className="text-right">{latest.audited_by || "—"}</span>
      </div>
    </div>
  );
};