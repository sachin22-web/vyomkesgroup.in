import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

interface AppOverview {
  totalInvested: number;
  currentEarnings: number;
  pendingWithdrawals: number;
  nextPayoutDate: string | null;
  referralEarnings: number;
  totalProfit: number; // Added
  totalPayout: number; // Added
}

export default function Transactions() {
  const [ov, setOv] = useState<AppOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true); // Set loading true on fetch
      try {
        const r = await fetch("/api/app/overview", { credentials: "include" });
        if (!r.ok) throw new Error("Failed to load overview");
        const j = (await r.json()) as AppOverview;
        if (!cancelled) setOv(j);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false); // Set loading false after fetch
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  return (
    <>
      <Seo title="Your Transactions" description="View your investment and payout transaction history." />
      <div className="grid gap-6">
        <h1 className="text-2xl font-semibold">Transactions</h1> {/* Changed to h1 */}

        <Img
          src="/images/transaction_history.jpg" // Transaction history/documents
          alt="Transaction history and financial documents"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm text-muted-foreground mb-2">Summary</h2> {/* Changed to h2 */}
            {err && <div className="text-destructive text-sm">{err}</div>}
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              ov && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total Invested</div>
                  <div className="text-right font-medium">
                    {inr(ov.totalInvested)}
                  </div>
                  <div>Total Profit</div>
                  <div className="text-right font-medium">
                    {inr(ov.totalProfit)}
                  </div>
                  <div>Total Payouts</div>
                  <div className="text-right font-medium">
                    {inr(ov.totalPayout)}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            <h2 className="text-sm text-muted-foreground">Transaction History</h2> {/* Changed to h2 */}
            No transactions listing API exists in this project yet.
          </CardContent>
        </Card>
      </div>
    </>
  );
}