import { RequestHandler, Request, Response } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken"; // Import jwt for manual token verification
import { User, UserDoc } from "../models/User";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";

const listAdminReferralsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "blocked"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Temporarily consolidate middleware for debugging
export const listAdminReferrals: RequestHandler = async (req: Request, res: Response) => {
  console.log("[Admin Referrals Handler] Request received for /api/admin/referrals.");

  // Manual auth check for debugging
  try {
    const adminToken = (req as any).cookies?.admin_token;
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[Admin Referrals Handler] JWT_SECRET is not set.");
      throw new Error("JWT_SECRET must be set");
    }

    if (!adminToken) {
      console.log("[Admin Referrals Handler] No admin token found.");
      return res.status(401).json({ message: "Unauthorized: No admin token provided" });
    }

    const payload = jwt.verify(adminToken, secret) as any;
    if (!payload.roles?.includes("admin")) {
      console.log("[Admin Referrals Handler] Invalid admin token or not admin role.");
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    (req as any).user = payload; // Attach user payload
    console.log(`[Admin Referrals Handler] User ${payload.sub} authenticated as admin.`);
  } catch (e: any) {
    console.error("[Admin Referrals Handler] Auth error:", e.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }

  // Original handler logic
  if (!isDbConnected()) {
    console.log("[Admin Referrals Handler] DB not connected, returning empty array.");
    return res.json({ items: [], total: 0, page: 1, limit: 20 });
  }

  const parsed = listAdminReferralsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    console.log("[Admin Referrals Handler] Invalid query", parsed.error);
    return res.status(400).json({ message: "Invalid query" });
  }

  const { search, status, page, limit } = parsed.data;

  const filter: any = { "referral.referredBy": { $exists: true, $ne: null } };
  const userFilter: any = {};

  if (search) {
    userFilter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { "referral.code": { $regex: search, $options: "i" } },
    ];
  }
  if (status) userFilter.status = status;

  let referredUserIds: mongoose.Types.ObjectId[] = [];
  if (Object.keys(userFilter).length > 0) {
    const matchingUsers = await (User as Model<UserDoc>).find(userFilter).select('_id').lean();
    referredUserIds = matchingUsers.map(u => u._id);
    filter._id = { $in: referredUserIds };
  }

  const skip = (page - 1) * limit;

  const [itemsRaw, totalCount] = await Promise.all([
    (User as Model<UserDoc>).find(filter)
      .select("name email phone status createdAt referral.code referral.referredBy referral.earnings")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    (User as Model<UserDoc>).countDocuments(filter),
  ]);

  const items = itemsRaw.map((u: any) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    phone: u.phone,
    status: u.status,
    createdAt: u.createdAt,
    referralCode: u.referral?.code,
    referredBy: u.referral?.referredBy,
    referralEarnings: u.referral?.earnings || 0,
  }));

  console.log(`[Admin Referrals Handler] Found ${items.length} items, total ${totalCount}. Sending JSON response.`);
  res.json({ items, total: totalCount, page, limit });
};