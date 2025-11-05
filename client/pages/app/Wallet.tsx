import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { UserWallet } from "@shared/api"; // Import shared type
import { Wallet as WalletIcon, Lock, DollarSign, Calendar, AlertCircle, PiggyBank, TrendingUp } from "lucide-react"; // Renamed Wallet to WalletIcon
import { Skeleton } from "@/components/ui/skeleton";
import { Img } from "@/components/Img"; // Import the Img component

export default function Wallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [overviewData, setOverviewData] = useState<any>(null); // To store other overview data
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) { // Only fetch if user is logged in
        setWallet(null);
        setOverviewData(null);
        setLoading(false);
        return;
      }
      setLoading(true); // Set loading true on fetch
      try {
        const r = await fetch("/api/app/overview", { credentials: "include" });
        if (!r.ok) throw new Error("Failed to load wallet data");
        const j = (await r.json()) as any; // Use 'any' for now, then refine
        if (!cancelled) {
          setOverviewData(j);
          setWallet({
            balance: j.balance,
            locked: j.locked,
            available: j.balance - j.locked,
          });
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load wallet data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user]); // Dependency on user to re-fetch when user object changes

  const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
  const fmtDate = (v: string | null) => (v ? new Date(v).toDateString() : "—");

  return (
    <div className="grid gap-6">
      <div className="text-2xl font-semibold">Wallet</div>

      <Img
        src="/images/digital_wallet.jpg" // Digital wallet/finance
        alt="Digital wallet overview"
        className="w-full h-48 object-cover rounded-xl border"
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground mb-2">Current Balance</div>
            <div className="flex items-center justify-between">
              <WalletIcon className="h-6 w-6 text-blue-600" />
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-24" /> : (wallet ? inr(wallet.balance) : "—")}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground mb-2">Locked Amount</div>
            <div className="flex items-center justify-between">
              <Lock className="h-6 w-6 text-orange-600" />
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-24" /> : (wallet ? inr(wallet.locked) : "—")}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground mb-2">Available for Withdrawal</div>
            <div className="flex items-center justify-between">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-24" /> : (wallet ? inr(wallet.available) : "—")}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground mb-2">Investment Summary</div>
            {err && <div className="text-destructive text-sm">{err}</div>}
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              overviewData && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Invested</div>
                  <div className="text-right font-medium">
                    {inr(overviewData.totalInvested)}
                  </div>
                  <div>Total Payouts</div>
                  <div className="text-right font-medium">
                    {inr(overviewData.totalPayout)}
                  </div>
                  <div>Total Profit</div>
                  <div className="text-right font-medium">
                    {inr(overviewData.totalProfit)}
                  </div>
                  <div>Referral Earnings</div>
                  <div className="text-right font-medium">
                    {inr(overviewData.referralEarnings)}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground mb-2">Status</div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              overviewData && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Pending Withdrawals</div>
                  <div className="text-right font-medium">
                    {overviewData.pendingWithdrawals}
                  </div>
                  <div>Next Payout</div>
                  <div className="text-right font-medium">
                    {fmtDate(overviewData.nextPayoutDate)}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}