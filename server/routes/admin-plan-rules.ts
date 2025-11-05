import { RequestHandler } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "./auth";
import { PlanRule, PlanRuleDoc } from "../models/PlanRule";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";

const activatePlanRuleSchema = z.object({
  planRuleId: z.string().min(1),
});

export const activatePlanRule: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const { id } = req.params; // Use id from params for the specific plan rule
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid PlanRule ID" });
    }

    try {
      // Deactivate all other plan rules
      await (PlanRule as Model<PlanRuleDoc>).updateMany(
        { _id: { $ne: id } },
        { $set: { active: false } }
      );

      // Activate the specified plan rule
      const activatedPlanRule = await (PlanRule as Model<PlanRuleDoc>).findByIdAndUpdate(
        id,
        { $set: { active: true, effectiveFrom: new Date() } },
        { new: true }
      );

      if (!activatedPlanRule) {
        return res.status(404).json({ message: "PlanRule not found" });
      }

      res.json({ message: "PlanRule activated successfully", planRule: activatedPlanRule });
    } catch (e: any) {
      console.error("Error activating PlanRule:", e);
      res.status(500).json({ message: "Failed to activate PlanRule" });
    }
  },
];

export const getLatestPlanRule: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (_req, res) => {
    if (!isDbConnected()) {
      return res.json(null);
    }
    try {
      const latestPlanRule = await (PlanRule as Model<PlanRuleDoc>).findOne({})
        .sort({ createdAt: -1 }) // Get the most recently created
        .lean();
      res.json(latestPlanRule);
    } catch (e: any) {
      console.error("Error fetching latest PlanRule:", e);
      res.status(500).json({ message: "Failed to fetch latest PlanRule" });
    }
  },
];