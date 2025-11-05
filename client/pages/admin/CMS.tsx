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

export default function AdminCMS() {
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

  return (
    <>
      <Seo title="Admin CMS" description="Content management system for dynamic pages and site content." />
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold">CMS</h1> {/* Changed to h1 */}

        <Img
          src="/images/admin_cms.jpg"
          alt="Admin content management system interface"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm text-muted-foreground mb-2">Status</h2> {/* Changed to h2 */}
            {err && <div className="text-destructive text-sm">{err}</div>}
            <div className="text-sm">
              Content management is not configured in this project. Connect a CMS
              to manage pages, posts, and assets.
            </div>
          </CardContent>
        </Card>

        {ov && (
          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm text-muted-foreground mb-2">
                Quick Metrics
              </h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Active Investors</div>
                <div className="text-right font-medium">{ov.activeInvestors}</div>
                <div>Payouts Due (count)</div>
                <div className="text-right font-medium">{ov.payoutDueToday}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}