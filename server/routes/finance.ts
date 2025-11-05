import { RequestHandler } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth"; // Import requireAdmin
import { Investment, Ledger, Payout, Withdrawal, InvestmentDoc, LedgerDoc, PayoutDoc, WithdrawalDoc } from "../models/Finance";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";
import { User, UserDoc } from "../models/User"; // Import User model for bank details

// Helper to format currency
const inr = (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

// --- Ledger (Transactions) ---
const listLedgerQuerySchema = z.object({
  type: z.string().optional(),
  direction: z.enum(["credit", "debit", "none"]).optional(), // Added 'none'
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const listUserLedger: RequestHandler[] = [
  requireAuth,
  async (req, res) => {
    if (!isDbConnected())
      return res.json({ items: [], total: 0, page: 1, limit: 20 });

    const parsed = listLedgerQuerySchema.safeParse(req.query);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid query" });

    const { type, direction, page, limit } = parsed.data;
    const userId = (req as any).user.sub;

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (type) filter.type = type;
    if (direction) filter.direction = direction;

    const skip = (page - 1) * limit;

    const [ledgerEntries, total] = await Promise.all([
      (Ledger as Model<LedgerDoc>).find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Ledger as Model<LedgerDoc>).countDocuments(filter),
    ]);

    res.json({ items: ledgerEntries, total, page, limit });
  },
];

// --- Payouts ---
const listPayoutsQuerySchema = z.object({
  status: z.enum(["scheduled", "processing", "paid", "failed", "reprocessing", "on_hold", "pending"]).optional(), // Added pending
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const listUserPayouts: RequestHandler[] = [
  requireAuth,
  async (req, res) => {
    if (!isDbConnected())
      return res.json({ items: [], total: 0, page: 1, limit: 20 });

    const parsed = listPayoutsQuerySchema.safeParse(req.query);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid query" });

    const { status, page, limit } = parsed.data;
    const userId = (req as any).user.sub;

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      (Payout as Model<PayoutDoc>).find(filter)
        .populate("investmentId", "meta.planName principal") // Populate investment details
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Payout as Model<PayoutDoc>).countDocuments(filter),
    ]);

    const items = payouts.map((p: any) => ({
      ...p,
      investmentPlanName: p.investmentId?.meta?.planName || "N/A",
      investmentPrincipal: p.investmentId?.principal || 0,
    }));

    res.json({ items: payouts, total, page, limit });
  },
];

// --- Withdrawals ---
const listWithdrawalsQuerySchema = z.object({
  status: z.enum(["requested", "under_admin_review", "approved", "paid", "rejected", "failed"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const listUserWithdrawals: RequestHandler[] = [
  requireAuth,
  async (req, res) => {
    if (!isDbConnected())
      return res.json({ items: [], total: 0, page: 1, limit: 20 });

    const parsed = listWithdrawalsQuerySchema.safeParse(req.query);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid query" });

    const { status, page, limit } = parsed.data;
    const userId = (req as any).user.sub;

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      (Withdrawal as Model<WithdrawalDoc>).find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Withdrawal as Model<WithdrawalDoc>).countDocuments(filter),
    ]);

    res.json({ items: withdrawals, total, page, limit });
  },
];

const createWithdrawalSchema = z.object({
  amount: z.number().min(100), // Minimum withdrawal amount
  source: z.enum(["earnings", "referral"]).default("earnings"),
});

export const createWithdrawalRequest: RequestHandler[] = [
  requireAuth,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const parsed = createWithdrawalSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body" });

    const { amount, source } = parsed.data;
    const userId = (req as any).user.sub;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await (User as Model<UserDoc>).findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = Number(user.balance) || 0;
      const currentLocked = Number(user.locked) || 0;
      const availableBalance = currentBalance - currentLocked;

      if (amount > availableBalance) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Insufficient balance. Available: ${inr(availableBalance)}` });
      }

      // Business rules for charges and TDS (example: 2% charges, capped at 50)
      const chargesRate = 0.02;
      const chargesCap = 50;
      let charges = Math.min(amount * chargesRate, chargesCap);
      charges = +charges.toFixed(2); // Ensure 2 decimal places

      const tdsRate = 0; // For simplicity, TDS is 0 for now. In a real app, this would be calculated.
      let tds = +(amount * tdsRate).toFixed(2);

      const netAmount = +(amount - charges - tds).toFixed(2);

      if (netAmount <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Net withdrawal amount must be positive after charges." });
      }

      // Lock the requested amount
      user.locked += amount;
      await user.save({ session });

      const withdrawal = await (Withdrawal as Model<WithdrawalDoc>).create([{
        userId: new mongoose.Types.ObjectId(userId),
        amount,
        source,
        charges,
        tds,
        netAmount,
        status: "under_admin_review", // Changed initial status to under_admin_review
      }], { session });

      // Create ledger entry for the lock
      await (Ledger as Model<LedgerDoc>).create([{
        userId: user._id,
        withdrawalId: withdrawal[0]._id,
        type: "withdrawal_request_lock",
        direction: "none", // Funds are locked, not debited from system
        amount: amount,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance, // Balance doesn't change
        lockedBefore: currentLocked,
        lockedAfter: currentLocked + amount,
        note: `Withdrawal request for ${inr(amount)} from ${source} initiated. Amount locked.`,
        meta: {
          requestedAmount: amount,
          source: source,
          charges: charges,
          tds: tds,
          netAmount: netAmount,
          status: "under_admin_review",
        },
      }], { session });


      await session.commitTransaction();
      session.endSession();

      res.status(201).json(withdrawal[0]);
    } catch (e: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error creating withdrawal request:", e);
      res.status(500).json({ message: e.message || "Failed to create withdrawal request" });
    }
  },
];

const updatePayoutStatusSchema = z.object({
  status: z.enum(["scheduled", "processing", "paid", "failed", "reprocessing", "on_hold"]), // Added scheduled and reprocessing
  rrn: z.string().trim().optional(),
  gateway: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

export const updatePayoutStatus: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid payout ID" });

    const parsed = updatePayoutStatusSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body" });

    const { status, rrn, gateway, note } = parsed.data;
    const adminId = (req as any).user.sub;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payout = await (Payout as Model<PayoutDoc>).findById(id).session(session);
      if (!payout) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Payout not found" });
      }

      const user = await (User as Model<UserDoc>).findById(payout.userId).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "User not found for payout" });
      }

      const oldStatus = payout.status;
      const currentBalance = Number(user.balance) || 0;
      const currentTotalPayout = Number(user.totalPayout) || 0;
      const currentTotalProfit = Number(user.totalProfit) || 0; // Get current totalProfit

      let ledgerEntry: Partial<LedgerDoc> = {
        userId: user._id,
        payoutId: payout._id,
        type: `payout_status_${status}`,
        note: note || `Payout status changed from ${oldStatus} to ${status}`,
        meta: {
          adminId,
          oldStatus,
          newStatus: status,
          netPayout: payout.netPayout,
        },
        balanceBefore: currentBalance,
        lockedBefore: user.locked || 0,
      };

      if (status === "paid" && oldStatus !== "paid") {
        // Credit user's balance and update totalPayout AND totalProfit
        user.balance += payout.netPayout;
        user.totalPayout += payout.netPayout;
        user.totalProfit += payout.netPayout; // ADDED: Update totalProfit here
        payout.status = "paid";
        payout.paidAt = new Date();
        payout.rrn = rrn;
        payout.gateway = gateway;

        ledgerEntry.type = "payout_credit";
        ledgerEntry.direction = "credit";
        ledgerEntry.amount = payout.netPayout;
        ledgerEntry.balanceAfter = currentBalance + payout.netPayout;
        ledgerEntry.lockedAfter = user.locked || 0;
        ledgerEntry.meta.totalPayoutAfter = currentTotalPayout + payout.netPayout;
        ledgerEntry.meta.totalProfitAfter = currentTotalProfit + payout.netPayout; // ADDED: Update meta for totalProfit
      } else if (status === "failed" && oldStatus !== "failed") {
        // If payout was already processed (e.g., processing) and failed,
        // ensure no double debit/credit. For simplicity, assume failed means no credit happened.
        payout.status = "failed";
        payout.paidAt = undefined;
        payout.rrn = undefined;
        payout.gateway = undefined;

        ledgerEntry.type = "payout_failed";
        ledgerEntry.direction = "none"; // No balance change if it failed before credit
        ledgerEntry.amount = payout.netPayout;
        ledgerEntry.balanceAfter = currentBalance;
        ledgerEntry.lockedAfter = user.locked || 0;

      } else if (status === "on_hold" && oldStatus !== "on_hold") {
        payout.status = "on_hold";
        payout.paidAt = undefined;
        payout.rrn = undefined;
        payout.gateway = undefined;

        ledgerEntry.type = "payout_on_hold";
        ledgerEntry.direction = "none";
        ledgerEntry.amount = payout.netPayout;
        ledgerEntry.balanceAfter = currentBalance;
        ledgerEntry.lockedAfter = user.locked || 0;

      } else if (status === "processing" && oldStatus !== "processing") {
        payout.status = "processing";
        ledgerEntry.type = "payout_processing";
        ledgerEntry.direction = "none";
        ledgerEntry.amount = payout.netPayout;
        ledgerEntry.balanceAfter = currentBalance;
        ledgerEntry.lockedAfter = user.locked || 0;
      } else if (status === "scheduled" && oldStatus !== "scheduled") {
        // Allow resetting to scheduled, e.g., if it was failed and retried
        payout.status = "scheduled";
        payout.paidAt = undefined;
        payout.rrn = undefined;
        payout.gateway = undefined;

        ledgerEntry.type = "payout_rescheduled";
        ledgerEntry.direction = "none";
        ledgerEntry.amount = payout.netPayout;
        ledgerEntry.balanceAfter = currentBalance;
        ledgerEntry.lockedAfter = user.locked || 0;
      } else if (status === "reprocessing" && oldStatus !== "reprocessing") {
        payout.status = "reprocessing";
        ledgerEntry.type = "payout_reprocessing";
        ledgerEntry.direction = "none";
        ledgerEntry.amount = payout.netPayout;
        ledgerEntry.balanceAfter = currentBalance;
        ledgerEntry.lockedAfter = user.locked || 0;
      }
      else {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Invalid status transition from ${oldStatus} to ${status}` });
      }

      await user.save({ session });
      await payout.save({ session });
      await (Ledger as Model<LedgerDoc>).create([ledgerEntry], { session });
      await session.commitTransaction();
      session.endSession();

      res.json(payout);
    } catch (e: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error updating payout status:", e);
      res.status(500).json({ message: e.message || "Failed to update payout status" });
    }
  },
];