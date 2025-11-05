import { RequestHandler } from "express";
import { PlanRule, PlanRuleDoc } from "../models/PlanRule";
import { isDbConnected } from "../db";
import { Model } from "mongoose";

const defaultPlan = {
  name: "Vyomkesh Investment Plan",
  minAmount: 100000,
  specialMin: 300000,
  bands: [
    { fromMonth: 1, toMonth: 3, monthlyRate: 0.03 }, // 36% annual / 12 months = 3% monthly
    { fromMonth: 4, toMonth: 6, monthlyRate: 0.04 }, // 48% annual / 12 months = 4% monthly
    { fromMonth: 7, toMonth: 9, monthlyRate: 0.05 }, // 60% annual / 12 months = 5% monthly
    { fromMonth: 10, toMonth: 12, monthlyRate: 0.06 }, // 72% annual / 12 months = 6% monthly
    { fromMonth: 13, toMonth: 15, monthlyRate: 0.07 }, // 84% annual / 12 months = 7% monthly
  ],
  specialRate: 0.1,
  adminCharge: 0.04,
  booster: 0.1,
  active: true,
  version: 1,
};

export const getActivePlan: RequestHandler = async (_req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({
        ...defaultPlan,
        _id: "demo",
        effectiveFrom: new Date().toISOString(),
      });
    }
    // Only find an explicitly active plan rule
    let plan = await (PlanRule as Model<PlanRuleDoc>)
      .findOne({ active: true })
      .sort({
        effectiveFrom: -1,
      });

    if (!plan) {
      // If no active plan is found, return null or a default inactive plan
      return res.json({
        ...defaultPlan,
        _id: "no-active-plan",
        effectiveFrom: new Date().toISOString(),
      });
    }
    res.json(plan);
  } catch (err) {
    console.error("/plans/active error", err);
    res.status(500).json({ message: "Failed to load plan" });
  }
};

export const simulatePayout: RequestHandler = async (req, res) => {
  try {
    const { amount, month, boosterApplied } = req.body as {
      amount: number;
      month: number;
      boosterApplied?: boolean;
    };

    if (typeof amount !== "number" || typeof month !== "number") {
      return res
        .status(400)
        .json({ message: "amount and month are required numbers" });
    }

    let plan: any;
    if (!isDbConnected()) {
      plan = { ...defaultPlan } as any;
    } else {
      plan = await (PlanRule as Model<PlanRuleDoc>)
        .findOne({ active: true })
        .sort({
          effectiveFrom: -1,
        });
      // If no active plan rule is found, use the default inactive one for simulation
      if (!plan) plan = { ...defaultPlan } as any;
    }

    const principal = amount;
    let grossMonthly = 0;

    if (principal >= plan.specialMin) {
      grossMonthly = principal * plan.specialRate;
    } else {
      const band = plan.bands.find(
        (b) => month >= b.fromMonth && month <= b.toMonth,
      );
      const rate = band
        ? band.monthlyRate
        : plan.bands[plan.bands.length - 1].monthlyRate; // Fallback to last band if month is outside defined bands
      grossMonthly = principal * rate;
    }

    const adminCharge = +(grossMonthly * plan.adminCharge).toFixed(2);
    // Booster is now an additional income, so it's added, not subtracted.
    const boosterIncome = boosterApplied
      ? +(grossMonthly * plan.booster).toFixed(2)
      : 0;

    // Net payout = Gross Monthly - Admin Charge + Booster Income
    const netPayout = +(grossMonthly - adminCharge + boosterIncome).toFixed(2);

    res.json({
      principal,
      month,
      grossMonthly,
      adminCharge,
      booster: boosterIncome, // Renamed to boosterIncome for clarity
      netPayout,
      rates: {
        adminCharge: plan.adminCharge,
        booster: plan.booster,
      },
    });
  } catch (err) {
    console.error("/payouts/simulate error", err);
    res.status(500).json({ message: "Failed to simulate payout" });
  }
};
