import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Wallet, Calendar, AlertCircle, Copy, Share, Lock, DollarSign, Landmark, PiggyBank, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Img } from "@/components/Img";
import { api } from "@/lib/api";
import { format, differenceInMonths, addMonths, isBefore } from "date-fns";
import { Link } from "react-router-dom";
import { PlanRule } from "@shared/api"; // Import PlanRule

interface Investment {
  _id: string;
  principal: number;
  status: string;
  startedAt: string;
  meta: {
    planName: string;
    monthDuration: number;
    boosterApplied: boolean;
  };
  planVersion: number; // Add planVersion to Investment
  payouts: Payout[]; // Assuming payouts are nested or fetched separately
}

interface Payout {
  _id: string;
  monthNo: number;
  dueDate: string;
  amount: number;
  status: "scheduled" | "processing" | "paid" | "failed" | "on_hold" | "pending";
  paidAt?: string;
}

export default function Overview() {
  const [data, setData] = useState<any>(null);
  const { user } = useAuth();
  const [userInvestments, setUserInvestments] = useState<Investment[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(true);
  const [investmentError, setInvestmentError] = useState<string | null>(null);
  const [activePlanRule, setActivePlanRule] = useState<PlanRule | null>(null); // To get plan bands

  useEffect(() => {
    const fetchOverviewAndInvestments = async () => {
      try {
        const overviewData = await api("/api/app/overview");
        setData(overviewData);

        const investmentsData = await api<Investment[]>("/api/app/investments");
        setUserInvestments(investmentsData.filter(inv => inv.status === "active"));

        const planRuleData = await api<PlanRule>("/api/plans/active");
        setActivePlanRule(planRuleData);

      } catch (e: any) {
        console.error("Failed to load user data:", e);
        setInvestmentError(e?.message || "Failed to load investment data.");
      } finally {
        setLoadingInvestments(false);
      }
    };

    if (user) {
      fetchOverviewAndInvestments();
    }
  }, [user]);

  const fmtINR = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v)
      ? `₹${v.toLocaleString("en-IN")}`
      : "₹0";
  const fmtInt = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? String(v) : "0";
  const fmtDate = (v: unknown) => (v ? format(new Date(v as any), "dd MMM yyyy") : "—");

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${user?.referral?.code}`;
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${user?.referral?.code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join Vyomkesh Industries',
        text: 'Start investing with Vyomkesh Industries and earn great returns!',
        url: referralLink,
      });
    } else {
      copyReferralLink();
    }
  };

  const statsCards = [
    { 
      k: "balance", 
      label: "Current Balance", 
      fmt: fmtINR, 
      icon: Wallet, 
      color: "text-blue-600", 
      bgColor: "bg-blue-50"
    },
    { 
      k: "locked", 
      label: "Locked Amount", 
      fmt: fmtINR, 
      icon: Lock, 
      color: "text-orange-600", 
      bgColor: "bg-orange-50"
    },
    { 
      k: "totalInvested", 
      label: "Total Invested", 
      fmt: fmtINR, 
      icon: TrendingUp, 
      color: "text-green-600", 
      bgColor: "bg-green-50"
    },
    { 
      k: "totalProfit",
      label: "Total Profit", 
      fmt: fmtINR, 
      icon: PiggyBank, 
      color: "text-purple-600", 
      bgColor: "bg-purple-50"
    },
    { 
      k: "totalPayout",
      label: "Total Payouts", 
      fmt: fmtINR, 
      icon: DollarSign, 
      color: "text-teal-600", 
      bgColor: "bg-teal-50"
    },
    { 
      k: "referralEarnings", 
      label: "Referral Earnings", 
      fmt: fmtINR, 
      icon: Share, 
      color: "text-pink-600", 
      bgColor: "bg-pink-50"
    },
  ];

  const getSlabStatus = (investment: Investment, band: { fromMonth: number; toMonth: number }) => {
    const now = new Date();
    const startDate = new Date(investment.startedAt);
    const monthsSinceStart = differenceInMonths(now, startDate) + 1; // Current month number

    if (monthsSinceStart > band.toMonth) {
      return "red"; // Completed slab
    } else if (monthsSinceStart >= band.fromMonth && monthsSinceStart <= band.toMonth) {
      return "green"; // Current active slab
    } else if (monthsSinceStart < band.fromMonth) {
      return "grey"; // Upcoming slab
    }
    return "grey"; // Default to grey
  };

  const getPayoutStatusIcon = (status: Payout['status']) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "on_hold":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "scheduled":
        return <Calendar className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  // Helper function for calculating monthly profit
  const calculateMonthlyProfit = (principal: number, monthlyRate: number) => {
    return Math.round(principal * monthlyRate);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || 'User'}!</h1>
          <p className="text-muted-foreground">Here's your investment overview</p>
        </div>
      </div>

      <Img
        src="/images/user_dashboard_overview.jpg"
        alt="User dashboard overview"
        className="w-full h-48 object-cover rounded-xl border"
      />

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.k} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-2">
                      {data && Object.prototype.hasOwnProperty.call(data, stat.k)
                        ? fmtINR((data as any)[stat.k])
                        : <Skeleton className="h-8 w-24" />}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Investments Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Active Investments</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingInvestments ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : investmentError ? (
            <div className="text-destructive text-center py-4">{investmentError}</div>
          ) : userInvestments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Landmark className="h-12 w-12 mx-auto mb-4" />
              <p>You have no active investments yet. Start your investment journey today!</p>
              <Button asChild className="mt-4">
                <Link to="/app/invest">Invest Now</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {userInvestments.map((investment) => (
                <Card key={investment._id} className="border-l-4 border-primary">
                  <CardHeader>
                    <CardTitle className="text-xl">{investment.meta.planName} (₹{fmtINR(investment.principal)})</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Started: {fmtDate(investment.startedAt)} • Duration: {investment.meta.monthDuration} months
                    </p>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold text-lg mb-3">Investment Plan Details</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your investment plan is designed to grow steadily every 3 months, offering increasing monthly returns and a clear visual indication of your progress.
                      <br/>
                      Plan Duration: {investment.meta.monthDuration} Months
                    </p>
                    
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
                          {activePlanRule?.bands.map((band, index) => {
                            const status = getSlabStatus(investment, band);
                            let statusColorClass = "bg-gray-100 text-gray-700";
                            let statusText = "⏳ Upcoming";
                            let description = "This stage will activate after previous months are completed, showing higher monthly profit.";

                            if (status === "green") {
                              statusColorClass = "bg-green-100 text-green-700";
                              statusText = "🟩 Green (Active)";
                              description = `Your plan is currently in this phase. You will receive ${fmtINR(calculateMonthlyProfit(investment.principal, band.monthlyRate))} per month.`;
                            } else if (status === "red") {
                              statusColorClass = "bg-red-100 text-red-700";
                              statusText = "🟥 Red (Completed)";
                              description = "This phase has been completed.";
                            }

                            return (
                              <tr key={index} className="border-t">
                                <td className="py-2 pr-3">{band.fromMonth} – {band.toMonth} months</td>
                                <td className="py-2 pr-3">{(band.monthlyRate * 12 * 100).toFixed(0)}%</td>
                                <td className="py-2 pr-3">{fmtINR(calculateMonthlyProfit(investment.principal, band.monthlyRate))}</td>
                                <td className="py-2 pr-3">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClass}`}>
                                    {statusText}
                                  </span>
                                </td>
                                <td className="py-2 pr-3 text-muted-foreground">{description}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <h4 className="font-semibold text-lg mb-3">How It Works</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      When you activate the plan, the first phase becomes green, showing that your monthly return is active. After a phase completes, it turns red, and the next phase turns green. This process continues automatically until all stages complete. You can track each stage’s color indicator in your dashboard.
                    </p>

                    {/* Monthly Payout List/Table */}
                    <h4 className="font-semibold text-lg mb-3">Monthly Payouts History</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="py-2 pr-3">Month #</th>
                            <th className="py-2 pr-3">Due Date</th>
                            <th className="py-2 pr-3">Amount</th>
                            <th className="py-2 pr-3">Status</th>
                            <th className="py-2 pr-3">Paid On</th>
                            <th className="py-2 pr-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Placeholder for actual payouts */}
                          {Array.from({ length: investment.meta.monthDuration }).map((_, i) => {
                            const monthIndex = i + 1;
                            const now = new Date();
                            const startDate = new Date(investment.startedAt);
                            const currentMonth = differenceInMonths(now, startDate) + 1;

                            // Dynamically determine payout amount based on activePlanRule bands
                            const currentBand = activePlanRule?.bands.find(b => monthIndex >= b.fromMonth && monthIndex <= b.toMonth);
                            const payoutAmount = currentBand ? calculateMonthlyProfit(investment.principal, currentBand.monthlyRate) : 0;

                            // Simulate status based on current month
                            let payoutStatus: Payout['status'] = "scheduled";
                            let paidAtDate: string | undefined = undefined;

                            if (monthIndex <= currentMonth) {
                                // For past/current months, simulate paid or failed
                                if (Math.random() > 0.2) { // 80% chance of paid
                                    payoutStatus = "paid";
                                    paidAtDate = format(addMonths(startDate, i), "yyyy-MM-dd");
                                } else { // 20% chance of failed
                                    payoutStatus = "failed";
                                }
                            }

                            const payout: Payout = {
                              _id: `payout-${investment._id}-${monthIndex}`,
                              monthNo: monthIndex,
                              dueDate: format(addMonths(startDate, i), "yyyy-MM-dd"),
                              amount: payoutAmount,
                              status: payoutStatus,
                              paidAt: paidAtDate,
                            };

                            const isCurrentMonth = monthIndex === currentMonth;
                            const rowBgClass = isCurrentMonth ? "bg-blue-50 dark:bg-blue-900/20" : "";

                            return (
                              <tr key={payout._id} className={`border-t ${rowBgClass}`}>
                                <td className="py-2 pr-3">{payout.monthNo}</td>
                                <td className="py-2 pr-3">{fmtDate(payout.dueDate)}</td>
                                <td className="py-2 pr-3">{fmtINR(payout.amount)}</td>
                                <td className="py-2 pr-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                    payout.status === "paid" ? "bg-green-100 text-green-800" :
                                    payout.status === "failed" ? "bg-red-100 text-red-800" :
                                    payout.status === "on_hold" ? "bg-orange-100 text-orange-800" :
                                    "bg-gray-100 text-gray-800"
                                  }`}>
                                    {getPayoutStatusIcon(payout.status)}
                                    {payout.status.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="py-2 pr-3">{payout.paidAt ? fmtDate(payout.paidAt) : "—"}</td>
                                <td className="py-2 pr-3">
                                  {payout.status === "paid" && (
                                    <Button variant="ghost" size="sm">View Receipt</Button>
                                  )}
                                  {payout.status === "failed" && (
                                    <Button variant="outline" size="sm">Retry</Button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Referral Section */}
      {user?.referral?.code && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share className="h-5 w-5" />
              <span>Your Referral Program</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <code className="px-3 py-2 bg-gray-100 rounded-md font-mono text-lg font-bold break-all">
                    {user.referral.code}
                  </code>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={copyReferralLink} variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </Button>
                    <Button onClick={shareReferralLink} variant="outline" size="sm" className="flex-1 sm:flex-none">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Referral Earnings</p>
                  <p className="text-xl font-bold">{fmtINR(user.referral.earnings || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Referral Link</p>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded text-ellipsis overflow-hidden break-all">
                    {window.location.origin}/signup?ref={user.referral.code}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/app/invest'}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Start New Investment</h3>
            <p className="text-sm text-muted-foreground">Explore investment plans and grow your wealth</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/app/wallet'}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Manage Wallet</h3>
            <p className="text-sm text-muted-foreground">Add funds or withdraw earnings</p>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/app/referrals'}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Refer Friends</h3>
            <p className="text-sm text-muted-foreground">Earn by inviting friends to invest</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}