import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Img } from "@/components/Img"; // Import the Img component
import { Seo } from "@/components/Seo"; // Import Seo component

type AdminPrefs = {
  currencyLocale: string;
  compactTables: boolean;
  showTooltips: boolean;
  dateFormat: string;
};

type PaymentSettings = {
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  upiId?: string;
  qrCodeUrl?: string;
};

const STORAGE_KEY = "admin.ui.prefs";

export default function AdminSettings() {
  const [prefs, setPrefs] = useState<AdminPrefs>({
    currencyLocale: "en-IN",
    compactTables: false,
    showTooltips: true,
    dateFormat: "dd-MMM-yyyy",
  });
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({});
  const [saved, setSaved] = useState(false);
  const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs(JSON.parse(raw));
    } catch {}

    const fetchPaymentSettings = async () => {
      try {
        const data = await api<PaymentSettings>("/api/app/settings/payment");
        setPaymentSettings(data);
      } catch (e) {
        toast.error("Failed to load payment settings.");
      } finally {
        setPaymentSettingsLoading(false);
      }
    };
    fetchPaymentSettings();
  }, []);

  const savePrefs = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const resetPrefs = () => {
    const d: AdminPrefs = {
      currencyLocale: "en-IN",
      compactTables: false,
      showTooltips: true,
      dateFormat: "dd-MMM-yyyy",
    };
    setPrefs(d);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  };

  const savePaymentSettings = async () => {
    try {
      await api("/api/admin/settings/payment", {
        method: "PUT",
        body: JSON.stringify(paymentSettings),
      });
      toast.success("Payment settings saved!");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save payment settings.");
    }
  };

  return (
    <>
      <Seo title="Admin Settings" description="Configure UI preferences and global payment details for the platform." />
      <div className="grid gap-6">
        <h1 className="text-2xl font-semibold">Settings</h1> {/* Changed to h1 */}

        <Img
          src="/images/admin_settings.jpg"
          alt="Admin settings interface with various configuration options"
          className="w-full h-48 object-cover rounded-xl border"
        />

        <Card>
          <CardHeader>
            <CardTitle>UI Preferences</CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <Label htmlFor="currencyLocale">Currency Locale</Label>
              <Select
                value={prefs.currencyLocale}
                onValueChange={(v) =>
                  setPrefs((p) => ({ ...p, currencyLocale: v }))
                }
              >
                <SelectTrigger id="currencyLocale">
                  <SelectValue placeholder="Select locale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-IN">en-IN (₹)</SelectItem>
                  <SelectItem value="en-US">en-US ($)</SelectItem>
                  <SelectItem value="en-GB">en-GB (£)</SelectItem>
                </SelectContent>
              </Select>

              <Label htmlFor="compactTables">Compact Tables</Label>
              <div className="flex justify-end">
                <Switch
                  id="compactTables"
                  checked={prefs.compactTables}
                  onCheckedChange={(v) =>
                    setPrefs((p) => ({ ...p, compactTables: v }))
                  }
                />
              </div>

              <Label htmlFor="showTooltips">Show Tooltips</Label>
              <div className="flex justify-end">
                <Switch
                  id="showTooltips"
                  checked={prefs.showTooltips}
                  onCheckedChange={(v) =>
                    setPrefs((p) => ({ ...p, showTooltips: v }))
                  }
                />
              </div>

              <Label htmlFor="dateFormat">Date Format</Label>
              <Input
                id="dateFormat"
                value={prefs.dateFormat}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, dateFormat: e.target.value }))
                }
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <Button variant="outline" onClick={resetPrefs} className="w-full sm:w-auto">
                Reset
              </Button>
              <Button onClick={savePrefs} className="w-full sm:w-auto">{saved ? "Saved" : "Save"}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Details for Investments</CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid gap-4">
            {paymentSettingsLoading ? (
              <div>Loading payment settings...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <Label htmlFor="bankAccountName">Bank Account Name</Label>
                <Input
                  id="bankAccountName"
                  value={paymentSettings.bankAccountName || ""}
                  onChange={(e) =>
                    setPaymentSettings((p) => ({ ...p, bankAccountName: e.target.value }))
                  }
                />

                <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  value={paymentSettings.bankAccountNumber || ""}
                  onChange={(e) =>
                    setPaymentSettings((p) => ({ ...p, bankAccountNumber: e.target.value }))
                  }
                />

                <Label htmlFor="bankIfscCode">Bank IFSC Code</Label>
                <Input
                  id="bankIfscCode"
                  value={paymentSettings.bankIfscCode || ""}
                  onChange={(e) =>
                    setPaymentSettings((p) => ({ ...p, bankIfscCode: e.target.value }))
                  }
                />

                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  value={paymentSettings.upiId || ""}
                  onChange={(e) =>
                    setPaymentSettings((p) => ({ ...p, upiId: e.target.value }))
                  }
                  placeholder="e.g., /uploads/my-qr-code.png"
                />

                <Label htmlFor="qrCodeUrl">QR Code Image URL</Label>
                <Input
                  id="qrCodeUrl"
                  value={paymentSettings.qrCodeUrl || ""}
                  onChange={(e) =>
                    setPaymentSettings((p) => ({ ...p, qrCodeUrl: e.target.value }))
                  }
                  placeholder="e.g., /uploads/my-qr-code.png"
                />
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button onClick={savePaymentSettings}>Save Payment Settings</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            UI preferences are stored locally in your browser. Payment settings are stored on the server and apply globally.
          </CardContent>
        </Card>
      </div>
    </>
  );
}