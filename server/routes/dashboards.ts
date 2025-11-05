import { RequestHandler } from "express";
import { Investment, Payout, Withdrawal, Ledger, InvestmentDoc, PayoutDoc, WithdrawalDoc, LedgerDoc } from "../models/Finance";
import { requireAuth, requireAdmin } from "./auth";
import { isDbConnected } from "../db";
import { Model } from "mongoose";
import { User, UserDoc } from "../models/User";

export const userOverview = [
  requireAuth,
  async (req, res) => {
    if (!isDbConnected()) {
      return res.json({
        totalInvested: 0,
        currentEarnings: 0,
        pendingWithdrawals: 0,
        nextPayoutDate: null,
        referralEarnings: 0,
        balance: 0,
        locked: 0,
        totalProfit: 0, // Added
        totalPayout: 0, // Added
      });
    }
    const userId = (req as any).user.sub;
    const user = await (User as Model<UserDoc>).findById(userId).lean(); // Fetch user to get balance/locked
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [investedAgg] = await (Investment as Model<InvestmentDoc>).aggregate([
      {
        $match: {
          userId: (
            await import("mongoose")
          ).default.Types.ObjectId.createFromHexString(userId),
          status: "active", // Only count active investments
        },
      },
      { $group: { _id: null, total: { $sum: "$principal" } } },
    ]);
    const totalInvested = investedAgg?.total || 0;
    
    // Use user's totalPayout for currentEarnings
    const currentEarnings = Number(user.totalPayout) || 0;

    const pendingWithdrawals = await (Withdrawal as Model<WithdrawalDoc>).countDocuments({
      userId,
      status: { $in: ["requested", "under_admin_review", "approved"] }, // Updated statuses
    });
    const nextPayoutDate = await (Payout as Model<PayoutDoc>).findOne({
      userId,
      status: { $in: ["scheduled", "processing"] },
    })
      .sort({ paidAt: 1 }) // Sort by paidAt to get the earliest next payout
      .then((p) => p?.paidAt ?? null);
    res.json({
      totalInvested,
      currentEarnings,
      pendingWithdrawals,
      nextPayoutDate,
      referralEarnings: user.referral?.earnings || 0, // Use user's referral earnings
      balance: Number(user.balance) || 0,
      locked: Number(user.locked) || 0,
      totalProfit: Number(user.totalProfit) || 0, // Added
      totalPayout: Number(user.totalPayout) || 0, // Added
    });
  },
];

export const adminOverview = [
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    if (!isDbConnected()) {
      return res.json({
        totalAUM: 0,
        activeInvestors: 0,
        todayInflows: 0,
        todayOutflows: 0,
        pendingKYCs: 0,
        pendingWithdrawals: 0,
        payoutDueToday: 0,
        referralCosts: 0,
        chargeIncome: 0,
        totalUserBalance: 0,
        totalUserLocked: 0,
        totalProfitGenerated: 0, // Added
        totalPayoutDistributed: 0, // Added
      });
    }
    const [aumAgg] = await (Investment as Model<InvestmentDoc>).aggregate([
      { $group: { _id: null, total: { $sum: "$principal" } } },
    ]);
    const totalAUM = aumAgg?.total || 0;
    const activeInvestors = await (Investment as Model<InvestmentDoc>).distinct("userId").then(
      (ids) => ids.length,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tmr = new Date(today);
    tmr.setDate(today.getDate() + 1);
    const todayInflows = await (Investment as Model<InvestmentDoc>).aggregate([
      { $match: { createdAt: { $gte: today, $lt: tmr } } },
      { $group: { _id: null, total: { $sum: "$principal" } } },
    ]).then((r) => r[0]?.total || 0);
    const todayOutflows = await (Withdrawal as Model<WithdrawalDoc>).aggregate([
      { $match: { status: "paid", paidAt: { $gte: today, $lt: tmr } } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } },
    ]).then((r) => r[0]?.total || 0);
    const pendingKYCs = await (User as Model<UserDoc>).countDocuments({ "kyc.status": "pending" });
    const pendingWithdrawals = await (Withdrawal as Model<WithdrawalDoc>).countDocuments({ status: { $in: ["requested", "under_admin_review", "approved"] } }); // Updated statuses
    const payoutDueToday = await (Payout as Model<PayoutDoc>).countDocuments({ status: { $in: ["scheduled", "processing"] } });
    
    // Ledger based metrics
    const referralCosts = await (Ledger as Model<LedgerDoc>).aggregate([
      { $match: { type: "referral_payout", direction: "debit" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).then((r) => r[0]?.total || 0);
    const chargeIncome = await (Ledger as Model<LedgerDoc>).aggregate([
      { $match: { type: "admin_charge", direction: "credit" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).then((r) => r[0]?.total || 0);

    // Aggregate total user balance and locked amounts
    const [userWalletAgg] = await (User as Model<UserDoc>).aggregate([
      { $group: { _id: null, totalBalance: { $sum: "$balance" }, totalLocked: { $sum: "$locked" }, totalProfit: { $sum: "$totalProfit" }, totalPayout: { $sum: "$totalPayout" } } },
    ]);
    const totalUserBalance = userWalletAgg?.totalBalance || 0;
    const totalUserLocked = userWalletAgg?.totalLocked || 0;
    const totalProfitGenerated = userWalletAgg?.totalProfit || 0; // Added
    const totalPayoutDistributed = userWalletAgg?.totalPayout || 0; // Added


    res.json({ totalAUM, activeInvestors, todayInflows, todayOutflows, pendingKYCs, pendingWithdrawals, payoutDueToday, referralCosts, chargeIncome, totalUserBalance, totalUserLocked, totalProfitGenerated, totalPayoutDistributed });
  },
];