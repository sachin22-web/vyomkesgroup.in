import { RequestHandler } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "./auth";
import { Settings, SettingsDoc } from "../models/Settings";
import { isDbConnected } from "../db";
import { Model } from "mongoose";

const paymentSettingsSchema = z.object({
  bankAccountName: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  bankIfscCode: z.string().trim().optional(),
  upiId: z.string().trim().optional(),
  qrCodeUrl: z.string().url().optional().or(z.literal("")), // Allow empty string for clearing
});

export const updatePaymentSettings: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "Database not configured" });

    const parsed = paymentSettingsSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body" });

    const updates = parsed.data;

    try {
      let settings = await (Settings as Model<SettingsDoc>).findOne({ name: "payment" });

      if (!settings) {
        settings = await (Settings as Model<SettingsDoc>).create({ name: "payment", payment: updates });
      } else {
        // Update only the fields that are present in the request body
        for (const key in updates) {
          if (Object.prototype.hasOwnProperty.call(updates, key)) {
            (settings.payment as any)[key] = (updates as any)[key];
          }
        }
        await settings.save();
      }

      res.json(settings.payment);
    } catch (e: any) {
      console.error("Error updating payment settings:", e);
      res.status(500).json({ message: "Failed to update payment settings" });
    }
  },
];

export const getPaymentSettings: RequestHandler = async (_req, res) => {
  if (!isDbConnected()) {
    // Return default/empty settings in demo mode
    return res.json({
      bankAccountName: "Vyomkesh Industries",
      bankAccountNumber: "XXXXXXXXXX",
      bankIfscCode: "YYYYYYYY",
      upiId: "vyomkesh@bank",
      qrCodeUrl: "",
    });
  }

  try {
    const settings = await (Settings as Model<SettingsDoc>).findOne({ name: "payment" }).lean();
    res.json(settings?.payment || {});
  } catch (e: any) {
    console.error("Error fetching payment settings:", e);
    res.status(500).json({ message: "Failed to fetch payment settings" });
  }
};