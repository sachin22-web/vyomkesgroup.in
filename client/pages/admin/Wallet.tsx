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

export default function AdminWallet() {
  const [ov, setOv] = useState<AdminOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchOv = async () => {
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
    fetchOv();
    return () => {
      cancelled = true;
    };
  }, []);

  const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  return (
    <>
      <Seo title="Admin Wallet & Ledger" description="Manage the company's wallet and view transaction ledger." />
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold">Wallet & Ledger</h1> {/* Changed to h1 */}

        <Img
          src="/images/admin_wallet_ledger.jpg"
          alt="Admin Wallet and Ledger management interface"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm text-muted-foreground mb-2">
              Company Wallet Snapshot
            </h2>
            {err && <div className="text-destructive text-sm">{err}</div>}
            {ov && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total AUM</div>
                <div className="text-right font-medium">{inr(ov.totalAUM)}</div>
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
            <h2 className="text-sm text-muted-foreground mb-1">Ledger</h2> {/* Changed to h2 */}
            <div className="text-sm">
              No ledger table implemented yet in the API.
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}