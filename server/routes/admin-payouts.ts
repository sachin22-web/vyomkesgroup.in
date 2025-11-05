import { RequestHandler } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "./auth";
import { Payout, PayoutDoc } from "../models/Finance";
import { User, UserDoc } from "../models/User";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";
import { updatePayoutStatus } from "./finance"; // Import the updatePayoutStatus from finance routes

const listAdminPayoutsSchema = z.object({
  status: z.enum(["scheduled", "processing", "paid", "failed", "reprocessing", "on_hold"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const listAdminPayouts: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.json({ items: [], total: 0, page: 1, limit: 20 });

    const parsed = listAdminPayoutsSchema.safeParse(req.query);
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

    const [payoutsRaw, total] = await Promise.all([
      (Payout as Model<PayoutDoc>).find(filter)
        .populate("userId", "name email phone") // Populate user details
        .populate("investmentId", "principal meta.planName") // Populate investment details
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      (Payout as Model<PayoutDoc>).countDocuments(filter),
    ]);

    const items = payoutsRaw.map((payout: any) => ({
      id: String(payout._id),
      userId: String(payout.userId?._id),
      userName: payout.userId?.name,
      userEmail: payout.userId?.email,
      userPhone: payout.userId?.phone,
      investmentId: String(payout.investmentId?._id),
      investmentPrincipal: payout.investmentId?.principal,
      investmentPlanName: payout.investmentId?.meta?.planName,
      monthNo: payout.monthNo,
      dueDate: payout.dueDate,
      grossPayout: payout.grossPayout,
      adminCharge: payout.adminCharge,
      booster: payout.booster,
      tds: payout.tds,
      netPayout: payout.netPayout,
      status: payout.status,
      paidAt: payout.paidAt,
      rrn: payout.rrn,
      gateway: payout.gateway,
      createdAt: payout.createdAt,
    }));

    res.json({ items, total, page, limit });
  },
];

// Re-export the updatePayoutStatus from finance.ts for admin use
export const updateAdminPayoutStatus = updatePayoutStatus;