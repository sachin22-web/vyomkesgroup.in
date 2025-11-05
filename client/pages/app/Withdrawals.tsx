import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Withdrawal as WithdrawalType, UserWallet } from "@shared/api"; // Import shared types
import { Wallet as WalletIcon, Lock, DollarSign, TrendingDown, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"; // Import icons
import { Skeleton } from "@/components/ui/skeleton";
import { Img } from "@/components/Img"; // Import the Img component
import { useAuth } from "@/hooks/useAuth"; // Import useAuth

export default function Withdrawals() {
  const { user, refresh } = useAuth();
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(100);
  const [withdrawalSource, setWithdrawalSource] = useState<"earnings" | "referral">("earnings");
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [userWithdrawals, setUserWithdrawals] = useState<WithdrawalType[]>([]);
  const [totalWithdrawals, setTotalWithdrawals] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const withdrawalsPerPage = 5;

  const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  const fetchWalletAndWithdrawals = async () => {
    setLoadingWithdrawals(true);
    try {
      // Fetch user overview for wallet balances
      const overview = await api<any>("/api/app/overview");
      setWallet({
        balance: overview.balance,
        locked: overview.locked,
        available: overview.balance - overview.locked,
      });

      // Fetch user withdrawals
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(currentPage));
      params.set("limit", String(withdrawalsPerPage));

      const data = await api<{ items: WithdrawalType[]; total: number }>(
        `/api/app/withdrawals?${params.toString()}`
      );
      setUserWithdrawals(data.items);
      setTotalWithdrawals(data.total);
    } catch (e: any) {
      console.error("Failed to load wallet or withdrawals:", e);
      toast.error(e?.message || "Failed to load wallet data or withdrawals.");
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWalletAndWithdrawals();
    }
  }, [user, statusFilter, currentPage]);

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!user) {
      setFormError("You must be logged in to request a withdrawal.");
      return;
    }
    if (withdrawalAmount < 100) {
      setFormError("Minimum withdrawal amount is ₹100.");
      return;
    }
    if (wallet && withdrawalAmount > wallet.available) {
      setFormError(`Insufficient available balance. Available: ${inr(wallet.available)}`);
      return;
    }
    if (user.kyc?.status !== "approved") {
      setFormError("KYC verification is required for withdrawals. Please complete your KYC.");
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      await api("/api/app/withdrawals", {
        method: "POST",
        body: JSON.stringify({ amount: withdrawalAmount, source: withdrawalSource }),
      });
      toast.success("Withdrawal request submitted successfully!");
      setWithdrawalAmount(100); // Reset form
      setWithdrawalSource("earnings");
      refresh(); // Refresh user context to update balance/locked
      fetchWalletAndWithdrawals(); // Refresh withdrawal list
    } catch (e: any) {
      console.error("Withdrawal request failed:", e);
      setFormError(e?.message || "Failed to submit withdrawal request.");
      toast.error(e?.message || "Failed to submit withdrawal request.");
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

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

  return (
    <div className="grid gap-6">
      <div className="text-2xl font-semibold">Withdrawals</div>

      <Img
        src="/images/withdrawals_money_management.jpg" // Withdrawals/money management
        alt="Withdrawals overview"
        className="w-full h-48 object-cover rounded-xl border"
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground mb-2">Current Balance</div>
            <div className="flex items-center justify-between">
              <WalletIcon className="h-6 w-6 text-blue-600" />
              <div className="text-2xl font-bold">{wallet ? inr(wallet.balance) : <Skeleton className="h-8 w-24" />}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground mb-2">Locked Amount</div>
            <div className="flex items-center justify-between">
              <Lock className="h-6 w-6 text-orange-600" />
              <div className="text-2xl font-bold">{wallet ? inr(wallet.locked) : <Skeleton className="h-8 w-24" />}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground mb-2">Available for Withdrawal</div>
            <div className="flex items-center justify-between">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div className="text-2xl font-bold">{wallet ? inr(wallet.available) : <Skeleton className="h-8 w-24" />}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request New Withdrawal</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <form onSubmit={handleWithdrawalRequest} className="grid gap-4 max-w-2xl">
            <div className="grid md:grid-cols-4 items-center gap-2">
              <Label htmlFor="withdrawalAmount" className="md:col-span-1">Amount (₹)</Label>
              <Input
                id="withdrawalAmount"
                type="number"
                min={100}
                step={100}
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                className="md:col-span-3"
                required
              />
            </div>
            <div className="grid md:grid-cols-4 items-center gap-2">
              <Label htmlFor="withdrawalSource" className="md:col-span-1">Source</Label>
              <Select
                value={withdrawalSource}
                onValueChange={(v) => setWithdrawalSource(v as "earnings" | "referral")}
                disabled={submittingWithdrawal}
              >
                <SelectTrigger id="withdrawalSource" className="md:col-span-3">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="earnings">Earnings</SelectItem>
                  <SelectItem value="referral">Referral Earnings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && <div className="text-destructive text-sm text-center">{formError}</div>}
            <div className="flex justify-end mt-4">
              <Button type="submit" disabled={submittingWithdrawal || !wallet || withdrawalAmount > wallet.available || user?.kyc?.status !== "approved"}>
                {submittingWithdrawal ? "Requesting..." : "Request Withdrawal"}
              </Button>
            </div>
            {user?.kyc?.status !== "approved" && (
              <p className="text-sm text-red-500 text-center">
                KYC is not approved. Please complete KYC to request withdrawals.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex justify-end mb-4">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setCurrentPage(1);
                setStatusFilter(v);
              }}
            >
              <SelectTrigger className="w-[180px]">
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

          {loadingWithdrawals && (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!loadingWithdrawals && userWithdrawals.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <TrendingDown className="h-12 w-12 mx-auto mb-4" />
              <p>You have no withdrawal requests yet.</p>
            </div>
          )}

          {!loadingWithdrawals && userWithdrawals.length > 0 && (
            <div className="space-y-4">
              {userWithdrawals.map((withdrawal) => (
                <Card key={withdrawal._id} className="border-l-4 border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">Withdrawal Request</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getStatusIcon(withdrawal.status)}
                        <span className="capitalize">{withdrawal.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">Requested Amount: <span className="font-medium">{inr(withdrawal.amount)}</span></p>
                    <p className="text-sm text-muted-foreground mb-1">Net Amount: <span className="font-medium">{inr(withdrawal.netAmount)}</span></p>
                    {withdrawal.charges > 0 && <p className="text-xs text-muted-foreground">Charges: {inr(withdrawal.charges)}</p>}
                    {withdrawal.tds > 0 && <p className="text-xs text-muted-foreground">TDS: {inr(withdrawal.tds)}</p>}
                    {withdrawal.reason && <p className="text-sm text-red-500 mt-2">Reason: {withdrawal.reason}</p>}
                    {withdrawal.rrn && <p className="text-sm text-muted-foreground mt-2">RRN: {withdrawal.rrn}</p>}
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 pt-3 border-t">
                      <span>Source: <span className="capitalize">{withdrawal.source}</span></span>
                      <span>Requested: {new Date(withdrawal.createdAt).toLocaleString()}</span>
                      {withdrawal.paidAt && (
                        <span>Paid: {new Date(withdrawal.paidAt).toLocaleString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm gap-2">
                <div>
                  Page {currentPage} / {Math.max(1, Math.ceil(totalWithdrawals / withdrawalsPerPage))}
                </div>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= Math.ceil(totalWithdrawals / withdrawalsPerPage)}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}