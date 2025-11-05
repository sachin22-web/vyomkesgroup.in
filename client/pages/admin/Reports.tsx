import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

interface AdminOverview {
  totalAUM: number;
  activeInvestors: number;
  todayInflows: number;
  payoutDueToday: number;
}

export default function AdminReports() {
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
      <Seo title="Admin Reports" description="View administrative reports and key financial metrics." />
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold">Reports</h1> {/* Changed to h1 */}

        <Img
          src="/images/admin_reports.jpg"
          alt="Admin reports and financial data analysis"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm text-muted-foreground mb-2">Summary</h2> {/* Changed to h2 */}
            {err && <div className="text-destructive text-sm">{err}</div>}
            {ov && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total AUM</div>
                <div className="text-right font-medium">{inr(ov.totalAUM)}</div>
                <div>Active Investors</div>
                <div className="text-right font-medium">{ov.activeInvestors}</div>
                <div>Today Inflows</div>
                <div className="text-right font-medium">
                  {inr(ov.todayInflows)}
                </div>
                <div>Payouts Due (count)</div>
                <div className="text-right font-medium">{ov.payoutDueToday}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm text-muted-foreground">
              Detailed reports are not implemented yet in the API.
            </h2>
          </CardContent>
        </Card>
      </div>
    </>
  );
}