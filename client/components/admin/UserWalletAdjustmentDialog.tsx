import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface UserWalletDetails {
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  balance: number;
  locked: number;
  available: number;
  totalProfit: number;
  totalPayout: number;
}

interface UserWalletAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onWalletAdjusted: () => void; // Callback to refresh user data after adjustment
}

export const UserWalletAdjustmentDialog: React.FC<UserWalletAdjustmentDialogProps> = ({
  open,
  onOpenChange,
  userId,
  onWalletAdjusted,
}) => {
  const [walletDetails, setWalletDetails] = useState<UserWalletDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [action, setAction] = useState<
    "credit" | "debit" | "lock" | "unlock" | "set_balance" | "set_locked" | "add_profit" | "add_payout" | "remove_payout"
  >("credit");
  const [amount, setAmount] = useState<string>(""); // Keep as string for input, convert to number for API
  const [newBalance, setNewBalance] = useState<string>(""); // Keep as string for input
  const [newLocked, setNewLocked] = useState<string>(""); // Keep as string for input
  const [reason, setReason] = useState("");
  const [refId, setRefId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

  const fetchWalletDetails = async () => {
    setLoadingDetails(true);
    setError(null);
    try {
      const data = await api<UserWalletDetails>(`/api/admin/users/${userId}/wallet`);
      setWalletDetails(data);
      setNewBalance(String(data.balance));
      setNewLocked(String(data.locked));
    } catch (e: any) {
      setError(e?.message || "Failed to load wallet details.");
      toast.error(e?.message || "Failed to load wallet details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (open && userId) {
      fetchWalletDetails();
    } else {
      // Reset form when dialog closes
      setWalletDetails(null);
      setAction("credit");
      setAmount("");
      setNewBalance("");
      setNewLocked("");
      setReason("");
      setRefId("");
      setError(null);
    }
  }, [open, userId]);

  const sanitizeAndParseAmount = (value: string): number => {
    const cleaned = value.replace(/[^\d.]/g, ''); // Remove non-numeric except dot
    const num = Number(cleaned);
    if (isNaN(num) || !Number.isFinite(num)) {
      throw new Error("Invalid amount format.");
    }
    return num;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!reason.trim()) {
      setError("Reason is mandatory for all wallet adjustments.");
      return;
    }

    let body: any = { action, reason: reason.trim() };
    if (refId.trim()) body.refId = refId.trim();

    try {
      if (action === "credit" || action === "debit" || action === "lock" || action === "unlock" || action === "add_profit" || action === "add_payout" || action === "remove_payout") {
        const parsedAmount = sanitizeAndParseAmount(amount);
        if (parsedAmount <= 0) {
          throw new Error("Amount must be a positive number for this action.");
        }
        body.amount = parsedAmount;
      } else if (action === "set_balance") {
        const parsedNewBalance = sanitizeAndParseAmount(newBalance);
        if (parsedNewBalance < 0) {
          throw new Error("New balance must be a non-negative number.");
        }
        body.newBalance = parsedNewBalance;
      } else if (action === "set_locked") {
        const parsedNewLocked = sanitizeAndParseAmount(newLocked);
        if (parsedNewLocked < 0) {
          throw new Error("New locked amount must be a non-negative number.");
        }
        body.newLocked = parsedNewLocked;
      }
    } catch (e: any) {
      setError(e.message);
      return;
    }

    setSubmitting(true);
    try {
      await api(`/api/admin/users/${userId}/wallet/adjust`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      toast.success("Wallet adjusted successfully!");
      onWalletAdjusted(); // Trigger refresh in parent
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message || "Failed to adjust wallet.");
      toast.error(e?.message || "Failed to adjust wallet.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, ''); // Allow only digits and one dot
    setAmount(value);
  };

  const handleNewBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setNewBalance(value);
  };

  const handleNewLockedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, '');
    setNewLocked(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust User Wallet</DialogTitle>
        </DialogHeader>
        {loadingDetails ? (
          <div className="py-4 text-center">Loading wallet details...</div>
        ) : error && !walletDetails ? (
          <div className="py-4 text-center text-destructive">{error}</div>
        ) : (
          <div className="grid gap-4 py-4">
            {walletDetails && (
              <div className="border p-3 rounded-md bg-gray-50 text-sm">
                <p className="font-medium">{walletDetails.name}</p>
                <p className="text-muted-foreground">{walletDetails.email || walletDetails.phone}</p>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <span>Balance:</span> <span className="text-right font-medium">{inr(walletDetails.balance)}</span>
                  <span>Locked:</span> <span className="text-right font-medium">{inr(walletDetails.locked)}</span>
                  <span>Available:</span> <span className="text-right font-medium">{inr(walletDetails.available)}</span>
                  <span>Total Profit:</span> <span className="text-right font-medium">{inr(walletDetails.totalProfit)}</span>
                  <span>Total Payout:</span> <span className="text-right font-medium">{inr(walletDetails.totalPayout)}</span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="action">Action</Label>
              <Select value={action} onValueChange={(v) => setAction(v as any)}>
                <SelectTrigger id="action" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Credit Balance</SelectItem>
                  <SelectItem value="debit">Debit Balance</SelectItem>
                  <SelectItem value="lock">Lock Amount</SelectItem>
                  <SelectItem value="unlock">Unlock Amount</SelectItem>
                  <SelectItem value="set_balance">Set Total Balance</SelectItem>
                  <SelectItem value="set_locked">Set Locked Amount</SelectItem>
                  <SelectItem value="add_profit">Add Profit</SelectItem>
                  <SelectItem value="add_payout">Add Payout (Bookkeeping)</SelectItem>
                  <SelectItem value="remove_payout">Remove Payout (Bookkeeping)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(action === "credit" || action === "debit" || action === "lock" || action === "unlock" || action === "add_profit" || action === "add_payout" || action === "remove_payout") && (
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="text" // Use text to allow custom sanitization
                  min={0}
                  value={amount}
                  onChange={handleAmountChange}
                  className="mt-1"
                  placeholder="e.g., 10000.50"
                />
              </div>
            )}

            {action === "set_balance" && (
              <div>
                <Label htmlFor="newBalance">New Total Balance (₹)</Label>
                <Input
                  id="newBalance"
                  type="text"
                  min={0}
                  value={newBalance}
                  onChange={handleNewBalanceChange}
                  className="mt-1"
                  placeholder="e.g., 50000"
                />
              </div>
            )}

            {action === "set_locked" && (
              <div>
                <Label htmlFor="newLocked">New Locked Amount (₹)</Label>
                <Input
                  id="newLocked"
                  type="text"
                  min={0}
                  value={newLocked}
                  onChange={handleNewLockedChange}
                  className="mt-1"
                  placeholder="e.g., 10000"
                />
              </div>
            )}

            <div>
              <Label htmlFor="reason">Reason (Mandatory for Audit)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="mt-1"
                placeholder="e.g., 'Manual credit for bonus', 'Correction for failed transaction'"
              />
            </div>

            {(action === "credit" || action === "debit" || action === "add_profit" || action === "add_payout" || action === "remove_payout") && (
              <div>
                <Label htmlFor="refId">Reference ID (Optional)</Label>
                <Input
                  id="refId"
                  value={refId}
                  onChange={(e) => setRefId(e.target.value)}
                  className="mt-1"
                  placeholder="e.g., UTR12345"
                />
              </div>
            )}

            {error && <p className="text-destructive text-sm mt-2">{error}</p>}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingDetails}>
            {submitting ? "Adjusting..." : "Adjust Wallet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};