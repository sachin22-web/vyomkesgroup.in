import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Img } from "@/components/Img";
import { Seo } from "@/components/Seo";
import ReferralTreeView from "@/components/ReferralTreeView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReferredUserItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: string;
  createdAt: string;
  referralCode?: string;
  referredBy?: string;
  referralEarnings: number;
}

interface TreeNode {
  id: string;
  name: string;
  email: string;
  phone?: string;
  referralCode?: string;
  referralEarnings: number;
  children: TreeNode[];
}

export default function AdminReferrals() {
  const [items, setItems] = useState<ReferredUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const limit = 10;

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("search", q);
    if (statusFilter && statusFilter !== "all") {
      p.set("status", statusFilter);
    }
    p.set("page", String(page));
    p.set("limit", String(limit));
    return p.toString();
  }, [q, statusFilter, page]);

  const fetchReferrals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ items: ReferredUserItem[]; total: number }>(
        `/api/admin/referrals?${params}`
      );
      setItems(data.items);
      setTotal(data.total);
    } catch (e: any) {
      console.error("Failed to load referrals:", e);
      setError(
        e?.message || "Failed to load referrals. Please check server logs."
      );
      toast.error(e?.message || "Failed to load referrals.");
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralTree = async () => {
    setTreeLoading(true);
    try {
      const data = await api<{ tree: TreeNode | null; totalUsers: number }>(
        "/api/admin/referrals/tree"
      );
      setTreeData(data.tree);
    } catch (e: any) {
      console.error("Failed to load referral tree:", e);
      toast.error("Failed to load referral tree.");
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [params]);

  useEffect(() => {
    fetchReferralTree();
  }, []);

  const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  return (
    <>
      <Seo title="Admin Referrals" description="Manage and track user referral data and earnings." />
      <div className="grid gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold">Referrals</h1> {/* Changed to h1 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder="Search user (name, email, phone, referral code)"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="w-full sm:w-64"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setPage(1);
                setStatusFilter(v);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Img
          src="/images/referral_program.jpg"
          alt="Referral program dashboard with charts and user data"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="tree">Tree View (MLM)</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-5">
                {error && (
                  <div className="text-destructive text-sm mb-2">{error}</div>
                )}
                {loading && (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                )}
                {!loading && items.length === 0 && !error && (
                  <div className="text-sm text-muted-foreground">
                    No referred users found.
                  </div>
                )}
                {!loading && items.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="py-2 pr-3">User</th>
                          <th className="py-2 pr-3">Referral Code</th>
                          <th className="py-2 pr-3">Referred By</th>
                          <th className="py-2 pr-3">Earnings</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2 pr-3">Joined At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((user) => (
                          <tr key={user.id} className="border-t">
                            <td className="py-2 pr-3">
                              <div className="font-medium">
                                {user.name || "N/A"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.email || user.phone || "N/A"}
                              </div>
                            </td>
                            <td className="py-2 pr-3">
                              {user.referralCode || "N/A"}
                            </td>
                            <td className="py-2 pr-3">
                              {user.referredBy || "N/A"}
                            </td>
                            <td className="py-2 pr-3">
                              {inr(user.referralEarnings)}
                            </td>
                            <td className="py-2 pr-3 capitalize">
                              {(user.status || "N/A").replace(/_/g, " ")}
                            </td>
                            <td className="py-2 pr-3">
                              {user.createdAt
                                ? new Date(user.createdAt).toLocaleString()
                                : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-3 text-sm gap-2">
                  <div>
                    Page {page} / {Math.max(1, Math.ceil(total / limit))}
                  </div>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= Math.ceil(total / limit)}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tree">
            <Card>
              <CardHeader>
                <CardTitle>Referral Tree (MLM Structure)</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {treeLoading && <div className="text-center py-8">Loading referral tree...</div>}
                {!treeLoading && !treeData && <div className="text-sm text-muted-foreground text-center py-8">No referral tree data available.</div>}
                {!treeLoading && treeData && <ReferralTreeView node={treeData} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
