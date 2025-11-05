import { RequestHandler } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "./auth";
import { Investment, InvestmentDoc, Payout, PayoutDoc, Ledger, LedgerDoc } from "../models/Finance";
import { User, UserDoc } from "../models/User";
import { PlanRule, PlanRuleDoc } from "../models/PlanRule";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";
import { addMonths, lastDayOfMonth, setDate, isBefore } from "date-fns"; // Import date-fns utilities

const listAdminInvestmentsSchema = z.object({
  status: z.enum(["initiated", "under_review", "approved", "active", "completed", "cancelled", "rejected"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const listAdminInvestments: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.json({ items: [], total: 0, page: 1, limit: 20 });

    const parsed = listAdminInvestmentsSchema.safeParse(req.query);
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

    const [investmentsRaw, total] = await Promise.all([
      (Investment as Model<InvestmentDoc>).find(filter)
        .populate("userId", "name email phone") // Populate user details
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Investment as Model<InvestmentDoc>).countDocuments(filter),
    ]);

    const items = investmentsRaw.map((inv: any) => ({
      id: String(inv._id),
      userId: String(inv.userId?._id), // Added optional chaining
      userName: inv.userId?.name,      // Added optional chaining
      userEmail: inv.userId?.email,    // Added optional chaining
      userPhone: inv.userId?.phone,    // Added optional chaining
      principal: inv.principal,
      method: inv.method,
      proofUrl: inv.proofUrl,
      utr: inv.utr,
      status: inv.status,
      startedAt: inv.startedAt,
      planVersion: inv.planVersion,
      meta: inv.meta,
      createdAt: inv.createdAt,
    }));

    res.json({ items, total, page, limit });
  },
];

const approveRejectSchema = z.object({
  remarks: z.string().trim().optional(),
});

export const approveInvestment: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid investment ID" });

    const parsed = approveRejectSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body" });

    const { remarks } = parsed.data;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const investment = await (Investment as Model<InvestmentDoc>).findById(id).session(session);
      if (!investment) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Investment not found" });
      }
      // Allow approval for 'initiated' or 'under_review'
      if (!["initiated", "under_review"].includes(investment.status)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Investment is not in 'initiated' or 'under_review' status" });
      }

      investment.status = "active"; // Investment is now active
      investment.notes = remarks;
      investment.startedAt = new Date(); // Set actual start date
      await investment.save({ session });

      // --- Generate Payout Schedule ---
      const planRule = await (PlanRule as Model<PlanRuleDoc>).findOne({ version: investment.planVersion, active: true }).session(session);
      if (!planRule) {
        await session.abortTransaction();
        session.endSession();
        console.warn(`No active plan rule found for version ${investment.planVersion}. Payouts might be incorrect.`);
        return res.status(500).json({ message: "Failed to find active plan rule for payout generation." });
      }

      const monthDuration = investment.meta?.monthDuration || 1;
      const boosterApplied = investment.meta?.boosterApplied || false;
      const payoutsToCreate = [];

      // totalProfitForInvestment is no longer used to update user.totalProfit immediately
      // let totalProfitForInvestment = 0; // Track total profit for this investment

      for (let i = 1; i <= monthDuration; i++) {
        let grossMonthly = 0;

        if (investment.principal >= planRule.specialMin) {
          grossMonthly = investment.principal * planRule.specialRate;
        } else {
          const band = planRule.bands.find(
            (b) => i >= b.fromMonth && i <= b.toMonth,
          ) || planRule.bands[planRule.bands.length - 1]; // Fallback to last band
          grossMonthly = investment.principal * band.monthlyRate;
        }

        const adminCharge = +(grossMonthly * planRule.adminCharge).toFixed(2);
        const boosterIncome = boosterApplied
          ? +(grossMonthly * planRule.booster).toFixed(2)
          : 0;
        const netPayout = +(grossMonthly - adminCharge + boosterIncome).toFixed(2);

        // totalProfitForInvestment += netPayout; // Removed: totalProfit is updated on actual payout

        // Calculate dueDate for the 25th of the month
        let dueDate = addMonths(new Date(investment.startedAt), i);
        dueDate = setDate(dueDate, 25);
        // Handle edge case where original day is > last day of target month (e.g., Jan 31 -> Feb 28)
        if (dueDate.getDate() !== 25) {
          dueDate = lastDayOfMonth(addMonths(new Date(investment.startedAt), i));
        }
        // Ensure dueDate is not in the past relative to now (for the first payout)
        const now = new Date();
        if (i === 1 && isBefore(dueDate, now)) {
          dueDate = setDate(addMonths(now, 1), 25); // Set to 25th of next month
        }


        payoutsToCreate.push({
          userId: investment.userId,
          investmentId: investment._id,
          monthNo: i,
          dueDate: dueDate, // Use calculated dueDate
          grossPayout: grossMonthly,
          adminCharge: adminCharge,
          booster: boosterIncome,
          tds: 0, // TDS calculation is complex and out of scope for now
          netPayout: netPayout,
          status: "scheduled",
          paidAt: undefined, // Not paid yet
        });
      }
      
      const createdPayouts = await (Payout as Model<PayoutDoc>).insertMany(payoutsToCreate, { session });
      // Link payouts to the investment
      investment.payouts = createdPayouts.map(p => p._id); // Fixed: Assign ObjectId[]
      await investment.save({ session });

      // Update user's totalProfit and add initial investment to balance
      const userToUpdate = await (User as Model<UserDoc>).findById(investment.userId).session(session);
      if (userToUpdate) {
        // userToUpdate.totalProfit = (userToUpdate.totalProfit || 0) + totalProfitForInvestment; // REMOVED: totalProfit is updated on actual payout
        userToUpdate.balance = (userToUpdate.balance || 0) + investment.principal; // Add principal to user's balance
        await userToUpdate.save({ session });

        // Create ledger entry for initial investment credit
        await (Ledger as Model<LedgerDoc>).create([{
          userId: userToUpdate._id,
          investmentId: investment._id,
          type: "investment_credit",
          direction: "credit",
          amount: investment.principal,
          balanceBefore: (userToUpdate.balance || 0) - investment.principal,
          balanceAfter: userToUpdate.balance,
          lockedBefore: userToUpdate.locked || 0,
          lockedAfter: userToUpdate.locked || 0,
          note: `Initial investment of ${investment.principal} for plan ${investment.meta?.planName}`,
          meta: { planId: investment.id, planName: investment.meta?.planName },
        }], { session });
      }


      await session.commitTransaction();
      session.endSession();

      res.json(investment);
    } catch (e: any) {
      await session.abortTransaction();
      session.endSession();
      console.error("Error approving investment:", e);
      res.status(500).json({ message: "Failed to approve investment" });
    }
  },
];

export const rejectInvestment: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid investment ID" });

    const parsed = approveRejectSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body" });

    const { remarks } = parsed.data;

    try {
      const investment = await (Investment as Model<InvestmentDoc>).findById(id);
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      // Allow rejection for 'initiated' or 'under_review'
      if (!["initiated", "under_review"].includes(investment.status)) {
        return res.status(400).json({ message: "Investment is not in 'initiated' or 'under_review' status" });
      }

      investment.status = "rejected";
      investment.notes = remarks;
      await investment.save();
      res.json(investment);
    } catch (e: any) {
      console.error("Error rejecting investment:", e);
      res.status(500).json({ message: "Failed to reject investment" });
    }
  },
];