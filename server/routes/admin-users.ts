import { RequestHandler, Request } from "express";
import { z } from "zod";
import { requireAdmin, requireAuth } from "./auth";
import { User, UserDoc } from "../models/User";
import mongoose, { Model } from "mongoose";
import { isDbConnected } from "../db";

const listQuerySchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(["active", "blocked"]).optional(),
  kycStatus: z
    .enum(["not_submitted", "pending", "approved", "rejected"])
    .optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  from: z.string().optional(),
  to: z.string().optional(),
});

function maskDoc(num?: string | null) {
  if (!num) return "";
  const s = String(num);
  const last4 = s.slice(-4);
  return `${"*".repeat(Math.max(0, s.length - 4))}${last4}`;
}

// Helper function to build filter object from query params
function buildUserFilter(query: z.infer<typeof listQuerySchema>) {
  const filter: any = {};
  if (query.search) {
    const s = String(query.search).trim();
    filter.$or = [
      { name: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
      { phone: { $regex: s, $options: "i" } },
    ];
  }
  if (query.role === "admin") filter.roles = { $in: ["admin"] };
  if (query.role === "user") filter.roles = { $nin: ["admin"] };
  if (query.status) filter.status = query.status;
  if (query.kycStatus) filter["kyc.status"] = query.kycStatus;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }
  return filter;
}

export const listUsers = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected()) return res.json({ items: [], total: 0, stats: {} });
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid query" });
    const { page, limit } = parsed.data;

    const filter = buildUserFilter(parsed.data);

    const skip = (page - 1) * limit;
    const [itemsRaw, total, stats] = await Promise.all([
      (User as Model<UserDoc>).find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      (User as Model<UserDoc>).countDocuments(filter),
      computeStats(),
    ]);

    const items = itemsRaw.map((u: any) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.roles?.includes("admin") ? "admin" : "user",
      status: u.status,
      kycStatus: u.kyc?.status || "not_submitted",
      kycDocMasked: maskDoc(u.kyc?.docNumber),
      createdAt: u.createdAt,
    }));

    res.json({ items, total, page, limit, stats });
  },
];

async function computeStats() {
  const total = await (User as Model<UserDoc>).countDocuments({});
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tmr = new Date(today);
  tmr.setDate(today.getDate() + 1);
  const todaySignups = await (User as Model<UserDoc>).countDocuments({
    createdAt: { $gte: today, $lt: tmr },
  });
  const active = await (User as Model<UserDoc>).countDocuments({ status: "active" });
  const blocked = await (User as Model<UserDoc>).countDocuments({ status: "blocked" });
  const kycPending = await (User as Model<UserDoc>).countDocuments({ "kyc.status": "pending" });
  const kycApproved = await (User as Model<UserDoc>).countDocuments({ "kyc.status": "approved" });
  const kycRejected = await (User as Model<UserDoc>).countDocuments({ "kyc.status": "rejected" });
  return {
    total,
    todaySignups,
    active,
    blocked,
    kycPending,
    kycApproved,
    kycRejected,
  };
}

export const getUser = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "DB not configured" });
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });
    const u = await (User as Model<UserDoc>).findById(id).lean();
    if (!u) return res.status(404).json({ message: "Not found" });
    res.json({
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone,
      roles: u.roles,
      status: u.status,
      createdAt: u.createdAt,
      kyc: u.kyc || { status: "not_submitted" },
    });
  },
];

export const toggleBlock = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "DB not configured" });
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });
    const u = await (User as Model<UserDoc>).findById(id);
    if (!u) return res.status(404).json({ message: "Not found" });
    u.status = u.status === "active" ? "blocked" : "active";
    await u.save();
    res.json({ ok: true, status: u.status });
  },
];

