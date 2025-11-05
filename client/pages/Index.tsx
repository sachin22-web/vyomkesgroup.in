import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import CategoryNav from "@/components/CategoryNav";
import { PlanRule } from "@shared/api";
import { useAuth } from "@/hooks/useAuth";
import { Img } from "@/components/Img";
import {
  ShieldCheck,
  Lock,
  FileText,
  Headset,
  TrendingUp,
  Wallet,
  Share,
} from "lucide-react"; // Added Lucide icons
import { Seo } from "@/components/Seo"; // Import Seo component
import React from "react"; // Import React for React.Fragment

function formatINR(n: number) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

const DEFAULT_CALCULATOR_PLAN: PlanRule = {
  _id: "local",
  name: "Vyomkesh Base Plan",
  minAmount: 100000,
  specialMin: 300000,
  bands: [
    { fromMonth: 1, toMonth: 3, monthlyRate: 0.03 },
    { fromMonth: 4, toMonth: 6, monthlyRate: 0.04 },
    { fromMonth: 7, toMonth: 9, monthlyRate: 0.05 },
    { fromMonth: 10, toMonth: 12, monthlyRate: 0.06 },
    { fromMonth: 13, toMonth: 15, monthlyRate: 0.07 },
  ],
  specialRate: 0.1,
  adminCharge: 0.04,
  booster: 0.1,
  active: true,
  version: 1,
  effectiveFrom: new Date().toISOString(),
};

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activePlanRule, setActivePlanRule] = useState<PlanRule | null>(null);
  const [amount, setAmount] = useState<number>(100000); // Default to 100,000
  const [month, setMonth] = useState<number>(1);
  const [booster, setBooster] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/plans/active")
      .then(async (r) => {
        if (r.ok) setActivePlanRule(await r.json());
        else setActivePlanRule(DEFAULT_CALCULATOR_PLAN); // Fallback to default if API fails
      })
      .catch(() => {
        setActivePlanRule(DEFAULT_CALCULATOR_PLAN); // Fallback to default on network error
      });
  }, []);

  const calculateMonthlyProfit = (principal: number, monthlyRate: number) => {
    return Math.round(principal * monthlyRate);
  };

  const handleInvestNowClick = () => {
    if (user) {
      navigate("/app/invest");
    } else {
      navigate("/login");
    }
  };

  const breakdown = useMemo(() => {
    if (!activePlanRule)
      return {
        grossMonthly: 0,
        adminCharge: 0,
        boosterIncome: 0,
        net: 0,
        totalReturn: 0,
      };
    const principal = amount || 0;
    let grossMonthly = 0;

    if (principal >= activePlanRule.specialMin) {
      grossMonthly = principal * activePlanRule.specialRate;
    } else {
      const band =
        activePlanRule.bands.find(
          (b) => month >= b.fromMonth && month <= b.toMonth,
        ) || activePlanRule.bands[activePlanRule.bands.length - 1];
      grossMonthly = principal * band.monthlyRate;
    }

    const adminCharge = +(grossMonthly * activePlanRule.adminCharge).toFixed(2);
    const boosterIncome = booster
      ? +(grossMonthly * activePlanRule.booster).toFixed(2)
      : 0;

    const net = +(grossMonthly - adminCharge + boosterIncome).toFixed(0);

    // Calculate total return over the full plan duration for the given principal
    let totalReturn = 0;
    if (activePlanRule) {
      for (
        let i = 1;
        i <= activePlanRule.bands[activePlanRule.bands.length - 1].toMonth;
        i++
      ) {
        let currentGrossMonthly = 0;
        if (principal >= activePlanRule.specialMin) {
          currentGrossMonthly = principal * activePlanRule.specialRate;
        } else {
          const band =
            activePlanRule.bands.find(
              (b) => i >= b.fromMonth && i <= b.toMonth,
            ) || activePlanRule.bands[activePlanRule.bands.length - 1];
          currentGrossMonthly = principal * band.monthlyRate;
        }
        const currentAdminCharge = +(
          currentGrossMonthly * activePlanRule.adminCharge
        ).toFixed(2);
        const currentBoosterIncome = booster
          ? +(currentGrossMonthly * activePlanRule.booster).toFixed(2)
          : 0;
        totalReturn += +(
          currentGrossMonthly -
          currentAdminCharge +
          currentBoosterIncome
        ).toFixed(2);
      }
    }

    return { grossMonthly, adminCharge, boosterIncome, net, totalReturn };
  }, [amount, month, booster, activePlanRule]);

  return (
    <>
      <Seo
        title="Home"
        description="Secure Your Future with High-Return Investment Plans from Vyomkesh Industries."
      />
      <div className="bg-gradient-to-b from-background to-accent/20">
        {/* Hero Section */}
        <section className="container py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground mb-4">
                Secure • Compliant • Transparent
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight text-black">
                Secure Your Future with High‑Return Investment Plans
              </h1>
              <p className="mt-6 text-xl md:text-2xl text-black font-semibold max-w-prose">
                Annualized target bands 36% • 48% • 60% • 72% • 84%. Special 10%
                monthly payout for ≥₹3,00,000, subject to compliance and plan
                T&Cs.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <a href="#calculator">Start Investing</a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/plans">View Plans</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground max-w-prose">
                Important: No guaranteed/assured returns. See Risk Disclosure.
                Maker‑checker approvals and audit trails implemented.
              </p>
            </div>
            <div className="relative">
              <Carousel className="rounded-2xl border overflow-hidden">
                <CarouselContent>
                  {[
                    "/images/one.jpeg",
                    "/images/two.jpeg",
                    "/images/three.jpeg",
                    "/images/four.jpeg",
                    "/images/five.jpeg",
                  ].map((src, i) => (
                    <CarouselItem key={i} className="h-[320px] md:h-[400px]">
                      <Img
                        src={src}
                        alt="Investment and financial services"
                        className="w-full h-full object-cover"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </div>
        </section>

        {/* Category Navigation */}
        <section className="container py-12">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-black mb-8 text-center">
            Explore Our Investment Categories
          </h2>
          <CategoryNav />
        </section>

        {/* Investment Plan Details Section (New) */}
        <section className="container py-16">
          <div className="max-w-3xl mb-6 text-center mx-auto">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-black">
              Our Investment Plan Details
            </h2>
            <p className="mt-4 text-lg md:text-xl text-black font-semibold">
              Your investment plan is designed with 5 progressive tiers over 15
              months, offering steadily increasing monthly returns and clear
              visibility of your growth stages.
            </p>
          </div>
          <Card className="shadow-lg">
            <CardContent className="p-5">
              {!activePlanRule ? (
                <div className="text-center py-8">Loading plan details...</div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-4">
                    📅 Plan Duration:{" "}
                    {
                      activePlanRule.bands[activePlanRule.bands.length - 1]
                        .toMonth
                    }{" "}
                    Months
                  </h3>{" "}
                  {/* Changed to h3 */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-3">Month Range</th>
                          <th className="py-2 pr-3">Annual Returns (%)</th>
                          <th className="py-2 pr-3">Monthly Profit (₹)</th>
                          <th className="py-2 pr-3">Status Color</th>
                          <th className="py-2 pr-3">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activePlanRule.bands.map((band, index) => {
                          let statusColorClass = "bg-gray-100 text-gray-700";
                          let statusText = "⏳ Upcoming";
                          let description =
                            "This stage will activate after previous months are completed, showing higher monthly profit.";

                          // For homepage, we can simplify status to illustrate progression
                          if (index === 0) {
                            statusColorClass = "bg-green-100 text-green-700";
                            statusText = "🟩 Green (Active)";
                            description = `Your plan starts here. You will receive ${formatINR(calculateMonthlyProfit(amount, band.monthlyRate))} per month for the first three months.`;
                          } else if (index === 1) {
                            statusColorClass = "bg-red-100 text-red-700";
                            statusText = "🟥 Red (Next Stage)";
                            description =
                              "Once 3 months are completed, this next phase activates automatically and turns green.";
                          }

                          return (
                            <tr key={index} className="border-t">
                              <td className="py-2 pr-3">
                                {band.fromMonth} – {band.toMonth} months
                              </td>
                              <td className="py-2 pr-3">
                                {(band.monthlyRate * 12 * 100).toFixed(0)}%
                              </td>
                              <td className="py-2 pr-3">
                                {formatINR(
                                  calculateMonthlyProfit(
                                    amount,
                                    band.monthlyRate,
                                  ),
                                )}
                              </td>
                              <td className="py-2 pr-3">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClass}`}
                                >
                                  {statusText}
                                </span>
                              </td>
                              <td className="py-2 pr-3 text-muted-foreground">
                                {description}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <h3 className="font-semibold text-lg mb-3">How It Works</h3>{" "}
                  {/* Changed to h3 */}
                  <p className="text-sm text-muted-foreground mb-4">
                    Your investment progresses through 5 stages over 15 months.
                    When you activate the plan, the first stage (Months 1-3, 36%
                    annual) becomes green and active. Each subsequent stage
                    automatically activates after the previous one completes,
                    with increasing monthly returns. You can track each stage
                    progress in your dashboard.
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    If your total investment plan is ₹{formatINR(amount)}:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                    {activePlanRule.bands.map((band, index) => (
                      <li key={index}>
                        Months {band.fromMonth}–{band.toMonth}: You receive ₹
                        {formatINR(
                          calculateMonthlyProfit(amount, band.monthlyRate),
                        )}{" "}
                        per month (₹
                        {formatINR(
                          calculateMonthlyProfit(amount, band.monthlyRate) *
                            (band.toMonth - band.fromMonth + 1),
                        )}{" "}
                        total).
                      </li>
                    ))}
                  </ul>
                  <p className="text-lg font-bold text-primary">
                    ✅ Total Estimated Return: ₹
                    {formatINR(breakdown.totalReturn)} over{" "}
                    {
                      activePlanRule.bands[activePlanRule.bands.length - 1]
                        .toMonth
                    }{" "}
                    months (≈
                    {((breakdown.totalReturn / amount) * 100).toFixed(1)}% of
                    investment)
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Investment Calculator */}
        <section id="calculator" className="container py-16">
          <div className="max-w-3xl mb-6 text-center mx-auto">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight text-black">
              Investment Calculator
            </h2>
            <p className="mt-4 text-lg md:text-xl text-black font-semibold">
              Enter investment amount and month to preview your monthly payout
              with charges. Get real-time calculations for your investment
              returns.
            </p>
          </div>
          <Img
            src="/images/two.jpeg"
            alt="Digital financial technology and investment charts"
            className="w-full h-56 sm:h-64 object-cover rounded-xl border mb-8"
          />
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Inputs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    htmlFor="calculator-amount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Amount (₹)
                  </label>
                  <input
                    id="calculator-amount"
                    type="number"
                    min={activePlanRule?.minAmount || 100000}
                    step={1000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Minimum ₹{formatINR(activePlanRule?.minAmount || 100000)}
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="calculator-month"
                    className="text-sm font-medium text-gray-700"
                  >
                    Month Number
                  </label>
                  <input
                    id="calculator-month"
                    type="number"
                    min={1}
                    max={
                      activePlanRule?.bands.reduce(
                        (max, band) => Math.max(max, band.toMonth),
                        1,
                      ) || 120
                    }
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="booster"
                    type="checkbox"
                    checked={booster}
                    onChange={(e) => setBooster(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="booster" className="text-sm text-gray-700">
                    Apply Booster (
                    {activePlanRule
                      ? (activePlanRule.booster * 100).toFixed(0)
                      : "0"}
                    % additional income)
                  </label>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-base text-gray-800">
                  <span>Gross monthly payout</span>
                  <span className="font-semibold">
                    ₹{formatINR(Math.round(breakdown.grossMonthly))}
                  </span>
                </div>
                <div className="flex justify-between text-base text-gray-800">
                  <span>
                    Admin charge (
                    {activePlanRule
                      ? (activePlanRule.adminCharge * 100).toFixed(0)
                      : "0"}
                    % of profit)
                  </span>
                  <span className="text-destructive font-semibold">
                    – ₹{formatINR(Math.round(breakdown.adminCharge))}
                  </span>
                </div>
                {booster && (
                  <div className="flex justify-between text-base text-gray-800">
                    <span>
                      Booster income (
                      {activePlanRule
                        ? (activePlanRule.booster * 100).toFixed(0)
                        : "0"}
                      % of profit)
                    </span>
                    <span className="text-green-600 font-semibold">
                      + ₹{formatINR(Math.round(breakdown.boosterIncome))}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg text-black">
                  <span>Estimated net payout</span>
                  <span>₹{formatINR(breakdown.net)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  This is a preview. Actuals depend on plan terms, compliance
                  checks, tax/TDS and timelines.
                </p>
                <div className="mt-6">
                  <Button
                    className="w-full text-lg py-3"
                    onClick={handleInvestNowClick}
                  >
                    Invest Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Services & Expertise Gallery */}
        <section className="container py-16">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-black mb-12 text-center">
            Our Services & Expertise
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                src: "/images/one.jpeg",
                alt: "Real estate property investment",
              },
              { src: "/images/two.jpeg", alt: "Crypto currency trading" },
              { src: "/images/three.jpeg", alt: "Stock market trading" },
              { src: "/images/four.jpeg", alt: "Digital financial technology" },
              { src: "/images/five.jpeg", alt: "Investment growth strategies" },
              {
                src: "/images/one.jpeg",
                alt: "Comprehensive financial planning",
              },
            ].map((img, idx) => (
              <div
                key={`service-${idx}`}
                className="relative overflow-hidden rounded-xl border shadow-md group"
              >
                <Img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white p-4">
                  <p className="font-semibold text-lg">{img.alt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Vyomkesh Industries */}
        <section className="container py-16 bg-blue-50 rounded-xl shadow-inner">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-black mb-12 text-center">
            Why Choose Vyomkesh Industries
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: ShieldCheck,
                t: "Regulator‑ready",
                d: "Policies aligned to SEBI/RBI guidance; audit trails and maker‑checker.",
              },
              {
                icon: Lock,
                t: "Bank‑grade Security",
                d: "Encrypted PII, device binding, IP throttling, and quarterly reviews.",
              },
              {
                icon: FileText,
                t: "Transparent Ledger",
                d: "Double‑entry system with statements and CSV exports.",
              },
              {
                icon: Headset,
                t: "Dedicated Support",
                d: "Ticket desk with SLAs, WhatsApp/email integrations.",
              },
            ].map((f) => (
              <Card
                key={f.t}
                className="shadow-md hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <f.icon
                    className="h-8 w-8 text-primary mb-3"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-xl font-bold text-primary">
                    {f.t}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {f.d}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="container py-16">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-black mb-12 text-center">
            Simple Investment Process
          </h2>
          <ol className="grid md:grid-cols-5 gap-6 text-center">
            {[
              "Sign up",
              "KYC",
              "Invest",
              "Monthly Payouts",
              "Track on App",
            ].map((s, i) => (
              <li
                key={s}
                className="rounded-xl border p-6 bg-card shadow-md flex flex-col items-center justify-center"
              >
                <div className="text-4xl font-bold text-primary mb-3">
                  {i + 1}
                </div>
                <div className="mt-2 font-semibold text-lg">{s}</div>
              </li>
            ))}
          </ol>
        </section>

        {/* Call to Action & Disclaimers */}
        <section className="container pb-20 text-center">
          <div className="mt-12 flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="py-3 px-8 text-lg">
              <a href="#calculator">Create your account</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="tel:+91XXXXXXXXXX">Talk to us</a>{" "}
              {/* Updated to a call link */}
            </Button>
          </div>
          <Card className="mt-12 bg-gray-50 border-gray-200 shadow-sm">
            <CardContent className="pt-6 text-xs text-muted-foreground space-y-2">
              <p>
                <strong>Compliance (India):</strong> Products promising
                fixed/assured returns or &gt;3–4% per month are heavily
                regulated. Obtain legal advice on SEBI CIS/IA, RBI
                payment/escrow, Companies Act/NBFC, KYC/AML and ITR/TDS. Do not
                advertise guaranteed returns unless licensed.
              </p>
              <p>
                Include risk disclosures, no‑guarantee disclaimers,
                refund/withdrawal policies. Implement maker‑checker approvals
                and an audit trail.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}
