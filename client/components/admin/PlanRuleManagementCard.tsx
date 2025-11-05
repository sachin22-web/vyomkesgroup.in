import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanRule } from "@/hooks/use-admin-plans";
import { toast } from "sonner"; // Import toast for notifications

interface PlanRuleManagementCardProps {
  latestPlanRule: PlanRule | null;
  loadingPlanRule: boolean;
  activateLatestPlanRule: () => Promise<void>;
}

export const PlanRuleManagementCard: React.FC<PlanRuleManagementCardProps> = ({
  latestPlanRule,
  loadingPlanRule,
  activateLatestPlanRule,
}) => {
  const handleActivateClick = async () => {
    if (!latestPlanRule) {
      toast.error("No plan rule found to activate. Please create one first.");
      return;
    }
    await activateLatestPlanRule();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Investment Rule</CardTitle>
      </CardHeader>
      <CardContent className="p-5 grid gap-3">
        {loadingPlanRule ? (
          <Skeleton className="h-20 w-full" />
        ) : latestPlanRule ? (
          <div className="space-y-2">
            <p className="text-sm">
              Latest Rule: <span className="font-medium">{latestPlanRule.name} (Version {latestPlanRule.version})</span>
            </p>
            <p className="text-sm">
              Status:{" "}
              <span className={`font-medium ${latestPlanRule.active ? "text-green-600" : "text-red-600"}`}>
                {latestPlanRule.active ? "Active" : "Inactive"}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Effective From: {new Date(latestPlanRule.effectiveFrom).toLocaleString()}
            </p>
            <Button
              onClick={handleActivateClick}
              disabled={latestPlanRule.active}
              className="mt-2"
            >
              {latestPlanRule.active ? "Already Active" : "Activate Latest Rule"}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No global investment rules found.</p>
            <p className="text-sm text-muted-foreground">Please create a new plan rule to define how investments are processed and payouts are calculated.</p>
            {/* Optionally add a button to navigate to create a new plan rule if such a route exists */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};