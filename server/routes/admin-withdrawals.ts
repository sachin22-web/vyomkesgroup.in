import { RequestHandler } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "./auth";
import { Withdrawal, WithdrawalDoc, Ledger, LedgerDoc } from "../models/Finance";
import { User, UserDoc } from "../models/User";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";

const listAdminWithdrawalsSchema = z.object({
  status: z.enum(["requested", "under_admin_review", "approved", "paid", "rejected", "failed"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const updateWithdrawalStatusSchema = z.object({
  status: z.enum(["under_admin_review", "approved", "paid", "rejected", "failed"]),
  reason: z.string().trim().optional(), // Required for rejection/failure
  rrn: z.string().trim().optional(), // Required for marking paid
  gateway: z.string().trim().optional(), // Required for marking paid
});

export const listAdminWithdrawals: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.json({ items: [], total: 0, page: 1, limit: 20 });

    const parsed = listAdminWithdrawalsSchema.safeParse(req.query);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid query" });

    const { status, search, page, limit } = parsed.data;

    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      const users = await (User as Model<UserDoc>).find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      }).select('_id').lean();
      const userIds = users.map(u => u._id);
      filter.userId = { $in: userIds };
    }

    const skip = (page - 1) * limit;

    const [withdrawalsRaw, total] = await Promise.all([
      (Withdrawal as Model<WithdrawalDoc>).find(filter)
        .populate("userId", "name email phone") // Populate user details
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Withdrawal as Model<WithdrawalDoc>).countDocuments(filter),
    ]);

    const items = withdrawalsRaw.map((w: any) => ({
      id: String(w._id),
      userId: String(w.userId?._id),
      userName: w.userId?.name,
      userEmail: w.userId?.email,
      userPhone: w.userId?.phone,
      amount: w.amount,
      source: w.source,
      charges: w.charges,
      tds: w.tds,
      netAmount: w.netAmount,
      status: w.status,
      reason: w.reason,
      paidAt: w.paidAt,
      rrn: w.rrn,
      gateway: w.gateway,
      createdAt: w.createdAt,
    }));

    res.json({ items, total, page, limit });
  },
];

export const updateWithdrawalStatus: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid withdrawal ID" });

    const parsed = updateWithdrawalStatusSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body" });

    const { status, reason, rrn, gateway } = parsed.data;
    const adminId = (req as any).user.sub;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const withdrawal = await (Withdrawal as Model<WithdrawalDoc>).findById(id).session(session);
      if (!withdrawal) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Withdrawal request not found" });
      }

      const user = await (User as Model<UserDoc>).findById(withdrawal.userId).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "User not found" });
      }

      const oldStatus = withdrawal.status;
      const currentBalance = Number(user.balance) || 0;
      const currentLocked = Number(user.locked) || 0;
      const currentTotalProfit = Number(user.totalProfit) || 0;
      const currentTotalPayout = Number(user.totalPayout) || 0;

      let ledgerEntry: Partial<LedgerDoc> = {
        userId: user._id,
        withdrawalId: withdrawal._id,
        note: reason || `Withdrawal status updated to ${status.replace(/_/g, ' ')}`,
        meta: {
          adminId,
          oldStatus,
          newStatus: status,
          requestedAmount: withdrawal.amount,
          netAmount: withdrawal.netAmount,
          charges: withdrawal.charges,
          tds: withdrawal.tds,
        },
        balanceBefore: currentBalance,
        lockedBefore: currentLocked,
      };

      if (status === "approved" && (oldStatus === "requested" || oldStatus === "under_admin_review")) {
        // Debit from user's balance and release from locked
        user.balance -= withdrawal.netAmount;
        user.locked -= withdrawal.amount; // Release the full requested amount from locked
        withdrawal.status = "approved";

        ledgerEntry.type = "withdrawal_debit";
        ledgerEntry.direction = "debit";
        ledgerEntry.amount = withdrawal.netAmount;
        ledgerEntry.balanceAfter = currentBalance - withdrawal.netAmount;
        ledgerEntry.lockedAfter = currentLocked - withdrawal.amount;

      } else if (status === "rejected" && (oldStatus === "requested" || oldStatus === "under_admin_review")) {
        if (!reason) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: "Reason is required for rejection" });
        }
        // Release locked amount, balance remains unchanged
        user.locked -= withdrawal.amount;
        withdrawal.status = "rejected";
        withdrawal.reason = reason;

        ledgerEntry.type = "withdrawal_rejected_unlock";
        ledgerEntry.direction = "none"; // Funds are unlocked, not credited from system
        ledgerEntry.amount = withdrawal.amount;
        ledgerEntry.balanceAfter = currentBalance;
        ledgerEntry.lockedAfter = currentLocked - withdrawal.amount;

      } else if (status === "paid" && oldStatus === "approved") {
        if (!rrn || !gateway) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: "RRN and Gateway are required to mark as paid" });
        }
        withdrawal.status = "paid";
        withdrawal.paidAt = new Date();
        withdrawal.rrn = rrn;
        withdrawal.gateway = gateway;

        // Update totalPayout for the user
        user.totalPayout += withdrawal.netAmount;

        ledgerEntry.type = "withdrawal_paid";
        ledgerEntry.direction = "none"; // Balance already debited on approval
        ledgerEntry.amount = withdrawal.netAmount;
        ledgerEntry.balanceAfter = currentBalance;
        ledgerEntry.lockedAfter = currentLocked;
        ledgerEntry.meta.totalPayoutAfter = currentTotalPayout + withdrawal.netAmount;

      } else if (status === "failed" && oldStatus === "approved") {
        if (!reason) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: "Reason is required for marking as failed" });
        }
        // If payment failed after approval, refund the net amount to user's balance
        user.balance += withdrawal.netAmount;
        withdrawal.status = "failed";
        withdrawal.reason = reason;

        ledgerEntry.type = "withdrawal_failed_refund";
        ledgerEntry.direction = "credit";
        ledgerEntry.amount = withdrawal.netAmount;
        ledgerEntry.balanceAfter = currentBalance + withdrawal.netAmount;
        ledgerEntry.lockedAfter = currentLocked;

      } else if (status === "under_admin_review" && oldStatus === "requested") {
        withdrawal.status = "under_admin_review";
        ledgerEntry.type = "withdrawal_status_update";
        ledgerEntry.direction = "none";
        ledgerEntry.amount = 0;
        ledgerEntry.balanceAfter = currentBalance;
        ledgerEntry.lockedAfter = currentLocked;
      } else {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Invalid status transition from ${oldStatus} to ${status}` });
      }

      await user.save({ session });
      await withdrawal.save({ session });
      await (Ledger as Model<LedgerDoc>).create([ledgerEntry], { session });
      await session.commitTransaction();
      session.endSession();

      res.json(withdrawal);
    } catch (e: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error updating withdrawal status:", e);
      res.status(500).json({ message: e.message || "Failed to update withdrawal status" });
    }
  },
];