export const exportUsersCsv = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "DB not configured" });
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid query" });
    
    const filter = buildUserFilter(parsed.data);

    const rows = await (User as Model<UserDoc>).find(filter).sort({ createdAt: -1 }).lean();
    const header = [
      "Name",
      "Email",
      "Phone",
      "Role",
      "Status",
      "KYC Status",
      "KYC Doc (masked)",
      "Created",
    ];
    const lines = [header.join(",")];
    for (const u of rows) {
      lines.push(
        [
          quote(u.name),
          quote(u.email || ""),
          quote(u.phone || ""),
          quote(u.roles?.includes("admin") ? "admin" : "user"),
          quote(u.status),
          quote(u.kyc?.status || "not_submitted"),
          quote(maskDoc(u.kyc?.docNumber)),
          quote(new Date(u.createdAt).toISOString()),
        ].join(","),
      );
    }
    const csv = lines.join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=users.csv");
    res.status(200).send(csv);
  },
];

function quote(v: any) {
  const s = (v ?? "").toString();
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export const promoteUserToAdmin = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "DB not configured" });
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });
    const u = await (User as Model<UserDoc>).findById(id);
    if (!u) return res.status(404).json({ message: "Not found" });
    u.roles = Array.from(new Set([...(u.roles || []), "admin"]));
    await u.save();
    res.json({ ok: true, roles: u.roles });
  },
];

const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
    status: z.enum(["active", "blocked"]).optional(),
    makeAdmin: z.boolean().optional(),
    removeAdmin: z.boolean().optional(),
  })
  .refine((d) => Boolean(d.name || d.email || d.phone || d.status || d.makeAdmin || d.removeAdmin), {
    message: "No changes provided",
  });

export const updateUser = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "DB not configured" });
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "Invalid id" });
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid body" });
    const { name, email, phone, status, makeAdmin, removeAdmin } = parsed.data;

    if (email) {
      const exists = await (User as Model<UserDoc>).findOne({ email, _id: { $ne: id } });
      if (exists) return res.status(409).json({ message: "Email already in use" });
    }
    if (phone) {
      const exists = await (User as Model<UserDoc>).findOne({ phone, _id: { $ne: id } });
      if (exists) return res.status(409).json({ message: "Phone already in use" });
    }

    const u = await (User as Model<UserDoc>).findById(id);
    if (!u) return res.status(404).json({ message: "Not found" });
    if (typeof name === "string") u.name = name;
    if (typeof email === "string") u.email = email as any;
    if (typeof phone === "string") u.phone = phone as any;
    if (status) u.status = status as any;

    if (makeAdmin) u.roles = Array.from(new Set([...(u.roles || []), "admin"]));
    if (removeAdmin) u.roles = (u.roles || []).filter((r) => r !== "admin");

    await u.save();
    res.json({ ok: true });
  },
];

const deleteBatchSchema = z.object({
  ids: z.array(z.string().refine((val) => mongoose.isValidObjectId(val), { message: "Invalid ID" })).min(1),
});

export const deleteUsersBatch: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "DB not configured" });

    const parsed = deleteBatchSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid body", errors: parsed.error.errors });

    const { ids } = parsed.data;

    try {
      const result = await (User as Model<UserDoc>).deleteMany({ _id: { $in: ids } });
      res.json({ ok: true, deletedCount: result.deletedCount });
    } catch (e: any) {
      console.error("Error deleting users in batch:", e);
      res.status(500).json({ message: "Failed to delete users" });
    }
  },
];

export const deleteUsersFiltered: RequestHandler[] = [
  requireAuth,
  requireAdmin,
  async (req, res) => {
    if (!isDbConnected())
      return res.status(503).json({ message: "DB not configured" });

    const parsed = listQuerySchema.safeParse(req.query); // Reuse listQuerySchema for filters
    if (!parsed.success)
      return res.status(400).json({ message: "Invalid query", errors: parsed.error.errors });

    const filter = buildUserFilter(parsed.data);

    try {
      const result = await (User as Model<UserDoc>).deleteMany(filter);
      res.json({ ok: true, deletedCount: result.deletedCount });
    } catch (e: any) {
      console.error("Error deleting filtered users:", e);
      res.status(500).json({ message: "Failed to delete filtered users" });
    }
  },
];