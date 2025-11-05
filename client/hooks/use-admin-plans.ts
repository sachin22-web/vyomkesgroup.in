import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type Plan = {
  _id: string;
  title: string;
  startMonth: number;
  endMonth: number;
  annualReturnPercent: number;
  minInvestment: number;
  isActive: boolean;
  sortOrder: number;
};

export type PlanRule = {
  _id: string;
  name: string;
  active: boolean;
  version: number;
  effectiveFrom: string;
};

export function useAdminPlans() {
  const [allPlans, setAllPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [latestPlanRule, setLatestPlanRule] = useState<PlanRule | null>(null);
  const [loadingPlanRule, setLoadingPlanRule] = useState(false);

  const fetchAllPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api<Plan[]>("/api/admin/plans");
      setAllPlans(r);
    } catch (e: any) {
      console.error("Failed to load plans:", e);
      setError(e?.message || "Failed to load plans. Please check server logs.");
      toast.error(e?.message || "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestPlanRule = async () => {
    setLoadingPlanRule(true);
    try {
      const data = await api<PlanRule>("/api/admin/plan-rules/latest");
      setLatestPlanRule(data);
    } catch (e: any) {
      console.error("Failed to load latest plan rule:", e);
      toast.error(e?.message || "Failed to load latest plan rule.");
    } finally {
      setLoadingPlanRule(false);
    }
  };

  useEffect(() => {
    fetchAllPlans();
    fetchLatestPlanRule();
  }, []);

  const filteredPlans = useMemo(() => {
    const base = allPlans || [];
    let rows = base;
    if (showActiveOnly) rows = rows.filter((p) => p.isActive);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      rows = rows.filter((p) => p.title.toLowerCase().includes(s));
    }
    setTotal(rows.length);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return rows.slice(startIndex, endIndex);
  }, [allPlans, q, showActiveOnly, page, limit]);

  const togglePlan = async (p: Plan) => {
    try {
      await api(`/api/admin/plans/${p._id}/toggle`, {
        method: "PATCH",
      });
      toast.success(p.isActive ? "Deactivated" : "Plan Approved!");
      await fetchAllPlans();
    } catch (e: any) {
      toast.error(e?.message || "Toggle failed");
    }
  };

  const removePlan = async (p: Plan) => {
    if (!confirm(`Delete plan: ${p.title}?`)) return;
    try {
      await api(`/api/admin/plans/${p._id}`, {
        method: "DELETE",
      });
      toast.success("Deleted");
      await fetchAllPlans();
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  };

  const movePlan = async (p: Plan, dir: -1 | 1) => {
    if (!allPlans) return;
    const idx = allPlans.findIndex((x) => x._id === p._id);
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= allPlans.length) return;
    const a = allPlans[idx];
    const b = allPlans[targetIdx];
    try {
      const up1 = api(`/api/admin/plans/${a._id}`, {
        method: "PUT",
        body: JSON.stringify({ ...a, sortOrder: b.sortOrder }),
      });
      const up2 = api(`/api/admin/plans/${b._id}`, {
        method: "PUT",
        body: JSON.stringify({ ...b, sortOrder: a.sortOrder }),
      });
      await Promise.all([up1, up2]);
      await fetchAllPlans();
    } catch (e: any) {
      toast.error(e?.message || "Reorder failed");
    }
  };

  const activateLatestPlanRule = async () => {
    if (!latestPlanRule?._id) {
      toast.error("No plan rule found to activate.");
      return;
    }
    if (latestPlanRule.active) {
      toast.info("The latest plan rule is already active.");
      return;
    }
    if (!confirm(`Are you sure you want to activate the latest plan rule (Version ${latestPlanRule.version})? This will deactivate any other active plan rules.`)) {
      return;
    }
    try {
      await api(`/api/admin/plan-rules/${latestPlanRule._id}/activate`, {
        method: "PATCH",
      });
      toast.success(`Plan Rule Version ${latestPlanRule.version} activated successfully!`);
      fetchLatestPlanRule(); // Refresh status
    } catch (e: any) {
      toast.error(e?.message || "Failed to activate plan rule.");
    }
  };

  return {
    allPlans,
    error,
    loading,
    q,
    setQ,
    showActiveOnly,
    setShowActiveOnly,
    filteredPlans,
    page,
    setPage,
    total,
    limit,
    togglePlan,
    removePlan,
    movePlan,
    latestPlanRule,
    loadingPlanRule,
    activateLatestPlanRule,
    fetchAllPlans, // Expose fetchAllPlans for refreshing after form submission
  };
}