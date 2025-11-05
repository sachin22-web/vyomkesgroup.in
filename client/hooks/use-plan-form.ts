import { useState } from "react";
import { toast } from "sonner";
import { Plan } from "./use-admin-plans"; // Import Plan type
import { api } from "@/lib/api";

export type EditState = Partial<Plan> & { force?: boolean };

export function usePlanForm(onSaveSuccess: () => Promise<void>, allPlans: Plan[] | null) {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<EditState | null>(null);

  const openNewPlan = () => {
    setEdit({
      title: "",
      startMonth: 1,
      endMonth: 3,
      annualReturnPercent: 36,
      minInvestment: 100000,
      isActive: false,
      sortOrder: (allPlans?.length || 0) + 1,
    });
    setOpen(true);
  };

  const openEditPlan = (plan: Plan) => {
    setEdit({ ...plan });
    setOpen(true);
  };

  const savePlan = async () => {
    if (!edit) return;
    const body = { ...edit } as any;
    try {
      const isNew = !edit._id;
      const url = isNew ? "/api/admin/plans" : `/api/admin/plans/${edit._id}`;

      const initialResponse = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (initialResponse.status === 409) {
        const errorData = await initialResponse.json();
        if (errorData?.code === "OVERLAP") {
          if (confirm("Overlapping active range. Proceed anyway?")) {
            const forceResponse = await fetch(url, {
              method: isNew ? "POST" : "PUT",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ ...body, force: true }),
            });
            if (!forceResponse.ok) {
              const forceErrorData = await forceResponse.json().catch(() => ({}));
              throw new Error(forceErrorData?.message || "Save failed after force attempt");
            }
          } else {
            return;
          }
        } else {
          throw new Error(errorData?.message || "Save failed due to conflict");
        }
      } else if (!initialResponse.ok) {
        const errorData = await initialResponse.json().catch(() => ({}));
        throw new Error(errorData?.message || "Save failed");
      }

      toast.success("Saved");
      setOpen(false);
      setEdit(null);
      await onSaveSuccess(); // Refresh data in parent component
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    }
  };

  return {
    open,
    setOpen,
    edit,
    setEdit,
    openNewPlan,
    openEditPlan,
    savePlan,
  };
}