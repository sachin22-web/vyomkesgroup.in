/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

// Investment Plans (from server/models/Plan.ts)
export interface InvestmentPlan {
  _id: string;
  title: string;
  startMonth: number;
  endMonth: number;
  annualReturnPercent: number;
  minInvestment: number;
  isActive: boolean;
  sortOrder: number;
}

// Plans Rule (from server/models/PlanRule.ts)
export interface PlanBand {
  fromMonth: number;
  toMonth: number;
  monthlyRate: number; // 0.04 => 4%
}

export interface PlanRule {
  _id: string;
  name: string;
  minAmount: number;
  specialMin: number;
  bands: PlanBand[];
  specialRate: number;
  adminCharge: number;
  booster: number;
  active: boolean;
  version: number;
  effectiveFrom: string;
}

// Payout simulation
export interface PayoutSimulateRequest {
  amount: number;
  month: number;
  boosterApplied?: boolean;
}

export interface PayoutSimulateResponse {
  principal: number;
  month: number;
  grossMonthly: number;
  adminCharge: number;
  booster: number;
  netPayout: number;
  rates: { adminCharge: number; booster: number };
}

// Withdrawal (from server/models/Finance.ts)
export interface Withdrawal {
  _id: string;
  userId: string;
  userName?: string; // Added for admin view
  userEmail?: string; // Added for admin view
  userPhone?: string; // Added for admin view
  amount: number; // Requested amount
  source: "earnings" | "referral";
  charges: number;
  tds: number;
  netAmount: number; // Amount after charges and TDS
  status: "requested" | "under_admin_review" | "approved" | "paid" | "rejected" | "failed";
  reason?: string;
  paidAt?: string;
  rrn?: string;
  gateway?: string;
  createdAt: string;
}

// User Wallet (from server/models/User.ts)
export interface UserWallet {
  balance: number;
  locked: number;
  available: number; // Derived field
}

// Payout (from server/models/Finance.ts) - Updated to include 'pending' and 'reprocessing'
export interface Payout {
  _id: string;
  monthNo: number;
  dueDate: string;
  amount: number;
  status: "scheduled" | "processing" | "paid" | "failed" | "reprocessing" | "on_hold" | "pending"; // Added 'pending' and 'reprocessing'
  paidAt?: string;
}