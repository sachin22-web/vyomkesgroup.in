import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

// Define the expected type for the /api/me response
interface UserMeResponse {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  roles: string[];
  referral?: {
    code: string;
    referredBy?: string | null;
    earnings: number;
    tier: number;
    banned: boolean;
  };
  kyc?: {
    status: "not_submitted" | "pending" | "approved" | "rejected";
    remarks: string;
  };
}

export default function KYC() {
  const [docType, setDocType] = useState<string>("aadhaar");
  const [docNumber, setDocNumber] = useState("");
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("not_submitted");
  const [remarks, setRemarks] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [formErrors, setFormErrors] = useState<string[]>([]); // State to hold detailed form errors

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingStatus(true);
      try {
        // Specify the expected type for the API response
        const me = await api<UserMeResponse | null>("/api/me");
        if (!cancelled && me) {
          setStatus(me.kyc?.status || "not_submitted");
          setRemarks(me.kyc?.remarks || "");
        }
      } catch (e) {
        console.error("Failed to load KYC status:", e);
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors([]); // Clear previous errors
    if (status === "pending") {
      toast.info("Your KYC is already pending review.");
      return;
    }
    setSubmitting(true);
    try {
      if (!front) {
        throw new Error("Front image/PDF is required.");
      }
      if (!docNumber.trim()) {
        throw new Error("Document number is required.");
      }

      const frontUrl = await uploadFile(front);
      const backUrl = back ? await uploadFile(back) : undefined;
      const selfieUrl = selfie ? await uploadFile(selfie) : undefined;

      await api("/api/users/kyc/submit", {
        method: "POST",
        body: JSON.stringify({
          docType,
          docNumber: docNumber.trim(),
          frontUrl,
          backUrl,
          selfieUrl,
        }),
      });
      setStatus("pending");
      toast.success("KYC submitted successfully! Awaiting review.");
    } catch (e: any) {
      console.error("KYC submission error:", e);
      let errorMessage = e.message || "Failed to submit KYC. Please try again.";

      try {
        const errorJson = JSON.parse(errorMessage);
        if (errorJson.message === "Invalid body" && errorJson.errors) {
          const detailedErrors = errorJson.errors.map((err: any) => `${err.path.join('.')} - ${err.message}`);
          setFormErrors(detailedErrors);
          errorMessage = "Please correct the following issues:\n" + detailedErrors.join('\n');
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch (parseError) {
        // Not a JSON error, use original message
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="KYC Verification" description="Submit your identity documents for verification to enable investments and withdrawals." />
      <div className="grid gap-6">
        <h1 className="text-2xl font-semibold">KYC Verification</h1> {/* Changed to h1 */}

        <Img
          src="/images/kyc_verification.jpg" // Security/KYC
          alt="KYC verification process with documents"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardContent className="p-5 grid gap-2 text-sm">
            {loadingStatus ? (
              <Skeleton className="h-5 w-1/3" />
            ) : (
              <div>
                Status:{" "}
                <span
                  className={
                    status === "approved"
                      ? "text-green-600 font-medium"
                      : status === "rejected"
                        ? "text-red-600 font-medium"
                        : status === "pending"
                          ? "text-yellow-600 font-medium"
                          : "text-muted-foreground font-medium"
                  }
                >
                  {status.replace(/_/g, ' ')}
                </span>
              </div>
            )}
            {remarks && (
              <div>
                Last remarks:{" "}
                <span className="text-muted-foreground">{remarks}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h2 className="text-sm text-muted-foreground mb-3">
              Submit your identity documents for verification. This is required for all investments and withdrawals.
            </h2> {/* Changed to h2 */}
            <form onSubmit={submit} className="grid gap-4 max-w-2xl">
              <div className="grid md:grid-cols-4 items-center gap-2">
                <Label className="md:col-span-1">Document Type</Label>
                <Select value={docType} onValueChange={setDocType} disabled={status === "pending" || submitting}>
                  <SelectTrigger className="md:col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aadhaar">Aadhaar</SelectItem>
                    <SelectItem value="pan">PAN</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid md:grid-cols-4 items-center gap-2">
                <Label className="md:col-span-1">Document Number</Label>
                <Input
                  className="md:col-span-3"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  required
                  disabled={status === "pending" || submitting}
                />
              </div>
              <div className="grid md:grid-cols-4 items-center gap-2">
                <Label className="md:col-span-1">Front Image/PDF</Label>
                <Input
                  className="md:col-span-3"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFront(e.target.files?.[0] || null)}
                  required
                  disabled={status === "pending" || submitting}
                />
              </div>
              <div className="grid md:grid-cols-4 items-center gap-2">
                <Label className="md:col-span-1">Back Image/PDF (Optional)</Label>
                <Input
                  className="md:col-span-3"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setBack(e.target.files?.[0] || null)}
                  disabled={status === "pending" || submitting}
                />
              </div>
              <div className="grid md:grid-cols-4 items-center gap-2">
                <Label className="md:col-span-1">Selfie (Optional)</Label>
                <Input
                  className="md:col-span-3"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelfie(e.target.files?.[0] || null)}
                  disabled={status === "pending" || submitting}
                />
              </div>
              {formErrors.length > 0 && (
                <div className="text-destructive text-sm text-center space-y-1">
                  <p className="font-medium">Please correct the following issues:</p>
                  <ul className="list-disc list-inside">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end mt-4">
                <Button
                  type="submit"
                  disabled={status === "pending" || submitting}
                >
                  {status === "pending" ? "Awaiting Review" : (submitting ? "Submitting..." : "Submit KYC")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}