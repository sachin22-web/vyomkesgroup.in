import { RequestHandler } from "express";
import { z } from "zod";
import { requireAuth } from "./auth";
import { Investment, InvestmentDoc, Payout, PayoutDoc } from "../models/Finance";
import { User, UserDoc } from "../models/User";
import { PlanRule, PlanRuleDoc } from "../models/PlanRule";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";
import { addMonths, lastDayOfMonth, setDate, isBefore } from "date-fns"; // Import date-fns utilities

const createInvestmentSchema = z.object({
  planId: z.string().min(1),
  amount: z.number().min(100000), // Minimum investment amount
  month: z.number().min(1).max(120),
  boosterApplied: z.boolean().optional(),
});

export const createInvestmentOrder: RequestHandler[] = [
  requireAuth,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const parsed = createInvestmentSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body" });

    const { planId, amount, month, boosterApplied } = parsed.data;
    const userId = (req as any).user.sub;

    // Fetch the plan rule
    const planRule = await (PlanRule as Model<PlanRuleDoc>).findById(planId);
    if (!planRule) {
      return res.status(404).json({ message: "Investment plan not found" });
    }

    // Basic validation against plan rules (e.g., minAmount)
    if (amount < planRule.minAmount) {
      return res.status(400).json({ message: `Minimum investment is ${planRule.minAmount}` });
    }

    try {
      const investment = await (Investment as Model<InvestmentDoc>).create({
        userId: new mongoose.Types.ObjectId(userId),
        principal: amount,
        method: "manual_transfer", // Default to manual for now
        status: "initiated", // User created order
        planVersion: planRule.version,
        // Store plan details for future reference if needed
        meta: {
          planName: planRule.name,
          monthDuration: month,
          boosterApplied: boosterApplied || false,
          // annualReturnPercent is not directly on PlanRule, it's on Plan.
          // If needed, it should be fetched from the Plan model or derived.
          // For now, removing to fix TS error.
        }
      });
      res.status(201).json(investment);
    } catch (e: any) {
      console.error("Error creating investment order:", e);
      res.status(500).json({ message: "Failed to create investment order" });
    }
  },
];

const uploadProofSchema = z.object({
  utr: z.string().optional().transform(e => e === "" ? undefined : e), // Explicitly transform empty string to undefined
  proofUrl: z.string().url(),
});

export const uploadPaymentProof: RequestHandler[] = [
  requireAuth,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid investment ID" });

    const parsed = uploadProofSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body" });

    const { utr, proofUrl } = parsed.data;
    const userId = (req as any).user.sub;

    try {
      const investment = await (Investment as Model<InvestmentDoc>).findOneAndUpdate(
        { _id: id, userId: new mongoose.Types.ObjectId(userId), status: "initiated" },
        {
          $set: {
            utr: utr, // Now `utr` will be `undefined` if it was an empty string
            proofUrl,
            status: "under_review", // Payment proof uploaded, pending admin verification
          },
        },
        { new: true }
      );

      if (!investment) {
        return res.status(404).json({ message: "Investment not found or not in 'initiated' status" });
      }
      res.json(investment);
    } catch (e: any) {
      console.error("Error uploading payment proof:", e);
      res.status(500).json({ message: "Failed to upload payment proof" });
    }
  },
];

export const getUserInvestments: RequestHandler[] = [
  requireAuth,
  async (req, res) => {
    if (!isDbConnected())
      return res.json([]); // Return empty array in demo mode

    const userId = (req as any).user.sub;
    const investments = await (Investment as Model<InvestmentDoc>).find({ userId: new mongoose.Types.ObjectId(userId) })
      .populate("payouts") // Populate payouts for each investment
      .sort({ createdAt: -1 })
      .lean();

    res.json(investments);
  }
];