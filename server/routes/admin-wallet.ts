import { RequestHandler } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "./auth";
import { User, UserDoc } from "../models/User";
import { Ledger, LedgerDoc } from "../models/Finance";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";

// Helper to sanitize and validate amount
function parseAndValidateAmount(value: any): number {
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error("Invalid amount: Must be a positive number.");
  }
  return num;
}

// Schema for fetching user wallet details
const getUserWalletSchema = z.object({
  userId: z.string().refine((val) => mongoose.isValidObjectId(val), {
    message: "Invalid user ID",
  }),
});

export const getUserWalletDetails: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const parsed = getUserWalletSchema.safeParse(req.params);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid user ID" });

    const { userId } = parsed.data;

    try {
      const user = await (User as Model<UserDoc>).findById(userId).select("name email phone balance locked totalProfit totalPayout").lean();
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const balance = Number(user.balance) || 0;
      const locked = Number(user.locked) || 0;

      res.json({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        balance: balance,
        locked: locked,
        available: balance - locked,
        totalProfit: Number(user.totalProfit) || 0,
        totalPayout: Number(user.totalPayout) || 0,
      });
    } catch (e: any) {
      console.error("Error fetching user wallet details:", e);
      res.status(500).json({ message: "Failed to fetch user wallet details" });
    }
  },
];

// Schema for adjusting user wallet
const adjustWalletSchema = z.object({
  action: z.enum(["credit", "debit", "lock", "unlock", "set_balance", "set_locked", "add_profit", "add_payout", "remove_payout"]),
  amount: z.union([z.number().min(0), z.string().regex(/^[0-9.]+$/)]).optional(), // Allow string for frontend parsing
  newBalance: z.union([z.number().min(0), z.string().regex(/^[0-9.]+$/)]).optional(),
  newLocked: z.union([z.number().min(0), z.string().regex(/^[0-9.]+$/)]).optional(),
  reason: z.string().trim().min(1).max(500), // Mandatory reason for audit
  refId: z.string().trim().optional(), // Optional reference ID
});

