import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, AlertCircle, Wallet, Lock, PiggyBank, HandCoins } from "lucide-react"; // Added PiggyBank and HandCoins
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

export default function Overview() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    setLoading(true); // Set loading true on mount
    fetch("/api/admin/overview", { credentials: "include" })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((j) => setData(j))
      .catch(() => setData(null))
      .finally(() => setLoading(false)); // Set loading false after fetch
  }, []);

  const fmtINR = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v)
      ? `₹${v.toLocaleString("en-IN")}`
      : "₹0";
  const fmtInt = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) ? String(v) : "0";

  const statsCards = [
    { 
      k: "totalAUM", 
      label: "Total AUM", 
      fmt: fmtINR, 
      icon: DollarSign, 
      color: "text-blue-600", 
      bgColor: "bg-blue-50",
      trend: "+72%", // Placeholder
      progress: 72 // Placeholder
    },
    { 
      k: "activeInvestors", 
      label: "Active Investors", 
      fmt: fmtInt, 
      icon: Users, 
      color: "text-orange-600", 
      bgColor: "bg-orange-50",
      trend: "-3%", // Placeholder
      progress: 35 // Placeholder
    },
    { 
      k: "totalUserBalance", 
      label: "Total User Balance", 
      fmt: fmtINR, 
      icon: Wallet, 
      color: "text-green-600", 
      bgColor: "bg-green-50",
      trend: "+74%", // Placeholder
      progress: 74 // Placeholder
    },
    { 
      k: "totalUserLocked", 
      label: "Total Locked Amount", 
      fmt: fmtINR, 
      icon: Lock, 
      color: "text-purple-600", 
      bgColor: "bg-purple-50",
      trend: "+50%", // Placeholder
      progress: 50 // Placeholder
    },
  ];

  return (
    <>
      <Seo title="Admin Dashboard" description="Overview of the Vyomkesh Industries platform for administrators." />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back to your admin dashboard</p>
          </div>
          <div className="flex items-center space-x-2">
            <select className="px-3 py-2 border rounded-md text-sm">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>
        </div>

        <Img
          src="/images/admin_dashboard_overview.jpg"
          alt="Admin Dashboard Overview with financial charts and key metrics"
          className="w-full h-48 object-cover rounded-xl border"
        />

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <Card key={stat.k} className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <h2 className="text-2xl font-bold mt-2"> {/* Changed to h2 */}
                        {loading ? <Skeleton className="h-8 w-24" /> : (data && Object.prototype.hasOwnProperty.call(data, stat.k)
                          ? stat.fmt((data as any)[stat.k])
                          : "…")}
                      </h2>
                      <Progress value={stat.progress} className="mt-3 h-2" />
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <IconComponent className={`h-6 w-6 ${stat.color}`} aria-hidden="true" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Payment History Chart */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <p className="text-sm text-muted-foreground">Monthly revenue breakdown</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { country: "South Korea", amount: 467, color: "bg-purple-500" },
                    { country: "Netherlands", amount: 542, color: "bg-yellow-500" },
                    { country: "India", amount: 1041, color: "bg-green-500" },
                    { country: "UK", amount: 1172, color: "bg-blue-500" },
                    { country: "China", amount: 1299, color: "bg-red-500" },
                    { country: "USA", amount: 1866, color: "bg-orange-500" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className={`flex items-center space-x-3`}>
                        <div className={`w-4 h-8 rounded ${item.color}`}></div>
                        <span className="text-sm font-medium">{item.country}</span>
                      </div>
                      <span className="text-sm font-bold">{item.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currency Exchange</CardTitle>
              <p className="text-sm text-muted-foreground">Real-time currency data</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">1 United States Dollar Equals</p>
                      <p className="text-2xl font-bold">0.50 Euro</p>
                      <p className="text-xs text-muted-foreground">24 Apr 6:00 am UTC</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">1</p>
                      <p className="text-sm text-muted-foreground">United States</p>
                      <p className="text-sm text-muted-foreground">1 Euro</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { k: "todayInflows", label: "Today Inflows", fmt: fmtINR },
            { k: "todayOutflows", label: "Today Outflows", fmt: fmtINR },
            { k: "pendingWithdrawals", label: "Pending Withdrawals", fmt: fmtInt },
            { k: "payoutDueToday", label: "Payout Due Today", fmt: fmtInt },
            { k: "totalProfitGenerated", label: "Total Profit Generated", fmt: fmtINR, icon: PiggyBank }, // Added icon
            { k: "totalPayoutDistributed", label: "Total Payout Distributed", fmt: fmtINR, icon: HandCoins }, // Added icon
          ].map((m) => {
            const IconComponent = m.icon;
            return (
              <Card key={m.k}>
                <CardContent className="p-4 flex items-center justify-between"> {/* Added flex for icon */}
                  <div>
                    <div className="text-sm text-muted-foreground">{m.label}</div>
                    <div className="mt-2 text-xl font-bold">
                      {loading ? <Skeleton className="h-8 w-24" /> : (data && Object.prototype.hasOwnProperty.call(data, m.k)
                        ? m.fmt((data as any)[m.k])
                        : "…")}
                    </div>
                  </div>
                  {IconComponent && <IconComponent className="h-6 w-6 text-gray-400" aria-hidden="true" />} {/* Render icon if present */}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}