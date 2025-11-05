import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Copy, Share, Users, DollarSign, Gift, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

interface ReferralUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  status: string;
}

export default function Referrals() {
  const { user } = useAuth();
  const [referralUsers, setReferralUsers] = useState<ReferralUser[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReferralData = async () => {
      setLoading(true);
      try {
        // Load referral statistics from user overview
        const statsRes = await api("/api/app/overview");
        setStats(statsRes);
        
        // Fetch users referred by current user
        if (user?.referral?.code) {
          const referredUsersData = await api<ReferralUser[]>("/api/app/referrals/users");
          setReferralUsers(referredUsersData);
        }
      } catch (error) {
        console.error("Failed to load referral data:", error);
        toast.error("Failed to load referral data");
      } finally {
        setLoading(false);
      }
    };

    if (user) { // Only load if user is authenticated
      loadReferralData();
    }
  }, [user]);

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${user?.referral?.code}`;
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${user?.referral?.code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join Vyomkesh Industries Investment Platform',
        text: 'Start your investment journey with high returns and secure plans!',
        url: referralLink,
      });
    } else {
      copyReferralLink();
    }
  };

  const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Referral Program</h1> {/* Changed to h1 */}
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo title="Your Referrals" description="Track your referral earnings and invite friends to join Vyomkesh Industries." />
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Referral Program</h1>
            <p className="text-muted-foreground">Earn by inviting friends to invest</p>
          </div>
        </div>

        <Img
          src="/images/team_collaboration.jpg" // Team collaboration/referral image
          alt="Team collaboration and referral program benefits"
          className="w-full h-48 object-cover rounded-xl border"
        />

        {/* Referral Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                  <h2 className="text-2xl font-bold mt-2">{inr(user?.referral?.earnings || 0)}</h2> {/* Changed to h2 */}
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <DollarSign className="h-6 w-6 text-green-600" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Referred Users</p>
                  <h2 className="text-2xl font-bold mt-2">{referralUsers.length}</h2> {/* Changed to h2 */}
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <Users className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Referral Tier</p>
                  <h2 className="text-2xl font-bold mt-2">Tier {user?.referral?.tier || 1}</h2> {/* Changed to h2 */}
                </div>
                <div className="p-3 rounded-full bg-purple-50">
                  <Gift className="h-6 w-6 text-purple-600" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Commission Rate</p>
                  <h2 className="text-2xl font-bold mt-2">5%</h2> {/* Changed to h2 */}
                </div>
                <div className="p-3 rounded-full bg-orange-50">
                  <TrendingUp className="h-6 w-6 text-orange-600" aria-hidden="true" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share className="h-5 w-5" aria-hidden="true" />
              <span>Your Referral Link</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Share this link with friends and earn 5% commission on their investments!
                </p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-sm break-all">
                    {window.location.origin}/signup?ref={user?.referral?.code}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={copyReferralLink} variant="outline" className="flex-1 sm:flex-none">
                      <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
                      Copy
                    </Button>
                    <Button onClick={shareReferralLink} className="flex-1 sm:flex-none">
                      <Share className="h-4 w-4 mr-2" aria-hidden="true" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm font-medium mb-1">Your Referral Code</p>
                  <code className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md font-mono text-lg font-bold break-all">
                    {user?.referral?.code}
                  </code>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">How it works</p>
                  <p className="text-sm text-muted-foreground">
                    When someone signs up using your link and makes an investment, you earn 5% commission.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referred Users */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {referralUsers.length > 0 ? (
              <div className="space-y-4">
                {referralUsers.map((referredUser) => (
                  <div key={referredUser._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{referredUser.name}</p>
                      <p className="text-sm text-muted-foreground">{referredUser.email || referredUser.phone}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(referredUser.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        referredUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {referredUser.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <p className="text-muted-foreground">
                  You haven't referred anyone yet. Start sharing your referral link to earn commissions!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}