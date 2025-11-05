import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trash2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionsBarProps {
  selectedCount: number;
  totalItems: number;
  onDeleteSelected: () => void;
  onDeleteAllFiltered: () => void;
  onDownloadCsv: () => void;
  isDeleting: boolean;
  resourceName: string; // e.g., "users", "plans"
  className?: string;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  totalItems,
  onDeleteSelected,
  onDeleteAllFiltered,
  onDownloadCsv,
  isDeleting,
  resourceName,
  className,
}) => {
  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border rounded-md bg-background shadow-sm", className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">{selectedCount}</span> selected out of <span className="font-medium">{totalItems}</span> {resourceName}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
          disabled={selectedCount === 0 || isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting ? "Deleting..." : `Delete Selected (${selectedCount})`}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteAllFiltered}
          disabled={totalItems === 0 || isDeleting}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isDeleting ? "Deleting All..." : `Delete All (Filtered ${totalItems})`}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadCsv}
          disabled={totalItems === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </div>
    </div>
  );
};