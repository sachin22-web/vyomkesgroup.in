import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // Import toast
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Img } from "@/components/Img"; // Import the Img component
import { DocumentPreview } from "@/components/DocumentPreview";
import { Seo } from "@/components/Seo"; // Import Seo component

interface Item {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  docType?: string;
  docNumberMasked?: string;
  frontUrl?: string;
  backUrl?: string;
  selfieUrl?: string;
  submittedAt?: string;
}

export default function AdminKYC() {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [remarks, setRemarks] = useState("");

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("status", tab);
    p.set("page", String(page));
    p.set("limit", String(limit));
    return p.toString();
  }, [tab, page]);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      const r = await fetch(`/api/admin/kyc?${params}`, {
        credentials: "include",
      });
      if (!r.ok) {
        toast.error("Failed to load KYC queue.");
        return;
      }
      const j = await r.json();
      if (!cancel) {
        setItems(j.items);
        setTotal(j.total);
      }
    };
    load();
    return () => {
      cancel = true;
    };
  }, [params]);

  const approve = async (uid: string) => {
    try {
      const r = await fetch(`/api/admin/kyc/${uid}/approve`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!r.ok) {
        const errorData = await r.json();
        throw new Error(errorData.message || "Failed to approve KYC.");
      }
      setItems((prev) => prev.filter((x) => x.userId !== uid));
      toast.success("KYC approved successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to approve KYC.");
    }
  };

  const reject = async (uid: string) => {
    if (!remarks.trim()) {
      toast.warning("Remarks are required to reject KYC.");
      return;
    }
    try {
      const r = await fetch(`/api/admin/kyc/${uid}/reject`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks }),
      });
      if (!r.ok) {
        const errorData = await r.json();
        throw new Error(errorData.message || "Failed to reject KYC.");
      }
      setRemarks("");
      setItems((prev) => prev.filter((x) => x.userId !== uid));
      toast.success("KYC rejected successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to reject KYC.");
    }
  };

  return (
    <>
      <Seo title="Admin KYC Queue" description="Review and manage pending, approved, and rejected KYC verification requests." />
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold">KYC Queue</h1> {/* Changed to h1 */}
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setPage(1);
            setTab(v as any);
          }}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value="pending">
            <KycList
              items={items}
              onApprove={approve}
              onReject={reject}
              remarks={remarks}
              setRemarks={setRemarks}
            />
          </TabsContent>
          <TabsContent value="approved">
            <KycList
              items={items}
              disabled
              onApprove={() => {}}
              onReject={() => {}}
              remarks={remarks}
              setRemarks={setRemarks}
            />
          </TabsContent>
          <TabsContent value="rejected">
            <KycList
              items={items}
              disabled
              onApprove={() => {}}
              onReject={() => {}}
              remarks={remarks}
              setRemarks={setRemarks}
            />
          </TabsContent>
        </Tabs>
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm gap-2">
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
      </div>
    </>
  );
}

function KycList({
  items,
  onApprove,
  onReject,
  disabled,
  remarks,
  setRemarks,
}: {
  items: Item[];
  onApprove: (uid: string) => void;
  onReject: (uid: string) => void;
  disabled?: boolean;
  remarks: string;
  setRemarks: (v: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-5 grid gap-3">
        {items.map((it) => {
          // Log the URLs for debugging
          console.log(`KYC Document URLs for user ${it.userId}:`);
          console.log(`  Front: ${it.frontUrl}`);
          console.log(`  Back: ${it.backUrl}`);
          console.log(`  Selfie: ${it.selfieUrl}`);

          return (
            <div
              key={it.userId}
              className="grid grid-cols-1 md:grid-cols-6 gap-3 border-b pb-3 items-start"
            >
              <div className="md:col-span-2">
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-muted-foreground">
                  {it.email} {it.phone ? `· ${it.phone}` : ""}
                </div>
                <div className="text-xs mt-1">
                  <span className="font-semibold">{it.docType?.toUpperCase()}</span> · {it.docNumberMasked}
                </div>
                <div className="text-xs text-muted-foreground">
                  Submitted: {it.submittedAt
                    ? new Date(it.submittedAt).toLocaleString()
                    : "N/A"}
                </div>
              </div>
              <div className="md:col-span-2 grid grid-cols-3 gap-2">
                <DocumentPreview url={it.frontUrl} alt={`Document front for ${it.name}`} />
                <DocumentPreview url={it.backUrl} alt={`Document back for ${it.name}`} />
                <DocumentPreview url={it.selfieUrl} alt={`Selfie for ${it.name}`} />
              </div>
              <div className="md:col-span-2 flex flex-col sm:flex-row items-end justify-end gap-2 mt-2 sm:mt-0">
                {!disabled && (
                  <>
                    <Input
                      placeholder="Remarks (for reject)"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full sm:w-auto"
                    />
                    <Button
                      variant="destructive"
                      onClick={() => onReject(it.userId)}
                      disabled={!remarks.trim()}
                      className="w-full sm:w-auto"
                    >
                      Reject
                    </Button>
                    <Button onClick={() => onApprove(it.userId)} className="w-full sm:w-auto">
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">No records found for this status.</div>
        )}
      </CardContent>
    </Card>
  );
}
