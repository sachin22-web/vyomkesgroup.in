import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plan } from "@/hooks/use-admin-plans";

interface PlanListTableProps {
  filteredPlans: Plan[];
  loading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  total: number;
  limit: number;
  onEdit: (plan: Plan) => void;
  onToggle: (plan: Plan) => void;
  onRemove: (plan: Plan) => void;
  onMove: (plan: Plan, dir: -1 | 1) => void;
}

const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

export const PlanListTable: React.FC<PlanListTableProps> = ({
  filteredPlans,
  loading,
  error,
  page,
  setPage,
  total,
  limit,
  onEdit,
  onToggle,
  onRemove,
  onMove,
}) => {
  return (
    <Card>
      <CardContent className="p-5">
        {error && (
          <div className="text-destructive text-sm mb-2">{error}</div>
        )}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}
        {!loading && filteredPlans.length === 0 && !error && (
          <div className="text-sm text-muted-foreground">No plans found.</div>
        )}
        {!loading && filteredPlans.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Range</th>
                  <th className="py-2 pr-3">Annual %</th>
                  <th className="py-2 pr-3">Min Investment</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map((p) => (
                  <tr key={p._id} className="border-t">
                    <td className="py-2 pr-3">{p.sortOrder ?? 'N/A'}</td>
                    <td className="py-2 pr-3">{p.title ?? 'N/A'}</td>
                    <td className="py-2 pr-3">
                      {p.startMonth ?? 'N/A'}–{p.endMonth ?? 'N/A'}
                    </td>
                    <td className="py-2 pr-3">{p.annualReturnPercent ?? 'N/A'}%</td>
                    <td className="py-2 pr-3">{inr(p.minInvestment ?? 0)}</td>
                    <td className="py-2 pr-3">
                      {p.isActive ? (
                        <span className="text-green-600 font-medium">Active</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">Pending Approval</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMove(p, -1)}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMove(p, +1)}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggle(p)}
                      >
                        {p.isActive ? "Deactivate" : "Approve"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRemove(p)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm gap-2">
          <div>
            Page {page} / {Math.max(1, Math.ceil(total / limit))}
          </div>
          <div className="space-x-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};