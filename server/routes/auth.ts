import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User, UserDoc } from "../models/User";
import { isDbConnected } from "../db";
import { Model } from "mongoose";

const USER_JWT_COOKIE = "user_token"; // New cookie name for regular users
const ADMIN_JWT_COOKIE = "admin_token"; // New cookie name for admin users
const JWT_EXPIRES = 60 * 60 * 24 * 7; // 7 days

function signToken(u: UserDoc, isAdminToken: boolean = false) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET must be set");
  return jwt.sign({ sub: String(u._id), roles: u.roles, isAdmin: isAdminToken }, secret, {
    expiresIn: JWT_EXPIRES,
  });
}

function setCookie(res: any, token: string, cookieName: string) {
  res.cookie(cookieName, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: JWT_EXPIRES * 1000,
    path: "/",
  });
}

export const requireAuth: RequestHandler = (req, res, next) => {
  try {
    const userToken = (req as any).cookies?.[USER_JWT_COOKIE];
    const adminToken = (req as any).cookies?.[ADMIN_JWT_COOKIE];
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET must be set");

    let payload: any;
    if (adminToken) {
      payload = jwt.verify(adminToken, secret) as any;
      if (!payload.roles?.includes("admin")) { // Ensure admin token is actually for an admin
        return res.status(401).json({ message: "Unauthorized: Invalid admin token" });
      }
    } else if (userToken) {
      payload = jwt.verify(userToken, secret) as any;
    } else {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    (req as any).user = payload;
    next();
  } catch (e) {
    console.error("Auth error:", e);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  const u = (req as any).user;
  // Ensure the user is authenticated and has the admin role, and specifically came via an admin token
  if (!u || !u.roles?.includes("admin") || !(req as any).cookies?.[ADMIN_JWT_COOKIE])
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  next();
};

const signupSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    referralId: z.string().trim().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const signup: RequestHandler = async (req, res) => {
  if (!isDbConnected())
    return res.status(503).json({ message: "Database not configured" });
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });
  const { name, email, phone, password, referralId } = parsed.data;
  if (!email && !phone)
    return res.status(400).json({ message: "Email or phone required" });

  // Check for existing user by email or phone
  const query: any = {};
  if (email) query.email = email;
  if (phone) query.phone = phone;

  const existing = await (User as Model<UserDoc>).findOne({ $or: [{ email }, { phone }] });
  if (existing) {
    if (existing.email === email) {
      return res.status(409).json({ message: "User with this email already exists" });
    }
    if (existing.phone === phone) {
      return res.status(409).json({ message: "User with this phone number already exists" });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  // Create user with initial referral data
  const user = new (User as Model<UserDoc>)({
    name,
    email,
    phone,
    passwordHash,
    referral: {
      referredBy: referralId || undefined,
      code: "", // Temporary empty code, will be generated below
    },
    roles: ["user"],
  });

  // Generate referral code based on user ID if not already set
  if (!user.referral?.code) {
    user.referral.code = (user._id as any).toString().slice(-8);
  }
  
  await user.save(); // Save the user with the generated referral code

  const token = signToken(user as any, false);
  setCookie(res, token, USER_JWT_COOKIE); // Set user cookie
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    referral: {
      code: user.referral?.code,
      referredBy: user.referral?.referredBy || null,
    },
  });
};

const loginSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
    password: z.string().min(6),
  })
  .refine((d) => Boolean(d.email || d.phone), {
    message: "Email or phone required",
    path: ["email"],
  });

export const login: RequestHandler = async (req, res) => {
  if (!isDbConnected())
    return res.status(503).json({ message: "Database not configured" });
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });
  const { email, phone, password } = parsed.data;
  const user = await (User as Model<UserDoc>).findOne({ $or: [{ email }, { phone }] });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash || "");
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const token = signToken(user as any, false);
  setCookie(res, token, USER_JWT_COOKIE); // Set user cookie
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    referral: {
      code: user.referral?.code,
      referredBy: user.referral?.referredBy || null,
      earnings: user.referral?.earnings || 0,
      tier: user.referral?.tier || 1,
      banned: user.referral?.banned || false,
    },
  });
};

