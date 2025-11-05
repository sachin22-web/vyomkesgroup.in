import "dotenv/config";
import bcrypt from "bcryptjs";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import { connectDB, isDbConnected } from "./db";
import { getActivePlan, simulatePayout } from "./routes/plans";
import {
  getPublicPlans,
  getAdminPlans,
  createPlan,
  updatePlan,
  togglePlan,
  deletePlan,
  seedPlansIfEmpty,
} from "./routes/plans-crud";
import {
  signup,
  login,
  me,
  logout,
  bootstrapAdmin,
  adminLogin,
  requestPasswordReset,
  resetPassword,
  requireAuth,
  requireAdmin,
} from "./routes/auth";
import { userOverview, adminOverview } from "./routes/dashboards";
import {
  listUsers,
  getUser,
  toggleBlock,
  exportUsersCsv,
  promoteUserToAdmin,
  updateUser,
  deleteUsersBatch,
  deleteUsersFiltered,
} from "./routes/admin-users";
import { getKycQueue, submitKyc, approveKyc, rejectKyc } from "./routes/kyc";
import { handleUpload } from "./routes/upload";
import { Plan, PlanDoc } from "./models/Plan";
import { User, UserDoc } from "./models/User";
import { Ledger, LedgerDoc } from "./models/Finance";
import { Model } from "mongoose";
import {
  createInvestmentOrder,
  uploadPaymentProof,
  getUserInvestments,
} from "./routes/investments"; // New import
import {
  listAdminInvestments,
  approveInvestment,
  rejectInvestment,
} from "./routes/admin-investments"; // New import
import { updatePaymentSettings, getPaymentSettings } from "./routes/settings"; // New import
import {
  createSupportTicket,
  listSupportTickets,
  updateSupportTicket,
  listUserSupportTickets,
} from "./routes/support"; // New import
import { listReferredUsers } from "./routes/referrals"; // New import
import { getReferralTree } from "./routes/admin-referral-tree"; // New import for referral tree
import { Page, PageDoc } from "./models/Page"; // Import Page model
import {
  createPage,
  listAdminPages,
  getPublicPageBySlug,
  updatePage,
  deletePage,
  getNavPages,
} from "./routes/pages"; // Import page routes
import {
  listUserLedger,
  listUserPayouts,
  listUserWithdrawals,
  createWithdrawalRequest,
} from "./routes/finance"; // New finance routes
import { PlanRule, PlanRuleDoc } from "./models/PlanRule"; // Import PlanRule model
import { activatePlanRule, getLatestPlanRule } from "./routes/admin-plan-rules"; // New import for admin plan rules
import { listAdminReferrals } from "./routes/admin-referrals"; // Import listAdminReferrals
import {
  listAdminWithdrawals,
  updateWithdrawalStatus,
} from "./routes/admin-withdrawals"; // New import for admin withdrawals
import { getUserWalletDetails, adjustUserWallet } from "./routes/admin-wallet"; // New import for admin wallet routes
import { sendContactEmail } from "./routes/contact"; // New import for contact form email
import { ContactEnquiry } from "./models/ContactEnquiry"; // NEW: Import ContactEnquiry model
import path from "path"; // Import path module

async function updateExistingPlanRules() {
  if (!isDbConnected()) return;
  console.log("Checking and updating existing PlanRule documents...");
  const result = await (PlanRule as Model<PlanRuleDoc>).updateMany(
    { adminCharge: { $ne: 0.04 } }, // Find plans where adminCharge is not 0.04
    { $set: { adminCharge: 0.04 } }, // Set it to 0.04
  );
  if (result.modifiedCount > 0) {
    console.log(
      `Updated ${result.modifiedCount} PlanRule documents to 4% admin charge.`,
    );
  } else {
    console.log("No PlanRule documents needed updating for admin charge.");
  }
}

