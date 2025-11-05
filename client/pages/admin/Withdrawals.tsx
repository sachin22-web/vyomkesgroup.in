import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Withdrawal as WithdrawalType } from "@shared/api"; // Import shared type
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, DollarSign, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Img } from "@/components/Img"; // Import the Img component

export default function AdminWithdrawals() {
  const [items, setItems] = useState<WithdrawalType[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("requested"); // Default to 'requested'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const limit = 10;

  const [openDialog, setOpenDialog] = useState(false);
  const [editingWithdrawal, setEditingWithdrawal] = useState<WithdrawalType | null>(null);
  const [dialogReason, setDialogReason] = useState("");
  const [dialogRRN, setDialogRRN] = useState("");
  const [dialogGateway, setDialogGateway] = useState("");

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

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: WithdrawalType[]; total: number }>(
        `/api/admin/withdrawals?${params}`
      );
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      console.error("Failed to load withdrawals:", e);
      setError(e?.message || "Failed to load withdrawals. Please check server logs.");
      toast.error(e?.message || "Failed to load withdrawals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [params]);

  const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "requested":
      case "under_admin_review":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "paid":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "rejected":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const openActionDialog = (withdrawal: WithdrawalType) => {
    setEditingWithdrawal(withdrawal);
    setDialogReason(withdrawal.reason || "");
    setDialogRRN(withdrawal.rrn || "");
    setDialogGateway(withdrawal.gateway || "");
    setOpenDialog(true);
  };

  const handleStatusUpdate = async (newStatus: WithdrawalType['status']) => {
    if (!editingWithdrawal) return;

    let body: any = { status: newStatus };
    if (newStatus === "rejected" || newStatus === "failed") {
      if (!dialogReason.trim()) {
        toast.error("Reason is required for rejection/failure.");
        return;
      }
      body.reason = dialogReason.trim();
    }
    if (newStatus === "paid") {
      if (!dialogRRN.trim() || !dialogGateway.trim()) {
        toast.error("RRN and Gateway are required to mark as paid.");
        return;
      }
      body.rrn = dialogRRN.trim();
      body.gateway = dialogGateway.trim();
    }

    try {
      await api(`/api/admin/withdrawals/${editingWithdrawal._id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast.success(`Withdrawal marked as ${newStatus.replace(/_/g, ' ')}!`);
      setOpenDialog(false);
      setEditingWithdrawal(null);
      fetchWithdrawals(); // Refresh the list
    } catch (e: any) {
      toast.error(e?.message || `Failed to update withdrawal status to ${newStatus}.`);
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="text-2xl font-semibold">Withdrawals</div>
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
              <SelectItem value="requested">Requested</SelectItem>
              <SelectItem value="under_admin_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Img
        src="/images/admin_withdrawals_management.jpg"
        alt="Admin Withdrawals Management"
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
            <div className="text-sm text-muted-foreground">No withdrawals found.</div>
          )}
          {!loading && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Net Payout</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2 pr-3">Requested At</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((withdrawal) => (
                    <tr key={withdrawal._id} className="border-t">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{withdrawal.userName || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">
                          {withdrawal.userEmail || withdrawal.userPhone || "N/A"}
                        </div>
                      </td>
                      <td className="py-2 pr-3">{inr(withdrawal.amount)}</td>
                      <td className="py-2 pr-3">{inr(withdrawal.netAmount)}</td>
                      <td className="py-2 pr-3 capitalize flex items-center gap-1">
                        {getStatusIcon(withdrawal.status)}
                        {withdrawal.status.replace(/_/g, " ")}
                      </td>
                      <td className="py-2 pr-3 capitalize">{withdrawal.source}</td>
                      <td className="py-2 pr-3">
                        {new Date(withdrawal.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openActionDialog(withdrawal)}>
                          View / Action
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

      <Dialog open={openDialog} onOpenChange={(o) => { setOpenDialog(o); if (!o) setEditingWithdrawal(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Withdrawal Details & Actions</DialogTitle>
          </DialogHeader>
          {editingWithdrawal && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-muted-foreground">User Name:</p>
                <p className="font-medium">{editingWithdrawal.userName || "N/A"}</p>
                <p className="text-muted-foreground">User Email:</p>
                <p className="font-medium">{editingWithdrawal.userEmail || "N/A"}</p>
                <p className="text-muted-foreground">Requested Amount:</p>
                <p className="font-medium">{inr(editingWithdrawal.amount)}</p>
                <p className="text-muted-foreground">Net Payout:</p>
                <p className="font-medium">{inr(editingWithdrawal.netAmount)}</p>
                <p className="text-muted-foreground">Charges:</p>
                <p className="font-medium">{inr(editingWithdrawal.charges)}</p>
                <p className="text-muted-foreground">TDS:</p>
                <p className="font-medium">{inr(editingWithdrawal.tds)}</p>
                <p className="text-muted-foreground">Status:</p>
                <p className="font-medium capitalize">{editingWithdrawal.status.replace(/_/g, " ")}</p>
                <p className="text-muted-foreground">Source:</p>
                <p className="font-medium capitalize">{editingWithdrawal.source}</p>
                <p className="text-muted-foreground">Requested At:</p>
                <p className="font-medium">{new Date(editingWithdrawal.createdAt).toLocaleString()}</p>
                {editingWithdrawal.paidAt && (
                  <>
                    <p className="text-muted-foreground">Paid At:</p>
                    <p className="font-medium">{new Date(editingWithdrawal.paidAt).toLocaleString()}</p>
                  </>
                )}
                {editingWithdrawal.rrn && (
                  <>
                    <p className="text-muted-foreground">RRN:</p>
                    <p className="font-medium">{editingWithdrawal.rrn}</p>
                  </>
                )}
                {editingWithdrawal.gateway && (
                  <>
                    <p className="text-muted-foreground">Gateway:</p>
                    <p className="font-medium">{editingWithdrawal.gateway}</p>
                  </>
                )}
              </div>

              {(editingWithdrawal.status === "rejected" || editingWithdrawal.status === "failed") && (
                <div>
                  <Label htmlFor="dialogReason">Reason</Label>
                  <Textarea
                    id="dialogReason"
                    value={dialogReason}
                    onChange={(e) => setDialogReason(e.target.value)}
                    rows={3}
                    className="mt-1"
                    disabled={editingWithdrawal.status !== "rejected" && editingWithdrawal.status !== "failed"}
                  />
                </div>
              )}

              {editingWithdrawal.status === "approved" && (
                <div className="grid gap-2">
                  <div>
                    <Label htmlFor="dialogRRN">RRN / Transaction ID</Label>
                    <Input
                      id="dialogRRN"
                      value={dialogRRN}
                      onChange={(e) => setDialogRRN(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="dialogGateway">Gateway</Label>
                    <Input
                      id="dialogGateway"
                      value={dialogGateway}
                      onChange={(e) => setDialogGateway(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Close
                </Button>
                {(editingWithdrawal.status === "requested" || editingWithdrawal.status === "under_admin_review") && (
                  <>
                    <Button variant="destructive" onClick={() => handleStatusUpdate("rejected")}>
                      Reject
                    </Button>
                    <Button onClick={() => handleStatusUpdate("approved")}>
                      Approve
                    </Button>
                  </>
                )}
                {editingWithdrawal.status === "approved" && (
                  <>
                    <Button variant="destructive" onClick={() => handleStatusUpdate("failed")}>
                      Mark Failed
                    </Button>
                    <Button onClick={() => handleStatusUpdate("paid")}>
                      Mark Paid
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}