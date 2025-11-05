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

export default function Payouts() {
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
  const fmtDate = (v: string | null) => (v ? new Date(v).toDateString() : "—");

  return (
    <>
      <Seo title="Your Payouts" description="View your investment payouts and upcoming payment schedules." />
      <div className="grid gap-6">
        <h1 className="text-2xl font-semibold">Payouts</h1> {/* Changed to h1 */}

        <Img
          src="/images/payouts_earnings.jpg" // Payouts/earnings
          alt="Payouts overview with financial charts"
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
                  <div>Total Payouts</div>
                  <div className="text-right font-medium">
                    {inr(ov.totalPayout)}
                  </div>
                  <div>Next Payout</div>
                  <div className="text-right font-medium">
                    {fmtDate(ov.nextPayoutDate)}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            <h2 className="text-sm text-muted-foreground">Payout History</h2> {/* Changed to h2 */}
            Payout listing endpoints are not implemented in this project.
          </CardContent>
        </Card>
      </div>
    </>
  );
}