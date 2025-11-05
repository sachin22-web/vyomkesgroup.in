import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { PlanRule } from "@shared/api";
import { uploadFile } from "@/lib/upload"; // Import the new uploadFile utility
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

interface Investment {
  _id: string;
  principal: number;
  status: string;
  method: string;
  proofUrl?: string;
  utr?: string;
  createdAt: string;
  meta?: {
    planName: string;
    monthDuration: number;
    boosterApplied: boolean;
  };
  planVersion: number; // Add planVersion to Investment
}

type PaymentSettings = {
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  upiId?: string;
  qrCodeUrl?: string;
};

export default function Invest() {
  const [activePlanRule, setActivePlanRule] = useState<PlanRule | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [amount, setAmount] = useState(100000); // Default to 100,000
  const [month, setMonth] = useState(1);
  const [boosterApplied, setBoosterApplied] = useState(false);
  const [sim, setSim] = useState<any | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  const [currentInvestment, setCurrentInvestment] = useState<Investment | null>(null);
  const [utr, setUtr] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [submittingInvestment, setSubmittingInvestment] = useState(false);
  const [submittingProof, setSubmittingProof] = useState(false);

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({});
  const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(true);

  // Fetch active plan rule
  useEffect(() => {
    let cancelled = false;
    const fetchPlan = async () => {
      setLoadingPlan(true);
      setPlanError(null);
      try {
        const data = await api<PlanRule>("/api/plans/active");
        if (!cancelled) setActivePlanRule(data);
      } catch (e: any) {
        if (!cancelled) setPlanError(e?.message || "Failed to load plan");
      } finally {
        if (!cancelled) setLoadingPlan(false);
      }
    };
    fetchPlan();
    return () => { cancelled = true; };
  }, []);

  // Fetch user's current investments to check for pending ones
  useEffect(() => {
    let cancelled = false;
    const fetchUserInvestments = async () => {
      try {
        const investments = await api<Investment[]>("/api/app/investments");
        if (!cancelled) {
          const pending = investments.find(
            (inv) => inv.status === "initiated" || inv.status === "under_review"
          );
          setCurrentInvestment(pending || null);
        }
      } catch (e) {
        console.error("Failed to fetch user investments:", e);
      }
    };
    fetchUserInvestments();
    return () => { cancelled = true; };
  }, []);

  // Fetch payment settings
  useEffect(() => {
    let cancelled = false;
    const fetchPaymentSettings = async () => {
      try {
        const data = await api<PaymentSettings>("/api/app/settings/payment");
        if (!cancelled) setPaymentSettings(data);
      } catch (e) {
        console.error("Failed to load payment settings:", e);
        if (!cancelled) toast.error("Failed to load payment details.");
      } finally {
        if (!cancelled) setPaymentSettingsLoading(false);
      }
    };
    fetchPaymentSettings();
    return () => { cancelled = true; };
  }, []);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    [],
  );
  const percent = (v: number) => `${(v * 100).toFixed(1)}%`;

  const runSim = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimError(null);
    setSim(null);
    try {
      const data = await api("/api/payouts/simulate", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          month: Number(month),
          boosterApplied,
        }),
      });
      setSim(data);
    } catch (e: any) {
      setSimError(e?.message || "Simulation failed");
    } finally {
      setSimLoading(false);
    }
  };

  const createInvestment = async () => {
    if (!activePlanRule) {
      toast.error("No active plan available.");
      return;
    }
    setSubmittingInvestment(true);
    try {
      const newInvestment = await api<Investment>("/api/app/investments", {
        method: "POST",
        body: JSON.stringify({
          planId: activePlanRule._id,
          amount: Number(amount),
          month: Number(month),
          boosterApplied,
        }),
      });
      setCurrentInvestment(newInvestment);
      toast.success("Investment order created! Please make payment.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create investment order.");
    } finally {
      setSubmittingInvestment(false);
    }
  };

  const submitPaymentProof = async () => {
    if (!currentInvestment || currentInvestment.status !== "initiated") {
      toast.error("No pending investment order to submit proof for.");
      return;
    }
    if (!paymentProofFile) {
      toast.error("Please upload a payment proof file.");
      return;
    }
    setSubmittingProof(true);
    try {
      const proofUrl = await uploadFile(paymentProofFile); // Use the new uploadFile utility
      const updatedInvestment = await api<Investment>(
        `/api/app/investments/${currentInvestment._id}/upload-proof`,
        {
          method: "POST",
          body: JSON.stringify({ utr: utr || undefined, proofUrl }), // Pass undefined if UTR is empty
        }
      );
      setCurrentInvestment(updatedInvestment);
      toast.success("Payment proof submitted for review!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit payment proof.");
    } finally {
      setSubmittingProof(false);
    }
  };

  const isInvestmentPending = currentInvestment && (currentInvestment.status === "initiated" || currentInvestment.status === "under_review");

  return (
    <>
      <Seo title="Start Investment" description="Create new investment orders and submit payment proofs." />
      <div className="grid gap-6">
        <h1 className="text-2xl font-semibold">Start Investment</h1> {/* Changed to h1 */}
        <Img
          src="/images/investment_growth.jpg"
          alt="Investment growth chart and financial data"
          className="w-full h-48 object-cover rounded-xl border"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm text-muted-foreground">Active Plan</h2> {/* Changed to h2 */}
              {loadingPlan && <div className="mt-2">Loading…</div>}
              {planError && <div className="mt-2 text-destructive">{planError}</div>}
              {activePlanRule && (
                <div className="mt-3 space-y-2">
                  <h3 className="text-xl font-semibold">{activePlanRule.name}</h3> {/* Changed to h3 */}
                  <div className="text-sm text-muted-foreground">
                    Version {activePlanRule.version}{" "}
                    {activePlanRule.active ? "(active)" : "(inactive)"}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                    <div>Minimum Investment</div>
                    <div className="text-right font-medium">
                      {currency.format(activePlanRule.minAmount)}
                    </div>
                    <div>Special Rate Minimum</div>
                    <div className="text-right font-medium">
                      {currency.format(activePlanRule.specialMin)}
                    </div>
                    <div>Special Monthly Rate</div>
                    <div className="text-right font-medium">
                      {percent(activePlanRule.specialRate)}
                    </div>
                    <div>Admin Charge</div>
                    <div className="text-right font-medium">
                      {percent(activePlanRule.adminCharge)}
                    </div>
                    <div>Booster</div>
                    <div className="text-right font-medium">
                      {percent(activePlanRule.booster)}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm text-muted-foreground mb-3">
                Payout Simulator
              </h2>
              <form onSubmit={runSim} className="space-y-3">
                <div className="grid grid-cols-2 items-center gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    min={activePlanRule?.minAmount || 100000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    disabled={isInvestmentPending}
                  />
                  <Label htmlFor="month">Holding Month</Label>
                  <Input
                    id="month"
                    type="number"
                    min={1}
                    max={activePlanRule?.bands.reduce((max, band) => Math.max(max, band.toMonth), 1) || 120} // Max month from plan rule bands
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    disabled={isInvestmentPending}
                  />
                  <Label htmlFor="booster">Apply Booster</Label>
                  <div className="flex justify-end">
                    <Switch
                      id="booster"
                      checked={boosterApplied}
                      onCheckedChange={setBoosterApplied}
                      disabled={isInvestmentPending}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="submit" disabled={simLoading || isInvestmentPending}>
                    Simulate
                  </Button>
                </div>
              </form>
              {simError && (
                <div className="mt-3 text-destructive text-sm">{simError}</div>
              )}
              {sim && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>Gross Monthly</div>
                  <div className="text-right font-medium">
                    {currency.format(sim.grossMonthly)}
                  </div>
                  <div>Admin Charge</div>
                  <div className="text-right font-medium">
                    {currency.format(sim.adminCharge)}
                  </div>
                  <div>Booster Income</div>
                  <div className="text-right font-medium">
                    {currency.format(sim.booster)}
                  </div>
                  <div>Net Payout</div>
                  <div className="text-right font-semibold">
                    {currency.format(sim.netPayout)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Investment Order</CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid gap-4">
            {currentInvestment ? (
              <div className="space-y-3">
                <p className="text-sm">
                  Status: <span className="font-medium capitalize">{(currentInvestment.status || 'N/A').replace(/_/g, ' ')}</span>
                </p>
                <p className="text-sm">
                  Amount: <span className="font-medium">{currency.format(currentInvestment.principal)}</span>
                </p>
                {currentInvestment.status === "initiated" && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Please make a payment of {currency.format(currentInvestment.principal)} to the following details and upload proof.
                    </p>
                    {paymentSettingsLoading ? (
                      <div className="text-sm text-muted-foreground">Loading payment details...</div>
                    ) : (
                      <div className="border p-3 rounded-md bg-gray-50 space-y-2">
                        <p className="font-semibold">Bank Transfer Details:</p>
                        {paymentSettings.bankAccountName && <p className="text-sm">Account Name: {paymentSettings.bankAccountName}</p>}
                        {paymentSettings.bankAccountNumber && <p className="text-sm">Account Number: {paymentSettings.bankAccountNumber}</p>}
                        {paymentSettings.bankIfscCode && <p className="text-sm">IFSC Code: {paymentSettings.bankIfscCode}</p>}
                        {paymentSettings.upiId && <p className="text-sm">UPI ID: {paymentSettings.upiId}</p>}
                        {paymentSettings.qrCodeUrl && (
                          <div className="mt-3">
                            <p className="text-sm">Scan to Pay:</p>
                            <Img src={paymentSettings.qrCodeUrl} alt="QR Code for payment" className="w-32 h-32 object-contain mt-1 border rounded-md" />
                          </div>
                        )}
                        {!paymentSettings.bankAccountName && !paymentSettings.bankAccountNumber && !paymentSettings.bankIfscCode && !paymentSettings.upiId && !paymentSettings.qrCodeUrl && (
                          <p className="text-sm text-muted-foreground">No payment details configured by admin.</p>
                        )}
                      </div>
                    )}
                    <div>
                      <Label htmlFor="utr">UTR / Transaction ID (Optional)</Label>
                      <Input
                        id="utr"
                        value={utr}
                        onChange={(e) => setUtr(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="paymentProof">Upload Payment Proof (Screenshot/PDF)</Label>
                      <Input
                        id="paymentProof"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={submitPaymentProof} disabled={submittingProof || !paymentProofFile}>
                      {submittingProof ? "Uploading..." : "Submit Payment Proof"}
                    </Button>
                  </div>
                )}
                {currentInvestment.status === "under_review" && (
                  <p className="text-sm text-yellow-600">
                    Your payment proof is under review by admin.
                  </p>
                )}
                {currentInvestment.status === "active" && (
                  <p className="text-sm text-green-600">
                    Your investment is active!
                  </p>
                )}
                {currentInvestment.status === "rejected" && (
                  <p className="text-sm text-red-600">
                    Your investment was rejected. Please contact support.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  No active investment order. Create a new one.
                </p>
                <Button onClick={createInvestment} disabled={submittingInvestment || !activePlanRule}>
                  {submittingInvestment ? "Creating Order..." : "Create Investment Order"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}