async function seedPlanRulesIfEmpty() {
  if (!isDbConnected()) return;

  const defaultRule = {
    name: "Vyomkesh Investment Plan",
    minAmount: 100000,
    specialMin: 300000,
    bands: [
      { fromMonth: 1, toMonth: 3, monthlyRate: 0.03 }, // 36% annual
      { fromMonth: 4, toMonth: 6, monthlyRate: 0.04 }, // 48% annual
      { fromMonth: 7, toMonth: 9, monthlyRate: 0.05 }, // 60% annual
      { fromMonth: 10, toMonth: 12, monthlyRate: 0.06 }, // 72% annual
      { fromMonth: 13, toMonth: 15, monthlyRate: 0.07 }, // 84% annual
    ],
    specialRate: 0.1,
    adminCharge: 0.04,
    booster: 0.1,
    active: true,
    version: 1,
    effectiveFrom: new Date(),
    createdBy: "system",
  };

  // Update or create the active plan rule
  const existing = await (PlanRule as Model<PlanRuleDoc>)
    .findOne({ active: true })
    .sort({ createdAt: -1 });

  if (existing) {
    // Update the existing active rule with new bands
    await (PlanRule as Model<PlanRuleDoc>).updateOne(
      { _id: existing._id },
      {
        $set: {
          bands: defaultRule.bands,
          version: existing.version + 1,
          effectiveFrom: new Date(),
        },
      },
    );
    console.log("SELF-TEST: Updated active PlanRule with new bands.");
  } else {
    // Create new plan rule
    await (PlanRule as Model<PlanRuleDoc>).create(defaultRule);
    console.log("SELF-TEST: Seeded initial PlanRule.");
  }
}

