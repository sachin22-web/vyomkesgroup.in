import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Img } from "@/components/Img"; // Import the Img component
import { PlanRule } from "@shared/api"; // Import PlanRule from shared types
import { api } from "@/lib/api"; // Import api utility
import { Seo } from "@/components/Seo"; // Import Seo component
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { DollarSign, TrendingUp, CalendarDays, Percent } from "lucide-react";

export default function Plans() {
  const navigate = useNavigate();
  const [activePlanRule, setActivePlanRule] = useState<PlanRule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(100000);
  const [loadingPlan, setLoadingPlan] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingPlan(true);
      try {
        const r = await api<PlanRule>("/api/plans/active"); // Fetch active plan rule
        if (!cancelled) setActivePlanRule(r);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load plans");
      } finally {
        setLoadingPlan(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  const calculateMonthlyProfit = (principal: number, monthlyRate: number) => {
    return Math.round(principal * monthlyRate);
  };

  const handleInvestNowClick = () => {
    navigate('/app/invest');
  };

  return (
    <>
      <Seo title="Investment Plans" description="Explore our high-return investment plans with detailed monthly profit breakdowns." />
      <section className="container py-12 md:py-20">
        {/* Hero Section for Plans */}
        <div className="relative rounded-xl overflow-hidden shadow-lg mb-12 md:mb-16">
          <Img
            src="/images/investment_plans.jpg"
            alt="Investment Plans Overview"
            className="w-full h-64 md:h-96 object-cover brightness-75"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/40">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 animate-fade-in-up">
              Unlock Your Earning Potential
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl animate-fade-in-up delay-200">
              Discover our flexible investment plans designed for steady growth and attractive returns.
            </p>
          </div>
        </div>

        {/* Plan Overview */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-black mb-4">
            Our Tailored Investment Solutions
          </h2>
          <p className="text-lg text-muted-foreground">
            We offer a range of investment plans with varying durations and attractive annualized target returns. Find the plan that best suits your financial goals.
          </p>
        </div>

        {loadingPlan ? (
          <div className="text-center py-12">Loading plan details...</div>
        ) : error ? (
          <div className="text-destructive text-center py-12">{error}</div>
        ) : !activePlanRule || activePlanRule.bands.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">No active plans available at the moment. Please check back later.</div>
        ) : (
          <>
            {/* Key Plan Highlights */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 md:mb-16">
              <Card className="text-center p-6 shadow-md">
                <DollarSign className="h-10 w-10 text-primary mx-auto mb-4" />
                <CardTitle className="text-xl font-bold mb-2">Min. Investment</CardTitle>
                <CardContent className="text-lg font-semibold text-black p-0">
                  {inr(activePlanRule.minAmount)}
                </CardContent>
              </Card>
              <Card className="text-center p-6 shadow-md">
                <TrendingUp className="h-10 w-10 text-primary mx-auto mb-4" />
                <CardTitle className="text-xl font-bold mb-2">Special Min.</CardTitle>
                <CardContent className="text-lg font-semibold text-black p-0">
                  {inr(activePlanRule.specialMin)}
                </CardContent>
              </Card>
              <Card className="text-center p-6 shadow-md">
                <Percent className="h-10 w-10 text-primary mx-auto mb-4" />
                <CardTitle className="text-xl font-bold mb-2">Special Rate</CardTitle>
                <CardContent className="text-lg font-semibold text-black p-0">
                  {(activePlanRule.specialRate * 100).toFixed(1)}% Monthly
                </CardContent>
              </Card>
              <Card className="text-center p-6 shadow-md">
                <CalendarDays className="h-10 w-10 text-primary mx-auto mb-4" />
                <CardTitle className="text-xl font-bold mb-2">Max Duration</CardTitle>
                <CardContent className="text-lg font-semibold text-black p-0">
                  {activePlanRule.bands[activePlanRule.bands.length - 1].toMonth} Months
                </CardContent>
              </Card>
            </div>

            {/* Investment Calculator */}
            <div id="calculator" className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8 shadow-lg mb-12 md:mb-16">
              <h3 className="text-2xl md:text-4xl font-black tracking-tight text-center text-black mb-8">
                Calculate Your Potential Returns
              </h3>
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label htmlFor="calculator-amount" className="text-lg font-medium text-gray-700 mb-2 block">Investment Amount (₹)</label>
                  <Input
                    id="calculator-amount"
                    type="number"
                    min={activePlanRule.minAmount}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full text-lg py-3"
                  />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Minimum investment: {inr(activePlanRule.minAmount)}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground">
                        <th className="py-3 pr-4">Month Range</th>
                        <th className="py-3 pr-4">Annual Returns (%)</th>
                        <th className="py-3 pr-4">Monthly Profit (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePlanRule.bands.map((band, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-3 pr-4">{band.fromMonth} – {band.toMonth} months</td>
                          <td className="py-3 pr-4">{(band.monthlyRate * 12 * 100).toFixed(0)}%</td>
                          <td className="py-3 pr-4">{inr(calculateMonthlyProfit(amount, band.monthlyRate))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Formula: Monthly Profit = (Monthly Rate × Investment Amount). Returns are annualized.
                </p>
                <div className="text-center mt-8">
                  <Button onClick={handleInvestNowClick} size="lg" className="py-3 px-8 text-lg">
                    Invest Now
                  </Button>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-black mb-4">
                Simple Steps to Financial Growth
              </h2>
              <p className="text-lg text-muted-foreground">
                Our process is designed to be straightforward and transparent, guiding you from signup to consistent payouts.
              </p>
            </div>
            <ol className="grid md:grid-cols-5 gap-6 text-center mb-16 md:mb-24">
              {["Sign Up", "Complete KYC", "Choose Plan", "Invest Funds", "Receive Payouts"].map(
                (s, i) => (
                  <li key={s} className="rounded-xl border p-6 bg-card shadow-md flex flex-col items-center justify-center h-full">
                    <div className="text-4xl font-bold text-primary mb-3">{i + 1}</div>
                    <div className="mt-2 font-semibold text-lg">{s}</div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {i === 0 && "Create your secure account in minutes."}
                      {i === 1 && "Verify your identity for compliance and security."}
                      {i === 2 && "Select an investment plan that fits your goals."}
                      {i === 3 && "Fund your investment securely through various methods."}
                      {i === 4 && "Enjoy regular monthly payouts directly to your account."}
                    </p>
                  </li>
                ),
              )}
            </ol>

            {/* Disclaimer */}
            <Card className="mt-12 bg-gray-50 border-gray-200 shadow-sm">
              <CardContent className="pt-6 text-xs text-muted-foreground space-y-2">
                <p>
                  <strong>Important Disclaimer:</strong> All investment plans offered by Vyomkesh Industries are target-based and market-linked. Returns are not guaranteed and are subject to market risks. Please read our full Risk Disclosure for more details. Compliance checks, tax regulations (including TDS), and processing timelines apply.
                </p>
                <p>
                  We adhere to strict operational discipline, including maker-checker approvals and comprehensive audit trails, to ensure transparency and regulatory readiness.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </section>
    </>
  );
}