export const me: RequestHandler = async (req, res) => {
  try {
    if (!isDbConnected()) return res.json(null);
    const adminToken = (req as any).cookies?.[ADMIN_JWT_COOKIE];
    const userToken = (req as any).cookies?.[USER_JWT_COOKIE];
    const secret = process.env.JWT_SECRET!;

    let payload: any;
    let isFromAdminSession = false;

    if (adminToken) {
      try {
        payload = jwt.verify(adminToken, secret) as any;
        if (payload.roles?.includes("admin")) {
          isFromAdminSession = true;
        } else {
          payload = null; // Invalid admin token, treat as no token
        }
      } catch {
        payload = null;
      }
    }

    if (!payload && userToken) { // If not an admin session, check for user session
      try {
        payload = jwt.verify(userToken, secret) as any;
      } catch {
        payload = null;
      }
    }

    if (!payload) return res.json(null);

    const user = await (User as Model<UserDoc>).findById(payload.sub).lean();
    if (!user) return res.json(null);

    // If it's an admin session, ensure the user has admin role
    if (isFromAdminSession && !user.roles?.includes("admin")) {
      return res.json(null); // Admin token but user is not admin
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      referral: {
        code: user.referral?.code,
        referredBy: user.referral?.referredBy || null,
        earnings: user.referral?.earnings || 0,
        tier: user.referral?.tier || 1,
        banned: user.referral?.banned || false,
      },
      kyc: {
        status: (user as any).kyc?.status || "not_submitted",
        remarks: (user as any).kyc?.remarks || "",
      },
    });
  } catch (e) {
    console.error("Error in /api/me:", e);
    res.json(null);
  }
};

export const logout: RequestHandler = async (_req, res) => {
  res.clearCookie(USER_JWT_COOKIE, { path: "/" });
  res.clearCookie(ADMIN_JWT_COOKIE, { path: "/" });
  res.json({ ok: true });
};

const resetRequestSchema = z
  .object({ email: z.string().email().optional(), phone: z.string().min(8).optional() })
  .refine((d) => Boolean(d.email || d.phone), { message: "Email or phone required" });

export const requestPasswordReset: RequestHandler = async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ message: "Database not configured" });
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });
  const { email, phone } = parsed.data;
  const user = await (User as Model<UserDoc>).findOne({ $or: [{ email }, { phone }] });
  if (!user) return res.json({ ok: true });
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  (user as any).passwordReset = { token, expiresAt } as any;
  await user.save();
  res.json({ ok: true, token });
};

const resetSchema = z.object({ token: z.string().min(8), password: z.string().min(6) });

export const resetPassword: RequestHandler = async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ message: "Database not configured" });
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });
  const { token, password } = parsed.data;
  const user = await (User as Model<UserDoc>).findOne({ "passwordReset.token": token });
  if (!user || !user.passwordReset || !user.passwordReset.expiresAt || user.passwordReset.expiresAt < new Date())
    return res.status(400).json({ message: "Invalid or expired token" });
  user.passwordHash = await bcrypt.hash(password, 10);
  (user as any).passwordReset = undefined as any;
  await user.save();
  res.json({ ok: true });
};

const bootstrapSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().min(8).optional(),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
    token: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => Boolean(d.email || d.phone), {
    message: "Email or phone required",
  });

export const bootstrapAdmin: RequestHandler = async (req, res) => {
  if (!isDbConnected())
    return res.status(503).json({ message: "Database not configured" });
  const bootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
  if (!bootstrapToken)
    return res
      .status(503)
      .json({ message: "ADMIN_BOOTSTRAP_TOKEN not set on server" });
  const parsed = bootstrapSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });
  const { name, email, phone, password, token } = parsed.data;
  if (token !== bootstrapToken)
    return res.status(401).json({ message: "Invalid token" });
  const exists = await (User as Model<UserDoc>).findOne({ roles: { $in: ["admin"] } });
  if (exists) return res.status(403).json({ message: "Already initialized" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await (User as Model<UserDoc>).create({
    name,
    email,
    phone,
    passwordHash,
    roles: ["user", "admin"],
  });
  const jwtToken = signToken(user as any, true);
  setCookie(res, jwtToken, ADMIN_JWT_COOKIE); // Set admin cookie
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
  });
};

export const adminLogin: RequestHandler = async (req, res) => {
  if (!isDbConnected())
    return res.status(503).json({ message: "Database not configured" });
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid body" });
  const { email, phone, password } = parsed.data;
  const user = await (User as Model<UserDoc>).findOne({ $or: [{ email }, { phone }] });
  if (!user || !user.roles?.includes("admin"))
    return res.status(401).json({ message: "Unauthorized" });
  const ok = await bcrypt.compare(password, user.passwordHash || "");
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  const token = signToken(user as any, true);
  setCookie(res, token, ADMIN_JWT_COOKIE); // Set admin cookie
  res.json({ ok: true });
};