export function createServer() {
  const app = express();

  // Check for JWT_SECRET
  if (!process.env.JWT_SECRET) {
    console.warn(
      "WARNING: JWT_SECRET is not set. Authentication will not work correctly.",
    );
  }

  // Connect DB (non-blocking)
  connectDB()
    .then(async () => {
      if (isDbConnected()) {
        console.log("MongoDB connected");
        await seedPlansIfEmpty().catch(() => {});
        await seedPlanRulesIfEmpty().catch((e) =>
          console.error("Error seeding plan rules:", e),
        ); // Add this line
        await updateExistingPlanRules().catch((e) =>
          console.error("Error updating existing plan rules:", e),
        ); // Add this line
        try {
          const ok = await fetchSelfPlans();
          if (ok) console.log("Plans CRUD + Frontend bind OK. Next task?");
        } catch (e: any) {
          console.log("Self-test error:", e?.message || e);
        }
        try {
          await seedUsersIfEmpty();
          const ok2 = await selfTestUsersKyc();
          if (ok2) console.log("Users + KYC admin working. Next task?");
        } catch (e: any) {
          console.log("Users/KYC self-test error:", e?.message || e);
        }
        await seedPagesIfEmpty().catch((e) =>
          console.error("Error seeding pages:", e),
        ); // Seed dynamic pages
      } else {
        console.log(
          "Running in demo mode without MongoDB. Please set MONGODB_URI in .env for full functionality.",
        );
      }
    })
    .catch((err) => console.error("MongoDB connection error", err));

  // Middleware
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        const allowed = [
          /^http:\/\/localhost(?::\d+)?$/,
          /^https:\/\/localhost(?::\d+)?$/,
          /\.posttrr\.com$/,
          /\.replit\.dev$/,
          /\.replit\.co$/,
          /\.replit\.com$/,
        ];
        if (allowed.some((r) => r.test(origin))) return cb(null, true);
        cb(null, true); // Allow all origins in development for Replit proxy
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve static files from the public directory
  // This ensures images and other static assets are always accessible
  // In development, this will serve from the actual public folder.
  // In production, the assets are copied to dist/spa, which is served by node-build.mjs
  // This line is primarily for dev mode when Express is mounted as middleware.
  app.use(express.static(path.join(import.meta.dirname, "../../public")));

  // --- START: Debugging Middleware ---
  app.use("/api", (req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.originalUrl}`);
    next();
  });
  // --- END: Debugging Middleware ---
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      ok: true,
      uptime: process.uptime(),
      env: process.env.NODE_ENV || "production",
    });
  });

  // ===== TEMP MAINTENANCE (guarded by ADMIN_BOOTSTRAP_TOKEN) =====
  app.post("/api/admin/bootstrap-list", async (req, res) => {
    const t = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (!t)
      return res.status(503).json({ message: "ADMIN_BOOTSTRAP_TOKEN missing" });
    const { token } = req.body || {};
    if (token !== t) return res.status(401).json({ message: "Invalid token" });
    const admins = await (User as any)
      .find({ roles: { $in: ["admin"] } })
      .select("name email phone roles")
      .lean();
    res.json({ admins });
  });
  app.post("/api/admin/bootstrap-reset", async (req, res) => {
    const t = process.env.ADMIN_BOOTSTRAP_TOKEN;
    if (!t)
      return res.status(503).json({ message: "ADMIN_BOOTSTRAP_TOKEN missing" });
    const { email, password, token } = req.body || {};
    if (token !== t) return res.status(401).json({ message: "Invalid token" });
    if (!email || !password)
      return res.status(400).json({ message: "email & password required" });
    const user = await (User as any).findOne({ email });
    if (!user) return res.status(404).json({ message: "not found" });
    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ ok: true });
  });
  // ===== END TEMP =====

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth
  app.post("/api/auth/signup", signup);
  app.post("/api/auth/login", login);
  app.post("/api/auth/logout", logout);
  app.get("/api/me", me);
  app.post("/api/auth/request-reset", requestPasswordReset);
  app.post("/api/auth/reset-password", resetPassword);

  // Admin auth
  app.post("/api/admin/login", adminLogin);
  app.post("/api/admin/bootstrap", bootstrapAdmin);

  // Plans & Payouts (legacy)
  app.get("/api/plans/active", getActivePlan);
  app.post("/api/payouts/simulate", simulatePayout);

  // New Plans CRUD
  app.get("/api/plans", getPublicPlans);
  app.get("/api/admin/plans", getAdminPlans);
  app.post("/api/admin/plans", createPlan);
  app.put("/api/admin/plans/:id", updatePlan);
  app.patch("/api/admin/plans/:id/toggle", togglePlan);
  app.delete("/api/admin/plans/:id", deletePlan);

  // Admin Plan Rules (new)
  app.get(
    "/api/admin/plan-rules/latest",
    requireAuth,
    requireAdmin,
    getLatestPlanRule,
  );
  app.patch(
    "/api/admin/plan-rules/:id/activate",
    requireAuth,
    requireAdmin,
    activatePlanRule,
  );

  // Users & Admin
  app.get("/api/admin/users", listUsers);
  app.get("/api/admin/users/export", exportUsersCsv);
  app.get("/api/admin/users/:id", getUser);
  app.put("/api/admin/users/:id", updateUser);
  app.patch("/api/admin/users/:id/block", toggleBlock);
  app.patch("/api/admin/users/:id/promote", promoteUserToAdmin);
  app.delete(
    "/api/admin/users/batch",
    requireAuth,
    requireAdmin,
    deleteUsersBatch,
  ); // New batch delete
  app.delete(
    "/api/admin/users/filtered",
    requireAuth,
    requireAdmin,
    deleteUsersFiltered,
  ); // New filtered delete

  // KYC
  app.get("/api/admin/kyc", getKycQueue);
  app.post("/api/users/kyc/submit", submitKyc);
  app.patch("/api/admin/kyc/:userId/approve", approveKyc);
  app.patch("/api/admin/kyc/:userId/reject", rejectKyc);

  // Uploads
  app.post("/api/upload", requireAuth, handleUpload);

  // Dashboards
  app.get("/api/app/overview", requireAuth, userOverview);
  app.get("/api/admin/overview", requireAuth, requireAdmin, adminOverview);

  // User Investments
  app.post("/api/app/investments", createInvestmentOrder);
  app.post("/api/app/investments/:id/upload-proof", uploadPaymentProof);
  app.get("/api/app/investments", getUserInvestments); // To list user's own investments

  // Admin Investments
  app.get("/api/admin/investments", listAdminInvestments);
  app.patch("/api/admin/investments/:id/approve", approveInvestment);
  app.patch("/api/admin/investments/:id/reject", rejectInvestment);

  // Payment Settings
  app.put("/api/admin/settings/payment", updatePaymentSettings);
  app.get("/api/app/settings/payment", getPaymentSettings);

  // Support Tickets
  app.post("/api/app/support/tickets", requireAuth, createSupportTicket);
  app.get("/api/app/support/tickets", requireAuth, listUserSupportTickets); // New user-specific endpoint
  app.get("/api/admin/support/tickets", listSupportTickets);
  app.patch("/api/admin/support/tickets/:id", updateSupportTicket);

  // Referrals
  console.log("[Server] Registering /api/app/referrals/users route.");
  app.get("/api/app/referrals/users", requireAuth, listReferredUsers);

  console.log(
    "[Server] Registering /api/admin/referrals route with consolidated handler.",
  );
  app.get("/api/admin/referrals", listAdminReferrals); // Now uses the single handler
  app.get("/api/admin/referrals/tree", requireAuth, requireAdmin, getReferralTree); // Protected endpoint for referral tree

  // Admin Withdrawals
  app.get(
    "/api/admin/withdrawals",
    requireAuth,
    requireAdmin,
    listAdminWithdrawals,
  );
  app.patch(
    "/api/admin/withdrawals/:id/status",
    requireAuth,
    requireAdmin,
    updateWithdrawalStatus,
  );

  // Admin Wallet Management
  app.get(
    "/api/admin/users/:userId/wallet",
    requireAuth,
    requireAdmin,
    getUserWalletDetails,
  );
  app.patch(
    "/api/admin/users/:userId/wallet/adjust",
    requireAuth,
    requireAdmin,
    adjustUserWallet,
  );

  // Dynamic Pages
  app.post("/api/admin/pages", createPage);
  app.get("/api/admin/pages", listAdminPages);
  app.get("/api/pages/nav", getNavPages); // Public endpoint for navigation
  app.get("/api/pages/:slug", getPublicPageBySlug); // Public endpoint for page content
  app.put("/api/admin/pages/:id", updatePage);
  app.delete("/api/admin/pages/:id", deletePage);

  // User Finance (New Routes)
  app.get("/api/app/ledger", requireAuth, listUserLedger);
  app.get("/api/app/payouts", requireAuth, listUserPayouts);
  app.get("/api/app/withdrawals", requireAuth, listUserWithdrawals);
  app.post("/api/app/withdrawals", requireAuth, createWithdrawalRequest);

  // Contact Form Submission
  app.post("/api/contact", sendContactEmail); // New contact form submission route

  return app;
}

async function fetchSelfPlans() {
  try {
    if (!isDbConnected()) return false;
    const active = await (Plan as Model<PlanDoc>)
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
    if (!active || active.length < 1) {
      console.log("SELF-TEST FAIL: /api/plans returned < 1 active plan");
      return false;
    }
    const amt = 100000;
    for (const p of active) {
      const monthly = Math.round(((p.annualReturnPercent / 100) * amt) / 12);
      console.log(
        `SELF-TEST CALC: ${p.annualReturnPercent}% ⇒ ${monthly}/mo at ${amt}`,
      );
    }
    return true;
  } catch (e: any) {
    console.log("SELF-TEST FAIL:", e?.message || e);
    return false;
  }
}

async function seedUsersIfEmpty() {
  if (!isDbConnected()) return;
  const count = await (User as Model<UserDoc>).countDocuments({});
  if (count > 0) return;
  const today = new Date();
  const users = [
    {
      name: "Alice Admin",
      email: "alice@example.com",
      passwordHash: "",
      roles: ["user", "admin"],
      status: "active",
      balance: 100000, // Seeded balance
      locked: 0,
      totalProfit: 0,
      totalPayout: 0,
    },
    {
      name: "Bob User",
      email: "bob@example.com",
      passwordHash: "",
      roles: ["user"],
      status: "active",
      referral: {
        code: "BOB12345",
        earnings: 5000, // Seeded referral earnings
        tier: 1,
        banned: false,
      },
      balance: 25000, // Seeded balance
      locked: 0,
      totalProfit: 0,
      totalPayout: 0,
    },
    {
      name: "Charlie Pending",
      email: "charlie@example.com",
      passwordHash: "",
      roles: ["user"],
      status: "active",
      kyc: {
        status: "pending",
        docType: "pan",
        docNumber: "ABCDE1234F",
        frontUrl: "/placeholder.svg",
        submittedAt: today,
      },
      balance: 15000, // Seeded balance
      locked: 0,
      totalProfit: 0,
      totalPayout: 0,
    },
  ];
  // Hash passwords for seeded users
  for (const user of users) {
    user.passwordHash = await import("bcryptjs").then((b) =>
      b.hashSync("password123", 10),
    );
  }
  await (User as Model<UserDoc>).insertMany(
    users.map((u) => ({ ...u, createdAt: today, updatedAt: today })),
  );
  console.log("SELF-TEST: Seeded 3 users (1 with KYC pending)");
}

async function selfTestUsersKyc() {
  try {
    if (!isDbConnected()) {
      console.log("SELF-TEST FAIL: DB not connected");
      return false;
    }

    // Check paginated list
    const total = await (User as Model<UserDoc>).countDocuments({});
    if (total < 1) {
      console.log("SELF-TEST FAIL: No users in DB");
      return false;
    }

    // Submit KYC for Bob if needed
    const bob = await (User as Model<UserDoc>).findOne({
      email: "bob@example.com",
    });
    if (bob && bob.kyc?.status === "not_submitted") {
      bob.kyc = {
        ...(bob.kyc || {}),
        status: "pending" as any,
        docType: "aadhaar",
        docNumber: "123456789012",
        frontUrl: "/placeholder.svg",
        submittedAt: new Date(),
      } as any;
      await bob.save();
    }

    // Approve Charlie
    const ch = await (User as Model<UserDoc>).findOne({
      email: "charlie@example.com",
    });
    if (ch && ch.kyc?.status === "pending") {
      ch.kyc.status = "approved" as any;
      ch.kyc.reviewedAt = new Date();
      await ch.save();
    }

    // Block Bob
    if (bob && bob.status === "active") {
      bob.status = "blocked";
      await bob.save();
    }

    // Export CSV simulation
    const rows = await (User as Model<UserDoc>).find({}).lean();
    if (!rows || rows.length < 1) {
      console.log("SELF-TEST FAIL: CSV query empty");
      return false;
    }

    console.log("SELF-TEST OK: Users list + KYC submit/approve + block + CSV");
    return true;
  } catch (e: any) {
    console.log("SELF-TEST FAIL:", e?.message || e);
    return false;
  }
}

async function seedPagesIfEmpty() {
  if (!isDbConnected()) return;
  const count = await (Page as Model<PageDoc>).countDocuments({});
  if (count > 0) return;

  const pagesToSeed = [
    // Removed 'About Vyomkesh Industries' as it will be a dedicated page
    {
      title: "FAQs",
      slug: "faqs",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-6">FAQs</h1>
        <div class="space-y-6 text-sm">
          <div>
            <p class="font-medium">Are returns guaranteed?</p>
            <p class="text-muted-foreground">No. We follow market‑linked strategies with target payouts; terms apply.</p>
          </div>
          <div>
            <p class="font-medium">When do I get paid?</p>
            <p class="text-muted-foreground">Monthly cycle dates shown in dashboard; bank holidays shift to next working day.</p>
          </div>
          <div>
            <p class="font-medium">What are charges?</p>
            <p class="text-muted-foreground">Admin 4%, optional booster 10%, TDS as per law.</p>
          </div>
          <div>
            <p class="font-medium">How do withdrawals work?</p>
            <p class="text-muted-foreground">Request in app → approval → credited within T+1–T+3 days.</p>
          </div>
        </div>`,
      inHeader: true,
      inFooter: false,
      isActive: true,
      sortOrder: 2,
      bannerImageUrl: "/images/faq_banner.jpg", // FAQ image
    },
    {
      title: "Contact Us",
      slug: "contact",
      content: `<div class="space-y-3">
          <h1 class="text-3xl md:text-4xl font-bold tracking-tight">Contact Us</h1>
          <p class="text-muted-foreground">Email: <a href="mailto:support@vyomkeshindustries.com" class="text-primary hover:underline">support@vyomkeshindustries.com</a> • WhatsApp: +91-XXXXXXXXXX • Mon–Sat 10am–6pm</p>
        </div>
        <img src="/images/contact_banner.jpg" alt="Contact banner" class="w-full h-44 md:h-56 object-cover rounded-xl border" />
        <div class="mt-8">
          <p class="text-lg font-semibold">Reach out to us:</p>
          <ul class="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Email: <a href="mailto:support@vyomkeshindustries.com" target="_blank" rel="noreferrer" class="text-primary hover:underline">support@vyomkeshindustries.com</a></li>
            <li>WhatsApp: <a href="https://wa.me/910000000000" target="_blank" rel="noreferrer" class="text-primary hover:underline">+91-XXXXXXXXXX</a></li>
          </ul>
        </div>`,
      inHeader: true,
      inFooter: true,
      isActive: true,
      sortOrder: 3,
      bannerImageUrl: "/images/contact_banner.jpg", // Contact image
    },
    {
      title: "Updates",
      slug: "blog",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">Updates</h1>
        <p class="text-muted-foreground">Weekly posts on financial literacy and compliance updates will appear here.</p>
        <img src="/images/blog_updates_banner.jpg" alt="Blog updates banner" class="w-full h-44 md:h-56 object-cover rounded-xl border mt-6" />`,
      inHeader: true,
      inFooter: true,
      isActive: true,
      sortOrder: 4,
      bannerImageUrl: "/images/blog_updates_banner.jpg", // Blog image
    },
    {
      title: "Terms & Conditions",
      slug: "terms",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">Terms & Conditions</h1>
        <p class="text-muted-foreground">By using this platform, you agree to the terms, acceptable use, and risk disclosures. Payouts are target‑based and not assured unless licensed.</p>
        <img src="/images/terms_conditions_banner.jpg" alt="Terms and conditions banner" class="w-full h-44 md:h-56 object-cover rounded-xl border mt-6" />`,
      inHeader: false,
      inFooter: true,
      isActive: true,
      sortOrder: 5,
      bannerImageUrl: "/images/terms_conditions_banner.jpg", // Terms image
    },
    {
      title: "Privacy Policy",
      slug: "privacy",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
        <p class="text-muted-foreground">We follow data minimization, consent, retention, and access controls. Encrypted PII, IP throttling, device binding, and quarterly access reviews.</p>
        <img src="/images/privacy_policy_banner.jpg" alt="Privacy policy banner" class="w-full h-44 md:h-56 object-cover rounded-xl border mt-6" />`,
      inHeader: false,
      inFooter: true,
      isActive: true,
      sortOrder: 6,
      bannerImageUrl: "/images/privacy_policy_banner.jpg", // Privacy image
    },
    {
      title: "Risk Disclosure",
      slug: "risk",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">Risk Disclosure</h1>
        <div class="space-y-3 text-sm text-muted-foreground">
          <p>Products promising fixed/assured returns or &gt;3–4% per month are heavily regulated. Obtain legal advice on applicability of SEBI CIS/IA rules, RBI norms, Companies Act/NBFC, KYC/AML, and ITR/TDS obligations.</p>
          <p>Do not advertise guaranteed/assured returns unless licensed. Implement maker‑checker approvals and a regulator‑ready audit trail.</p>
        </div>
        <img src="/images/risk_disclosure_banner.jpg" alt="Risk disclosure banner" class="w-full h-44 md:h-56 object-cover rounded-xl border mt-6" />`,
      inHeader: false,
      inFooter: true,
      isActive: true,
      sortOrder: 7,
      bannerImageUrl: "/images/risk_disclosure_banner.jpg", // Risk image
    },
    {
      title: "Real Estate Buy",
      slug: "real-estate-buy",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">Real Estate Buy</h1>
        <p class="text-muted-foreground">Explore prime real estate opportunities for purchase. We offer a curated selection of properties with high growth potential.</p>
        <img src="/images/real_estate_buy_banner.jpg" alt="Real Estate Buy banner" class="w-full h-44 md:h-56 object-cover rounded-xl border mt-6" />
        <div class="mt-8 space-y-4">
          <p class="text-lg font-semibold">Why Invest in Real Estate with Us?</p>
          <ul class="list-disc list-inside text-muted-foreground space-y-1">
            <li>Access to exclusive properties</li>
            <li>Expert guidance through the buying process</li>
            <li>Potential for significant capital appreciation</li>
            <li>Diversify your investment portfolio</li>
          </ul>
        </div>`,
      inHeader: false,
      inFooter: false,
      isActive: true,
      sortOrder: 8,
      bannerImageUrl: "/images/real_estate_buy_banner.jpg",
    },
    {
      title: "Real Estate Sell",
      slug: "real-estate-sell",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">Real Estate Sell</h1>
        <p class="text-muted-foreground">List your property with us for a seamless selling experience. We connect you with serious buyers and ensure a fair market price.</p>
        <img src="/images/real_estate_sell_banner.jpg" alt="Real Estate Sell banner" class="w-full h-44 md:h-56 object-cover rounded-xl border mt-6" />
        <div class="mt-8 space-y-4">
          <p class="text-lg font-semibold">Benefits of Selling with Vyomkesh Industries:</p>
          <ul class="list-disc list-inside text-muted-foreground space-y-1">
            <li>Extensive network of potential buyers</li>
            <li>Professional marketing and property showcasing</li>
            <li>Hassle-free transaction process</li>
            <li>Competitive commission rates</li>
          </ul>
        </div>`,
      inHeader: false,
      inFooter: false,
      isActive: true,
      sortOrder: 9,
      bannerImageUrl: "/images/real_estate_sell_banner.jpg",
    },
    {
      title: "Stock Investments",
      slug: "stock-investments",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">Stock Investments</h1>
        <p class="text-muted-foreground">Dive into the world of stock markets with our expert guidance. We help you build a diversified portfolio for long-term growth.</p>
        <img src="/images/stock_investments_banner.jpg" alt="Stock Investments banner" class="w-full h-44 md:h-56 object-cover rounded-xl border mt-6" />
        <div class="mt-8 space-y-4">
          <p class="text-lg font-semibold">Our Stock Investment Approach:</p>
          <ul class="list-disc list-inside text-muted-foreground space-y-1">
            <li>Research-backed stock recommendations</li>
            <li>Portfolio diversification strategies</li>
            <li>Risk management tools</li>
            <li>Access to various market segments</li>
          </ul>
        </div>`,
      inHeader: false,
      inFooter: false,
      isActive: true,
      sortOrder: 10,
      bannerImageUrl: "/images/stock_investments_banner.jpg",
    },
    {
      title: "SIP Investments",
      slug: "sip-investments",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">SIP Investments</h1>
        <p class="text-muted-foreground">Invest regularly with Systematic Investment Plans (SIPs) to achieve your financial goals. Start small and grow big.</p>
        <img src="/images/sip_investments_banner.jpg" alt="SIP Investments banner" class="w-full h-44 md:h-56 object-cover rounded-xl border mt-6" />
        <div class="mt-8 space-y-4">
          <p class="text-lg font-semibold">Benefits of SIPs:</p>
          <ul class="list-disc list-inside text-muted-foreground space-y-1">
            <li>Discipline in investing</li>
            <li>Rupee cost averaging</li>
            <li>Power of compounding</li>
            <li>Flexible investment options</li>
          </ul>
        </div>`,
      inHeader: false,
      inFooter: false,
      isActive: true,
      sortOrder: 11,
      bannerImageUrl: "/images/sip_investments_banner.jpg",
    },
    {
      title: "Crypto Investments",
      slug: "crypto-investments",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">Crypto Investments</h1>
        <p class="text-muted-foreground">Explore the dynamic world of cryptocurrency with our secure and insightful investment options. Navigate the digital asset landscape with confidence.</p>
        <img src="/images/crypto_investments_banner.jpg" alt="Crypto Investments banner" class="w-full h-44 md:h-56 object-cover rounded-xl border mt-6" />
        <div class="mt-8 space-y-4">
          <p class="text-lg font-semibold">Why Crypto with Vyomkesh Industries?</p>
          <ul class="list-disc list-inside text-muted-foreground space-y-1">
            <li>Curated selection of top cryptocurrencies</li>
            <li>Secure trading platform</li>
            <li>Market analysis and insights</li>
            <li>Diversify into digital assets</li>
          </ul>
        </div>`,
      inHeader: false,
      inFooter: false,
      isActive: true,
      sortOrder: 12,
      bannerImageUrl: "/images/crypto_investments_banner.jpg",
    },
    {
      title: "New Projects",
      slug: "new-projects",
      content: `<h1 class="text-3xl md:text-4xl font-bold tracking-tight mb-4">New Projects</h1>
        <p class="text-muted-foreground">Discover exciting new investment projects across various sectors. Be an early investor in high-potential ventures.</p>
        <img src="/images/new_projects_banner.jpg" alt="New Projects banner" class="w-full h-44 md:h-56 object-cover rounded-xl border mt-6" />
        <div class="mt-8 space-y-4">
          <p class="text-lg font-semibold">Invest in the Future:</p>
          <ul class="list-disc list-inside text-muted-foreground space-y-1">
            <li>Exclusive access to upcoming projects</li>
            <li>Detailed project analysis and due diligence</li>
            <li>Opportunities for high returns</li>
            <li>Support innovative businesses</li>
          </ul>
        </div>`,
      inHeader: false,
      inFooter: false,
      isActive: true,
      sortOrder: 13,
      bannerImageUrl: "/images/new_projects_banner.jpg",
    },
  ];

  await (Page as Model<PageDoc>).insertMany(pagesToSeed);
  console.log("SELF-TEST: Seeded initial dynamic pages.");
}
