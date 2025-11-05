import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EditState } from "@/hooks/use-plan-form"; // Corrected: Import EditState from use-plan-form

interface PlanFormDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  edit: EditState | null;
  setEdit: React.Dispatch<React.SetStateAction<EditState | null>>;
  onSave: () => Promise<void>;
}

export const PlanFormDialog: React.FC<PlanFormDialogProps> = ({
  open,
  setOpen,
  edit,
  setEdit,
  onSave,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setEdit(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edit?._id ? "Edit Plan" : "New Plan"}</DialogTitle>
        </DialogHeader>
        {edit && (
          <div className="grid gap-3 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-2">
              <Label htmlFor="planTitle">Title</Label>
              <Input
                id="planTitle"
                value={edit.title ?? ""}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              />
              <Label htmlFor="startMonth">Start Month</Label>
              <Input
                id="startMonth"
                type="number"
                min={1}
                max={60}
                value={edit.startMonth ?? 1}
                onChange={(e) =>
                  setEdit({ ...edit, startMonth: Number(e.target.value) })
                }
              />
              <Label htmlFor="endMonth">End Month</Label>
              <Input
                id="endMonth"
                type="number"
                min={1}
                max={60}
                value={edit.endMonth ?? 1}
                onChange={(e) =>
                  setEdit({ ...edit, endMonth: Number(e.target.value) })
                }
              />
              <Label htmlFor="annualReturnPercent">Annual %</Label>
              <Input
                id="annualReturnPercent"
                type="number"
                min={0}
                max={200}
                value={edit.annualReturnPercent ?? 0}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    annualReturnPercent: Number(e.target.value),
                  })
                }
              />
              <Label htmlFor="minInvestment">Min Investment</Label>
              <Input
                id="minInvestment"
                type="number"
                min={100000} // Changed min to 100000
                value={edit.minInvestment ?? 0}
                onChange={(e) =>
                  setEdit({ ...edit, minInvestment: Number(e.target.value) })
                }
              />
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={edit.sortOrder ?? 0}
                onChange={(e) =>
                  setEdit({ ...edit, sortOrder: Number(e.target.value) })
                }
              />
              <Label htmlFor="isActive">Active</Label>
              <div className="flex justify-end">
                <Switch
                  id="isActive"
                  checked={!!edit.isActive}
                  onCheckedChange={(v) => setEdit({ ...edit, isActive: v })}
                />
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setEdit(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};