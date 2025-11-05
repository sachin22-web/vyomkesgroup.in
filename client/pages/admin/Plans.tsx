import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAdminPlans } from "@/hooks/use-admin-plans";
import { usePlanForm } from "@/hooks/use-plan-form";
import { PlanListTable } from "@/components/admin/PlanListTable";
import { PlanFormDialog } from "@/components/admin/PlanFormDialog";
import { PlanRuleManagementCard } from "@/components/admin/PlanRuleManagementCard";
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

export default function AdminPlans() {
  const {
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
    fetchAllPlans,
  } = useAdminPlans();

  const { open, setOpen, edit, setEdit, openNewPlan, openEditPlan, savePlan } =
    usePlanForm(fetchAllPlans, allPlans); // Pass fetchAllPlans as onSaveSuccess

  return (
    <>
      <Seo title="Admin Plans & Rules" description="Manage investment plans and global plan rules for the platform." />
      <div className="grid gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">Plans & Rules</h1> {/* Changed to h1 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="w-full sm:w-auto"
            />
            <div className="flex items-center gap-2 text-sm w-full sm:w-auto justify-end">
              <span>Active only</span>
              <Switch
                checked={showActiveOnly}
                onCheckedChange={setShowActiveOnly}
              />
            </div>
            <Button onClick={openNewPlan} className="w-full sm:w-auto">
              New Plan
            </Button>
          </div>
        </div>

        <Img
          src="/images/investment_plans.jpg" // Investment Plans
          alt="Investment plans and financial rules management"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <PlanRuleManagementCard
          latestPlanRule={latestPlanRule}
          loadingPlanRule={loadingPlanRule}
          activateLatestPlanRule={activateLatestPlanRule}
        />

        <PlanListTable
          filteredPlans={filteredPlans}
          loading={loading}
          error={error}
          page={page}
          setPage={setPage}
          total={total}
          limit={limit}
          onEdit={openEditPlan}
          onToggle={togglePlan}
          onRemove={removePlan}
          onMove={movePlan}
        />

        <PlanFormDialog
          open={open}
          setOpen={setOpen}
          edit={edit}
          setEdit={setEdit}
          onSave={savePlan}
        />
      </div>
    </>
  );
}