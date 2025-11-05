import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

interface AdminOverview {
  totalAUM: number;
  activeInvestors: number;
  todayInflows: number;
  payoutDueToday: number;
}

export default function AdminPayouts() {
  const [ov, setOv] = useState<AdminOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/admin/overview", {
          credentials: "include",
        });
        if (!r.ok) throw new Error("Failed to load overview");
        const j = (await r.json()) as AdminOverview;
        if (!cancelled) setOv(j);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load overview");
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
      <Seo title="Admin Payouts" description="Manage and track all investment payouts to users." />
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold">Payouts</h1> {/* Changed to h1 */}

        <Img
          src="/images/admin_payouts.jpg"
          alt="Admin Payouts management dashboard"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm text-muted-foreground mb-2">Today</h2> {/* Changed to h2 */}
            {err && <div className="text-destructive text-sm">{err}</div>}
            {ov && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Payouts Due (count)</div>
                <div className="text-right font-medium">{ov.payoutDueToday}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm text-muted-foreground">Payout History</h2> {/* Changed to h2 */}
            No payouts listing API exists in this project yet.
          </CardContent>
        </Card>
      </div>
    </>
  );
}