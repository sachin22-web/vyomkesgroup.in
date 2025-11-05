import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton"; 
import { Img } from "@/components/Img"; // Import the Img component
import { DocumentPreview } from "@/components/DocumentPreview";
import { Seo } from "@/components/Seo"; // Import Seo component

interface InvestmentItem {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  principal: number;
  method: string;
  proofUrl?: string;
  utr?: string;
  status: string;
  startedAt: string;
  planVersion: number;
  meta?: {
    planName: string;
    monthDuration: number;
    boosterApplied: boolean;
  };
  createdAt: string;
}

export default function AdminInvestments() {
  const [items, setItems] = useState<InvestmentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("search", q);
    if (statusFilter && statusFilter !== "all") {
      p.set("status", statusFilter);
    }
    p.set("page", String(page));
    p.set("limit", String(limit));
    return p.toString();
  }, [q, statusFilter, page]);

  const fetchInvestments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: InvestmentItem[]; total: number }>(
        `/api/admin/investments?${params}`
      );
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      console.error("Failed to load investments:", e);
      setError(e?.message || "Failed to load investments. Please check server logs.");
      toast.error(e?.message || "Failed to load investments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, [params]);

  const approveInvestment = async (id: string) => {
    try {
      // Send an empty remarks string, as the backend expects a body but remarks is optional.
      await api(`/api/admin/investments/${id}/approve`, { 
        method: "PATCH",
        body: JSON.stringify({ remarks: "" }),
      });
      toast.success("Investment approved and activated!");
      fetchInvestments();
    } catch (e: any) {
      toast.error(e?.message || "Failed to approve investment. Ensure an active global plan rule exists.");
    }
  };

  const rejectInvestment = async (id: string) => {
    const remarks = prompt("Enter rejection remarks:");
    if (!remarks) {
      toast.info("Rejection cancelled. Remarks are required.");
      return;
    }
    try {
      await api(`/api/admin/investments/${id}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ remarks }),
      });
      toast.success("Investment rejected.");
      fetchInvestments();
    } catch (e: any) {
      toast.error(e?.message || "Failed to reject investment.");
    }
  };

  const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  return (
    <>
      <Seo title="Admin Investments" description="Manage user investment orders, approve payments, and track investment statuses." />
      <div className="grid gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">Investments</h1> {/* Changed to h1 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search user (name, email, phone)"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="w-full sm:w-64"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setPage(1);
                setStatusFilter(v);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Img
          src="/images/investment_management.jpg"
          alt="Investment management dashboard with financial charts"
          className="w-full h-48 object-cover rounded-xl border"
        />

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
            {!loading && items.length === 0 && !error && (
              <div className="text-sm text-muted-foreground">No investments found.</div>
            )}
            {!loading && items.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-3">User</th>
                      <th className="py-2 pr-3">Amount</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Method</th>
                      <th className="py-2 pr-3">Proof</th>
                      <th className="py-2 pr-3">Created At</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((inv) => {
                      // Log the URL for debugging
                      console.log(`Investment Proof URL for investment ${inv.id}: ${inv.proofUrl}`);

                      return (
                        <tr key={inv.id} className="border-t">
                          <td className="py-2 pr-3">
                            <div className="font-medium">{inv.userName || "N/A"}</div>
                            <div className="text-xs text-muted-foreground">
                              {inv.userEmail || inv.userPhone || "N/A"}
                            </div>
                          </td>
                          <td className="py-2 pr-3">{inr(inv.principal ?? 0)}</td>
                          <td className="py-2 pr-3 capitalize">
                            {inv.status === "initiated" ? "Awaiting User Proof" : (inv.status || 'N/A').replace(/_/g, " ")}
                          </td>
                          <td className="py-2 pr-3">{inv.method || "N/A"}</td>
                          <td className="py-2 pr-3">
                            {inv.proofUrl ? (
                              <DocumentPreview url={inv.proofUrl} alt={`Payment proof for investment ${inv.id}`} />
                            ) : (
                              inv.status === "initiated" ? "No Proof Uploaded Yet" : "—"
                            )}
                            {inv.utr && (
                              <div className="text-xs text-muted-foreground mt-1">
                                UTR: {inv.utr}
                              </div>
                            )}
                          </td>
                          <td className="py-2 pr-3">
                            {inv.createdAt
                              ? new Date(inv.createdAt).toLocaleString()
                              : "N/A"}
                          </td>
                          <td className="py-2 pr-3 flex flex-wrap gap-2">
                            {(inv.status === "under_review" || inv.status === "initiated") && (
                              <>
                                <Button size="sm" onClick={() => approveInvestment(inv.id)}>
                                  Approve
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => rejectInvestment(inv.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {inv.status === "active" && (
                              <span className="text-green-600 text-sm">Active</span>
                            )}
                            {inv.status === "rejected" && (
                              <span className="text-red-600 text-sm">Rejected</span>
                            )}
                            {inv.status === "completed" && (
                              <span className="text-gray-600 text-sm">Completed</span>
                            )}
                            {inv.status === "cancelled" && (
                              <span className="text-gray-600 text-sm">Cancelled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= Math.ceil(total / limit)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
