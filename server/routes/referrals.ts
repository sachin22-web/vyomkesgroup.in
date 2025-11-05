import { RequestHandler } from "express";
import { requireAuth } from "./auth";
import { User, UserDoc } from "../models/User";
import { Model } from "mongoose";
import { isDbConnected } from "../db";

export const listReferredUsers: RequestHandler[] = [
  requireAuth,
  async (req, res) => {
    console.log("[Referrals API] listReferredUsers handler invoked."); // Added log
    if (!isDbConnected()) {
      console.log("[Referrals API] DB not connected, returning empty array."); // Added log
      return res.json([]); // Return empty array in demo mode
    }

    const userId = (req as any).user.sub;
    console.log(`[Referrals API] Fetching referrals for userId: ${userId}`); // Added log
    const currentUser = await (User as Model<UserDoc>).findById(userId).lean();

    if (!currentUser || !currentUser.referral?.code) {
      console.log(`[Referrals API] User ${userId} not found or no referral code.`); // Added log
      return res.status(404).json({ message: "Referral code not found for current user" });
    }

    const referredUsers = await (User as Model<UserDoc>).find({ "referral.referredBy": currentUser.referral.code })
      .select("name email createdAt status") // Select only necessary fields
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[Referrals API] Found ${referredUsers.length} referred users.`); // Added log
    res.json(referredUsers);
  },
];