export const adjustUserWallet: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const parsedParams = getUserWalletSchema.safeParse(req.params);
    if (!parsedParams.success)
      return res.status(400).json({ message: "Invalid user ID" });

    const { userId } = parsedParams.data;

    const parsedBody = adjustWalletSchema.safeParse(req.body);
    if (!parsedBody.success)
      return res.status(400).json({ message: "Invalid request body", errors: parsedBody.error.errors });

    const { action, amount: rawAmount, newBalance: rawNewBalance, newLocked: rawNewLocked, reason, refId } = parsedBody.data;
    const adminId = (req as any).user.sub;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await (User as Model<UserDoc>).findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "User not found" });
      }

      // Ensure wallet fields are numbers, default to 0 if undefined/null
      let currentBalance = Number(user.balance) || 0;
      let currentLocked = Number(user.locked) || 0;
      let currentTotalProfit = Number(user.totalProfit) || 0;
      let currentTotalPayout = Number(user.totalPayout) || 0;
      const availableBalance = currentBalance - currentLocked;

      let updateFields: any = {};
      let ledgerEntry: Partial<LedgerDoc> = {
        userId: user._id,
        type: `admin_wallet_${action}`,
        note: reason,
        refId: refId,
        meta: { adminId, reason, oldBalance: currentBalance, oldLocked: currentLocked, oldTotalProfit: currentTotalProfit, oldTotalPayout: currentTotalPayout },
        balanceBefore: currentBalance,
        lockedBefore: currentLocked,
      };

      let amt: number = 0;
      let newBal: number = 0;
      let newLoc: number = 0;

      if (rawAmount !== undefined) {
        try {
          amt = parseAndValidateAmount(rawAmount);
        } catch (e: any) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: e.message });
        }
      }
      if (rawNewBalance !== undefined) {
        try {
          newBal = parseAndValidateAmount(rawNewBalance);
        } catch (e: any) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: `Invalid new balance: ${e.message}` });
        }
      }
      if (rawNewLocked !== undefined) {
        try {
          newLoc = parseAndValidateAmount(rawNewLocked);
        } catch (e: any) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: `Invalid new locked amount: ${e.message}` });
        }
      }

      switch (action) {
        case "credit":
          updateFields.$inc = { balance: amt };
          ledgerEntry.amount = amt;
          ledgerEntry.direction = "credit";
          ledgerEntry.balanceAfter = currentBalance + amt;
          ledgerEntry.lockedAfter = currentLocked;
          break;
        case "debit":
          if (amt > availableBalance) {
            throw new Error("Insufficient available balance for debit.");
          }
          updateFields.$inc = { balance: -amt };
          ledgerEntry.amount = amt;
          ledgerEntry.direction = "debit";
          ledgerEntry.balanceAfter = currentBalance - amt;
          ledgerEntry.lockedAfter = currentLocked;
          break;
        case "lock":
          if (amt > availableBalance) {
            throw new Error("Insufficient available balance to lock.");
          }
          updateFields.$inc = { locked: amt };
          ledgerEntry.amount = amt;
          ledgerEntry.direction = "none"; // Funds move from balance to locked, not credit/debit from system
          ledgerEntry.type = "admin_wallet_lock";
          ledgerEntry.balanceAfter = currentBalance; // Balance doesn't change
          ledgerEntry.lockedAfter = currentLocked + amt;
          break;
        case "unlock":
          if (currentLocked < amt) {
            throw new Error("Insufficient locked amount to unlock.");
          }
          updateFields.$inc = { locked: -amt };
          ledgerEntry.amount = amt;
          ledgerEntry.direction = "none"; // Funds move from locked to balance, not credit/debit from system
          ledgerEntry.type = "admin_wallet_unlock";
          ledgerEntry.balanceAfter = currentBalance; // Balance doesn't change
          ledgerEntry.lockedAfter = currentLocked - amt;
          break;
        case "set_balance":
          updateFields.balance = newBal;
          ledgerEntry.amount = newBal; // Store the new balance as amount for ledger clarity
          ledgerEntry.direction = newBal > currentBalance ? "credit" : "debit";
          ledgerEntry.balanceAfter = newBal;
          ledgerEntry.lockedAfter = currentLocked;
          break;
        case "set_locked":
          updateFields.locked = newLoc;
          ledgerEntry.amount = newLoc; // Store the new locked as amount for ledger clarity
          ledgerEntry.direction = newLoc > currentLocked ? "debit" : "credit"; // Funds move out/in of locked
          ledgerEntry.type = "admin_wallet_set_locked";
          ledgerEntry.balanceAfter = currentBalance; // Balance doesn't change
          ledgerEntry.lockedAfter = newLoc;
          break;
        case "add_profit":
          updateFields.$inc = { balance: amt, totalProfit: amt };
          ledgerEntry.amount = amt;
          ledgerEntry.direction = "credit";
          ledgerEntry.type = "profit";
          ledgerEntry.balanceAfter = currentBalance + amt;
          ledgerEntry.lockedAfter = currentLocked;
          ledgerEntry.meta.totalProfitAfter = currentTotalProfit + amt;
          break;
        case "add_payout":
          updateFields.$inc = { totalPayout: amt };
          ledgerEntry.amount = amt;
          ledgerEntry.direction = "none"; // Bookkeeping only, no direct balance change
          ledgerEntry.type = "payout_book";
          ledgerEntry.balanceAfter = currentBalance;
          ledgerEntry.lockedAfter = currentLocked;
          ledgerEntry.meta.totalPayoutAfter = currentTotalPayout + amt;
          break;
        case "remove_payout":
          updateFields.$inc = { totalPayout: -amt };
          ledgerEntry.amount = amt;
          ledgerEntry.direction = "none"; // Bookkeeping only, no direct balance change
          ledgerEntry.type = "payout_book";
          ledgerEntry.balanceAfter = currentBalance;
          ledgerEntry.lockedAfter = currentLocked;
          ledgerEntry.meta.totalPayoutAfter = currentTotalPayout - amt;
          break;
        default:
          throw new Error("Invalid wallet action.");
      }

      // Perform the atomic update
      const updatedUser = await (User as Model<UserDoc>).findByIdAndUpdate(
        userId,
        updateFields,
        { new: true, session }
      );

      if (!updatedUser) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "User not found after update attempt." });
      }

      // Ensure balanceAfter and lockedAfter are always set for ledger
      ledgerEntry.balanceAfter = Number(updatedUser.balance) || 0;
      ledgerEntry.lockedAfter = Number(updatedUser.locked) || 0;

      // Create ledger entry
      await (Ledger as Model<LedgerDoc>).create([ledgerEntry], { session });
      await session.commitTransaction();
      session.endSession();

      res.json({
        userId: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        balance: updatedUser.balance,
        locked: updatedUser.locked,
        available: updatedUser.balance - updatedUser.locked,
        totalProfit: updatedUser.totalProfit,
        totalPayout: updatedUser.totalPayout,
      });
    } catch (e: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error adjusting user wallet:", e);
      // Return 400 for validation errors, 500 for unexpected server errors
      const statusCode = e.message.includes("Insufficient") || e.message.includes("required") || e.message.includes("Invalid") ? 400 : 500;
      res.status(statusCode).json({ message: e.message || "Failed to adjust user wallet" });
    }
  },
];